"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";
import FilePreview from "@/components/FilePreview";
import FormatSelect from "@/components/FormatSelect";
import ResultPanel from "@/components/ResultPanel";
import { convertImage, JobResponse } from "@/lib/api";
import { RefreshCw, Sliders, History } from "lucide-react";

const IMAGE_FORMATS = [
  { value: "jpg",  label: "JPEG Image (.jpg)"  },
  { value: "png",  label: "PNG Image (.png)"   },
  { value: "webp", label: "WebP Image (.webp)" },
  { value: "gif",  label: "GIF Animation (.gif)" },
  { value: "bmp",  label: "BMP Image (.bmp)"   },
  { value: "tiff", label: "TIFF Image (.tiff)" },
  { value: "ico",  label: "ICO Icon (.ico)"   },
];

const ACCEPT_IMAGE = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png":  [".png"],
  "image/webp": [".webp"],
  "image/gif":  [".gif"],
  "image/bmp":  [".bmp"],
  "image/tiff": [".tiff", ".tif"],
};

export default function ConvertPage() {
  const [file,       setFile]       = useState<File | null>(null);
  const [format,     setFormat]     = useState("webp");
  const [quality,    setQuality]    = useState(85);
  const [progress,   setProgress]   = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result,     setResult]     = useState<JobResponse | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const handleConvert = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    setProcessing(true);
    setProgress(0);

    try {
      const job = await convertImage(file, format, quality, setProgress);
      setResult(job);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? "Conversion failed. Please try again.";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-blue-500/10 border border-blue-500/20 mb-5 mx-auto">
            <RefreshCw className="w-7 h-7 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
            All-in-One Image Converter
          </h1>
          <p className="text-slate-400 text-sm">
            Convert images between JPEG, PNG, WebP, GIF, BMP, TIFF and ICO.
            EXIF metadata is stripped automatically for security.
          </p>
        </div>

        <div className="space-y-5">
          {/* Drop zone */}
          <div className="glass-card p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              1. Upload Image
            </p>
            <DropZone
              onFileSelected={setFile}
              accept={ACCEPT_IMAGE}
              maxSizeMB={20}
              label="Drop your image here"
              hint="JPEG, PNG, WebP, GIF, BMP, TIFF · Max 20 MB"
            />
            {file && <FilePreview file={file} onFileEdited={setFile} />}
          </div>

          {/* Options */}
          <div className="glass-card p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" /> 2. Choose Output Format & Settings
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FormatSelect
                  label="Target Format"
                  value={format}
                  options={IMAGE_FORMATS}
                  onChange={setFormat}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Quality: <span className="text-brand-400 font-mono font-bold">{quality}%</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={95}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer mt-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>Small File</span><span>High Quality</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="glass-card border-red-500/30 p-4 text-sm text-red-400">
              ⚠️ {error}
            </div>
          )}

          {/* Convert button */}
          <button
            onClick={handleConvert}
            disabled={!file || processing}
            className="btn-brand w-full py-3.5 text-sm font-semibold"
          >
            {processing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Converting to {format.toUpperCase()}…
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Convert to {format.toUpperCase()}
              </>
            )}
          </button>

          {/* Result */}
          {result && (
            <div>
              <ResultPanel
                job={result}
                uploadProgress={progress}
                isProcessing={processing}
              />
              <div className="mt-3 text-center">
                <Link href="/history" className="text-xs text-brand-400 hover:underline inline-flex items-center gap-1">
                  <History className="w-3.5 h-3.5" /> View all active conversions & countdown timers
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
