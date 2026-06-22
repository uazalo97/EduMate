import os
import json
from services.ai_service import generate_lesson_plan_nodes
from services.document_service import apply_node_replacements
import shutil
from dotenv import load_dotenv

load_dotenv()

def test_full_pipeline():
    with open("elements_dump.json", "r", encoding="utf-8") as f:
        elements = json.load(f)
        
    prompt = "Tạo giáo án cho bài 'Lực ma sát', môn Vật Lý lớp 10"
    meta_data = {
        "truong": "THPT ABC",
        "to_chuyen_mon": "Vật Lý",
        "giao_vien": "Nguyễn Văn A",
        "lop": "10A1",
        "ten_bai_day": "Lực ma sát",
        "so_tiet": "1"
    }
    
    print("Calling OpenAI...")
    try:
        res = generate_lesson_plan_nodes(prompt, elements, meta_data)
        
        src = os.path.abspath(r"templates\mau_giao_an_chuan.docx")
        dst = os.path.abspath(r"temp\test_full.docx")
        shutil.copy2(src, dst)
        
        apply_node_replacements(dst, res)
        print("Success! Check temp/test_full.docx")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_full_pipeline()
