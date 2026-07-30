"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Pencil,
  RotateCcw,
  Check,
  X,
  Sliders,
  Palette,
  Eye,
  Download,
} from "lucide-react";

interface CanvasEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

export default function CanvasEditor({ file, onSave, onCancel }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Tools & State
  const [tool, setTool] = useState<"draw" | "text" | "adjust">("draw");
  const [color, setColor] = useState("#6366f1");
  const [brushSize, setBrushSize] = useState(5);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [textInput, setTextInput] = useState("");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // History stack for undo
  const [history, setHistory] = useState<ImageData[]>([]);

  // Load Image File into HTMLImageElement
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

  // Render Image and adjustments onto Canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions matching image
    canvas.width = imageObj.naturalWidth || 800;
    canvas.height = imageObj.naturalHeight || 600;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Filters & Transformations
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Move to center for rotation / flip
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
  }, [imageObj, brightness, contrast, rotation, flipH, flipV]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Save State to History
  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), data]);
  };

  // Undo Last Draw
  const handleUndo = () => {
    if (history.length === 0) {
      redrawCanvas();
      return;
    }
    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(previousState, 0, 0);
  };

  // Canvas Mouse Events (Drawing & Text)
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

    if (tool === "text" && textInput.trim()) {
      saveState();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.save();
      ctx.font = `bold ${Math.max(20, brushSize * 4)}px Outfit, sans-serif`;
      ctx.fillStyle = color;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;
      ctx.fillText(textInput, coords.x, coords.y);
      ctx.restore();
      return;
    }

    if (tool === "draw") {
      saveState();
      isDrawingRef.current = true;
      lastPosRef.current = coords;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || tool !== "draw") return;
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPosRef.current) return;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize * 2;
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

  // Save Modified Canvas to File
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

  const COLORS = ["#6366f1", "#ef4444", "#10b981", "#f59e0b", "#ec4899", "#ffffff", "#000000"];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Top Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-brand-400" />
            <h3 className="font-bold text-white text-base">Interactive Canvas Editor</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition text-xs flex items-center gap-1.5"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" /> Undo
            </button>
            <button
              onClick={onCancel}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b border-white/10 bg-white/[0.01] flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Main Tool Selector */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setTool("draw")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                tool === "draw" ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Pencil className="w-3.5 h-3.5" /> Draw
            </button>
            <button
              onClick={() => setTool("text")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                tool === "text" ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Text
            </button>
            <button
              onClick={() => setTool("adjust")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition ${
                tool === "adjust" ? "bg-brand-500 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> Adjust
            </button>
          </div>

          {/* Transform Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="p-2 text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg flex items-center gap-1"
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" /> 90°
            </button>
            <button
              onClick={() => setFlipH((prev) => !prev)}
              className={`p-2 rounded-lg flex items-center gap-1 transition ${
                flipH ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" /> Flip H
            </button>
            <button
              onClick={() => setFlipV((prev) => !prev)}
              className={`p-2 rounded-lg flex items-center gap-1 transition ${
                flipV ? "bg-brand-500/20 text-brand-300 border border-brand-500/30" : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" /> Flip V
            </button>
          </div>

          {/* Color Palette */}
          {(tool === "draw" || tool === "text") && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium text-[11px]">Color:</span>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-5 h-5 rounded-full border border-white/20 transition ${
                    color === c ? "scale-125 ring-2 ring-brand-400" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Tool Controls Sub-bar */}
        <div className="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-4 text-xs text-slate-300">
          {tool === "draw" && (
            <div className="flex items-center gap-3 w-full">
              <span className="text-slate-400">Brush Size: {brushSize}px</span>
              <input
                type="range"
                min={1}
                max={30}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-48 accent-brand-500"
              />
            </div>
          )}

          {tool === "text" && (
            <div className="flex items-center gap-3 w-full">
              <input
                type="text"
                placeholder="Type text, then click anywhere on image..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="forge-input py-1 text-xs max-w-md"
              />
              <span className="text-slate-500 text-[11px]">Click image to stamp text</span>
            </div>
          )}

          {tool === "adjust" && (
            <div className="flex items-center gap-6 w-full">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Brightness: {brightness}%</span>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-32 accent-brand-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Contrast: {contrast}%</span>
                <input
                  type="range"
                  min={20}
                  max={200}
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-32 accent-brand-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Canvas Display Viewport */}
        <div className="flex-1 p-4 overflow-auto flex items-center justify-center bg-black/40 min-h-[300px]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="max-w-full max-h-[55vh] object-contain cursor-crosshair rounded-lg shadow-lg border border-white/10"
          />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
          <p className="text-xs text-slate-500">
            Click &amp; drag on canvas to annotate. Changes will replace your file for processing.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="btn-ghost px-4 py-2 text-xs">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-brand px-5 py-2 text-xs font-semibold gap-1.5">
              <Check className="w-4 h-4" /> Save &amp; Apply Edits
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
