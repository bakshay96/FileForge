"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Pencil, Paintbrush, Eraser, X, Zap, Sun, Undo2, Redo2,
  Contrast as ContrastIcon, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Maximize2, Minimize2, Sparkles, Square,
  Circle, Triangle, Type, Download, Check, Crop, Star, Droplets,
  Layers, Minus, Move, ArrowRight, Sliders, ChevronRight,
  RotateCw,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════ */
type MainTool = "pen" | "brush" | "shape" | "erase" | "text" | "crop";
type PenType  = "ballpoint" | "felt" | "marker" | "highlighter";
type BrushType = "soft" | "hard" | "airbrush" | "watercolor" | "oil";
type ShapeType = "rect" | "circle" | "line" | "arrow" | "triangle" | "star";
type FilterPr  = "none"|"grayscale"|"sepia"|"invert"|"warm"|"cool"|"vivid";

interface Props { file: File; onSave:(f:File)=>void; onCancel:()=>void; }

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const COLORS   = ["#3b82f6","#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#a855f7","#ec4899","#ffffff","#000000","#475569","#84cc16"];
const FILTERS: {value:FilterPr; label:string}[] = [
  {value:"none",label:"Original"},{value:"grayscale",label:"Grayscale"},
  {value:"sepia",label:"Sepia"},{value:"warm",label:"Warm Film"},
  {value:"cool",label:"Cool Breeze"},{value:"vivid",label:"Vivid Boost"},
  {value:"invert",label:"Invert"},
];

const PEN_TYPES: {id:PenType; label:string; desc:string}[] = [
  {id:"ballpoint", label:"Ballpoint", desc:"Thin, precise strokes"},
  {id:"felt",      label:"Felt Tip",  desc:"Smooth medium lines"},
  {id:"marker",    label:"Marker",    desc:"Bold thick strokes"},
  {id:"highlighter",label:"Highlighter",desc:"Semi-transparent"},
];

const BRUSH_TYPES: {id:BrushType; label:string; desc:string}[] = [
  {id:"soft",      label:"Soft Round",  desc:"Feathered soft edges"},
  {id:"hard",      label:"Hard Round",  desc:"Sharp defined edges"},
  {id:"airbrush",  label:"Airbrush",    desc:"Light spray effect"},
  {id:"watercolor",label:"Watercolor",  desc:"Wet-on-wet blending"},
  {id:"oil",       label:"Oil Paint",   desc:"Textured thick strokes"},
];

const SHAPE_TYPES: {id:ShapeType; icon:React.ReactNode; label:string}[] = [
  {id:"rect",     icon:<Square   size={16}/>, label:"Rectangle"},
  {id:"circle",   icon:<Circle   size={16}/>, label:"Circle"},
  {id:"line",     icon:<Minus    size={16}/>, label:"Line"},
  {id:"arrow",    icon:<ArrowRight size={16}/>,label:"Arrow"},
  {id:"triangle", icon:<Triangle  size={16}/>, label:"Triangle"},
  {id:"star",     icon:<Star      size={16}/>, label:"Star"},
];

/* Cursor SVGs */
const PEN_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%2322d3ee'/%3E%3C/svg%3E") 0 24, crosshair`;
const BRUSH_CURSOR = "crosshair";
const ERASE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='3' fill='none' stroke='%23f87171' stroke-width='2'/%3E%3C/svg%3E") 10 10, crosshair`;
const TEXT_CURSOR = "text";

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
    case "ballpoint":
      ctx.lineWidth=size*0.7;
      ctx.globalCompositeOperation="source-over";
      break;
    case "felt":
      ctx.lineWidth=size*1.2;
      ctx.globalCompositeOperation="source-over";
      break;
    case "marker":
      ctx.lineWidth=size*2.5;
      ctx.globalCompositeOperation="source-over";
      ctx.lineCap="square";
      break;
    case "highlighter":
      ctx.lineWidth=size*4;
      ctx.globalCompositeOperation="multiply";
      ctx.lineCap="square";
      break;
  }
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

function applyBrushStroke(ctx:CanvasRenderingContext2D, x1:number,y1:number,x2:number,y2:number, brushType:BrushType, size:number, color:string, opacity:number) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap="round"; ctx.lineJoin="round";
  ctx.globalAlpha = opacity;

  switch(brushType) {
    case "soft":
      ctx.lineWidth=size;
      ctx.globalCompositeOperation="source-over";
      ctx.shadowBlur=size*0.8; ctx.shadowColor=color;
      break;
    case "hard":
      ctx.lineWidth=size;
      ctx.globalCompositeOperation="source-over";
      ctx.shadowBlur=0;
      break;
    case "airbrush":
      // Spray dots along the path
      const dist = Math.sqrt((x2-x1)**2+(y2-y1)**2)||1;
      const steps = Math.max(1,Math.floor(dist/4));
      ctx.globalAlpha = opacity*0.08;
      for(let i=0;i<steps;i++){
        const px=x1+(x2-x1)*(i/steps), py=y1+(y2-y1)*(i/steps);
        for(let d=0;d<8;d++){
          const angle=Math.random()*2*Math.PI, r=Math.random()*size;
          ctx.beginPath();
          ctx.arc(px+Math.cos(angle)*r, py+Math.sin(angle)*r, 1, 0, 2*Math.PI);
          ctx.fillStyle=color; ctx.fill();
        }
      }
      ctx.restore(); return;
    case "watercolor":
      ctx.lineWidth=size*1.5;
      ctx.globalAlpha=opacity*0.15;
      ctx.globalCompositeOperation="source-over";
      ctx.shadowBlur=size*1.5; ctx.shadowColor=color;
      break;
    case "oil":
      ctx.lineWidth=size;
      ctx.globalAlpha=opacity;
      ctx.shadowBlur=2; ctx.shadowColor="rgba(0,0,0,0.3)";
      break;
  }
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  ctx.restore();
}

