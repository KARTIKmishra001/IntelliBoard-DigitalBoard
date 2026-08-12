from fastapi import APIRouter
from models.schemas import TextRequest
from services.gemini_service import gemini_generate

router = APIRouter()

DEMO_SUMMARY = (
    "This project presents an intelligent digital whiteboard system integrating "
    "computer vision, OCR, and gesture-based interaction. Built with OpenCV, MediaPipe, "
    "and Python FastAPI, it detects hand movements for drawing and erasing, recognizes "
    "shapes, and extracts text in real time. The system demonstrates practical AI and "
    "image processing for smart digital learning and collaboration."
)

@router.post("/summarize")
def summarize(payload: TextRequest):
    text = payload.text.strip()
    if not text:
        return {"summary": DEMO_SUMMARY}

    prompt = f"""Summarize the following text in 3-5 concise bullet points. Be clear and informative:

{text}

Return only the summary, no preamble."""
    result = gemini_generate(prompt)
    if result:
        return {"summary": result}

    # Fallback: first 2 sentences
    sentences = text.split(". ")
    fallback = ". ".join(sentences[:2]) + ("." if len(sentences) > 1 else "")
    return {"summary": fallback or DEMO_SUMMARY}
