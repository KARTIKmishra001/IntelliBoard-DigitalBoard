from fastapi import APIRouter
from models.schemas import GestureRequest
from services.gesture_service import detect_gesture

router = APIRouter()

@router.post("/gesture")
def gesture(payload: GestureRequest):
    result = detect_gesture(payload.image_base64)
    return result
