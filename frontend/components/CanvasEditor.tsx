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
} from "lucide-react";

interface CanvasEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function CanvasEditor({ file, onSave, onCancel }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Tools: 'pen' | 'brush' | 'erase' | 'rect' | 'circle'
  const [tool, setTool] = useState<"pen" | "brush" | "erase" | "rect" | "circle">("pen");
  const [color, setColor] = useState("#3b82f6");
  const [brushSize, setBrushSize] = useState(6);

  // Adjustments & Transforms
  const [brightness, setBrightness] = useState(15);
  const [contrast, setContrast] = useState(28);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [filterPreset, setFilterPreset] = useState<"none" | "grayscale" | "sepia" | "invert" | "warm">("none");

  // Snipping Tool Crop Box (inset percentages 0-100)
  const [cropBox, setCropBox] = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialBox: typeof cropBox } | null>(null);

  // Sidebar Text Annotation state
  const [captionText, setCaptionText] = useState("Golden Hour View");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);

  // History stack for undo
  const [history, setHistory] = useState<ImageData[]>([]);

  // Drawing state
  const isDrawingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Load Image File
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImageObj(img);
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Redraw Canvas with adjustments
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageObj.naturalWidth || 800;
    canvas.height = imageObj.naturalHeight || 600;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const brightnessVal = 100 + brightness;
    const contrastVal = 100 + contrast;

    let filterStr = `brightness(${brightnessVal}%) contrast(${contrastVal}%)`;
    if (filterPreset === "grayscale") filterStr += " grayscale(100%)";
    if (filterPreset === "sepia") filterStr += " sepia(80%)";
    if (filterPreset === "invert") filterStr += " invert(100%)";
    if (filterPreset === "warm") filterStr += " sepia(30%) hue-rotate(-10deg)";

    ctx.filter = filterStr;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    ctx.drawImage(
      imageObj,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );

    ctx.restore();
  }, [imageObj, brightness, contrast, rotation, flipH, flipV, filterPreset]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-15), data]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(previous, 0, 0);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeHandle) return;
    const coords = getCanvasCoords(e);
    saveState();
    isDrawingRef.current = true;
    startPosRef.current = coords;
    lastPosRef.current = coords;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeHandle) return;
    const coords = getCanvasCoords(e);
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
        ctx.lineWidth = brushSize * 4;
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
      const coords = getCanvasCoords(e);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = brushSize;
          const w = coords.x - startPosRef.current.x;
          const h = coords.y - startPosRef.current.y;
          if (tool === "rect") {
            ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
          } else if (tool === "circle") {
            ctx.beginPath();
            const radius = Math.sqrt(w * w + h * h) / 2;
            const cx = startPosRef.current.x + w / 2;
            const cy = startPosRef.current.y + h / 2;
            ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }

    isDrawingRef.current = false;
    lastPosRef.current = null;
    startPosRef.current = null;
    if (activeHandle) setActiveHandle(null);
  };

  // Dragging Snipping Tool Handles
  const startHandleDrag = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialBox: { ...cropBox },
    };
  };

  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!activeHandle || !dragStartRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

      const initial = dragStartRef.current.initialBox;

      setCropBox(() => {
        let { top, left, right, bottom } = initial;

        if (activeHandle.includes("n")) top = Math.min(80, Math.max(0, initial.top + deltaY));
        if (activeHandle.includes("s")) bottom = Math.min(80, Math.max(0, initial.bottom - deltaY));
        if (activeHandle.includes("w")) left = Math.min(80, Math.max(0, initial.left + deltaX));
        if (activeHandle.includes("e")) right = Math.min(80, Math.max(0, initial.right - deltaX));

        return { top, left, right, bottom };
      });
    },
    [activeHandle]
  );

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

  const handleAddText = () => {
    if (!captionText.trim()) return;
    saveState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.font = `bold ${Math.max(20, fontSize * 2)}px ${fontFamily}, sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 6;
    ctx.fillText(captionText, canvas.width / 4, canvas.height / 2);
    ctx.restore();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cropX = (cropBox.left / 100) * canvas.width;
    const cropY = (cropBox.top / 100) * canvas.height;
    const cropW = canvas.width * (1 - (cropBox.left + cropBox.right) / 100);
    const cropH = canvas.height * (1 - (cropBox.top + cropBox.bottom) / 100);

    const outCanvas = document.createElement("canvas");
    outCanvas.width = Math.max(10, cropW);
    outCanvas.height = Math.max(10, cropH);

    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) return;

    outCtx.drawImage(
      canvas,
      cropX,
      cropY,
      cropW,
      cropH,
      0,
      0,
      outCanvas.width,
      outCanvas.height
    );

    outCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const editedFilename = `edited_${file.name.replace(/\.[^/.]+$/, "")}.png`;
        const newFile = new File([blob], editedFilename, { type: "image/png" });
        onSave(newFile);
      },
      "image/png",
      0.95
    );
  };

  const COLOR_PALETTE = ["#3b82f6", "#ef4444", "#eab308", "#22c55e", "#ffffff"];

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      {/* 100% Viewport Single Page Shell (Zero Scrolling) */}
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Header */}
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-[#131620] flex-shrink-0">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-300">
            <div className="w-5 h-5 rounded bg-gradient-to-r from-cyan-400 to-indigo-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" fill="currentColor" />
            </div>
            <span>FileForge</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-white font-bold">Canvas Studio (Premium)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-slate-200 text-xs font-medium flex items-center gap-1 transition"
            >
              <Undo2 className="w-3.5 h-3.5" /> Undo
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
            >
              Save Changes
            </button>
            <button onClick={onCancel} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Single Page Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 overflow-hidden">
          
          {/* Main Viewport Column (3 cols) */}
          <div className="lg:col-span-3 border-r border-white/10 p-3 flex flex-col justify-between overflow-hidden">
            
            {/* Top Toolbar Sub-Bar */}
            <div className="bg-[#151822] border border-white/10 rounded-xl p-2 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
              
              {/* Tool selector */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
                <button
                  onClick={() => setTool("pen")}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    tool === "pen" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Pen
                </button>
                <button
                  onClick={() => setTool("brush")}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    tool === "brush" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" /> Brush
                </button>
                <button
                  onClick={() => setTool("rect")}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    tool === "rect" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Square className="w-3.5 h-3.5" /> Box
                </button>
                <button
                  onClick={() => setTool("circle")}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    tool === "circle" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Circle className="w-3.5 h-3.5" /> Circle
                </button>
                <button
                  onClick={() => setTool("erase")}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition ${
                    tool === "erase" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" /> Erase
                </button>
              </div>

              {/* Color Palette */}
              <div className="flex items-center gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-4 h-4 rounded-full border border-white/20 transition ${
                      color === c ? "scale-125 ring-2 ring-blue-400" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Zoom Level Controls */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg text-slate-300">
                <button onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))} className="p-1 hover:text-white">
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.15))} className="p-1 hover:text-white">
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setZoomLevel(1)} className="p-1 hover:text-white text-[10px] font-bold">
                  <Maximize2 className="w-3 h-3" />
                </button>
              </div>

            </div>

            {/* Main Canvas Viewport (Zero Scrollable Fit) */}
            <div
              ref={containerRef}
              className="relative flex-1 canvas-grid-bg rounded-xl border border-white/10 flex items-center justify-center p-2 overflow-hidden"
            >
              <div
                className="relative inline-block select-none transition-transform duration-150"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="max-w-full max-h-[46vh] object-contain shadow-2xl cursor-crosshair border border-white/20 rounded-md block"
                />

                {/* Crop Marquee */}
                <div
                  className="absolute border-2 border-blue-400 border-dashed pointer-events-none"
                  style={{
                    top: `${cropBox.top}%`,
                    left: `${cropBox.left}%`,
                    right: `${cropBox.right}%`,
                    bottom: `${cropBox.bottom}%`,
                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                  }}
                />

                {/* 8 Snipping Tool Handles */}
                <div onMouseDown={(e) => startHandleDrag("nw", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-nwse-resize z-20 hover:scale-125" style={{ top: `calc(${cropBox.top}% - 7px)`, left: `calc(${cropBox.left}% - 7px)` }} />
                <div onMouseDown={(e) => startHandleDrag("n", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-ns-resize z-20 hover:scale-125" style={{ top: `calc(${cropBox.top}% - 7px)`, left: `calc(50% + ${cropBox.left / 2}% - ${cropBox.right / 2}% - 7px)` }} />
                <div onMouseDown={(e) => startHandleDrag("ne", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-nesw-resize z-20 hover:scale-125" style={{ top: `calc(${cropBox.top}% - 7px)`, right: `calc(${cropBox.right}% - 7px)` }} />

                <div onMouseDown={(e) => startHandleDrag("w", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-ew-resize z-20 hover:scale-125" style={{ top: `calc(50% + ${cropBox.top / 2}% - ${cropBox.bottom / 2}% - 7px)`, left: `calc(${cropBox.left}% - 7px)` }} />
                <div onMouseDown={(e) => startHandleDrag("e", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-ew-resize z-20 hover:scale-125" style={{ top: `calc(50% + ${cropBox.top / 2}% - ${cropBox.bottom / 2}% - 7px)`, right: `calc(${cropBox.right}% - 7px)` }} />

                <div onMouseDown={(e) => startHandleDrag("sw", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-nesw-resize z-20 hover:scale-125" style={{ bottom: `calc(${cropBox.bottom}% - 7px)`, left: `calc(${cropBox.left}% - 7px)` }} />
                <div onMouseDown={(e) => startHandleDrag("s", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-ns-resize z-20 hover:scale-125" style={{ bottom: `calc(${cropBox.bottom}% - 7px)`, left: `calc(50% + ${cropBox.left / 2}% - ${cropBox.right / 2}% - 7px)` }} />
                <div onMouseDown={(e) => startHandleDrag("se", e)} className="absolute w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white cursor-nwse-resize z-20 hover:scale-125" style={{ bottom: `calc(${cropBox.bottom}% - 7px)`, right: `calc(${cropBox.right}% - 7px)` }} />
              </div>
            </div>

            {/* Bottom Controls Row: Rotate, Flip, Brightness, Contrast */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-shrink-0">
              
              {/* Rotate & Flips */}
              <div className="flex items-center gap-1 bg-[#151822] border border-white/10 rounded-xl p-1.5">
                <button onClick={() => setRotation((r) => (r + 90) % 360)} className="flex-1 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-medium flex items-center justify-center gap-1">
                  <RotateCw className="w-3.5 h-3.5 text-blue-400" /> 90°
                </button>
                <button onClick={() => setFlipH(!flipH)} className={`p-1 rounded ${flipH ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"}`}>
                  <FlipHorizontal className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setFlipV(!flipV)} className={`p-1 rounded ${flipV ? "bg-blue-600 text-white" : "bg-white/5 text-slate-300"}`}>
                  <FlipVertical className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Brightness */}
              <div className="bg-[#151822] border border-white/10 rounded-xl p-2 text-left">
                <div className="flex justify-between items-center text-[11px] text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><Sun className="w-3 h-3 text-amber-400" /> Brightness</span>
                  <span className="font-mono text-blue-400 font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
                </div>
                <input type="range" min={-100} max={100} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-blue-500 h-1 cursor-pointer" />
              </div>

              {/* Contrast */}
              <div className="bg-[#151822] border border-white/10 rounded-xl p-2 text-left">
                <div className="flex justify-between items-center text-[11px] text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><ContrastIcon className="w-3 h-3 text-blue-400" /> Contrast</span>
                  <span className="font-mono text-blue-400 font-bold">{contrast > 0 ? `+${contrast}` : contrast}</span>
                </div>
                <input type="range" min={-100} max={100} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-blue-500 h-1 cursor-pointer" />
              </div>

              {/* Premium Filter Presets */}
              <div className="bg-[#151822] border border-white/10 rounded-xl p-2 text-left">
                <div className="text-[11px] text-slate-300 mb-1 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Filter Presets
                </div>
                <select
                  value={filterPreset}
                  onChange={(e) => setFilterPreset(e.target.value as any)}
                  className="w-full bg-[#1c202d] border border-white/10 rounded text-[11px] text-slate-200 p-1 outline-none"
                >
                  <option value="none">Original</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="sepia">Sepia Vintage</option>
                  <option value="warm">Warm Film</option>
                  <option value="invert">Invert Colors</option>
                </select>
              </div>

            </div>

          </div>

          {/* Right Sidebar Column */}
          <div className="p-3 bg-[#11141d] flex flex-col justify-between text-left border-t lg:border-t-0 border-white/10 overflow-hidden">
            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                <Type className="w-3.5 h-3.5 text-cyan-400" /> Text Annotation
              </h4>
              <p className="text-[11px] text-slate-400 mb-2">Add caption stamp...</p>

              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Type caption..."
                className="w-full h-16 bg-[#181b26] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:border-blue-500 outline-none resize-none mb-2"
              />

              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-[#181b26] border border-white/10 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Roboto">Roboto</option>
                </select>

                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-[#181b26] border border-white/10 rounded-lg p-1.5 text-[11px] text-slate-200 outline-none"
                >
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                </select>

                <div className="bg-[#181b26] border border-white/10 rounded-lg p-1 flex items-center justify-center">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleAddText}
                className="w-full py-2 rounded-xl bg-[#262c3d] hover:bg-[#32394f] text-slate-200 font-semibold text-xs transition"
              >
                Add Text
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              ⚡ Premium: Snipping tool handles, Zoom, Flip H/V &amp; Undo enabled.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
