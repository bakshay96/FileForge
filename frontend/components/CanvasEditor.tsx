"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  RotateCw,
  Type,
  Pencil,
  Paintbrush,
  Eraser,
  X,
  Zap,
  ChevronDown,
  Sun,
  Contrast as ContrastIcon,
} from "lucide-react";

interface CanvasEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function CanvasEditor({ file, onSave, onCancel }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Tools: 'pen' | 'brush' | 'erase'
  const [tool, setTool] = useState<"pen" | "brush" | "erase">("pen");
  const [color, setColor] = useState("#3b82f6");
  const [brushSize, setBrushSize] = useState(6);
  
  // Adjustments (-100 to +100 as shown in Image 2)
  const [brightness, setBrightness] = useState(15);
  const [contrast, setContrast] = useState(28);
  const [rotation, setRotation] = useState(0);

  // Sidebar Text Annotation state
  const [captionText, setCaptionText] = useState("Golden Hour View");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);

  // History stack for undo
  const [history, setHistory] = useState<ImageData[]>([]);

  // Drawing state
  const isDrawingRef = useRef(false);
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

    // CSS filter values: 100 + brightness, 100 + contrast
    const brightnessVal = 100 + brightness;
    const contrastVal = 100 + contrast;
    ctx.filter = `brightness(${brightnessVal}%) contrast(${contrastVal}%)`;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    ctx.drawImage(
      imageObj,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );

    ctx.restore();
  }, [imageObj, brightness, contrast, rotation]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]);
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
    const coords = getCanvasCoords(e);
    saveState();
    isDrawingRef.current = true;
    lastPosRef.current = coords;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPosRef.current) return;

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
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  // Stamp Text from Sidebar onto Canvas
  const handleAddText = () => {
    if (!captionText.trim()) return;
    saveState();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.font = `bold ${Math.max(24, fontSize * 2)}px ${fontFamily}, sans-serif`;
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.8)";
    ctx.shadowBlur = 6;
    ctx.fillText(captionText, canvas.width / 4, canvas.height / 2);
    ctx.restore();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      {/* Modal Shell matching Reference Image 2 */}
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Modal Header matching Reference Image 2 */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#131620]">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300">
            <div className="w-5 h-5 rounded bg-gradient-to-r from-cyan-400 to-indigo-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" fill="currentColor" />
            </div>
            <span>FileForge</span>
            <span className="text-slate-600">&gt;</span>
            <span className="text-white font-bold">Image Editor</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition"
            >
              Save Changes
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button onClick={onCancel} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Editor Body Grid: Main Viewport Left + Text Annotation Sidebar Right */}
        <div className="grid grid-cols-1 lg:grid-cols-4 flex-1">
          
          {/* Main Viewport Column (3 cols) */}
          <div className="lg:col-span-3 border-r border-white/10 p-4 flex flex-col justify-between">
            
            {/* Top Toolbar Sub-Bar matching Reference Image 2 */}
            <div className="bg-[#151822] border border-white/10 rounded-xl p-2 mb-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              
              {/* Tool selector: Pen, Brush, Erase */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg">
                <button
                  onClick={() => setTool("pen")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition ${
                    tool === "pen" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Pencil className="w-3.5 h-3.5" /> Pen
                </button>
                <button
                  onClick={() => setTool("brush")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition ${
                    tool === "brush" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Paintbrush className="w-3.5 h-3.5" /> Brush
                </button>
                <button
                  onClick={() => setTool("erase")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-medium transition ${
                    tool === "erase" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5" /> Erase
                </button>
              </div>

              {/* Color Palette Dots */}
              <div className="flex items-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border border-white/20 transition ${
                      color === c ? "scale-125 ring-2 ring-blue-400" : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              {/* Stroke Size Slider */}
              <div className="flex items-center gap-2 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <input
                  type="range"
                  min={2}
                  max={25}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-28 accent-blue-500 cursor-pointer"
                />
              </div>

            </div>

            {/* Main Canvas Viewport with Grid Pattern & 8 Blue Handles matching Image 2 */}
            <div className="relative flex-1 canvas-grid-bg rounded-xl border border-white/10 flex items-center justify-center p-6 min-h-[320px] overflow-hidden">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="max-w-full max-h-[48vh] object-contain shadow-2xl cursor-crosshair border border-white/20 rounded-md"
                />

                {/* 8 Blue Round Handles matching Reference Image 2 */}
                <div className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                
                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                
                <div className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border border-white shadow" />
              </div>
            </div>

            {/* Bottom 3 Cards matching Reference Image 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              
              {/* Card 1: Rotate 90° */}
              <button
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="bg-[#151822] border border-white/10 hover:border-blue-500/40 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-semibold text-slate-200 transition"
              >
                <RotateCw className="w-4 h-4 text-blue-400" /> Rotate 90°
              </button>

              {/* Card 2: Brightness Slider (-100 to +100) */}
              <div className="bg-[#151822] border border-white/10 rounded-xl p-3 text-left">
                <div className="flex justify-between items-center text-xs text-slate-300 font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-400" /> Brightness
                  </span>
                  <span className="font-mono text-blue-400 font-bold">{brightness > 0 ? `+${brightness}` : brightness}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>-100</span>
                  <span>+100</span>
                </div>
              </div>

              {/* Card 3: Contrast Slider (-100 to +100) */}
              <div className="bg-[#151822] border border-white/10 rounded-xl p-3 text-left">
                <div className="flex justify-between items-center text-xs text-slate-300 font-medium mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <ContrastIcon className="w-3.5 h-3.5 text-blue-400" /> Contrast
                  </span>
                  <span className="font-mono text-blue-400 font-bold">{contrast > 0 ? `+${contrast}` : contrast}</span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                  <span>-100</span>
                  <span>+100</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Sidebar Column matching Reference Image 2 */}
          <div className="p-4 bg-[#11141d] flex flex-col justify-between text-left">
            <div>
              <h4 className="text-sm font-bold text-slate-200 mb-1" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Text Annotation
              </h4>
              <p className="text-xs text-slate-400 mb-4">Add caption here...</p>

              {/* Caption Textarea matching Image 2 */}
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Type caption..."
                className="w-full h-24 bg-[#181b26] border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:border-blue-500 outline-none resize-none mb-4"
              />

              {/* Controls Row: Font, Size, Color matching Image 2 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="bg-[#181b26] border border-white/10 rounded-lg p-2 text-xs text-slate-200 outline-none"
                >
                  <option value="Inter">Inter</option>
                  <option value="Outfit">Outfit</option>
                  <option value="Roboto">Roboto</option>
                </select>

                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="bg-[#181b26] border border-white/10 rounded-lg p-2 text-xs text-slate-200 outline-none"
                >
                  <option value={14}>14px</option>
                  <option value={16}>16px</option>
                  <option value={20}>20px</option>
                  <option value={24}>24px</option>
                </select>

                <div className="bg-[#181b26] border border-white/10 rounded-lg p-1.5 flex items-center justify-center">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                  />
                </div>
              </div>

              {/* Add Text Button matching Image 2 */}
              <button
                onClick={handleAddText}
                className="w-full py-2.5 rounded-xl bg-[#262c3d] hover:bg-[#32394f] text-slate-200 font-semibold text-xs transition"
              >
                Add Text
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-6">
              💡 Use Pen &amp; Brush to annotate directly on canvas.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
