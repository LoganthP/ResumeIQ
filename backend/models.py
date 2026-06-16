from pydantic import BaseModel, Field
from typing import List

class Suggestion(BaseModel):
    section: str = Field(..., description="The section of the resume (e.g., 'Experience', 'Education', 'Skills')")
    issue: str = Field(..., description="The issue found in this section")
    fix: str = Field(..., description="Actionable advice on how to fix the issue")

class AnalysisResponse(BaseModel):
    match_score: int = Field(..., ge=0, le=100, description="Match score between 0 and 100")
    strengths: List[str] = Field(..., description="List of strengths in the resume")
    gaps: List[str] = Field(..., description="List of gaps or missing qualifications")
    keywords_found: List[str] = Field(..., description="Important keywords found in the resume matching the job description")
    keywords_missing: List[str] = Field(..., description="Important keywords missing from the resume")
    suggestions: List[Suggestion] = Field(..., description="Specific suggestions for improvement")
    improved_resume: str = Field(..., description="A rewritten, improved version of the resume")
