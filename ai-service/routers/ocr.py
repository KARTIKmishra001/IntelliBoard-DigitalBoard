from fastapi import APIRouter
from models.schemas import ImageRequest
from services.ocr_service import extract_text

router = APIRouter()

@router.post("/ocr")
def ocr(payload: ImageRequest):
    text = extract_text(payload.image_base64)
    return {"text": text}
