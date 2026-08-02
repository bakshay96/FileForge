"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Camera,
  Crop,
  FileText,
  Clock,
  Cloud,
  ArrowRight,
  Zap,
  Shield,
  RefreshCw,
  Layers,
  ChevronRight,
  CheckCircle,
  FileDown,
  Sparkles,
  Scissors,
  Music,
  Film,
  Sliders,
  Maximize2,
  Trash2,
  Lock,
  Frame,
  Check,
  Wand2,
  Copy,
  Layers3,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";

/* ════════════════════════════════════════════════════════
   REALISTIC AUTO-SCROLLING DEMO SLIDES FOR EACH CARD
════════════════════════════════════════════════════════ */
const CARD_SLIDES = {
  convert: [
    {
      title: "JPG ➔ WebP Converter",
      badge: "85% Saved",
      bg: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(34,211,238,0.18))",
      content: (
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className="text-purple-300 dark:text-purple-300">sample_photo.jpg (4.2 MB)</span>
            <span className="text-cyan-400 font-mono font-bold">➔ photo.webp (620 KB)</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 w-[85%] animate-pulse" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Quality: 85%</span>
            <span className="text-emerald-400 font-bold">Saved 3.58 MB</span>
          </div>
        </div>
      ),
    },
    {
      title: "Format Selection Dropdown",
      badge: "50+ Formats",
      bg: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.18))",
      content: (
        <div className="space-y-1.5 text-left">
          <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
            {["PNG", "WEBP", "JPG"].map((fmt) => (
              <div key={fmt} className="p-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">
                {fmt}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
            <span>SVG, TIFF, BMP, ICO Supported</span>
            <span className="text-cyan-400 font-semibold">Select ➔</span>
          </div>
        </div>
      ),
    },
    {
      title: "Batch Format Convert",
      badge: "Instant ZIP",
      bg: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(168,85,247,0.18))",
      content: (
        <div className="space-y-1 text-left text-[10px]">
          <div className="flex items-center justify-between font-medium text-slate-300">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-400" /> 5 Files Converted
            </span>
            <span className="text-indigo-300 font-mono">ZIP Ready</span>
          </div>
          <p className="text-[9px] text-slate-400">Parallel conversion engine completed in 1.2s</p>
        </div>
      ),
    },
  ],

  canvas: [
    {
      title: "Multi-Track Video Studio",
      badge: "Timeline + Cut",
      bg: "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(239,68,68,0.18))",
      content: (
        <div className="space-y-1.5 text-left text-[10px]">
          <div className="flex items-center justify-between font-mono text-amber-400 font-bold">
            <span>🎬 Video: 02.4s / 15.0s</span>
            <span className="text-orange-400">Speed: 1.5x</span>
          </div>
          <div className="h-2 rounded bg-orange-500/30 border border-orange-500/50 relative overflow-hidden">
            <div className="absolute inset-y-0 left-[15%] right-[25%] bg-orange-500/60" />
            <div className="absolute top-0 bottom-0 left-[45%] w-0.5 bg-white" />
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span className="text-emerald-400 font-semibold">🎵 Audio Waveform Layer</span>
            <span className="text-amber-300 font-semibold">✍️ Timed Text Clip</span>
          </div>
        </div>
      ),
    },
    {
      title: "Aspect Ratio & Speed",
      badge: "16:9 / 9:16 / 1:1",
      bg: "linear-gradient(135deg, rgba(34,211,238,0.18), rgba(99,102,241,0.18))",
      content: (
        <div className="space-y-1.5 text-left text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-cyan-300 font-bold flex items-center gap-1">
              <Frame className="w-3 h-3 text-cyan-400" /> Shorts &amp; Reels Presets
            </span>
            <span className="text-amber-300 font-bold">0.5x ➔ 2.0x</span>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-bold">
            {["16:9", "9:16", "1:1", "4:5"].map((r) => (
              <div key={r} className="p-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-200">
                {r}
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "AI Auto Enhance & Palette",
      badge: "1-Click AI",
      bg: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(244,114,182,0.18))",
      content: (
        <div className="space-y-1.5 text-left text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-purple-300 font-bold flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-purple-400" /> Histogram Auto-Tuned
            </span>
            <span className="text-pink-400 font-mono text-[9px]">Palette Extracted</span>
          </div>
          <div className="flex gap-1 justify-center pt-0.5">
            {["#3b82f6", "#ef4444", "#eab308", "#22c55e", "#a855f7", "#ec4899"].map((c) => (
              <div key={c} className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ background: c }} />
            ))}
          </div>
        </div>
      ),
    },
  ],

  pdf: [
    {
      title: "Smart PDF Compressor",
      badge: "-77% Saved",
      bg: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(59,130,246,0.18))",
      content: (
        <div className="space-y-1.5 text-left text-[10px]">
          <div className="flex items-center justify-between font-bold text-indigo-300">
            <span>document.pdf</span>
            <span className="text-emerald-400 font-mono">12.4 MB ➔ 2.8 MB</span>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-center flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Compression Complete
          </div>
        </div>
      ),
    },
    {
      title: "PDF Page Extractor",
      badge: "ZIP Export",
      bg: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(34,211,238,0.18))",
      content: (
        <div className="space-y-1 text-left text-[10px]">
          <div className="grid grid-cols-3 gap-1 text-center text-[9px]">
            {[1, 2, 3].map((p) => (
              <div key={p} className="p-1.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 font-semibold">
                Page {p} 📄
              </div>
            ))}
          </div>
          <p className="text-[9px] text-slate-400 text-center">Convert PDF pages to individual JPG/PNG images</p>
        </div>
      ),
    },
    {
      title: "PDF Merge & Re-order",
      badge: "Multi-Doc",
      bg: "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(99,102,241,0.18))",
      content: (
        <div className="space-y-1 text-left text-[10px]">
          <div className="flex items-center justify-between text-indigo-300 font-semibold">
            <span>Merged 3 files into 1 PDF</span>
            <span className="text-cyan-400 font-bold">14.8 MB</span>
          </div>
          <div className="p-1 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[9px] text-center font-mono">
            doc_1.pdf + doc_2.pdf + doc_3.pdf
          </div>
        </div>
      ),
    },
  ],

  history: [
    {
      title: "Recent Activity Log",
      badge: "Indian Standard",
      bg: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(16,185,129,0.18))",
      content: (
        <div className="space-y-1 text-left text-[10px]">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="truncate max-w-[130px] font-semibold">project_banner.webp</span>
            <span className="text-emerald-400 font-bold">Converted</span>
          </div>
          <p className="text-[9px] text-slate-400 font-mono">02/08/2026, 02:45 PM</p>
        </div>
      ),
    },
    {
      title: "Auto-Delete Protection",
      badge: "30m Timer",
      bg: "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(249,115,22,0.18))",
      content: (
        <div className="space-y-1 text-left text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-red-400 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Auto-Purge Storage
            </span>
            <span className="font-mono text-amber-300 font-bold">29m 45s left</span>
          </div>
          <p className="text-[9px] text-slate-400">Files automatically purged from server for 100% privacy</p>
        </div>
      ),
    },
    {
      title: "Instant Download & Purge",
      badge: "1-Click",
      bg: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(168,85,247,0.18))",
      content: (
        <div className="flex items-center justify-between gap-2 text-[10px]">
          <div className="p-1.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex-1 text-center flex items-center justify-center gap-1">
            <Download className="w-3 h-3" /> Download
          </div>
          <div className="p-1.5 rounded bg-red-500/20 text-red-400 font-bold flex-1 text-center flex items-center justify-center gap-1">
            <Trash2 className="w-3 h-3" /> Purge Now
          </div>
        </div>
      ),
    },
  ],
};

