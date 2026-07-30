"use client";

import Navbar from "@/components/Navbar";
import { Shield, Zap, Lock, Cpu, Sparkles, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> ABOUT FILEFORGE
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6" style={{ fontFamily: "'Outfit', sans-serif" }}>
          The Dark-Mode Platform for <br />
          <span className="gradient-text-hero">Secure File Processing</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          FileForge was built to replace ad-ridden, insecure online file converters. We process millions of files with enterprise security, magic-byte validation, and automated ephemeral purging.
        </p>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 text-left mb-16">
          <div className="glass-card p-6 border-white/10">
            <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Enterprise Security
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MIME validation via magic bytes, EXIF metadata stripping, and zero data selling guarantee complete privacy.
            </p>
          </div>

          <div className="glass-card p-6 border-white/10">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Sub-Second Speed
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-throughput PyMuPDF and Pillow pipelines deliver instant conversions for images and multi-page PDFs.
            </p>
          </div>

          <div className="glass-card p-6 border-white/10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Ephemeral Purging
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files auto-expire and hard-delete from server disks after 30 min (anonymous) or 24 hours (authenticated).
            </p>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8 text-left shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Built for Developers &amp; Creators
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Whether you need to batch convert images to WebP, edit crops and freehand annotations on interactive canvas, or compress heavy PDFs for email attachments — FileForge provides a unified dark-mode engine.
          </p>
        </div>
      </main>
    </div>
  );
}
