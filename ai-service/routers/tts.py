import io as io_module
import base64
from fastapi import APIRouter
from models.schemas import TTSRequest

router = APIRouter()

@router.post("/tts")
def text_to_speech(payload: TTSRequest):
    text = payload.text.strip()
    if not text:
        return {"audio_base64": "", "error": "Text required"}
    try:
        from gtts import gTTS
        buf = io_module.BytesIO()
        gTTS(text=text, lang=payload.language or "en").write_to_fp(buf)
        encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
        return {"audio_base64": encoded, "language": payload.language}
    except Exception as e:
        return {"audio_base64": "", "error": f"TTS failed: {e}"}
