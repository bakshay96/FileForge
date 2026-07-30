"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";
import { BookOpen, Calendar, ArrowRight, User } from "lucide-react";

const POSTS = [
  {
    slug: "nextjs-14-pdf-compression",
    title: "How We Optimized WebP & PDF Compression to Achieve 85% File Size Savings",
    excerpt: "Learn how PyMuPDF stream rendering and Pillow binary-search quality tuning deliver near-instant compression without quality loss.",
    date: "July 28, 2026",
    author: "FileForge Engineering",
    tag: "Engineering",
  },
  {
    slug: "canvas-editor-snipping-tool",
    title: "Introducing Interactive Snipping Tool Crop & Freehand Canvas Editing",
    excerpt: "Edit crops, draw with precision pen controls, apply text watermarks, and adjust brightness/contrast directly in your browser.",
    date: "July 25, 2026",
    author: "UX Design Team",
    tag: "Product Update",
  },
  {
    slug: "security-magic-bytes-mime",
    title: "Why Magic-Byte Validation Beats Simple File Extension Checking",
    excerpt: "Discover how FileForge inspects binary headers to block malicious payloads before processing user files.",
    date: "July 18, 2026",
    author: "Security Team",
    tag: "Security",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen text-slate-100" style={{ background: "var(--color-bg)" }}>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" /> FILEFORGE BLOG
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Latest News &amp; Tutorials
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Insights on image processing, PDF algorithms, cloud security, and web performance optimization.
          </p>
        </div>

        <div className="space-y-6">
          {POSTS.map((post) => (
            <article key={post.slug} className="glass-card p-6 border-white/10 hover:border-purple-500/40 transition-all rounded-2xl text-left">
              <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                <span className="px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 font-semibold">{post.tag}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {post.author}</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 hover:text-cyan-400 transition" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {post.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center text-xs font-semibold text-cyan-400 gap-1 cursor-pointer">
                Read article <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
