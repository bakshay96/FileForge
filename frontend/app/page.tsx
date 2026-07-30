"use client";

import Link from "next/link";
import { useState } from "react";
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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";

const FEATURE_CARDS = [
  {
    href: "/convert",
    icon: Camera,
    iconColor: "text-purple-400",
    iconBg: "rgba(168,85,247,0.12)",
    borderColor: "rgba(168,85,247,0.25)",
    glowColor: "rgba(168,85,247,0.08)",
    title: "Image Convert",
    desc: "Instantly convert PNG, JPG, WEBP, SVG, BMP, TIFF to any format with quality control.",
    badge: "Most Popular",
  },
  {
    href: "/resize",
    icon: Crop,
    iconColor: "text-cyan-400",
    iconBg: "rgba(34,211,238,0.10)",
    borderColor: "rgba(34,211,238,0.22)",
    glowColor: "rgba(34,211,238,0.06)",
    title: "Resize & Edit",
    desc: "Batch resize, crop, rotate, enhance & annotate images using our Canvas Studio.",
    badge: "Premium",
  },
  {
    href: "/pdf",
    icon: FileText,
    iconColor: "text-indigo-400",
    iconBg: "rgba(99,102,241,0.12)",
    borderColor: "rgba(99,102,241,0.25)",
    glowColor: "rgba(99,102,241,0.07)",
    title: "PDF Tools",
    desc: "Merge, Split, Compress, Rotate PDF. Convert PDF to Word, Excel, JPG and more.",
    badge: null,
  },
  {
    href: "/history",
    icon: Clock,
    iconColor: "text-emerald-400",
    iconBg: "rgba(52,211,153,0.10)",
    borderColor: "rgba(52,211,153,0.22)",
    glowColor: "rgba(52,211,153,0.06)",
    title: "Recent Activity",
    desc: "Access and manage all your conversions, download links, and saved project files.",
    badge: null,
  },
];

const WHY_ITEMS = [
  { icon: Zap, color: "text-yellow-400", bg: "rgba(234,179,8,0.1)", title: "Lightning Fast", desc: "Server-side conversion in seconds with parallel processing." },
  { icon: Shield, color: "text-green-400", bg: "rgba(74,222,128,0.1)", title: "100% Secure", desc: "Files auto-deleted after 1 hour. End-to-end privacy guaranteed." },
  { icon: RefreshCw, color: "text-blue-400", bg: "rgba(96,165,250,0.1)", title: "50+ Formats", desc: "Image, PDF, Audio, Video — all under one roof." },
  { icon: Layers, color: "text-purple-400", bg: "rgba(196,181,253,0.1)", title: "Canvas Studio", desc: "Premium pixel-perfect editor with filters, crop & text tools." },
];

export default function HomePage() {
  const handleFileSelected = (_file: File) => {
    window.location.href = "/convert";
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden text-center">
        {/* ambient glow blobs */}
        <div className="absolute top-20 left-1/3 w-96 h-96 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute top-32 right-1/4 w-80 h-80 rounded-full opacity-10 pointer-events-none"
             style={{ background: "radial-gradient(circle, #06b6d4, transparent 70%)", filter: "blur(80px)" }} />

        {/* floating dot accents */}
        <div className="absolute top-28 left-1/4 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse opacity-70" />
        <div className="absolute top-40 right-1/3 w-3.5 h-3.5 rounded-full bg-purple-500 animate-pulse opacity-60" />
        <div className="absolute top-56 left-1/5 w-2 h-2 rounded-full bg-indigo-400 opacity-50" />

        <div className="relative max-w-4xl mx-auto">
          {/* Label pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs text-slate-400 mb-6"
               style={{ background: "rgba(255,255,255,0.04)" }}>
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>The #1 dark-mode file conversion platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-5 leading-none"
              style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="gradient-text-hero">Transform your</span>
            <br />
            <span className="gradient-text-hero">files instantly</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Fast, secure, and powerful file conversion for images, PDFs, and more.
            Featuring a premium Canvas Studio editor built right in.
          </p>

          {/* CTA pill */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4">
            <a href="#quick-start-dropzone"
               onClick={(e) => { e.preventDefault(); document.getElementById("quick-start-dropzone")?.scrollIntoView({ behavior: "smooth" }); }}
               className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-bold text-sm text-white shadow-2xl transition hover:scale-105 active:scale-95 upload-select-pill">
              <Cloud className="w-5 h-5 text-cyan-300" />
              Select Files to Convert
              <ArrowRight className="w-4 h-4 opacity-60" />
            </a>
            <Link href="/resize"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm text-slate-400 border border-white/10 hover:text-white hover:border-white/20 transition">
              Open Canvas Studio <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURE_CARDS.map(({ href, icon: Icon, iconColor, iconBg, borderColor, glowColor, title, desc, badge }) => (
            <Link key={href} href={href}
                  className="group relative rounded-2xl p-6 text-left border transition-all duration-300 hover:-translate-y-1 block overflow-hidden"
                  style={{ background: `radial-gradient(ellipse at top, ${glowColor}, transparent 70%), #0f1117`, borderColor }}>
              {badge && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                     style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
                  {badge}
                </div>
              )}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 border border-white/10 transition-transform group-hover:scale-110"
                   style={{ background: iconBg }}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              <div className={`mt-4 text-[11px] font-semibold flex items-center gap-1 ${iconColor} opacity-0 group-hover:opacity-100 transition-opacity`}>
                Open Tool <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Why FileForge ── */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="rounded-2xl border border-white/10 p-8"
             style={{ background: "linear-gradient(135deg, #0f1117 0%, #12182b 100%)" }}>
          <h2 className="text-xl font-bold text-white mb-1 text-center" style={{ fontFamily: "'Outfit', sans-serif" }}>
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
                <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Start Dropzone ── */}
      <section id="quick-start-dropzone" className="max-w-6xl mx-auto px-6 mb-16 w-full">
        <div className="rounded-2xl border border-white/10 p-10 text-center shadow-2xl"
             style={{ background: "linear-gradient(135deg, #0f1117, #111827)" }}>
          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Quick Start
          </h3>
          <p className="text-xs text-slate-400 mb-7">
            Drag & drop or browse files. Supports JPG, PNG, WEBP, PDF, SVG and more up to 20 MB.
          </p>
          <div className="max-w-xl mx-auto">
            <DropZone
              onFileSelected={handleFileSelected}
              label="Drag & Drop file upload"
              hint="Supports JPG, PNG, WEBP, PDF, SVG up to 20 MB"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-xs text-slate-400 mt-auto"
              style={{ background: "#07080c" }}>
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4 font-medium">
          {["about", "blog", "support", "pricing", "api-docs", "terms", "privacy"].map((page) => (
            <Link key={page} href={`/${page}`}
                  className="capitalize hover:text-cyan-400 transition">
              {page === "api-docs" ? "API" : page.charAt(0).toUpperCase() + page.slice(1)}
            </Link>
          ))}
        </div>
        <p className="text-slate-500">
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
