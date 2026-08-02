"use client";

import React, {
  useRef, useEffect, useState, useCallback, useContext,
} from "react";
import { createPortal } from "react-dom";
import {
  Pencil, Paintbrush, Eraser, X, Zap, Sun, Undo2, Redo2,
  Contrast as ContrastIcon, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Sparkles, Square,
  Circle, Triangle, Type, Download, Check, Crop, Star, Droplets,
  Layers, Minus, Move, ArrowRight, Sliders, ChevronRight, ChevronDown,
  RotateCw, RotateCcw, Grid, Ruler, Image as ImageIcon, FileText,
  Scissors, Copy, Trash2, RefreshCw, Moon, Info, Eye, EyeOff,
  AlignLeft, Paintbrush2, Pipette, SlidersHorizontal, FileDown,
  FileUp, Save,
} from "lucide-react";
import BrandLoader from "./BrandLoader";
import { ThemeContext } from "@/app/providers";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type MainTool = "pen" | "brush" | "shape" | "erase" | "text" | "crop" | "move";
type PenType  = "ballpoint" | "felt" | "marker" | "highlighter";
type BrushType = "soft" | "hard" | "airbrush" | "watercolor" | "oil";
type ShapeType = "rect" | "circle" | "line" | "arrow" | "triangle" | "star";
type FilterPr  = "none"|"grayscale"|"sepia"|"invert"|"warm"|"cool"|"vivid";
type MenuKey = "file" | "edit" | "view" | "image" | "filter" | null;

interface Props { file: File; onSave:(f:File)=>void; onCancel:()=>void; }

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const COLORS = [
  "#3b82f6","#ef4444","#f97316","#eab308","#22c55e",
  "#06b6d4","#a855f7","#ec4899","#ffffff","#000000","#475569","#84cc16",
];
const FILTERS: {value:FilterPr; label:string; emoji:string}[] = [
  {value:"none",     label:"Original",    emoji:"🖼️"},
  {value:"grayscale",label:"Grayscale",   emoji:"⬛"},
  {value:"sepia",    label:"Sepia",       emoji:"🟤"},
  {value:"warm",     label:"Warm Film",   emoji:"🌅"},
  {value:"cool",     label:"Cool Breeze", emoji:"❄️"},
  {value:"vivid",    label:"Vivid Boost", emoji:"✨"},
  {value:"invert",   label:"Invert",      emoji:"🔀"},
];

const PEN_TYPES: {id:PenType; label:string; desc:string; emoji:string}[] = [
  {id:"ballpoint",  label:"Ballpoint",   desc:"Thin, precise",    emoji:"🖊️"},
  {id:"felt",       label:"Felt Tip",    desc:"Smooth medium",    emoji:"🖋️"},
  {id:"marker",     label:"Marker",      desc:"Bold thick",       emoji:"🖊"},
  {id:"highlighter",label:"Highlighter", desc:"Semi-transparent", emoji:"🖍️"},
];

const BRUSH_TYPES: {id:BrushType; label:string; desc:string; emoji:string}[] = [
  {id:"soft",      label:"Soft Round",  desc:"Feathered edges", emoji:"🌫️"},
  {id:"hard",      label:"Hard Round",  desc:"Sharp edges",     emoji:"⬤"},
  {id:"airbrush",  label:"Airbrush",    desc:"Light spray",     emoji:"🌬️"},
  {id:"watercolor",label:"Watercolor",  desc:"Wet blending",    emoji:"💧"},
  {id:"oil",       label:"Oil Paint",   desc:"Thick strokes",   emoji:"🎨"},
];

const SHAPE_TYPES: {id:ShapeType; icon:React.ReactNode; label:string}[] = [
  {id:"rect",     icon:<Square    size={14}/>, label:"Rect"},
  {id:"circle",   icon:<Circle    size={14}/>, label:"Circle"},
  {id:"line",     icon:<Minus     size={14}/>, label:"Line"},
  {id:"arrow",    icon:<ArrowRight size={14}/>,label:"Arrow"},
  {id:"triangle", icon:<Triangle  size={14}/>, label:"Triangle"},
  {id:"star",     icon:<Star      size={14}/>, label:"Star"},
];

const PEN_CURSOR   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%2322d3ee'/%3E%3C/svg%3E") 0 24, crosshair`;
const BRUSH_CURSOR = "crosshair";
const ERASE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='3' fill='none' stroke='%23f87171' stroke-width='2'/%3E%3C/svg%3E") 10 10, crosshair`;
const TEXT_CURSOR  = "text";

const clamp = (v:number,a:number,b:number) => Math.min(b,Math.max(a,v));

