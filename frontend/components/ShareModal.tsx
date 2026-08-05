"use client";

import React, { useState, useEffect } from "react";
import {
  X, Share2, Download, Copy, Check, FileText, Image as ImageIcon,
  MessageCircle, Sparkles, Send, Globe, Printer
} from "lucide-react";
import { useTheme } from "@/app/providers";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  getCanvas: () => HTMLCanvasElement | null;
  fileName?: string;
}

export default function ShareModal({
  isOpen,
  onClose,
  getCanvas,
  fileName = "design",
}: ShareModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpeg" | "webp" | "pdf">("png");
  const [sharing, setSharing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sanitizeName = fileName.replace(/\.[^/.]+$/, "");

  // Generate PDF blob client-side without external dependencies
  const generatePdfBlob = (canvas: HTMLCanvasElement): Blob => {
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const width = canvas.width;
    const height = canvas.height;

    // Convert pixels to points (72 points per inch, assume 96 dpi standard)
    const ptWidth = Math.round((width * 72) / 96);
    const ptHeight = Math.round((height * 72) / 96);

    // Simple single-page PDF structure with embedded JPEG
    const base64Data = imgData.split(",")[1];
    const rawImage = atob(base64Data);
    const imageLen = rawImage.length;

    const pdfHeader = `%PDF-1.4\n`;
    const obj1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
    const obj2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
    const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;
    const obj4Header = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageLen} >>\nstream\n`;
    const obj4Footer = `\nendstream\nendobj\n`;

    const streamContent = `q ${ptWidth} 0 0 ${ptHeight} 0 0 cm /Im1 Do Q`;
    const obj5 = `5 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj\n`;

    // Construct PDF binary array
    const parts = [
      pdfHeader, obj1, obj2, obj3, obj4Header,
      rawImage, obj4Footer, obj5
    ];

    let xrefOffset = 0;
    const offsets: number[] = [0];
    let pdfStr = pdfHeader;

    offsets.push(pdfStr.length);
    pdfStr += obj1;
    offsets.push(pdfStr.length);
    pdfStr += obj2;
    offsets.push(pdfStr.length);
    pdfStr += obj3;
    offsets.push(pdfStr.length);
    pdfStr += obj4Header;
    const imgStartOffset = pdfStr.length;
    pdfStr += rawImage + obj4Footer;
    offsets.push(pdfStr.length);
    pdfStr += obj5;

    xrefOffset = pdfStr.length;
    let xref = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 1; i <= 5; i++) {
      xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
    }
    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    // Combine string + image binary safely
    const encoder = new TextEncoder();
    const p1 = encoder.encode(pdfHeader + obj1 + obj2 + obj3 + obj4Header);
    const pImg = new Uint8Array(imageLen);
    for (let i = 0; i < imageLen; i++) pImg[i] = rawImage.charCodeAt(i);
    const p2 = encoder.encode(obj4Footer + obj5 + xref + trailer);

    const merged = new Uint8Array(p1.length + pImg.length + p2.length);
    merged.set(p1, 0);
    merged.set(pImg, p1.length);
    merged.set(p2, p1.length + pImg.length);

    return new Blob([merged], { type: "application/pdf" });
  };

  const getExportBlob = async (format: "png" | "jpeg" | "webp" | "pdf"): Promise<Blob | null> => {
    const canvas = getCanvas();
    if (!canvas) return null;

    if (format === "pdf") {
      return generatePdfBlob(canvas);
    }

    const mime = `image/${format}`;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mime, 0.95);
    });
  };

  // Direct Native Web Share API (WhatsApp, Telegram, Mail, Messages, System)
  const handleNativeShare = async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    setSharing(true);
    setStatusMessage("Preparing share file...");

    try {
      const blob = await getExportBlob(selectedFormat);
      if (!blob) throw new Error("Could not prepare export file");

      const ext = selectedFormat === "pdf" ? "pdf" : selectedFormat;
      const file = new File([blob], `${sanitizeName}.${ext}`, { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Shared Design — ${sanitizeName}`,
          text: `Check out this design created with FileForge!`,
        });
        setStatusMessage("Shared successfully! ✨");
      } else if (navigator.share) {
        await navigator.share({
          title: `FileForge — ${sanitizeName}`,
          text: `Check out this design created with FileForge!`,
          url: window.location.href,
        });
        setStatusMessage("Shared link successfully!");
      } else {
        // Fallback: direct download
        handleDownload();
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setStatusMessage("Direct share failed. Use Download or WhatsApp options below.");
      }
    } finally {
      setSharing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // WhatsApp Direct Share
  const handleWhatsAppShare = async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    setSharing(true);
    setStatusMessage("Preparing file for WhatsApp...");

    try {
      const blob = await getExportBlob(selectedFormat);
      if (blob) {
        const ext = selectedFormat === "pdf" ? "pdf" : selectedFormat;
        const file = new File([blob], `${sanitizeName}.${ext}`, { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `FileForge — ${sanitizeName}`,
            text: `Design created with FileForge`,
          });
          setStatusMessage("Shared to WhatsApp!");
          return;
        }
      }

      // WhatsApp Web text URL fallback
      const text = encodeURIComponent(`Check out my design (${sanitizeName}): ${window.location.href}`);
      const waUrl = `https://api.whatsapp.com/send?text=${text}`;
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setStatusMessage("Opened WhatsApp Share!");
    } catch (err) {
      setStatusMessage("Opened WhatsApp link.");
    } finally {
      setSharing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Copy Image to Clipboard
  const handleCopyClipboard = async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ [blob.type]: blob }),
          ]);
          setCopied(true);
          setStatusMessage("Copied image to clipboard! Ready to paste (Ctrl+V).");
          setTimeout(() => setCopied(false), 3000);
        } catch {
          // Fallback text link copy
          await navigator.clipboard.writeText(window.location.href);
          setCopied(true);
          setStatusMessage("Copied shareable link to clipboard!");
          setTimeout(() => setCopied(false), 3000);
        }
      }, "image/png");
    } catch (err) {
      setStatusMessage("Failed to copy to clipboard.");
    }
  };

  // Direct Download
  const handleDownload = async () => {
    const canvas = getCanvas();
    if (!canvas) return;

    setSharing(true);
    setStatusMessage("Downloading file...");

    try {
      const blob = await getExportBlob(selectedFormat);
      if (!blob) return;

      const ext = selectedFormat === "pdf" ? "pdf" : selectedFormat;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sanitizeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage(`Downloaded ${sanitizeName}.${ext}! 🎉`);
    } catch (err) {
      setStatusMessage("Download error.");
    } finally {
      setSharing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: isDark ? "#0f172a" : "#ffffff",
          color: isDark ? "#f8fafc" : "#0f172a",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)"}`,
          borderRadius: "20px",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.5)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: isDark ? "rgba(30,41,59,0.5)" : "rgba(241,245,249,0.7)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #22d3ee, #6366f1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Share2 size={16} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, fontFamily: "'Outfit', sans-serif" }}>
                Share & Export Design
              </h3>
              <p style={{ fontSize: "11px", color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
                {sanitizeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: isDark ? "#94a3b8" : "#64748b",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Format Selector */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isDark ? "#94a3b8" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Choose Format
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
              {[
                { id: "png", label: "PNG", icon: <ImageIcon size={14} />, desc: "Best quality" },
                { id: "jpeg", label: "JPEG", icon: <ImageIcon size={14} />, desc: "Small file" },
                { id: "webp", label: "WEBP", icon: <ImageIcon size={14} />, desc: "Modern web" },
                { id: "pdf", label: "PDF", icon: <FileText size={14} />, desc: "Document" },
              ].map(({ id, label, icon, desc }) => {
                const isSelected = selectedFormat === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedFormat(id as any)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      padding: "10px 6px",
                      borderRadius: "12px",
                      border: isSelected
                        ? "2px solid #22d3ee"
                        : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                      background: isSelected
                        ? "rgba(34, 211, 238, 0.12)"
                        : isDark
                        ? "rgba(30, 41, 59, 0.4)"
                        : "#f8fafc",
                      color: isSelected ? "#22d3ee" : isDark ? "#f1f5f9" : "#0f172a",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ color: isSelected ? "#22d3ee" : "#6366f1" }}>{icon}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: "9px", opacity: 0.7 }}>{desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Share Options */}
          <div>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: isDark ? "#94a3b8" : "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: "8px",
              }}
            >
              Share Directly To
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {/* WhatsApp Share */}
              <button
                onClick={handleWhatsAppShare}
                disabled={sharing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #25D366, #128C7E)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(37, 211, 102, 0.3)",
                }}
              >
                <MessageCircle size={16} fill="#ffffff" /> WhatsApp
              </button>

              {/* Native Web Share */}
              <button
                onClick={handleNativeShare}
                disabled={sharing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                }}
              >
                <Send size={16} /> Share File
              </button>
            </div>
          </div>

          {/* Additional Actions (Copy / Download) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={handleCopyClipboard}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "12px",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`,
                background: isDark ? "rgba(30,41,59,0.6)" : "#f1f5f9",
                color: isDark ? "#f1f5f9" : "#0f172a",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>

            <button
              onClick={handleDownload}
              disabled={sharing}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #0284c7, #2563eb)",
                color: "#ffffff",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.3)",
              }}
            >
              <Download size={14} /> Download {selectedFormat.toUpperCase()}
            </button>
          </div>

          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "rgba(34, 211, 238, 0.12)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
                color: "#22d3ee",
                fontSize: "11px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Sparkles size={12} /> {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
