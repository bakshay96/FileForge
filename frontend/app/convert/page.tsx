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
  const [file,             setFile]             = useState<File | null>(null);
  const [format,           setFormat]           = useState("webp");
  const [quality,          setQuality]          = useState(85);
  const [enableWatermark,  setEnableWatermark]  = useState(false);
  const [watermarkText,    setWatermarkText]    = useState("© FileForge PRO");
  const [watermarkOpacity, setWatermarkOpacity] = useState(50);
  const [progress,         setProgress]         = useState(0);
  const [processing,       setProcessing]       = useState(false);
  const [result,           setResult]           = useState<JobResponse | null>(null);
  const [error,            setError]            = useState<string | null>(null);

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
          <div className="glass-card p-5 space-y-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" /> 2. Choose Output Format &amp; Watermark Settings
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

            {/* Watermark Stamper Option (PRO) */}
            <div className="border-t border-white/10 pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableWatermark}
                    onChange={(e) => setEnableWatermark(e.target.checked)}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Stamp Image Watermark (PRO)</span>
                </label>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  NEW
                </span>
              </div>

              {enableWatermark && (
                <div className="space-y-3 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 mt-2">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">Watermark Text</label>
                    <input
                      type="text"
                      className="forge-input text-xs"
                      placeholder="e.g. © 2026 ABTech / FileForge PRO"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 flex justify-between">
                      <span>Watermark Opacity:</span>
                      <span className="font-mono text-cyan-300 font-bold">{watermarkOpacity}%</span>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>
              )}
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
