import json
from fastapi import APIRouter
from models.schemas import MindMapRequest
from services.gemini_service import gemini_generate

router = APIRouter()

DEMO_MINDMAP = {
    "id": "root",
    "label": "IntelliBoard 360",
    "children": [
        {"id": "n0", "label": "AI Features", "children": [
            {"id": "n0a", "label": "OCR", "children": []},
            {"id": "n0b", "label": "Gesture", "children": []},
        ]},
        {"id": "n1", "label": "Whiteboard", "children": [
            {"id": "n1a", "label": "Drawing Tools", "children": []},
            {"id": "n1b", "label": "Collaboration", "children": []},
        ]},
        {"id": "n2", "label": "Learning", "children": [
            {"id": "n2a", "label": "Assignments", "children": []},
            {"id": "n2b", "label": "Tests & Quizzes", "children": []},
        ]},
        {"id": "n3", "label": "Attendance", "children": []},
        {"id": "n4", "label": "Archive", "children": []},
    ],
}

@router.post("/mindmap")
def mind_map(payload: MindMapRequest):
    text = payload.summary.strip()
    if not text:
        return DEMO_MINDMAP

    prompt = f"""Generate a hierarchical mind map JSON for this topic/text:

"{text}"

Return ONLY valid JSON in this exact format (no markdown):
{{"id":"root","label":"Main Topic","children":[{{"id":"n0","label":"Branch 1","children":[{{"id":"n0a","label":"Sub-branch","children":[]}}]}},{{"id":"n1","label":"Branch 2","children":[]}}]}}

Create 4-6 main branches, each with 1-3 sub-branches where relevant."""
    raw = gemini_generate(prompt)
    if raw:
        clean = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            data = json.loads(clean)
            if "id" in data and "label" in data:
                return data
        except Exception:
            pass

    # Fallback: build from text chunks
    chunks = [s.strip() for s in text.replace(",", ".").split(".") if s.strip()][:6]
    root = {"id": "root", "label": chunks[0][:30] if chunks else "Main Idea", "children": []}
    for i, chunk in enumerate(chunks[1:]):
        root["children"].append({"id": f"n{i}", "label": chunk[:30], "children": []})
    return root if root["children"] else DEMO_MINDMAP
