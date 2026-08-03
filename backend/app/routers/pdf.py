"""
FileForge — PDF API Router
─────────────────────────────────────────────────────────────────────────────
Endpoints:
  POST /api/pdf/compress    → Compress PDF size
  POST /api/pdf/convert     → Convert PDF pages to images (ZIP download)
─────────────────────────────────────────────────────────────────────────────
"""

import logging
from typing import Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, File, UploadFile, Form, HTTPException, status, Request, Depends

from app.config.settings import settings
from app.core.auth_jwt import get_current_user
from app.core.security import validate_pdf_file, generate_output_filename
from app.db.mongodb import get_database
from app.models.file_job import FileJob, JobResponse, OperationType, JobStatus
from app.services import pdf_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pdf", tags=["PDF Processing"])


async def _save_job(job: FileJob) -> None:
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


# ── Compress ──────────────────────────────────────────────────────────────────


@router.post(
    "/compress",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Compress a PDF file",
    description=(
        "Upload a PDF and compress it using PyMuPDF's garbage-collection and "
        "stream deflation pipeline. Optionally target a specific file size in KB."
    ),
)
async def compress_pdf(
    request: Request,
    file: UploadFile = File(..., description="PDF file to compress"),
    target_kb: Optional[int] = Form(
        default=None,
        ge=10,
        description="Optional target file size in KB",
    ),
    image_quality: int = Form(
        default=75,
        ge=10,
        le=100,
        description="Quality for embedded images during re-compression",
    ),
    auth_payload: Optional[dict] = Depends(get_current_user),
):
    file_bytes = await file.read()
    try:
        validate_pdf_file(file_bytes, file.filename or "upload.pdf")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    job = _create_job_instance(
        request, auth_payload, file.filename or "upload.pdf", OperationType.PDF_COMPRESS, "pdf"
    )
    await _save_job(job)

    try:
        output_path, size = pdf_service.compress_pdf(file_bytes, target_kb, image_quality)
        job.status = JobStatus.COMPLETED
        job.output_path = str(output_path)
        job.output_filename = generate_output_filename(job.original_filename, "pdf", "compressed")
        job.file_size_bytes = size
    except Exception as exc:
        logger.error(f"PDF compression failed: {exc}", exc_info=True)
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
        output_format="pdf",
        output_filename=job.output_filename,
        file_size_bytes=job.file_size_bytes,
        download_url=f"/api/download/{job.job_id}",
        expires_at=job.expires_at,
        created_at=job.created_at,
    )


# ── PDF → Images ──────────────────────────────────────────────────────────────


@router.post(
    "/convert",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Convert PDF pages to images",
    description=(
        "Rasterize PDF pages to JPEG, PNG, or WebP images. "
        "Returns a ZIP archive containing one image per page."
    ),
)
async def convert_pdf_to_images(
    request: Request,
    file: UploadFile = File(..., description="PDF file to convert"),
    output_format: str = Form(
        default="jpg",
        description="Image format for each page: jpg, png, webp",
    ),
    dpi: int = Form(
        default=150,
        ge=72,
        le=600,
        description="Rendering DPI. Higher = better quality but larger file.",
    ),
    pages: Optional[str] = Form(
        default=None,
        description=(
            "Comma-separated 0-indexed page numbers to convert. "
            "Leave empty to convert all pages."
        ),
    ),
    auth_payload: Optional[dict] = Depends(get_current_user),
):
    file_bytes = await file.read()
    try:
        validate_pdf_file(file_bytes, file.filename or "upload.pdf")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # Parse pages string into list of ints
    page_list: Optional[list[int]] = None
    if pages:
        try:
            page_list = [int(p.strip()) for p in pages.split(",") if p.strip()]
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail="'pages' must be a comma-separated list of integers e.g. '0,1,2'"
            )

    fmt = output_format.lower().strip(".")
    if fmt not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(
            status_code=422,
            detail="output_format must be one of: jpg, png, webp"
        )

    job = _create_job_instance(
        request, auth_payload, file.filename or "upload.pdf", OperationType.PDF_TO_IMAGE, fmt
    )
    await _save_job(job)

    try:
        output_path, size = pdf_service.pdf_to_images(file_bytes, fmt, dpi, page_list)
        job.status = JobStatus.COMPLETED
        job.output_path = str(output_path)
        job.output_filename = generate_output_filename(job.original_filename, "zip", "pages")
        job.file_size_bytes = size
    except Exception as exc:
        logger.error(f"PDF conversion failed: {exc}", exc_info=True)
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
        output_format=fmt,
        output_filename=job.output_filename,
        file_size_bytes=job.file_size_bytes,
        download_url=f"/api/download/{job.job_id}",
        expires_at=job.expires_at,
        created_at=job.created_at,
    )


# ── PDF OCR Text Extraction ───────────────────────────────────────────────────


@router.post(
    "/ocr",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Extract text from PDF (OCR)",
    description="Extract plain text content from PDF pages and return as downloadable TXT.",
)
async def ocr_pdf(
    request: Request,
    file: UploadFile = File(..., description="PDF file to extract text from"),
    auth_payload: Optional[dict] = Depends(get_current_user),
):
    file_bytes = await file.read()
    try:
        validate_pdf_file(file_bytes, file.filename or "upload.pdf")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    job = _create_job_instance(
        request, auth_payload, file.filename or "upload.pdf", OperationType.PDF_COMPRESS, "txt"
    )
    await _save_job(job)

    try:
        output_path, size, _text = pdf_service.extract_pdf_ocr(file_bytes)
        job.status = JobStatus.COMPLETED
        job.output_path = str(output_path)
        job.output_filename = generate_output_filename(job.original_filename, "txt", "ocr")
        job.file_size_bytes = size
    except Exception as exc:
        logger.error(f"PDF OCR failed: {exc}", exc_info=True)
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
        output_format="txt",
        output_filename=job.output_filename,
        file_size_bytes=job.file_size_bytes,
        download_url=f"/api/download/{job.job_id}",
        expires_at=job.expires_at,
        created_at=job.created_at,
    )

