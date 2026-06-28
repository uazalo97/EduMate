from typing import Optional
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import logging

class GoogleAuthRequest(BaseModel):
    credential: str

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from database import engine, Base
import models

# Tạo tất cả các bảng trong database (nếu chưa có)
Base.metadata.create_all(bind=engine)

from services.document_service import process_template_nodes, apply_node_replacements, edit_document_text_via_ai, edit_document_text_manual
from services.ai_service import generate_lesson_plan_nodes
from services.auth_service import verify_google_token, create_access_token, decode_access_token
from services.user_service import create_user, get_user_by_email, verify_password
from services.template_service import get_user_templates, save_user_template, get_template_path

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    return decode_access_token(token)

load_dotenv()

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

import time
import threading

app = FastAPI(title="Lesson Plan Generator API")

def cleanup_temp_files():
    while True:
        try:
            temp_dir = "temp"
            if os.path.exists(temp_dir):
                now = time.time()
                for filename in os.listdir(temp_dir):
                    filepath = os.path.join(temp_dir, filename)
                    if os.path.isfile(filepath):
                        # Xóa file nếu cũ hơn 24 giờ (86400 giây)
                        if os.stat(filepath).st_mtime < now - 86400:
                            os.remove(filepath)
        except Exception as e:
            logger.error(f"Error in cleanup thread: {e}")
        time.sleep(3600)  # Quét mỗi giờ 1 lần

@app.on_event("startup")
def startup_event():
    thread = threading.Thread(target=cleanup_temp_files, daemon=True)
    thread.start()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate")
