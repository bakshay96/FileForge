# FileForge Backend

Secure FastAPI backend for image and PDF processing.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config/
│   │   └── settings.py      # Pydantic settings (reads .env)
│   ├── core/
│   │   ├── security.py      # MIME validation, file sanitization
│   │   └── cleanup.py       # APScheduler auto-cleanup
│   ├── db/
│   │   └── mongodb.py       # Motor async MongoDB client
│   ├── models/
│   │   └── file_job.py      # Pydantic document models
│   ├── routers/
│   │   ├── image.py         # Image API endpoints
│   │   └── pdf.py           # PDF API endpoints
│   └── services/
│       ├── image_service.py # Pillow image processing
│       └── pdf_service.py   # PyMuPDF PDF processing
├── tmp/                     # Auto-created temp file storage
├── .env                     # Environment variables
└── requirements.txt
```

## Setup & Run

### 1. Prerequisites
- Python 3.11+
- MongoDB running locally (`mongod` on port 27017)
- On Windows: `python-magic-bin` is included in requirements.txt

### 2. Create virtual environment
```powershell
cd D:\MASAI\FileForge\backend
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install dependencies
```powershell
pip install -r requirements.txt
```

### 4. Configure environment
```powershell
# .env is already created with defaults — edit if needed
notepad .env
```

### 5. Start the server
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/api/health

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/image/convert` | Convert image format |
| POST | `/api/image/resize` | Resize by dimensions or KB |
| POST | `/api/image/edit` | Crop, rotate, filter |
| POST | `/api/pdf/compress` | Compress PDF |
| POST | `/api/pdf/convert` | PDF → images (ZIP) |
| GET | `/api/download/{job_id}` | Download result |
| GET | `/api/health` | Health check |

## Security Features
- ✅ Real MIME type detection (magic bytes, not extension)
- ✅ 20 MB file size limit enforced before processing
- ✅ UUID-named storage (original filenames never touch disk)
- ✅ EXIF metadata stripped from all image outputs
- ✅ Auto-cleanup scheduler: files expire in 30 min, 5 min after download
- ✅ MongoDB injection-safe: Pydantic models + Motor driver
