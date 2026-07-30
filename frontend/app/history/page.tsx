"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import CountdownTimer from "@/components/CountdownTimer";
import { useAuth } from "@/lib/auth";
import { getHistory, HistoryItem, triggerDownload, deleteJob } from "@/lib/api";
import { History, FileDown, Clock, ShieldAlert, Sparkles, RefreshCw, Trash2 } from "lucide-react";

export default function HistoryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<"authenticated" | "anonymous">("anonymous");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const res = await getHistory(p, 15);
      setItems(res.items);
      setTotalPages(res.pages);
      setUserType(res.user_type);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (jobId: string) => {
    if (!confirm("Are you sure you want to permanently delete this file from the server storage?")) {
      return;
    }
    try {
      await deleteJob(jobId);
      setItems((prev) =>
        prev.map((item) =>
          item.job_id === jobId ? { ...item, file_available: false, is_expired: true } : item
        )
      );
    } catch (err) {
      alert("Failed to delete file.");
    }
  };

  useEffect(() => {
    fetchHistory(page);
  }, [page, user]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 pt-28 pb-20">
        
        {/* Top Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 mb-4 mx-auto">
            <History className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Conversion History & Expiry
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Track converted files and their remaining life. Files auto-delete from memory & database when expired.
          </p>
        </div>

        {/* Auth Tier Callout */}
        {!user ? (
          <div className="glass-card p-4 mb-6 border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Anonymous IP Storage Mode (30 Minutes)</p>
                <p className="text-xs text-slate-400">
                  Your files auto-delete after 30 minutes. Log in to extend file history to 24 hours (1 full day).
                </p>
              </div>
            </div>
            <Link href="/login" className="btn-brand text-xs px-4 py-2 flex-shrink-0 whitespace-nowrap">
              Log In to Extend to 24h
            </Link>
          </div>
        ) : (
          <div className="glass-card p-4 mb-6 border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-300">Account Tier (24-Hour File History)</p>
                <p className="text-xs text-slate-400">
                  Logged in as <span className="text-white font-medium">{user.email}</span>. Converted files are retained for 1 full day.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h2 className="text-lg font-semibold text-slate-200">Recent Conversions</h2>
            <button
              onClick={() => fetchHistory(page)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 skeleton w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No active conversions found</p>
              <p className="text-xs text-slate-600 mt-1">Converted files will appear here with live expiry timers.</p>
              <Link href="/convert" className="btn-ghost text-xs px-4 py-2 mt-4 inline-flex">
                Start a Conversion
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.job_id}
                  className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs uppercase flex-shrink-0">
                      {item.output_format || "FILE"}
                    </div>
                    <div className="truncate text-left">
                      <p className="text-sm font-medium text-slate-200 truncate">{item.original_filename}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.operation.replace("_", " ").toUpperCase()} · {item.file_size_bytes ? `${(item.file_size_bytes / 1024).toFixed(1)} KB` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                    {item.expires_at && <CountdownTimer expiresAt={item.expires_at} />}

                    {item.file_available && item.output_filename ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => triggerDownload(item.job_id, item.output_filename!)}
                          className="btn-brand px-3 py-1.5 text-xs gap-1.5"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Download
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.job_id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
                          title="Purge file from server"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600 italic">Unavailable / Deleted</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 text-xs text-slate-400">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30"
              >
                Previous
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
