"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  RotateCw,
  Pencil,
  Paintbrush,
  Eraser,
  X,
  Zap,
  Sun,
  Contrast as ContrastIcon,
  Undo2,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Square,
  Circle,
  Type,
  Download,
  Check,
  Move,
  Crop,
  Star,
} from "lucide-react";

interface CanvasEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

const COLOR_PALETTE = [
  "#3b82f6",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#a855f7",
  "#ffffff",
  "#000000",
];

const FILTER_PRESETS = [
  { value: "none", label: "Original" },
  { value: "grayscale", label: "Grayscale" },
  { value: "sepia", label: "Sepia Vintage" },
  { value: "warm", label: "Warm Film" },
  { value: "cool", label: "Cool Breeze" },
  { value: "invert", label: "Invert Colors" },
  { value: "vivid", label: "Vivid Boost" },
];

export default function CanvasEditor({ file, onSave, onCancel }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  const [tool, setTool] = useState<"pen" | "brush" | "erase" | "rect" | "circle">("pen");
  const [color, setColor] = useState("#3b82f6");
  const [brushSize, setBrushSize] = useState(6);

  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterPreset, setFilterPreset] = useState<"none" | "grayscale" | "sepia" | "invert" | "warm" | "cool" | "vivid">("none");

  const [cropBox, setCropBox] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialBox: typeof cropBox } | null>(null);

  const [captionText, setCaptionText] = useState("");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(24);

  const [history, setHistory] = useState<ImageData[]>([]);
  const [saved, setSaved] = useState(false);

  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // ── Load Image ──────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImageObj(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Redraw Canvas ────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageObj.naturalWidth || 800;
    canvas.height = imageObj.naturalHeight || 600;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const b = 100 + brightness;
    const c = 100 + contrast;
    const s = 100 + saturation;
    let f = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

    if (filterPreset === "grayscale") f += " grayscale(100%)";
    else if (filterPreset === "sepia")   f += " sepia(80%)";
    else if (filterPreset === "invert")  f += " invert(100%)";
    else if (filterPreset === "warm")    f += " sepia(30%) hue-rotate(-10deg)";
    else if (filterPreset === "cool")    f += " hue-rotate(180deg) saturate(150%)";
    else if (filterPreset === "vivid")   f += " saturate(200%) contrast(110%)";

    ctx.filter = f;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(imageObj, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
    ctx.restore();
  }, [imageObj, brightness, contrast, saturation, rotation, flipH, flipV, filterPreset]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  // ── History ──────────────────────────────────────────────────
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    setHistory((prev) => [...prev.slice(-20), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(prev, 0, 0);
  };

  // ── Canvas Drawing ───────────────────────────────────────────
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeHandle) return;
    saveState();
    const coords = getCoords(e);
    isDrawingRef.current = true;
    startPosRef.current = coords;
    lastPosRef.current = coords;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeHandle) return;
    const coords = getCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPosRef.current) return;

    if (tool === "pen" || tool === "brush" || tool === "erase") {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
      ctx.lineTo(coords.x, coords.y);
      if (tool === "erase") {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = brushSize * 5;
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = color;
        ctx.lineWidth = tool === "brush" ? brushSize * 3 : brushSize;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
      lastPosRef.current = coords;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current && startPosRef.current && (tool === "rect" || tool === "circle")) {
      const coords = getCoords(e);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineJoin = "round";
        const w = coords.x - startPosRef.current.x;
        const h = coords.y - startPosRef.current.y;
        if (tool === "rect") {
          ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
        } else {
          ctx.beginPath();
          const r = Math.sqrt(w * w + h * h) / 2;
          ctx.arc(startPosRef.current.x + w / 2, startPosRef.current.y + h / 2, r, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
    startPosRef.current = null;
    if (activeHandle) setActiveHandle(null);
  };

  // ── Crop Handles ─────────────────────────────────────────────
  const startHandleDrag = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = { x: e.clientX, y: e.clientY, initialBox: { ...cropBox } };
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !dragStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
    const b = dragStartRef.current.initialBox;
    setCropBox(() => {
      let { top, left, right, bottom } = b;
      if (activeHandle.includes("n")) top = Math.min(80, Math.max(0, b.top + dy));
      if (activeHandle.includes("s")) bottom = Math.min(80, Math.max(0, b.bottom - dy));
      if (activeHandle.includes("w")) left = Math.min(80, Math.max(0, b.left + dx));
      if (activeHandle.includes("e")) right = Math.min(80, Math.max(0, b.right - dx));
      return { top, left, right, bottom };
    });
  }, [activeHandle]);

  const handleGlobalMouseUp = useCallback(() => {
    if (activeHandle) setActiveHandle(null);
  }, [activeHandle]);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [activeHandle, handleGlobalMouseMove, handleGlobalMouseUp]);

  // ── Text Overlay ─────────────────────────────────────────────
  const handleAddText = () => {
    if (!captionText.trim()) return;
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.save();
    ctx.font = `bold ${fontSize * 2}px ${fontFamily}, sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 8;
    ctx.textAlign = "center";
    ctx.fillText(captionText, canvas.width / 2, canvas.height / 2);
    ctx.restore();
    setCaptionText("");
  };

  // ── Export / Save ─────────────────────────────────────────────
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cropX = (cropBox.left / 100) * canvas.width;
    const cropY = (cropBox.top / 100) * canvas.height;
    const cropW = canvas.width * (1 - (cropBox.left + cropBox.right) / 100);
    const cropH = canvas.height * (1 - (cropBox.top + cropBox.bottom) / 100);
    const out = document.createElement("canvas");
    out.width = Math.max(10, cropW);
    out.height = Math.max(10, cropH);
    out.getContext("2d")?.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, out.width, out.height);
    out.toBlob((blob) => {
      if (!blob) return;
      onSave(new File([blob], `edited_${file.name.replace(/\.[^/.]+$/, "")}.png`, { type: "image/png" }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, "image/png", 0.95);
  };

  const handleDownloadDirect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `edited_${file.name.replace(/\.[^/.]+$/, "")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const TOOLS = [
    { id: "pen",    icon: <Pencil className="w-3.5 h-3.5" />, label: "Pen" },
    { id: "brush",  icon: <Paintbrush className="w-3.5 h-3.5" />, label: "Brush" },
    { id: "rect",   icon: <Square className="w-3.5 h-3.5" />, label: "Box" },
    { id: "circle", icon: <Circle className="w-3.5 h-3.5" />, label: "Circle" },
    { id: "erase",  icon: <Eraser className="w-3.5 h-3.5" />, label: "Erase" },
  ] as const;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden text-slate-100"
         style={{ background: "#090b10", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header className="flex-shrink-0 h-12 px-4 border-b border-white/10 flex items-center justify-between"
              style={{ background: "#0d1018" }}>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <div className="w-6 h-6 rounded-md flex items-center justify-center shadow"
               style={{ background: "linear-gradient(135deg, #22d3ee, #6366f1)" }}>
            <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" />
          </div>
          <span className="text-white font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>FileForge</span>
          <span className="text-slate-600 mx-1">›</span>
          <span className="text-cyan-400 font-medium text-xs hidden sm:block">Canvas Studio Premium</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleUndo} disabled={history.length === 0}
                  className="px-2.5 py-1 rounded-lg text-slate-300 text-xs font-medium flex items-center gap-1 transition disabled:opacity-30"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  title="Undo (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
          <button onClick={handleDownloadDirect}
                  className="px-2.5 py-1 rounded-lg text-slate-300 text-xs font-medium flex items-center gap-1 transition"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  title="Quick Download PNG">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={handleSave}
                  className="px-3.5 py-1.5 rounded-lg font-semibold text-xs text-white flex items-center gap-1.5 transition shadow-lg"
                  style={{ background: saved ? "#16a34a" : "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
            {saved ? <><Star className="w-3.5 h-3.5" fill="currentColor" /> Saved!</> : <><Check className="w-3.5 h-3.5" /> Save Changes</>}
          </button>
          <button onClick={onCancel} className="ml-1 p-1 text-slate-500 hover:text-white transition" title="Close Editor">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Main Body ── */}
      <div className="flex-1 grid overflow-hidden min-h-0" style={{ gridTemplateColumns: "1fr 220px" }}>

        {/* ── Canvas Workspace ── */}
        <div className="flex flex-col overflow-hidden min-h-0 border-r border-white/10">

          {/* Sub-toolbar */}
          <div className="flex-shrink-0 px-3 py-1.5 border-b border-white/10 flex items-center gap-3 flex-wrap"
               style={{ background: "#0f1220" }}>

            {/* Tool group */}
            <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: "rgba(0,0,0,0.4)" }}>
              {TOOLS.map(({ id, icon, label }) => (
                <button key={id}
                        onClick={() => setTool(id as typeof tool)}
                        className={`px-2 py-1 rounded-md flex items-center gap-1 text-xs font-medium transition ${
                          tool === id ? "text-white shadow" : "text-slate-400 hover:text-slate-200"
                        }`}
                        style={tool === id ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)" } : {}}>
                  {icon} <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Color palette */}
            <div className="flex items-center gap-1">
              {COLOR_PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)}
                        className={`rounded-full border transition flex-shrink-0 ${
                          color === c ? "scale-125 ring-2 ring-cyan-400 border-transparent" : "border-white/20"
                        }`}
                        style={{ width: "14px", height: "14px", background: c }} />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
                     className="w-6 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
                     title="Custom color" />
            </div>

            {/* Brush size */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="hidden sm:block">Size</span>
              <input type="range" min={1} max={30} value={brushSize}
                     onChange={(e) => setBrushSize(Number(e.target.value))}
                     className="w-16 accent-cyan-500 h-1 cursor-pointer" />
              <span className="font-mono text-cyan-400 w-5 text-center">{brushSize}</span>
            </div>

            {/* Zoom */}
            <div className="flex items-center gap-0.5 rounded-lg p-0.5 ml-auto" style={{ background: "rgba(0,0,0,0.4)" }}>
              <button onClick={() => setZoomLevel((z) => Math.max(0.25, z - 0.1))}
                      className="p-1 text-slate-400 hover:text-white transition"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="font-mono text-xs px-1.5 text-cyan-400 font-bold">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel((z) => Math.min(4, z + 0.1))}
                      className="p-1 text-slate-400 hover:text-white transition"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setZoomLevel(1)}
                      className="p-1 text-slate-400 hover:text-white transition" title="Reset zoom"><Maximize2 className="w-3 h-3" /></button>
            </div>
          </div>

          {/* Canvas area */}
          <div ref={containerRef}
               className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0"
               style={{ background: "radial-gradient(ellipse at center, #12182b 0%, #090b10 100%)",
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                        backgroundSize: "24px 24px" }}>
            <div className="relative inline-block select-none transition-transform duration-150"
                 style={{ transform: `scale(${zoomLevel})` }}>
              <canvas ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="block rounded-md border border-white/15 shadow-2xl cursor-crosshair"
                      style={{ maxWidth: "100%", maxHeight: "calc(100vh - 200px)", objectFit: "contain" }} />

              {/* Crop overlay */}
              <div className="absolute border-2 border-cyan-400 border-dashed pointer-events-none rounded-sm"
                   style={{ top: `${cropBox.top}%`, left: `${cropBox.left}%`,
                            right: `${cropBox.right}%`, bottom: `${cropBox.bottom}%`,
                            boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />

              {/* 8 crop handles */}
              {[
                { h: "nw", style: { top: `calc(${cropBox.top}% - 7px)`,    left: `calc(${cropBox.left}% - 7px)`,  cursor: "nwse-resize" }},
                { h: "n",  style: { top: `calc(${cropBox.top}% - 7px)`,    left: `calc(50% - 7px)`,               cursor: "ns-resize"   }},
                { h: "ne", style: { top: `calc(${cropBox.top}% - 7px)`,    right: `calc(${cropBox.right}% - 7px)`,cursor: "nesw-resize" }},
                { h: "w",  style: { top: `calc(50% - 7px)`,                left: `calc(${cropBox.left}% - 7px)`,  cursor: "ew-resize"   }},
                { h: "e",  style: { top: `calc(50% - 7px)`,                right: `calc(${cropBox.right}% - 7px)`,cursor: "ew-resize"   }},
                { h: "sw", style: { bottom: `calc(${cropBox.bottom}% - 7px)`,left: `calc(${cropBox.left}% - 7px)`,cursor: "nesw-resize" }},
                { h: "s",  style: { bottom: `calc(${cropBox.bottom}% - 7px)`,left: `calc(50% - 7px)`,             cursor: "ns-resize"   }},
                { h: "se", style: { bottom: `calc(${cropBox.bottom}% - 7px)`,right:`calc(${cropBox.right}% - 7px)`,cursor:"nwse-resize" }},
              ].map(({ h, style }) => (
                <div key={h}
                     onMouseDown={(e) => startHandleDrag(h, e)}
                     className="absolute w-3.5 h-3.5 rounded-full border-2 border-white z-20 hover:scale-125 transition-transform"
                     style={{ ...style, background: "linear-gradient(135deg, #22d3ee, #6366f1)", width: "14px", height: "14px" }} />
              ))}
            </div>
          </div>

          {/* Bottom controls strip */}
          <div className="flex-shrink-0 grid grid-cols-4 gap-2 p-2 border-t border-white/10"
               style={{ background: "#0d1018", height: "64px" }}>
            {/* Rotate + Flip */}
            <div className="flex items-center gap-1 rounded-xl p-1.5 border border-white/10" style={{ background: "#151822" }}>
              <button onClick={() => setRotation((r) => (r + 90) % 360)}
                      className="flex-1 py-0.5 rounded text-slate-200 text-xs font-medium flex items-center justify-center gap-1 hover:bg-white/10 transition">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> 90°
              </button>
              <button onClick={() => setFlipH(!flipH)}
                      className={`p-1 rounded transition ${flipH ? "text-white" : "text-slate-400 hover:text-white"}`}
                      style={flipH ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)" } : {}}>
                <FlipHorizontal className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setFlipV(!flipV)}
                      className={`p-1 rounded transition ${flipV ? "text-white" : "text-slate-400 hover:text-white"}`}
                      style={flipV ? { background: "linear-gradient(135deg, #2563eb, #7c3aed)" } : {}}>
                <FlipVertical className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Brightness */}
            <div className="rounded-xl p-1.5 border border-white/10 flex flex-col justify-center" style={{ background: "#151822" }}>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                <span className="flex items-center gap-0.5"><Sun className="w-3 h-3 text-amber-400" /> Brightness</span>
                <span className="font-mono text-cyan-400 font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
              </div>
              <input type="range" min={-100} max={100} value={brightness}
                     onChange={(e) => setBrightness(Number(e.target.value))}
                     className="w-full accent-amber-400 h-1 cursor-pointer" />
            </div>

            {/* Contrast */}
            <div className="rounded-xl p-1.5 border border-white/10 flex flex-col justify-center" style={{ background: "#151822" }}>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-0.5">
                <span className="flex items-center gap-0.5"><ContrastIcon className="w-3 h-3 text-blue-400" /> Contrast</span>
                <span className="font-mono text-cyan-400 font-bold">{contrast > 0 ? `+${contrast}` : contrast}</span>
              </div>
              <input type="range" min={-100} max={100} value={contrast}
                     onChange={(e) => setContrast(Number(e.target.value))}
                     className="w-full accent-blue-400 h-1 cursor-pointer" />
            </div>

            {/* Filter Preset */}
            <div className="rounded-xl p-1.5 border border-white/10 flex flex-col justify-center" style={{ background: "#151822" }}>
              <div className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-purple-400" /> Filter Preset
              </div>
              <select value={filterPreset} onChange={(e) => setFilterPreset(e.target.value as typeof filterPreset)}
                      className="w-full text-[11px] text-slate-200 rounded p-0.5 outline-none border border-white/10"
                      style={{ background: "#1c2030" }}>
                {FILTER_PRESETS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div className="flex flex-col overflow-y-auto text-left p-3 gap-3" style={{ background: "#0d1018" }}>

          {/* Text Annotation */}
          <div className="rounded-xl border border-white/10 p-3" style={{ background: "#111520" }}>
            <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}>
              <Type className="w-3.5 h-3.5 text-cyan-400" /> Text Annotation
            </h4>
            <textarea value={captionText} onChange={(e) => setCaptionText(e.target.value)}
                      placeholder="Type caption text..."
                      className="w-full h-16 rounded-lg p-2 text-xs text-slate-200 outline-none resize-none border border-white/10 focus:border-cyan-500 transition"
                      style={{ background: "#181c2a" }} />
            <div className="grid grid-cols-2 gap-1.5 mt-2 mb-2">
              <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                      className="rounded-lg p-1 text-[11px] text-slate-200 outline-none border border-white/10"
                      style={{ background: "#181c2a" }}>
                {["Inter", "Outfit", "Roboto", "Georgia", "Courier New"].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                      className="rounded-lg p-1 text-[11px] text-slate-200 outline-none border border-white/10"
                      style={{ background: "#181c2a" }}>
                {[14, 18, 24, 32, 48, 64].map((s) => (
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
            <button onClick={handleAddText}
                    className="w-full py-1.5 rounded-lg text-xs font-semibold text-white transition"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)" }}>
              ＋ Add Text to Image
            </button>
          </div>

          {/* Saturation */}
          <div className="rounded-xl border border-white/10 p-3" style={{ background: "#111520" }}>
            <div className="flex justify-between items-center text-xs text-slate-400 mb-1.5">
              <span className="font-medium text-slate-200">Saturation</span>
              <span className="font-mono text-cyan-400">{saturation > 0 ? `+${saturation}` : saturation}</span>
            </div>
            <input type="range" min={-100} max={100} value={saturation}
                   onChange={(e) => setSaturation(Number(e.target.value))}
                   className="w-full accent-pink-400 h-1 cursor-pointer" />
          </div>

          {/* Crop Reset */}
          <div className="rounded-xl border border-white/10 p-3" style={{ background: "#111520" }}>
            <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5"
                style={{ fontFamily: "'Outfit', sans-serif" }}>
              <Crop className="w-3.5 h-3.5 text-amber-400" /> Crop Box
            </h4>
            <p className="text-[10px] text-slate-500 mb-2">Drag the 8 blue handles on canvas to crop the image region.</p>
            <button onClick={() => setCropBox({ top: 0, left: 0, right: 0, bottom: 0 })}
                    className="w-full py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white hover:bg-white/5 transition">
              Reset Crop
            </button>
          </div>

          {/* Premium badge */}
          <div className="rounded-xl p-3 text-center text-[10px] text-slate-500 border border-white/5 mt-auto"
               style={{ background: "rgba(99,102,241,0.05)" }}>
            <Sparkles className="w-3.5 h-3.5 text-purple-400 mx-auto mb-1" />
            <span className="text-purple-400 font-semibold">Premium Canvas Studio</span>
            <br />⚡ Zero-scroll · Full-viewport workspace
          </div>
        </div>
      </div>
    </div>
  );
}
