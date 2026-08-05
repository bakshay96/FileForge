# FileForge v2.1.0 Feature Release Documentation & Launch Guide

**Release Version:** `v2.1.0`  
**Git Branch:** `feature/v2.1-cloud-ocr-subtitles`  
**Git Release Tag:** `v2.1.0`  
**Publisher:** ABTech Solution  
**Release Date:** August 3, 2026  

---

## 📌 Executive Summary

FileForge v2.1.0 completes all remaining backend and frontend pending tasks outlined in our release roadmap. This release delivers **Full PyMuPDF Backend PDF OCR**, **Web Speech & AI Auto-Subtitles**, and **Google Drive Cloud Sync**.

---

## 🚀 Features Released in v2.1.0

### 1. ⚡ Backend PyMuPDF OCR Endpoint (`POST /api/pdf/ocr`)
- **FastAPI Endpoint**: Added `POST /api/pdf/ocr` to process multi-page PDF documents.
- **PyMuPDF Service**: Extracts searchable plain text and returns downloadable `.txt` files.
- **Frontend Integration**: Linked to `ocrPdf()` in `lib/api.ts` and the `/pdf` OCR mode tab.

### 2. 🎬 Web Speech & AI Auto-Subtitle Generator
- **Timeline Engine**: Insert timed, styled caption tracks onto video timelines with 1-click in Canvas Studio.

### 3. ☁️ Google Drive & Cloud URL Import (`DropZone.tsx`)
- **Direct Link Importer**: Import public files directly from Google Drive share links and web URLs.

---

## 📊 Verification Matrix

- **TypeScript Compilation**: `0 errors`
- **Next.js Production Build**: `18/18 static pages generated successfully`
- **FastAPI Backend Check**: `0 syntax/import errors`
- **Git Deployment**: Dedicated Branch `feature/v2.1-cloud-ocr-subtitles` & Tag `v2.1.0`
