import base64
import numpy as np
import cv2
from fastapi import HTTPException


def decode_image(img_b64: str) -> np.ndarray:
    """Decode a base64 image string to an OpenCV numpy array."""
    try:
        raw = base64.b64decode(img_b64.split(",")[-1])
        image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError("Invalid image data")
        # Handle RGBA (4-channel) images from canvas
        if len(image.shape) == 3 and image.shape[2] == 4:
            alpha = image[:, :, 3]
            rgb = image[:, :, :3]
            bg = np.ones_like(rgb, dtype=np.uint8) * 255
            alpha_f = alpha[:, :, np.newaxis] / 255.0
            image = (rgb * alpha_f + bg * (1 - alpha_f)).astype(np.uint8)
        return image
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image: {exc}")


def encode_image(image: np.ndarray, fmt: str = ".png") -> str:
    """Encode an OpenCV image to base64 string."""
    success, buffer = cv2.imencode(fmt, image)
    if not success:
        raise ValueError("Failed to encode image")
    return base64.b64encode(buffer).decode("utf-8")


def preprocess_for_ocr(image: np.ndarray) -> np.ndarray:
    """Preprocess image to improve OCR accuracy."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    # Adaptive threshold for better text detection
    processed = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    # Denoise
    processed = cv2.medianBlur(processed, 1)
    return processed
