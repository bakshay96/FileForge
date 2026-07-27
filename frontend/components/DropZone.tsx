"use client";

import { useCallback, useState } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, FileImage, FileText, X, CheckCircle } from "lucide-react";

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

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) {
        const reasons = rejected[0].errors.map((e) => e.message).join(", ");
        setError(`Rejected: ${reasons}`);
        return;
      }
      if (accepted.length > 0) {
        setSelectedFile(accepted[0]);
        onFileSelected(accepted[0]);
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

  const isImage = selectedFile?.type.startsWith("image/");
  const isPdf   = selectedFile?.type === "application/pdf";

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`drop-zone p-10 text-center transition-all duration-250
          ${isDragActive  ? "active" : ""}
          ${selectedFile  ? "has-file" : ""}
          ${error         ? "!border-red-500/50 !bg-red-500/05" : ""}
        `}
      >
        <input {...getInputProps()} />

        {/* No file selected */}
        {!selectedFile && !error && (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center
                             transition-transform duration-300
                             ${isDragActive ? "scale-110" : ""}
                             bg-brand-500/10 border border-brand-500/20`}>
              <Upload className={`w-7 h-7 text-brand-400 transition-transform duration-300
                                  ${isDragActive ? "scale-125 -translate-y-1" : ""}`} />
            </div>
            <div>
              <p className="text-base font-medium text-slate-200">
                {isDragActive ? "Release to upload" : label}
              </p>
              <p className="text-sm text-slate-500 mt-1">{hint}</p>
              <p className="text-xs text-slate-600 mt-2">Max size: {maxSizeMB} MB</p>
            </div>
          </div>
        )}

        {/* File selected */}
        {selectedFile && (
          <div className="flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20
                              flex items-center justify-center flex-shrink-0">
                {isImage ? (
                  <FileImage className="w-5 h-5 text-emerald-400" />
                ) : (
                  <FileText className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200 truncate max-w-[220px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <button
                onClick={clearFile}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error */}
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
    </div>
  );
}
