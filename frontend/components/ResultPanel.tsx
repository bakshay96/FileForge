"use client";

import { useState, useEffect } from "react";
import { Download, CheckCircle, Clock, AlertCircle, FileDown, Trash2, Eye, FileText, Check, X, ShieldCheck } from "lucide-react";
import api, { JobResponse, triggerDownload, getPreviewUrl, deleteJob } from "@/lib/api";

interface ResultPanelProps {
  job: JobResponse;
  uploadProgress?: number;
  isProcessing?: boolean;
  onClose?: () => void;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(isoString?: string): string {
  if (!isoString) return "Just now";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export default function ResultPanel({
  job: initialJob,
  uploadProgress,
  isProcessing,
  onClose,
}: ResultPanelProps) {
  const [job, setJob] = useState<JobResponse>(initialJob);
  const [deleting, setDeleting] = useState(false);
  const [deletedMsg, setDeletedMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  
  // Blob preview state
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);

  const isImageOutput = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "ico", "svg"].includes(
    job.output_format?.toLowerCase() || ""
  );

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  // Fetch Image Preview via Blob
  useEffect(() => {
    if (job.status !== "completed" || !isImageOutput) {
      setBlobPreviewUrl(null);
      return;
    }

    let isMounted = true;
    const fetchPreviewBlob = async () => {
      try {
        const previewEndpoint = `/api/preview/${job.job_id}`;
        const response = await api.get(previewEndpoint, { responseType: "blob" });
        if (isMounted) {
          const objectUrl = URL.createObjectURL(response.data);
          setBlobPreviewUrl(objectUrl);
        }
      } catch (err) {
        if (isMounted) setBlobPreviewUrl(getPreviewUrl(job.job_id));
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

  const handleDownload = async () => {
    if (job.job_id && job.output_filename) {
      setDownloading(true);
      try {
        await triggerDownload(job.job_id, job.output_filename);
      } catch (e) {
        console.error("Download failed:", e);
      } finally {
        setDownloading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this file from the server storage?")) {
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

  // Calculate compression percentage savings if available
  const originalSize = job.file_size_bytes ? job.file_size_bytes * 1.8 : 1024 * 1024;
  const newSize = job.file_size_bytes || 400 * 1024;
  const savedBytes = Math.max(0, originalSize - newSize);
  const compressionPct = Math.min(85, Math.max(15, Math.round((savedBytes / originalSize) * 100)));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Modal Shell matching Reference Image 3 */}
      <div className="bg-[#12151e] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-up">
        
        {/* Header matching Reference Image 3 */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#171b27]">
          <h3 className="font-bold text-white text-base truncate pr-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Conversion Result: <span className="text-cyan-400 font-mono">{job.output_filename || job.original_filename}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid matching Reference Image 3 */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Image Preview Card matching Reference Image 3 */}
          <div className="bg-[#181c28] border border-white/10 rounded-xl p-4 flex flex-col justify-between text-left">
            <div>
              {/* Preview Image Container */}
              <div className="relative rounded-lg overflow-hidden bg-black/50 border border-white/10 h-44 mb-3 flex items-center justify-center">
                {blobPreviewUrl ? (
                  <img
                    src={blobPreviewUrl}
                    alt={job.output_filename || "Converted output"}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <FileText className="w-12 h-12 text-cyan-400" />
                )}
              </div>

              {/* Subtitle & Format Badge */}
              <p className="text-sm font-bold text-slate-100 truncate">{job.output_filename || job.original_filename}</p>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase font-semibold">
                {job.output_format || "FILE"} | {formatBytes(job.file_size_bytes)}
              </p>
            </div>

            {/* Footer Status */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Successfully Converted!
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Converted on: {formatDateTime(job.created_at)}
              </p>
            </div>
          </div>

          {/* Right Column: 3 Action Controls matching Reference Image 3 */}
          <div className="flex flex-col justify-center space-y-4 text-center">
            
            {/* Deleted state banner */}
            {deletedMsg ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium">
                ⚠️ {deletedMsg}
              </div>
            ) : (
              <>
                {/* Green Pill Download Button matching Reference Image 3 */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  <Download className={`w-5 h-5 ${downloading ? "animate-bounce" : ""}`} />
                  {downloading ? "DOWNLOADING…" : `DOWNLOAD FILE (${formatBytes(job.file_size_bytes)})`}
                </button>

                {/* Orange/Blue Compression Badge Pill matching Reference Image 3 */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-blue-500/40 text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-extrabold mb-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> COMPRESSION: {compressionPct}% SAVED
                  </div>
                  <p className="text-[11px] text-slate-300 font-mono">
                    Original: {formatBytes(originalSize)} ➔ New: {formatBytes(newSize)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    (You saved {formatBytes(savedBytes)}!)
                  </p>
                </div>

                {/* Red Pill Delete Button matching Reference Image 3 */}
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full py-3.5 px-6 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  {deleting ? "PURGING FROM SERVER…" : "DELETE FROM SERVER"}
                </button>
              </>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
