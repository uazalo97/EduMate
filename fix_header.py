import os
from docx import Document

def fix_doc(path):
    doc = Document(path)
    changed = False
    for section in doc.sections:
        for para in section.header.paragraphs:
            if "3" in para.text:
                para.text = para.text.replace("3", "")
                changed = True
    if changed:
        doc.save(path)
        print(f"Fixed header in {path}")

base_dir = os.path.dirname(os.path.abspath(__file__))
fix_doc(os.path.join(base_dir, "backend", "templates", "mau_giao_an_chuan.docx"))
fix_doc(os.path.join(base_dir, "backend", "templates", "mau_giao_an_chuan_preview.docx"))
