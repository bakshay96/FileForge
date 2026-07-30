"use client";

import Navbar from "@/components/Navbar";
import { Mail, MessageSquare, HelpCircle, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> ABTECH SOLUTION HELP DESK
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          Contact ABTech Support
        </h1>
        <p className="text-slate-400 text-sm max-w-lg mx-auto mb-10">
          Have questions or need assistance with FileForge? Reach out to ABTech Solution support team directly.
        </p>

        {/* Contact Info Card */}
        <div className="glass-card p-6 border-white/10 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Official Support Email</h3>
              <p className="text-xs text-slate-400 font-mono">care.abtech@gmail.com</p>
            </div>
          </div>
          <a
            href="mailto:care.abtech@gmail.com"
            className="btn-brand px-5 py-2.5 text-xs font-semibold flex-shrink-0"
          >
            Send Email
          </a>
        </div>

        {/* Support Ticket Form */}
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8 text-left shadow-2xl">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Message Sent Successfully!
              </h3>
              <p className="text-xs text-slate-400">
                ABTech Support will respond to your email at <span className="font-mono text-cyan-300">care.abtech@gmail.com</span> within 24 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Send Support Ticket
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium mb-1 block">Your Name</label>
                  <input required className="forge-input text-xs" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium mb-1 block">Your Email</label>
                  <input required type="email" className="forge-input text-xs" placeholder="e.g. user@domain.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium mb-1 block">Subject</label>
                <input required className="forge-input text-xs" placeholder="e.g. Image conversion query" />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium mb-1 block">Message Details</label>
                <textarea required rows={4} className="forge-input text-xs resize-none" placeholder="Describe issue..." />
              </div>
              <button type="submit" className="btn-brand w-full py-3 text-xs font-semibold flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Submit Ticket to ABTech Support
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ABTech Solution. All Rights Reserved. Contact: care.abtech@gmail.com
      </footer>
    </div>
  );
}
