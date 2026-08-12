import os
from dotenv import load_dotenv

load_dotenv()

_groq_client = None


def get_groq():
    global _groq_client
    if _groq_client is None and os.getenv("GROQ_API_KEY"):
        try:
            from groq import Groq
            _groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        except Exception as e:
            print(f"[Groq] Init failed: {e}")
    return _groq_client


def groq_chat(messages: list, model: str = "llama3-8b-8192") -> str:
    """Call Groq chat completion API."""
    client = get_groq()
    if not client:
        return ""
    try:
        response = client.chat.completions.create(model=model, messages=messages, max_tokens=2048)
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"[Groq] Chat failed: {e}")
        return ""
