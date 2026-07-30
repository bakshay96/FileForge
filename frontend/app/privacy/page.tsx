"use client";

import Navbar from "@/components/Navbar";
import { ShieldCheck } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-left">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-8 h-8 text-emerald-400" />
          <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Privacy Policy — ABTech Solution
          </h1>
        </div>

        <div className="glass-card p-8 border-white/10 space-y-6 text-xs text-slate-300 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-white mb-2">1. Data Ownership &amp; Zero Selling</h3>
            <p>ABTech Solution respects your privacy. We NEVER sell, share, inspect, or monetize your uploaded documents, images, or files.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-white mb-2">2. EXIF Metadata Stripping</h3>
            <p>Every processed image is automatically stripped of camera location tags, device Serial Numbers, and private EXIF data during conversion.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-white mb-2">3. Automated Disk Purging</h3>
            <p>Your uploaded files are temporarily cached for processing and automatically deleted permanently after expiry (30 min or 24 hours). You can also click 'DELETE FROM SERVER' to purge files immediately.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-white mb-2">4. Privacy Contact</h3>
            <p>For privacy queries or deletion requests, email ABTech Solution at <span className="font-mono text-emerald-300">care.abtech@gmail.com</span>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ABTech Solution. All Rights Reserved. Contact: care.abtech@gmail.com
      </footer>
    </div>
  );
}
