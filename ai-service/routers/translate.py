from fastapi import APIRouter, HTTPException
from models.schemas import TranslateRequest
from services.gemini_service import gemini_generate

router = APIRouter()

LANGUAGE_NAMES = {
    "fr": "French", "hi": "Hindi", "es": "Spanish", "de": "German",
    "zh": "Chinese", "ja": "Japanese", "ar": "Arabic", "pt": "Portuguese",
    "ru": "Russian", "ko": "Korean",
}

DEMO_TRANSLATIONS = {
    "fr": "Bonjour, comment puis-je vous aider aujourd'hui ?",
    "hi": "नमस्ते, मैं आज आपकी कैसे मदद कर सकता हूँ?",
    "es": "Hola, ¿cómo puedo ayudarte hoy?",
    "de": "Hallo, wie kann ich Ihnen heute helfen?",
    "zh": "你好，今天我能帮你什么？",
    "ja": "こんにちは、今日はどのようにお手伝いできますか？",
}

@router.post("/translate")
def translate(payload: TranslateRequest):
    text = payload.text.strip()
    target = payload.target_language.lower().strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    if target == "en":
        return {"translated_text": text, "language": "en", "language_name": "English"}

    lang_name = LANGUAGE_NAMES.get(target, target.upper())

    # Try Gemini
    prompt = f"Translate the following text to {lang_name}. Return ONLY the translated text, nothing else:\n\n{text}"
    result = gemini_generate(prompt)
    if result:
        return {"translated_text": result, "language": target, "language_name": lang_name}

    # Demo fallback
    demo = DEMO_TRANSLATIONS.get(target, f"[{target.upper()}] {text}")
    return {"translated_text": demo, "language": target, "language_name": lang_name}
