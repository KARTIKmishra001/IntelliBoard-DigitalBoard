from pydantic import BaseModel
from typing import Optional, List, Any


class ImageRequest(BaseModel):
    image_base64: str


class TextRequest(BaseModel):
    text: str


class SolveRequest(BaseModel):
    equation: str


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "fr"


class TTSRequest(BaseModel):
    text: str
    language: str = "en"


class MindMapRequest(BaseModel):
    summary: str


class QuizRequest(BaseModel):
    content: str
    numQuestions: int = 5


class GestureRequest(BaseModel):
    image_base64: str
    timestamp: Optional[float] = None


class FaceRegisterRequest(BaseModel):
    name: str
    student_id: str
    images: List[str]  # list of base64 images


class MindMapNode(BaseModel):
    id: str
    label: str
    children: List[Any] = []


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct: str
    explanation: str = ""
