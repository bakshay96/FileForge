"""
FileForge — Application Settings
Uses pydantic-settings to read from .env file with full type validation.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path


class Settings(BaseSettings):
    """Central configuration loaded from .env / environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    app_name: str = Field(default="FileForge", description="Application name")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False)

    # ── Server ───────────────────────────────────────────────────────────────
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)

    # ── MongoDB ──────────────────────────────────────────────────────────────
    mongo_uri: str = Field(default="mongodb://localhost:27017")
    mongo_db_name: str = Field(default="fileforge")

    # ── File Storage ─────────────────────────────────────────────────────────
    tmp_dir: Path = Field(default=Path("./tmp"))
    max_file_size_mb: int = Field(default=20, ge=1, le=200)

    # ── Cleanup Policy ───────────────────────────────────────────────────────
    file_expiry_minutes: int = Field(default=30)           # anon users
    auth_expiry_minutes: int = Field(default=1440)         # logged-in users (24 h)
    post_download_expiry_minutes: int = Field(default=5)
    cleanup_interval_minutes: int = Field(default=5)

    # ── JWT Auth ─────────────────────────────────────────────────────────────
    jwt_secret: str = Field(default="fileforge-super-secret-change-in-prod-2024")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=10080)         # 7 days

    # ── Rate Limiting ─────────────────────────────────────────────────────────
    anon_rate_limit: str = Field(default="10/hour")        # per IP
    auth_rate_limit: str = Field(default="100/hour")       # per account

    # ── CORS ─────────────────────────────────────────────────────────────────
    cors_origins: str = Field(default="http://localhost:3000")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024


# Singleton settings instance imported by all modules
settings = Settings()

# Ensure tmp directory exists on startup safely
try:
    settings.tmp_dir.mkdir(parents=True, exist_ok=True)
except Exception:
    pass
