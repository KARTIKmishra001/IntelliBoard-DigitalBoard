import cv2
from fastapi import APIRouter
from models.schemas import ImageRequest
from utils.image_utils import decode_image
from services.gemini_service import gemini_generate

router = APIRouter()

@router.post("/diagram")
def diagram(payload: ImageRequest):
    image = decode_image(payload.image_base64)
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    shapes = []
    for c in contours[:20]:
        area = cv2.contourArea(c)
        if area < 400:
            continue
        approx = cv2.approxPolyDP(c, 0.03 * cv2.arcLength(c, True), True)
        x, y, w, h = cv2.boundingRect(approx)
        n = len(approx)
        if n <= 2:
            shape_type = "line"
        elif n == 3:
            shape_type = "triangle"
        elif n == 4:
            aspect = w / h if h > 0 else 1
            shape_type = "square" if 0.9 <= aspect <= 1.1 else "rectangle"
        else:
            shape_type = "circle"
        shapes.append({"type": shape_type, "x": int(x), "y": int(y), "w": int(w), "h": int(h)})

    if not shapes:
        shapes = [{"type": "circle", "x": 150, "y": 100, "w": 200, "h": 200}]

    # Get Gemini description if available
    description = ""
    if shapes:
        shape_desc = ", ".join([f"{s['type']} at ({s['x']},{s['y']})" for s in shapes[:5]])
        prompt = f"Briefly describe this diagram structure containing: {shape_desc}"
        description = gemini_generate(prompt) or "Diagram contains geometric shapes."

    return {"shapes": shapes, "description": description}
