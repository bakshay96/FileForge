"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, FileImage, FileText, X, CheckCircle, HardDrive, Globe, Link2, Loader2 } from "lucide-react";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSizeMB?: number;
  label?: string;
  hint?: string;
}

export default function DropZone({
  onFileSelected,
  accept,
  maxSizeMB = 20,
  label = "Drop your file here",
  hint = "or click to browse",
}: DropZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Tab Mode: 'local' | 'cloud'
  const [sourceTab, setSourceTab] = useState<"local" | "cloud">("local");
  const [cloudUrl, setCloudUrl] = useState("");
  const [cloudLoading, setCloudLoading] = useState(false);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        const reasons = rejected[0].errors.map((e) => e.message).join(", ");
        setError(`Rejected: ${reasons}`);
        return;
      }
      if (accepted.length > 0) {
        const file = accepted[0];
        setSelectedFile(file);
        // Defer the parent callback so React has time to render the file
        // preview before any navigation/state change fires (fixes first-render bug)
        setTimeout(() => onFileSelected(file), 0);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  // Google Drive & Web Cloud Link Fetch Handler
  const handleCloudImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudUrl.trim()) return;
    setError(null);
    setCloudLoading(true);

    try {
      let fetchUrl = cloudUrl.trim();
      
      // Transform Google Drive view link to direct download link if needed
      if (fetchUrl.includes("drive.google.com")) {
        const match = fetchUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          fetchUrl = `https://docs.google.com/uc?export=download&id=${match[1]}`;
        }
      }

      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const blob = await res.blob();
      const contentType = blob.type || "application/octet-stream";
      
      // Infer filename from URL
      let filename = fetchUrl.split("/").pop()?.split("?")[0] || "cloud_file";
      if (!filename.includes(".")) {
        filename += contentType.includes("pdf") ? ".pdf" : ".png";
      }

      const file = new File([blob], filename, { type: contentType });
      setSelectedFile(file);
      onFileSelected(file);
      setCloudUrl("");
    } catch (err: unknown) {
      console.error("Cloud import failed:", err);
      setError("Failed to fetch file from link. Ensure URL is public & direct download enabled.");
    } finally {
      setCloudLoading(false);
    }
  };

  const isImage = selectedFile?.type.startsWith("image/");

  return (
    <div className="w-full">
      {/* Upload Source Selector Tabs */}
      <div className="flex items-center gap-1 mb-3 bg-white/5 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSourceTab("local")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            sourceTab === "local" ? "bg-brand-500 text-white shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          <Upload className="w-3.5 h-3.5" /> Device / Local File
        </button>
        <button
          type="button"
          onClick={() => setSourceTab("cloud")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
            sourceTab === "cloud" ? "bg-brand-500 text-white shadow-md" : "text-slate-400 hover:text-white"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" /> Google Drive &amp; Web Link
        </button>
      </div>

      {/* Tab 1: Local Device Drop Zone */}
      {sourceTab === "local" && (
        <div
          {...getRootProps()}
          className={`drop-zone p-10 text-center transition-all duration-250 cursor-pointer
            ${isDragActive ? "active" : ""}
            ${selectedFile ? "has-file" : ""}
            ${error ? "!border-red-500/50 !bg-red-500/05" : ""}
          `}
        >
          <input {...getInputProps()} />

          {!selectedFile && !error && (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-300 ${
                  isDragActive ? "scale-110" : ""
                } bg-brand-500/10 border border-brand-500/20 shadow-lg shadow-brand-500/10`}
              >
                <Upload
                  className={`w-7 h-7 text-brand-400 transition-transform duration-300 ${
                    isDragActive ? "scale-125 -translate-y-1" : ""
                  }`}
                />
              </div>
              <div>
                <p className="text-base font-medium text-slate-200">
                  {isDragActive ? "Release to upload" : label}
                </p>
                <p className="text-sm text-slate-500 mt-1">{hint}</p>
                <p className="text-xs text-slate-600 mt-2">Max allowed size: {maxSizeMB} MB</p>
              </div>
            </div>
          )}

          {selectedFile && (
            <div className="flex items-center justify-between gap-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  {isImage ? <FileImage className="w-5 h-5 text-emerald-400" /> : <FileText className="w-5 h-5 text-emerald-400" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-200 truncate max-w-[240px]">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || "Document"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <button
                  type="button"
                  onClick={clearFile}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <X className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-400">{error}</p>
                <p className="text-xs text-slate-500 mt-1">Click to try again</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Google Drive & Web URL Import */}
      {sourceTab === "cloud" && (
        <div className="glass-card p-6 text-left border-brand-500/20 bg-brand-500/5">
          <form onSubmit={handleCloudImport} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-400" /> Paste Google Drive or Web File Link
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/... or https://example.com/file.pdf"
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  className="forge-input flex-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={cloudLoading || !cloudUrl.trim()}
                  className="btn-brand px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
                >
                  {cloudLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching…
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3.5 h-3.5" /> Import File
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              💡 Supports public Google Drive share links, Dropbox direct links, or direct HTTP/HTTPS file URLs.
            </p>

            {selectedFile && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button type="button" onClick={clearFile} className="text-xs text-slate-400 hover:text-white">
                  Change
                </button>
              </div>
            )}

            {error && <p className="text-xs text-red-400 font-medium">⚠️ {error}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
