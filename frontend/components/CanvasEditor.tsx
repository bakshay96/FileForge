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
  Crop,
  ChevronDown,
  ChevronUp,
  Star,
  Droplets,
  Layers,
  SlidersHorizontal,
  Move,
  CornerUpLeft,
} from "lucide-react";

interface CanvasEditorProps {
  file: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

const COLOR_PALETTE = [
  "#3b82f6", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#a855f7", "#ec4899",
  "#ffffff", "#000000",
];

const FILTER_PRESETS = [
  { value: "none",      label: "Original"      },
  { value: "grayscale", label: "Grayscale"     },
  { value: "sepia",     label: "Sepia Vintage" },
  { value: "warm",      label: "Warm Film"     },
  { value: "cool",      label: "Cool Breeze"   },
  { value: "invert",    label: "Invert"        },
  { value: "vivid",     label: "Vivid Boost"   },
];

export default function CanvasEditor({ file, onSave, onCancel }: CanvasEditorProps) {
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imageObj,   setImageObj]   = useState<HTMLImageElement | null>(null);

  // ── Drawing ──────────────────────────────────────────────────
  const [tool,       setTool]       = useState<"pen"|"brush"|"erase"|"rect"|"circle">("pen");
  const [color,      setColor]      = useState("#3b82f6");
  const [brushSize,  setBrushSize]  = useState(6);

