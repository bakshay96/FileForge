"""
FileForge — History Router
GET /api/history   → Returns conversion history for current user (auth) or IP (anon)
"""
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Query, Request, Depends

from app.core.auth_jwt import get_current_user
from app.db.mongodb import get_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["History"])


@router.get("", summary="Get conversion history")
async def get_history(
    request: Request,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    payload: Optional[dict] = Depends(get_current_user),
):
    """
    Returns conversion jobs:
    - Authenticated users: all their jobs (up to 24h old)
    - Anonymous users: jobs matching their IP (up to 30min old)
    """
    db = await get_database()
    collection = db["file_jobs"]
    skip = (page - 1) * limit
    now = datetime.now(timezone.utc)

    if payload:
        # Logged-in user: filter by user_id
        query = {"user_id": payload["sub"], "status": "completed"}
    else:
        # Anonymous: filter by IP
        client_ip = request.client.host if request.client else "unknown"
        query = {"ip_address": client_ip, "status": "completed"}

    total = await collection.count_documents(query)
    cursor = collection.find(query).sort("created_at", -1).skip(skip).limit(limit)
    jobs = await cursor.to_list(length=limit)

    results = []
    for job in jobs:
        expires_at = job.get("expires_at")
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        is_expired = (expires_at < now) if expires_at else True
        
        # Check if file still exists on disk
        output_path = job.get("output_path")
        file_exists = False
        if output_path:
            import os
            file_exists = os.path.exists(output_path)

        results.append({
            "job_id": job["job_id"],
            "operation": job.get("operation"),
            "original_filename": job.get("original_filename"),
            "output_format": job.get("output_format"),
            "output_filename": job.get("output_filename"),
            "file_size_bytes": job.get("file_size_bytes"),
            "created_at": job.get("created_at").isoformat() if job.get("created_at") else None,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "is_expired": is_expired,
            "file_available": file_exists and not is_expired,
            "download_url": f"/api/download/{job['job_id']}" if (file_exists and not is_expired) else None,
        })

    return {
        "items": results,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "user_type": "authenticated" if payload else "anonymous",
    }
