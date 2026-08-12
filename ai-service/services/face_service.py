import cv2
import numpy as np
from utils.image_utils import decode_image


def recognize_face(image_b64: str, known_faces: list = None) -> dict:
    """Detect face in frame using OpenCV Haar cascade."""
    image = decode_image(image_b64)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(cascade_path)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    if len(faces) == 0:
        return {"present": False, "faces_detected": 0, "matched_user": None, "match_score": 0.0, "message": "No face detected"}

    x, y, w, h = faces[0]
    roi = gray[y:y+h, x:x+w]
    roi_hist = cv2.calcHist([roi], [0], None, [256], [0, 256])
    cv2.normalize(roi_hist, roi_hist)

    best_match = None
    best_score = 0.0

    if known_faces:
        for kf in known_faces:
            try:
                raw = np.frombuffer(__import__('base64').b64decode(kf["encoding"]), np.uint8)
                sample = cv2.imdecode(raw, cv2.IMREAD_GRAYSCALE)
                if sample is None:
                    continue
                sample_hist = cv2.calcHist([sample], [0], None, [256], [0, 256])
                cv2.normalize(sample_hist, sample_hist)
                score = cv2.compareHist(roi_hist, sample_hist, cv2.HISTCMP_CORREL)
                if score > best_score:
                    best_score = score
                    best_match = kf.get("student_id") or kf.get("name")
            except Exception:
                continue

    return {
        "present": True,
        "faces_detected": int(len(faces)),
        "matched_user": best_match if best_score > 0.6 else None,
        "match_score": float(round(best_score, 3)),
        "confidence": float(round(best_score, 3)),
        "bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
        "message": f"Face detected. Match: {best_match}" if best_match else "Face detected (unknown)",
    }
