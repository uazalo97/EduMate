import os
import uuid
import datetime
from fastapi import UploadFile
from database import SessionLocal
from models import Template

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
USER_TEMPLATES_DIR = os.path.join(DATA_DIR, "user_templates")

os.makedirs(USER_TEMPLATES_DIR, exist_ok=True)

def get_user_templates(email: str):
    with SessionLocal() as db:
        templates = db.query(Template).filter(Template.user_email == email).all()
        return [
            {
                "id": t.id,
                "name": t.name,
                "original_filename": t.original_filename,
                "user_email": t.user_email,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "type": t.type
            }
            for t in templates
        ]

async def save_user_template(email: str, file: UploadFile, custom_name: str = None):
    template_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    saved_filename = f"{template_id}{file_extension}"
    file_path = os.path.join(USER_TEMPLATES_DIR, saved_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    display_name = custom_name if custom_name else file.filename
    
    with SessionLocal() as db:
        new_template = Template(
            id=template_id,
            name=display_name,
            original_filename=file.filename,
            user_email=email,
            file_path=file_path,
            type="custom"
        )
        db.add(new_template)
        db.commit()
        db.refresh(new_template)
        
        return {
            "id": new_template.id,
            "name": new_template.name,
            "original_filename": new_template.original_filename,
            "user_email": new_template.user_email,
            "created_at": new_template.created_at.isoformat() if new_template.created_at else None,
            "type": new_template.type
        }

def get_template_path(template_id: str, is_preview: bool = False) -> str:
    if template_id == "standard":
        if is_preview:
            return os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "mau_giao_an_chuan_preview.docx")
        return os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "mau_giao_an_chuan.docx")
        
    with SessionLocal() as db:
        t = db.query(Template).filter(Template.id == template_id).first()
        if not t:
            raise Exception("Template not found")
        return t.file_path
