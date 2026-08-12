import cv2
import numpy as np
from utils.image_utils import decode_image

_mp_hands = None
_hands = None


def _init_mediapipe():
    global _mp_hands, _hands
    if _mp_hands is None:
        try:
            import mediapipe as mp
            _mp_hands = mp.solutions.hands
            _hands = _mp_hands.Hands(
                max_num_hands=1,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.5,
            )
        except Exception as e:
            print(f"[Gesture] MediaPipe init failed: {e}")


def detect_gesture(image_b64: str) -> dict:
    """Process a frame and return gesture type + landmark positions."""
    _init_mediapipe()
    image = decode_image(image_b64)
    rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    if _hands is None:
        return {"gesture_type": "NONE", "landmarks": [], "fingertip": None}

    results = _hands.process(rgb)

    if not results.multi_hand_landmarks:
        return {"gesture_type": "NONE", "landmarks": [], "fingertip": None}

    hand = results.multi_hand_landmarks[0]
    h, w = image.shape[:2]

    # Extract landmark coords as normalized [0,1]
    lm = [(l.x, l.y, l.z) for l in hand.landmark]

    # Finger tip & PIP joint indices
    tip_ids = [4, 8, 12, 16, 20]  # thumb, index, middle, ring, pinky
    pip_ids = [3, 6, 10, 14, 18]

    fingers = []
    # Thumb: compare x (left hand)
    fingers.append(1 if lm[tip_ids[0]][0] > lm[pip_ids[0]][0] else 0)
    # Other fingers: compare y (lower y = higher on screen = extended)
    for i in range(1, 5):
        fingers.append(1 if lm[tip_ids[i]][1] < lm[pip_ids[i]][1] else 0)

    total_up = sum(fingers)

    # Detect pinch (thumb-index distance)
    thumb_tip = np.array([lm[4][0] * w, lm[4][1] * h])
    index_tip = np.array([lm[8][0] * w, lm[8][1] * h])
    pinch_dist = float(np.linalg.norm(thumb_tip - index_tip))

    if pinch_dist < 40:
        gesture_type = "SELECT"
    elif fingers == [0, 1, 0, 0, 0]:
        gesture_type = "DRAW"
    elif fingers == [0, 1, 1, 0, 0]:
        gesture_type = "MOVE"
    elif total_up == 5:
        gesture_type = "ERASE"
    elif total_up == 0:
        gesture_type = "CLEAR"
    else:
        gesture_type = "NONE"

    # Fingertip position normalized
    fingertip = {"x": lm[8][0], "y": lm[8][1]}

    landmarks_out = [{"x": l[0], "y": l[1]} for l in lm]

    return {
        "gesture_type": gesture_type,
        "landmarks": landmarks_out,
        "fingertip": fingertip,
        "fingers_up": fingers,
    }
