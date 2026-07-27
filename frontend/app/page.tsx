"use client";

import Link from "next/link";
import { ArrowRight, Shield, Zap, Clock, RefreshCw, Crop, FileText, History, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";

const TOOLS = [
  {
    icon: RefreshCw,
    title: "Image Convert",
    description: "Convert between JPEG, PNG, WebP, GIF, BMP, TIFF and ICO in seconds.",
    href: "/convert",
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "hover:border-blue-500/40",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/10",
  },
  {
    icon: Crop,
    title: "Image Resize & Edit",
    description: "Crop, rotate, apply filters. Resize by pixel dimensions or exact target KB.",
    href: "/resize",
    gradient: "from-purple-500/20 to-pink-500/10",
    border: "hover:border-purple-500/40",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/10",
  },
  {
    icon: FileText,
    title: "PDF Tools",
    description: "Compress PDFs to fraction of size, or convert pages to crisp images.",
    href: "/pdf",
    gradient: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/40",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/10",
  },
  {
    icon: History,
    title: "History & Expiry",
    description: "Track active converted documents, live countdown timers, and storage life.",
    href: "/history",
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "hover:border-amber-500/40",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "Real MIME validation, UUID filenames, EXIF stripping. No filename tricks can sneak past us.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Pillow + PyMuPDF processing pipelines deliver results in under 3 seconds for most files.",
  },
  {
    icon: Clock,
    title: "Auto-Cleaned Storage",
    desc: "Files auto-delete in 30 min (anon) or 24 hours (logged-in) to keep memory & database lean.",
  },
  {
    icon: UserCheck,
    title: "Tiered Accounts",
    desc: "Log in for 24-hour file history and 100 conversions/hour. Anonymous IP mode gets 30 min storage.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-glow-brand pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[800px] h-[400px] bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                          border border-brand-500/30 bg-brand-500/10 text-brand-300
                          text-xs font-medium mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Secure · All-in-One Format Processing · Live Expiry Tracking
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-800 tracking-tight mb-6
                         animate-fade-up" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800 }}>
            <span className="text-white">Transform your</span>
            <br />
            <span className="gradient-text">files instantly</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up">
            Convert, resize, edit, and compress images & PDFs with military-grade security.
            Live previews, instant downloads, and auto-cleaned storage memory.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-up">
            <Link href="/convert" className="btn-brand px-7 py-3.5 text-base">
              Start Converting
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/history" className="btn-ghost px-7 py-3.5 text-base">
              View History & Timers
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16 animate-fade-up">
            {[
              { value: "20 MB", label: "Max file size" },
              { value: "10+", label: "Output formats" },
              { value: "24 Hours", label: "Auth storage history" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-brand-400 font-display"
                     style={{ fontFamily: "'Outfit', sans-serif" }}>
                  {value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-semibold text-center text-slate-200 mb-3">
          All-in-One File Forge Tools
        </h2>
        <p className="text-center text-slate-500 text-sm mb-10">
          Select an operation to convert, edit, or track files
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TOOLS.map(({ icon: Icon, title, description, href, gradient, border, iconColor, iconBg }) => (
            <Link
              key={href}
              href={href}
              className={`glass-card group p-6 cursor-pointer block
                          bg-gradient-to-br ${gradient} ${border}
                          hover:shadow-card-hover transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4
                              group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <h3 className="font-semibold text-slate-100 text-lg mb-2">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-4">{description}</p>
              <div className={`flex items-center gap-1.5 text-xs font-medium ${iconColor}`}>
                Open tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-center text-slate-200 mb-3">
            Enterprise Security & Auto-Cleanup
          </h2>
          <p className="text-center text-slate-500 text-sm mb-12">
            Every file is isolated, stripped of metadata, and deleted after expiry
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20
                                flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-brand-400" />
                </div>
                <h3 className="font-semibold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-brand-400" fill="currentColor" />
          <span className="font-semibold text-slate-300" style={{ fontFamily: "'Outfit', sans-serif" }}>
            File<span className="text-brand-400">Forge</span>
          </span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} FileForge · Auto-cleaned database & memory storage
        </p>
      </footer>
    </div>
  );
}
