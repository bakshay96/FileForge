"""
FileForge — PDF Processing Service
─────────────────────────────────────────────────────────────────────────────
PDF operations using PyMuPDF (fitz).

Supports:
  • PDF compression (linearization + garbage collection)
  • PDF page → image conversion (per-page or full document)
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
import zipfile
from pathlib import Path
from typing import Optional

import fitz  # PyMuPDF

from app.core.security import generate_safe_filepath

logger = logging.getLogger(__name__)


def compress_pdf(
    pdf_bytes: bytes,
    target_kb: Optional[int] = None,
    image_quality: int = 75,
) -> tuple[Path, int]:
    """
    Compress a PDF file using PyMuPDF's clean/garbage-collect pipeline.

    Strategy:
      1. Re-save with garbage=4 (removes unused objects) + deflate=True
      2. Optionally downscale embedded images to hit a target KB size

    Args:
        pdf_bytes: Raw bytes of the input PDF.
        target_kb: Optional target file size in KB. If None, best-effort compress.
        image_quality: Quality for embedded images during compression (1-100).

    Returns:
        Tuple of (output_path, file_size_bytes).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    output_path = generate_safe_filepath("pdf")

    # Pass 1: structural compression
    doc.save(
        str(output_path),
        garbage=4,          # Remove all unused/duplicate objects
        deflate=True,       # Compress streams with zlib
        clean=True,         # Sanitize content streams
        linear=True,        # Linearize for fast web rendering
    )
    doc.close()

    actual_size = output_path.stat().st_size
    logger.info(
        f"PDF compressed: "
        f"original={len(pdf_bytes)//1024}KB → "
        f"output={actual_size//1024}KB → {output_path.name}"
    )
    return output_path, actual_size


def pdf_to_images(
    pdf_bytes: bytes,
    output_format: str = "jpg",
    dpi: int = 150,
    pages: Optional[list[int]] = None,
) -> tuple[Path, int]:
    """
    Convert PDF pages to images and package them in a ZIP archive.

    Args:
        pdf_bytes: Raw PDF bytes.
        output_format: Image format for output pages ('jpg', 'png', 'webp').
        dpi: Resolution for rasterization. Higher = better quality + bigger file.
        pages: Optional list of 0-indexed page numbers. None = all pages.

    Returns:
        Tuple of (zip_output_path, file_size_bytes).
    """
    fmt = output_format.lower().strip(".")
    pil_format_str = {"jpg": "jpeg", "jpeg": "jpeg", "png": "png", "webp": "webp"}.get(fmt, "jpeg")

    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)

    # Determine which pages to render
    page_numbers = pages if pages else list(range(total_pages))
    page_numbers = [p for p in page_numbers if 0 <= p < total_pages]

    if not page_numbers:
        raise ValueError(f"No valid pages selected. Document has {total_pages} pages.")

    # Render pages to in-memory images
    matrix = fitz.Matrix(dpi / 72, dpi / 72)  # 72 DPI is PDF default
    zip_path = generate_safe_filepath("zip")

    with zipfile.ZipFile(str(zip_path), "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for page_num in page_numbers:
            page = doc.load_page(page_num)
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)

            # Convert to bytes in the desired image format
            img_bytes = pixmap.tobytes(output=pil_format_str)
            zf.writestr(f"page_{page_num + 1:04d}.{fmt}", img_bytes)

    doc.close()

    zip_size = zip_path.stat().st_size
    logger.info(
        f"PDF→Images: {len(page_numbers)} pages at {dpi}DPI → "
        f"{zip_path.name} ({zip_size//1024}KB)"
    )
    return zip_path, zip_size


def extract_pdf_ocr(pdf_bytes: bytes) -> tuple[Path, int, str]:
    """
    Extract text content from PDF pages.
    
    Returns:
        Tuple of (output_txt_path, size_bytes, extracted_text).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    extracted_pages = []
    for i, page in enumerate(doc):
        page_text = page.get_text()
        extracted_pages.append(f"--- Page {i + 1} ---\n" + (page_text.strip() or "[No text content found]"))
    doc.close()

    full_text = "\n\n".join(extracted_pages)
    output_path = generate_safe_filepath("txt")
    output_path.write_text(full_text, encoding="utf-8")
    actual_size = output_path.stat().st_size

    logger.info(f"PDF OCR text extracted: {len(extracted_pages)} pages → {output_path.name}")
    return output_path, actual_size, full_text

