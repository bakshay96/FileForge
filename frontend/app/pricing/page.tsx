"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Check, Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" /> TRANSPARENT PRICING BY ABTECH SOLUTION
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Simple Plans for Every Creator
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto mb-14">
          Start for free with anonymous IP tier, or sign up for extended 24-hour history and higher limits.
        </p>

        <div className="grid md:grid-cols-3 gap-6 text-left">
          {/* Plan 1: Anonymous */}
          <div className="glass-card p-6 border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Free Anonymous</h3>
              <p className="text-xs text-slate-400 mb-4">No account required</p>
              <div className="text-3xl font-extrabold text-white mb-6">
                ₹0 <span className="text-xs font-normal text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 20 MB max file size</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 30-min auto-expire storage</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> All image &amp; PDF converters</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Interactive Canvas Editor</li>
              </ul>
            </div>
            <Link href="/convert" className="btn-ghost justify-center text-xs py-2.5">
              Start Free Now
            </Link>
          </div>

          {/* Plan 2: Registered Free */}
          <div className="glass-card p-6 border-cyan-500/50 bg-cyan-500/5 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider">
              MOST POPULAR
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Registered User</h3>
              <p className="text-xs text-cyan-300 mb-4">Free with account signup</p>
              <div className="text-3xl font-extrabold text-white mb-6">
                ₹0 <span className="text-xs font-normal text-slate-400">/ forever</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-200 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 50 MB max file size</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> 24-hour persistent history tier</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Google Drive &amp; Cloud URL import</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-cyan-400" /> Manual server purge controls</li>
              </ul>
            </div>
            <Link href="/register" className="btn-brand justify-center text-xs py-2.5">
              Create Free Account
            </Link>
          </div>

          {/* Plan 3: Enterprise */}
          <div className="glass-card p-6 border-white/10 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Enterprise API</h3>
              <p className="text-xs text-slate-400 mb-4">High throughput automation</p>
              <div className="text-3xl font-extrabold text-white mb-6">
                Custom <span className="text-xs font-normal text-slate-400">/ monthly</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Unlimited file size &amp; batch API</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> Dedicated FastAPI worker instances</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-purple-400" /> 99.9% SLA &amp; priority support</li>
              </ul>
            </div>
            <Link href="/support" className="btn-ghost justify-center text-xs py-2.5">
              Contact ABTech Sales
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ABTech Solution. All Rights Reserved. Contact: care.abtech@gmail.com
      </footer>
    </div>
  );
}
