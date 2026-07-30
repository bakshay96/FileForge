"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle, Clock, AlertCircle, FileDown, Trash2, Eye, FileText, Check, Calendar } from "lucide-react";
import api, { JobResponse, triggerDownload, getPreviewUrl, deleteJob } from "@/lib/api";
import CountdownTimer from "./CountdownTimer";

interface ResultPanelProps {
  job: JobResponse;
  uploadProgress?: number;
  isProcessing?: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(isoString?: string): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; border: string; label: string }> = {
  completed: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Completed",
  },
  deleted: {
    icon: Trash2,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Purged / Deleted",
  },
  failed: {
    icon: AlertCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    label: "Failed",
  },
  processing: {
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Processing",
  },
  pending: {
    icon: Clock,
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    label: "Pending",
  },
};

export default function ResultPanel({
  job: initialJob,
  uploadProgress,
  isProcessing,
}: ResultPanelProps) {
  const [job, setJob] = useState<JobResponse>(initialJob);
  const [deleting, setDeleting] = useState(false);
  const [deletedMsg, setDeletedMsg] = useState<string | null>(null);
  const [showLargePreview, setShowLargePreview] = useState(false);
  
  // Blob URL state for reliable cross-origin preview rendering
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<boolean>(false);

  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const isImageOutput = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "ico", "svg"].includes(
    job.output_format?.toLowerCase() || ""
  );

  // Fetch image preview via Blob to ensure credentials, CORS, and display work 100%
  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  useEffect(() => {
    if (job.status !== "completed" || !isImageOutput) {
      setBlobPreviewUrl(null);
      return;
    }

    let isMounted = true;
    const fetchPreviewBlob = async () => {
      setPreviewLoading(true);
      setPreviewError(false);
      try {
        const previewEndpoint = `/api/preview/${job.job_id}`;
        const response = await api.get(previewEndpoint, { responseType: "blob" });
        if (isMounted) {
          const objectUrl = URL.createObjectURL(response.data);
          setBlobPreviewUrl(objectUrl);
        }
      } catch (err) {
        console.error("Preview load error:", err);
        if (isMounted) {
          // Fallback to direct URL if blob fetch fails
          setBlobPreviewUrl(getPreviewUrl(job.job_id));
        }
      } finally {
        if (isMounted) setPreviewLoading(false);
      }
    };

    fetchPreviewBlob();

    return () => {
      isMounted = false;
      if (blobPreviewUrl && blobPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(blobPreviewUrl);
      }
    };
  }, [job.job_id, job.status, isImageOutput]);

  const handleDownload = () => {
    if (job.job_id && job.output_filename) {
      triggerDownload(job.job_id, job.output_filename);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this file from the server immediately?")) {
      return;
    }
    setDeleting(true);
    try {
      await deleteJob(job.job_id);
      setJob((prev) => ({ ...prev, status: "deleted" }));
      setDeletedMsg("File permanently deleted from server storage.");
    } catch (err: unknown) {
      alert("Failed to delete file from server.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-100">Processing Result</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Job ID: <span className="font-mono text-slate-400">{job.job_id.slice(0, 16)}…</span>
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
          {cfg.label}
        </span>
      </div>

      {/* Upload progress bar */}
      {(isProcessing || (uploadProgress !== undefined && uploadProgress < 100)) && (
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>{isProcessing ? "Processing…" : "Uploading…"}</span>
            <span>{uploadProgress ?? 0}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${uploadProgress ?? 0}%` }} />
          </div>
        </div>
      )}

      {/* 🖼️ Post-Conversion Interactive Live File Preview */}
      {job.status === "completed" && !deletedMsg && (
        <div className="mb-5 bg-white/[0.02] border border-white/10 rounded-xl p-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Converted Image Preview
            </span>
            {isImageOutput && blobPreviewUrl && (
              <button
                onClick={() => setShowLargePreview(!showLargePreview)}
                className="text-[11px] text-brand-400 hover:underline transition font-medium"
              >
                {showLargePreview ? "Compact View" : "Expand Full Preview"}
              </button>
            )}
          </div>

          {isImageOutput ? (
            <div className="relative group overflow-hidden rounded-lg bg-black/50 border border-white/10 flex items-center justify-center p-3 min-h-[160px]">
              {previewLoading && (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-brand-400" /> Rendering preview image...
                </div>
              )}

              {blobPreviewUrl && (
                <img
                  src={blobPreviewUrl}
                  alt={job.output_filename || "Converted output preview"}
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => {
                    setPreviewLoading(false);
                    setPreviewError(true);
                  }}
                  className={`object-contain rounded transition-all duration-300 ${
                    showLargePreview ? "max-h-[420px] w-full" : "max-h-56 w-auto"
                  }`}
                />
              )}

              {previewError && (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Preview display not available directly. Use Download button below.
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-black/40 border border-white/5 rounded-lg flex items-center gap-3">
              <FileText className="w-8 h-8 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-200">{job.output_filename || job.original_filename}</p>
                <p className="text-[11px] text-slate-500">File processed &amp; ready for download.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
          <p className="text-xs text-slate-500 mb-0.5">Original File</p>
          <p className="text-sm font-medium text-slate-200 truncate">{job.original_filename}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
          <p className="text-xs text-slate-500 mb-0.5">Output Format</p>
          <p className="text-sm font-medium text-slate-200 truncate">{job.output_format?.toUpperCase() ?? "—"}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
          <p className="text-xs text-slate-500 mb-0.5">Output Size</p>
          <p className="text-sm font-medium text-slate-200 truncate">{formatBytes(job.file_size_bytes)}</p>
        </div>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
          <p className="text-xs text-slate-500 mb-0.5">File Expiry</p>
          <div className="mt-0.5">
            <CountdownTimer expiresAt={job.expires_at} />
          </div>
        </div>

        {/* 📅 Date & Time of Conversion */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left col-span-2 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-400" /> Conversion Date &amp; Time
            </p>
            <p className="text-xs font-mono font-medium text-brand-300">
              {formatDateTime(job.created_at)}
            </p>
          </div>
          <span className="text-[10px] text-slate-600 font-mono">UTC Logged</span>
        </div>
      </div>

      {/* Deleted confirmation banner */}
      {deletedMsg && (
        <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-medium flex items-center justify-center gap-2">
          <Check className="w-4 h-4" /> {deletedMsg}
        </div>
      )}

      {/* Action Buttons: Download & Delete */}
      {job.status === "completed" && !deletedMsg && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="btn-brand flex-1 py-3 text-sm gap-2 font-semibold"
          >
            <FileDown className="w-4 h-4" />
            Download {job.output_filename ?? "File"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition text-xs font-semibold flex items-center gap-1.5"
            title="Purge file from server storage now"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Purging…" : "Delete from Server"}
          </button>
        </div>
      )}

      {/* Expiry note */}
      {job.status === "completed" && !deletedMsg && (
        <p className="text-xs text-slate-500 text-center mt-3">
          ⚡ Storage auto-cleans memory &amp; server disk after expiry. You can also manually delete above.
        </p>
      )}
    </div>
  );
}
