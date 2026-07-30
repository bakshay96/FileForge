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
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse

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
    # ── Startup Banner ────────────────────────────────────────────────────────
    print("")
    print("╔══════════════════════════════════════════════════╗")
    print(f"║         {settings.app_name} API  v{settings.app_version}                    ║")
    print("╚══════════════════════════════════════════════════╝")
    print("")

    # Step 1 — Tmp directory
    logger.info("[ 1/4 ] Preparing temp storage...")
    settings.tmp_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"        ✔  Temp dir ready: {settings.tmp_dir.resolve()}")

    # Step 2 — MongoDB
    logger.info("[ 2/4 ] Connecting to MongoDB...")
    await connect_to_mongo()

    # Step 3 — Cleanup scheduler
    logger.info("[ 3/4 ] Starting background cleanup scheduler...")
    start_cleanup_scheduler()
    logger.info(f"        ✔  Cleanup runs every {settings.cleanup_interval_minutes} min "
                f"| File expiry: {settings.file_expiry_minutes} min")

    # Step 4 — Routes summary
    logger.info("[ 4/4 ] Registering API routes...")
    logger.info("        ✔  Auth     →  /api/auth/*")
    logger.info("        ✔  Image    →  /api/image/*")
    logger.info("        ✔  PDF      →  /api/pdf/*")
    logger.info("        ✔  History  →  /api/history")
    logger.info("        ✔  Download →  /api/download/{job_id}")
    logger.info("        ✔  Health   →  /api/health")

    # ── All systems go ────────────────────────────────────────────────────────
    print("")
    print("┌──────────────────────────────────────────────────┐")
    print("│  ✅  All systems go! Server is ready.            │")
    print(f"│  🌐  Docs   →  http://localhost:{settings.port}/docs           │")
    print(f"│  ❤️   Health →  http://localhost:{settings.port}/api/health     │")
    print("└──────────────────────────────────────────────────┘")
    print("")

    yield  # Application runs here

    # ── Shutdown ──────────────────────────────────────────────────────────────
    print("")
    logger.info("Shutting down FileForge...")
    logger.info("  Stopping cleanup scheduler...")
    stop_cleanup_scheduler()
    logger.info("  Closing MongoDB connection...")
    await close_mongo_connection()
    logger.info("  ✔  Shutdown complete. Goodbye!")


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


# ── Inline Preview Endpoint ───────────────────────────────────────────────────


@app.get(
    "/api/preview/{job_id}",
    summary="Preview processed file inline",
    description="Serve the processed output file with inline disposition for in-browser image/file preview.",
    tags=["Downloads"],
)
async def preview_file(job_id: str):
    """
    Serve processed file inline for browser image/file preview tags.
    Does not force download attachment header.
    """
    db = await get_database()
    job_doc = await db["file_jobs"].find_one({"job_id": job_id})

    if not job_doc or job_doc.get("status") != "completed":
        raise HTTPException(status_code=404, detail="File preview not available.")

    output_path = Path(job_doc["output_path"])
    if not output_path.exists():
        raise HTTPException(status_code=410, detail="File has already been deleted.")

    output_filename = job_doc.get("output_filename", output_path.name)
    media_type, _ = mimetypes.guess_type(output_filename)
    media_type = media_type or "application/octet-stream"

    return FileResponse(
        path=str(output_path),
        media_type=media_type,
        headers={
            "Content-Disposition": f'inline; filename="{output_filename}"',
            "X-FileForge-Job-Id": job_id,
        },
    )


# ── Manual File Delete Endpoint ───────────────────────────────────────────────


@app.delete(
    "/api/file/{job_id}",
    summary="Manually delete file from server",
    description="Purges input and output files from server storage immediately upon user request.",
    tags=["Downloads"],
)
async def delete_file(job_id: str):
    """
    Immediately purge files from server storage and mark job as deleted in DB.
    """
    db = await get_database()
    job_doc = await db["file_jobs"].find_one({"job_id": job_id})

    if not job_doc:
        raise HTTPException(status_code=404, detail=f"Job '{job_id}' not found.")

    deleted_paths = []

    # Unlink output path
    output_path_str = job_doc.get("output_path")
    if output_path_str:
        op = Path(output_path_str)
        if op.exists():
            try:
                op.unlink()
                deleted_paths.append(str(op))
            except Exception as e:
                logger.warning(f"Error unlinking {op}: {e}")

    # Unlink input path
    input_path_str = job_doc.get("input_path")
    if input_path_str:
        ip = Path(input_path_str)
        if ip.exists():
            try:
                ip.unlink()
                deleted_paths.append(str(ip))
            except Exception as e:
                logger.warning(f"Error unlinking {ip}: {e}")

    # Update MongoDB job record
    now = datetime.now(timezone.utc)
    await db["file_jobs"].update_one(
        {"job_id": job_id},
        {
            "$set": {
                "status": "deleted",
                "file_available": False,
                "deleted_at": now,
            }
        },
    )

    logger.info(f"Manually purged job={job_id}, files={deleted_paths}")

    return {
        "status": "deleted",
        "job_id": job_id,
        "message": "File successfully purged from server storage.",
        "deleted_files_count": len(deleted_paths),
    }



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


