"use client";

import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera, Crop, FileText, Clock, Cloud, ArrowRight, Zap, Shield,
  RefreshCw, Layers, ChevronRight, CheckCircle, Download, Trash2,
  Lock, Frame, Wand2, ChevronLeft,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";
import { useTheme } from "@/app/providers";


/* ════════════════════════════════════════════════════════
   CARD DATA
════════════════════════════════════════════════════════ */
const CARDS = [
  {
    id: "convert",
    href: "/convert",
    icon: Camera,
    iconColor: "text-purple-400",
    iconBg: "rgba(168,85,247,0.18)",
    accentColor: "#a855f7",
    accentRgb: "168,85,247",
    borderColor: "rgba(168,85,247,0.5)",
    glowColor: "rgba(168,85,247,0.25)",
    title: "Image Convert",
    desc: "Instantly convert PNG, JPG, WEBP, SVG, BMP, TIFF to any format with quality control.",
    badge: "Most Popular",
    badgeBg: "linear-gradient(135deg,#7c3aed,#06b6d4)",
    slides: [
      {
        title: "FORMAT SELECTION DROPDOWN",
        badge: "50+ Formats",
        bg: "linear-gradient(135deg,rgba(168,85,247,0.22),rgba(34,211,238,0.18))",
        content: (
          <div className="space-y-1.5 text-left">
            <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold">
              {["PNG", "WEBP", "JPG"].map((f) => (
                <div key={f} className="p-1 rounded-md bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">{f}</div>
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
        title: "JPG ➔ WEBP CONVERTER",
        badge: "85% Saved",
        bg: "linear-gradient(135deg,rgba(99,102,241,0.22),rgba(168,85,247,0.18))",
        content: (
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between text-[10px] font-semibold">
              <span className="text-purple-300">photo.jpg (4.2 MB)</span>
              <span className="text-cyan-400 font-mono font-bold">➔ 620 KB</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 w-[85%] animate-pulse" />
            </div>
            <div className="flex justify-between text-[9px] text-slate-400">
              <span>Quality: 85%</span>
              <span className="text-emerald-400 font-bold">Saved 3.58 MB</span>
            </div>
          </div>
        ),
      },
      {
        title: "BATCH CONVERT",
        badge: "Instant ZIP",
        bg: "linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.18))",
        content: (
          <div className="space-y-1 text-left text-[10px]">
            <div className="flex items-center justify-between font-semibold text-slate-300">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> 5 Files Converted
              </span>
              <span className="text-indigo-300 font-mono">ZIP Ready</span>
            </div>
            <p className="text-[9px] text-slate-400">Parallel engine completed in 1.2s</p>
          </div>
        ),
      },
    ],
  },
  {
    id: "canvas",
    href: "/canvas",
    icon: Crop,
    iconColor: "text-cyan-400",
    iconBg: "rgba(34,211,238,0.14)",
    accentColor: "#22d3ee",
    accentRgb: "34,211,238",
    borderColor: "rgba(34,211,238,0.5)",
    glowColor: "rgba(34,211,238,0.25)",
    title: "Canvas Studio",
    desc: "Multi-track video timeline, audio cut layer, timed text clips, and AI auto enhance.",
    badge: "New",
    badgeBg: "linear-gradient(135deg,#0891b2,#6366f1)",
    slides: [
      {
        title: "MULTI-TRACK VIDEO STUDIO",
        badge: "Timeline + Cut",
        bg: "linear-gradient(135deg,rgba(249,115,22,0.22),rgba(239,68,68,0.18))",
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
            <div className="flex justify-between text-[9px] text-slate-400">
              <span className="text-emerald-400 font-semibold">🎵 Audio Waveform Layer</span>
              <span className="text-amber-300 font-semibold">✍️ Timed Text Clip</span>
            </div>
          </div>
        ),
      },
      {
        title: "ASPECT RATIO & SPEED",
        badge: "16:9 / 9:16 / 1:1",
        bg: "linear-gradient(135deg,rgba(34,211,238,0.18),rgba(99,102,241,0.18))",
        content: (
          <div className="space-y-1.5 text-left text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Frame className="w-3 h-3 text-cyan-400" /> Shorts & Reels
              </span>
              <span className="text-amber-300 font-bold">0.5x ➔ 2.0x</span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center text-[9px] font-bold">
              {["16:9","9:16","1:1","4:5"].map((r) => (
                <div key={r} className="p-1 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-200">{r}</div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: "AI AUTO ENHANCE & PALETTE",
        badge: "1-Click AI",
        bg: "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(244,114,182,0.18))",
        content: (
          <div className="space-y-1.5 text-left text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 font-bold flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-purple-400" /> Histogram Tuned
              </span>
              <span className="text-pink-400 font-mono text-[9px]">Palette Extracted</span>
            </div>
            <div className="flex gap-1 justify-center pt-0.5">
              {["#3b82f6","#ef4444","#eab308","#22c55e","#a855f7","#ec4899"].map((c) => (
                <div key={c} className="w-4 h-4 rounded-full border border-white/20" style={{ background: c }} />
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "pdf",
    href: "/pdf",
    icon: FileText,
    iconColor: "text-indigo-400",
    iconBg: "rgba(99,102,241,0.14)",
    accentColor: "#818cf8",
    accentRgb: "99,102,241",
    borderColor: "rgba(99,102,241,0.5)",
    glowColor: "rgba(99,102,241,0.25)",
    title: "PDF Tools",
    desc: "Merge, Split, Compress, Rotate PDF. Convert PDF to Word, Excel, JPG and more.",
    badge: null,
    badgeBg: "",
    slides: [
      {
        title: "PDF PAGE EXTRACTOR",
        badge: "ZIP Export",
        bg: "linear-gradient(135deg,rgba(59,130,246,0.22),rgba(34,211,238,0.18))",
        content: (
          <div className="space-y-1 text-left text-[10px]">
            <div className="grid grid-cols-3 gap-1 text-center text-[9px]">
              {[1,2,3].map((p) => (
                <div key={p} className="p-1.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 font-semibold">Page {p} 📄</div>
              ))}
            </div>
            <p className="text-[9px] text-slate-400 text-center">Convert PDF pages to individual JPG/PNG images</p>
          </div>
        ),
      },
      {
        title: "SMART PDF COMPRESSOR",
        badge: "-77% Saved",
        bg: "linear-gradient(135deg,rgba(99,102,241,0.22),rgba(59,130,246,0.18))",
        content: (
          <div className="space-y-1.5 text-left text-[10px]">
            <div className="flex items-center justify-between font-bold text-indigo-300">
              <span>document.pdf</span>
              <span className="text-emerald-400 font-mono">12.4 MB ➔ 2.8 MB</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> Compression Complete
            </div>
          </div>
        ),
      },
      {
        title: "PDF MERGE & RE-ORDER",
        badge: "Multi-Doc",
        bg: "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(99,102,241,0.18))",
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
  },
  {
    id: "history",
    href: "/history",
    icon: Clock,
    iconColor: "text-emerald-400",
    iconBg: "rgba(52,211,153,0.14)",
    accentColor: "#34d399",
    accentRgb: "52,211,153",
    borderColor: "rgba(52,211,153,0.5)",
    glowColor: "rgba(52,211,153,0.25)",
    title: "Recent Activity",
    desc: "Access and manage all your conversions, download links, and saved project files.",
    badge: "Activity",
    badgeBg: "linear-gradient(135deg,#059669,#0891b2)",
    slides: [
      {
        title: "AUTO-DELETE PROTECTION",
        badge: "30m Timer",
        bg: "linear-gradient(135deg,rgba(239,68,68,0.22),rgba(249,115,22,0.18))",
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
        title: "RECENT ACTIVITY LOG",
        badge: "Indian Standard",
        bg: "linear-gradient(135deg,rgba(52,211,153,0.18),rgba(16,185,129,0.18))",
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
        title: "INSTANT DOWNLOAD & PURGE",
        badge: "1-Click",
        bg: "linear-gradient(135deg,rgba(59,130,246,0.18),rgba(168,85,247,0.18))",
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
  },
];

/* ════════════════════════════════════════════════════════
   FEATURE CARD — with hover boom + per-card slide scroller
════════════════════════════════════════════════════════ */
function FeatureCard({
  card,
  isActive,
  isLight,
  pauseParent,
  resumeParent,
}: {
  card: typeof CARDS[0];
  isActive: boolean;
  isLight: boolean;
  pauseParent: () => void;
  resumeParent: () => void;
}) {
  const Icon = card.icon;
  const [slideIdx, setSlideIdx] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!isActive || hovered) return;
    const t = setInterval(() => setSlideIdx((p) => (p + 1) % card.slides.length), 3000);
    return () => clearInterval(t);
  }, [isActive, hovered, card.slides.length]);

  const activeSlide = card.slides[slideIdx];

  const cardBg = isLight
    ? `radial-gradient(ellipse at top left, rgba(${card.accentRgb},0.08), transparent 60%), rgba(255,255,255,0.95)`
    : `radial-gradient(ellipse at top left, ${card.glowColor}, transparent 65%), #0d1120`;

  return (
    <div
      onMouseEnter={() => { setHovered(true); if (isActive) pauseParent(); }}
      onMouseLeave={() => { setHovered(false); if (isActive) resumeParent(); }}
      className="relative rounded-2xl p-5 flex flex-col justify-between overflow-hidden h-full transition-transform duration-300"
      style={{
        background: cardBg,
        border: `1px solid ${isActive
          ? card.borderColor
          : isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
        boxShadow: isActive && hovered
          ? `0 0 48px rgba(${card.accentRgb},0.5), 0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`
          : isActive
          ? `0 0 28px rgba(${card.accentRgb},0.28), inset 0 1px 0 rgba(255,255,255,0.06)`
          : isLight ? "0 4px 24px rgba(0,0,0,0.08)" : "0 4px 24px rgba(0,0,0,0.4)",
        transform: isActive && hovered ? "scale(1.04) translateY(-4px)" : "scale(1)",
      }}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border"
            style={{
              background: card.iconBg,
              borderColor: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)",
            }}
          >
            <Icon className={`w-5 h-5 ${card.iconColor}`} />
          </div>
          {card.badge && (
            <div className="px-2 py-0.5 rounded-full text-[9px] font-bold text-white shadow" style={{ background: card.badgeBg }}>
              {card.badge}
            </div>
          )}
        </div>
        <h3
          className="text-[14px] font-bold mb-1"
          style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}
        >
          {card.title}
        </h3>
        <p className="text-[10px] leading-relaxed mb-3" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
          {card.desc}
        </p>
      </div>

      {/* Slide demo */}
      <div className="border-t pt-3" style={{ borderColor: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.1)" }}>
        <div
          className="rounded-xl p-2.5 border min-h-[82px] flex flex-col justify-between"
          style={{
            background: activeSlide.bg,
            borderColor: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: isLight ? "#0f1117" : "#f1f5f9" }}>
              {activeSlide.title}
            </span>
            <span className="text-[7px] font-bold px-1.5 py-0.5 rounded text-cyan-300" style={{ background: "rgba(255,255,255,0.15)" }}>
              {activeSlide.badge}
            </span>
          </div>
          {activeSlide.content}
        </div>
        <div className="flex items-center justify-between mt-2 px-0.5">
          <div className="flex items-center gap-1.5">
            {card.slides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setSlideIdx(i); }}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === slideIdx ? "18px" : "6px",
                  background: i === slideIdx ? card.accentColor : isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
          <Link
            href={card.href}
            onClick={(e) => e.stopPropagation()}
            className={`text-[10px] font-bold flex items-center gap-1 hover:underline ${card.iconColor}`}
          >
            Explore Tool <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   3D COVERFLOW CAROUSEL — Exact Image Replica
   Ring layers sit BEHIND cards (z-index 2–4).
   Cards sit at z-index 20–40. Nav is BELOW stage.
════════════════════════════════════════════════════════ */
function CoverflowCarousel({ isLight }: { isLight: boolean }) {
  const [activeIdx, setActiveIdx] = useState(1);
  const [paused, setPaused] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const N = CARDS.length;

  const startAuto = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => setActiveIdx((p) => (p + 1) % N), 4000);
  }, [N]);

  useEffect(() => {
    if (!paused) startAuto();
    else if (autoRef.current) clearInterval(autoRef.current);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [paused, startAuto]);

  const go = (dir: 1 | -1) => {
    setPaused(true);
    setActiveIdx((p) => (p + dir + N) % N);
    setTimeout(() => setPaused(false), 8000);
  };

  const selectCard = (i: number) => {
    if (i === activeIdx) return;
    setPaused(true);
    setActiveIdx(i);
    setTimeout(() => setPaused(false), 8000);
  };

  type SlotStyle = { x: number; z: number; ry: number; scale: number; opacity: number; zIndex: number };
  const SLOTS: SlotStyle[] = [
    { x: 0,    z: 0,    ry: 0,   scale: 1,    opacity: 1,    zIndex: 40 },  // center
    { x: 305,  z: -210, ry: -40, scale: 0.76, opacity: 0.72, zIndex: 30 },  // right-1
    { x: 490,  z: -390, ry: -55, scale: 0.56, opacity: 0.38, zIndex: 20 },  // right-2
    { x: -305, z: -210, ry: 40,  scale: 0.76, opacity: 0.72, zIndex: 30 },  // left-1
  ];

  const getSlot = (i: number): SlotStyle => {
    const diff = ((i - activeIdx) % N + N) % N;
    if (diff === 0) return SLOTS[0];
    if (diff === 1) return SLOTS[1];
    if (diff === N - 1) return SLOTS[3];
    return SLOTS[2];
  };

  const activeCard = CARDS[activeIdx];
  const ringColor = activeCard.accentRgb;

  return (
    <div className="relative w-full select-none">
      {/* ─── 3D Stage ─── */}
      {/* Stage is 380px tall. Cards are pinned at top:50px (height 280px → bottom at 330px).
          Ring uses scaleY(0.12) so it appears as a flat ellipse at EXACTLY top:330px — no
          3D perspective surprises. Cards have z-index 20-40, rings have z-index 2-5. */}
      <div
        className="relative flex items-center justify-center overflow-visible"
        style={{ height: "380px", perspective: "1400px" }}
      >
        {/* ── ACTIVE label — pinned directly above the center card ── */}
        <div
          className="absolute flex flex-col items-center z-50 pointer-events-none"
          style={{ top: "44px", left: "50%", transform: "translateX(-50%) translateY(-100%)" }}
        >
          <span
            className="text-[10px] font-black tracking-[0.28em]"
            style={{ color: activeCard.accentColor, textShadow: isLight ? "none" : `0 0 12px ${activeCard.accentColor}` }}
          >
            ACTIVE
          </span>
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" className="mt-0.5">
            <path d="M7 8L0.5 0.5h13L7 8z" fill={activeCard.accentColor} opacity="0.9" />
          </svg>
        </div>

        {/* ── ORBIT RINGS ── scaleY(0.12) creates a true flat ellipse at EXACTLY top:330px ──
            Cards have bottom edge at top:330px (top:50px + height:280px).
            Ring z-index 2-5, cards z-index 20-40 → cards always render ABOVE the ring. */}

        {/* Ring 1 — core glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "860px",
            height: "860px",
            top: "330px",
            left: "50%",
            transform: "translate(-50%, -50%) scaleY(0.12)",
            borderRadius: "50%",
            border: `2.5px solid rgba(${ringColor},0.65)`,
            boxShadow: `0 0 28px rgba(${ringColor},0.55), inset 0 0 20px rgba(${ringColor},0.15)`,
            transition: "border-color 0.7s, box-shadow 0.7s",
            zIndex: 5,
          }}
        />
        {/* Ring 2 — bright highlight */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "900px",
            height: "900px",
            top: "330px",
            left: "50%",
            transform: "translate(-50%, -50%) scaleY(0.12)",
            borderRadius: "50%",
            border: `1.5px solid rgba(${ringColor},0.9)`,
            boxShadow: `0 0 40px rgba(${ringColor},0.5)`,
            transition: "border-color 0.7s, box-shadow 0.7s",
            zIndex: 4,
          }}
        />
        {/* Ring 3 — outer halo */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "980px",
            height: "980px",
            top: "330px",
            left: "50%",
            transform: "translate(-50%, -50%) scaleY(0.12)",
            borderRadius: "50%",
            border: `1px solid rgba(${ringColor},0.35)`,
            boxShadow: `0 0 70px rgba(${ringColor},0.2)`,
            transition: "border-color 0.7s, box-shadow 0.7s",
            zIndex: 3,
          }}
        />

        {/* Center ambient radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: "560px", height: "560px",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            background: `radial-gradient(circle, rgba(${ringColor},${isLight ? "0.06" : "0.13"}), transparent 65%)`,
            filter: "blur(48px)",
            transition: "background 0.8s",
            zIndex: 1,
          }}
        />

        {/* ── CARDS — top:50px so bottom edge = 50+280 = 330px (matches ring centre) ── */}
        <div
          className="absolute"
          style={{ top: "50px", left: "50%", transform: "translateX(-140px)", width: "280px", transformStyle: "preserve-3d", zIndex: 50 }}
        >
          {CARDS.map((card, i) => {
            const slot = getSlot(i);
            const diff = ((i - activeIdx) % N + N) % N;
            return (
              <div
                key={card.id}
                onClick={() => selectCard(i)}
                className="absolute top-0 left-0 transition-all duration-700 ease-in-out"
                style={{
                  width: "280px",
                  height: "280px",
                  transform: `translateX(${slot.x}px) translateZ(${slot.z}px) rotateY(${slot.ry}deg) scale(${slot.scale})`,
                  opacity: slot.opacity,
                  zIndex: slot.zIndex,
                  cursor: i !== activeIdx ? "pointer" : "default",
                  transformStyle: "preserve-3d",
                  pointerEvents: diff <= 2 ? "auto" : "none",
                }}
              >
                <FeatureCard
                  card={card}
                  isActive={i === activeIdx}
                  isLight={isLight}
                  pauseParent={() => setPaused(true)}
                  resumeParent={() => setPaused(false)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── NAVIGATION DOTS ── */}
      <div className="flex items-center justify-center gap-2 mt-4 relative z-10">
        {CARDS.map((card, i) => (
          <button
            key={card.id}
            onClick={() => selectCard(i)}
            className="rounded-full transition-all duration-300 cursor-pointer"
            style={{
              width: i === activeIdx ? "24px" : "8px",
              height: "8px",
              background: i === activeIdx
                ? card.accentColor
                : isLight ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)",
              boxShadow: i === activeIdx ? `0 0 10px ${card.accentColor}` : "none",
            }}
            aria-label={`Go to ${card.title}`}
          />
        ))}
      </div>

      {/* Active card title */}
      <div className="text-center mt-2">
        <span
          className="text-xs font-semibold transition-all duration-500"
          style={{ color: activeCard.accentColor, fontFamily: "'Outfit',sans-serif" }}
        >
          {activeCard.title}
        </span>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════
   MAIN HOME PAGE
════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const handleFileSelected = (_file: File) => {
    window.location.href = "/convert";
  };

  const WHY_ITEMS = [
    { icon: Zap,       color: "text-yellow-400", bg: "rgba(234,179,8,0.1)",   title: "Lightning Fast",  desc: "Server-side conversion in seconds with parallel processing." },
    { icon: Shield,    color: "text-green-400",  bg: "rgba(74,222,128,0.1)",  title: "100% Secure",     desc: "Files auto-deleted after 1 hour. End-to-end privacy guaranteed." },
    { icon: RefreshCw, color: "text-blue-400",   bg: "rgba(96,165,250,0.1)",  title: "50+ Formats",     desc: "Image, PDF, Audio, Video — all under one roof." },
    { icon: Layers,    color: "text-purple-400", bg: "rgba(196,181,253,0.1)", title: "Canvas Studio",   desc: "Multi-track editor with video trim, audio layer & AI tools." },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)", color: isLight ? "#0f1117" : "#f1f5f9" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-2 px-6 overflow-hidden text-center">
        <div className="absolute top-20 left-1/3 w-96 h-96 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-32 right-1/4 w-80 h-80 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle,#06b6d4,transparent 70%)", filter: "blur(80px)" }} />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs mb-6 shadow-sm"
               style={{ background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)", borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)", color: isLight ? "#334155" : "#cbd5e1" }}>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>The #1 All-in-One Image, Video &amp; PDF Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-5 leading-none"
              style={{ fontFamily: "'Outfit',sans-serif" }}>
            <span className="gradient-text-hero">Transform your</span>
            <br />
            <span className="gradient-text-hero">media files instantly</span>
          </h1>
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
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
                    background: "linear-gradient(135deg,rgba(34,211,238,0.15),rgba(99,102,241,0.15))",
                    border: "1px solid rgba(34,211,238,0.3)",
                    color: "#22d3ee",
                    boxShadow: "0 0 20px rgba(34,211,238,0.15)",
                  }}>
              🎨 Open Canvas Studio <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3D COVERFLOW CAROUSEL ── */}
      <section className="max-w-6xl mx-auto px-6 pb-20 w-full overflow-visible">
        <CoverflowCarousel isLight={isLight} />
      </section>

      {/* ── Why FileForge ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="rounded-2xl border p-8 shadow-xl"
             style={{
               background: isLight ? "rgba(255,255,255,0.8)" : "linear-gradient(135deg,#0f1117 0%,#12182b 100%)",
               borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
             }}>
          <h2 className="text-xl font-bold mb-1 text-center" style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}>
            Why FileForge?
          </h2>
          <p className="text-xs text-center mb-8" style={{ color: isLight ? "#64748b" : "#64748b" }}>Built for professionals who demand speed, security, and beauty.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {WHY_ITEMS.map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className="text-center p-4 rounded-xl border transition"
                   style={{ background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)", borderColor: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: bg }}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-sm font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}>{title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Start Dropzone ── */}
      <section id="quick-start-dropzone" className="max-w-6xl mx-auto px-6 mb-16 w-full">
        <div className="rounded-2xl border p-10 text-center shadow-2xl"
             style={{
               background: isLight ? "rgba(255,255,255,0.8)" : "linear-gradient(135deg,#0f1117,#111827)",
               borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
             }}>
          <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}>Quick Start</h3>
          <p className="text-xs mb-7" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>Drag &amp; drop or browse files. Supports JPG, PNG, WEBP, PDF, SVG and more up to 20 MB.</p>
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
      <footer className="border-t py-8 px-6 text-center text-xs mt-auto"
              style={{ background: isLight ? "#f8fafc" : "#07080c", borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)", color: isLight ? "#64748b" : "#64748b" }}>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4 font-medium">
          {["about","blog","support","pricing","api-docs","terms","privacy"].map((page) => (
            <Link key={page} href={`/${page}`} className="capitalize hover:text-cyan-400 transition">
              {page === "api-docs" ? "API" : page.charAt(0).toUpperCase() + page.slice(1)}
            </Link>
          ))}
        </div>
        <p>
          © {new Date().getFullYear()}{" "}
          <span className="font-semibold" style={{ color: isLight ? "#334155" : "#cbd5e1" }}>ABTech Solution</span>. All Rights Reserved.{" "}
          Contact:{" "}
          <a href="mailto:care.abtech@gmail.com" className="text-cyan-400 hover:underline">care.abtech@gmail.com</a>
        </p>
      </footer>
    </div>
  );
}

