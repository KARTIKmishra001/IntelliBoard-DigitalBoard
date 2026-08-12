import os
from dotenv import load_dotenv

load_dotenv()

_gemini_client = None
_groq_client = None


def get_gemini():
    global _gemini_client
    if _gemini_client is None and os.getenv("GEMINI_API_KEY"):
        try:
            import google.generativeai as genai
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            _gemini_client = genai.GenerativeModel("gemini-1.5-flash")
        except Exception as e:
            print(f"[Gemini] Init failed: {e}")
    return _gemini_client


def gemini_generate(prompt: str) -> str:
    """Call Gemini API and return text response, or empty string on failure."""
    client = get_gemini()
    if not client:
        return ""
    try:
        response = client.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"[Gemini] Generation failed: {e}")
        return ""