function drawShape(ctx:CanvasRenderingContext2D, shapeType:ShapeType, x1:number,y1:number,x2:number,y2:number, strokeColor:string, fillColor:string|null, lineW:number) {
  ctx.save();
  ctx.strokeStyle=strokeColor; ctx.lineWidth=lineW; ctx.lineJoin="round";
  if (fillColor) { ctx.fillStyle=fillColor; }
  const w=x2-x1, h=y2-y1;

  switch(shapeType){
    case "rect":
      if (fillColor) ctx.fillRect(x1,y1,w,h);
      ctx.strokeRect(x1,y1,w,h);
      break;
    case "circle": {
      const rx=Math.abs(w)/2, ry=Math.abs(h)/2;
      ctx.beginPath();
      ctx.ellipse(x1+w/2, y1+h/2, rx, ry, 0, 0, 2*Math.PI);
      if (fillColor) ctx.fill();
      ctx.stroke(); break;
    }
    case "line":
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); break;
    case "arrow": {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      const angle=Math.atan2(y2-y1,x2-x1);
      const al=18, aa=0.45;
      ctx.beginPath();
      ctx.moveTo(x2,y2);
      ctx.lineTo(x2-al*Math.cos(angle-aa), y2-al*Math.sin(angle-aa));
      ctx.lineTo(x2-al*Math.cos(angle+aa), y2-al*Math.sin(angle+aa));
      ctx.closePath(); ctx.fillStyle=strokeColor; ctx.fill(); break;
    }
    case "triangle": {
      ctx.beginPath();
      ctx.moveTo(x1+w/2, y1);
      ctx.lineTo(x2, y2); ctx.lineTo(x1, y2); ctx.closePath();
      if (fillColor) ctx.fill(); ctx.stroke(); break;
    }
    case "star": {
      const cx=x1+w/2, cy=y1+h/2;
      const or=Math.min(Math.abs(w),Math.abs(h))/2, ir=or*0.45;
      ctx.beginPath();
      for(let i=0;i<10;i++){
        const r=i%2===0?or:ir;
        const a=(i*Math.PI/5)-Math.PI/2;
        i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));
      }
      ctx.closePath();
      if (fillColor) ctx.fill(); ctx.stroke(); break;
    }
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════
   INNER COMPONENT
