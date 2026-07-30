"use client";

import Navbar from "@/components/Navbar";
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20 text-left">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-8 h-8 text-cyan-400" />
          <h1 className="text-3xl font-extrabold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Terms of Service — ABTech Solution
          </h1>
        </div>

        <div className="glass-card p-8 border-white/10 space-y-6 text-xs text-slate-300 leading-relaxed">
          <section>
            <h3 className="text-base font-bold text-white mb-2">1. Acceptance of Terms</h3>
            <p>By accessing FileForge operated by ABTech Solution, you agree to comply with these terms. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-white mb-2">2. Permitted Use</h3>
            <p>You may use FileForge solely for lawful file conversion, image editing, and document compression. Uploading illegal, malware-laden, or infringing content is strictly prohibited.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-white mb-2">3. Ephemeral File Retention</h3>
            <p>All converted files are automatically purged from ABTech Solution servers after 30 minutes (anonymous tier) or 24 hours (registered tier). Users can also trigger immediate manual server purge.</p>
          </section>

          <section>
            <h3 className="text-base font-bold text-white mb-2">4. Support &amp; Contact</h3>
            <p>For support inquiries, contact ABTech Solution at <span className="font-mono text-cyan-300">care.abtech@gmail.com</span>.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ABTech Solution. All Rights Reserved. Contact: care.abtech@gmail.com
      </footer>
    </div>
  );
}
