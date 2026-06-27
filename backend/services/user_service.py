import json
import os
from passlib.context import CryptContext

USERS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "users.json")

# Thiết lập cấu hình băm mật khẩu bằng bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def _load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    with open(USERS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def _save_users(users):
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=4)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user_by_email(email: str):
    users = _load_users()
    return users.get(email)

def create_user(email: str, password: str, name: str):
    users = _load_users()
    if email in users:
        return False
    
    users[email] = {
        "email": email,
        "name": name,
        "hashed_password": get_password_hash(password)
    }
    _save_users(users)
    return True