/* ═══════════════════════════════════════════════════════════════
   DRAWING HELPERS
═══════════════════════════════════════════════════════════════ */
function applyPenStroke(ctx:CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number, penType:PenType, size:number, color:string, opacity:number) {
  ctx.save();
  ctx.globalAlpha = penType==="highlighter" ? opacity*0.4 : opacity;
  ctx.strokeStyle = color;
  ctx.lineCap="round"; ctx.lineJoin="round";
  switch(penType) {
    case "ballpoint": ctx.lineWidth=size*0.7; ctx.globalCompositeOperation="source-over"; break;
    case "felt":      ctx.lineWidth=size*1.2; ctx.globalCompositeOperation="source-over"; break;
    case "marker":    ctx.lineWidth=size*2.5; ctx.globalCompositeOperation="source-over"; ctx.lineCap="square"; break;
    case "highlighter": ctx.lineWidth=size*4; ctx.globalCompositeOperation="multiply";   ctx.lineCap="square"; break;
  }
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

function applyBrushStroke(ctx:CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number, brushType:BrushType, size:number, color:string, opacity:number) {
  ctx.save();
  ctx.strokeStyle=color; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.globalAlpha=opacity;
  switch(brushType) {
    case "soft":
      ctx.lineWidth=size; ctx.globalCompositeOperation="source-over";
      ctx.shadowBlur=size*0.8; ctx.shadowColor=color; break;
    case "hard":
      ctx.lineWidth=size; ctx.globalCompositeOperation="source-over"; ctx.shadowBlur=0; break;
    case "airbrush": {
      const dist=Math.sqrt((x2-x1)**2+(y2-y1)**2)||1;
      const steps=Math.max(1,Math.floor(dist/4));
      ctx.globalAlpha=opacity*0.08;
      for(let i=0;i<steps;i++){
        const px=x1+(x2-x1)*(i/steps), py=y1+(y2-y1)*(i/steps);
        for(let d=0;d<8;d++){
          const angle=Math.random()*2*Math.PI, r=Math.random()*size;
          ctx.beginPath();
          ctx.arc(px+Math.cos(angle)*r,py+Math.sin(angle)*r,1,0,2*Math.PI);
          ctx.fillStyle=color; ctx.fill();
        }
      }
      ctx.restore(); return;
    }
    case "watercolor":
      ctx.lineWidth=size*1.5; ctx.globalAlpha=opacity*0.15;
      ctx.globalCompositeOperation="source-over";
      ctx.shadowBlur=size*1.5; ctx.shadowColor=color; break;
    case "oil":
      ctx.lineWidth=size; ctx.globalAlpha=opacity;
      ctx.shadowBlur=2; ctx.shadowColor="rgba(0,0,0,0.3)"; break;
  }
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

function drawShape(ctx:CanvasRenderingContext2D, shapeType:ShapeType, x1:number,y1:number,x2:number,y2:number, strokeColor:string, fillColor:string|null, lineW:number) {
  ctx.save();
  ctx.strokeStyle=strokeColor; ctx.lineWidth=lineW; ctx.lineJoin="round";
  if(fillColor){ctx.fillStyle=fillColor;}
  const w=x2-x1, h=y2-y1;
  switch(shapeType){
    case "rect":
      if(fillColor) ctx.fillRect(x1,y1,w,h);
      ctx.strokeRect(x1,y1,w,h); break;
    case "circle": {
      const rx=Math.abs(w)/2, ry=Math.abs(h)/2;
      ctx.beginPath(); ctx.ellipse(x1+w/2,y1+h/2,rx,ry,0,0,2*Math.PI);
      if(fillColor) ctx.fill(); ctx.stroke(); break;
    }
    case "line":
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); break;
    case "arrow": {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      const angle=Math.atan2(y2-y1,x2-x1), al=18, aa=0.45;
      ctx.beginPath(); ctx.moveTo(x2,y2);
      ctx.lineTo(x2-al*Math.cos(angle-aa),y2-al*Math.sin(angle-aa));
      ctx.lineTo(x2-al*Math.cos(angle+aa),y2-al*Math.sin(angle+aa));
      ctx.closePath(); ctx.fillStyle=strokeColor; ctx.fill(); break;
    }
    case "triangle": {
      ctx.beginPath(); ctx.moveTo(x1+w/2,y1); ctx.lineTo(x2,y2); ctx.lineTo(x1,y2); ctx.closePath();
      if(fillColor) ctx.fill(); ctx.stroke(); break;
    }
    case "star": {
      const cx=x1+w/2,cy=y1+h/2;
      const or=Math.min(Math.abs(w),Math.abs(h))/2, ir=or*0.45;
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const r=i%2===0?or:ir, a=(i*Math.PI/5)-Math.PI/2;
        i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
      }
      ctx.closePath(); if(fillColor) ctx.fill(); ctx.stroke(); break;
    }
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   RULER HELPER
═══════════════════════════════════════════════════════════════ */
function drawRuler(canvas: HTMLCanvasElement, isHorizontal: boolean, zoom: number, offset: number, isDark: boolean) {
  const ctx = canvas.getContext("2d"); if(!ctx) return;
  const W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = isDark ? "#0a0d15" : "#eef0f8";
  ctx.fillRect(0,0,W,H);

  const step = zoom>=2?10:zoom>=1?20:50;
  const tickColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)";
  const textColor = isDark ? "#475569" : "#94a3b8";

  ctx.strokeStyle=tickColor; ctx.fillStyle=textColor;
  ctx.font="8px Inter,sans-serif"; ctx.textAlign="center";

  const range = isHorizontal ? W : H;
  for(let px=0; px<range*2; px+=2){
    const world = (px + offset) / zoom;
    const snapped = Math.round(world/step)*step;
    if(Math.abs(world-snapped) < 1/zoom){
      const tickLen = snapped%100===0 ? (isHorizontal?H*0.7:W*0.7) : snapped%50===0 ? (isHorizontal?H*0.5:W*0.5) : (isHorizontal?H*0.3:W*0.3);
      ctx.beginPath();
      if(isHorizontal){ ctx.moveTo(px,H); ctx.lineTo(px,H-tickLen); }
      else             { ctx.moveTo(W,px); ctx.lineTo(W-tickLen,px); }
      ctx.stroke();
      if(snapped%100===0){
        ctx.save();
        if(isHorizontal){ ctx.fillText(String(snapped),px,H-tickLen-1); }
        else { ctx.translate(W-tickLen-1, px); ctx.rotate(-Math.PI/2); ctx.fillText(String(snapped),0,0); }
        ctx.restore();
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════
   INNER COMPONENT
═══════════════════════════════════════════════════════════════ */
function CanvasEditorInner({ file, onSave, onCancel }: Props) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rulerHRef    = useRef<HTMLCanvasElement>(null);
  const rulerVRef    = useRef<HTMLCanvasElement>(null);
  const toolbarRef   = useRef<HTMLDivElement>(null);

  const [img, setImg] = useState<HTMLImageElement|null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  /* ── Active tool ── */
  const [mainTool, setMainTool] = useState<MainTool>("pen");

  /* ── Pen options ── */
  const [penType,    setPenType]    = useState<PenType>("ballpoint");
  const [penSize,    setPenSize]    = useState(4);
  const [penOpacity, setPenOpacity] = useState(1);

  /* ── Brush options ── */
  const [brushType,    setBrushType]    = useState<BrushType>("soft");
  const [brushSize,    setBrushSize]    = useState(20);
  const [brushOpacity, setBrushOpacity] = useState(0.85);

  /* ── Shape options ── */
  const [shapeType,  setShapeType]  = useState<ShapeType>("rect");
  const [shapeFill,  setShapeFill]  = useState(false);
  const [shapeLineW, setShapeLineW] = useState(3);

  /* ── Eraser ── */
  const [eraserSize, setEraserSize] = useState(20);
  const [eraserPos,  setEraserPos]  = useState<{x:number;y:number}|null>(null);

  /* ── Text ── */
  const [textInput, setTextInput] = useState("");
  const [fontFam,   setFontFam]   = useState("Inter");
  const [fontSz,    setFontSz]    = useState(24);
  const [bold,      setBold]      = useState(false);
  const [italic,    setItalic]    = useState(false);

  /* ── Color ── */
  const [strokeColor, setStrokeColor] = useState("#3b82f6");
  const [fillColor,   setFillColor]   = useState("#3b82f633");
  const [colorHistory, setColorHistory] = useState<string[]>([]);

  /* ── Image adjustments ── */
  const [brightness, setBrightness] = useState(0);
  const [contrast,   setContrast]   = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation,   setRotation]   = useState(0);
  const [flipH,      setFlipH]      = useState(false);
  const [flipV,      setFlipV]      = useState(false);
  const [zoom,       setZoom]       = useState(1);
  const [filter,     setFilter]     = useState<FilterPr>("none");

  /* ── Crop ── */
  const [crop,   setCrop]   = useState({top:0,left:0,right:0,bottom:0});
  const [handle, setHandle] = useState<string|null>(null);
  const dragRef = useRef<{x:number;y:number;box:typeof crop}|null>(null);

  /* ── History ── */
  const [history, setHistory] = useState<ImageData[]>([]);
  const [future,  setFuture]  = useState<ImageData[]>([]);

  /* ── UI State ── */
  const [saved,        setSaved]        = useState(false);
  const [maximized,    setMaximized]    = useState(true);
  const [rightTab,     setRightTab]     = useState<"adjust"|"crop"|"info">("adjust");
  const [activeMenu,   setActiveMenu]   = useState<MenuKey>(null);
  const [showGrid,     setShowGrid]     = useState(false);
  const [showRulers,   setShowRulers]   = useState(true);
  const [showInfoBar,  setShowInfoBar]  = useState(true);
  const [cursorPos,    setCursorPos]    = useState<{x:number;y:number}>({x:0,y:0});
  const [canvasDims,   setCanvasDims]   = useState<{w:number;h:number}>({w:0,h:0});
  /* Tool sub-menu open state (position within left sidebar) */
  const [toolSubmenuOpen, setToolSubmenuOpen] = useState(false);

  /* ── Drawing internals ── */
  const isDrawing = useRef(false);
  const startPos  = useRef<{x:number;y:number}|null>(null);
  const lastPos   = useRef<{x:number;y:number}|null>(null);

  /* ── Color history helper ── */
  const pushColor = useCallback((c:string) => {
    setColorHistory(prev => {
      const filtered = prev.filter(x=>x!==c);
      return [c,...filtered].slice(0,6);
    });
  }, []);

  /* Lock body scroll */
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow="hidden";
    document.documentElement.style.overflow="hidden";
    const styleEl=document.createElement("style");
    styleEl.id="ff-canvas-override";
    styleEl.textContent=`
      #ff-canvas-root {
        position:fixed!important; top:0!important; left:0!important;
        right:0!important; bottom:0!important;
        width:100vw!important; height:100vh!important; height:100dvh!important;
        z-index:2147483647!important; overflow:hidden!important;
        display:flex!important; flex-direction:column!important;
        margin:0!important; padding:0!important; transform:none!important;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.body.style.overflow=prevBody;
      document.documentElement.style.overflow=prevHtml;
      document.getElementById("ff-canvas-override")?.remove();
    };
  },[]);

  /* Load image */
  useEffect(() => {
    setImgLoading(true);
    const url=URL.createObjectURL(file);
    const i=new Image(); i.crossOrigin="anonymous";
    i.onload=()=>{ setImg(i); setCanvasDims({w:i.naturalWidth,h:i.naturalHeight}); setImgLoading(false); };
    i.onerror=()=>setImgLoading(false);
    i.src=url;
    return()=>URL.revokeObjectURL(url);
  },[file]);

  /* Redraw base canvas */
  const redraw = useCallback(()=>{
    const c=canvasRef.current; if(!c||!img) return;
    const ctx=c.getContext("2d"); if(!ctx) return;
    c.width=img.naturalWidth||800; c.height=img.naturalHeight||600;
    const ov=overlayRef.current; if(ov){ov.width=c.width;ov.height=c.height;}
    ctx.save(); ctx.clearRect(0,0,c.width,c.height);
    let f=`brightness(${100+brightness}%) contrast(${100+contrast}%) saturate(${100+saturation}%)`;
    if(filter==="grayscale") f+=" grayscale(100%)";
    if(filter==="sepia")     f+=" sepia(80%)";
    if(filter==="invert")    f+=" invert(100%)";
    if(filter==="warm")      f+=" sepia(30%) hue-rotate(-10deg)";
    if(filter==="cool")      f+=" hue-rotate(180deg) saturate(150%)";
    if(filter==="vivid")     f+=" saturate(200%) contrast(110%)";
    ctx.filter=f;
    ctx.translate(c.width/2,c.height/2);
    ctx.rotate((rotation*Math.PI)/180);
    ctx.scale(flipH?-1:1,flipV?-1:1);
    ctx.drawImage(img,-c.width/2,-c.height/2,c.width,c.height);
    ctx.restore();
  },[img,brightness,contrast,saturation,rotation,flipH,flipV,filter]);

  useEffect(()=>{redraw();},[redraw]);

  /* Rulers */
  useEffect(()=>{
    if(!showRulers) return;
    const rh=rulerHRef.current, rv=rulerVRef.current;
    if(rh) drawRuler(rh,true,zoom,0,isDark);
    if(rv) drawRuler(rv,false,zoom,0,isDark);
  },[showRulers,zoom,isDark]);

  /* History helpers */
  const saveState = () => {
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setHistory(h=>[...h.slice(-30),ctx.getImageData(0,0,c.width,c.height)]);
    setFuture([]);
  };
  const undo = useCallback(()=>{
    if(!history.length) return;
    const prev=history[history.length-1];
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setFuture(f=>[ctx.getImageData(0,0,c.width,c.height),...f.slice(0,30)]);
    setHistory(h=>h.slice(0,-1));
    ctx.putImageData(prev,0,0);
  },[history]);
  const redo = useCallback(()=>{
    if(!future.length) return;
    const next=future[0];
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setHistory(h=>[...h,ctx.getImageData(0,0,c.width,c.height)]);
    setFuture(f=>f.slice(1));
    ctx.putImageData(next,0,0);
  },[future]);

  /* Keyboard shortcuts */
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if(e.ctrlKey||e.metaKey){
        if(e.key==="z"){ e.preventDefault(); undo(); }
        if(e.key==="y"||e.key==="Z"){ e.preventDefault(); redo(); }
        if(e.key==="s"){ e.preventDefault(); save(); }
        if(e.key==="]"){ e.preventDefault(); adjustSize(2); }
        if(e.key==="["){ e.preventDefault(); adjustSize(-2); }
        return;
      }
      switch(e.key.toLowerCase()){
        case "p": setMainTool("pen");   break;
        case "b": setMainTool("brush"); break;
        case "e": setMainTool("erase"); break;
        case "t": setMainTool("text");  break;
        case "s": setMainTool("shape"); break;
        case "c": setMainTool("crop");  break;
        case "]": adjustSize(2);  break;
        case "[": adjustSize(-2); break;
        case "=": case "+": setZoom(z=>Math.min(5,+(z+0.1).toFixed(1))); break;
        case "-": setZoom(z=>Math.max(0.1,+(z-0.1).toFixed(1))); break;
        case "0": setZoom(1); break;
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[undo,redo,history,future]);

  const adjustSize = (delta:number)=>{
    if(mainTool==="pen")   setPenSize(s=>clamp(s+delta,1,30));
    if(mainTool==="brush") setBrushSize(s=>clamp(s+delta,2,80));
    if(mainTool==="erase") setEraserSize(s=>clamp(s+delta,2,80));
  };

  /* Canvas coords */
  const getCoords=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current; if(!c) return{x:0,y:0};
    const r=c.getBoundingClientRect();
    const sx=c.width/r.width, sy=c.height/r.height;
    let cx:number,cy:number;
    if("touches"in e){cx=e.touches[0]?.clientX??0;cy=e.touches[0]?.clientY??0;}
    else{cx=e.clientX;cy=e.clientY;}
    return{x:Math.round((cx-r.left)*sx),y:Math.round((cy-r.top)*sy)};
  };

  /* Mouse/touch events */
  const onStart=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    if(handle||mainTool==="crop") return;
    saveState(); const p=getCoords(e);
    isDrawing.current=true; startPos.current=p; lastPos.current=p;
    if(mainTool==="text"&&textInput.trim()){
      const c=canvasRef.current; const ctx=c?.getContext("2d");
      if(ctx&&c){
        ctx.save();
        ctx.font=`${italic?"italic ":""}${bold?"bold ":""}${fontSz*2}px ${fontFam},sans-serif`;
        ctx.fillStyle=strokeColor; ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=5;
        ctx.globalAlpha=1; ctx.fillText(textInput,p.x,p.y); ctx.restore();
      }
    }
  };

  const onMove=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    const p=getCoords(e);
    setCursorPos(p);
    // Eraser cursor follow
    if(mainTool==="erase") setEraserPos(p); else setEraserPos(null);
    if(!isDrawing.current||handle) return;
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if(!ctx||!lastPos.current||!startPos.current) return;
    if(mainTool==="pen"){
      applyPenStroke(ctx,lastPos.current.x,lastPos.current.y,p.x,p.y,penType,penSize,strokeColor,penOpacity);
      lastPos.current=p;
    }else if(mainTool==="brush"){
      applyBrushStroke(ctx,lastPos.current.x,lastPos.current.y,p.x,p.y,brushType,brushSize,strokeColor,brushOpacity);
      lastPos.current=p;
    }else if(mainTool==="erase"){
      ctx.save(); ctx.globalCompositeOperation="destination-out";
      ctx.lineWidth=eraserSize*2; ctx.lineCap="round"; ctx.lineJoin="round";
      ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(p.x,p.y); ctx.stroke();
      ctx.restore(); lastPos.current=p;
    }else if(mainTool==="shape"){
      const ov=overlayRef.current; const octx=ov?.getContext("2d");
      if(octx&&ov){
        octx.clearRect(0,0,ov.width,ov.height);
        drawShape(octx,shapeType,startPos.current.x,startPos.current.y,p.x,p.y,strokeColor,shapeFill?fillColor:null,shapeLineW);
      }
    }
  };

  const onEnd=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    if(isDrawing.current&&startPos.current&&mainTool==="shape"){
      const p=getCoords(e); const c=canvasRef.current; const ctx=c?.getContext("2d");
      if(ctx) drawShape(ctx,shapeType,startPos.current.x,startPos.current.y,p.x,p.y,strokeColor,shapeFill?fillColor:null,shapeLineW);
      const ov=overlayRef.current; const octx=ov?.getContext("2d");
      if(octx&&ov) octx.clearRect(0,0,ov.width,ov.height);
    }
    isDrawing.current=false; lastPos.current=null; startPos.current=null;
    setEraserPos(null);
    if(handle) setHandle(null);
  };

  const onLeave=()=>{
    setEraserPos(null);
    if(isDrawing.current) onEnd({} as React.MouseEvent<HTMLCanvasElement>);
  };

  /* Crop handle drag */
  const startCropHandle=(h:string,e:React.MouseEvent)=>{
    e.stopPropagation(); setHandle(h);
    dragRef.current={x:e.clientX,y:e.clientY,box:{...crop}};
  };
  const globalMouseMove=useCallback((e:MouseEvent)=>{
    if(!handle||!dragRef.current||!containerRef.current) return;
    const r=containerRef.current.getBoundingClientRect();
    const dx=((e.clientX-dragRef.current.x)/r.width)*100;
    const dy=((e.clientY-dragRef.current.y)/r.height)*100;
    const b=dragRef.current.box;
    setCrop(()=>{
      let {top,left,right,bottom}=b;
      if(handle.includes("n")) top=clamp(b.top+dy,0,80);
      if(handle.includes("s")) bottom=clamp(b.bottom-dy,0,80);
      if(handle.includes("w")) left=clamp(b.left+dx,0,80);
      if(handle.includes("e")) right=clamp(b.right-dx,0,80);
      return{top,left,right,bottom};
    });
  },[handle]);
  const globalMouseUp=useCallback(()=>{if(handle)setHandle(null);},[handle]);
  useEffect(()=>{
    if(handle){window.addEventListener("mousemove",globalMouseMove);window.addEventListener("mouseup",globalMouseUp);}
    return()=>{window.removeEventListener("mousemove",globalMouseMove);window.removeEventListener("mouseup",globalMouseUp);};
  },[handle,globalMouseMove,globalMouseUp]);

  /* Close menu on outside click */
  useEffect(()=>{
    if(!activeMenu) return;
    const handler=()=>setActiveMenu(null);
    setTimeout(()=>window.addEventListener("click",handler),10);
    return()=>window.removeEventListener("click",handler);
  },[activeMenu]);

  /* Save / Export */
  const save=useCallback(()=>{
    const c=canvasRef.current; if(!c) return;
    setSaving(true);
    const cx=(crop.left/100)*c.width, cy=(crop.top/100)*c.height;
    const cw=c.width*(1-(crop.left+crop.right)/100);
    const ch=c.height*(1-(crop.top+crop.bottom)/100);
    const out=document.createElement("canvas");
    out.width=Math.max(10,cw); out.height=Math.max(10,ch);
    out.getContext("2d")?.drawImage(c,cx,cy,cw,ch,0,0,out.width,out.height);
    out.toBlob(blob=>{
      if(!blob){setSaving(false);return;}
      onSave(new File([blob],`edited_${file.name.replace(/\.[^/.]+$/,"")}.png`,{type:"image/png"}));
      setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500);
    },"image/png",0.95);
  },[crop,file,onSave]);

  const doExport=(format:"png"|"jpeg"|"webp")=>{
    const c=canvasRef.current; if(!c) return;
    setExporting(true);
    setTimeout(()=>{
      const a=document.createElement("a");
      a.download=`edited_${file.name.replace(/\.[^/.]+$/,"")}.${format}`;
      a.href=c.toDataURL(`image/${format}`,0.92); a.click();
      setExporting(false);
    },400);
  };

  const clearCanvas=()=>{
    saveState();
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    ctx.clearRect(0,0,c.width,c.height);
  };

  const resetAdjustments=()=>{
    setBrightness(0);setContrast(0);setSaturation(0);
    setRotation(0);setFlipH(false);setFlipV(false);
    setFilter("none");
  };

  /* Cursor */
  const getCursor=()=>{
    if(mainTool==="pen")   return PEN_CURSOR;
    if(mainTool==="brush") return BRUSH_CURSOR;
    if(mainTool==="erase") return "none"; // custom circle
    if(mainTool==="text")  return TEXT_CURSOR;
    if(mainTool==="move")  return "grab";
    return "crosshair";
  };

  /* Crop handles config */
  const CROP_HANDLES=[
    {h:"nw",pos:{top:`calc(${crop.top}% - 6px)`,left:`calc(${crop.left}% - 6px)`,cursor:"nwse-resize"}},
    {h:"n", pos:{top:`calc(${crop.top}% - 6px)`,left:"calc(50% - 6px)",cursor:"ns-resize"}},
    {h:"ne",pos:{top:`calc(${crop.top}% - 6px)`,right:`calc(${crop.right}% - 6px)`,cursor:"nesw-resize"}},
    {h:"w", pos:{top:"calc(50% - 6px)",left:`calc(${crop.left}% - 6px)`,cursor:"ew-resize"}},
    {h:"e", pos:{top:"calc(50% - 6px)",right:`calc(${crop.right}% - 6px)`,cursor:"ew-resize"}},
    {h:"sw",pos:{bottom:`calc(${crop.bottom}% - 6px)`,left:`calc(${crop.left}% - 6px)`,cursor:"nesw-resize"}},
    {h:"s", pos:{bottom:`calc(${crop.bottom}% - 6px)`,left:"calc(50% - 6px)",cursor:"ns-resize"}},
    {h:"se",pos:{bottom:`calc(${crop.bottom}% - 6px)`,right:`calc(${crop.right}% - 6px)`,cursor:"nwse-resize"}},
  ];

  /* ── Active tool size (for header display) ── */
  const activeSize = mainTool==="pen"?penSize:mainTool==="brush"?brushSize:mainTool==="erase"?eraserSize:shapeLineW;
  const activeOpacity = mainTool==="pen"?penOpacity:mainTool==="brush"?brushOpacity:1;

  /* ── CSS var shorthand ── */
  const V = (name:string) => `var(--ce-${name})`;

  /* ── Common section header ── */
  const sec=(title:string,children:React.ReactNode)=>(
    <div style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
      <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>{title}</div>
      {children}
    </div>
  );

  /* ── Shared color row ── */
  const colorRow=(
    <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"4px",marginBottom:"7px"}}>
      {COLORS.map(c=>(
        <button key={c} onClick={()=>{setStrokeColor(c);pushColor(c);}}
          style={{aspectRatio:"1",borderRadius:"4px",background:c,cursor:"pointer",outline:"none",
                  border:strokeColor===c?"2px solid #22d3ee":"1px solid rgba(128,128,128,0.2)",
                  transform:strokeColor===c?"scale(1.15)":"scale(1)",transition:"all .1s"}}/>
      ))}
    </div>
  );

  const customColor=(
    <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
      <input type="color" value={strokeColor} onChange={e=>{setStrokeColor(e.target.value);pushColor(e.target.value);}}
        style={{width:"28px",height:"24px",borderRadius:"5px",cursor:"pointer",padding:"1px",
                border:`1px solid ${V("border-2")}`,background:"transparent"}}/>
      <span style={{fontSize:"9px",color:V("text-dim"),fontFamily:"monospace"}}>{strokeColor}</span>
    </div>
  );

  /* ── Color history row ── */
  const colorHistoryRow = colorHistory.length>0 ? (
    <div style={{display:"flex",gap:"3px",marginBottom:"7px",alignItems:"center"}}>
      <span style={{fontSize:"8px",color:V("text-faint"),marginRight:"2px"}}>Recent:</span>
      {colorHistory.map((c,i)=>(
        <button key={i} onClick={()=>setStrokeColor(c)}
          style={{width:"14px",height:"14px",borderRadius:"3px",background:c,cursor:"pointer",
                  border:strokeColor===c?"2px solid #22d3ee":"1px solid rgba(128,128,128,0.2)",
                  flexShrink:0,outline:"none"}}/>
      ))}
    </div>
  ) : null;

  /* ── Tool sub-menu pills (below each tool button) ── */
  const renderToolSubMenu=()=>{
    if(!toolSubmenuOpen) return null;
    let pills:React.ReactNode=null;

    if(mainTool==="pen") pills=(
      <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
        {PEN_TYPES.map(({id,label,emoji})=>(
          <button key={id} onClick={()=>{setPenType(id);}}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 8px",borderRadius:"7px",
                    border:"none",cursor:"pointer",fontSize:"11px",fontWeight:600,textAlign:"left",
                    background:penType===id?"linear-gradient(135deg,#1d4ed8,#7c3aed)":V("hover"),
                    color:penType===id?"#fff":V("text-muted"),transition:"all .12s"}}>
            <span>{emoji}</span><span>{label}</span>
            {penType===id&&<Check size={10} style={{marginLeft:"auto"}} color="#fff"/>}
          </button>
        ))}
      </div>
    );

    if(mainTool==="brush") pills=(
      <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
        {BRUSH_TYPES.map(({id,label,emoji})=>(
          <button key={id} onClick={()=>{setBrushType(id);}}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 8px",borderRadius:"7px",
                    border:"none",cursor:"pointer",fontSize:"11px",fontWeight:600,textAlign:"left",
                    background:brushType===id?"linear-gradient(135deg,#0d9488,#2563eb)":V("hover"),
                    color:brushType===id?"#fff":V("text-muted"),transition:"all .12s"}}>
            <span>{emoji}</span><span>{label}</span>
            {brushType===id&&<Check size={10} style={{marginLeft:"auto"}} color="#fff"/>}
          </button>
        ))}
      </div>
    );

    if(mainTool==="shape") pills=(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"3px"}}>
        {SHAPE_TYPES.map(({id,icon,label})=>(
          <button key={id} onClick={()=>setShapeType(id)}
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",
                    padding:"6px 4px",borderRadius:"7px",border:"none",cursor:"pointer",
                    fontSize:"9px",fontWeight:600,
                    background:shapeType===id?"linear-gradient(135deg,#7c3aed,#db2777)":V("hover"),
                    color:shapeType===id?"#fff":V("text-muted"),transition:"all .12s"}}>
            {icon}{label}
          </button>
        ))}
      </div>
    );

    if(mainTool==="erase") pills=(
      <div style={{textAlign:"center",padding:"4px 0"}}>
        <div style={{fontSize:"10px",color:V("text-dim"),marginBottom:"6px"}}>Size: <b style={{color:"#f87171"}}>{eraserSize}px</b></div>
        <input type="range" min={2} max={80} value={eraserSize}
          onChange={e=>setEraserSize(Number(e.target.value))}
          style={{width:"100%",accentColor:"#f87171"}}/>
      </div>
    );

    if(mainTool==="text") pills=(
      <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
        <select value={fontFam} onChange={e=>setFontFam(e.target.value)}
          style={{width:"100%",background:V("input-bg"),border:`1px solid ${V("border")}`,
                  borderRadius:"6px",color:V("text"),fontSize:"10px",padding:"4px",outline:"none"}}>
          {["Inter","Outfit","Roboto","Georgia","Arial","Courier New","Impact"].map(f=>(
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <div style={{display:"flex",gap:"4px"}}>
          <button onClick={()=>setBold(b=>!b)}
            style={{flex:1,padding:"4px",borderRadius:"5px",border:"none",cursor:"pointer",fontWeight:900,fontSize:"12px",
                    background:bold?"linear-gradient(135deg,#2563eb,#7c3aed)":V("hover"),
                    color:bold?"#fff":V("text-muted")}}>B</button>
          <button onClick={()=>setItalic(i=>!i)}
            style={{flex:1,padding:"4px",borderRadius:"5px",border:"none",cursor:"pointer",fontStyle:"italic",fontWeight:700,fontSize:"12px",
                    background:italic?"linear-gradient(135deg,#2563eb,#7c3aed)":V("hover"),
                    color:italic?"#fff":V("text-muted")}}>I</button>
        </div>
      </div>
    );

    if(!pills) return null;
    return (
      <div className="ce-tool-submenu">
        {pills}
      </div>
    );
  };

  /* ── Tool panel (detailed, below sub-menu) ── */
  const renderToolPanel=()=>{
    if(mainTool==="pen") return(
      <>
        {sec("Pen Size",(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{penSize}px</span>
            </div>
            <input type="range" min={1} max={30} value={penSize} onChange={e=>setPenSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#22d3ee"}}/>
          </div>
        ))}
        {sec("Opacity",(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Opacity</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{Math.round(penOpacity*100)}%</span>
            </div>
            <input type="range" min={10} max={100} value={Math.round(penOpacity*100)}
              onChange={e=>setPenOpacity(Number(e.target.value)/100)}
              style={{width:"100%",accentColor:"#22d3ee"}}/>
          </div>
        ))}
        {sec("Color",<>{colorHistoryRow}{colorRow}{customColor}</>)}
      </>
    );

    if(mainTool==="brush") return(
      <>
        {sec("Brush Size",(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#06b6d4",fontWeight:700}}>{brushSize}px</span>
            </div>
            <input type="range" min={2} max={80} value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#06b6d4"}}/>
          </>
        ))}
        {sec("Opacity",(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Opacity</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#06b6d4",fontWeight:700}}>{Math.round(brushOpacity*100)}%</span>
            </div>
            <input type="range" min={5} max={100} value={Math.round(brushOpacity*100)}
              onChange={e=>setBrushOpacity(Number(e.target.value)/100)}
              style={{width:"100%",accentColor:"#06b6d4"}}/>
          </>
        ))}
        {sec("Color",<>{colorHistoryRow}{colorRow}{customColor}</>)}
      </>
    );

    if(mainTool==="shape") return(
      <>
        {sec("Stroke",(<>{colorHistoryRow}{colorRow}{customColor}
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
            <span style={{fontSize:"9px",color:V("text-dim")}}>Line Width</span>
            <span style={{fontSize:"10px",fontFamily:"monospace",color:"#a855f7",fontWeight:700}}>{shapeLineW}px</span>
          </div>
          <input type="range" min={1} max={20} value={shapeLineW} onChange={e=>setShapeLineW(Number(e.target.value))}
            style={{width:"100%",accentColor:"#a855f7"}}/>
        </>))}
        {sec("Fill",(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}>
              <span style={{fontSize:"10px",color:V("text-muted")}}>Enable Fill</span>
              <button onClick={()=>setShapeFill(f=>!f)}
                style={{width:"36px",height:"20px",borderRadius:"10px",border:"none",cursor:"pointer",
                        background:shapeFill?"linear-gradient(135deg,#7c3aed,#db2777)":"rgba(128,128,128,0.15)",
                        position:"relative",transition:"all .2s"}}>
                <div style={{position:"absolute",top:"2px",left:shapeFill?"16px":"2px",
                             width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"all .2s"}}/>
              </button>
            </div>
            {shapeFill&&(
              <>
                <div style={{fontSize:"9px",color:V("text-dim"),marginBottom:"5px"}}>Fill Color</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"4px"}}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setFillColor(c+"88")}
                      style={{aspectRatio:"1",borderRadius:"4px",background:c,cursor:"pointer",outline:"none",
                              border:fillColor.startsWith(c)?"2px solid #a855f7":"1px solid rgba(128,128,128,0.2)"}}/>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </>
    );

    if(mainTool==="erase") return(
      <>
        {sec("Eraser Size",(
          <>
            <div style={{display:"flex",justifyContent:"center",marginBottom:"10px"}}>
              <div style={{width:`${Math.min(80,eraserSize*2)}px`,height:`${Math.min(80,eraserSize*2)}px`,
                           borderRadius:"50%",border:"2px dashed #f87171",background:"rgba(248,113,113,0.08)",
                           display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
                <Eraser size={16} color="#f87171"/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#f87171",fontWeight:700}}>{eraserSize}px</span>
            </div>
            <input type="range" min={2} max={80} value={eraserSize} onChange={e=>setEraserSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#f87171"}}/>
            <p style={{fontSize:"9px",color:V("text-faint"),marginTop:"8px",lineHeight:1.5}}>
              Draw over areas to erase pixels. Works on drawn content and transparency.
            </p>
          </>
        ))}
      </>
    );

    if(mainTool==="text") return(
      <>
        {sec("Text Content",(
          <>
            <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
              placeholder="Type text, then click canvas..."
              rows={3}
              style={{width:"100%",borderRadius:"7px",padding:"7px",fontSize:"11px",color:V("text"),
                      background:V("input-bg"),border:`1px solid ${V("border")}`,outline:"none",
                      resize:"none",fontFamily:"inherit",marginBottom:"6px"}}/>
          </>
        ))}
        {sec("Font Size",(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{fontSz}px</span>
            </div>
            <input type="range" min={8} max={120} value={fontSz} onChange={e=>setFontSz(Number(e.target.value))}
              style={{width:"100%",accentColor:"#22d3ee"}}/>
          </>
        ))}
        {sec("Text Color",<>{colorHistoryRow}{colorRow}{customColor}</>)}
      </>
    );

    if(mainTool==="crop") return(
      <>
        {sec("Crop Region",(
          <>
            <p style={{fontSize:"10px",color:V("text-dim"),lineHeight:1.6,marginBottom:"8px"}}>
              Drag the 8 handles on the canvas to define your crop region.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"6px"}}>
              {["Top","Bottom","Left","Right"].map(side=>(
                <div key={side} style={{background:V("hover"),borderRadius:"7px",padding:"6px 8px",border:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"9px",color:V("text-dim"),marginBottom:"2px"}}>{side}</div>
                  <div style={{fontSize:"11px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>
                    {Math.round(crop[side.toLowerCase() as keyof typeof crop])}%
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setCrop({top:0,left:0,right:0,bottom:0})}
              style={{width:"100%",padding:"7px",borderRadius:"7px",cursor:"pointer",
                      background:V("hover"),border:`1px solid ${V("border")}`,
                      color:V("text-muted"),fontSize:"11px",fontWeight:600}}>
              Reset Crop
            </button>
          </>
        ))}
      </>
    );
    return null;
  };

  /* ── Minimized bubble ── */
  if(!maximized) return(
    <div style={{position:"fixed",bottom:"24px",right:"24px",zIndex:9999,
                 background:isDark?"linear-gradient(135deg,#1e293b,#0f172a)":"linear-gradient(135deg,#f0f4ff,#e8ecff)",
                 border:`1px solid ${isDark?"rgba(99,102,241,0.4)":"rgba(99,102,241,0.2)"}`,
                 borderRadius:"16px",boxShadow:"0 8px 40px rgba(0,0,0,0.5)",padding:"12px 16px",
                 display:"flex",alignItems:"center",gap:"10px",fontFamily:"'Inter',sans-serif"}}>
      <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"linear-gradient(135deg,#22d3ee,#6366f1)",
                   display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Zap size={16} color="#fff" fill="#fff"/>
      </div>
      <div>
        <div style={{fontSize:"12px",fontWeight:700,color:isDark?"#fff":"#0f1117",fontFamily:"'Outfit',sans-serif"}}>Canvas Studio</div>
        <div style={{fontSize:"9px",color:isDark?"#64748b":"#94a3b8"}}>Minimized — editing paused</div>
      </div>
      <button onClick={()=>setMaximized(true)}
        style={{padding:"6px 12px",borderRadius:"8px",border:"none",cursor:"pointer",
                background:"linear-gradient(135deg,#2563eb,#7c3aed)",color:"#fff",fontSize:"11px",fontWeight:700}}>
        <Maximize2 size={11} style={{display:"inline",marginRight:"4px"}}/>Expand
      </button>
      <button onClick={onCancel}
        style={{padding:"4px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
                borderRadius:"6px",color:"#f87171",cursor:"pointer",display:"flex"}}>
        <X size={13}/>
      </button>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════════
     FULL SCREEN RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div
      id="ff-canvas-root"
      style={{
        position:"fixed",top:0,left:0,right:0,bottom:0,
        width:"100vw",height:"100vh",
        zIndex:2147483647,display:"flex",flexDirection:"column",overflow:"hidden",
        background:V("bg"),color:V("text"),fontFamily:"'Inter',system-ui,sans-serif",
        margin:0,padding:0,
      }}
    >
      {/* Loading overlays */}
      {imgLoading && <BrandLoader message="Loading image…" subMessage={file.name} theme={theme}/>}
      {saving     && <BrandLoader message="Saving changes…" theme={theme}/>}
      {exporting  && <BrandLoader message="Exporting…" subMessage="Preparing download" theme={theme}/>}

      {/* ══ MENU BAR ════════════════════════════════════════════ */}
      <div style={{
        flexShrink:0,height:"28px",background:V("panel"),
        borderBottom:`1px solid ${V("border")}`,
        display:"flex",alignItems:"center",paddingLeft:"8px",gap:"2px",
        fontSize:"12px",
      }}>
        {/* Brand micro logo */}
        <div style={{display:"flex",alignItems:"center",gap:"5px",paddingRight:"10px",
                     borderRight:`1px solid ${V("border")}`,marginRight:"4px"}}>
          <div style={{width:"16px",height:"16px",borderRadius:"4px",flexShrink:0,
                       background:"linear-gradient(135deg,#22d3ee,#6366f1)",
                       display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Zap size={9} color="#fff" fill="#fff"/>
          </div>
          <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"12px",color:V("text")}}>
            File<span style={{color:"#22d3ee"}}>Forge</span>
          </span>
        </div>

        {/* File menu */}
        {(["file","edit","view","image","filter"] as MenuKey[]).map(menuKey=>{
          const labels:Record<string,string>={file:"File",edit:"Edit",view:"View",image:"Image",filter:"Filter"};
          const isOpen=activeMenu===menuKey;
          return(
            <div key={menuKey} style={{position:"relative"}}>
              <button
                onClick={e=>{e.stopPropagation();setActiveMenu(isOpen?null:menuKey);}}
                style={{padding:"3px 8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:500,
                        borderRadius:"5px",background:isOpen?"rgba(99,102,241,0.15)":"transparent",
                        color:isOpen?"#a5b4fc":V("text-muted"),transition:"all .1s"}}>
                {labels[menuKey as string]}
              </button>
              {isOpen&&(
                <div className="ce-dropdown-menu" onClick={e=>e.stopPropagation()}>
                  {menuKey==="file"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{save();setActiveMenu(null);}}>
                      <Save size={12} color="#22d3ee"/> Save Changes
                      <span className="ce-dropdown-shortcut">Ctrl+S</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{doExport("png");setActiveMenu(null);}}>
                      <FileDown size={12} color="#06b6d4"/> Export PNG
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{doExport("jpeg");setActiveMenu(null);}}>
                      <FileDown size={12} color="#f97316"/> Export JPEG
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{doExport("webp");setActiveMenu(null);}}>
                      <FileDown size={12} color="#a855f7"/> Export WebP
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{onCancel();setActiveMenu(null);}}>
                      <X size={12} color="#f87171"/> Close Editor
                    </button>
                  </>}
                  {menuKey==="edit"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{undo();setActiveMenu(null);}} style={{opacity:history.length?1:0.35}}>
                      <Undo2 size={12} color="#22d3ee"/> Undo
                      <span className="ce-dropdown-shortcut">Ctrl+Z</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{redo();setActiveMenu(null);}} style={{opacity:future.length?1:0.35}}>
                      <Redo2 size={12} color="#22d3ee"/> Redo
                      <span className="ce-dropdown-shortcut">Ctrl+Y</span>
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{clearCanvas();setActiveMenu(null);}}>
                      <Trash2 size={12} color="#f87171"/> Clear Canvas
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{resetAdjustments();setActiveMenu(null);}}>
                      <RefreshCw size={12} color="#94a3b8"/> Reset Adjustments
                    </button>
                  </>}
                  {menuKey==="view"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{setZoom(z=>Math.min(5,+(z+0.25).toFixed(2)));setActiveMenu(null);}}>
                      <ZoomIn size={12} color="#22d3ee"/> Zoom In
                      <span className="ce-dropdown-shortcut">+</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setZoom(z=>Math.max(0.1,+(z-0.25).toFixed(2)));setActiveMenu(null);}}>
                      <ZoomOut size={12} color="#22d3ee"/> Zoom Out
                      <span className="ce-dropdown-shortcut">-</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setZoom(1);setActiveMenu(null);}}>
                      <Maximize2 size={12} color="#94a3b8"/> Fit to Screen
                      <span className="ce-dropdown-shortcut">0</span>
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{setShowGrid(g=>!g);setActiveMenu(null);}}>
                      <Grid size={12} color={showGrid?"#22d3ee":"#94a3b8"}/>
                      {showGrid?"✓ ":""}Show Grid
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setShowRulers(r=>!r);setActiveMenu(null);}}>
                      <Ruler size={12} color={showRulers?"#22d3ee":"#94a3b8"}/>
                      {showRulers?"✓ ":""}Show Rulers
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setShowInfoBar(b=>!b);setActiveMenu(null);}}>
                      <Info size={12} color={showInfoBar?"#22d3ee":"#94a3b8"}/>
                      {showInfoBar?"✓ ":""}Info Bar
                    </button>
                  </>}
                  {menuKey==="image"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{setRotation(r=>(r+90)%360);setActiveMenu(null);}}>
                      <RotateCw size={12} color="#22d3ee"/> Rotate 90° CW
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setRotation(r=>(r-90+360)%360);setActiveMenu(null);}}>
                      <RotateCcw size={12} color="#22d3ee"/> Rotate 90° CCW
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{setFlipH(f=>!f);setActiveMenu(null);}}>
                      <FlipHorizontal size={12} color={flipH?"#22d3ee":"#94a3b8"}/>
                      {flipH?"✓ ":""}Flip Horizontal
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setFlipV(f=>!f);setActiveMenu(null);}}>
                      <FlipVertical size={12} color={flipV?"#22d3ee":"#94a3b8"}/>
                      {flipV?"✓ ":""}Flip Vertical
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{setFilter("grayscale");setActiveMenu(null);}}>
                      ⬛ Apply Grayscale
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setFilter("invert");setActiveMenu(null);}}>
                      🔀 Apply Invert
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setFilter("none");setActiveMenu(null);}}>
                      <RefreshCw size={12} color="#94a3b8"/> Reset Filter
                    </button>
                  </>}
                  {menuKey==="filter"&&<>
                    {FILTERS.map(({value,label,emoji})=>(
                      <button key={value} className="ce-dropdown-item"
                        onClick={()=>{setFilter(value);setActiveMenu(null);}}>
                        {emoji} {label}
                        {filter===value&&<Check size={10} style={{marginLeft:"auto"}} color="#22d3ee"/>}
                      </button>
                    ))}
                  </>}
                </div>
              )}
            </div>
          );
        })}

        {/* Right side of menu bar */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"6px",paddingRight:"8px"}}>
          <span style={{fontSize:"10px",color:V("text-faint"),fontFamily:"monospace"}}>
            {canvasDims.w}×{canvasDims.h}
          </span>
          <span style={{fontSize:"9px",color:V("text-faint")}}>·</span>
          <span style={{fontSize:"10px",color:V("text-dim")}}>
            {file.name.length>22?file.name.slice(0,19)+"…":file.name}
          </span>
        </div>
      </div>

      {/* ══ HEADER / TOOLBAR ═══════════════════════════════════ */}
      <div style={{
        flexShrink:0,height:"44px",background:V("panel"),
        borderBottom:`1px solid ${V("border")}`,
        display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px",gap:"6px",
      }}>
        {/* Left — active tool options (context-sensitive) */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",flex:1,minWidth:0}}>
          {/* Active tool badge */}
          <div style={{
            display:"flex",alignItems:"center",gap:"4px",padding:"3px 8px",borderRadius:"6px",
            background:`${mainTool==="pen"?"rgba(59,130,246,0.15)":mainTool==="brush"?"rgba(6,182,212,0.15)":mainTool==="shape"?"rgba(168,85,247,0.15)":mainTool==="erase"?"rgba(239,68,68,0.15)":mainTool==="text"?"rgba(234,179,8,0.15)":"rgba(249,115,22,0.15)"}`,
            border:`1px solid ${mainTool==="pen"?"rgba(59,130,246,0.3)":mainTool==="brush"?"rgba(6,182,212,0.3)":mainTool==="shape"?"rgba(168,85,247,0.3)":mainTool==="erase"?"rgba(239,68,68,0.3)":mainTool==="text"?"rgba(234,179,8,0.3)":"rgba(249,115,22,0.3)"}`,
            flexShrink:0,
          }}>
            {mainTool==="pen"&&<Pencil size={10} color="#3b82f6"/>}
            {mainTool==="brush"&&<Paintbrush size={10} color="#06b6d4"/>}
            {mainTool==="shape"&&<Square size={10} color="#a855f7"/>}
            {mainTool==="erase"&&<Eraser size={10} color="#ef4444"/>}
            {mainTool==="text"&&<Type size={10} color="#eab308"/>}
            {mainTool==="crop"&&<Crop size={10} color="#f97316"/>}
            <span style={{fontSize:"10px",fontWeight:700,
              color:mainTool==="pen"?"#3b82f6":mainTool==="brush"?"#06b6d4":mainTool==="shape"?"#a855f7":mainTool==="erase"?"#ef4444":mainTool==="text"?"#eab308":"#f97316",
              textTransform:"capitalize"}}>
              {mainTool}{mainTool==="shape"?` › ${shapeType}`:mainTool==="pen"?` › ${penType}`:mainTool==="brush"?` › ${brushType}`:""}
            </span>
          </div>

          {/* Size slider for drawing tools */}
          {(mainTool==="pen"||mainTool==="brush"||mainTool==="erase")&&(
            <div style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Size:</span>
              <input type="range" min={mainTool==="pen"?1:2} max={mainTool==="pen"?30:80}
                value={activeSize}
                onChange={e=>{ const v=Number(e.target.value); if(mainTool==="pen")setPenSize(v); else if(mainTool==="brush")setBrushSize(v); else setEraserSize(v); }}
                style={{width:"80px",accentColor:"#22d3ee",cursor:"pointer"}}/>
              <span style={{fontSize:"9px",fontFamily:"monospace",color:"#22d3ee",minWidth:"24px"}}>{activeSize}px</span>
            </div>
          )}

          {/* Opacity for drawing tools */}
          {(mainTool==="pen"||mainTool==="brush")&&(
            <div style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Opacity:</span>
              <input type="range" min={5} max={100} value={Math.round(activeOpacity*100)}
                onChange={e=>{ const v=Number(e.target.value)/100; if(mainTool==="pen")setPenOpacity(v); else setBrushOpacity(v); }}
                style={{width:"70px",accentColor:"#a855f7",cursor:"pointer"}}/>
              <span style={{fontSize:"9px",fontFamily:"monospace",color:"#a855f7",minWidth:"30px"}}>{Math.round(activeOpacity*100)}%</span>
            </div>
          )}

          {/* Active color dot */}
          {(mainTool==="pen"||mainTool==="brush"||mainTool==="shape"||mainTool==="text")&&(
            <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
              <div style={{width:"16px",height:"16px",borderRadius:"50%",background:strokeColor,
                           border:`2px solid ${V("border-2")}`,flexShrink:0}}/>
              <input type="color" value={strokeColor} title="Color"
                onChange={e=>{setStrokeColor(e.target.value);pushColor(e.target.value);}}
                style={{width:"0",height:"0",opacity:0,position:"absolute",pointerEvents:"none"}}/>
            </div>
          )}
        </div>

        {/* Center — undo/redo */}
        <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
          <button onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)"
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:history.length?V("hover"):"transparent",
                    border:`1px solid ${V("border")}`,
                    color:history.length?V("text-muted"):V("text-faint"),
                    cursor:history.length?"pointer":"default",fontSize:"11px",fontWeight:600}}>
            <Undo2 size={12}/> Undo
          </button>
          <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)"
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:future.length?V("hover"):"transparent",
                    border:`1px solid ${V("border")}`,
                    color:future.length?V("text-muted"):V("text-faint"),
                    cursor:future.length?"pointer":"default",fontSize:"11px",fontWeight:600}}>
            <Redo2 size={12}/> Redo
          </button>
        </div>

        {/* Right — save/export/controls */}
        <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
          <button onClick={()=>doExport("png")}
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:V("hover"),border:`1px solid ${V("border")}`,
                    color:V("text-muted"),cursor:"pointer",fontSize:"11px",fontWeight:600}}>
            <Download size={12}/> Export
          </button>
          <button onClick={save}
            style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 14px",borderRadius:"7px",border:"none",
                    color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:700,
                    background:saved?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#2563eb,#7c3aed)",
                    boxShadow:saved?"0 0 14px rgba(22,163,74,0.4)":"0 0 14px rgba(99,102,241,0.3)",transition:"all .3s"}}>
            {saved?<><Star size={11} fill="#fff"/> Saved!</>:<><Check size={11}/> Save</>}
          </button>
          <button onClick={()=>setMaximized(false)} title="Minimize"
            style={{padding:"5px",borderRadius:"6px",background:V("hover"),
                    border:`1px solid ${V("border")}`,color:V("text-dim"),cursor:"pointer",display:"flex"}}>
            <Minimize2 size={14}/>
          </button>
          <button onClick={onCancel}
            style={{padding:"5px",borderRadius:"6px",background:"rgba(239,68,68,0.1)",
                    border:"1px solid rgba(239,68,68,0.2)",color:"#f87171",cursor:"pointer",display:"flex"}}>
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* ══ INFO BAR (above canvas, below toolbar) ══════════════ */}
      {showInfoBar&&(
        <div style={{
          flexShrink:0,height:"26px",background:V("infobar-bg"),
          borderBottom:`1px solid ${V("infobar-border")}`,
          display:"flex",alignItems:"center",paddingLeft:"8px",gap:"10px",
          fontSize:"10px",color:V("text-dim"),
        }}>
          <span>📄 {file.name.length>30?file.name.slice(0,27)+"…":file.name}</span>
          <span style={{color:V("text-faint")}}>·</span>
          <span style={{color:V("text-faint")}}>{(file.size/1024).toFixed(1)} KB</span>
          <span style={{color:V("text-faint")}}>·</span>
          <span>{canvasDims.w}<span style={{color:V("text-faint")}}>×</span>{canvasDims.h}px</span>
          <span style={{color:V("text-faint")}}>·</span>
          <span style={{color:"#22d3ee",fontFamily:"monospace"}}>{Math.round(zoom*100)}%</span>
          <span style={{color:V("text-faint")}}>·</span>
          <span style={{color:V("text-faint"),fontFamily:"monospace"}}>
            x:{cursorPos.x} y:{cursorPos.y}
          </span>
          <span style={{marginLeft:"auto",paddingRight:"8px",display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{color:V("text-faint")}}>History: {history.length}/30</span>
            {filter!=="none"&&<span style={{color:"#a855f7",fontWeight:600}}>Filter: {filter}</span>}
            {(flipH||flipV)&&<span style={{color:"#06b6d4",fontWeight:600}}>
              {flipH?"↔":""}{ flipV?"↕":""}
            </span>}
          </span>
        </div>
      )}

      {/* ══ BODY ═══════════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{
          flexShrink:0,width:"170px",background:V("panel"),
          borderRight:`1px solid ${V("border")}`,
          display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",
        }} className="ff-sidebar-l">

          {/* Tool buttons */}
          <div ref={toolbarRef} style={{flexShrink:0,padding:"8px 8px 0",display:"flex",flexDirection:"column",gap:"2px",position:"relative"}}>
            {([
              {id:"pen",    icon:<Pencil     size={14}/>, label:"Pen",    color:"#3b82f6"},
              {id:"brush",  icon:<Paintbrush  size={14}/>, label:"Brush",  color:"#06b6d4"},
              {id:"shape",  icon:<Square      size={14}/>, label:"Shapes", color:"#a855f7"},
              {id:"erase",  icon:<Eraser      size={14}/>, label:"Eraser", color:"#ef4444"},
              {id:"text",   icon:<Type        size={14}/>, label:"Text",   color:"#eab308"},
              {id:"crop",   icon:<Crop        size={14}/>, label:"Crop",   color:"#f97316"},
            ] as {id:MainTool;icon:React.ReactNode;label:string;color:string}[]).map(({id,icon,label,color})=>(
              <button key={id}
                onClick={()=>{
                  if(mainTool===id){ setToolSubmenuOpen(o=>!o); }
                  else { setMainTool(id); setToolSubmenuOpen(true); }
                }}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"7px 9px",
                  borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,
                  textAlign:"left",transition:"all .15s",
                  background:mainTool===id?`${color}22`:V("hover"),
                  borderLeft:mainTool===id?`3px solid ${color}`:"3px solid transparent",
                  color:mainTool===id?color:V("text-dim"),
                }}>
                <span style={{color}}>{icon}</span>
                {label}
                {mainTool===id&&<ChevronDown size={9} style={{marginLeft:"auto",transform:toolSubmenuOpen?"rotate(180deg)":"rotate(0)",transition:"transform .15s"}} color={color}/>}
              </button>
            ))}

            {/* Tool sub-menu — directly below the selected tool */}
            {renderToolSubMenu()}
          </div>

          <div style={{height:"1px",background:V("border"),margin:"6px 8px"}}/>

          {/* Detailed tool panel */}
          <div className="ce-panel-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
            {renderToolPanel()}
          </div>

          {/* Zoom at bottom */}
          <div style={{flexShrink:0,padding:"8px",borderTop:`1px solid ${V("border")}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"2px",background:isDark?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.06)",borderRadius:"7px",padding:"2px"}}>
              <button onClick={()=>setZoom(z=>Math.max(0.1,+(z-0.1).toFixed(1)))}
                style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",padding:"4px",display:"flex"}}>
                <ZoomOut size={12}/>
              </button>
              <span style={{flex:1,textAlign:"center",fontSize:"10px",fontFamily:"monospace",fontWeight:700,color:"#22d3ee"}}>
                {Math.round(zoom*100)}%
              </span>
              <button onClick={()=>setZoom(z=>Math.min(5,+(z+0.1).toFixed(1)))}
                style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",padding:"4px",display:"flex"}}>
                <ZoomIn size={12}/>
              </button>
              <button onClick={()=>setZoom(1)} title="Fit (0)"
                style={{background:"none",border:"none",color:V("text-faint"),cursor:"pointer",padding:"4px",display:"flex"}}>
                <Maximize2 size={10}/>
              </button>
            </div>
          </div>
        </div>

        {/* ── CANVAS CENTER ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,minHeight:0}}>

          {/* Ruler + Canvas wrapper */}
          <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>

            {/* Horizontal ruler */}
            {showRulers&&(
              <div style={{position:"absolute",top:0,left:20,right:0,height:"20px",zIndex:10}}>
                <canvas ref={rulerHRef} className="ce-ruler-h"
                  width={2000} height={20} style={{width:"100%",height:"20px"}}/>
              </div>
            )}
            {/* Vertical ruler */}
            {showRulers&&(
              <div style={{position:"absolute",top:20,left:0,width:"20px",bottom:0,zIndex:10}}>
                <canvas ref={rulerVRef} className="ce-ruler-v"
                  height={2000} width={20} style={{height:"100%",width:"20px"}}/>
              </div>
            )}
            {/* Ruler corner */}
            {showRulers&&(
              <div style={{position:"absolute",top:0,left:0,width:"20px",height:"20px",
                           background:isDark?"#0a0d15":"#eef0f8",
                           borderRight:`1px solid ${V("border")}`,borderBottom:`1px solid ${V("border")}`,
                           zIndex:11}}/>
            )}

            {/* Main canvas area */}
            <div ref={containerRef}
              style={{
                flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
                overflow:"hidden",
                paddingTop:showRulers?"20px":"0",
                paddingLeft:showRulers?"20px":"0",
                backgroundImage:showGrid
                  ?"radial-gradient(circle,rgba(99,102,241,0.25) 1px,transparent 1px)"
                  :`linear-gradient(${V("border")} 1px,transparent 1px),linear-gradient(90deg,${V("border")} 1px,transparent 1px)`,
                backgroundSize:showGrid?"20px 20px":"20px 20px",
                backgroundColor:V("canvas-area"),
              }}>

              {/* Zoom wrapper */}
              <div style={{
                position:"relative",display:"inline-block",
                transform:`scale(${zoom})`,transformOrigin:"center center",
                transition:"transform .1s",userSelect:"none",
              }}>
                {/* Base canvas */}
                <canvas ref={canvasRef}
                  onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onLeave}
                  onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
                  style={{
                    display:"block",borderRadius:"4px",
                    border:`1px solid ${V("border-2")}`,
                    boxShadow:`0 0 40px rgba(0,0,0,${isDark?0.9:0.15})`,
                    cursor:getCursor(),maxWidth:"100%",maxHeight:"calc(100vh - 200px)",touchAction:"none",
                  }}/>

                {/* Overlay for live shape preview */}
                <canvas ref={overlayRef}
                  style={{position:"absolute",top:0,left:0,pointerEvents:"none",borderRadius:"4px",
                          maxWidth:"100%",maxHeight:"calc(100vh - 200px)"}}/>

                {/* Eraser cursor visual */}
                {mainTool==="erase"&&eraserPos&&(()=>{
                  const c=canvasRef.current;
                  if(!c) return null;
                  const r=c.getBoundingClientRect();
                  const sx=r.width/c.width, sy=r.height/c.height;
                  const px=eraserPos.x*sx, py=eraserPos.y*sy;
                  const sz=eraserSize*2*Math.min(sx,sy);
                  return(
                    <div style={{
                      position:"absolute",
                      left:px-sz/2, top:py-sz/2,
                      width:sz, height:sz,
                      borderRadius:"50%",
                      border:"2px solid #f87171",
                      background:"rgba(248,113,113,0.08)",
                      pointerEvents:"none",
                      boxSizing:"border-box",
                    }}/>
                  );
                })()}

                {/* Crop overlay + handles */}
                {mainTool==="crop"&&(
                  <>
                    <div style={{
                      position:"absolute",pointerEvents:"none",
                      top:`${crop.top}%`,left:`${crop.left}%`,right:`${crop.right}%`,bottom:`${crop.bottom}%`,
                      border:"2px dashed #22d3ee",boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)",borderRadius:"2px",
                    }}/>
                    {CROP_HANDLES.map(({h,pos})=>(
                      <div key={h} onMouseDown={e=>startCropHandle(h,e)}
                        style={{position:"absolute",width:"13px",height:"13px",borderRadius:"50%",
                                background:"linear-gradient(135deg,#22d3ee,#6366f1)",border:"2px solid #fff",zIndex:20,...pos}}/>
                    ))}
                  </>
                )}
              </div>

              {/* Status bar */}
              <div style={{
                position:"absolute",bottom:"8px",left:"8px",display:"flex",alignItems:"center",gap:"8px",
                background:V("status-bg"),border:`1px solid ${V("border")}`,
                borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:V("text-faint"),
                pointerEvents:"none",backdropFilter:"blur(8px)",
              }}>
                <Sparkles size={9} color="#a855f7"/>
                <span style={{color:"#a855f7",fontWeight:700}}>Canvas Studio</span>
                <span style={{color:V("text-faint")}}>·</span>
                <span style={{color:V("text-muted"),textTransform:"capitalize"}}>{mainTool}</span>
                <span style={{color:V("text-faint")}}>·</span>
                <span style={{fontFamily:"monospace"}}>{Math.round(zoom*100)}%</span>
                <span style={{color:V("text-faint")}}>·</span>
                <span style={{fontFamily:"monospace",color:V("text-faint")}}>
                  {cursorPos.x}, {cursorPos.y}
                </span>
              </div>

              {/* History counter */}
              <div style={{
                position:"absolute",bottom:"8px",right:"8px",display:"flex",alignItems:"center",gap:"6px",
                background:V("status-bg"),border:`1px solid ${V("border")}`,
                borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:V("text-faint"),
                pointerEvents:"none",backdropFilter:"blur(8px)",
              }}>
                <Layers size={9} color="#a855f7"/>
                <div style={{width:"55px",height:"3px",borderRadius:"2px",background:V("hover-2")}}>
                  <div style={{height:"100%",borderRadius:"2px",
                               background:"linear-gradient(90deg,#22d3ee,#a855f7)",
                               width:`${(history.length/30)*100}%`,transition:"width .3s"}}/>
                </div>
                <span>{history.length}/30</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{
          flexShrink:0,width:"185px",background:V("panel"),
          borderLeft:`1px solid ${V("border")}`,
          display:"flex",flexDirection:"column",overflow:"hidden",
        }} className="ff-sidebar-r">

          {/* Right tabs */}
          <div style={{flexShrink:0,display:"flex",borderBottom:`1px solid ${V("border")}`}}>
            {([["adjust","Adjust"],["crop","Transform"],["info","Info"]] as [typeof rightTab,string][]).map(([tab,lbl])=>(
              <button key={tab} onClick={()=>setRightTab(tab)}
                style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:600,
                        background:rightTab===tab?"rgba(99,102,241,0.1)":"transparent",
                        borderBottom:rightTab===tab?"2px solid #6366f1":`2px solid transparent`,
                        color:rightTab===tab?"#a5b4fc":V("text-dim")}}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="ce-panel-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
            {rightTab==="adjust"&&(
              <>
                {[
                  {label:"Brightness",icon:<Sun size={10} color="#fbbf24"/>,val:brightness,set:setBrightness,ac:"#fbbf24"},
                  {label:"Contrast",  icon:<ContrastIcon size={10} color="#60a5fa"/>,val:contrast,set:setContrast,ac:"#60a5fa"},
                  {label:"Saturation",icon:<Droplets size={10} color="#f472b6"/>,val:saturation,set:setSaturation,ac:"#f472b6"},
                ].map(({label,icon,val,set,ac})=>(
                  <div key={label} style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                      <span style={{fontSize:"10px",color:V("text-muted"),display:"flex",alignItems:"center",gap:"4px",fontWeight:600}}>{icon}{label}</span>
                      <span style={{fontSize:"10px",fontFamily:"monospace",fontWeight:700,color:ac}}>{val>0?`+${val}`:val}</span>
                    </div>
                    <input type="range" min={-100} max={100} value={val}
                      onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:ac,cursor:"pointer"}}/>
                  </div>
                ))}
                <div style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"10px",color:V("text-muted"),fontWeight:600,marginBottom:"5px",display:"flex",alignItems:"center",gap:"4px"}}>
                    <Sparkles size={10} color="#a855f7"/> Filter Preset
                  </div>
                  <select value={filter} onChange={e=>setFilter(e.target.value as FilterPr)}
                    style={{width:"100%",background:V("input-bg"),border:`1px solid ${V("border")}`,
                            borderRadius:"6px",color:V("text"),fontSize:"11px",padding:"4px 6px",outline:"none",cursor:"pointer"}}>
                    {FILTERS.map(({value,label})=><option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
                {/* Quick reset */}
                <div style={{padding:"8px 10px"}}>
                  <button onClick={resetAdjustments}
                    style={{width:"100%",padding:"6px",borderRadius:"7px",cursor:"pointer",
                            background:V("hover"),border:`1px solid ${V("border")}`,
                            color:V("text-muted"),fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}>
                    <RefreshCw size={11}/> Reset All Adjustments
                  </button>
                </div>
              </>
            )}

            {rightTab==="crop"&&(
              <>
                <div style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>Rotate &amp; Flip</div>
                  <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                    <button onClick={()=>setRotation(r=>(r+90)%360)}
                      style={{flex:"1 1 60px",display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",
                              padding:"6px 4px",borderRadius:"6px",border:`1px solid ${V("border")}`,
                              background:V("hover"),color:V("text-muted"),cursor:"pointer",fontSize:"10px",fontWeight:600}}>
                      <RotateCw size={11} color="#22d3ee"/> 90°
                    </button>
                    <button onClick={()=>setRotation(r=>(r-90+360)%360)}
                      style={{flex:"1 1 60px",display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",
                              padding:"6px 4px",borderRadius:"6px",border:`1px solid ${V("border")}`,
                              background:V("hover"),color:V("text-muted"),cursor:"pointer",fontSize:"10px",fontWeight:600}}>
                      <RotateCcw size={11} color="#22d3ee"/> -90°
                    </button>
                    <button onClick={()=>setFlipH(f=>!f)}
                      style={{flex:"1",padding:"6px",borderRadius:"6px",cursor:"pointer",
                              border:flipH?`1px solid rgba(34,211,238,0.4)`:`1px solid ${V("border")}`,
                              background:flipH?"rgba(34,211,238,0.12)":V("hover"),
                              color:flipH?"#22d3ee":V("text-muted"),display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <FlipHorizontal size={12}/>
                    </button>
                    <button onClick={()=>setFlipV(f=>!f)}
                      style={{flex:"1",padding:"6px",borderRadius:"6px",cursor:"pointer",
                              border:flipV?`1px solid rgba(34,211,238,0.4)`:`1px solid ${V("border")}`,
                              background:flipV?"rgba(34,211,238,0.12)":V("hover"),
                              color:flipV?"#22d3ee":V("text-muted"),display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <FlipVertical size={12}/>
                    </button>
                  </div>
                </div>
                <div style={{padding:"8px 10px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>Crop</div>
                  <p style={{fontSize:"9px",color:V("text-faint"),lineHeight:1.5,marginBottom:"8px"}}>
                    Switch to the Crop tool in the left sidebar to drag handles on canvas.
                  </p>
                  <button onClick={()=>{setMainTool("crop");setCrop({top:0,left:0,right:0,bottom:0});}}
                    style={{width:"100%",padding:"7px",borderRadius:"7px",cursor:"pointer",
                            background:V("hover"),border:`1px solid ${V("border")}`,
                            color:V("text-muted"),fontSize:"11px",fontWeight:600}}>
                    Reset Crop
                  </button>
                </div>
              </>
            )}

            {rightTab==="info"&&(
              <div style={{padding:"10px"}}>
                {[
                  {label:"File Name",  val:file.name},
                  {label:"File Size",  val:`${(file.size/1024).toFixed(1)} KB`},
                  {label:"File Type",  val:file.type||"unknown"},
                  {label:"Dimensions", val:`${canvasDims.w} × ${canvasDims.h} px`},
                  {label:"Undo Steps", val:`${history.length}/30`},
                  {label:"Redo Steps", val:`${future.length} available`},
                  {label:"Zoom",       val:`${Math.round(zoom*100)}%`},
                  {label:"Rotation",   val:`${rotation}°`},
                  {label:"Filter",     val:filter},
                  {label:"Theme",      val:theme},
                ].map(({label,val})=>(
                  <div key={label} style={{marginBottom:"8px"}}>
                    <div style={{fontSize:"9px",color:V("text-faint"),fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"2px"}}>{label}</div>
                    <div style={{fontSize:"11px",color:V("text-muted"),fontFamily:"monospace",wordBreak:"break-all"}}>{val}</div>
                  </div>
                ))}

                {/* Shortcuts reference */}
                <div style={{marginTop:"10px",padding:"8px",borderRadius:"8px",background:V("hover"),border:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"9px",color:V("text-faint"),fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"5px"}}>Keyboard Shortcuts</div>
                  {[["P","Pen"],["B","Brush"],["E","Eraser"],["T","Text"],["S","Shapes"],["C","Crop"],
                    ["[/]","Size ±"],["Ctrl+Z","Undo"],["Ctrl+Y","Redo"],["Ctrl+S","Save"],
                    ["+/-","Zoom"],["0","Fit 100%"]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                      <span style={{fontSize:"9px",color:V("text-dim")}}>{v}</span>
                      <kbd style={{fontSize:"8px",fontFamily:"monospace",color:"#22d3ee",background:"rgba(34,211,238,0.08)",
                                   padding:"1px 4px",borderRadius:"3px",border:"1px solid rgba(34,211,238,0.2)"}}>{k}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom: premium badge */}
          <div style={{flexShrink:0,padding:"10px"}}>
            <div style={{borderRadius:"9px",padding:"9px",textAlign:"center",
                         background:`rgba(99,102,241,${isDark?0.06:0.04})`,border:"1px solid rgba(99,102,241,0.15)"}}>
              <Sparkles size={12} color="#a855f7" style={{margin:"0 auto 3px"}}/>
              <div style={{fontSize:"9px",color:"#a855f7",fontWeight:700}}>Canvas Studio Pro</div>
              <div style={{fontSize:"8px",color:V("text-faint"),marginTop:"2px"}}>Undo · Shapes · Text · Filters</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM BAR ══════════════════════════════════ */}
      <div className="ff-mobile-bar" style={{
        flexShrink:0,display:"none",
        borderTop:`1px solid ${V("border")}`,background:V("panel"),
      }}>
        <div style={{display:"flex",borderBottom:`1px solid ${V("border")}`}}>
          {(["tools","adjust","text"] as const).map(t=>(
            <button key={t} onClick={()=>{}}
              style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:700,
                      background:"transparent",color:V("text-dim"),textTransform:"capitalize"}}>
              {t==="tools"?"🖊 Tools":t==="adjust"?"🎨 Adjust":"✏️ Text"}
            </button>
          ))}
        </div>
        {/* Mobile tools grid */}
        <div style={{padding:"8px 10px",maxHeight:"160px",overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"4px",marginBottom:"8px"}}>
            {([
              {id:"pen",icon:<Pencil size={13}/>,label:"Pen",c:"#3b82f6"},
              {id:"brush",icon:<Paintbrush size={13}/>,label:"Brush",c:"#06b6d4"},
              {id:"shape",icon:<Square size={13}/>,label:"Shape",c:"#a855f7"},
              {id:"erase",icon:<Eraser size={13}/>,label:"Erase",c:"#ef4444"},
              {id:"text",icon:<Type size={13}/>,label:"Text",c:"#eab308"},
              {id:"crop",icon:<Crop size={13}/>,label:"Crop",c:"#f97316"},
            ] as {id:MainTool;icon:React.ReactNode;label:string;c:string}[]).map(({id,icon,label,c})=>(
              <button key={id} onClick={()=>setMainTool(id)}
                style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",padding:"8px 4px",
                        borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"9px",fontWeight:700,
                        background:mainTool===id?`${c}22`:V("hover"),
                        color:mainTool===id?c:V("text-dim"),
                        borderLeft:mainTool===id?`2px solid ${c}`:"2px solid transparent"}}>
                <span style={{color:c}}>{icon}</span>{label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
            {COLORS.map(c=>(
              <button key={c} onClick={()=>setStrokeColor(c)}
                style={{width:"22px",height:"22px",borderRadius:"5px",background:c,cursor:"pointer",outline:"none",
                        border:strokeColor===c?"2px solid #22d3ee":"1px solid rgba(128,128,128,0.2)"}}/>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ff-sidebar-l, .ff-sidebar-r { display: none !important; }
          .ff-mobile-bar { display: flex !important; flex-direction: column; }
        }
        input[type="range"] { cursor: pointer; }
        select, textarea { font-family: 'Inter', sans-serif; }
      `}</style>
    </div>
  );
}

/* ─── Portal wrapper ─────────────────────────────────────────── */
export default function CanvasEditor(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(()=>{setMounted(true);},[]);
  if(!mounted) return null;
  return createPortal(<CanvasEditorInner {...props}/>, document.body);
}
