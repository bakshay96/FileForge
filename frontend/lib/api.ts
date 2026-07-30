/**
 * FileForge API Client
 * - Local dev: NEXT_PUBLIC_API_URL is empty → Next.js proxy rewrites /api/* to localhost:8000
 * - Production: NEXT_PUBLIC_API_URL = https://your-backend.onrender.com → calls backend directly
 */

import axios from "axios";

// In dev: "" (proxy handles it). In prod: "https://your-backend.onrender.com"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120_000, // 2 minutes for large files
  headers: { Accept: "application/json" },
});

// Interceptor to attach JWT token if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("ff_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Types ──────────────────────────────────────────────────────────────────

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "deleted";
export type OperationType =
  | "image_convert"
  | "image_resize"
  | "image_edit"
  | "pdf_compress"
  | "pdf_to_image";

export interface JobResponse {
  job_id: string;
  status: JobStatus;
  operation: OperationType;
  original_filename: string;
  output_format: string | null;
  output_filename: string | null;
  file_size_bytes: number | null;
  download_url: string | null;
  expires_at: string;
  created_at: string;
}

export interface HistoryItem {
  job_id: string;
  operation: OperationType;
  original_filename: string;
  output_format: string | null;
  output_filename: string | null;
  file_size_bytes: number | null;
  created_at: string;
  expires_at: string;
  is_expired: boolean;
  file_available: boolean;
  download_url: string | null;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  user_type: "authenticated" | "anonymous";
}

// ── History Endpoint ───────────────────────────────────────────────────────

export async function getHistory(page = 1, limit = 20): Promise<HistoryResponse> {
  const { data } = await api.get<HistoryResponse>(`/api/history?page=${page}&limit=${limit}`);
  return data;
}

// ── Image Endpoints ────────────────────────────────────────────────────────

/**
 * Convert image to a different format.
 */
export async function convertImage(
  file: File,
  targetFormat: string,
  quality = 85,
  onProgress?: (pct: number) => void
): Promise<JobResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("target_format", targetFormat);
  form.append("quality", String(quality));

  const { data } = await api.post<JobResponse>("/api/image/convert", form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}

/**
 * Resize image by pixel dimensions or target KB.
 */
export async function resizeImage(
  file: File,
  opts: {
    outputFormat?: string;
    width?: number;
    height?: number;
    targetKb?: number;
    maintainAspect?: boolean;
    quality?: number;
  },
  onProgress?: (pct: number) => void
): Promise<JobResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("output_format", opts.outputFormat ?? "jpg");
  if (opts.width) form.append("width", String(opts.width));
  if (opts.height) form.append("height", String(opts.height));
  if (opts.targetKb) form.append("target_kb", String(opts.targetKb));
  form.append("maintain_aspect", String(opts.maintainAspect ?? true));
  form.append("quality", String(opts.quality ?? 85));

  const { data } = await api.post<JobResponse>("/api/image/resize", form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

/**
 * Edit image — crop, rotate, and/or apply filter.
 */
export async function editImage(
  file: File,
  opts: {
    outputFormat?: string;
    quality?: number;
    crop?: { left: number; top: number; right: number; bottom: number };
    rotateDegrees?: number;
    filterName?: string;
  },
  onProgress?: (pct: number) => void
): Promise<JobResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("output_format", opts.outputFormat ?? "jpg");
  form.append("quality", String(opts.quality ?? 85));
  if (opts.crop) {
    form.append("crop_left", String(opts.crop.left));
    form.append("crop_top", String(opts.crop.top));
    form.append("crop_right", String(opts.crop.right));
    form.append("crop_bottom", String(opts.crop.bottom));
  }
  if (opts.rotateDegrees !== undefined)
    form.append("rotate_degrees", String(opts.rotateDegrees));
  if (opts.filterName) form.append("filter_name", opts.filterName);

  const { data } = await api.post<JobResponse>("/api/image/edit", form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

// ── PDF Endpoints ──────────────────────────────────────────────────────────

/**
 * Compress a PDF file.
 */
export async function compressPdf(
  file: File,
  opts: { targetKb?: number; imageQuality?: number } = {},
  onProgress?: (pct: number) => void
): Promise<JobResponse> {
  const form = new FormData();
  form.append("file", file);
  if (opts.targetKb) form.append("target_kb", String(opts.targetKb));
  form.append("image_quality", String(opts.imageQuality ?? 75));

  const { data } = await api.post<JobResponse>("/api/pdf/compress", form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

/**
 * Convert PDF pages to images (returns ZIP).
 */
export async function convertPdfToImages(
  file: File,
  opts: { outputFormat?: string; dpi?: number; pages?: string } = {},
  onProgress?: (pct: number) => void
): Promise<JobResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("output_format", opts.outputFormat ?? "jpg");
  form.append("dpi", String(opts.dpi ?? 150));
  if (opts.pages) form.append("pages", opts.pages);

  const { data } = await api.post<JobResponse>("/api/pdf/convert", form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data;
}

// ── Download & File Management ─────────────────────────────────────────────

/**
 * Trigger browser download from a job's download URL.
 * Works in both dev (proxy) and production (direct backend URL).
 */
export function triggerDownload(jobId: string, filename: string): void {
  const url = `${API_BASE_URL}/api/download/${jobId}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Get preview URL for inline browser display.
 */
export function getPreviewUrl(jobId: string): string {
  return `${API_BASE_URL}/api/preview/${jobId}`;
}

/**
 * Delete a job file from server storage manually.
 */
export async function deleteJob(jobId: string): Promise<{ status: string; message: string }> {
  const { data } = await api.delete<{ status: string; message: string }>(`/api/file/${jobId}`);
  return data;
}

export default api;
