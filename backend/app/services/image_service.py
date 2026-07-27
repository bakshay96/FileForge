"""
FileForge — Image Processing Service
─────────────────────────────────────────────────────────────────────────────
All image operations using Pillow (PIL).

Security:
  • EXIF metadata is STRIPPED from all output files (re-encode without copying
    metadata blocks).
  • Files are always written to UUID-named paths via security.generate_safe_filepath().
─────────────────────────────────────────────────────────────────────────────
"""

import io
import logging
from pathlib import Path
from typing import Optional

from PIL import Image, ImageFilter, ImageOps

from app.core.security import PILLOW_FORMAT_MAP, generate_safe_filepath

logger = logging.getLogger(__name__)


# ── Internal Helper ───────────────────────────────────────────────────────────


def _open_image(image_bytes: bytes) -> Image.Image:
    """
    Open image from raw bytes.
    Applies EXIF orientation correction (e.g., portrait shots from phones).
    """
    img = Image.open(io.BytesIO(image_bytes))
    try:
        img = ImageOps.exif_transpose(img)  # Correct orientation from EXIF
    except Exception as e:
        logger.warning(f"Exif transpose failed or skipped: {e}")
    return img


def _save_image_strip_exif(
    img: Image.Image,
    output_path: Path,
    pil_format: str,
    quality: int = 85,
) -> int:
    """
    Save image to disk WITHOUT copying EXIF or other metadata.

    Args:
        img: Pillow Image object.
        output_path: Full path to write the output file.
        pil_format: Pillow format string (e.g. 'JPEG', 'PNG', 'WEBP').
        quality: Compression quality 1-95 (applies to JPEG, WEBP).

    Returns:
        Size of written file in bytes.
    """
    # Convert RGBA / LA / P → RGB for formats that don't support alpha (JPEG, BMP)
    if pil_format in ("JPEG", "BMP") and img.mode in ("RGBA", "LA", "P", "PA"):
        if img.mode == "P":
            img = img.convert("RGBA")
        if img.mode in ("RGBA", "LA", "PA"):
            background = Image.new("RGB", img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[-1])
            img = background
        else:
            img = img.convert("RGB")

    save_kwargs: dict = {"format": pil_format}
    if pil_format in ("JPEG", "WEBP"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    elif pil_format == "PNG":
        save_kwargs["optimize"] = True

    # Write fresh — no metadata= argument means Pillow omits all EXIF/XMP
    img.save(output_path, **save_kwargs)
    return output_path.stat().st_size


# ── Public Service Functions ──────────────────────────────────────────────────


def convert_image(
    image_bytes: bytes,
    target_format: str,
    quality: int = 85,
) -> tuple[Path, int]:
    """
    Convert an image to the specified target format.

    Args:
        image_bytes: Raw bytes of the source image.
        target_format: Target format string e.g. 'webp', 'png', 'jpg'.
        quality: JPEG/WEBP compression quality (1-95).

    Returns:
        Tuple of (output_path, file_size_bytes).
    """
    fmt = target_format.lower().strip(".")
    pil_format = PILLOW_FORMAT_MAP.get(fmt)
    if not pil_format:
        raise ValueError(f"Unsupported output format: '{target_format}'")

    output_path = generate_safe_filepath(fmt)
    img = _open_image(image_bytes)
    size = _save_image_strip_exif(img, output_path, pil_format, quality)
    logger.info(f"Converted image → {output_path.name} ({size} bytes)")
    return output_path, size


def resize_image_by_dimensions(
    image_bytes: bytes,
    width: Optional[int],
    height: Optional[int],
    output_format: str,
    quality: int = 85,
    maintain_aspect: bool = True,
) -> tuple[Path, int]:
    """
    Resize an image to specified width/height, with optional aspect ratio lock.

    Args:
        image_bytes: Source image bytes.
        width: Target width in pixels (optional).
        height: Target height in pixels (optional).
        output_format: e.g. 'jpg', 'png'.
        quality: JPEG/WEBP quality.
        maintain_aspect: If True, scale proportionally using thumbnail logic.

    Returns:
        Tuple of (output_path, file_size_bytes).
    """
    img = _open_image(image_bytes)
    original_w, original_h = img.size

    if width and height and not maintain_aspect:
        new_size = (width, height)
    elif width and height and maintain_aspect:
        img.thumbnail((width, height), Image.LANCZOS)
        new_size = img.size
    elif width:
        ratio = width / original_w
        new_size = (width, int(original_h * ratio))
    elif height:
        ratio = height / original_h
        new_size = (int(original_w * ratio), height)
    else:
        raise ValueError("At least one of width or height must be provided.")

    if not (width and height and maintain_aspect):
        img = img.resize(new_size, Image.LANCZOS)

    fmt = output_format.lower().strip(".")
    pil_format = PILLOW_FORMAT_MAP.get(fmt, "JPEG")
    output_path = generate_safe_filepath(fmt)
    size = _save_image_strip_exif(img, output_path, pil_format, quality)
    logger.info(f"Resized image to {new_size} → {output_path.name} ({size} bytes)")
    return output_path, size


def resize_image_by_target_size(
    image_bytes: bytes,
    target_kb: int,
    output_format: str = "jpg",
) -> tuple[Path, int]:
    """
    Compress/resize an image to reach approximately a target file size in KB.
    Binary searches the quality parameter space.

    Args:
        image_bytes: Source image bytes.
        target_kb: Target file size in kilobytes.
        output_format: e.g. 'jpg', 'webp'.

    Returns:
        Tuple of (output_path, actual_file_size_bytes).
    """
    fmt = output_format.lower().strip(".")
    pil_format = PILLOW_FORMAT_MAP.get(fmt, "JPEG")
    img = _open_image(image_bytes)
    target_bytes = target_kb * 1024

    lo, hi, best_quality = 5, 95, 85

    for _ in range(12):  # Binary search — converges in ~12 iterations
        mid = (lo + hi) // 2
        buf = io.BytesIO()

        if pil_format in ("JPEG", "WEBP"):
            if pil_format == "JPEG" and img.mode in ("RGBA", "LA", "P"):
                # Flatten alpha for JPEG
                bg = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                bg.paste(img, mask=img.split()[-1])
                tmp = bg
            else:
                tmp = img
            tmp.save(buf, format=pil_format, quality=mid, optimize=True)
        else:
            img.save(buf, format=pil_format)

        current_size = buf.tell()
        if current_size <= target_bytes:
            best_quality = mid
            lo = mid + 1
        else:
            hi = mid - 1

        if lo > hi:
            break

    output_path = generate_safe_filepath(fmt)
    size = _save_image_strip_exif(img, output_path, pil_format, best_quality)
    logger.info(
        f"Target-size compress: target={target_kb}KB, "
        f"actual={size//1024}KB, quality={best_quality} → {output_path.name}"
    )
    return output_path, size


def edit_image(
    image_bytes: bytes,
    output_format: str,
    crop: Optional[dict] = None,
    rotate_degrees: Optional[float] = None,
    filter_name: Optional[str] = None,
    quality: int = 85,
) -> tuple[Path, int]:
    """
    Apply editing operations to an image: crop, rotate, and/or filter.

    Args:
        image_bytes: Source image bytes.
        output_format: e.g. 'jpg', 'png'.
        crop: Dict with keys 'left', 'top', 'right', 'bottom' (pixel coords).
        rotate_degrees: Degrees to rotate counter-clockwise.
        filter_name: One of 'grayscale', 'blur', 'sharpen', 'contour', 'emboss'.
        quality: JPEG/WEBP quality.

    Returns:
        Tuple of (output_path, file_size_bytes).
    """
    img = _open_image(image_bytes)

    # 1. Crop
    if crop:
        required = {"left", "top", "right", "bottom"}
        if not required.issubset(crop.keys()):
            raise ValueError(f"Crop dict must contain keys: {required}")
        img = img.crop((crop["left"], crop["top"], crop["right"], crop["bottom"]))

    # 2. Rotate
    if rotate_degrees is not None:
        img = img.rotate(rotate_degrees, expand=True, resample=Image.BICUBIC)

    # 3. Filter
    if filter_name:
        filter_map = {
            "grayscale": lambda i: ImageOps.grayscale(i).convert("RGB"),
            "blur": lambda i: i.filter(ImageFilter.GaussianBlur(radius=2)),
            "sharpen": lambda i: i.filter(ImageFilter.SHARPEN),
            "contour": lambda i: i.filter(ImageFilter.CONTOUR),
            "emboss": lambda i: i.filter(ImageFilter.EMBOSS),
        }
        fn = filter_map.get(filter_name.lower())
        if not fn:
            raise ValueError(
                f"Unknown filter '{filter_name}'. "
                f"Valid: {list(filter_map.keys())}"
            )
        img = fn(img)

    fmt = output_format.lower().strip(".")
    pil_format = PILLOW_FORMAT_MAP.get(fmt, "JPEG")
    output_path = generate_safe_filepath(fmt)
    size = _save_image_strip_exif(img, output_path, pil_format, quality)
    logger.info(f"Edited image → {output_path.name} ({size} bytes)")
    return output_path, size
