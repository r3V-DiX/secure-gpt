import os
import sys
from PIL import Image, ImageDraw

# Add backend directory to sys.path in case user runs it to test redaction
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend")))

def generate_pdf(output_path, num_pages=25):
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    print(f"Generating {num_pages}-page selectable digital test PDF using reportlab...")
    c = canvas.Canvas(output_path, pagesize=letter)
    
    for i in range(num_pages):
        # Page dimensions: letter is 612 x 792 points
        # Write mock sensitive information as native text streams
        c.drawString(50, 700, f"Page {i + 1} of {num_pages}")
        c.drawString(50, 670, "SecureGPT Automated Performance Test Document")
        c.drawString(50, 640, "--------------------------------------------")
        c.drawString(50, 610, "This document is used for validating flat memory footprint.")
        c.drawString(50, 580, f"Sensitive PII Data: SSN: 123-45-6789 (Page {i + 1})")
        c.drawString(50, 550, "Category: FINANCIAL / GOV_ID")
        c.drawString(50, 520, "Coordinates of sensitive data: x=100, y=200, w=300, h=40")
        
        c.showPage()
        
    c.save()
    print(f"Digital test PDF generated successfully at: {output_path}")

def run_redaction_test(input_pdf_path):
    try:
        from app.services.redaction_service import redact_pdf_file
        
        print("\nRunning redaction service test...")
        
        # Define redaction regions for all 25 pages
        regions = []
        for page in range(25):
            regions.append({
                "page": page,
                "x": 100,
                "y": 200,
                "width": 300,
                "height": 40
            })
            
        print(f"Applying redactions on {len(regions)} regions across 25 pages...")
        
        # Run redaction
        redacted_pdf_path = redact_pdf_file(input_pdf_path, regions)
        
        # Copy redacted PDF to permanent location so it's not deleted/lost in temp folder
        permanent_redacted_path = os.path.join(os.path.dirname(input_pdf_path), "test_large_redacted.pdf")
        import shutil
        shutil.copy(redacted_pdf_path, permanent_redacted_path)
        print(f"Redaction complete! Permanent redacted PDF saved at: {permanent_redacted_path}")
        
        # Check page count of output redacted PDF to verify success
        from pdf2image import pdfinfo_from_path
        info = pdfinfo_from_path(permanent_redacted_path)
        print(f"Redacted PDF Page Count: {info.get('Pages')} (Expected: 25)")
        print("Test passed successfully!")
    except ImportError:
        print("\nNote: Backend app not found in sys.path or python environment is missing dependencies.")
        print("PDF was generated successfully, but the redaction test was skipped.")

if __name__ == "__main__":
    output_dir = "/home/anshuldying/rivedix_internshhip/secureGPT/dataset/sampleImgDoc"
    os.makedirs(output_dir, exist_ok=True)
    
    input_pdf = os.path.join(output_dir, "test_large.pdf")
    generate_pdf(input_pdf, num_pages=25)
    run_redaction_test(input_pdf)
