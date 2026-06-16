import os
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from models import AnalysisResponse
from parser import extract_text_from_pdf
from analyzer import analyze_resume

app = FastAPI(title="AI Resume Analyzer API")

# Setup CORS
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_resume_endpoint(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    model: str = Form(None)
):
    # Validate file type
    if not resume.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Read file bytes
    try:
        file_bytes = await resume.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read the uploaded file.")
    
    # Validate file size (e.g., > 5MB)
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
        
    if not job_description or not job_description.strip():
        raise HTTPException(status_code=422, detail="Job description cannot be empty.")
        
    try:
        # Extract text from PDF
        resume_text = extract_text_from_pdf(file_bytes)
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF. It might be empty or scanned.")
            
        # Analyze with AI
        analysis_result = analyze_resume(resume_text, job_description, model)
        
        return analysis_result
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during analysis.")
