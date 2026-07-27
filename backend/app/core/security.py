"""
FileForge — Security Core
─────────────────────────────────────────────────────────────────────────────
Implements:
  • Real MIME-type validation via file magic bytes (python-magic)
  • Strict file-size enforcement
  • UUID-based filename sanitization
  • Allowed MIME type allowlists for images and PDFs
─────────────────────────────────────────────────────────────────────────────
"""

import uuid
import logging
from pathlib import Path

import magic  # python-magic-bin on Windows

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ── Allowlists ───────────────────────────────────────────────────────────────

ALLOWED_IMAGE_MIMES: dict[str, str] = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/bmp": "bmp",
    "image/tiff": "tiff",
    "image/x-icon": "ico",
}

ALLOWED_PDF_MIMES: dict[str, str] = {
    "application/pdf": "pdf",
}

ALL_ALLOWED_MIMES: dict[str, str] = {**ALLOWED_IMAGE_MIMES, **ALLOWED_PDF_MIMES}


# ── Output format → MIME mapping ─────────────────────────────────────────────

FORMAT_TO_MIME: dict[str, str] = {
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "gif": "image/gif",
    "bmp": "image/bmp",
    "tiff": "image/tiff",
    "ico": "image/x-icon",
    "pdf": "application/pdf",
}

# PIL save format names differ from extension strings
PILLOW_FORMAT_MAP: dict[str, str] = {
    "jpg": "JPEG",
    "jpeg": "JPEG",
    "png": "PNG",
    "webp": "WEBP",
    "gif": "GIF",
    "bmp": "BMP",
    "tiff": "TIFF",
    "ico": "ICO",
}


# ── Core Security Functions ───────────────────────────────────────────────────


def detect_mime_type(file_bytes: bytes) -> str:
    """
    Detect the true MIME type from file magic bytes.
    Does NOT trust the file extension or Content-Type header.
    Includes robust fallback for cloud environments without system libmagic.
    """
    try:
        mime = magic.from_buffer(file_bytes, mime=True)
        logger.debug(f"Detected MIME type via magic: {mime}")
        return mime
    except Exception as e:
        logger.warning(f"Magic byte detection fallback: {e}")
        
        # 1. PDF header magic (%PDF-)
        if file_bytes.startswith(b"%PDF"):
            return "application/pdf"
            
        # 2. Image inspection via Pillow
        try:
            import io
            from PIL import Image
            img = Image.open(io.BytesIO(file_bytes))
            fmt_mime_map = {
                "JPEG": "image/jpeg",
                "PNG": "image/png",
                "WEBP": "image/webp",
                "GIF": "image/gif",
                "BMP": "image/bmp",
                "TIFF": "image/tiff",
                "ICO": "image/x-icon",
            }
            if img.format in fmt_mime_map:
                return fmt_mime_map[img.format]
        except Exception:
            pass

        return "application/octet-stream"


def validate_image_file(file_bytes: bytes, filename: str) -> str:
    """
    Full security validation for an uploaded image file.

    Args:
        file_bytes: Complete file content.
        filename: Original filename (used only for logging).

    Returns:
        Detected MIME type string if valid.

    Raises:
        ValueError: If file size exceeds limit or MIME type is not allowed.
    """
    # 1. Size check
    size = len(file_bytes)
    if size > settings.max_file_size_bytes:
        raise ValueError(
            f"File '{filename}' is {size / (1024*1024):.1f} MB — "
            f"exceeds maximum allowed size of {settings.max_file_size_mb} MB."
        )

    # 2. MIME detection
    mime = detect_mime_type(file_bytes[:2048])
    if mime not in ALLOWED_IMAGE_MIMES:
        raise ValueError(
            f"File type '{mime}' is not allowed. "
            f"Allowed types: {list(ALLOWED_IMAGE_MIMES.keys())}"
        )

    return mime


def validate_pdf_file(file_bytes: bytes, filename: str) -> str:
    """
    Full security validation for an uploaded PDF file.

    Args:
        file_bytes: Complete file content.
        filename: Original filename (used only for logging).

    Returns:
        Detected MIME type string ('application/pdf') if valid.

    Raises:
        ValueError: If file size exceeds limit or MIME type is not allowed.
    """
    size = len(file_bytes)
    if size > settings.max_file_size_bytes:
        raise ValueError(
            f"File '{filename}' is {size / (1024*1024):.1f} MB — "
            f"exceeds maximum allowed size of {settings.max_file_size_mb} MB."
        )

    mime = detect_mime_type(file_bytes[:2048])
    if mime not in ALLOWED_PDF_MIMES:
        raise ValueError(
            f"File type '{mime}' is not allowed. Expected 'application/pdf'."
        )

    return mime


def generate_safe_filepath(extension: str) -> Path:
    """
    Generate a UUID-based filepath inside the tmp directory.
    Completely discards the original filename to prevent path traversal.

    Args:
        extension: Target file extension WITHOUT leading dot (e.g. 'jpg').

    Returns:
        Absolute Path object inside the configured tmp directory.
    """
    safe_name = f"{uuid.uuid4().hex}.{extension.lower().lstrip('.')}"
    return settings.tmp_dir / safe_name
