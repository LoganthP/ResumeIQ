import os
import json
import httpx
from fastapi import HTTPException
from openai import OpenAI

def get_openrouter_client() -> OpenAI:
    """
    OpenRouter is OpenAI-API-compatible.
    We use the openai SDK pointed at OpenRouter's base URL.
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not set in environment variables."
        )

    return OpenAI(
        api_key=api_key,
        base_url=base_url,
        default_headers={
            "HTTP-Referer": os.getenv("APP_SITE_URL", "http://localhost:5173"),
            "X-Title": os.getenv("APP_SITE_NAME", "ResumeIQ"),
        }
    )


SYSTEM_PROMPT = """
You are a senior technical recruiter and resume coach with 15 years of experience 
across software engineering, product, and data roles. You have deep knowledge of 
ATS (Applicant Tracking Systems) and what makes a resume rank highly.

Your job is to analyze a candidate's resume against a specific job description 
and return a structured evaluation.

You MUST respond with ONLY a valid JSON object. No markdown, no code fences, 
no preamble, no explanation. The JSON must exactly match this schema:

{
  "match_score": <integer 0-100>,
  "strengths": [<string>, ...],
  "gaps": [<string>, ...],
  "keywords_found": [<string>, ...],
  "keywords_missing": [<string>, ...],
  "suggestions": [
    {
      "section": <string>,
      "issue": <string>,
      "fix": <string>
    },
    ...
  ],
  "improved_resume": <string — the full rewritten resume as plain text>
}

Rules:
- match_score: holistic ATS + human-review score. Be honest, not generous.
- strengths: 3–6 specific things the resume does well for THIS role.
- gaps: 3–6 specific missing skills, experiences, or signals for THIS role.
- keywords_found: exact keywords/phrases from the JD that appear in the resume.
- keywords_missing: important keywords/phrases from the JD absent from the resume.
- suggestions: 4–8 actionable items. Each must name the resume section, 
  describe the specific issue, and give a concrete rewrite fix.
- improved_resume: a complete rewritten version of the resume incorporating 
  all fixes. Preserve the candidate's real experience — do not fabricate. 
  Use strong action verbs, quantify where possible, and add missing keywords 
  naturally. Format as plain text with ALL CAPS section headers.
"""


def build_user_prompt(resume_text: str, job_description: str) -> str:
    return f"""RESUME:
{resume_text}

---

JOB DESCRIPTION:
{job_description}

---

Analyze the resume against the job description and return the JSON evaluation."""


def analyze_resume(resume_text: str, job_description: str, model_override: str = None) -> dict:
    """
    Calls OpenRouter with the resume and job description.
    Returns a validated dict matching the AnalysisResult schema.
    Raises HTTPException on API errors or JSON parse failures.
    """
    client = get_openrouter_client()
    model = model_override or os.getenv("OPENROUTER_MODEL", "google/gemini-2.5-flash")

    try:
        response = client.chat.completions.create(
            model=model,
            max_tokens=4096,
            temperature=0.3,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(resume_text, job_description)}
            ]
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter API call failed: {str(e)}"
        )

    # Extract raw text from response
    raw = response.choices[0].message.content
    if not raw:
        raise HTTPException(
            status_code=502,
            detail="OpenRouter returned an empty response."
        )

    # Strip markdown code fences if the model wraps JSON anyway
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json or ```) and last line (```)
        cleaned = "\n".join(lines[1:-1]).strip()

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse JSON from model response: {str(e)}. Raw: {cleaned[:300]}"
        )

    # Validate required keys are present
    required_keys = {
        "match_score", "strengths", "gaps",
        "keywords_found", "keywords_missing",
        "suggestions", "improved_resume"
    }
    missing_keys = required_keys - set(result.keys())
    if missing_keys:
        raise HTTPException(
            status_code=502,
            detail=f"Model response missing required fields: {missing_keys}"
        )

    # Coerce match_score to int in case model returns float
    result["match_score"] = int(result["match_score"])

    return result
