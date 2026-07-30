"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Clock, RefreshCw, Crop, FileText, History, UserCheck, Eye, HardDrive, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";

const TOOLS = [
  {
    icon: RefreshCw,
    title: "Image Convert",
    description: "Convert between JPEG, PNG, WebP, GIF, BMP, TIFF and ICO in seconds.",
    href: "/convert",
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    border: "border-blue-500/30 hover:border-blue-400",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border border-blue-500/30",
  },
  {
    icon: Crop,
    title: "Image Resize & Canvas",
    description: "Interactive Canvas editor: Crop, draw pen, scale dimensions, target KB, text watermark & filters.",
    href: "/resize",
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    border: "border-purple-500/30 hover:border-purple-400",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15 border border-purple-500/30",
  },
  {
    icon: FileText,
    title: "PDF Tools & Compression",
    description: "Compress PDFs with expected target size calculator, or convert pages to images (ZIP).",
    href: "/pdf",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    border: "border-emerald-500/30 hover:border-emerald-400",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 border border-emerald-500/30",
  },
  {
    icon: History,
    title: "History & Server Purge",
    description: "Track converted documents with UTC Date & Time, live countdown timers, and manual server purge.",
    href: "/history",
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    border: "border-amber-500/30 hover:border-amber-400",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15 border border-amber-500/30",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "Real magic-byte MIME validation, UUID filenames, EXIF stripping. No filename tricks sneak past.",
  },
  {
    icon: Zap,
    title: "Lightning Fast Pipelines",
    desc: "Pillow + PyMuPDF processing pipelines deliver sub-3-second results for most document files.",
  },
  {
    icon: Clock,
    title: "Auto-Cleaned Storage",
    desc: "Files auto-delete in 30 min (anon) or 24 hours (logged-in). One-click manual server purge available.",
  },
  {
    icon: UserCheck,
    title: "Tiered Account History",
    desc: "Log in for 24-hour storage and higher rate limits. Anonymous IP mode gets 30 min temporary storage.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Ambient Radial Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[450px] bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Feature Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-medium mb-8 animate-fade-up shadow-lg shadow-brand-500/10">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            Interactive Canvas Editor · Google Drive Import · Date &amp; Time Tracking
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-fade-up" style={{ fontFamily: "'Outfit', sans-serif" }}>
            <span className="text-white">Transform &amp; Edit Your</span>
            <br />
            <span className="gradient-text">Files Instantly</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up">
            Convert, resize, edit, and compress images &amp; PDFs with enterprise security.
            Enjoy live inline previews, visual crop/drawing canvas tools, and Google Drive cloud import.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up">
            <Link href="/convert" className="btn-brand px-8 py-4 text-base font-semibold shadow-xl shadow-brand-500/20">
              Start Converting <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link href="/resize" className="btn-ghost px-7 py-4 text-base font-semibold border border-white/10">
              Open Canvas Editor
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 p-6 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-md animate-fade-up">
            {[
              { value: "20 MB", label: "Max Upload Limit" },
              { value: "10+", label: "Supported Formats" },
              { value: "Google Drive", label: "Cloud Import" },
              { value: "24 Hours", label: "Auth History Tier" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center p-2">
                <div className="text-2xl font-bold text-brand-400 font-display" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {value}
                </div>
                <div className="text-xs text-slate-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Showcase Banner */}
      <section className="max-w-5xl mx-auto px-6 mb-16">
        <div className="glass-card p-8 border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-pink-500/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5" /> NEW POWERFUL FEATURES
              </div>
              <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Interactive Canvas, Google Drive Import &amp; Server Purge
              </h3>
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Edit image crops, freehand draw, add text watermarks, calculate expected PDF/image compression sizes, and manually purge files from server storage at any time.
              </p>
            </div>
            <Link href="/convert" className="btn-brand px-6 py-3 text-sm font-semibold flex-shrink-0">
              Try New Features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-100 mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            All-in-One File Processing Tools
          </h2>
          <p className="text-slate-400 text-sm">Select an operation to convert, edit, or track your documents</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TOOLS.map(({ icon: Icon, title, description, href, gradient, border, iconColor, iconBg }) => (
            <Link
              key={href}
              href={href}
              className={`glass-card group p-6 cursor-pointer block bg-gradient-to-b ${gradient} border ${border} hover:shadow-card-hover transition-all duration-300 rounded-2xl`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-slate-100 text-lg mb-2">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{description}</p>
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${iconColor}`}>
                Open tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Security & System Features */}
      <section className="border-t border-white/10 py-20 px-6 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-slate-200 mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Enterprise Security &amp; Auto-Cleaned Storage
          </h2>
          <p className="text-center text-slate-400 text-sm mb-12">
            Every file is isolated, validated via magic bytes, stripped of metadata, and auto-cleaned after expiry.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass-card p-5 text-center border-white/5 bg-white/[0.01]">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="font-semibold text-slate-100 text-sm mb-2">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center bg-black/40">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-brand-400" fill="currentColor" />
          <span className="font-bold text-slate-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
            File<span className="text-brand-400">Forge</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} FileForge · Multi-Tenant File Processing SaaS Platform
        </p>
      </footer>
    </div>
  );
}