═══════════════════════════════════════════════════════════════ */
function CanvasEditorInner({ file, onSave, onCancel }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const overlayRef   = useRef<HTMLCanvasElement>(null); // live shape preview
  const containerRef = useRef<HTMLDivElement>(null);

  const [img, setImg] = useState<HTMLImageElement|null>(null);

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

  /* ── Text ── */
  const [textInput, setTextInput] = useState("");
  const [fontFam,   setFontFam]   = useState("Inter");
  const [fontSz,    setFontSz]    = useState(24);
  const [bold,      setBold]      = useState(false);
  const [italic,    setItalic]    = useState(false);

  /* ── Color ── */
  const [strokeColor, setStrokeColor] = useState("#3b82f6");
  const [fillColor,   setFillColor]   = useState("#3b82f633");
  const [activeColorSlot, setActiveColorSlot] = useState<"stroke"|"fill">("stroke");

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
  const [saved,     setSaved]     = useState(false);
  const [maximized, setMaximized] = useState(true);
  const [mTab,      setMTab]      = useState<"tools"|"adjust"|"text">("tools");
  const [rightTab,  setRightTab]  = useState<"adjust"|"crop"|"info">("adjust");

  /* ── Drawing internals ── */
  const isDrawing = useRef(false);
  const startPos  = useRef<{x:number;y:number}|null>(null);
  const lastPos   = useRef<{x:number;y:number}|null>(null);

  /* Lock body scroll */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Load image */
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* Redraw base canvas */
  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c || !img) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width  = img.naturalWidth  || 800;
    c.height = img.naturalHeight || 600;
    // sync overlay size
    const ov = overlayRef.current;
    if (ov) { ov.width=c.width; ov.height=c.height; }
    ctx.save();
    ctx.clearRect(0,0,c.width,c.height);
    let f = `brightness(${100+brightness}%) contrast(${100+contrast}%) saturate(${100+saturation}%)`;
    if (filter==="grayscale") f+=" grayscale(100%)";
    if (filter==="sepia")     f+=" sepia(80%)";
    if (filter==="invert")    f+=" invert(100%)";
    if (filter==="warm")      f+=" sepia(30%) hue-rotate(-10deg)";
    if (filter==="cool")      f+=" hue-rotate(180deg) saturate(150%)";
    if (filter==="vivid")     f+=" saturate(200%) contrast(110%)";
    ctx.filter=f;
    ctx.translate(c.width/2,c.height/2);
    ctx.rotate((rotation*Math.PI)/180);
    ctx.scale(flipH?-1:1, flipV?-1:1);
    ctx.drawImage(img,-c.width/2,-c.height/2,c.width,c.height);
    ctx.restore();
  }, [img,brightness,contrast,saturation,rotation,flipH,flipV,filter]);

  useEffect(()=>{ redraw(); },[redraw]);

  /* History helpers */
  const saveState = () => {
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if (!c||!ctx) return;
    setHistory(h=>[...h.slice(-30), ctx.getImageData(0,0,c.width,c.height)]);
    setFuture([]);
  };
  const undo = () => {
    if (!history.length) return;
    const prev=history[history.length-1];
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if (!c||!ctx) return;
    setFuture(f=>[ctx.getImageData(0,0,c.width,c.height),...f.slice(0,30)]);
    setHistory(h=>h.slice(0,-1));
    ctx.putImageData(prev,0,0);
  };
  const redo = () => {
    if (!future.length) return;
    const next=future[0];
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if (!c||!ctx) return;
    setHistory(h=>[...h, ctx.getImageData(0,0,c.width,c.height)]);
    setFuture(f=>f.slice(1));
    ctx.putImageData(next,0,0);
  };

  /* Canvas coords */
  const getCoords = (e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    const c=canvasRef.current; if (!c) return {x:0,y:0};
    const r=c.getBoundingClientRect();
    const sx=c.width/r.width, sy=c.height/r.height;
    let cx:number, cy:number;
    if ("touches" in e) { cx=e.touches[0]?.clientX??0; cy=e.touches[0]?.clientY??0; }
    else { cx=e.clientX; cy=e.clientY; }
    return {x:(cx-r.left)*sx, y:(cy-r.top)*sy};
  };

  /* Mouse/Touch events */
  const onStart = (e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    if (handle) return;
    if (mainTool==="crop") return;
    saveState();
    const p=getCoords(e);
    isDrawing.current=true; startPos.current=p; lastPos.current=p;

    // Place text immediately on click
    if (mainTool==="text" && textInput.trim()) {
      const c=canvasRef.current; const ctx=c?.getContext("2d");
      if (ctx&&c) {
        ctx.save();
        ctx.font=`${italic?"italic ":""}${bold?"bold ":""}${fontSz*2}px ${fontFam},sans-serif`;
        ctx.fillStyle=strokeColor; ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=5;
        ctx.globalAlpha=1;
        ctx.fillText(textInput,p.x,p.y);
        ctx.restore();
      }
    }
  };

  const onMove = (e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current||handle) return;
    const p=getCoords(e);
    const c=canvasRef.current;
    const ctx=c?.getContext("2d");
    if (!ctx||!lastPos.current||!startPos.current) return;

    if (mainTool==="pen") {
      applyPenStroke(ctx, lastPos.current.x,lastPos.current.y,p.x,p.y, penType,penSize,strokeColor,penOpacity);
      lastPos.current=p;
    } else if (mainTool==="brush") {
      applyBrushStroke(ctx, lastPos.current.x,lastPos.current.y,p.x,p.y, brushType,brushSize,strokeColor,brushOpacity);
      lastPos.current=p;
    } else if (mainTool==="erase") {
      ctx.save();
      ctx.globalCompositeOperation="destination-out";
      ctx.lineWidth=eraserSize*2;
      ctx.lineCap="round"; ctx.lineJoin="round";
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x,lastPos.current.y);
      ctx.lineTo(p.x,p.y);
      ctx.stroke();
      ctx.restore();
      lastPos.current=p;
    } else if (mainTool==="shape") {
      // Live preview on overlay canvas
      const ov=overlayRef.current; const octx=ov?.getContext("2d");
      if (octx&&ov) {
        octx.clearRect(0,0,ov.width,ov.height);
        drawShape(octx, shapeType,
          startPos.current.x,startPos.current.y,p.x,p.y,
          strokeColor, shapeFill?fillColor:null, shapeLineW);
      }
    }
  };

  const onEnd = (e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    if (isDrawing.current && startPos.current && mainTool==="shape") {
      const p=getCoords(e);
      const c=canvasRef.current; const ctx=c?.getContext("2d");
      if (ctx) {
        drawShape(ctx, shapeType,
          startPos.current.x,startPos.current.y,p.x,p.y,
          strokeColor, shapeFill?fillColor:null, shapeLineW);
      }
      // Clear overlay
      const ov=overlayRef.current; const octx=ov?.getContext("2d");
      if (octx&&ov) octx.clearRect(0,0,ov.width,ov.height);
    }
    isDrawing.current=false; lastPos.current=null; startPos.current=null;
    if (handle) setHandle(null);
  };

  /* Crop handle drag */
  const startCropHandle = (h:string, e:React.MouseEvent) => {
    e.stopPropagation();
    setHandle(h);
    dragRef.current={x:e.clientX,y:e.clientY,box:{...crop}};
  };
  const globalMouseMove = useCallback((e:MouseEvent)=>{
    if (!handle||!dragRef.current||!containerRef.current) return;
    const r=containerRef.current.getBoundingClientRect();
    const dx=((e.clientX-dragRef.current.x)/r.width)*100;
    const dy=((e.clientY-dragRef.current.y)/r.height)*100;
    const b=dragRef.current.box;
    setCrop(()=>{
      let {top,left,right,bottom}=b;
      if (handle.includes("n")) top=clamp(b.top+dy,0,80);
      if (handle.includes("s")) bottom=clamp(b.bottom-dy,0,80);
      if (handle.includes("w")) left=clamp(b.left+dx,0,80);
      if (handle.includes("e")) right=clamp(b.right-dx,0,80);
      return {top,left,right,bottom};
    });
  },[handle]);
  const globalMouseUp = useCallback(()=>{ if(handle) setHandle(null); },[handle]);
  useEffect(()=>{
    if(handle){ window.addEventListener("mousemove",globalMouseMove); window.addEventListener("mouseup",globalMouseUp); }
    return ()=>{ window.removeEventListener("mousemove",globalMouseMove); window.removeEventListener("mouseup",globalMouseUp); };
  },[handle,globalMouseMove,globalMouseUp]);

  /* Save / Export */
  const save = () => {
    const c=canvasRef.current; if (!c) return;
    const cx=(crop.left/100)*c.width, cy=(crop.top/100)*c.height;
    const cw=c.width*(1-(crop.left+crop.right)/100);
    const ch=c.height*(1-(crop.top+crop.bottom)/100);
    const out=document.createElement("canvas");
    out.width=Math.max(10,cw); out.height=Math.max(10,ch);
    out.getContext("2d")?.drawImage(c,cx,cy,cw,ch,0,0,out.width,out.height);
    out.toBlob(blob=>{
      if (!blob) return;
      onSave(new File([blob],`edited_${file.name.replace(/\.[^/.]+$/,"")}.png`,{type:"image/png"}));
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    },"image/png",0.95);
  };
  const exportPng = () => {
    const c=canvasRef.current; if (!c) return;
    const a=document.createElement("a");
    a.download=`edited_${file.name.replace(/\.[^/.]+$/,"")}.png`;
    a.href=c.toDataURL("image/png"); a.click();
  };

  /* Cursor */
  const getCursor = () => {
    if (mainTool==="pen")   return PEN_CURSOR;
    if (mainTool==="brush") return BRUSH_CURSOR;
    if (mainTool==="erase") return ERASE_CURSOR;
    if (mainTool==="text")  return TEXT_CURSOR;
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

  /* ── Tool-specific left panel content ── */
  const renderToolPanel = () => {
    const sec = (title:string, children:React.ReactNode) => (
      <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
        <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>{title}</div>
        {children}
      </div>
    );

    /* Shared color row */
    const colorRow = (
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"4px",marginBottom:"7px"}}>
        {COLORS.map(c=>(
          <button key={c} onClick={()=>{setStrokeColor(c); setActiveColorSlot("stroke");}}
            style={{aspectRatio:"1",borderRadius:"4px",background:c,cursor:"pointer",outline:"none",
                    border:strokeColor===c&&activeColorSlot==="stroke"?"2px solid #22d3ee":"1px solid rgba(255,255,255,0.15)",
                    transform:strokeColor===c&&activeColorSlot==="stroke"?"scale(1.2)":"scale(1)",transition:"all .1s"}}/>
        ))}
      </div>
    );

    const customColor = (
      <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
        <input type="color" value={strokeColor} onChange={e=>setStrokeColor(e.target.value)}
          style={{width:"28px",height:"24px",borderRadius:"5px",cursor:"pointer",padding:"1px",
                  border:"1px solid rgba(255,255,255,0.15)",background:"transparent"}}/>
        <span style={{fontSize:"9px",color:"#475569",fontFamily:"monospace"}}>{strokeColor}</span>
      </div>
    );

    if (mainTool==="pen") return (
      <>
        {sec("Pen Type", (
          <>
            {PEN_TYPES.map(({id,label,desc})=>(
              <button key={id} onClick={()=>setPenType(id)}
                style={{
                  width:"100%",display:"flex",flexDirection:"column",alignItems:"flex-start",
                  padding:"7px 9px",borderRadius:"8px",border:"none",marginBottom:"3px",cursor:"pointer",
                  background:penType===id?"linear-gradient(135deg,#1d4ed8,#7c3aed)":"rgba(255,255,255,0.03)",
                  transition:"all .15s",
                }}>
                <span style={{fontSize:"11px",fontWeight:700,color:penType===id?"#fff":"#94a3b8"}}>{label}</span>
                <span style={{fontSize:"9px",color:penType===id?"rgba(255,255,255,0.6)":"#475569"}}>{desc}</span>
              </button>
            ))}
          </>
        ))}
        {sec("Pen Size", (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{penSize}px</span>
            </div>
            <input type="range" min={1} max={30} value={penSize} onChange={e=>setPenSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#22d3ee"}}/>
          </div>
        ))}
        {sec("Opacity", (
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Opacity</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{Math.round(penOpacity*100)}%</span>
            </div>
            <input type="range" min={10} max={100} value={Math.round(penOpacity*100)}
              onChange={e=>setPenOpacity(Number(e.target.value)/100)}
              style={{width:"100%",accentColor:"#22d3ee"}}/>
          </div>
        ))}
        {sec("Pen Color",<>{colorRow}{customColor}</>)}
      </>
    );

    if (mainTool==="brush") return (
      <>
        {sec("Brush Type",(
          <>
            {BRUSH_TYPES.map(({id,label,desc})=>(
              <button key={id} onClick={()=>setBrushType(id)}
                style={{
                  width:"100%",display:"flex",flexDirection:"column",alignItems:"flex-start",
                  padding:"7px 9px",borderRadius:"8px",border:"none",marginBottom:"3px",cursor:"pointer",
                  background:brushType===id?"linear-gradient(135deg,#0d9488,#2563eb)":"rgba(255,255,255,0.03)",
                  transition:"all .15s",
                }}>
                <span style={{fontSize:"11px",fontWeight:700,color:brushType===id?"#fff":"#94a3b8"}}>{label}</span>
                <span style={{fontSize:"9px",color:brushType===id?"rgba(255,255,255,0.6)":"#475569"}}>{desc}</span>
              </button>
            ))}
          </>
        ))}
        {sec("Brush Size",(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#06b6d4",fontWeight:700}}>{brushSize}px</span>
            </div>
            <input type="range" min={2} max={80} value={brushSize} onChange={e=>setBrushSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#06b6d4"}}/>
          </>
        ))}
        {sec("Opacity",(
          <>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Opacity</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#06b6d4",fontWeight:700}}>{Math.round(brushOpacity*100)}%</span>
            </div>
            <input type="range" min={5} max={100} value={Math.round(brushOpacity*100)}
              onChange={e=>setBrushOpacity(Number(e.target.value)/100)}
              style={{width:"100%",accentColor:"#06b6d4"}}/>
          </>
        ))}
        {sec("Brush Color",<>{colorRow}{customColor}</>)}
      </>
    );

    if (mainTool==="shape") return (
      <>
        {sec("Shape Type",(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px"}}>
            {SHAPE_TYPES.map(({id,icon,label})=>(
              <button key={id} onClick={()=>setShapeType(id)}
                style={{
                  display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",
                  padding:"8px 4px",borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:600,
                  background:shapeType===id?"linear-gradient(135deg,#7c3aed,#db2777)":"rgba(255,255,255,0.04)",
                  color:shapeType===id?"#fff":"#64748b",transition:"all .15s",
                }}>
                {icon}{label}
              </button>
            ))}
          </div>
        ))}
        {sec("Stroke",(
          <>
            {colorRow}{customColor}
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Line Width</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#a855f7",fontWeight:700}}>{shapeLineW}px</span>
            </div>
            <input type="range" min={1} max={20} value={shapeLineW} onChange={e=>setShapeLineW(Number(e.target.value))}
              style={{width:"100%",accentColor:"#a855f7"}}/>
          </>
        ))}
        {sec("Fill",(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}>
              <span style={{fontSize:"10px",color:"#64748b"}}>Enable Fill</span>
              <button onClick={()=>setShapeFill(f=>!f)}
                style={{
                  width:"36px",height:"20px",borderRadius:"10px",border:"none",cursor:"pointer",
                  background:shapeFill?"linear-gradient(135deg,#7c3aed,#db2777)":"rgba(255,255,255,0.1)",
                  position:"relative",transition:"all .2s",
                }}>
                <div style={{
                  position:"absolute",top:"2px",
                  left:shapeFill?"16px":"2px",
                  width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"all .2s",
                }}/>
              </button>
            </div>
            {shapeFill&&(
              <>
                <div style={{fontSize:"9px",color:"#475569",marginBottom:"5px"}}>Fill Color</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"4px"}}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setFillColor(c+"88")}
                      style={{aspectRatio:"1",borderRadius:"4px",background:c,cursor:"pointer",outline:"none",
                              border:fillColor.startsWith(c)?"2px solid #a855f7":"1px solid rgba(255,255,255,0.15)"}}/>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </>
    );

    if (mainTool==="erase") return (
      <>
        {sec("Eraser Size",(
          <>
            {/* Visual eraser size preview */}
            <div style={{display:"flex",justifyContent:"center",marginBottom:"10px"}}>
              <div style={{
                width:`${Math.min(80,eraserSize*2)}px`,height:`${Math.min(80,eraserSize*2)}px`,
                borderRadius:"50%",border:"2px dashed #f87171",background:"rgba(248,113,113,0.08)",
                display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",
              }}>
                <Eraser size={16} color="#f87171"/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#f87171",fontWeight:700}}>{eraserSize}px</span>
            </div>
            <input type="range" min={2} max={80} value={eraserSize} onChange={e=>setEraserSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#f87171"}}/>
            <p style={{fontSize:"9px",color:"#334155",marginTop:"8px",lineHeight:1.5}}>
              Draw over areas to erase pixels. Works on drawn content and transparency.
            </p>
          </>
        ))}
      </>
    );

    if (mainTool==="text") return (
      <>
        {sec("Text Content",(
          <>
            <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
              placeholder="Type text, then click canvas to place..."
              rows={3}
              style={{width:"100%",borderRadius:"7px",padding:"7px",fontSize:"11px",color:"#e2e8f0",
                      background:"#141824",border:"1px solid rgba(255,255,255,0.08)",outline:"none",
                      resize:"none",fontFamily:"inherit",marginBottom:"6px"}}/>
            <div style={{display:"flex",gap:"5px"}}>
              <button onClick={()=>setBold(b=>!b)}
                style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:900,
                        background:bold?"linear-gradient(135deg,#2563eb,#7c3aed)":"rgba(255,255,255,0.06)",color:bold?"#fff":"#64748b"}}>
                B
              </button>
              <button onClick={()=>setItalic(i=>!i)}
                style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"12px",fontStyle:"italic",fontWeight:700,
                        background:italic?"linear-gradient(135deg,#2563eb,#7c3aed)":"rgba(255,255,255,0.06)",color:italic?"#fff":"#64748b"}}>
                I
              </button>
            </div>
          </>
        ))}
        {sec("Font",(
          <>
            <select value={fontFam} onChange={e=>setFontFam(e.target.value)}
              style={{width:"100%",background:"#141824",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"6px",
                      color:"#e2e8f0",fontSize:"11px",padding:"5px",outline:"none",cursor:"pointer",marginBottom:"6px"}}>
              {["Inter","Outfit","Roboto","Georgia","Arial","Courier New","Impact"].map(f=>(
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
              <span style={{fontSize:"9px",color:"#475569"}}>Size</span>
              <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{fontSz}px</span>
            </div>
            <input type="range" min={8} max={120} value={fontSz} onChange={e=>setFontSz(Number(e.target.value))}
              style={{width:"100%",accentColor:"#22d3ee"}}/>
          </>
        ))}
        {sec("Text Color",<>{colorRow}{customColor}</>)}
      </>
    );

    if (mainTool==="crop") return (
      <>
        {sec("Crop Region",(
          <>
            <p style={{fontSize:"10px",color:"#475569",lineHeight:1.6,marginBottom:"8px"}}>
              Drag the 8 blue handles on the canvas to define your crop region.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"6px"}}>
              {["Top","Bottom","Left","Right"].map(side=>(
                <div key={side} style={{background:"rgba(255,255,255,0.04)",borderRadius:"7px",padding:"6px 8px",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{fontSize:"9px",color:"#475569",marginBottom:"2px"}}>{side}</div>
                  <div style={{fontSize:"11px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>
                    {Math.round(crop[side.toLowerCase() as keyof typeof crop])}%
                  </div>
                </div>
              ))}
            </div>
            <button onClick={()=>setCrop({top:0,left:0,right:0,bottom:0})}
              style={{width:"100%",padding:"7px",borderRadius:"7px",cursor:"pointer",
                      background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
                      color:"#64748b",fontSize:"11px",fontWeight:600}}>
              Reset Crop
            </button>
          </>
        ))}
      </>
    );

    return null;
  };

  /* ── Minimized bubble ── */
  if (!maximized) {
    return (
      <div style={{
        position:"fixed",bottom:"24px",right:"24px",zIndex:9999,
        background:"linear-gradient(135deg,#1e293b,#0f172a)",
        border:"1px solid rgba(99,102,241,0.4)",borderRadius:"16px",
        boxShadow:"0 8px 40px rgba(0,0,0,0.8)",padding:"12px 16px",
        display:"flex",alignItems:"center",gap:"10px",fontFamily:"'Inter',sans-serif",
      }}>
        <div style={{width:"32px",height:"32px",borderRadius:"8px",background:"linear-gradient(135deg,#22d3ee,#6366f1)",
                     display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Zap size={16} color="#fff" fill="#fff"/>
        </div>
        <div>
          <div style={{fontSize:"12px",fontWeight:700,color:"#fff",fontFamily:"'Outfit',sans-serif"}}>Canvas Studio</div>
          <div style={{fontSize:"9px",color:"#64748b"}}>Minimized — editing paused</div>
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
  }

  /* ═══════════════════════════════════════════════════════════════
     FULL SCREEN RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      position:"fixed",top:0,left:0,width:"100vw",height:"100vh",
      zIndex:9999,display:"flex",flexDirection:"column",overflow:"hidden",
      background:"#07090e",color:"#e2e8f0",fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div style={{
        flexShrink:0,height:"48px",background:"#0c0f18",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
        display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 12px",gap:"8px",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:"8px",minWidth:0}}>
          <div style={{width:"26px",height:"26px",borderRadius:"7px",flexShrink:0,
                       background:"linear-gradient(135deg,#22d3ee,#6366f1)",
                       display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Zap size={13} color="#fff" fill="#fff"/>
          </div>
          <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"14px",color:"#fff",whiteSpace:"nowrap"}}>
            File<span style={{color:"#22d3ee"}}>Forge</span>
          </span>
          <span style={{color:"#1e293b"}}>›</span>
          <span style={{fontSize:"11px",color:"#475569",whiteSpace:"nowrap"}}>Canvas Studio</span>
          <div style={{padding:"2px 8px",borderRadius:"20px",fontSize:"9px",fontWeight:700,whiteSpace:"nowrap",
                       background:"linear-gradient(135deg,rgba(99,102,241,0.25),rgba(34,211,238,0.15))",
                       border:"1px solid rgba(99,102,241,0.3)",color:"#a5b4fc"}}>PRO</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
          <button onClick={undo} disabled={!history.length}
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"7px",
                    background:history.length?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",
                    border:"1px solid rgba(255,255,255,0.08)",
                    color:history.length?"#94a3b8":"#334155",cursor:history.length?"pointer":"default",fontSize:"11px",fontWeight:600}}>
            <Undo2 size={12}/> Undo
          </button>
          <button onClick={redo} disabled={!future.length}
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"7px",
                    background:future.length?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",
                    border:"1px solid rgba(255,255,255,0.08)",
                    color:future.length?"#94a3b8":"#334155",cursor:future.length?"pointer":"default",fontSize:"11px",fontWeight:600}}>
            <Redo2 size={12}/> Redo
          </button>
          <button onClick={exportPng}
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"7px",
                    background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.08)",
                    color:"#94a3b8",cursor:"pointer",fontSize:"11px",fontWeight:600}}>
            <Download size={12}/> Export PNG
          </button>
          <button onClick={save}
            style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 14px",borderRadius:"7px",border:"none",
                    color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:700,
                    background:saved?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#2563eb,#7c3aed)",
                    boxShadow:saved?"0 0 14px rgba(22,163,74,0.4)":"0 0 14px rgba(99,102,241,0.35)",transition:"all .3s"}}>
            {saved?<><Star size={11} fill="#fff"/> Saved!</>:<><Check size={11}/> Save Changes</>}
          </button>
          <button onClick={()=>setMaximized(false)} title="Minimize"
            style={{padding:"5px",borderRadius:"7px",background:"rgba(255,255,255,0.05)",
                    border:"1px solid rgba(255,255,255,0.08)",color:"#64748b",cursor:"pointer",display:"flex"}}>
            <Minimize2 size={14}/>
          </button>
          <button onClick={onCancel}
            style={{padding:"5px",borderRadius:"7px",background:"rgba(239,68,68,0.1)",
                    border:"1px solid rgba(239,68,68,0.2)",color:"#f87171",cursor:"pointer",display:"flex"}}>
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* ══ BODY ═════════════════════════════════════════════════ */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* ── LEFT: Tool selector + tool options ── */}
        <div style={{
          flexShrink:0,width:"185px",background:"#0c0f18",
          borderRight:"1px solid rgba(255,255,255,0.07)",
          display:"flex",flexDirection:"column",overflow:"hidden",
        }} className="ff-sidebar-l">

          {/* Tool tabs */}
          <div style={{flexShrink:0,padding:"8px 8px 0",display:"flex",flexDirection:"column",gap:"2px"}}>
            {([
              {id:"pen",    icon:<Pencil     size={14}/>, label:"Pen",    color:"#3b82f6"},
              {id:"brush",  icon:<Paintbrush  size={14}/>, label:"Brush",  color:"#06b6d4"},
              {id:"shape",  icon:<Square      size={14}/>, label:"Shapes", color:"#a855f7"},
              {id:"erase",  icon:<Eraser      size={14}/>, label:"Eraser", color:"#ef4444"},
              {id:"text",   icon:<Type        size={14}/>, label:"Text",   color:"#eab308"},
              {id:"crop",   icon:<Crop        size={14}/>, label:"Crop",   color:"#f97316"},
            ] as {id:MainTool;icon:React.ReactNode;label:string;color:string}[]).map(({id,icon,label,color})=>(
              <button key={id} onClick={()=>setMainTool(id)}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"8px 9px",
                  borderRadius:"8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:600,
                  textAlign:"left",transition:"all .15s",
                  background:mainTool===id?`${color}22`:"rgba(255,255,255,0.02)",
                  borderLeft:mainTool===id?`3px solid ${color}`:"3px solid transparent",
                  color:mainTool===id?color:"#64748b",
                }}>
                <span style={{color}}>{icon}</span>
                {label}
                {mainTool===id&&<ChevronRight size={10} style={{marginLeft:"auto"}} color={color}/>}
              </button>
            ))}
          </div>

          <div style={{height:"1px",background:"rgba(255,255,255,0.05)",margin:"6px 8px"}}/>

          {/* Tool-specific options — scrollable */}
          <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
            {renderToolPanel()}
          </div>

          {/* Zoom at bottom */}
          <div style={{flexShrink:0,padding:"8px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(0,0,0,0.4)",borderRadius:"7px",padding:"2px"}}>
              <button onClick={()=>setZoom(z=>Math.max(0.2,z-0.1))}
                style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",padding:"4px",display:"flex"}}>
                <ZoomOut size={12}/>
              </button>
              <span style={{flex:1,textAlign:"center",fontSize:"10px",fontFamily:"monospace",fontWeight:700,color:"#22d3ee"}}>
                {Math.round(zoom*100)}%
              </span>
              <button onClick={()=>setZoom(z=>Math.min(5,z+0.1))}
                style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",padding:"4px",display:"flex"}}>
                <ZoomIn size={12}/>
              </button>
              <button onClick={()=>setZoom(1)} title="Fit"
                style={{background:"none",border:"none",color:"#475569",cursor:"pointer",padding:"4px",display:"flex"}}>
                <Maximize2 size={10}/>
              </button>
            </div>
          </div>
        </div>

        {/* ── CANVAS CENTER ── */}
        <div ref={containerRef}
          style={{
            flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
            overflow:"hidden",minWidth:0,minHeight:0,
            backgroundImage:"linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
            backgroundSize:"20px 20px",backgroundColor:"#080a10",
          }}>

          {/* Zoom wrapper */}
          <div style={{
            position:"relative",display:"inline-block",
            transform:`scale(${zoom})`,transformOrigin:"center center",
            transition:"transform .12s",userSelect:"none",
          }}>
            {/* Base canvas */}
            <canvas ref={canvasRef}
              onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
              onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
              style={{
                display:"block",borderRadius:"5px",
                border:"1px solid rgba(255,255,255,0.1)",
                boxShadow:"0 0 50px rgba(0,0,0,0.9)",
                cursor:getCursor(),maxWidth:"100%",maxHeight:"calc(100vh - 180px)",touchAction:"none",
              }}/>

            {/* Overlay canvas for live shape preview */}
            <canvas ref={overlayRef}
              style={{
                position:"absolute",top:0,left:0,
                pointerEvents:"none",borderRadius:"5px",
                maxWidth:"100%",maxHeight:"calc(100vh - 180px)",
              }}/>

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
            background:"rgba(7,9,14,0.85)",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:"#334155",pointerEvents:"none",
          }}>
            <Sparkles size={9} color="#a855f7"/>
            <span style={{color:"#a855f7",fontWeight:700}}>Canvas Studio Pro</span>
            <span style={{color:"#1e293b"}}>·</span>
            <span style={{color:"#475569",textTransform:"capitalize"}}>{mainTool}</span>
            <span style={{color:"#1e293b"}}>·</span>
            <span>{Math.round(zoom*100)}%</span>
          </div>

          {/* History / undo counter */}
          <div style={{
            position:"absolute",bottom:"8px",right:"8px",display:"flex",alignItems:"center",gap:"6px",
            background:"rgba(7,9,14,0.85)",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:"#334155",pointerEvents:"none",
          }}>
            <Layers size={9} color="#a855f7"/>
            <div style={{width:"55px",height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.06)"}}>
              <div style={{height:"100%",borderRadius:"2px",
                           background:"linear-gradient(90deg,#22d3ee,#a855f7)",
                           width:`${(history.length/30)*100}%`,transition:"width .3s"}}/>
            </div>
            <span>{history.length}/30</span>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: Adjustments ── */}
        <div style={{
          flexShrink:0,width:"185px",background:"#0c0f18",
          borderLeft:"1px solid rgba(255,255,255,0.07)",
          display:"flex",flexDirection:"column",overflow:"hidden",
        }} className="ff-sidebar-r">

          {/* Right tabs */}
          <div style={{flexShrink:0,display:"flex",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
            {([["adjust","Adjust"],["crop","Transform"],["info","Info"]] as [typeof rightTab,string][]).map(([tab,lbl])=>(
              <button key={tab} onClick={()=>setRightTab(tab)}
                style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:600,
                        background:rightTab===tab?"rgba(99,102,241,0.1)":"transparent",
                        borderBottom:rightTab===tab?"2px solid #6366f1":"2px solid transparent",
                        color:rightTab===tab?"#a5b4fc":"#475569"}}>
                {lbl}
              </button>
            ))}
          </div>

          <div style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
            {rightTab==="adjust"&&(
              <>
                {[
                  {label:"Brightness",icon:<Sun size={10} color="#fbbf24"/>,val:brightness,set:setBrightness,ac:"#fbbf24"},
                  {label:"Contrast",  icon:<ContrastIcon size={10} color="#60a5fa"/>,val:contrast,set:setContrast,ac:"#60a5fa"},
                  {label:"Saturation",icon:<Droplets size={10} color="#f472b6"/>,val:saturation,set:setSaturation,ac:"#f472b6"},
                ].map(({label,icon,val,set,ac})=>(
                  <div key={label} style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                      <span style={{fontSize:"10px",color:"#475569",display:"flex",alignItems:"center",gap:"4px",fontWeight:600}}>{icon}{label}</span>
                      <span style={{fontSize:"10px",fontFamily:"monospace",fontWeight:700,color:ac}}>{val>0?`+${val}`:val}</span>
                    </div>
                    <input type="range" min={-100} max={100} value={val}
                      onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:ac,cursor:"pointer"}}/>
                  </div>
                ))}
                <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <div style={{fontSize:"10px",color:"#475569",fontWeight:600,marginBottom:"5px",display:"flex",alignItems:"center",gap:"4px"}}>
                    <Sparkles size={10} color="#a855f7"/> Filter Preset
                  </div>
                  <select value={filter} onChange={e=>setFilter(e.target.value as FilterPr)}
                    style={{width:"100%",background:"#141824",border:"1px solid rgba(255,255,255,0.08)",
                            borderRadius:"6px",color:"#e2e8f0",fontSize:"11px",padding:"4px 6px",outline:"none",cursor:"pointer"}}>
                    {FILTERS.map(({value,label})=><option key={value} value={value}>{label}</option>)}
                  </select>
                </div>
              </>
            )}

            {rightTab==="crop"&&(
              <>
                <div style={{padding:"8px 10px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>Rotate & Flip</div>
                  <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                    <button onClick={()=>setRotation(r=>(r+90)%360)}
                      style={{flex:"1 1 60px",display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",
                              padding:"6px 4px",borderRadius:"6px",border:"1px solid rgba(255,255,255,0.08)",
                              background:"rgba(255,255,255,0.04)",color:"#94a3b8",cursor:"pointer",fontSize:"10px",fontWeight:600}}>
                      <RotateCw size={11} color="#22d3ee"/> 90°
                    </button>
                    <button onClick={()=>setFlipH(f=>!f)}
                      style={{flex:"1",padding:"6px",borderRadius:"6px",cursor:"pointer",
                              border:flipH?"1px solid rgba(34,211,238,0.4)":"1px solid rgba(255,255,255,0.08)",
                              background:flipH?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",
                              color:flipH?"#22d3ee":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <FlipHorizontal size={12}/>
                    </button>
                    <button onClick={()=>setFlipV(f=>!f)}
                      style={{flex:"1",padding:"6px",borderRadius:"6px",cursor:"pointer",
                              border:flipV?"1px solid rgba(34,211,238,0.4)":"1px solid rgba(255,255,255,0.08)",
                              background:flipV?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",
                              color:flipV?"#22d3ee":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <FlipVertical size={12}/>
                    </button>
                  </div>
                </div>
                <div style={{padding:"8px 10px"}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>Crop</div>
                  <p style={{fontSize:"9px",color:"#334155",lineHeight:1.5,marginBottom:"8px"}}>
                    Switch to the Crop tool in the left sidebar to drag handles on canvas.
                  </p>
                  <button onClick={()=>{ setMainTool("crop"); setCrop({top:0,left:0,right:0,bottom:0}); }}
                    style={{width:"100%",padding:"7px",borderRadius:"7px",cursor:"pointer",
                            background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",
                            color:"#64748b",fontSize:"11px",fontWeight:600}}>
                    Reset Crop
                  </button>
                </div>
              </>
            )}

            {rightTab==="info"&&(
              <div style={{padding:"10px"}}>
                {[
                  {label:"File Name",val:file.name},
                  {label:"File Size",val:`${(file.size/1024).toFixed(1)} KB`},
                  {label:"File Type",val:file.type||"unknown"},
                  {label:"Undo Steps",val:`${history.length}/30`},
                  {label:"Redo Steps",val:`${future.length} available`},
                  {label:"Zoom",val:`${Math.round(zoom*100)}%`},
                  {label:"Rotation",val:`${rotation}°`},
                  {label:"Filter",val:filter},
                ].map(({label,val})=>(
                  <div key={label} style={{marginBottom:"8px"}}>
                    <div style={{fontSize:"9px",color:"#334155",fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"2px"}}>{label}</div>
                    <div style={{fontSize:"11px",color:"#94a3b8",fontFamily:"monospace",wordBreak:"break-all"}}>{val}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium badge */}
          <div style={{flexShrink:0,padding:"10px"}}>
            <div style={{borderRadius:"9px",padding:"9px",textAlign:"center",
                         background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)"}}>
              <Sparkles size={12} color="#a855f7" style={{margin:"0 auto 3px"}}/>
              <div style={{fontSize:"9px",color:"#a855f7",fontWeight:700}}>Canvas Studio Pro</div>
              <div style={{fontSize:"8px",color:"#1e293b",marginTop:"2px"}}>Undo/Redo · Shapes · Text · Filters</div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM BAR */}
      <div className="ff-mobile-bar" style={{
        flexShrink:0,display:"none",
        borderTop:"1px solid rgba(255,255,255,0.07)",background:"#0c0f18",
      }}>
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          {(["tools","adjust","text"] as const).map(t=>(
            <button key={t} onClick={()=>setMTab(t)}
              style={{flex:1,padding:"9px 4px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:700,
                      background:mTab===t?"rgba(99,102,241,0.1)":"transparent",
                      borderBottom:mTab===t?"2px solid #6366f1":"2px solid transparent",
                      color:mTab===t?"#a5b4fc":"#475569",textTransform:"capitalize"}}>
              {t==="tools"?"🖊 Tools":t==="adjust"?"🎨 Adjust":"✏️ Text"}
            </button>
          ))}
        </div>
        <div style={{padding:"8px 10px",maxHeight:"220px",overflowY:"auto"}}>
          {mTab==="tools"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"4px"}}>
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
                            background:mainTool===id?`${c}22`:"rgba(255,255,255,0.04)",
                            color:mainTool===id?c:"#64748b",
                            borderLeft:mainTool===id?`2px solid ${c}`:"2px solid transparent"}}>
                    <span style={{color:c}}>{icon}</span>{label}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>setStrokeColor(c)}
                    style={{width:"22px",height:"22px",borderRadius:"5px",background:c,cursor:"pointer",outline:"none",
                            border:strokeColor===c?"2px solid #22d3ee":"1px solid rgba(255,255,255,0.15)"}}/>
                ))}
              </div>
            </div>
          )}
          {mTab==="adjust"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {[
                {label:"Brightness",val:brightness,set:setBrightness,ac:"#fbbf24"},
                {label:"Contrast",val:contrast,set:setContrast,ac:"#60a5fa"},
                {label:"Saturation",val:saturation,set:setSaturation,ac:"#f472b6"},
              ].map(({label,val,set,ac})=>(
                <div key={label}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                    <span style={{fontSize:"10px",color:"#64748b",fontWeight:600}}>{label}</span>
                    <span style={{fontSize:"10px",fontFamily:"monospace",color:ac,fontWeight:700}}>{val>0?`+${val}`:val}</span>
                  </div>
                  <input type="range" min={-100} max={100} value={val}
                    onChange={e=>set(Number(e.target.value))} style={{width:"100%",accentColor:ac}}/>
                </div>
              ))}
              <select value={filter} onChange={e=>setFilter(e.target.value as FilterPr)}
                style={{width:"100%",background:"#141824",border:"1px solid rgba(255,255,255,0.08)",
                        borderRadius:"6px",color:"#e2e8f0",fontSize:"11px",padding:"5px",outline:"none"}}>
                {FILTERS.map(({value,label})=><option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          )}
          {mTab==="text"&&(
            <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
              <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
                placeholder="Type text then click canvas..."
                rows={2} onClick={()=>setMainTool("text")}
                style={{width:"100%",borderRadius:"6px",padding:"6px",fontSize:"11px",color:"#e2e8f0",
                        background:"#141824",border:"1px solid rgba(255,255,255,0.07)",outline:"none",resize:"none"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"4px"}}>
                <select value={fontFam} onChange={e=>setFontFam(e.target.value)}
                  style={{background:"#141824",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",color:"#e2e8f0",fontSize:"10px",padding:"4px",outline:"none"}}>
                  {["Inter","Outfit","Roboto"].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
                <select value={fontSz} onChange={e=>setFontSz(Number(e.target.value))}
                  style={{background:"#141824",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",color:"#e2e8f0",fontSize:"10px",padding:"4px",outline:"none"}}>
                  {[16,24,32,48,64].map(s=><option key={s} value={s}>{s}px</option>)}
                </select>
                <div style={{display:"flex",gap:"3px"}}>
                  <button onClick={()=>setBold(b=>!b)}
                    style={{flex:1,borderRadius:"5px",border:"none",cursor:"pointer",fontWeight:900,
                            background:bold?"#2563eb":"rgba(255,255,255,0.06)",color:bold?"#fff":"#64748b",fontSize:"12px"}}>B</button>
                  <button onClick={()=>setItalic(i=>!i)}
                    style={{flex:1,borderRadius:"5px",border:"none",cursor:"pointer",fontStyle:"italic",fontWeight:700,
                            background:italic?"#2563eb":"rgba(255,255,255,0.06)",color:italic?"#fff":"#64748b",fontSize:"12px"}}>I</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .ff-sidebar-l, .ff-sidebar-r { display: none !important; }
          .ff-mobile-bar { display: flex !important; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}

/* ─── Portal wrapper ──────────────────────────────────────────── */
export default function CanvasEditor(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(<CanvasEditorInner {...props} />, document.body);
}
