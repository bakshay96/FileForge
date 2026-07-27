"""
FileForge — FastAPI Application Entry Point
═══════════════════════════════════════════════════════════════════════════════
FileForge is a secure, full-stack file processing platform supporting:
  • Image format conversion (JPEG ↔ PNG ↔ WebP ↔ GIF ↔ BMP ↔ TIFF)
  • Image resizing (by dimension or target file size)
  • Image editing (crop, rotate, filters)
  • PDF compression
  • PDF-to-image conversion

Security highlights:
  ✓ Real MIME type detection via magic bytes (python-magic)
  ✓ Strict file size limits (configurable, default 20 MB)
  ✓ UUID-named temp storage (no original filenames on disk)
  ✓ EXIF metadata stripped from all image outputs
  ✓ APScheduler auto-cleanup (30 min expiry, 5 min sweep)
  ✓ MongoDB job tracking with indexed TTL fields

Author: FileForge Team
Version: 1.0.0
═══════════════════════════════════════════════════════════════════════════════
"""

import logging
import mimetypes
from contextlib import asynccontextmanager
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.config.settings import settings
from app.core.cleanup import start_cleanup_scheduler, stop_cleanup_scheduler
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.routers import image as image_router
from app.routers import pdf as pdf_router
from app.routers import auth as auth_router
from app.routers import history as history_router

# ── Logging Configuration ──────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager.
    Runs startup tasks before yield and shutdown tasks after.
    """
    logger.info(f"🚀 Starting {settings.app_name} v{settings.app_version}")

    # Ensure tmp directory exists
    settings.tmp_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Temp storage: {settings.tmp_dir.resolve()}")

    # Connect to MongoDB
    await connect_to_mongo()

    # Start background cleanup scheduler
    start_cleanup_scheduler()

    yield  # Application runs here

    # ── Shutdown ──
    logger.info(f"🛑 Shutting down {settings.app_name}...")
    stop_cleanup_scheduler()
    await close_mongo_connection()


# ── FastAPI App ───────────────────────────────────────────────────────────────


app = FastAPI(
    title=f"{settings.app_name} API",
    description=__doc__,
    version=settings.app_version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# ── CORS Middleware ───────────────────────────────────────────────────────────


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# ── Global Exception Handler ──────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all handler — never expose raw stack traces to clients."""
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc) if settings.debug else None},
    )


# ── Routers ───────────────────────────────────────────────────────────────────


app.include_router(auth_router.router)
app.include_router(history_router.router)
app.include_router(image_router.router)
app.include_router(pdf_router.router)


# ── Download Endpoint ─────────────────────────────────────────────────────────


@app.get(
    "/api/download/{job_id}",
    summary="Download processed file",
    description=(
        "Retrieve the processed output file for a given job_id. "
        "After download, the file expiry is accelerated to "
        f"{settings.post_download_expiry_minutes} minutes."
    ),
    tags=["Downloads"],
)
async def download_file(job_id: str):
    """
    Serve the processed file as a streaming download.
    Stamps downloaded_at and accelerates expiry on first download.
    """
    db = await get_database()
    job_doc = await db["file_jobs"].find_one({"job_id": job_id})

    if not job_doc:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    if job_doc.get("status") != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Job is not ready for download. Status: {job_doc.get('status')}",
        )

    output_path = Path(job_doc["output_path"])
    if not output_path.exists():
        raise HTTPException(
            status_code=410,
            detail="File has already been deleted (expired or manually removed).",
        )

    # Stamp download time and accelerate expiry
    now = datetime.now(timezone.utc)
    accelerated_expiry = now + timedelta(minutes=settings.post_download_expiry_minutes)

    await db["file_jobs"].update_one(
        {"job_id": job_id},
        {
            "$set": {
                "downloaded_at": now,
                "expires_at": accelerated_expiry,
            }
        },
    )

    # Determine media type
    output_filename = job_doc.get("output_filename", output_path.name)
    media_type, _ = mimetypes.guess_type(output_filename)
    media_type = media_type or "application/octet-stream"

    logger.info(f"Serving download: job={job_id}, file={output_filename}")

    return FileResponse(
        path=str(output_path),
        filename=output_filename,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "X-FileForge-Job-Id": job_id,
        },
    )


# ── Health Check ──────────────────────────────────────────────────────────────


@app.get(
    "/api/health",
    tags=["System"],
    summary="Health check",
)
async def health_check():
    """Returns application health status and MongoDB connectivity."""
    try:
        db = await get_database()
        await db.command("ping")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version,
        "database": db_status,
        "tmp_dir": str(settings.tmp_dir.resolve()),
        "max_file_size_mb": settings.max_file_size_mb,
        "file_expiry_minutes": settings.file_expiry_minutes,
    }


# ── Root ──────────────────────────────────────────────────────────────────────


@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.app_name} API",
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/api/health",
    }


# ── Dev Runner ────────────────────────────────────────────────────────────────


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
