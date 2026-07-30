"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";
import FilePreview from "@/components/FilePreview";
import FormatSelect from "@/components/FormatSelect";
import ResultPanel from "@/components/ResultPanel";
import { compressPdf, convertPdfToImages, JobResponse } from "@/lib/api";
import { FileText, Archive, Minimize2, History } from "lucide-react";

type Mode = "compress" | "convert";

const ACCEPT_PDF = { "application/pdf": [".pdf"] };

const PDF_IMAGE_FORMATS = [
  { value: "jpg",  label: "JPEG Image (.jpg)" },
  { value: "png",  label: "PNG Image (.png)" },
  { value: "webp", label: "WebP Image (.webp)" },
];

export default function PdfPage() {
  const [file,         setFile]         = useState<File | null>(null);
  const [mode,         setMode]         = useState<Mode>("compress");
  const [targetKb,     setTargetKb]     = useState("");
  const [compressionPercent, setCompressionPercent] = useState(50);
  const [imgQuality,   setImgQuality]   = useState(75);
  const [imgFormat,    setImgFormat]    = useState("jpg");
  const [dpi,          setDpi]          = useState(150);
  const [pages,        setPages]        = useState("");
  const [progress,     setProgress]     = useState(0);
  const [processing,   setProcessing]   = useState(false);
  const [result,       setResult]       = useState<JobResponse | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!file) return;
    setError(null);
    setResult(null);
    setProcessing(true);
    setProgress(0);

    try {
      let job: JobResponse;
      if (mode === "compress") {
        job = await compressPdf(
          file,
          {
            targetKb: targetKb ? parseInt(targetKb) : undefined,
            imageQuality: imgQuality,
          },
          setProgress
        );
      } else {
        job = await convertPdfToImages(
          file,
          {
            outputFormat: imgFormat,
            dpi,
            pages: pages || undefined,
          },
          setProgress
        );
      }
      setResult(job);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? "PDF processing failed.";
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
                          bg-emerald-500/10 border border-emerald-500/20 mb-5 mx-auto">
            <FileText className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
            PDF Compression & Image Extraction
          </h1>
          <p className="text-slate-400 text-sm">
            Compress PDFs to reduce storage size, or extract PDF pages as JPEG/PNG/WebP images (packaged in a ZIP).
          </p>
        </div>

        <div className="space-y-5">
          {/* Mode tabs */}
          <div className="glass-card p-2 flex gap-1">
            {[
              { id: "compress" as Mode, icon: Minimize2, label: "Compress PDF" },
              { id: "convert"  as Mode, icon: Archive,   label: "PDF → Images" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => { setMode(id); setResult(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                            text-sm font-medium transition-all duration-200
                            ${mode === id
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
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
              Upload PDF
            </p>
            <DropZone
              onFileSelected={setFile}
              accept={ACCEPT_PDF}
              label="Drop your PDF here"
              hint="PDF files only · Max 20 MB"
            />
            {file && <FilePreview file={file} />}
          </div>

          {/* Options */}
          <div className="glass-card p-5 space-y-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Options</p>

            {mode === "compress" && (
              <>
                {/* Compression Level Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-400 font-medium">
                      Desired Compression Level:{" "}
                      <span className="text-emerald-400 font-mono font-bold">{compressionPercent}% Reduction</span>
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
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Real-time Expected Size Calculator */}
                {file && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-left">
                    <div className="flex items-center justify-between font-medium text-slate-300 mb-1">
                      <span>Original File Size:</span>
                      <span className="font-mono text-slate-200 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <div className="flex items-center justify-between font-medium text-emerald-400">
                      <span>Expected Output Size:</span>
                      <span className="font-mono font-bold text-sm">
                        ~{((file.size * (1 - compressionPercent / 100)) / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400 border-t border-emerald-500/10 pt-1 flex justify-between">
                      <span>Est. Reduction: ~{compressionPercent}%</span>
                      <span>Est. Saved: ~{((file.size * (compressionPercent / 100)) / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Manual Target Size (KB) — optional override
                  </label>
                  <input
                    className="forge-input font-mono text-xs"
                    type="number"
                    placeholder="e.g. 500"
                    value={targetKb}
                    onChange={(e) => setTargetKb(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Raster Image Quality: <span className="text-emerald-400 font-mono font-bold">{imgQuality}%</span>
                  </label>
                  <input
                    type="range" min={10} max={100} value={imgQuality}
                    onChange={(e) => setImgQuality(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </>
            )}

            {mode === "convert" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FormatSelect
                      label="Output Image Format"
                      value={imgFormat}
                      options={PDF_IMAGE_FORMATS}
                      onChange={setImgFormat}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                      DPI Resolution: <span className="text-emerald-400 font-mono font-bold">{dpi} DPI</span>
                    </label>
                    <input
                      type="range" min={72} max={300} step={1} value={dpi}
                      onChange={(e) => setDpi(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer mt-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Pages (optional)
                  </label>
                  <input
                    className="forge-input font-mono"
                    type="text"
                    placeholder="e.g. 0,1,2 — leave empty for all pages"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                  />
                  <p className="text-xs text-slate-600 mt-1.5">
                    Comma-separated 0-indexed page numbers. Output is downloaded as a ZIP archive.
                  </p>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="glass-card border-red-500/30 p-4 text-sm text-red-400">⚠️ {error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!file || processing}
            className="btn-brand w-full py-3.5 text-sm font-semibold"
            style={{ background: processing ? undefined : "linear-gradient(135deg, #10b981, #0d9488)" }}
          >
            {processing
              ? "Processing PDF…"
              : mode === "compress"
              ? "Compress PDF"
              : "Convert PDF → Images"}
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
