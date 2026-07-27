"""
FileForge — JWT Auth & Password Hashing
────────────────────────────────────────────────────────────────────
Provides:
  • JWT token creation and verification (python-jose)
  • Password hashing (passlib + bcrypt)
  • FastAPI dependency: get_current_user (optional — returns None for anon)
"""

from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import bcrypt
from app.config.settings import settings

# ── Password hashing ─────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    pwd_bytes = plain.encode("utf-8")[:72]  # Truncate to bcrypt max length
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    pwd_bytes = plain.encode("utf-8")[:72]
    hashed_bytes = hashed.encode("utf-8")
    return bcrypt.checkpw(pwd_bytes, hashed_bytes)

# ── JWT ───────────────────────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None

# ── FastAPI Dependency ────────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    """
    Optional auth dependency.
    Returns decoded payload dict if token is valid, else None (anonymous).
    """
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    return payload  # {"sub": user_id, "email": "..."}

async def require_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """Strict auth dependency — raises 401 if not authenticated."""
    payload = await get_current_user(credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload
