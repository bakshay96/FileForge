"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Zap, User, LogOut, Menu, X, Sun, Moon, Palette } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/app/providers";

export default function Navbar() {
  const [openMobile, setOpenMobile] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/10"
      style={{
        background: isLight
          ? "rgba(250,251,255,0.9)"
          : "rgba(6,7,12,0.85)",
        backdropFilter: "blur(20px)",
        borderColor: isLight ? "rgba(0,0,0,0.08)" : undefined,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500
                          flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span
            className="font-bold text-xl tracking-tight"
            style={{
              fontFamily: "'Outfit', sans-serif",
              color: isLight ? "#0f1117" : "#ffffff",
            }}
          >
            File<span className="text-cyan-400">Forge</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div
          className="hidden md:flex items-center gap-6 text-sm font-medium"
          style={{ color: isLight ? "#475569" : "#cbd5e1" }}
        >
          {/* Convert Dropdown */}
          <div className="relative" onMouseEnter={() => setConvertOpen(true)} onMouseLeave={() => setConvertOpen(false)}>
            <Link
              href="/convert"
              className="flex items-center gap-1 hover:text-cyan-400 transition py-2"
              style={{ color: isLight ? "#475569" : undefined }}
            >
              Convert <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Link>
            {convertOpen && (
              <div
                className="absolute top-full left-0 w-52 rounded-xl p-2 shadow-2xl space-y-1"
                style={{
                  background: isLight ? "#ffffff" : "#0f1117",
                  border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <Link
                  href="/convert"
                  className="block px-3 py-2 rounded-lg hover:bg-indigo-500/10 text-xs hover:text-cyan-400 transition"
                  style={{ color: isLight ? "#475569" : "#e2e8f0" }}
                >
                  🖼️ Image Converter (JPG/PNG/WebP)
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/resize"
            className="hover:text-cyan-400 transition"
            style={{ color: isLight ? "#475569" : undefined }}
          >
            Resize &amp; Edit
          </Link>

          {/* PDF Dropdown */}
          <div className="relative" onMouseEnter={() => setPdfOpen(true)} onMouseLeave={() => setPdfOpen(false)}>
            <Link
              href="/pdf"
              className="flex items-center gap-1 hover:text-cyan-400 transition py-2"
              style={{ color: isLight ? "#475569" : undefined }}
            >
              PDF <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </Link>
            {pdfOpen && (
              <div
                className="absolute top-full left-0 w-52 rounded-xl p-2 shadow-2xl space-y-1"
                style={{
                  background: isLight ? "#ffffff" : "#0f1117",
                  border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                <Link href="/pdf" className="block px-3 py-2 rounded-lg hover:bg-indigo-500/10 text-xs hover:text-cyan-400 transition"
                  style={{ color: isLight ? "#475569" : "#e2e8f0" }}>
                  📄 Compress PDF
                </Link>
                <Link href="/pdf" className="block px-3 py-2 rounded-lg hover:bg-indigo-500/10 text-xs hover:text-cyan-400 transition"
                  style={{ color: isLight ? "#475569" : "#e2e8f0" }}>
                  🗂️ PDF → Images (ZIP)
                </Link>
              </div>
            )}
          </div>

          {/* Canvas Studio — featured link */}
          <Link
            href="/canvas"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(99,102,241,0.15))",
              border: "1px solid rgba(34,211,238,0.3)",
              color: isLight ? "#0891b2" : "#22d3ee",
              boxShadow: "0 0 12px rgba(34,211,238,0.15)",
            }}
          >
            <Palette className="w-3 h-3" />
            Canvas Studio
          </Link>

          <Link
            href="/history"
            className="hover:text-cyan-400 transition"
            style={{ color: isLight ? "#475569" : undefined }}
          >
            History
          </Link>
        </div>

        {/* Desktop Auth CTAs + Theme Toggle */}
        <div className="hidden md:flex items-center gap-3 text-sm font-medium">
          {/* Light/Dark mode toggle */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            aria-label="Toggle theme"
          >
            {isLight ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4" />
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}`,
                  color: isLight ? "#0f1117" : "#e2e8f0",
                }}
              >
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{user.name}</span>
              </div>
              <button
                onClick={logout}
                className="text-slate-400 hover:text-red-400 text-xs transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hover:text-cyan-400 transition"
                style={{ color: isLight ? "#475569" : "#cbd5e1" }}
              >
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
        <button
          className="md:hidden hover:text-white"
          style={{ color: isLight ? "#475569" : "#94a3b8" }}
          onClick={() => setOpenMobile(!openMobile)}
        >
          {openMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {openMobile && (
        <div
          className="md:hidden border-t p-4 space-y-2"
          style={{
            background: isLight ? "#f5f7fc" : "#08090e",
            borderColor: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)",
          }}
        >
          <Link href="/convert" onClick={() => setOpenMobile(false)}
            className="block py-2 text-sm" style={{ color: isLight ? "#475569" : "#e2e8f0" }}>Convert</Link>
          <Link href="/resize" onClick={() => setOpenMobile(false)}
            className="block py-2 text-sm" style={{ color: isLight ? "#475569" : "#e2e8f0" }}>Resize &amp; Edit</Link>
          <Link href="/pdf" onClick={() => setOpenMobile(false)}
            className="block py-2 text-sm" style={{ color: isLight ? "#475569" : "#e2e8f0" }}>PDF Tools</Link>
          <Link href="/canvas" onClick={() => setOpenMobile(false)}
            className="block py-2 text-sm font-bold" style={{ color: "#22d3ee" }}>🎨 Canvas Studio</Link>
          <Link href="/history" onClick={() => setOpenMobile(false)}
            className="block py-2 text-sm" style={{ color: isLight ? "#475569" : "#e2e8f0" }}>History</Link>

          {/* Theme toggle in mobile */}
          <div className="flex items-center gap-2 py-2">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <span className="text-xs" style={{ color: isLight ? "#64748b" : "#64748b" }}>
              {isLight ? "Dark Mode" : "Light Mode"}
            </span>
          </div>

          {!user && (
            <div className="pt-2 flex gap-2">
              <Link href="/login" onClick={() => setOpenMobile(false)}
                className="btn-ghost flex-1 justify-center text-xs py-2">Login</Link>
              <Link href="/register" onClick={() => setOpenMobile(false)}
                className="btn-brand flex-1 justify-center text-xs py-2">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