# ── Root — Welcome Page ───────────────────────────────────────────────────────


@app.get("/", tags=["System"], response_class=HTMLResponse)
async def root():
    """Serves a branded HTML welcome page with full API documentation."""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>{settings.app_name} API — v{settings.app_version}</title>
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f0f13;
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem 1rem;
    }}
    .container {{ max-width: 860px; margin: 0 auto; }}

    /* Header */
    .header {{
      text-align: center;
      padding: 3rem 0 2rem;
      border-bottom: 1px solid #1e1e2e;
      margin-bottom: 2.5rem;
    }}
    .logo {{
      font-size: 2.8rem;
      font-weight: 800;
      background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -1px;
    }}
    .version {{
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.2rem 0.75rem;
      background: #1e1e2e;
      border: 1px solid #6366f1;
      border-radius: 20px;
      font-size: 0.8rem;
      color: #a5b4fc;
    }}
    .tagline {{
      margin-top: 1rem;
      color: #64748b;
      font-size: 1rem;
    }}

    /* Status badge */
    .status {{
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.2rem;
      font-size: 0.9rem;
      color: #4ade80;
    }}
    .dot {{
      width: 8px; height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }}
    @keyframes pulse {{
      0%, 100% {{ opacity: 1; }}
      50% {{ opacity: 0.4; }}
    }}

    /* Quick links */
    .quick-links {{
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 2.5rem;
    }}
    .btn {{
      padding: 0.6rem 1.4rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }}
    .btn-primary {{
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }}
    .btn-primary:hover {{ opacity: 0.85; transform: translateY(-1px); }}
    .btn-outline {{
      border: 1px solid #334155;
      color: #94a3b8;
      background: #1e1e2e;
    }}
    .btn-outline:hover {{ border-color: #6366f1; color: #a5b4fc; }}

    /* Sections */
    .section {{ margin-bottom: 2rem; }}
    .section-title {{
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #475569;
      margin-bottom: 0.75rem;
    }}

    /* Endpoint cards */
    .card {{
      background: #13131a;
      border: 1px solid #1e1e2e;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 0.6rem;
    }}
    .endpoint {{
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #1e1e2e;
    }}
    .endpoint:last-child {{ border-bottom: none; }}
    .method {{
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      min-width: 48px;
      text-align: center;
    }}
    .get  {{ background: #052e16; color: #4ade80; border: 1px solid #166534; }}
    .post {{ background: #172554; color: #93c5fd; border: 1px solid #1d4ed8; }}
    .path {{
      font-family: 'Courier New', monospace;
      font-size: 0.88rem;
      color: #e2e8f0;
      flex: 1;
    }}
    .desc {{ font-size: 0.8rem; color: #475569; text-align: right; }}

    /* Feature grid */
    .features {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem;
    }}
    .feature {{
      background: #13131a;
      border: 1px solid #1e1e2e;
      border-radius: 10px;
      padding: 1rem;
    }}
    .feature-icon {{ font-size: 1.5rem; margin-bottom: 0.4rem; }}
    .feature-title {{ font-size: 0.9rem; font-weight: 600; color: #c4b5fd; }}
    .feature-desc {{ font-size: 0.78rem; color: #475569; margin-top: 0.25rem; }}

    /* Info grid */
    .info-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
    }}
    .info-card {{
      background: #13131a;
      border: 1px solid #1e1e2e;
      border-radius: 10px;
      padding: 1rem;
      text-align: center;
    }}
    .info-value {{ font-size: 1.4rem; font-weight: 700; color: #a5b4fc; }}
    .info-label {{ font-size: 0.75rem; color: #475569; margin-top: 0.2rem; }}

    /* Footer */
    .footer {{
      text-align: center;
      padding: 2rem 0 1rem;
      border-top: 1px solid #1e1e2e;
      margin-top: 3rem;
      color: #334155;
      font-size: 0.8rem;
    }}
  </style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <div class="logo">⚡ {settings.app_name}</div>
    <div class="version">v{settings.app_version}</div>
    <p class="tagline">Secure File Processing API — Image &amp; PDF Conversion, Resize, Edit</p>
    <div class="status">
      <div class="dot"></div>
      API is live and running
    </div>
  </div>

  <!-- Quick Links -->
  <div class="quick-links">
    <a href="/docs" class="btn btn-primary">📖 Interactive API Docs (Swagger)</a>
    <a href="/redoc" class="btn btn-outline">📄 ReDoc Reference</a>
    <a href="/api/health" class="btn btn-outline">❤️ Health Check</a>
  </div>

  <!-- Image Endpoints -->
  <div class="section">
    <div class="section-title">🖼️ Image Endpoints</div>
    <div class="card">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/image/convert</span>
        <span class="desc">Convert format (JPG/PNG/WebP/BMP/TIFF/GIF)</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/image/resize</span>
        <span class="desc">Resize by dimensions or target KB</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/image/edit</span>
        <span class="desc">Crop, rotate, apply filters</span>
      </div>
    </div>
  </div>

  <!-- PDF Endpoints -->
  <div class="section">
    <div class="section-title">📄 PDF Endpoints</div>
    <div class="card">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/pdf/compress</span>
        <span class="desc">Compress PDF by quality or target KB</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/pdf/convert</span>
        <span class="desc">Convert PDF pages to images (ZIP)</span>
      </div>
    </div>
  </div>

  <!-- Auth & History -->
  <div class="section">
    <div class="section-title">🔐 Auth &amp; History</div>
    <div class="card">
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/register</span>
        <span class="desc">Create new account</span>
      </div>
      <div class="endpoint">
        <span class="method post">POST</span>
        <span class="path">/api/auth/login</span>
        <span class="desc">Login &amp; receive JWT token</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/auth/me</span>
        <span class="desc">Get current user profile</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/history</span>
        <span class="desc">Paginated job history</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/download/{{job_id}}</span>
        <span class="desc">Download processed file</span>
      </div>
    </div>
  </div>

  <!-- System -->
  <div class="section">
    <div class="section-title">⚙️ System</div>
    <div class="card">
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/api/health</span>
        <span class="desc">App &amp; MongoDB health status</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/docs</span>
        <span class="desc">Swagger UI — Interactive docs</span>
      </div>
      <div class="endpoint">
        <span class="method get">GET</span>
        <span class="path">/redoc</span>
        <span class="desc">ReDoc — Full API reference</span>
      </div>
    </div>
  </div>

  <!-- Features -->
  <div class="section">
    <div class="section-title">🛡️ Security Features</div>
    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔍</div>
        <div class="feature-title">MIME Detection</div>
        <div class="feature-desc">Real magic-byte file type validation, not just extension</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔒</div>
        <div class="feature-title">JWT Auth</div>
        <div class="feature-desc">Secure token-based authentication with 7-day expiry</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🧹</div>
        <div class="feature-title">Auto Cleanup</div>
        <div class="feature-desc">Files auto-deleted every {settings.cleanup_interval_minutes} min after {settings.file_expiry_minutes} min expiry</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🗑️</div>
        <div class="feature-title">EXIF Stripped</div>
        <div class="feature-desc">All metadata removed from image outputs</div>
      </div>
    </div>
  </div>

  <!-- Config Info -->
  <div class="section">
    <div class="section-title">📊 Server Configuration</div>
    <div class="info-grid">
      <div class="info-card">
        <div class="info-value">{settings.max_file_size_mb} MB</div>
        <div class="info-label">Max Upload Size</div>
      </div>
      <div class="info-card">
        <div class="info-value">{settings.file_expiry_minutes} min</div>
        <div class="info-label">File Expiry (Anonymous)</div>
      </div>
      <div class="info-card">
        <div class="info-value">{settings.auth_expiry_minutes // 60}h</div>
        <div class="info-label">File Expiry (Auth Users)</div>
      </div>
      <div class="info-card">
        <div class="info-value">{settings.cleanup_interval_minutes} min</div>
        <div class="info-label">Cleanup Interval</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Built with ⚡ FastAPI + MongoDB &nbsp;·&nbsp; {settings.app_name} v{settings.app_version}
  </div>

</div>
</body>
</html>"""
    return HTMLResponse(content=html)


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
