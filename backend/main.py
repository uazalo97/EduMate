from typing import Optional
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import logging

class GoogleAuthRequest(BaseModel):
    credential: str

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

from services.document_service import process_template_nodes, apply_node_replacements, edit_document_text_via_ai
from services.ai_service import generate_lesson_plan_nodes
from services.auth_service import verify_google_token, create_access_token
from services.user_service import create_user, get_user_by_email, verify_password

load_dotenv()

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

app = FastAPI(title="Lesson Plan Generator API")

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
    ten_bai_day: str = Form(""),
    so_tiet: str = Form(""),
    use_standard_template: str = Form("false"),
    template_file: Optional[UploadFile] = File(None)
):
    """
    Endpoint to handle lesson plan generation.
    - Upload template (.doc or .docx)
    - Prompt describing the topic
    """
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
        
    try:
        if use_standard_template.lower() == "true":
            file_path = os.path.abspath(os.path.join("templates", "mau_giao_an_chuan.docx"))
            if not os.path.exists(file_path):
                raise HTTPException(status_code=500, detail="Standard template not found on server.")
            logger.info(f"[main] Sử dụng mẫu chuẩn: {file_path}")
            temp_dir = "temp"
            os.makedirs(temp_dir, exist_ok=True)
        else:
            if not template_file:
                raise HTTPException(status_code=400, detail="Vui lòng tải lên file mẫu hoặc chọn sử dụng mẫu chuẩn.")
            # Save uploaded file temporarily
            temp_dir = "temp"
            os.makedirs(temp_dir, exist_ok=True)
            file_path = os.path.join(temp_dir, template_file.filename)
            
            with open(file_path, "wb") as buffer:
                buffer.write(await template_file.read())
            logger.info(f"[main] Sử dụng mẫu tải lên: {file_path}")
            
        # 1. Process the template: Convert to .docx and extract elements
        processed_file_path, elements = process_template_nodes(file_path)
        
        meta_data = {
            "truong": truong,
            "to_chuyen_mon": to_chuyen_mon,
            "giao_vien": giao_vien,
            "lop": lop,
            "ten_bai_day": ten_bai_day,
            "so_tiet": so_tiet
        }
        
        # 2. Call OpenAI API
        replacements_dict = generate_lesson_plan_nodes(prompt, elements, meta_data)
        
        logger.info(f"[main] Các ID cần thay thế do LLM sinh ra: {list(replacements_dict.keys())}")
        
        # 3. Create a copy of the processed file for output
        import shutil
        output_file_name = f"generated_{os.path.basename(processed_file_path)}"
        output_file_path = os.path.join(temp_dir, output_file_name)
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