/* ════════════════════════════════════════════════════════
   AUTO-SCROLLING FEATURE CARD COMPONENT
════════════════════════════════════════════════════════ */
function AutoScrollerCard({
  href,
  icon: Icon,
  iconColor,
  iconBg,
  borderColor,
  glowColor,
  title,
  desc,
  badge,
  slides,
}: {
  href: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  borderColor: string;
  glowColor: string;
  title: string;
  desc: string;
  badge?: string | null;
  slides: typeof CARD_SLIDES.convert;
}) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % slides.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [isHovered, slides.length]);

  const activeSlide = slides[slideIdx];

  return (
    <Link
      href={href}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl p-5 text-left border transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between overflow-hidden shadow-xl"
      style={{
        background: `radial-gradient(ellipse at top, ${glowColor}, transparent 70%), var(--color-surface, #0f1117)`,
        borderColor,
      }}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 transition-transform group-hover:scale-110"
            style={{ background: iconBg }}
          >
            <Icon className={`w-5.5 h-5.5 ${iconColor}`} />
          </div>
          {badge && (
            <div
              className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}
            >
              {badge}
            </div>
          )}
        </div>

        <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 mb-1.5" style={{ fontFamily: "'Outfit', sans-serif" }}>
          {title}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{desc}</p>
      </div>

      {/* ── AUTO-SCROLLING DEMO SLIDER BOX ── */}
      <div className="mt-2 pt-3 border-t border-white/10">
        <div
          className="rounded-xl p-3 border border-white/10 transition-all duration-300 min-h-[82px] flex flex-col justify-between"
          style={{ background: activeSlide.bg }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-extrabold text-slate-100 dark:text-slate-100 uppercase tracking-wider">
              {activeSlide.title}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/15 text-cyan-300">
              {activeSlide.badge}
            </span>
          </div>

          {activeSlide.content}
        </div>

        {/* Slider Indicator Dots */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.preventDefault();
                  setSlideIdx(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === slideIdx ? "w-5 bg-cyan-400" : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
          <div className={`text-[11px] font-bold flex items-center gap-1 ${iconColor} group-hover:translate-x-1 transition-transform`}>
            Explore Tool <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN HOME PAGE COMPONENT
════════════════════════════════════════════════════════ */
export default function HomePage() {
  const handleFileSelected = (_file: File) => {
    window.location.href = "/convert";
  };

  const WHY_ITEMS = [
    { icon: Zap, color: "text-yellow-400", bg: "rgba(234,179,8,0.1)", title: "Lightning Fast", desc: "Server-side conversion in seconds with parallel processing." },
    { icon: Shield, color: "text-green-400", bg: "rgba(74,222,128,0.1)", title: "100% Secure", desc: "Files auto-deleted after 1 hour. End-to-end privacy guaranteed." },
    { icon: RefreshCw, color: "text-blue-400", bg: "rgba(96,165,250,0.1)", title: "50+ Formats", desc: "Image, PDF, Audio, Video — all under one roof." },
    { icon: Layers, color: "text-purple-400", bg: "rgba(196,181,253,0.1)", title: "Canvas Studio", desc: "Multi-track editor with video trim, audio layer & AI tools." },
  ];

  return (
    <div className="min-h-screen text-slate-100 flex flex-col" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-16 px-6 overflow-hidden text-center">
        <div className="absolute top-20 left-1/3 w-96 h-96 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-32 right-1/4 w-80 h-80 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", filter: "blur(80px)" }} />

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 text-xs text-slate-300 mb-6 shadow-sm"
               style={{ background: "rgba(255,255,255,0.04)" }}>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>The #1 All-in-One Image, Video &amp; PDF Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-5 leading-none"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="gradient-text-hero">Transform your</span>
            <br />
            <span className="gradient-text-hero">media files instantly</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Convert image formats, compress PDFs, and edit multi-track videos with audio layers using our Pro Canvas Studio.
          </p>

          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a href="#quick-start-dropzone"
               onClick={(e) => { e.preventDefault(); document.getElementById("quick-start-dropzone")?.scrollIntoView({ behavior: "smooth" }); }}
               className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-bold text-sm text-white shadow-2xl transition hover:scale-105 active:scale-95 upload-select-pill">
              <Cloud className="w-5 h-5 text-cyan-300" />
              Select Files to Convert
              <ArrowRight className="w-4 h-4 opacity-60" />
            </a>
            <Link href="/canvas"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-sm font-semibold transition hover:scale-105 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))",
                    border: "1px solid rgba(34,211,238,0.3)",
                    color: "#22d3ee",
                    boxShadow: "0 0 20px rgba(34,211,238,0.15)",
                  }}>
              🎨 Open Canvas Studio <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4 FEATURE CARDS WITH REAL AUTO-SCROLLER DEMOS ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <AutoScrollerCard
            href="/convert"
            icon={Camera}
            iconColor="text-purple-400"
            iconBg="rgba(168,85,247,0.12)"
            borderColor="rgba(168,85,247,0.25)"
            glowColor="rgba(168,85,247,0.08)"
            title="Image Convert"
            desc="Instantly convert PNG, JPG, WEBP, SVG, BMP, TIFF to any format with quality control."
            badge="Most Popular"
            slides={CARD_SLIDES.convert}
          />

          <AutoScrollerCard
            href="/canvas"
            icon={Crop}
            iconColor="text-cyan-400"
            iconBg="rgba(34,211,238,0.10)"
            borderColor="rgba(34,211,238,0.22)"
            glowColor="rgba(34,211,238,0.06)"
            title="Canvas Studio"
            desc="Multi-track video timeline, audio cut layer, timed text clips, and AI auto enhance."
            badge="New"
            slides={CARD_SLIDES.canvas}
          />

          <AutoScrollerCard
            href="/pdf"
            icon={FileText}
            iconColor="text-indigo-400"
            iconBg="rgba(99,102,241,0.12)"
            borderColor="rgba(99,102,241,0.25)"
            glowColor="rgba(99,102,241,0.07)"
            title="PDF Tools"
            desc="Merge, Split, Compress, Rotate PDF. Convert PDF to Word, Excel, JPG and more."
            badge={null}
            slides={CARD_SLIDES.pdf}
          />

          <AutoScrollerCard
            href="/history"
            icon={Clock}
            iconColor="text-emerald-400"
            iconBg="rgba(52,211,153,0.10)"
            borderColor="rgba(52,211,153,0.22)"
            glowColor="rgba(52,211,153,0.06)"
            title="Recent Activity"
            desc="Access and manage all your conversions, download links, and saved project files."
            badge={null}
            slides={CARD_SLIDES.history}
          />
        </div>
      </section>

      {/* ── Why FileForge ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="rounded-2xl border border-white/10 p-8 shadow-xl"
             style={{ background: "linear-gradient(135deg, var(--color-surface, #0f1117) 0%, #12182b 100%)" }}>
          <h2 className="text-xl font-bold text-slate-100 dark:text-slate-100 mb-1 text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Why FileForge?
          </h2>
          <p className="text-xs text-slate-400 text-center mb-8">Built for professionals who demand speed, security, and beauty.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WHY_ITEMS.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="text-center p-4 rounded-xl border border-white/5 hover:border-white/10 transition"
                   style={{ background: "rgba(255,255,255,0.02)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                     style={{ background: bg }}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Start Dropzone ── */}
      <section id="quick-start-dropzone" className="max-w-6xl mx-auto px-6 mb-16 w-full">
        <div className="rounded-2xl border border-white/10 p-10 text-center shadow-2xl"
             style={{ background: "linear-gradient(135deg, var(--color-surface, #0f1117), #111827)" }}>
          <h3 className="text-xl font-bold text-slate-100 dark:text-slate-100 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Quick Start
          </h3>
          <p className="text-xs text-slate-400 mb-7">
            Drag &amp; drop or browse files. Supports JPG, PNG, WEBP, PDF, SVG and more up to 20 MB.
          </p>
          <div className="max-w-xl mx-auto">
            <DropZone
              onFileSelected={handleFileSelected}
              label="Drag &amp; Drop file upload"
              hint="Supports JPG, PNG, WEBP, PDF, SVG up to 20 MB"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-slate-400 mt-auto"
              style={{ background: "var(--color-bg, #07080c)" }}>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4 font-medium">
          {["about", "blog", "support", "pricing", "api-docs", "terms", "privacy"].map((page) => (
            <Link key={page} href={`/${page}`}
                  className="capitalize hover:text-cyan-400 transition">
              {page === "api-docs" ? "API" : page.charAt(0).toUpperCase() + page.slice(1)}
            </Link>
          ))}
        </div>
        <p className="text-slate-400">
          © {new Date().getFullYear()}{" "}
          <span className="text-slate-300 font-semibold">ABTech Solution</span>. All Rights Reserved.
          Contact:{" "}
          <a href="mailto:care.abtech@gmail.com" className="text-cyan-400 hover:underline">
            care.abtech@gmail.com
          </a>
        </p>
      </footer>
    </div>
  );
}
