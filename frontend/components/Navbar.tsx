"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Zap, History, User, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/convert", label: "Convert Image" },
  { href: "/resize",  label: "Resize & Compress" },
  { href: "/pdf",     label: "PDF Tools" },
  { href: "/history", label: "History & Expiry" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5"
         style={{ background: "rgba(10,11,15,0.85)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-600
                          flex items-center justify-center shadow-lg shadow-brand-500/30
                          group-hover:shadow-brand-500/50 transition-shadow">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className="font-display font-700 text-lg tracking-tight" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
            File<span className="text-brand-400">Forge</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-2 rounded-lg text-sm font-medium text-slate-400
                         hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200">
                <User className="w-3.5 h-3.5 text-brand-400" />
                <span className="font-medium truncate max-w-[120px]">{user.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">24h Tier</span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost px-4 py-2 text-xs">
                Log In
              </Link>
              <Link href="/register" className="btn-brand px-4 py-2 text-xs">
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-white/5 px-6 py-4 space-y-1"
             style={{ background: "rgba(10,11,15,0.98)" }}>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 rounded-lg text-sm text-slate-300
                         hover:text-white hover:bg-white/5 transition"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-slate-400">{user.email} (24h Tier)</span>
              <button onClick={() => { logout(); setOpen(false); }} className="text-xs text-red-400 font-medium">
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost text-center py-2 text-xs">
                Log In
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn-brand text-center py-2 text-xs">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
