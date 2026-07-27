"""FileForge — User model."""
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserDocument(BaseModel):
    """MongoDB user document."""
    user_id: str = Field(default_factory=lambda: __import__("uuid").uuid4().hex)
    email: str
    name: str
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

    def to_mongo_dict(self) -> dict:
        return self.model_dump()


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str


class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    created_at: datetime
    storage_tier: str = "authenticated"
    expiry_minutes: int = 1440
