"""
FileForge — Auth Router
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
"""
import logging
from fastapi import APIRouter, HTTPException, status, Depends

from app.core.auth_jwt import (
    hash_password, verify_password, create_access_token, require_current_user
)
from app.db.mongodb import get_database
from app.models.user import RegisterRequest, LoginRequest, AuthResponse, UserProfile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=201,
             summary="Register a new account")
async def register(body: RegisterRequest):
    db = await get_database()
    # Check duplicate email
    existing = await db["users"].find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    from app.models.user import UserDocument
    user = UserDocument(
        email=body.email.lower(),
        name=body.name,
        hashed_password=hash_password(body.password),
    )
    await db["users"].insert_one(user.to_mongo_dict())
    token = create_access_token(user.user_id, user.email)
    logger.info(f"New user registered: {user.email}")
    return AuthResponse(access_token=token, user_id=user.user_id, email=user.email, name=user.name)


@router.post("/login", response_model=AuthResponse, summary="Login with email & password")
async def login(body: LoginRequest):
    db = await get_database()
    user_doc = await db["users"].find_one({"email": body.email.lower()})
    if not user_doc or not verify_password(body.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = create_access_token(user_doc["user_id"], user_doc["email"])
    return AuthResponse(
        access_token=token,
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
    )


@router.get("/me", response_model=UserProfile, summary="Get current user profile")
async def me(payload: dict = Depends(require_current_user)):
    db = await get_database()
    user_doc = await db["users"].find_one({"user_id": payload["sub"]})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserProfile(
        user_id=user_doc["user_id"],
        email=user_doc["email"],
        name=user_doc["name"],
        created_at=user_doc["created_at"],
    )
