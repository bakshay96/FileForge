"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { useState } from "react";
import {
  ShieldCheck, Lock, Trash2, EyeOff, Server, HardDrive, Key,
  CheckCircle2, Zap, Cpu, Mail, ArrowRight, ShieldAlert,
} from "lucide-react";
import { useTheme } from "@/app/providers";

export default function PrivacyPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [activeTab, setActiveTab] = useState<"overview" | "encryption" | "purge" | "rights">("overview");

  const SECURITY_PILLARS = [
    {
      icon: Lock,
      color: "text-emerald-400",
      bg: "rgba(52,211,153,0.12)",
      title: "AES-256 Bit Encryption",
      desc: "All files in transit and at rest are encrypted with military-grade AES-256 and SSL/TLS 1.3 protocol.",
    },
    {
      icon: Trash2,
      color: "text-cyan-400",
      bg: "rgba(34,211,238,0.12)",
      title: "60-Min Hard Auto-Purge",
      desc: "Uploaded files are kept in ephemeral storage for processing and automatically permanently deleted within 60 minutes.",
    },
    {
      icon: EyeOff,
      color: "text-purple-400",
      bg: "rgba(192,132,252,0.12)",
      title: "Zero Human Inspection",
      desc: "No human or AI model inspects or trains on your uploaded images, PDFs, audio clips, or video files.",
    },
    {
      icon: ShieldCheck,
      color: "text-yellow-400",
      bg: "rgba(250,204,21,0.12)",
      title: "EXIF Geotag Stripping",
      desc: "Every converted photo automatically strips sensitive GPS location data, camera serial numbers, and device EXIF tags.",
    },
  ];

  const POLICY_SECTIONS = [
    {
      id: "data-ownership",
      title: "1. Complete Data Ownership & Zero Monetization",
      content: (
        <div className="space-y-3">
          <p>
            At <strong className="text-white">FileForge (ABTech Solution)</strong>, your data belongs exclusively to you. We strictly enforce a <strong>Zero-Monetization Privacy Contract</strong>:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li>We <strong>never sell, lease, license, or trade</strong> your personal data or uploaded media.</li>
            <li>We <strong>never train AI models</strong> (LLMs or vision models) using your files or conversions.</li>
            <li>Conversions occur in isolated, sandboxed containers that execute processing without persistent logging.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "file-lifecycle",
      title: "2. Ephemeral Storage & 60-Minute Purge Lifecycle",
      content: (
        <div className="space-y-3">
          <p>
            Files uploaded to FileForge undergo an automated, time-capped storage lifecycle:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-center">
              <div className="text-xs font-bold text-emerald-400 mb-1">Step 1: Ingestion</div>
              <div className="text-[11px] text-slate-300">SSL/TLS 1.3 encrypted file upload to RAM buffer</div>
            </div>
            <div className="p-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-center">
              <div className="text-xs font-bold text-cyan-400 mb-1">Step 2: Processing</div>
              <div className="text-[11px] text-slate-300">Parallel GPU conversion &amp; EXIF metadata stripping</div>
            </div>
            <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-center">
              <div className="text-xs font-bold text-purple-400 mb-1">Step 3: Auto-Delete</div>
              <div className="text-[11px] text-slate-300">Permanent disk purge after 60 min or instant 1-click delete</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "metadata-security",
      title: "3. EXIF & Geotag Privacy Stripping",
      content: (
        <div className="space-y-3">
          <p>
            Raw image files frequently contain sensitive embedded EXIF data, including precise GPS coordinates of your location, camera model info, creation timestamps, and device identifiers.
          </p>
          <p>
            FileForge automatically strips all non-essential EXIF metadata during processing before serving the converted file to your browser, protecting your privacy when sharing images online.
          </p>
        </div>
      ),
    },
    {
      id: "compliance",
      title: "4. Global Compliance (GDPR & CCPA Rights)",
      content: (
        <div className="space-y-3">
          <p>
            FileForge complies with international privacy frameworks including the European Union General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA):
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-300">
            <li><strong>Right to Eradication:</strong> You can purge your files from our servers at any time using the <em>Delete File Now</em> button in your conversion history.</li>
            <li><strong>Right to Data Portability:</strong> Downloads are delivered in open standard formats with no proprietary lock-in.</li>
            <li><strong>Cookie Policy:</strong> We only store functional local cookies for UI state preferences (like dark/light theme). No third-party tracking pixels are deployed.</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)", color: isLight ? "#0f1117" : "#f1f5f9" }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20 w-full flex-grow text-left">
        {/* Header Hero */}
        <div className="relative text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border text-xs mb-4"
            style={{
              background: "rgba(52,211,153,0.1)",
              borderColor: "rgba(52,211,153,0.3)",
              color: "#34d399",
            }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Security Architecture &amp; Privacy Policy</span>
          </div>

          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{ fontFamily: "'Outfit',sans-serif" }}
          >
            Your Security is Our <span className="gradient-text-hero">First Priority</span>
          </h1>
          <p className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
            Learn how FileForge safeguards your media with zero-knowledge sandboxing, AES-256 encryption, and automated 60-minute hard disk purges.
          </p>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {SECURITY_PILLARS.map((pil) => {
            const Icon = pil.icon;
            return (
              <div
                key={pil.title}
                className="p-5 rounded-2xl border transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.025)",
                  borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: pil.bg }}
                >
                  <Icon className={`w-5 h-5 ${pil.color}`} />
                </div>
                <h3
                  className="text-sm font-bold mb-1.5"
                  style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}
                >
                  {pil.title}
                </h3>
                <p className="text-[11px] leading-relaxed" style={{ color: isLight ? "#64748b" : "#94a3b8" }}>
                  {pil.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Main Content Container */}
        <div
          className="rounded-2xl border p-8 shadow-2xl relative overflow-hidden space-y-8"
          style={{
            background: isLight ? "rgba(255,255,255,0.9)" : "linear-gradient(135deg, #0f1117 0%, #13182a 100%)",
            borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
          }}
        >
          {POLICY_SECTIONS.map((sec) => (
            <section key={sec.id} className="border-b pb-6 last:border-b-0 last:pb-0" style={{ borderColor: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.07)" }}>
              <h2
                className="text-lg font-bold mb-3 flex items-center gap-2"
                style={{ fontFamily: "'Outfit',sans-serif", color: isLight ? "#0f1117" : "#f1f5f9" }}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {sec.title}
              </h2>
              <div className="text-xs leading-relaxed" style={{ color: isLight ? "#475569" : "#cbd5e1" }}>
                {sec.content}
              </div>
            </section>
          ))}

          {/* Contact Box */}
          <div
            className="p-6 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 mt-6"
            style={{
              background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(34,211,238,0.08))",
              borderColor: "rgba(52,211,153,0.3)",
            }}
          >
            <div>
              <h3 className="text-sm font-bold text-emerald-400 mb-1" style={{ fontFamily: "'Outfit',sans-serif" }}>
                Security Vulnerability &amp; Inquiries
              </h3>
              <p className="text-xs text-slate-300">
                Have questions about our data encryption or want to report a security item? Contact ABTech Solution directly.
              </p>
            </div>
            <a
              href="mailto:care.abtech@gmail.com"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-500 hover:bg-emerald-600 transition shadow-lg shrink-0"
            >
              <Mail className="w-3.5 h-3.5" /> care.abtech@gmail.com
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6 text-center text-xs mt-auto"
        style={{
          background: isLight ? "#f8fafc" : "#07080c",
          borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)",
          color: isLight ? "#64748b" : "#64748b",
        }}
      >
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

