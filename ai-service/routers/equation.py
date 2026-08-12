from fastapi import APIRouter, HTTPException
from models.schemas import SolveRequest
from services.gemini_service import gemini_generate

router = APIRouter()

@router.post("/equation")
def solve_equation(payload: SolveRequest):
    eq = payload.equation.strip()
    if not eq:
        raise HTTPException(status_code=400, detail="Equation is required")

    steps = [f"Input: {eq}"]

    # Try Gemini for step-by-step solution
    prompt = f"""Solve this math equation step by step: {eq}

Format your response as:
Step 1: [action]
Step 2: [action]
...
Answer: [final answer]

Be concise and clear."""
    gemini_result = gemini_generate(prompt)
    if gemini_result:
        return {"equation": eq, "solution": gemini_result, "steps": gemini_result.split("\n")}

    # Fallback: try sympy
    try:
        from sympy import symbols, solve, sympify, Eq
        from sympy.parsing.sympy_parser import parse_expr
        x = symbols("x")
        if "=" in eq:
            left, right = eq.split("=", 1)
            parsed = Eq(parse_expr(left.replace("^", "**")), parse_expr(right.replace("^", "**")))
            steps.append(f"Equation: {parsed}")
            solutions = solve(parsed, x)
            steps.append(f"Solution: x = {solutions}")
        else:
            expr = sympify(eq.replace("^", "**"))
            steps.append(f"Simplified: {expr.simplify()}")
        return {"equation": eq, "solution": "\n".join(steps), "steps": steps}
    except Exception as exc:
        steps.append(f"Could not solve symbolically: {exc}")
        return {"equation": eq, "solution": "\n".join(steps), "steps": steps}
