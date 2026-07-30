"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";
import FilePreview from "@/components/FilePreview";
import FormatSelect from "@/components/FormatSelect";
import ResultPanel from "@/components/ResultPanel";
import { resizeImage, editImage, JobResponse } from "@/lib/api";
import { Crop, Sliders, Move, History } from "lucide-react";

type Mode = "resize-dim" | "resize-kb" | "edit";

const ACCEPT_IMAGE = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png":  [".png"],
  "image/webp": [".webp"],
  "image/gif":  [".gif"],
  "image/bmp":  [".bmp"],
};

const IMAGE_FORMATS = [
  { value: "jpg",  label: "JPEG (.jpg)" },
  { value: "png",  label: "PNG (.png)" },
  { value: "webp", label: "WebP (.webp)" },
  { value: "bmp",  label: "BMP (.bmp)" },
];

const FILTER_FORMATS = [
  { value: "",          label: "None (Default)" },
  { value: "grayscale", label: "Grayscale" },
  { value: "blur",      label: "Blur Effect" },
  { value: "sharpen",   label: "Sharpen" },
  { value: "contour",   label: "Contour" },
  { value: "emboss",    label: "Emboss" },
];

export default function ResizePage() {
  const [file,       setFile]       = useState<File | null>(null);
  const [mode,       setMode]       = useState<Mode>("resize-dim");
  const [format,     setFormat]     = useState("jpg");
  const [width,      setWidth]      = useState("");
  const [height,     setHeight]     = useState("");
  const [targetKb,   setTargetKb]   = useState("");
  const [compressionPercent, setCompressionPercent] = useState(50);
  const [quality,    setQuality]    = useState(85);
  const [filter,     setFilter]     = useState("");
  const [rotate,     setRotate]     = useState("");
  const [progress,   setProgress]   = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result,     setResult]     = useState<JobResponse | null>(null);
  const [error,      setError]      = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    setProcessing(true);
    setProgress(0);

    try {
      let job: JobResponse;

      if (mode === "resize-dim") {
        job = await resizeImage(
          file,
          {
            outputFormat: format,
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            maintainAspect: true,
            quality,
          },
          setProgress
        );
      } else if (mode === "resize-kb") {
        job = await resizeImage(
          file,
          { outputFormat: format, targetKb: parseInt(targetKb), quality },
          setProgress
        );
      } else {
        job = await editImage(
          file,
          {
            outputFormat: format,
            quality,
            rotateDegrees: rotate ? parseFloat(rotate) : undefined,
            filterName: filter || undefined,
          },
          setProgress
        );
      }

      setResult(job);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? "Operation failed.";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const modeButtons: { id: Mode; icon: typeof Crop; label: string }[] = [
    { id: "resize-dim", icon: Move,    label: "Resize (px)" },
    { id: "resize-kb",  icon: Sliders, label: "Compress (KB)" },
    { id: "edit",       icon: Crop,    label: "Edit & Filters" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 pt-28 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                          bg-purple-500/10 border border-purple-500/20 mb-5 mx-auto">
            <Crop className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
            Resize, Compress & Edit
          </h1>
          <p className="text-slate-400 text-sm">
            Resize pixel dimensions, hit exact target KB sizes with binary-search compression, or apply filters and rotation.
          </p>
        </div>

        <div className="space-y-5">
          {/* Mode tabs */}
          <div className="glass-card p-2 flex gap-1">
            {modeButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setResult(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-sm font-medium transition-all duration-200
                            ${mode === id
                              ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                              : "text-slate-500 hover:text-slate-300"
                            }`}
              >
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div className="glass-card p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              Upload Image
            </p>
            <DropZone onFileSelected={setFile} accept={ACCEPT_IMAGE} />
            {file && <FilePreview file={file} onFileEdited={setFile} />}
          </div>

          {/* Options */}
          <div className="glass-card p-5 space-y-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Options</p>

            {/* Output format */}
            <div>
              <FormatSelect
                label="Output Format"
                value={format}
                options={IMAGE_FORMATS}
                onChange={setFormat}
              />
            </div>

            {/* Mode-specific inputs */}
            {mode === "resize-dim" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Width (px)</label>
                  <input className="forge-input" type="number" placeholder="e.g. 1920"
                         value={width} onChange={(e) => setWidth(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Height (px)</label>
                  <input className="forge-input" type="number" placeholder="e.g. 1080"
                         value={height} onChange={(e) => setHeight(e.target.value)} />
                </div>
              </div>
            )}

            {mode === "resize-kb" && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400 font-medium">
                      Desired Compression Level:{" "}
                      <span className="text-purple-400 font-mono font-bold">{compressionPercent}% Reduction</span>
                    </label>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={85}
                    value={compressionPercent}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      setCompressionPercent(pct);
                      if (file) {
                        const estKb = Math.max(10, Math.round((file.size / 1024) * (1 - pct / 100)));
                        setTargetKb(String(estKb));
                      }
                    }}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {file && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3.5 text-xs text-left">
                    <div className="flex items-center justify-between font-medium text-slate-300 mb-1">
                      <span>Original Image Size:</span>
                      <span className="font-mono text-slate-200 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center justify-between font-medium text-purple-300">
                      <span>Expected Target Size:</span>
                      <span className="font-mono font-bold text-sm">
                        ~{((file.size * (1 - compressionPercent / 100)) / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 border-t border-purple-500/10 pt-1 flex justify-between">
                      <span>Est. Reduction: ~{compressionPercent}%</span>
                      <span>Est. Saved: ~{((file.size * (compressionPercent / 100)) / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Target Size (KB) — optional override</label>
                  <input
                    className="forge-input font-mono text-xs"
                    type="number"
                    placeholder="e.g. 200"
                    value={targetKb}
                    onChange={(e) => setTargetKb(e.target.value)}
                  />
                </div>
              </div>
            )}

            {mode === "edit" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">Rotate (°)</label>
                  <input className="forge-input" type="number" placeholder="e.g. 90 or -45"
                         value={rotate} onChange={(e) => setRotate(e.target.value)} />
                </div>
                <div>
                  <FormatSelect
                    label="Filter Preset"
                    value={filter}
                    options={FILTER_FORMATS}
                    onChange={setFilter}
                  />
                </div>
              </div>
            )}

            {/* Quality slider */}
            {mode !== "resize-kb" && (
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                  Quality: <span className="text-brand-400 font-mono font-bold">{quality}%</span>
                </label>
                <input type="range" min={1} max={95} value={quality}
                       onChange={(e) => setQuality(Number(e.target.value))}
                       className="w-full accent-brand-500 cursor-pointer mt-1" />
              </div>
            )}
          </div>

          {error && (
            <div className="glass-card border-red-500/30 p-4 text-sm text-red-400">⚠️ {error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || processing}
            className="btn-brand w-full py-3.5 text-sm font-semibold"
          >
            {processing ? "Processing…" : "Process Image"}
          </button>

          {result && (
            <div>
              <ResultPanel job={result} uploadProgress={progress} isProcessing={processing} />
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
