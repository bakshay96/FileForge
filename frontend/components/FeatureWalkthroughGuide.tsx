"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles, ChevronLeft, ChevronRight, X, Zap, ShieldCheck,
  RefreshCw, Layers, Crop, Save, FileText, Lock, Crown, ArrowRight,
  Play, Wand2, Eraser, Eye,
} from "lucide-react";
import { useTheme } from "@/app/providers";

interface Step {
  id: number;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  title: string;
  subtitle: string;
  description: string;
  icon: any;
  demoVisual: React.ReactNode;
  actionText: string;
  actionHref: string;
}

export default function FeatureWalkthroughGuide() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto show on first visit to v2.0
  useEffect(() => {
    const hasSeen = localStorage.getItem("ff_v2_walkthrough_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("ff_v2_walkthrough_seen", "1");
  };

  const STEPS: Step[] = [
    {
      id: 1,
      badge: "✨ New UI Core",
      badgeColor: "#facc15",
      badgeBg: "rgba(250,204,21,0.15)",
      title: "Interactive 3D Capabilities Cards",
      subtitle: "Hover or tap to reveal live technical specs",
      description:
        "The 'Why FileForge?' section now features 3D flip cards with custom animations (Lightning Electric, Shield Security, Format Orbit, and Multi-Track Float). Hover or click any card to reveal real-time latency, encryption, and export specs.",
      icon: Zap,
      demoVisual: (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center mx-auto animate-bounce">
            <Zap className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-xs font-bold text-yellow-300">⚡ 3D Flip Card Effect</div>
          <div className="text-[10px] text-slate-300">Flips 180° on hover to display 0.35s Latency &amp; 8x GPU metrics</div>
        </div>
      ),
      actionText: "View Interactive Cards",
      actionHref: "/#why-fileforge-section",
    },
    {
      id: 2,
      badge: "🎬 Canvas Studio",
      badgeColor: "#22d3ee",
      badgeBg: "rgba(34,211,238,0.15)",
      title: "1-Click Aspect Ratio Swapper",
      subtitle: "Instantly reframe for YouTube, Reels, TikTok & Instagram",
      description:
        "Switch canvas dimensions with 1-click presets directly from the right panel or top toolbar: 16:9 Landscape (1920x1080), 9:16 Shorts/Reels (1080x1920), 1:1 Square (1080x1080), and 4:5 Portrait (1080x1350).",
      icon: Crop,
      demoVisual: (
        <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-bold">
          <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">16:9 Landscape</div>
          <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300">9:16 Shorts / TikTok</div>
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">1:1 Instagram Square</div>
          <div className="p-2 rounded-lg bg-pink-500/20 border border-pink-500/40 text-pink-300">4:5 Mobile Feed</div>
        </div>
      ),
      actionText: "Open Canvas Studio",
      actionHref: "/canvas",
    },
    {
      id: 3,
      badge: "🤖 AI Superpowers",
      badgeColor: "#c084fc",
      badgeBg: "rgba(192,132,252,0.15)",
      title: "AI Background Removal & Magic Eraser",
      subtitle: "1-Click foreground isolation & inpainting brush",
      description:
        "Extract subjects from photo or video backgrounds in seconds, generating transparent PNG alpha mattes. Use the Magic Eraser brush to wipe away unwanted objects or text from your canvas.",
      icon: Wand2,
      demoVisual: (
        <div className="flex items-center justify-around p-3 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <div className="text-center">
            <div className="w-8 h-8 rounded-lg bg-slate-700 mx-auto mb-1 flex items-center justify-center text-xs">🖼️</div>
            <div className="text-[9px] text-slate-400">Original</div>
          </div>
          <div className="text-purple-400 font-bold text-xs">➔ AI ➔</div>
          <div className="text-center">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/30 border border-dashed border-cyan-400 mx-auto mb-1 flex items-center justify-center text-xs">✨</div>
            <div className="text-[9px] text-cyan-300 font-bold">Transparent PNG</div>
          </div>
        </div>
      ),
      actionText: "Try AI Background Removal",
      actionHref: "/canvas",
    },
    {
      id: 4,
      badge: "📁 Native Files",
      badgeColor: "#a855f7",
      badgeBg: "rgba(168,85,247,0.15)",
      title: "Save & Load `.forge` Project Files",
      subtitle: "Never lose your timeline edits, filters, or text overlays",
      description:
        "FileForge v2.0 introduces native `.forge` project files. Click 'File ➔ Save Project (.forge)' to export your entire editing state (clips, text tracks, color filters, aspect ratio). Restore it anytime via 'File ➔ Open Project (.forge)'.",
      icon: Save,
      demoVisual: (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-1">
          <div className="text-xs font-bold text-indigo-300 flex items-center justify-center gap-1.5">
            <Save className="w-3.5 h-3.5 text-indigo-400" /> project_timeline.forge
          </div>
          <div className="text-[10px] text-slate-400">Portable JSON bundle containing all tracks, keyframes &amp; filters</div>
        </div>
      ),
      actionText: "Open Canvas Editor",
      actionHref: "/canvas",
    },
    {
      id: 5,
      badge: "📄 PDF Suite",
      badgeColor: "#34d399",
      badgeBg: "rgba(52,211,153,0.15)",
      title: "PDF OCR Text Extraction & Page Organizer",
      subtitle: "Turn scanned PDFs into editable text & reorder pages",
      description:
        "The updated PDF tool now includes OCR Text Extraction to convert scanned PDF documents into plain text, plus an Interactive Page Organizer to visually preview, rotate, reorder, or delete pages before saving.",
      icon: FileText,
      demoVisual: (
        <div className="space-y-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400">
            <span>OCR Extract Status</span>
            <span>100% Success</span>
          </div>
          <div className="p-2 rounded bg-slate-900/80 font-mono text-[9px] text-slate-300">
            "Invoice #2026-08 ... Total: ₹4,990 ... Tax ID: Verified"
          </div>
        </div>
      ),
      actionText: "Try PDF OCR Tool",
      actionHref: "/pdf",
    },
    {
      id: 6,
      badge: "🖼️ Batch Stamper",
      badgeColor: "#60a5fa",
      badgeBg: "rgba(96,165,250,0.15)",
      title: "Batch Image Watermark Stamper",
      subtitle: "Stamp custom logos & text with real-time opacity sliders",
      description:
        "Protect your photography and documents. Under Image Converter options, enable 'Stamp Image Watermark (PRO)' to automatically overlay custom branding text (e.g., '© 2026 ABTech') with 10% to 100% opacity control.",
      icon: RefreshCw,
      demoVisual: (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center space-y-1">
          <div className="text-xs font-bold text-blue-300">Watermark Preview</div>
          <div className="text-[10px] text-blue-200 font-mono">© 2026 ABTech / FileForge PRO (Opacity: 50%)</div>
        </div>
      ),
      actionText: "Try Watermark Converter",
      actionHref: "/convert",
    },
    {
      id: 7,
      badge: "👑 PRO Membership",
      badgeColor: "#f43f5e",
      badgeBg: "rgba(244,63,94,0.15)",
      title: "FileForge PRO Pass & Security Architecture",
      subtitle: "500 MB files, 4K 60fps exports & 60-min auto-purge privacy",
      description:
        "Upgrade to the FileForge PRO Creator Pass (₹499/mo) for 4K exports, 500 MB file limits, and unlimited AI background removal. Learn about our zero-knowledge memory architecture and automated 60-min hard disk purging on the Security &amp; Privacy page.",
      icon: ShieldCheck,
      demoVisual: (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-center space-y-1">
          <div className="text-xs font-bold text-rose-300">🛡️ AES-256 &amp; SSL/TLS 1.3 Security</div>
          <div className="text-[10px] text-slate-300">Zero permanent logs · Auto-purge within 60 minutes</div>
        </div>
      ),
      actionText: "View PRO Plans & Privacy",
      actionHref: "/pricing",
    },
  ];

  const activeStepData = STEPS[currentStep];

  return (
    <>
      {/* Floating Trigger Pill */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs text-white shadow-2xl transition hover:scale-105 active:scale-95 border border-cyan-400/40"
        style={{
          background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
          boxShadow: "0 0 25px rgba(6,182,212,0.4)",
        }}
      >
        <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: "8s" }} />
        <span>What's New in v2.0 Guide</span>
      </button>

      {/* Interactive Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
            style={{
              background: isLight ? "#ffffff" : "linear-gradient(145deg, #0f121e 0%, #141a2e 100%)",
              borderColor: activeStepData.badgeColor,
              boxShadow: `0 0 40px rgba(0,0,0,0.8), inset 0 0 20px ${activeStepData.badgeBg}`,
            }}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}>
              <span
                className="text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border"
                style={{
                  color: activeStepData.badgeColor,
                  background: activeStepData.badgeBg,
                  borderColor: activeStepData.badgeColor,
                }}
              >
                {activeStepData.badge}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  Step {currentStep + 1} of {STEPS.length}
                </span>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Content */}
            <div className="space-y-3 my-2">
              <h2 className="text-xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}>
                {activeStepData.title}
              </h2>
              <p className="text-xs font-semibold" style={{ color: activeStepData.badgeColor }}>
                {activeStepData.subtitle}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: isLight ? "#475569" : "#cbd5e1" }}>
                {activeStepData.description}
              </p>

              {/* Demo Visual Component */}
              <div className="my-3">{activeStepData.demoVisual}</div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t mt-4 flex items-center justify-between" style={{ borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                  className="p-2 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:pointer-events-none transition"
                  style={{
                    borderColor: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
                    color: isLight ? "#334155" : "#e2e8f0",
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentStep === STEPS.length - 1}
                  onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
                  className="p-2 rounded-xl border text-xs font-bold disabled:opacity-30 disabled:pointer-events-none transition"
                  style={{
                    borderColor: isLight ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)",
                    color: isLight ? "#334155" : "#e2e8f0",
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={activeStepData.actionHref}
                  onClick={handleClose}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow-lg active:scale-95"
                  style={{ background: activeStepData.badgeColor }}
                >
                  <span>{activeStepData.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
