"""
FileForge — Image API Router
─────────────────────────────────────────────────────────────────────────────
Endpoints:
  POST /api/image/convert   → Convert image to another format
  POST /api/image/resize    → Resize by dimensions OR target file size
  POST /api/image/edit      → Crop, rotate, apply filter

All endpoints:
  • Validate file via real MIME detection
  • Store job metadata in MongoDB
  • Return a job_id + download_url
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Request, Depends

from app.config.settings import settings
from app.core.auth_jwt import get_current_user
from app.core.security import (
    validate_image_file,
    ALLOWED_IMAGE_MIMES,
    PILLOW_FORMAT_MAP,
)
from app.db.mongodb import get_database
from app.models.file_job import FileJob, JobResponse, OperationType, JobStatus
from app.services import image_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/image", tags=["Image Processing"])

# Allowed output formats (keys of PILLOW_FORMAT_MAP)
VALID_OUTPUT_FORMATS = list(PILLOW_FORMAT_MAP.keys())


async def _save_job(job: FileJob) -> None:
    """Persist a FileJob document to MongoDB."""
    db = await get_database()
    await db["file_jobs"].insert_one(job.to_mongo_dict())


def _create_job_instance(
    request: Request,
    payload: Optional[dict],
    original_filename: str,
    operation: OperationType,
    output_format: str,
) -> FileJob:
    client_ip = request.client.host if request.client else "127.0.0.1"
    user_id = payload.get("sub") if payload else None
    
    # Tiered expiry: 24h (1440m) for logged-in users, 30m for anonymous users
    expiry_mins = settings.auth_expiry_minutes if user_id else settings.file_expiry_minutes
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expiry_mins)

    return FileJob(
        original_filename=original_filename,
        operation=operation,
        status=JobStatus.PROCESSING,
        output_format=output_format,
        user_id=user_id,
        ip_address=client_ip,
        expires_at=expires_at,
    )


def _build_download_url(job_id: str, request_base: str = "") -> str:
    return f"/api/download/{job_id}"


# ── Convert ───────────────────────────────────────────────────────────────────


@router.post(
    "/convert",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Convert image to a different format",
    description=(
        "Upload an image (JPEG, PNG, WebP, GIF, BMP, TIFF) and convert it to "
        "any supported output format. EXIF metadata is stripped automatically."
    ),
)
async def convert_image(
    request: Request,
    file: UploadFile = File(..., description="Image file to convert"),
    target_format: str = Form(
        ...,
        description=f"Target format. One of: {VALID_OUTPUT_FORMATS}",
        examples=["webp"],
    ),
    quality: int = Form(
        default=85,
        ge=1,
        le=95,
        description="JPEG/WEBP compression quality (1-95). Ignored for PNG.",
    ),
    auth_payload: Optional[dict] = Depends(get_current_user),
):
    # 1. Read & validate
    file_bytes = await file.read()
    try:
        validate_image_file(file_bytes, file.filename or "upload")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    fmt = target_format.lower().strip(".")
    if fmt not in PILLOW_FORMAT_MAP:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid target format '{target_format}'. Valid: {VALID_OUTPUT_FORMATS}",
        )

    # 2. Process
    job = _create_job_instance(
        request, auth_payload, file.filename or "upload", OperationType.IMAGE_CONVERT, fmt
    )
    await _save_job(job)

    try:
        output_path, size = image_service.convert_image(file_bytes, fmt, quality)
        job.status = JobStatus.COMPLETED
        job.output_path = str(output_path)
        job.output_filename = f"fileforge_{job.job_id}.{fmt}"
        job.file_size_bytes = size
    except Exception as exc:
        logger.error(f"Image conversion failed: {exc}", exc_info=True)
        job.status = JobStatus.FAILED
        job.error_message = str(exc)
        db = await get_database()
        await db["file_jobs"].update_one(
            {"job_id": job.job_id},
            {"$set": {"status": job.status, "error_message": job.error_message}},
        )
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}")

    # 3. Update DB
    db = await get_database()
    await db["file_jobs"].update_one(
        {"job_id": job.job_id},
        {
            "$set": {
                "status": job.status,
                "output_path": job.output_path,
                "output_filename": job.output_filename,
                "file_size_bytes": job.file_size_bytes,
            }
        },
    )

    return JobResponse(
        job_id=job.job_id,
        status=job.status,
        operation=job.operation,
        original_filename=job.original_filename,
        output_format=job.output_format,
        output_filename=job.output_filename,
        file_size_bytes=job.file_size_bytes,
        download_url=_build_download_url(job.job_id),
        expires_at=job.expires_at,
        created_at=job.created_at,
    )


# ── Resize ────────────────────────────────────────────────────────────────────


@router.post(
    "/resize",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Resize image by dimensions or target file size",
    description=(
        "Resize an image by specifying pixel dimensions (width/height) "
        "OR a target file size in KB. "
        "If target_kb is provided, dimensions are ignored and binary-search "
        "quality compression is used."
    ),
)
async def resize_image(
    request: Request,
    file: UploadFile = File(...),
    output_format: str = Form(default="jpg"),
    width: Optional[int] = Form(default=None, ge=1, le=10000),
    height: Optional[int] = Form(default=None, ge=1, le=10000),
    target_kb: Optional[int] = Form(default=None, ge=1, le=51200),
    maintain_aspect: bool = Form(default=True),
    quality: int = Form(default=85, ge=1, le=95),
    auth_payload: Optional[dict] = Depends(get_current_user),
):
    file_bytes = await file.read()
    try:
        validate_image_file(file_bytes, file.filename or "upload")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    fmt = output_format.lower().strip(".")
    if fmt not in PILLOW_FORMAT_MAP:
        raise HTTPException(status_code=422, detail=f"Invalid format: {output_format}")

    if not target_kb and not width and not height:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one of: width, height, or target_kb.",
        )

    job = _create_job_instance(
        request, auth_payload, file.filename or "upload", OperationType.IMAGE_RESIZE, fmt
    )
    await _save_job(job)

    try:
        if target_kb:
            output_path, size = image_service.resize_image_by_target_size(
                file_bytes, target_kb, fmt
            )
        else:
            output_path, size = image_service.resize_image_by_dimensions(
                file_bytes, width, height, fmt, quality, maintain_aspect
            )
        job.status = JobStatus.COMPLETED
        job.output_path = str(output_path)
        job.output_filename = f"fileforge_resized_{job.job_id}.{fmt}"
        job.file_size_bytes = size
    except Exception as exc:
        logger.error(f"Image resize failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    db = await get_database()
    await db["file_jobs"].update_one(
        {"job_id": job.job_id},
        {
            "$set": {
                "status": job.status,
                "output_path": job.output_path,
                "output_filename": job.output_filename,
                "file_size_bytes": job.file_size_bytes,
            }
        },
    )

    return JobResponse(
        job_id=job.job_id,
        status=job.status,
        operation=job.operation,
        original_filename=job.original_filename,
        output_format=job.output_format,
        output_filename=job.output_filename,
        file_size_bytes=job.file_size_bytes,
        download_url=_build_download_url(job.job_id),
        expires_at=job.expires_at,
        created_at=job.created_at,
    )


# ── Edit ──────────────────────────────────────────────────────────────────────


@router.post(
    "/edit",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Edit image — crop, rotate, apply filter",
    description=(
        "Apply one or more editing operations to an image. "
        "All operations are optional but at least one must be provided."
    ),
)
async def edit_image(
    request: Request,
    file: UploadFile = File(...),
    output_format: str = Form(default="jpg"),
    quality: int = Form(default=85, ge=1, le=95),
    # Crop params
    crop_left: Optional[int] = Form(default=None, ge=0),
    crop_top: Optional[int] = Form(default=None, ge=0),
    crop_right: Optional[int] = Form(default=None, ge=1),
    crop_bottom: Optional[int] = Form(default=None, ge=1),
    # Rotate
    rotate_degrees: Optional[float] = Form(default=None),
    # Filter
    filter_name: Optional[str] = Form(
        default=None,
        description="One of: grayscale, blur, sharpen, contour, emboss",
    ),
    auth_payload: Optional[dict] = Depends(get_current_user),
):
    file_bytes = await file.read()
    try:
        validate_image_file(file_bytes, file.filename or "upload")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    fmt = output_format.lower().strip(".")

    # Build crop dict only if all 4 coordinates are provided
    crop: Optional[dict] = None
    if all(v is not None for v in [crop_left, crop_top, crop_right, crop_bottom]):
        crop = {
            "left": crop_left,
            "top": crop_top,
            "right": crop_right,
            "bottom": crop_bottom,
        }

    # Require at least one operation
    if not crop and rotate_degrees is None and not filter_name:
        raise HTTPException(
            status_code=422,
            detail="Provide at least one edit operation: crop coordinates, rotate_degrees, or filter_name.",
        )

    job = _create_job_instance(
        request, auth_payload, file.filename or "upload", OperationType.IMAGE_EDIT, fmt
    )
    await _save_job(job)

    try:
        output_path, size = image_service.edit_image(
            file_bytes, fmt, crop, rotate_degrees, filter_name, quality
        )
        job.status = JobStatus.COMPLETED
        job.output_path = str(output_path)
        job.output_filename = f"fileforge_edited_{job.job_id}.{fmt}"
        job.file_size_bytes = size
    except Exception as exc:
        logger.error(f"Image edit failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))

    db = await get_database()
    await db["file_jobs"].update_one(
        {"job_id": job.job_id},
        {
            "$set": {
                "status": job.status,
                "output_path": job.output_path,
                "output_filename": job.output_filename,
                "file_size_bytes": job.file_size_bytes,
            }
        },
    )

    return JobResponse(
        job_id=job.job_id,
        status=job.status,
        operation=job.operation,
        original_filename=job.original_filename,
        output_format=job.output_format,
        output_filename=job.output_filename,
        file_size_bytes=job.file_size_bytes,
        download_url=_build_download_url(job.job_id),
        expires_at=job.expires_at,
        created_at=job.created_at,
    )
