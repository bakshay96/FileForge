"use client";

import { Download, CheckCircle, Clock, AlertCircle, FileDown } from "lucide-react";
import { JobResponse, triggerDownload } from "@/lib/api";
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

const STATUS_CONFIG = {
  completed: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    label: "Completed",
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
  job,
  uploadProgress,
  isProcessing,
}: ResultPanelProps) {
  const cfg = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  const handleDownload = () => {
    if (job.job_id && job.output_filename) {
      triggerDownload(job.job_id, job.output_filename);
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${cfg.bg} border ${cfg.border}
                           flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-100">Processing Result</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Job ID: <span className="font-mono text-slate-400">{job.job_id.slice(0, 16)}…</span>
            </p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
                          ${cfg.bg} ${cfg.border} ${cfg.color}`}>
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
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress ?? 0}%` }}
            />
          </div>
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
      </div>

      {/* Download button */}
      {job.status === "completed" && job.download_url && (
        <button
          onClick={handleDownload}
          className="btn-brand w-full py-3 text-sm gap-2.5 font-semibold"
        >
          <FileDown className="w-4 h-4" />
          Download {job.output_filename ?? "File"}
        </button>
      )}

      {/* Expiry warning */}
      {job.status === "completed" && (
        <p className="text-xs text-slate-500 text-center mt-3">
          ⚡ Storage auto-cleans memory and DB after expiry to free resources.
        </p>
      )}
    </div>
  );
}
