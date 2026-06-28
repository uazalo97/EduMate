from sqlalchemy import Column, String, DateTime
from database import Base
import uuid
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True)
    name = Column(String)
    hashed_password = Column(String)

class Template(Base):
    __tablename__ = "templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String)
    original_filename = Column(String)
    user_email = Column(String, index=True)
    file_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    type = Column(String)
