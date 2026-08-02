"use client";

import React from "react";

interface BrandLoaderProps {
  message?: string;
  subMessage?: string;
  /** If true renders as an absolute overlay over its parent, not the full screen */
  inline?: boolean;
  theme?: "dark" | "light";
}

export default function BrandLoader({
  message = "Loading…",
  subMessage,
  inline = false,
  theme = "dark",
}: BrandLoaderProps) {
  const isDark = theme === "dark";

  const bg   = isDark ? "rgba(7,9,14,0.92)"   : "rgba(245,247,252,0.92)";
  const text = isDark ? "#e2e8f0"              : "#0f1117";
  const muted= isDark ? "#475569"              : "#94a3b8";

  const containerStyle: React.CSSProperties = inline
    ? {
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        backdropFilter: "blur(8px)",
        zIndex: 9999,
        borderRadius: "inherit",
      }
    : {
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        backdropFilter: "blur(12px)",
        zIndex: 2147483646,
      };

  return (
    <div style={containerStyle}>
      {/* Outer glow ring */}
      <div style={{ position: "relative", width: 80, height: 80, marginBottom: 20 }}>
        {/* Spinning arc ring */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "#22d3ee",
          borderRightColor: "#6366f1",
          animation: "ff-spin 0.9s linear infinite",
        }} />
        {/* Second slower ring */}
        <div style={{
          position: "absolute", inset: 6,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "#a855f7",
          borderLeftColor: "#22d3ee",
          animation: "ff-spin 1.4s linear infinite reverse",
        }} />
        {/* Center logo badge */}
        <div style={{
          position: "absolute", inset: 14,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #22d3ee22, #6366f133)",
          border: "1px solid rgba(99,102,241,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Zap / lightning bolt SVG */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="ff-zap-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
            <path
              d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"
              fill="url(#ff-zap-grad)"
              stroke="url(#ff-zap-grad)"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Brand name */}
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontWeight: 800,
        fontSize: 18,
        color: text,
        letterSpacing: "-0.01em",
        marginBottom: 6,
      }}>
        File<span style={{ color: "#22d3ee" }}>Forge</span>
      </div>

      {/* Message */}
      <div style={{
        fontSize: 12,
        color: muted,
        fontWeight: 500,
        letterSpacing: "0.03em",
        marginBottom: subMessage ? 4 : 0,
      }}>
        {message}
      </div>

      {/* Sub message */}
      {subMessage && (
        <div style={{ fontSize: 10, color: isDark ? "#334155" : "#94a3b8", marginTop: 2 }}>
          {subMessage}
        </div>
      )}

      {/* Dot progress */}
      <div style={{ display: "flex", gap: 5, marginTop: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "linear-gradient(135deg,#22d3ee,#6366f1)",
              animation: `ff-bounce 1.1s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes ff-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ff-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1.0); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
