import os
import json
from services.document_service import apply_node_replacements
import shutil

def test_apply():
    src = os.path.abspath(r"templates\mau_giao_an_chuan.docx")
    dst = os.path.abspath(r"temp\test_apply.docx")
    shutil.copy2(src, dst)
    
    reps = {
        "p_8": "Kiến thức 123",
        "p_15": "Mục tiêu HĐ 1 là ABC"
    }
    
    apply_node_replacements(dst, reps)
    print("Done. Check temp/test_apply.docx")

if __name__ == "__main__":
    test_apply()
