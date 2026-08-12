import cv2
import numpy as np
from utils.image_utils import decode_image, preprocess_for_ocr

try:
    import pytesseract
    _tesseract_available = True
except ImportError:
    _tesseract_available = False


def extract_text(image_b64: str) -> str:
    """Extract text from a base64-encoded image using Tesseract OCR."""
    image = decode_image(image_b64)
    processed = preprocess_for_ocr(image)

    if _tesseract_available:
        try:
            text = pytesseract.image_to_string(processed, config="--psm 6")
            return text.strip() or "No text detected"
        except Exception as e:
            print(f"[OCR] Tesseract error: {e}")

    # Fallback: return demo text
    return "GEHU — IntelliBoard 360\nSample OCR Text\n(Install Tesseract for real OCR)"
