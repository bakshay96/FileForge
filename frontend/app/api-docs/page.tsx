"use client";

import Navbar from "@/components/Navbar";
import { Code, Terminal, Cpu } from "lucide-react";

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs font-semibold mb-4">
            <Code className="w-3.5 h-3.5" /> REST API DOCUMENTATION BY ABTECH SOLUTION
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            FileForge REST API
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Integrate sub-second image conversion, canvas editing, and PDF compression directly into your apps.
          </p>
        </div>

        <div className="space-y-8 text-left">
          {/* Endpoint 1: Convert */}
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">POST</span>
              <span className="font-mono text-sm text-cyan-300">/api/convert/image</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Converts an input image file to target format (JPG, PNG, WebP, GIF, BMP, TIFF).</p>
            <pre className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
{`curl -X POST "https://fileforge-backend.onrender.com/api/convert/image" \\
  -F "file=@photo.png" \\
  -F "target_format=webp" \\
  -F "quality=85"`}
            </pre>
          </div>

          {/* Endpoint 2: Resize */}
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">POST</span>
              <span className="font-mono text-sm text-cyan-300">/api/resize/dimensions</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Resizes pixel dimensions. Either width or height can be left blank for proportional aspect ratio scaling.</p>
            <pre className="bg-black/60 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
{`curl -X POST "https://fileforge-backend.onrender.com/api/resize/dimensions" \\
  -F "file=@banner.jpg" \\
  -F "width=1920" \\
  -F "output_format=jpg"`}
            </pre>
          </div>

          {/* Endpoint 3: Purge */}
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-3 py-1 rounded-md bg-red-500/20 text-red-300 text-xs font-mono font-bold">DELETE</span>
              <span className="font-mono text-sm text-cyan-300">/api/file/{`{job_id}`}</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Immediately purges input and output files from server storage.</p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} ABTech Solution. All Rights Reserved. Contact: care.abtech@gmail.com
      </footer>
    </div>
  );
}
