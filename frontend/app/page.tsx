"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Camera,
  Crop,
  FileText,
  Clock,
  Cloud,
  HardDrive,
  FolderArchive,
  ArrowRight,
  Upload,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";

export default function HomePage() {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleFileSelected = (file: File) => {
    // Navigate to convert or resize page with file
    window.location.href = "/convert";
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col justify-between" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-36 pb-16 px-6 overflow-hidden text-center">
        {/* Background Ambient Glow Dots (Matching Reference Screenshot 1) */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-cyan-400 blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-4 h-4 rounded-full bg-purple-500 blur-[1px] opacity-80 animate-pulse" />
        <div className="absolute top-1/2 left-1/5 w-2 h-2 rounded-full bg-purple-400 blur-[1px] opacity-60" />
        <div className="absolute top-1/2 right-1/5 w-3 h-3 rounded-full bg-cyan-300 blur-[1px] opacity-70" />

        <div className="relative max-w-4xl mx-auto">
          {/* Main Hero Title matching Reference Image 1 */}
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="gradient-text-hero">Transform your</span>
            <br />
            <span className="gradient-text-hero">files instantly</span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
            The leading dark-mode platform for all your conversion and editing needs. Fast, secure, and user-friendly.
          </p>

          {/* Central Upload Action Pill matching Reference Image 1 */}
          <div
            className="inline-flex items-center gap-3 px-8 py-3.5 upload-select-pill cursor-pointer hover:scale-105 transition-all duration-200"
            onClick={() => {
              const dropEl = document.getElementById("quick-start-dropzone");
              if (dropEl) dropEl.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="text-sm font-bold text-white tracking-wide">Select Files to Upload</span>
            <div className="flex items-center gap-2.5">
              {/* Cloud Icon */}
              <Cloud className="w-5 h-5 text-cyan-400" />

              {/* Google Drive Triangle Logo */}
              <svg className="w-5 h-5" viewBox="0 0 87.3 78">
                <path fill="#0066DA" d="M6.6 66.85l16.1-27.9 22 38.1-16.1 7.7z" />
                <path fill="#00AC47" d="M44.7 77.05l22-38.1 14 24.2-22 38.1z" />
                <path fill="#EA4335" d="M22.7 38.95l16.1-27.9h44.1l-16.1 27.9z" />
              </svg>

              {/* Dropbox Logo */}
              <svg className="w-5 h-5" fill="#38bdf8" viewBox="0 0 24 24">
                <path d="M6 2l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 14l6-4 6 4-6 4-6-4zm24 0l-6-4-6 4 6 4 6-4zM6 18.5l6-4 6 4-6 4-6-4z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Glowing Feature Tool Cards matching Reference Screenshot 1 */}
      <section className="max-w-6xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Image Convert */}
          <Link href="/convert" className="glow-card-purple p-6 rounded-2xl block group text-left transition-all">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Camera className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Image Convert
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Easily convert PNG, JPG, WEBP, SVG to any format. Advanced settings included.
            </p>
          </Link>

          {/* Card 2: Resize & Edit */}
          <Link href="/resize" className="glow-card-purple p-6 rounded-2xl block group text-left transition-all">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Crop className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Resize &amp; Edit
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Batch resize, crop, rotate, enhance, and optimize images without quality loss.
            </p>
          </Link>

          {/* Card 3: PDF Tools */}
          <Link href="/pdf" className="glow-card-cyan p-6 rounded-2xl block group text-left transition-all">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              PDF Tools
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Merge, Split, Compress, Rotate PDF. Convert PDF to 'Word, Excel, JPG, and more.
            </p>
          </Link>

          {/* Card 4: Recent Activity */}
          <Link href="/history" className="glow-card-cyan p-6 rounded-2xl block group text-left transition-all">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Clock className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Recent Activity
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access and manage your conversion history, download links, and saved files.
            </p>
          </Link>

        </div>
      </section>

      {/* Quick Start Drag & Drop Container matching Reference Screenshot 1 */}
      <section id="quick-start-dropzone" className="max-w-6xl mx-auto px-6 mb-16 w-full">
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-10 text-center shadow-2xl">
          <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Quick Start
          </h3>
          <p className="text-xs text-slate-400 mb-6">Drag &amp; Drop file upload.</p>
          
          <div className="max-w-xl mx-auto">
            <DropZone onFileSelected={handleFileSelected} label="Drag & Drop file upload" hint="Supports JPG, PNG, WEBP, PDF, SVG up to 20 MB" />
          </div>
        </div>
      </section>

      {/* Footer matching Reference Screenshot 1 */}
      <footer className="border-t border-white/10 py-8 px-6 text-center bg-[#07080c] text-xs text-slate-400">
        <div className="flex flex-wrap items-center justify-center gap-6 mb-4 font-medium text-slate-400">
          <a href="#" className="hover:text-white transition">About</a>
          <a href="#" className="hover:text-white transition">Blog</a>
          <a href="#" className="hover:text-white transition">Support</a>
          <a href="#" className="hover:text-white transition">Pricing</a>
          <a href="#" className="hover:text-white transition">API</a>
          <a href="#" className="hover:text-white transition">Terms</a>
          <a href="#" className="hover:text-white transition">Privacy</a>
        </div>
        <p className="text-slate-500 text-[11px]">
          © {new Date().getFullYear()} FileForge Inc. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}