  // ── Adjustments ──────────────────────────────────────────────
  const [brightness, setBrightness] = useState(0);
  const [contrast,   setContrast]   = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation,   setRotation]   = useState(0);
  const [flipH,      setFlipH]      = useState(false);
  const [flipV,      setFlipV]      = useState(false);
  const [zoomLevel,  setZoomLevel]  = useState(1);
  const [filterPreset, setFilterPreset] = useState<"none"|"grayscale"|"sepia"|"invert"|"warm"|"cool"|"vivid">("none");

  // ── Crop ─────────────────────────────────────────────────────
  const [cropBox,      setCropBox]      = useState({ top: 0, left: 0, right: 0, bottom: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initialBox: typeof cropBox } | null>(null);

  // ── Text ─────────────────────────────────────────────────────
  const [captionText, setCaptionText] = useState("");
  const [fontFamily,  setFontFamily]  = useState("Inter");
  const [fontSize,    setFontSize]    = useState(24);

  // ── History / UI State ────────────────────────────────────────
  const [history,        setHistory]        = useState<ImageData[]>([]);
  const [saved,          setSaved]          = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [bottomOpen,     setBottomOpen]     = useState(true);
  const [mobilePanel,    setMobilePanel]    = useState<"tools"|"adjustments"|"text">("tools");

  const isDrawingRef  = useRef(false);
  const startPosRef   = useRef<{ x: number; y: number } | null>(null);
  const lastPosRef    = useRef<{ x: number; y: number } | null>(null);

  // ── Load image ───────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { setImageObj(img); };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Redraw ───────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width  = imageObj.naturalWidth  || 800;
    canvas.height = imageObj.naturalHeight || 600;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let f = `brightness(${100 + brightness}%) contrast(${100 + contrast}%) saturate(${100 + saturation}%)`;
    if (filterPreset === "grayscale") f += " grayscale(100%)";
    else if (filterPreset === "sepia")  f += " sepia(80%)";
    else if (filterPreset === "invert") f += " invert(100%)";
    else if (filterPreset === "warm")   f += " sepia(30%) hue-rotate(-10deg)";
    else if (filterPreset === "cool")   f += " hue-rotate(180deg) saturate(150%)";
    else if (filterPreset === "vivid")  f += " saturate(200%) contrast(110%)";

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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    setHistory(p => [...p.slice(-20), ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleUndo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.putImageData(prev, 0, 0);
  };

  // ── Drawing events ───────────────────────────────────────────
  const getCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width  / rect.width;
    const sy = canvas.height / rect.height;
    let cx: number, cy: number;
    if ("touches" in e) {
      cx = e.touches[0]?.clientX ?? 0;
      cy = e.touches[0]?.clientY ?? 0;
    } else {
      cx = e.clientX;
      cy = e.clientY;
    }
    return { x: (cx - rect.left) * sx, y: (cy - rect.top) * sy };
  };

  const onDrawStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeHandle) return;
    saveState();
    const coords = getCoords(e);
    isDrawingRef.current = true;
    startPosRef.current  = coords;
    lastPosRef.current   = coords;
  };

  const onDrawMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || activeHandle) return;
    const coords = getCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPosRef.current) return;

    if (["pen","brush","erase"].includes(tool)) {
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
        ctx.lineWidth   = tool === "brush" ? brushSize * 3 : brushSize;
      }
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.stroke(); ctx.restore();
      lastPosRef.current = coords;
    }
  };

  const onDrawEnd = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current && startPosRef.current && ["rect","circle"].includes(tool)) {
      const coords = getCoords(e);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth   = brushSize;
        ctx.lineJoin    = "round";
        const w = coords.x - startPosRef.current.x;
        const h = coords.y - startPosRef.current.y;
        if (tool === "rect") {
          ctx.strokeRect(startPosRef.current.x, startPosRef.current.y, w, h);
        } else {
          const r = Math.sqrt(w*w + h*h) / 2;
          ctx.beginPath();
          ctx.arc(startPosRef.current.x + w/2, startPosRef.current.y + h/2, r, 0, 2*Math.PI);
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

  // ── Crop handles ─────────────────────────────────────────────
  const startHandleDrag = (handle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHandle(handle);
    dragStartRef.current = { x: e.clientX, y: e.clientY, initialBox: { ...cropBox } };
  };

  const handleGlobalMove = useCallback((e: MouseEvent) => {
    if (!activeHandle || !dragStartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStartRef.current.x) / rect.width)  * 100;
    const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
    const b  = dragStartRef.current.initialBox;
    setCropBox(() => {
      let { top, left, right, bottom } = b;
      if (activeHandle.includes("n")) top    = Math.min(80, Math.max(0, b.top    + dy));
      if (activeHandle.includes("s")) bottom = Math.min(80, Math.max(0, b.bottom - dy));
      if (activeHandle.includes("w")) left   = Math.min(80, Math.max(0, b.left   + dx));
      if (activeHandle.includes("e")) right  = Math.min(80, Math.max(0, b.right  - dx));
      return { top, left, right, bottom };
    });
  }, [activeHandle]);

  const handleGlobalUp = useCallback(() => { if (activeHandle) setActiveHandle(null); }, [activeHandle]);

  useEffect(() => {
    if (activeHandle) {
      window.addEventListener("mousemove", handleGlobalMove);
      window.addEventListener("mouseup",   handleGlobalUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("mouseup",   handleGlobalUp);
    };
  }, [activeHandle, handleGlobalMove, handleGlobalUp]);

  // ── Text stamp ───────────────────────────────────────────────
  const handleAddText = () => {
    if (!captionText.trim()) return;
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.save();
    ctx.font        = `bold ${fontSize * 2}px ${fontFamily}, sans-serif`;
    ctx.fillStyle   = color;
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur  = 8;
    ctx.textAlign   = "center";
    ctx.fillText(captionText, canvas.width / 2, canvas.height / 2);
    ctx.restore();
    setCaptionText("");
  };

  // ── Save / Export ─────────────────────────────────────────────
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cropX = (cropBox.left / 100) * canvas.width;
    const cropY = (cropBox.top  / 100) * canvas.height;
    const cropW = canvas.width  * (1 - (cropBox.left + cropBox.right)  / 100);
    const cropH = canvas.height * (1 - (cropBox.top  + cropBox.bottom) / 100);
    const out   = document.createElement("canvas");
    out.width   = Math.max(10, cropW);
    out.height  = Math.max(10, cropH);
    out.getContext("2d")?.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, out.width, out.height);
    out.toBlob((blob) => {
      if (!blob) return;
      onSave(new File([blob], `edited_${file.name.replace(/\.[^/.]+$/, "")}.png`, { type: "image/png" }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }, "image/png", 0.95);
  };

  const handleExportDirect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = `edited_${file.name.replace(/\.[^/.]+$/, "")}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  // ── Tool definitions ─────────────────────────────────────────
  const TOOLS = [
    { id: "pen",    icon: <Pencil    className="w-4 h-4" />, label: "Pen"    },
    { id: "brush",  icon: <Paintbrush className="w-4 h-4"/>, label: "Brush"  },
    { id: "rect",   icon: <Square   className="w-4 h-4" />, label: "Box"    },
    { id: "circle", icon: <Circle   className="w-4 h-4" />, label: "Circle" },
    { id: "erase",  icon: <Eraser   className="w-4 h-4" />, label: "Erase"  },
  ] as const;

  const CROP_HANDLES = [
    { h: "nw", style: { top: `calc(${cropBox.top}% - 7px)`,    left:  `calc(${cropBox.left}% - 7px)`,   cursor: "nwse-resize" }},
    { h: "n",  style: { top: `calc(${cropBox.top}% - 7px)`,    left:  "calc(50% - 7px)",                cursor: "ns-resize"   }},
    { h: "ne", style: { top: `calc(${cropBox.top}% - 7px)`,    right: `calc(${cropBox.right}% - 7px)`,  cursor: "nesw-resize" }},
    { h: "w",  style: { top:  "calc(50% - 7px)",               left:  `calc(${cropBox.left}% - 7px)`,   cursor: "ew-resize"   }},
    { h: "e",  style: { top:  "calc(50% - 7px)",               right: `calc(${cropBox.right}% - 7px)`,  cursor: "ew-resize"   }},
    { h: "sw", style: { bottom:`calc(${cropBox.bottom}% - 7px)`,left: `calc(${cropBox.left}% - 7px)`,   cursor: "nesw-resize" }},
    { h: "s",  style: { bottom:`calc(${cropBox.bottom}% - 7px)`,left: "calc(50% - 7px)",                cursor: "ns-resize"   }},
    { h: "se", style: { bottom:`calc(${cropBox.bottom}% - 7px)`,right:`calc(${cropBox.right}% - 7px)`,  cursor: "nwse-resize" }},
  ];

  /* ══════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════ */
  return (
    <div
      className="canvas-studio-root"
      style={{
        position:   "fixed",
        inset:      0,
        zIndex:     9999,
        display:    "flex",
        flexDirection: "column",
        width:      "100vw",
        height:     "100vh",
        overflow:   "hidden",
        background: "#090b10",
        fontFamily: "'Inter', sans-serif",
        color:      "#e2e8f0",
      }}
    >
      {/* ══ TOP HEADER ══════════════════════════════════════════ */}
      <header style={{
        flexShrink:   0,
        height:       "48px",
        background:   "#0d1018",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display:      "flex",
        alignItems:   "center",
        justifyContent: "space-between",
        padding:      "0 12px",
        gap:          "8px",
      }}>
        {/* Left: brand + breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
            background: "linear-gradient(135deg, #22d3ee, #6366f1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={14} color="#fff" fill="#fff" />
          </div>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "15px", color: "#fff", whiteSpace: "nowrap" }}>
            File<span style={{ color: "#22d3ee" }}>Forge</span>
          </span>
          <span style={{ color: "#334155", fontSize: "13px" }}>›</span>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Canvas Studio Premium
          </span>
          {/* file name badge */}
          <span style={{
            fontSize: "10px", background: "rgba(99,102,241,0.15)",
            border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px",
            padding: "1px 7px", color: "#a5b4fc", fontFamily: "monospace",
            maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }} title={file.name}>{file.name}</span>
        </div>

        {/* Right: actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          {/* Undo */}
          <button onClick={handleUndo} disabled={!history.length}
            title="Undo"
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "5px 10px", borderRadius: "8px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: history.length ? "#e2e8f0" : "#4b5563", cursor: history.length ? "pointer" : "not-allowed",
              fontSize: "11px", fontWeight: 500,
            }}>
            <Undo2 size={13} /> <span className="hidden-xs">Undo</span>
          </button>

          {/* Export PNG */}
          <button onClick={handleExportDirect} title="Export PNG"
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "5px 10px", borderRadius: "8px",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#e2e8f0", cursor: "pointer", fontSize: "11px", fontWeight: 500,
            }}>
            <Download size={13} /> <span className="hidden-xs">Export</span>
          </button>

          {/* Save Changes */}
          <button onClick={handleSave} title="Save & use in converter"
            style={{
              display: "flex", alignItems: "center", gap: "5px",
              padding: "5px 14px", borderRadius: "8px",
              background: saved
                ? "linear-gradient(135deg,#16a34a,#15803d)"
                : "linear-gradient(135deg,#2563eb,#7c3aed)",
              border: "none", color: "#fff", cursor: "pointer",
              fontSize: "12px", fontWeight: 700,
              boxShadow: saved ? "0 0 20px rgba(22,163,74,0.4)" : "0 0 20px rgba(99,102,241,0.35)",
              transition: "all .3s",
            }}>
            {saved ? <><Star size={13} fill="#fff" /> Saved!</> : <><Check size={13} /> Save Changes</>}
          </button>

          {/* Close */}
          <button onClick={onCancel} title="Close editor"
            style={{
              padding: "5px", borderRadius: "7px", background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer",
            }}>
            <X size={16} />
          </button>
        </div>
      </header>

      {/* ══ TOOLBAR ROW ══════════════════════════════════════════ */}
      <div style={{
        flexShrink: 0,
        background: "#0f1220",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "6px 10px",
        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
      }}>
        {/* Tool buttons */}
        <div style={{ display:"flex", gap:"2px", background:"rgba(0,0,0,0.5)", borderRadius:"10px", padding:"3px" }}>
          {TOOLS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setTool(id as typeof tool)}
              title={label}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                padding: "5px 9px", borderRadius: "7px", border: "none",
                background: tool === id ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "transparent",
                color: tool === id ? "#fff" : "#94a3b8",
                cursor: "pointer", fontSize: "11px", fontWeight: 600, transition: "all .15s",
              }}>
              {icon} <span style={{ display: "none" }} className="show-sm">{label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />

        {/* Color swatch row */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          {COLOR_PALETTE.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              style={{
                width: "16px", height: "16px", borderRadius: "50%",
                background: c, border: color === c ? "2px solid #22d3ee" : "1px solid rgba(255,255,255,0.2)",
                cursor: "pointer", transform: color === c ? "scale(1.3)" : "scale(1)",
                transition: "all .15s", outline: "none", flexShrink: 0,
              }} />
          ))}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            title="Custom colour"
            style={{ width: "22px", height: "20px", cursor: "pointer", borderRadius: "4px",
                     border: "1px solid rgba(255,255,255,0.2)", background: "transparent" }} />
        </div>

        {/* Separator */}
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />

        {/* Brush size */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap" }}>Size</span>
          <input type="range" min={1} max={40} value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={{ width: "70px", accentColor: "#22d3ee", cursor: "pointer" }} />
          <span style={{ fontSize: "11px", color: "#22d3ee", fontFamily: "monospace", fontWeight: 700, minWidth: "20px" }}>{brushSize}</span>
        </div>

        {/* Separator */}
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />

        {/* Zoom */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "rgba(0,0,0,0.4)", borderRadius: "8px", padding: "2px 4px" }}>
          <button onClick={() => setZoomLevel(z => Math.max(0.25, z - 0.1))}
            style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", padding:"3px", display:"flex" }}>
            <ZoomOut size={13} />
          </button>
          <span style={{ fontSize: "11px", color: "#22d3ee", fontFamily: "monospace", fontWeight: 700, minWidth: "38px", textAlign: "center" }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button onClick={() => setZoomLevel(z => Math.min(5, z + 0.1))}
            style={{ background:"none", border:"none", color:"#94a3b8", cursor:"pointer", padding:"3px", display:"flex" }}>
            <ZoomIn size={13} />
          </button>
          <button onClick={() => setZoomLevel(1)} title="Reset zoom"
            style={{ background:"none", border:"none", color:"#64748b", cursor:"pointer", padding:"3px", display:"flex" }}>
            <Maximize2 size={11} />
          </button>
        </div>

        {/* Separator */}
        <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.1)" }} />

        {/* Rotate / Flip quick-access */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <button onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate 90°"
            style={{ display:"flex", alignItems:"center", gap:"3px", padding:"5px 8px", borderRadius:"7px",
                     background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                     color:"#94a3b8", cursor:"pointer", fontSize:"11px" }}>
            <RotateCw size={13} color="#22d3ee" /> 90°
          </button>
          <button onClick={() => setFlipH(f => !f)} title="Flip H"
            style={{ padding:"5px 7px", borderRadius:"7px",
                     background: flipH ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.05)",
                     border: flipH ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(255,255,255,0.08)",
                     color: flipH ? "#22d3ee" : "#94a3b8", cursor:"pointer", display:"flex" }}>
            <FlipHorizontal size={13} />
          </button>
          <button onClick={() => setFlipV(f => !f)} title="Flip V"
            style={{ padding:"5px 7px", borderRadius:"7px",
                     background: flipV ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.05)",
                     border: flipV ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(255,255,255,0.08)",
                     color: flipV ? "#22d3ee" : "#94a3b8", cursor:"pointer", display:"flex" }}>
            <FlipVertical size={13} />
          </button>
        </div>

        {/* Spacer + Filter preset (right-aligned) */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <Sparkles size={12} color="#a855f7" />
          <select value={filterPreset} onChange={(e) => setFilterPreset(e.target.value as typeof filterPreset)}
            style={{
              background: "#1c2030", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "7px", color: "#e2e8f0", fontSize: "11px",
              padding: "4px 8px", cursor: "pointer", outline: "none",
            }}>
            {FILTER_PRESETS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ══ MAIN BODY ════════════════════════════════════════════ */}
      <div style={{
        flex: 1, display: "flex", overflow: "hidden", minHeight: 0,
      }}>

        {/* ── Canvas Area ── */}
        <div ref={containerRef}
          style={{
            flex: 1, position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", minWidth: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            backgroundColor: "#0b0d14",
          }}>

          {/* canvas wrapper with zoom */}
          <div style={{
            position: "relative", display: "inline-block",
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform .15s",
            userSelect: "none",
          }}>
            <canvas
              ref={canvasRef}
              onMouseDown={onDrawStart}
              onMouseMove={onDrawMove}
              onMouseUp={onDrawEnd}
              onMouseLeave={onDrawEnd}
              onTouchStart={onDrawStart}
              onTouchMove={onDrawMove}
              onTouchEnd={onDrawEnd}
              style={{
                display: "block",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 0 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,211,238,0.08)",
                cursor: "crosshair",
                maxWidth: "100%",
                maxHeight: "calc(100vh - 190px)",
                objectFit: "contain",
                touchAction: "none",
              }}
            />

            {/* Crop overlay */}
            <div style={{
              position: "absolute", pointerEvents: "none",
              top: `${cropBox.top}%`, left: `${cropBox.left}%`,
              right: `${cropBox.right}%`, bottom: `${cropBox.bottom}%`,
              border: "2px dashed #22d3ee",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              borderRadius: "2px",
            }} />

            {/* 8 handles */}
            {CROP_HANDLES.map(({ h, style }) => (
              <div key={h} onMouseDown={(e) => startHandleDrag(h, e)}
                style={{
                  position: "absolute", width: "14px", height: "14px", borderRadius: "50%",
                  background: "linear-gradient(135deg,#22d3ee,#6366f1)",
                  border: "2px solid #fff", zIndex: 20,
                  ...style,
                  transition: "transform .1s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1.35)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              />
            ))}
          </div>

          {/* Corner status badge */}
          <div style={{
            position: "absolute", bottom: "10px", left: "10px",
            display: "flex", alignItems: "center", gap: "5px",
            background: "rgba(9,11,16,0.85)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px", padding: "4px 10px", fontSize: "10px", color: "#64748b",
          }}>
            <Sparkles size={10} color="#a855f7" />
            <span style={{ color: "#a855f7", fontWeight: 600 }}>Premium</span>
            <span>· Canvas Studio</span>
            <span style={{ color: "#334155" }}>· {Math.round(zoomLevel * 100)}% zoom</span>
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div style={{
          width: rightPanelOpen ? "220px" : "38px",
          flexShrink: 0,
          background: "#0d1018",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width .2s ease",
        }}>
          {/* panel toggle */}
          <button onClick={() => setRightPanelOpen(p => !p)}
            title={rightPanelOpen ? "Collapse panel" : "Expand panel"}
            style={{
              flexShrink: 0, height: "34px", width: "100%",
              background: "rgba(255,255,255,0.03)", border: "none",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
              color: "#64748b", cursor: "pointer", fontSize: "10px",
            }}>
            {rightPanelOpen
              ? <><SlidersHorizontal size={11} /> <span>Tools</span> <ChevronUp size={10}/></>
              : <SlidersHorizontal size={14} />
            }
          </button>

          {rightPanelOpen && (
            <div style={{ flex: 1, overflowY: "auto", padding: "10px 10px" }}>

              {/* ── Text Annotation ── */}
              <section style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", marginBottom: "6px",
                               display: "flex", alignItems: "center", gap: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <Type size={11} color="#22d3ee" /> Text Stamp
                </div>
                <textarea
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Type caption..."
                  rows={3}
                  style={{
                    width: "100%", borderRadius: "8px", padding: "7px 9px",
                    fontSize: "11px", color: "#e2e8f0",
                    background: "#181c2a", border: "1px solid rgba(255,255,255,0.08)",
                    outline: "none", resize: "none", marginBottom: "6px",
                    fontFamily: "inherit",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "#22d3ee"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", marginBottom: "6px" }}>
                  <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}
                    style={{ background:"#181c2a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"7px",
                             color:"#e2e8f0", fontSize:"10px", padding:"4px 5px", outline:"none", cursor:"pointer" }}>
                    {["Inter","Outfit","Roboto","Georgia","Courier New"].map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ background:"#181c2a", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"7px",
                             color:"#e2e8f0", fontSize:"10px", padding:"4px 5px", outline:"none", cursor:"pointer" }}>
                    {[12,16,20,24,32,48,64,96].map(s => (
                      <option key={s} value={s}>{s}px</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAddText}
                  style={{
                    width: "100%", padding: "7px", borderRadius: "8px", border: "none",
                    background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                    color: "#fff", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                  }}>
                  ＋ Add Text to Image
                </button>
              </section>

              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />

              {/* ── Saturation ── */}
              <section style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", marginBottom: "5px",
                               display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                    <Droplets size={11} color="#ec4899" /> Saturation
                  </span>
                  <span style={{ color:"#ec4899", fontFamily:"monospace", fontWeight:700 }}>
                    {saturation > 0 ? `+${saturation}` : saturation}
                  </span>
                </div>
                <input type="range" min={-100} max={100} value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  style={{ width:"100%", accentColor:"#ec4899", cursor:"pointer" }} />
              </section>

              {/* ── Crop Box ── */}
              <section style={{ marginBottom: "10px" }}>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", marginBottom: "5px",
                               display: "flex", alignItems: "center", gap: "4px" }}>
                  <Crop size={11} color="#f97316" /> Crop Region
                </div>
                <p style={{ fontSize: "10px", color: "#475569", lineHeight: 1.5, marginBottom: "6px" }}>
                  Drag the 8 handles on the canvas to define the crop region.
                </p>
                <button onClick={() => setCropBox({ top:0,left:0,right:0,bottom:0 })}
                  style={{
                    width: "100%", padding: "6px", borderRadius: "7px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94a3b8", fontSize: "11px", cursor: "pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"4px",
                  }}>
                  <CornerUpLeft size={11} /> Reset Crop
                </button>
              </section>

              <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "10px 0" }} />

              {/* ── Layers / undo count ── */}
              <section>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", marginBottom: "5px",
                               display: "flex", alignItems: "center", gap: "4px" }}>
                  <Layers size={11} color="#a855f7" /> History
                </div>
                <div style={{ fontSize: "10px", color: "#475569", marginBottom: "5px" }}>
                  {history.length} / 20 undo steps saved
                </div>
                <div style={{
                  height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    height: "100%", borderRadius: "2px",
                    background: "linear-gradient(90deg,#22d3ee,#a855f7)",
                    width: `${(history.length / 20) * 100}%`,
                    transition: "width .3s",
                  }} />
                </div>
              </section>

              {/* ── Premium badge ── */}
              <div style={{
                marginTop: "16px", borderRadius: "10px", padding: "10px",
                background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)",
                textAlign: "center",
              }}>
                <Sparkles size={14} color="#a855f7" style={{ margin: "0 auto 4px" }} />
                <div style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700 }}>Premium Canvas Studio</div>
                <div style={{ fontSize: "9px", color: "#475569", marginTop: "2px" }}>
                  ⚡ Zero-scroll · Full-viewport · Mobile-ready
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM ADJUSTMENTS STRIP ══════════════════════════════ */}
      <div style={{
        flexShrink: 0,
        background: "#0d1018",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}>
        {/* collapse toggle */}
        <button onClick={() => setBottomOpen(p => !p)}
          style={{
            width: "100%", padding: "4px", background: "none", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
            color: "#334155", cursor: "pointer", fontSize: "10px",
          }}>
          {bottomOpen
            ? <><ChevronDown size={12} /> Hide Adjustments</>
            : <><ChevronUp   size={12} /> Show Adjustments</>
          }
        </button>

        {bottomOpen && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "8px",
            padding: "8px 10px 10px",
          }}>
            {/* Brightness */}
            <div style={{ background:"#111520", border:"1px solid rgba(255,255,255,0.07)",
                           borderRadius:"10px", padding:"8px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px",
                             color:"#94a3b8", marginBottom:"5px" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <Sun size={11} color="#fbbf24" /> Brightness
                </span>
                <span style={{ color:"#fbbf24", fontFamily:"monospace", fontWeight:700 }}>
                  {brightness > 0 ? `+${brightness}` : brightness}
                </span>
              </div>
              <input type="range" min={-100} max={100} value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                style={{ width:"100%", accentColor:"#fbbf24", cursor:"pointer" }} />
            </div>

            {/* Contrast */}
            <div style={{ background:"#111520", border:"1px solid rgba(255,255,255,0.07)",
                           borderRadius:"10px", padding:"8px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px",
                             color:"#94a3b8", marginBottom:"5px" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <ContrastIcon size={11} color="#60a5fa" /> Contrast
                </span>
                <span style={{ color:"#60a5fa", fontFamily:"monospace", fontWeight:700 }}>
                  {contrast > 0 ? `+${contrast}` : contrast}
                </span>
              </div>
              <input type="range" min={-100} max={100} value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                style={{ width:"100%", accentColor:"#60a5fa", cursor:"pointer" }} />
            </div>

            {/* Saturation (duplicate for visibility in bottom bar) */}
            <div style={{ background:"#111520", border:"1px solid rgba(255,255,255,0.07)",
                           borderRadius:"10px", padding:"8px 10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px",
                             color:"#94a3b8", marginBottom:"5px" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"4px" }}>
                  <Droplets size={11} color="#f472b6" /> Saturation
                </span>
                <span style={{ color:"#f472b6", fontFamily:"monospace", fontWeight:700 }}>
                  {saturation > 0 ? `+${saturation}` : saturation}
                </span>
              </div>
              <input type="range" min={-100} max={100} value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                style={{ width:"100%", accentColor:"#f472b6", cursor:"pointer" }} />
            </div>

            {/* Filter Preset (also bottom) */}
            <div style={{ background:"#111520", border:"1px solid rgba(255,255,255,0.07)",
                           borderRadius:"10px", padding:"8px 10px" }}>
              <div style={{ fontSize:"10px", color:"#94a3b8", marginBottom:"5px",
                             display:"flex", alignItems:"center", gap:"4px" }}>
                <Sparkles size={11} color="#a855f7" /> Filter Preset
              </div>
              <select value={filterPreset} onChange={(e) => setFilterPreset(e.target.value as typeof filterPreset)}
                style={{ width:"100%", background:"#1c2030", border:"1px solid rgba(255,255,255,0.08)",
                          borderRadius:"7px", color:"#e2e8f0", fontSize:"11px", padding:"4px", outline:"none" }}>
                {FILTER_PRESETS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Bottom Panel ────────────────────────────────── */}
      {/* Hidden on desktop, shown on mobile via CSS */}
    </div>
  );
}
