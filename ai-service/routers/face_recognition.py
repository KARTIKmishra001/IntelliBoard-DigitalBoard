from fastapi import APIRouter
from models.schemas import ImageRequest, FaceRegisterRequest
from services.face_service import recognize_face

router = APIRouter()

@router.post("/face/recognize")
def face_recognize(payload: ImageRequest):
    result = recognize_face(payload.image_base64)
    return result

@router.post("/face/register")
def face_register(payload: FaceRegisterRequest):
    # Store face encodings (base64 of first image) keyed by student_id
    # In production, save to DB; here we return the encoding for Node to store
    import base64
    if not payload.images:
        return {"success": False, "message": "No images provided"}
    # Use first image as the reference encoding
    encoding = payload.images[0].split(",")[-1]
    return {
        "success": True,
        "student_id": payload.student_id,
        "name": payload.name,
        "encoding": encoding,
        "message": f"Face registered for {payload.name}",
    }
