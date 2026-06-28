import json
import os
from passlib.context import CryptContext

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.json")

# Thiết lập cấu hình băm mật khẩu bằng bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from passlib.context import CryptContext
from database import SessionLocal
from models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(email: str):
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        if user:
            return {
                "email": user.email,
                "name": user.name,
                "hashed_password": user.hashed_password
            }
        return None

def create_user(email: str, password: str, name: str):
    with SessionLocal() as db:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            return False
        
        new_user = User(
            email=email,
            name=name,
            hashed_password=get_password_hash(password)
        )
        db.add(new_user)
        db.commit()
        return True