async def generate_lesson_plan_api(
    prompt: str = Form(...),
    truong: str = Form(""),
    to_chuyen_mon: str = Form(""),
    giao_vien: str = Form(""),
    lop: str = Form(""),
    mon_hoc: str = Form(""),
    ten_bai_day: str = Form(""),
    so_tiet: str = Form(""),
    template_id: str = Form(None)
):
    """
    Endpoint to handle lesson plan generation.
    - template_id: The ID of the template to use (standard or custom)
    - Prompt describing the topic
    """
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
        
    if not template_id:
        raise HTTPException(status_code=400, detail="Template ID is required")
        
    try:
        try:
            file_path = get_template_path(template_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
            
        logger.info(f"[main] Bắt đầu xử lý với template_id: {template_id}, file path: {file_path}")
        
        # 1. Process the template: Convert to .docx and extract elements
        processed_file_path, elements = process_template_nodes(file_path)
        
        meta_data = {
            "truong": truong,
            "to_chuyen_mon": to_chuyen_mon,
            "giao_vien": giao_vien,
            "lop": lop,
            "mon_hoc": mon_hoc,
            "ten_bai_day": ten_bai_day,
            "so_tiet": so_tiet
        }
        
        # 1.5. Rule-based replacements for administrative information
        rule_replacements = {}
        keys_to_delete = []
        
        mapping = {
            "{{ ten_truong }}": meta_data["truong"],
            "{{ ten_to }}": meta_data["to_chuyen_mon"],
            "{{ ten_giao_vien }}": meta_data["giao_vien"],
            "{{ lop }}": meta_data["lop"],
            "{{ mon_hoc }}": meta_data["mon_hoc"],
            "{{ ten_bai_day }}": meta_data["ten_bai_day"],
            "{{ so_tiet }}": meta_data["so_tiet"]
        }

        for node_id, text in elements.items():
            original_text = text
            for key, val in mapping.items():
                if key in text:
                    text = text.replace(key, val)
            
            if text != original_text:
                rule_replacements[node_id] = text
                # If there are no more {{ }} tags in this node, hide it from AI
                if "{{" not in text:
                    keys_to_delete.append(node_id)
        
        for k in keys_to_delete:
            del elements[k]
            
        logger.info(f"[main] Đã xử lý Rule-base {len(rule_replacements)} nodes. Các ID: {list(rule_replacements.keys())}")
        
        # 2. Call OpenAI API with the REMAINING elements
        ai_replacements = generate_lesson_plan_nodes(prompt, elements, meta_data)
        logger.info(f"[main] Các ID do LLM sinh ra: {list(ai_replacements.keys())}")
        
        # Merge both dictionaries
        replacements_dict = {**rule_replacements, **ai_replacements}
        
        # 3. Create a copy of the processed file for output
        import shutil
        output_file_name = f"generated_{os.path.basename(processed_file_path)}"
        output_file_path = os.path.join(os.path.dirname(processed_file_path), output_file_name)
        shutil.copy2(processed_file_path, output_file_path)
        
        # 4. Apply Node Replacements
        apply_node_replacements(output_file_path, replacements_dict)
        
        # 5. Return the generated file
        return FileResponse(
            path=output_file_path,
            filename=output_file_name,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
        
    except Exception as e:
        logger.error(f"[main] Error during generation: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/edit-document")
async def edit_document_api(
    file: UploadFile = File(...),
    selected_text: str = Form(...),
    paragraph_text: str = Form(...),
    prompt: str = Form(...)
):
    """
    Endpoint to handle inline text editing.
    """
    try:
        temp_dir = "temp"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, f"edit_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        logger.info(f"[main] Nhận yêu cầu sửa văn bản cho file: {file_path}")
        
        edit_document_text_via_ai(file_path, selected_text, paragraph_text, prompt)
        
        return FileResponse(
            path=file_path,
            filename=file.filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        logger.error(f"[main] Error during edit document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/edit-document-manual")
async def edit_document_manual_api(
    file: UploadFile = File(...),
    paragraph_text: str = Form(...),
    new_paragraph_text: str = Form(...)
):
    """
    Endpoint to handle inline text editing manually.
    """
    try:
        temp_dir = "temp"
        os.makedirs(temp_dir, exist_ok=True)
        file_path = os.path.join(temp_dir, f"edit_manual_{file.filename}")
        
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
            
        logger.info(f"[main] Nhận yêu cầu sửa văn bản thủ công cho file: {file_path}")
        
        edit_document_text_manual(file_path, paragraph_text, new_paragraph_text)
        
        return FileResponse(
            path=file_path,
            filename=file.filename,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        logger.error(f"[main] Error during manual edit document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/google")
async def auth_google(request: GoogleAuthRequest):
    """
    Nhận credential từ Frontend, xác thực với Google và trả về JWT + User Info
    """
    user_info = verify_google_token(request.credential)
    
    # Sinh JWT token cho phiên làm việc
    access_token = create_access_token(data={"sub": user_info["sub"], "email": user_info["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    success = create_user(request.email, request.password, request.name)
    if not success:
        raise HTTPException(status_code=400, detail="Email này đã được đăng ký.")
    return {"message": "Đăng ký thành công"}

@app.get("/api/templates")
async def get_templates(current_user: dict = Depends(get_current_user)):
    user_email = current_user.get("email")
    user_templates = get_user_templates(user_email)
    
    system_templates = [
        {
            "id": "standard",
            "name": "Khung Kế hoạch Bài dạy (Công văn 5512)",
            "type": "system",
            "tags": ["Mẫu chung", "Chuẩn Bộ GD"]
        }
    ]
    
    return {
        "system": system_templates,
        "user": user_templates
    }

@app.post("/api/templates/upload")
async def upload_template(
    file: UploadFile = File(...),
    custom_name: str = Form(None),
    current_user: dict = Depends(get_current_user)
):
    user_email = current_user.get("email")
    try:
        new_template = await save_user_template(user_email, file, custom_name)
        return {"message": "Upload successful", "template": new_template}
    except Exception as e:
        logger.error(f"[main] Error uploading template: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/templates/{template_id}/download")
async def download_template(template_id: str, current_user: dict = Depends(get_current_user)):
    file_path = get_template_path(template_id, is_preview=True)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")
    
    return FileResponse(
        path=file_path,
        filename=f"template_{template_id}.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")
    
    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")
    
    user_info = {
        "email": user["email"],
        "name": user["name"],
        "picture": ""
    }
    access_token = create_access_token(data={"sub": user["email"], "email": user["email"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }
