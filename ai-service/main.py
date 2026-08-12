import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import ocr, gesture, face_recognition, quiz_gen, summarize, diagram, equation, mindmap, translate, tts

app = FastAPI(
    title="IntelliBoard 360 AI Engine",
    description="AI/ML backend for OCR, gesture control, face recognition, quiz generation, and more.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers under /ai prefix
app.include_router(ocr.router, prefix="/ai", tags=["OCR"])
app.include_router(gesture.router, prefix="/ai", tags=["Gesture"])
app.include_router(face_recognition.router, prefix="/ai", tags=["Face Recognition"])
app.include_router(quiz_gen.router, prefix="/ai", tags=["Quiz Generation"])
app.include_router(summarize.router, prefix="/ai", tags=["Summarize"])
app.include_router(diagram.router, prefix="/ai", tags=["Diagram"])
app.include_router(equation.router, prefix="/ai", tags=["Equation"])
app.include_router(mindmap.router, prefix="/ai", tags=["Mind Map"])
app.include_router(translate.router, prefix="/ai", tags=["Translate"])
app.include_router(tts.router, prefix="/ai", tags=["TTS"])


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "IntelliBoard 360 AI Engine",
        "gemini_available": bool(os.getenv("GEMINI_API_KEY")),
        "groq_available": bool(os.getenv("GROQ_API_KEY")),
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
