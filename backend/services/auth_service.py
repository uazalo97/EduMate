import os
import logging
from fastapi import HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests
import jwt
import datetime

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_secret_key_if_missing")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_google_token(token: str) -> dict:
    """
    Xác minh Google JWT credential và trả về thông tin user.
    """
    try:
        # Xác minh token với Google
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # Kiểm tra issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        return {
            "email": idinfo.get("email"),
            "name": idinfo.get("name"),
            "picture": idinfo.get("picture"),
            "sub": idinfo.get("sub") # Google User ID
        }
    except ValueError as e:
        logger.error(f"[auth_service] Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

def create_access_token(data: dict) -> str:
    """
    Tạo Custom JWT để frontend lưu phiên đăng nhập.
    """
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
