"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Check, Sparkles, Zap, ShieldCheck, Crown, Star } from "lucide-react";
import { useTheme } from "@/app/providers";

export default function PricingPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)", color: isLight ? "#0f1117" : "#f1f5f9" }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20 text-center flex-grow">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-4">
          <Crown className="w-4 h-4 text-yellow-400" /> FILEFORGE v2.0 PRO MEMBERSHIP
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Simple Plans for Every Creator &amp; Studio
        </h1>
        <p className="text-sm max-w-xl mx-auto mb-12" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
          Start for free with standard processing, or upgrade to FileForge PRO for 4K exports, AI background removal, keyframes, and `.forge` project files.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {/* Plan 1: Free */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between"
            style={{
              background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
              borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif" }}>Free Tier</h3>
              <p className="text-xs text-slate-400 mb-4">No credit card required</p>
              <div className="text-3xl font-extrabold mb-6">
                ₹0 <span className="text-xs font-normal text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 20 MB max file size</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 1080p FHD Canvas exports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> All image &amp; PDF converters</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 60-min auto-purge privacy</li>
              </ul>
            </div>
            <Link href="/convert" className="btn-ghost justify-center text-xs py-3 w-full text-center rounded-xl font-bold">
              Start Free
            </Link>
          </div>

          {/* Plan 2: FileForge PRO */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between relative shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95))",
              borderColor: "rgba(34,211,238,0.5)",
              boxShadow: "0 0 35px rgba(34,211,238,0.2)",
            }}
          >
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider rounded-bl-xl">
              POPULAR PRO CHOICE
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-yellow-400 mb-1">
                <Star className="w-3.5 h-3.5 fill-yellow-400" /> FileForge PRO v2.0
              </div>
              <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Outfit',sans-serif" }}>Creator Pass</h3>
              <p className="text-xs text-cyan-300 mb-4">Unlimited AI &amp; Studio Power</p>
              <div className="text-3xl font-black text-white mb-6">
                ₹499 <span className="text-xs font-normal text-slate-400">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-200 mb-8">
                <li className="flex items-center gap-2 font-semibold text-cyan-300"><Check className="w-4 h-4 text-cyan-400" /> 500 MB max file size &amp; 4K 60fps exports</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Unlimited AI Background Removal &amp; Magic Eraser</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Timeline Keyframe Animations &amp; HSL LUT Studio</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Save &amp; Load `.forge` Project Timeline files</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> PDF OCR Text Extraction &amp; Batch Watermarking</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="btn-brand justify-center text-xs py-3.5 w-full text-center rounded-xl font-bold shadow-lg"
              style={{ background: "linear-gradient(135deg, #06b6d4, #6366f1)" }}
            >
              Upgrade to PRO Pass ⚡
            </Link>
          </div>

          {/* Plan 3: Enterprise */}
          <div
            className="p-6 rounded-2xl border flex flex-col justify-between"
            style={{
              background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
              borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)",
            }}
          >
            <div>
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: "'Outfit',sans-serif" }}>Enterprise API</h3>
              <p className="text-xs text-slate-400 mb-4">High-throughput automation</p>
              <div className="text-3xl font-extrabold mb-6">
                Custom <span className="text-xs font-normal text-slate-400">/ monthly</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Dedicated FastAPI worker instances</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Unlimited batch folder conversion API</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> 99.9% SLA &amp; priority 24/7 support</li>
              </ul>
            </div>
            <Link href="/support" className="btn-ghost justify-center text-xs py-3 w-full text-center rounded-xl font-bold">
              Contact Sales
            </Link>
          </div>
        </div>
      </main>

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
