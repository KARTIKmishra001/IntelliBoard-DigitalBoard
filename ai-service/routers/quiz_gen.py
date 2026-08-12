import json
from fastapi import APIRouter, HTTPException
from models.schemas import QuizRequest
from services.gemini_service import gemini_generate

router = APIRouter()

# Default 5-question demo quiz
DEMO_QUIZ = [
    {"question": "What does OCR stand for?", "options": ["A) Optical Character Recognition", "B) Online Content Reader", "C) Open Code Runtime", "D) Optical Color Rendering"], "correct": "A", "explanation": "OCR converts images of text into machine-readable text."},
    {"question": "Which Python library is used for gesture detection?", "options": ["A) TensorFlow", "B) PyTorch", "C) MediaPipe", "D) Keras"], "correct": "C", "explanation": "MediaPipe provides real-time hand landmark detection."},
    {"question": "What is the primary use of Socket.io?", "options": ["A) Database queries", "B) Real-time bidirectional communication", "C) File storage", "D) Image processing"], "correct": "B", "explanation": "Socket.io enables real-time event-based communication."},
    {"question": "Which Canvas API method draws a circle?", "options": ["A) drawCircle()", "B) ctx.arc()", "C) ctx.circle()", "D) ctx.ellipse()"], "correct": "B", "explanation": "ctx.arc() draws arcs and circles on HTML5 canvas."},
    {"question": "What does JWT stand for?", "options": ["A) Java Web Token", "B) JSON Web Transfer", "C) JSON Web Token", "D) JavaScript Web Tool"], "correct": "C", "explanation": "JWT is an open standard for securely transmitting information as JSON."},
]

@router.post("/quiz")
def generate_quiz(payload: QuizRequest):
    num = min(max(payload.numQuestions, 1), 10)
    content = payload.content.strip()

    if content:
        prompt = f"""Generate exactly {num} multiple choice questions about: {content}
Return ONLY a valid JSON array, no markdown, no extra text:
[{{"question":"...","options":["A) ...","B) ...","C) ...","D) ..."],"correct":"A","explanation":"..."}}]"""
        raw = gemini_generate(prompt)
        if raw:
            # Strip markdown code fences if present
            clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            try:
                questions = json.loads(clean)
                if isinstance(questions, list) and len(questions) > 0:
                    return {"questions": questions[:num]}
            except (json.JSONDecodeError, Exception):
                pass

    # Fallback to demo quiz
    return {"questions": DEMO_QUIZ[:num]}
