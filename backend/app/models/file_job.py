"""
FileForge — Pydantic Data Models
─────────────────────────────────────────────────────────────────────────────
Defines typed models for MongoDB documents and API request/response schemas.
─────────────────────────────────────────────────────────────────────────────
"""

from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Optional
import uuid

from bson import ObjectId
from pydantic import BaseModel, Field, field_validator, ConfigDict

from app.config.settings import settings


# ── Enums ─────────────────────────────────────────────────────────────────────


class OperationType(str, Enum):
    """Supported file processing operations."""
    IMAGE_CONVERT = "image_convert"
    IMAGE_RESIZE = "image_resize"
    IMAGE_EDIT = "image_edit"
    PDF_COMPRESS = "pdf_compress"
    PDF_TO_IMAGE = "pdf_to_image"


class JobStatus(str, Enum):
    """Lifecycle states of a processing job."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ── MongoDB Document Model ─────────────────────────────────────────────────────


class FileJob(BaseModel):
    """
    Represents a single file processing job stored in MongoDB.
    """
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )

    id: Optional[str] = Field(default=None, alias="_id")
    job_id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    original_filename: str = Field(description="Sanitized original upload name (for display only)")
    operation: OperationType
    status: JobStatus = Field(default=JobStatus.PENDING)
    output_format: Optional[str] = Field(default=None, description="Target format e.g. 'webp'")
    output_path: Optional[str] = Field(default=None, description="Absolute path to processed file on disk")
    output_filename: Optional[str] = Field(default=None, description="Suggested filename for download")
    file_size_bytes: Optional[int] = Field(default=None, description="Size of processed output file in bytes")
    user_id: Optional[str] = Field(default=None, description="ID of authenticated user if logged in")
    ip_address: Optional[str] = Field(default=None, description="IP address of uploader for rate-limiting / history")
    error_message: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    downloaded_at: Optional[datetime] = Field(default=None)
    expires_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc) + timedelta(
            minutes=settings.file_expiry_minutes
        )
    )

    def to_mongo_dict(self) -> dict:
        """Serialize to a plain dict suitable for MongoDB insertion."""
        data = self.model_dump(exclude={"id"}, by_alias=False)
        return data

    @field_validator("id", mode="before")
    @classmethod
    def coerce_object_id(cls, v):
        """Convert ObjectId to string for JSON compatibility."""
        if isinstance(v, ObjectId):
            return str(v)
        return v


# ── API Response Schemas ───────────────────────────────────────────────────────


class JobResponse(BaseModel):
    """Returned after successfully creating a processing job."""
    job_id: str
    status: JobStatus
    operation: OperationType
    original_filename: str
    output_format: Optional[str] = None
    output_filename: Optional[str] = None
    file_size_bytes: Optional[int] = None
    download_url: Optional[str] = None
    expires_at: datetime
    created_at: datetime


class ErrorResponse(BaseModel):
    """Standard error response body."""
    error: str
    detail: Optional[str] = None
