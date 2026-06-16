import io
from pypdf import PdfReader
import re

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts plain text from a PDF file provided as bytes using pypdf.
    Handles multi-page PDFs and strips excessive whitespace.
    """
    text_content = []
    
    # Open the PDF from bytes
    reader = PdfReader(io.BytesIO(file_bytes))
    
    for page in reader.pages:
        text = page.extract_text()
        if text:
            text_content.append(text)
            
    # Combine text from all pages
    full_text = "\n".join(text_content)
    
    # Clean up excessive whitespace
    # Replace multiple spaces with a single space
    full_text = re.sub(r' +', ' ', full_text)
    # Replace multiple newlines with a single newline
    full_text = re.sub(r'\n+', '\n', full_text)
    
    return full_text.strip()
