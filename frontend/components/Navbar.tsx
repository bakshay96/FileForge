"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Zap, User, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
  const [openMobile, setOpenMobile] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
         style={{ background: "rgba(6,7,12,0.85)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500
                          flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            File<span className="text-cyan-400">Forge</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          
          {/* Convert Dropdown */}
          <div className="relative" onMouseEnter={() => setConvertOpen(true)} onMouseLeave={() => setConvertOpen(false)}>
            <Link href="/convert" className="flex items-center gap-1 hover:text-cyan-400 transition py-2">
              Convert <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            {convertOpen && (
              <div className="absolute top-full left-0 w-48 bg-[#0f1117] border border-white/10 rounded-xl p-2 shadow-2xl space-y-1">
                <Link href="/convert" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-200 hover:text-cyan-300">
                  Image Converter (JPG/PNG/WebP)
                </Link>
              </div>
            )}
          </div>

          <Link href="/resize" className="hover:text-cyan-400 transition">
            Resize &amp; Edit
          </Link>

          {/* PDF Dropdown */}
          <div className="relative" onMouseEnter={() => setPdfOpen(true)} onMouseLeave={() => setPdfOpen(false)}>
            <Link href="/pdf" className="flex items-center gap-1 hover:text-cyan-400 transition py-2">
              PDF <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Link>
            {pdfOpen && (
              <div className="absolute top-full left-0 w-48 bg-[#0f1117] border border-white/10 rounded-xl p-2 shadow-2xl space-y-1">
                <Link href="/pdf" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-200 hover:text-cyan-300">
                  Compress PDF
                </Link>
                <Link href="/pdf" className="block px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-slate-200 hover:text-cyan-300">
                  PDF → Images (ZIP)
                </Link>
              </div>
            )}
          </div>

          <Link href="/history" className="hover:text-cyan-400 transition">
            History
          </Link>
        </div>

        {/* Desktop Auth CTAs */}
        <div className="hidden md:flex items-center gap-4 text-sm font-medium">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-200">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.name}</span>
              </div>
              <button onClick={logout} className="text-slate-400 hover:text-red-400 text-xs transition" title="Log Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-300 hover:text-white transition">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-1.5 rounded-full border border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 transition text-xs font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu hamburger */}
        <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setOpenMobile(!openMobile)}>
          {openMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {openMobile && (
        <div className="md:hidden border-t border-white/10 p-4 space-y-2 bg-[#08090e]">
          <Link href="/convert" onClick={() => setOpenMobile(false)} className="block py-2 text-slate-200 text-sm">Convert</Link>
          <Link href="/resize" onClick={() => setOpenMobile(false)} className="block py-2 text-slate-200 text-sm">Resize &amp; Edit</Link>
          <Link href="/pdf" onClick={() => setOpenMobile(false)} className="block py-2 text-slate-200 text-sm">PDF Tools</Link>
          <Link href="/history" onClick={() => setOpenMobile(false)} className="block py-2 text-slate-200 text-sm">History</Link>
          {!user && (
            <div className="pt-2 flex gap-2">
              <Link href="/login" onClick={() => setOpenMobile(false)} className="btn-ghost flex-1 justify-center text-xs py-2">Login</Link>
              <Link href="/register" onClick={() => setOpenMobile(false)} className="btn-brand flex-1 justify-center text-xs py-2">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
