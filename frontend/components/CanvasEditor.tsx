"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  RotateCw, Pencil, Paintbrush, Eraser, X, Zap, Sun,
  Contrast as ContrastIcon, Undo2, FlipHorizontal, FlipVertical,
  ZoomIn, ZoomOut, Maximize2, Sparkles, Square, Circle, Type,
  Download, Check, Crop, Star, Droplets, Layers,
} from "lucide-react";

/* ─── types ─────────────────────────────────────────────────────── */
type Tool     = "pen" | "brush" | "erase" | "rect" | "circle";
type FilterPr = "none"|"grayscale"|"sepia"|"invert"|"warm"|"cool"|"vivid";

interface Props { file: File; onSave: (f: File) => void; onCancel: () => void; }

/* ─── constants ─────────────────────────────────────────────────── */
const COLORS = ["#3b82f6","#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#a855f7","#ec4899","#ffffff","#000000"];
const FILTERS: {value: FilterPr; label: string}[] = [
  {value:"none",label:"Original"},{value:"grayscale",label:"Grayscale"},
  {value:"sepia",label:"Sepia"},{value:"warm",label:"Warm Film"},
  {value:"cool",label:"Cool Breeze"},{value:"vivid",label:"Vivid"},
  {value:"invert",label:"Invert"},
];
const TOOLS: {id: Tool; icon: React.ReactNode; label: string}[] = [
  {id:"pen",    icon:<Pencil    size={15}/>, label:"Pen"},
  {id:"brush",  icon:<Paintbrush size={15}/>,label:"Brush"},
  {id:"rect",   icon:<Square   size={15}/>, label:"Box"},
  {id:"circle", icon:<Circle   size={15}/>, label:"Circle"},
  {id:"erase",  icon:<Eraser   size={15}/>, label:"Erase"},
];

/* ─── helpers ───────────────────────────────────────────────────── */
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/* ════════════════════════════════════════════════════════════════ */
export default function CanvasEditor({ file, onSave, onCancel }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [img,        setImg]        = useState<HTMLImageElement | null>(null);
  const [tool,       setTool]       = useState<Tool>("pen");
  const [color,      setColor]      = useState("#3b82f6");
  const [brushSize,  setBrushSize]  = useState(6);
  const [brightness, setBrightness] = useState(0);
  const [contrast,   setContrast]   = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [rotation,   setRotation]   = useState(0);
  const [flipH,      setFlipH]      = useState(false);
  const [flipV,      setFlipV]      = useState(false);
  const [zoom,       setZoom]       = useState(1);
  const [filter,     setFilter]     = useState<FilterPr>("none");
  const [crop,       setCrop]       = useState({top:0,left:0,right:0,bottom:0});
  const [handle,     setHandle]     = useState<string|null>(null);
  const dragRef      = useRef<{x:number;y:number;box:typeof crop}|null>(null);
  const [caption,    setCaption]    = useState("");
  const [fontFam,    setFontFam]    = useState("Inter");
  const [fontSz,     setFontSz]     = useState(24);
  const [history,    setHistory]    = useState<ImageData[]>([]);
  const [saved,      setSaved]      = useState(false);

  /* mobile bottom tab: "draw" | "adjust" | "text" */
  const [mTab, setMTab] = useState<"draw"|"adjust"|"text">("draw");

  const isDrawing = useRef(false);
  const startPos  = useRef<{x:number;y:number}|null>(null);
  const lastPos   = useRef<{x:number;y:number}|null>(null);

  /* ── Lock body scroll ──────────────────────────────────────── */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* ── Load image ─────────────────────────────────────────────── */
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i   = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => setImg(i);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /* ── Redraw ─────────────────────────────────────────────────── */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width  = img.naturalWidth  || 800;
    canvas.height = img.naturalHeight || 600;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let f = `brightness(${100+brightness}%) contrast(${100+contrast}%) saturate(${100+saturation}%)`;
    if (filter==="grayscale") f+=" grayscale(100%)";
    if (filter==="sepia")     f+=" sepia(80%)";
    if (filter==="invert")    f+=" invert(100%)";
    if (filter==="warm")      f+=" sepia(30%) hue-rotate(-10deg)";
    if (filter==="cool")      f+=" hue-rotate(180deg) saturate(150%)";
    if (filter==="vivid")     f+=" saturate(200%) contrast(110%)";
    ctx.filter = f;
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate((rotation*Math.PI)/180);
    ctx.scale(flipH?-1:1, flipV?-1:1);
    ctx.drawImage(img, -canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
    ctx.restore();
  }, [img, brightness, contrast, saturation, rotation, flipH, flipV, filter]);

  useEffect(() => { redraw(); }, [redraw]);

  /* ── History ────────────────────────────────────────────────── */
  const saveState = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c||!ctx) return;
    setHistory(h=>[...h.slice(-20), ctx.getImageData(0,0,c.width,c.height)]);
  };
  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length-1];
    setHistory(h=>h.slice(0,-1));
    canvasRef.current?.getContext("2d")?.putImageData(prev,0,0);
  };

  /* ── Canvas coords ──────────────────────────────────────────── */
  const coords = (e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return {x:0,y:0};
    const r  = c.getBoundingClientRect();
    const sx = c.width/r.width, sy = c.height/r.height;
    let cx:number, cy:number;
    if ("touches" in e) { cx=e.touches[0]?.clientX??0; cy=e.touches[0]?.clientY??0; }
    else { cx=e.clientX; cy=e.clientY; }
    return {x:(cx-r.left)*sx, y:(cy-r.top)*sy};
  };

  /* ── Draw events ─────────────────────────────────────────────── */
  const onStart = (e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    if (handle) return;
    saveState();
    const p = coords(e);
    isDrawing.current=true; startPos.current=p; lastPos.current=p;
  };
  const onMove = (e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current||handle) return;
    const p = coords(e);
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx||!lastPos.current) return;
    if (["pen","brush","erase"].includes(tool)) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(p.x, p.y);
      if (tool==="erase") {
        ctx.globalCompositeOperation="destination-out";
        ctx.lineWidth=brushSize*5;
      } else {
        ctx.globalCompositeOperation="source-over";
        ctx.strokeStyle=color;
        ctx.lineWidth=tool==="brush"?brushSize*3:brushSize;
      }
      ctx.lineCap="round"; ctx.lineJoin="round"; ctx.stroke(); ctx.restore();
      lastPos.current=p;
    }
  };
  const onEnd = (e: React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>) => {
    if (isDrawing.current && startPos.current && ["rect","circle"].includes(tool)) {
      const p = coords(e);
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (ctx) {
        ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=brushSize; ctx.lineJoin="round";
        const w=p.x-startPos.current.x, h=p.y-startPos.current.y;
        if (tool==="rect") { ctx.strokeRect(startPos.current.x,startPos.current.y,w,h); }
        else {
          const r=Math.sqrt(w*w+h*h)/2;
          ctx.beginPath();
          ctx.arc(startPos.current.x+w/2,startPos.current.y+h/2,r,0,2*Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    isDrawing.current=false; lastPos.current=null; startPos.current=null;
    if (handle) setHandle(null);
  };

  /* ── Crop drag ───────────────────────────────────────────────── */
  const startCrop = (h: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHandle(h);
    dragRef.current={x:e.clientX,y:e.clientY,box:{...crop}};
  };
  const globalMove = useCallback((e:MouseEvent)=>{
    if (!handle||!dragRef.current||!containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
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
  const globalUp = useCallback(()=>{ if (handle) setHandle(null); },[handle]);
  useEffect(()=>{
    if (handle) { window.addEventListener("mousemove",globalMove); window.addEventListener("mouseup",globalUp); }
    return ()=>{ window.removeEventListener("mousemove",globalMove); window.removeEventListener("mouseup",globalUp); };
  },[handle,globalMove,globalUp]);

  /* ── Add text ───────────────────────────────────────────────── */
  const addText = () => {
    if (!caption.trim()) return;
    saveState();
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if (!ctx||!c) return;
    ctx.save();
    ctx.font=`bold ${fontSz*2}px ${fontFam},sans-serif`;
    ctx.fillStyle=color; ctx.shadowColor="rgba(0,0,0,0.9)"; ctx.shadowBlur=8;
    ctx.textAlign="center"; ctx.fillText(caption,c.width/2,c.height/2); ctx.restore();
    setCaption("");
  };

  /* ── Save / Export ───────────────────────────────────────────── */
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

  /* ── Crop handles ─────────────────────────────────────────────── */
  const HANDLES=[
    {h:"nw",top:`calc(${crop.top}% - 7px)`,left:`calc(${crop.left}% - 7px)`,cursor:"nwse-resize"},
    {h:"n", top:`calc(${crop.top}% - 7px)`,left:"calc(50% - 7px)",cursor:"ns-resize"},
    {h:"ne",top:`calc(${crop.top}% - 7px)`,right:`calc(${crop.right}% - 7px)`,cursor:"nesw-resize"},
    {h:"w", top:"calc(50% - 7px)",left:`calc(${crop.left}% - 7px)`,cursor:"ew-resize"},
    {h:"e", top:"calc(50% - 7px)",right:`calc(${crop.right}% - 7px)`,cursor:"ew-resize"},
    {h:"sw",bottom:`calc(${crop.bottom}% - 7px)`,left:`calc(${crop.left}% - 7px)`,cursor:"nesw-resize"},
    {h:"s", bottom:`calc(${crop.bottom}% - 7px)`,left:"calc(50% - 7px)",cursor:"ns-resize"},
    {h:"se",bottom:`calc(${crop.bottom}% - 7px)`,right:`calc(${crop.right}% - 7px)`,cursor:"nwse-resize"},
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0,
      zIndex:9999, display:"flex", flexDirection:"column",
      width:"100%", height:"100%", overflow:"hidden",
      background:"#07090e", color:"#e2e8f0",
      fontFamily:"'Inter',system-ui,sans-serif",
    }}>

      {/* ══ HEADER (48px) ════════════════════════════════════════ */}
      <div style={{
        flexShrink:0, height:"48px",
        background:"#0c0f18", borderBottom:"1px solid rgba(255,255,255,0.07)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 12px", gap:"8px",
      }}>
        {/* Brand */}
        <div style={{display:"flex",alignItems:"center",gap:"8px",minWidth:0,flex:"0 0 auto"}}>
          <div style={{
            width:"28px",height:"28px",borderRadius:"7px",flexShrink:0,
            background:"linear-gradient(135deg,#22d3ee,#6366f1)",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <Zap size={14} color="#fff" fill="#fff"/>
          </div>
          <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"14px",color:"#fff",whiteSpace:"nowrap"}}>
            File<span style={{color:"#22d3ee"}}>Forge</span>
          </span>
          <span style={{color:"#1e293b",fontSize:"12px"}}>›</span>
          <span style={{fontSize:"11px",color:"#475569",whiteSpace:"nowrap"}}>Canvas Studio</span>
          <div style={{
            padding:"2px 8px",borderRadius:"20px",fontSize:"9px",fontWeight:700,
            background:"linear-gradient(135deg,rgba(99,102,241,0.25),rgba(34,211,238,0.15))",
            border:"1px solid rgba(99,102,241,0.3)",color:"#a5b4fc",
            whiteSpace:"nowrap",
          }}>PREMIUM</div>
        </div>

        {/* Actions */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",flexShrink:0}}>
          {/* Undo */}
          <button onClick={undo} disabled={!history.length}
            style={{
              display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",
              borderRadius:"7px",background:history.length?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",
              border:"1px solid rgba(255,255,255,0.08)",
              color:history.length?"#94a3b8":"#334155",
              cursor:history.length?"pointer":"default",fontSize:"11px",fontWeight:600,
            }}>
            <Undo2 size={12}/> <span>Undo</span>
          </button>

          {/* Export */}
          <button onClick={exportPng}
            style={{
              display:"flex",alignItems:"center",gap:"4px",padding:"5px 10px",
              borderRadius:"7px",background:"rgba(255,255,255,0.06)",
              border:"1px solid rgba(255,255,255,0.08)",
              color:"#94a3b8",cursor:"pointer",fontSize:"11px",fontWeight:600,
            }}>
            <Download size={12}/> <span>Export PNG</span>
          </button>

          {/* Save */}
          <button onClick={save}
            style={{
              display:"flex",alignItems:"center",gap:"5px",padding:"6px 16px",
              borderRadius:"7px",border:"none",color:"#fff",cursor:"pointer",
              fontSize:"12px",fontWeight:700,
              background:saved
                ?"linear-gradient(135deg,#16a34a,#15803d)"
                :"linear-gradient(135deg,#2563eb,#7c3aed)",
              boxShadow:saved?"0 0 16px rgba(22,163,74,0.4)":"0 0 16px rgba(99,102,241,0.4)",
              transition:"all .3s",
            }}>
            {saved?<><Star size={12} fill="#fff"/> Saved!</>:<><Check size={12}/> Save Changes</>}
          </button>

          {/* Close */}
          <button onClick={onCancel} title="Close"
            style={{
              padding:"6px",borderRadius:"7px",cursor:"pointer",
              background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#f87171",
            }}>
            <X size={15}/>
          </button>
        </div>
      </div>

      {/* ══ BODY (fills remaining height) ════════════════════════ */}
      <div style={{
        flex:1, display:"flex", overflow:"hidden", minHeight:0,
      }}>

        {/* ── LEFT SIDEBAR (desktop only) ─────────────────────── */}
        <div style={{
          flexShrink:0, width:"180px",
          background:"#0c0f18", borderRight:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column", gap:"0",
          overflowY:"auto", overflowX:"hidden",
          /* Hide on mobile */
        }} className="canvas-sidebar-left">

          {/* Tools group */}
          <div style={{padding:"10px 10px 6px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"6px"}}>
              Drawing Tools
            </div>
            {TOOLS.map(({id,icon,label})=>(
              <button key={id} onClick={()=>setTool(id)}
                style={{
                  width:"100%",display:"flex",alignItems:"center",gap:"8px",
                  padding:"8px 10px",borderRadius:"8px",border:"none",marginBottom:"3px",
                  background:tool===id?"linear-gradient(135deg,#1d4ed8,#7c3aed)":"rgba(255,255,255,0.03)",
                  color:tool===id?"#fff":"#64748b",cursor:"pointer",
                  fontSize:"12px",fontWeight:600,textAlign:"left",
                  transition:"all .15s",
                  boxShadow:tool===id?"0 2px 12px rgba(99,102,241,0.35)":"none",
                }}>
                {icon} {label}
              </button>
            ))}
          </div>

          <div style={{height:"1px",background:"rgba(255,255,255,0.05)",margin:"4px 10px"}}/>

          {/* Color section */}
          <div style={{padding:"8px 10px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"8px"}}>
              Color
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"5px",marginBottom:"8px"}}>
              {COLORS.map(c=>(
                <button key={c} onClick={()=>setColor(c)}
                  style={{
                    width:"100%",aspectRatio:"1",borderRadius:"6px",
                    background:c,cursor:"pointer",
                    border:color===c?"2px solid #22d3ee":"1px solid rgba(255,255,255,0.15)",
                    transform:color===c?"scale(1.15)":"scale(1)",
                    transition:"all .1s",outline:"none",
                  }}/>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                style={{width:"32px",height:"28px",borderRadius:"6px",cursor:"pointer",
                        border:"1px solid rgba(255,255,255,0.15)",background:"transparent",padding:"1px"}}/>
              <span style={{fontSize:"10px",color:"#475569",fontFamily:"monospace"}}>{color}</span>
            </div>
          </div>

          <div style={{height:"1px",background:"rgba(255,255,255,0.05)",margin:"4px 10px"}}/>

          {/* Brush size */}
          <div style={{padding:"8px 10px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
              <span style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase"}}>Brush Size</span>
              <span style={{fontSize:"11px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{brushSize}</span>
            </div>
            <input type="range" min={1} max={40} value={brushSize}
              onChange={e=>setBrushSize(Number(e.target.value))}
              style={{width:"100%",accentColor:"#22d3ee",cursor:"pointer"}}/>
          </div>

          <div style={{height:"1px",background:"rgba(255,255,255,0.05)",margin:"4px 10px"}}/>

          {/* Rotate / Flip */}
          <div style={{padding:"8px 10px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"6px"}}>
              Transform
            </div>
            <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
              <button onClick={()=>setRotation(r=>(r+90)%360)}
                style={{flex:"1",minWidth:"60px",display:"flex",alignItems:"center",justifyContent:"center",gap:"4px",
                        padding:"6px 4px",borderRadius:"7px",border:"1px solid rgba(255,255,255,0.08)",
                        background:"rgba(255,255,255,0.04)",color:"#94a3b8",cursor:"pointer",fontSize:"10px",fontWeight:600}}>
                <RotateCw size={11} color="#22d3ee"/> 90°
              </button>
              <button onClick={()=>setFlipH(f=>!f)}
                style={{flex:"1",padding:"6px 4px",borderRadius:"7px",
                        border:flipH?"1px solid rgba(34,211,238,0.4)":"1px solid rgba(255,255,255,0.08)",
                        background:flipH?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",
                        color:flipH?"#22d3ee":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <FlipHorizontal size={13}/>
              </button>
              <button onClick={()=>setFlipV(f=>!f)}
                style={{flex:"1",padding:"6px 4px",borderRadius:"7px",
                        border:flipV?"1px solid rgba(34,211,238,0.4)":"1px solid rgba(255,255,255,0.08)",
                        background:flipV?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",
                        color:flipV?"#22d3ee":"#94a3b8",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <FlipVertical size={13}/>
              </button>
            </div>
          </div>

          <div style={{height:"1px",background:"rgba(255,255,255,0.05)",margin:"4px 10px"}}/>

          {/* Zoom */}
          <div style={{padding:"8px 10px"}}>
            <div style={{fontSize:"9px",fontWeight:700,color:"#334155",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"6px"}}>
              Zoom
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(0,0,0,0.4)",borderRadius:"8px",padding:"3px"}}>
              <button onClick={()=>setZoom(z=>Math.max(0.2,z-0.1))}
                style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",padding:"3px",display:"flex"}}>
                <ZoomOut size={13}/>
              </button>
              <span style={{flex:1,textAlign:"center",fontSize:"11px",fontFamily:"monospace",fontWeight:700,color:"#22d3ee"}}>
                {Math.round(zoom*100)}%
              </span>
              <button onClick={()=>setZoom(z=>Math.min(5,z+0.1))}
                style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",padding:"3px",display:"flex"}}>
                <ZoomIn size={13}/>
              </button>
              <button onClick={()=>setZoom(1)}
                style={{background:"none",border:"none",color:"#475569",cursor:"pointer",padding:"3px",display:"flex"}}
                title="Reset">
                <Maximize2 size={11}/>
              </button>
            </div>
          </div>
        </div>

        {/* ── CANVAS CENTER ────────────────────────────────────── */}
        <div ref={containerRef}
          style={{
            flex:1, position:"relative",
            display:"flex", alignItems:"center", justifyContent:"center",
            overflow:"hidden", minWidth:0, minHeight:0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),"+
              "linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)",
            backgroundSize:"20px 20px",
            backgroundColor:"#080a10",
          }}>

          {/* zoom wrapper */}
          <div style={{
            position:"relative", display:"inline-block",
            transform:`scale(${zoom})`, transformOrigin:"center center",
            transition:"transform .12s", userSelect:"none",
          }}>
            <canvas ref={canvasRef}
              onMouseDown={onStart} onMouseMove={onMove}
              onMouseUp={onEnd}     onMouseLeave={onEnd}
              onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
              style={{
                display:"block", borderRadius:"6px",
                border:"1px solid rgba(255,255,255,0.1)",
                boxShadow:"0 0 60px rgba(0,0,0,0.9),0 0 0 1px rgba(34,211,238,0.06)",
                cursor:"crosshair",
                maxWidth:"100%", maxHeight:"calc(100vh - 200px)",
                touchAction:"none",
              }}/>

            {/* Crop overlay */}
            <div style={{
              position:"absolute",pointerEvents:"none",
              top:`${crop.top}%`,left:`${crop.left}%`,
              right:`${crop.right}%`,bottom:`${crop.bottom}%`,
              border:"2px dashed #22d3ee",
              boxShadow:"0 0 0 9999px rgba(0,0,0,0.45)",
              borderRadius:"2px",
            }}/>

            {/* 8 crop handles */}
            {HANDLES.map(({h,...pos})=>(
              <div key={h} onMouseDown={e=>startCrop(h,e)}
                style={{
                  position:"absolute",width:"14px",height:"14px",borderRadius:"50%",
                  background:"linear-gradient(135deg,#22d3ee,#6366f1)",
                  border:"2px solid #fff",zIndex:20,
                  ...pos,
                }}/>
            ))}
          </div>

          {/* Status badge */}
          <div style={{
            position:"absolute",bottom:"10px",left:"10px",
            display:"flex",alignItems:"center",gap:"5px",
            background:"rgba(7,9,14,0.85)",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:"#334155",
            pointerEvents:"none",
          }}>
            <Sparkles size={10} color="#a855f7"/>
            <span style={{color:"#a855f7",fontWeight:700}}>Premium</span>
            <span style={{color:"#1e293b"}}>·</span>
            <span>{Math.round(zoom*100)}%</span>
            <span style={{color:"#1e293b"}}>·</span>
            <span style={{fontFamily:"monospace",maxWidth:"120px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {file.name}
            </span>
          </div>

          {/* History bar */}
          <div style={{
            position:"absolute",bottom:"10px",right:"10px",
            display:"flex",alignItems:"center",gap:"6px",
            background:"rgba(7,9,14,0.85)",border:"1px solid rgba(255,255,255,0.06)",
            borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:"#334155",
            pointerEvents:"none",
          }}>
            <Layers size={10} color="#a855f7"/>
            <div style={{width:"60px",height:"3px",borderRadius:"2px",background:"rgba(255,255,255,0.06)"}}>
              <div style={{height:"100%",borderRadius:"2px",background:"linear-gradient(90deg,#22d3ee,#a855f7)",width:`${(history.length/20)*100}%`,transition:"width .3s"}}/>
            </div>
            <span>{history.length}/20</span>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR (desktop only) ─────────────────────── */}
        <div style={{
          flexShrink:0, width:"200px",
          background:"#0c0f18", borderLeft:"1px solid rgba(255,255,255,0.07)",
          display:"flex", flexDirection:"column",
          overflowY:"auto", overflowX:"hidden",
        }} className="canvas-sidebar-right">

          {/* Brightness */}
          {[
            {label:"Brightness",icon:<Sun size={11} color="#fbbf24"/>,val:brightness,set:setBrightness,accent:"#fbbf24"},
            {label:"Contrast",icon:<ContrastIcon size={11} color="#60a5fa"/>,val:contrast,set:setContrast,accent:"#60a5fa"},
            {label:"Saturation",icon:<Droplets size={11} color="#f472b6"/>,val:saturation,set:setSaturation,accent:"#f472b6"},
          ].map(({label,icon,val,set,accent})=>(
            <div key={label} style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
                <span style={{fontSize:"10px",color:"#475569",display:"flex",alignItems:"center",gap:"4px",fontWeight:600}}>{icon} {label}</span>
                <span style={{fontSize:"10px",fontFamily:"monospace",fontWeight:700,color:accent}}>{val>0?`+${val}`:val}</span>
              </div>
              <input type="range" min={-100} max={100} value={val}
                onChange={e=>set(Number(e.target.value))}
                style={{width:"100%",accentColor:accent,cursor:"pointer"}}/>
            </div>
          ))}

          {/* Filter */}
          <div style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{fontSize:"10px",color:"#475569",fontWeight:600,marginBottom:"6px",display:"flex",alignItems:"center",gap:"4px"}}>
              <Sparkles size={11} color="#a855f7"/> Filter Preset
            </div>
            <select value={filter} onChange={e=>setFilter(e.target.value as FilterPr)}
              style={{
                width:"100%",background:"#141824",border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:"7px",color:"#e2e8f0",fontSize:"11px",padding:"5px 7px",
                outline:"none",cursor:"pointer",
              }}>
              {FILTERS.map(({value,label})=><option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {/* Crop */}
          <div style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{fontSize:"10px",color:"#475569",fontWeight:600,marginBottom:"5px",display:"flex",alignItems:"center",gap:"4px"}}>
              <Crop size={11} color="#f97316"/> Crop Region
            </div>
            <p style={{fontSize:"10px",color:"#1e293b",lineHeight:1.5,marginBottom:"6px"}}>
              Drag the 8 blue handles on canvas to define crop area.
            </p>
            <button onClick={()=>setCrop({top:0,left:0,right:0,bottom:0})}
              style={{
                width:"100%",padding:"6px",borderRadius:"7px",cursor:"pointer",
                background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",
                color:"#64748b",fontSize:"11px",fontWeight:600,
              }}>
              Reset Crop
            </button>
          </div>

          {/* Text Annotation */}
          <div style={{padding:"10px 12px",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
            <div style={{fontSize:"10px",color:"#475569",fontWeight:600,marginBottom:"6px",display:"flex",alignItems:"center",gap:"4px"}}>
              <Type size={11} color="#22d3ee"/> Text Stamp
            </div>
            <textarea value={caption} onChange={e=>setCaption(e.target.value)}
              placeholder="Type caption..."
              rows={3}
              style={{
                width:"100%",borderRadius:"7px",padding:"7px 9px",
                fontSize:"11px",color:"#e2e8f0",
                background:"#141824",border:"1px solid rgba(255,255,255,0.07)",
                outline:"none",resize:"none",marginBottom:"6px",fontFamily:"inherit",
              }}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px",marginBottom:"6px"}}>
              <select value={fontFam} onChange={e=>setFontFam(e.target.value)}
                style={{background:"#141824",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",
                        color:"#e2e8f0",fontSize:"10px",padding:"4px",outline:"none",cursor:"pointer"}}>
                {["Inter","Outfit","Roboto","Georgia","Courier New"].map(f=>(
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <select value={fontSz} onChange={e=>setFontSz(Number(e.target.value))}
                style={{background:"#141824",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",
                        color:"#e2e8f0",fontSize:"10px",padding:"4px",outline:"none",cursor:"pointer"}}>
                {[12,16,20,24,32,48,64,96].map(s=>(
                  <option key={s} value={s}>{s}px</option>
                ))}
              </select>
            </div>
            <button onClick={addText}
              style={{
                width:"100%",padding:"7px",borderRadius:"7px",border:"none",
                background:"linear-gradient(135deg,#0ea5e9,#6366f1)",
                color:"#fff",fontSize:"11px",fontWeight:700,cursor:"pointer",
              }}>
              ＋ Add Text to Image
            </button>
          </div>

          {/* Premium badge */}
          <div style={{padding:"12px",textAlign:"center",marginTop:"auto"}}>
            <div style={{
              borderRadius:"10px",padding:"10px",
              background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)",
            }}>
              <Sparkles size={14} color="#a855f7" style={{margin:"0 auto 4px"}}/>
              <div style={{fontSize:"10px",color:"#a855f7",fontWeight:700}}>Premium Canvas Studio</div>
              <div style={{fontSize:"9px",color:"#1e293b",marginTop:"3px"}}>Zero-scroll · Full-viewport</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ MOBILE BOTTOM TAB BAR ════════════════════════════════ */}
      <div className="canvas-mobile-tabs" style={{
        flexShrink:0, display:"none",
        borderTop:"1px solid rgba(255,255,255,0.07)",
        background:"#0c0f18",
      }}>
        {/* Tab buttons */}
        <div style={{display:"flex",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          {([["draw","Tools"],["adjust","Adjust"],["text","Text"]] as [typeof mTab,string][]).map(([tab,lbl])=>(
            <button key={tab} onClick={()=>setMTab(tab)}
              style={{
                flex:1,padding:"10px 4px",border:"none",
                background:mTab===tab?"rgba(99,102,241,0.1)":"transparent",
                borderBottom:mTab===tab?"2px solid #6366f1":"2px solid transparent",
                color:mTab===tab?"#a5b4fc":"#475569",fontSize:"11px",fontWeight:600,cursor:"pointer",
              }}>{lbl}</button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{padding:"10px 12px",maxHeight:"200px",overflowY:"auto"}}>
          {mTab==="draw" && (
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              {/* Tools row */}
              <div style={{display:"flex",gap:"4px"}}>
                {TOOLS.map(({id,icon,label})=>(
                  <button key={id} onClick={()=>setTool(id)}
                    style={{
                      flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",
                      padding:"8px 4px",borderRadius:"8px",border:"none",
                      background:tool===id?"linear-gradient(135deg,#1d4ed8,#7c3aed)":"rgba(255,255,255,0.04)",
                      color:tool===id?"#fff":"#64748b",cursor:"pointer",fontSize:"9px",fontWeight:600,
                    }}>
                    {icon}{label}
                  </button>
                ))}
              </div>
              {/* Colors */}
              <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                {COLORS.map(c=>(
                  <button key={c} onClick={()=>setColor(c)}
                    style={{
                      width:"24px",height:"24px",borderRadius:"6px",background:c,cursor:"pointer",
                      border:color===c?"2px solid #22d3ee":"1px solid rgba(255,255,255,0.15)",
                      transform:color===c?"scale(1.2)":"scale(1)",
                      outline:"none",
                    }}/>
                ))}
                <input type="color" value={color} onChange={e=>setColor(e.target.value)}
                  style={{width:"24px",height:"24px",borderRadius:"6px",cursor:"pointer",padding:"1px",border:"1px solid rgba(255,255,255,0.15)"}}/>
              </div>
              {/* Brush */}
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"10px",color:"#475569",whiteSpace:"nowrap"}}>Brush Size: <b style={{color:"#22d3ee"}}>{brushSize}</b></span>
                <input type="range" min={1} max={40} value={brushSize}
                  onChange={e=>setBrushSize(Number(e.target.value))}
                  style={{flex:1,accentColor:"#22d3ee"}}/>
              </div>
              {/* Transform */}
              <div style={{display:"flex",gap:"4px"}}>
                <button onClick={()=>setRotation(r=>(r+90)%360)}
                  style={{flex:1,padding:"7px",borderRadius:"7px",border:"1px solid rgba(255,255,255,0.08)",
                          background:"rgba(255,255,255,0.04)",color:"#94a3b8",cursor:"pointer",fontSize:"10px",fontWeight:600,
                          display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}>
                  <RotateCw size={12} color="#22d3ee"/> Rotate
                </button>
                <button onClick={()=>setFlipH(f=>!f)}
                  style={{flex:1,padding:"7px",borderRadius:"7px",cursor:"pointer",fontSize:"10px",fontWeight:600,
                          border:flipH?"1px solid rgba(34,211,238,0.4)":"1px solid rgba(255,255,255,0.08)",
                          background:flipH?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",
                          color:flipH?"#22d3ee":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <FlipHorizontal size={12}/>
                </button>
                <button onClick={()=>setFlipV(f=>!f)}
                  style={{flex:1,padding:"7px",borderRadius:"7px",cursor:"pointer",fontSize:"10px",fontWeight:600,
                          border:flipV?"1px solid rgba(34,211,238,0.4)":"1px solid rgba(255,255,255,0.08)",
                          background:flipV?"rgba(34,211,238,0.12)":"rgba(255,255,255,0.04)",
                          color:flipV?"#22d3ee":"#94a3b8",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <FlipVertical size={12}/>
                </button>
                <button onClick={()=>setZoom(1)}
                  style={{flex:1,padding:"7px",borderRadius:"7px",border:"1px solid rgba(255,255,255,0.08)",
                          background:"rgba(255,255,255,0.04)",color:"#94a3b8",cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",fontSize:"10px",fontWeight:600}}>
                  <Maximize2 size={11}/> Fit
                </button>
              </div>
            </div>
          )}

          {mTab==="adjust" && (
            <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
              {[
                {label:"Brightness",val:brightness,set:setBrightness,accent:"#fbbf24"},
                {label:"Contrast",val:contrast,set:setContrast,accent:"#60a5fa"},
                {label:"Saturation",val:saturation,set:setSaturation,accent:"#f472b6"},
              ].map(({label,val,set,accent})=>(
                <div key={label}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                    <span style={{fontSize:"10px",color:"#64748b",fontWeight:600}}>{label}</span>
                    <span style={{fontSize:"10px",fontFamily:"monospace",color:accent,fontWeight:700}}>{val>0?`+${val}`:val}</span>
                  </div>
                  <input type="range" min={-100} max={100} value={val}
                    onChange={e=>set(Number(e.target.value))}
                    style={{width:"100%",accentColor:accent,cursor:"pointer"}}/>
                </div>
              ))}
              <div>
                <span style={{fontSize:"10px",color:"#64748b",fontWeight:600,marginBottom:"5px",display:"block"}}>Filter</span>
                <select value={filter} onChange={e=>setFilter(e.target.value as FilterPr)}
                  style={{width:"100%",background:"#141824",border:"1px solid rgba(255,255,255,0.08)",
                          borderRadius:"7px",color:"#e2e8f0",fontSize:"11px",padding:"5px",outline:"none"}}>
                  {FILTERS.map(({value,label})=><option key={value} value={value}>{label}</option>)}
                </select>
              </div>
            </div>
          )}

          {mTab==="text" && (
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <textarea value={caption} onChange={e=>setCaption(e.target.value)}
                placeholder="Type caption text..."
                rows={2}
                style={{width:"100%",borderRadius:"7px",padding:"7px",fontSize:"11px",color:"#e2e8f0",
                        background:"#141824",border:"1px solid rgba(255,255,255,0.07)",outline:"none",resize:"none"}}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"5px"}}>
                <select value={fontFam} onChange={e=>setFontFam(e.target.value)}
                  style={{background:"#141824",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",
                          color:"#e2e8f0",fontSize:"10px",padding:"4px",outline:"none"}}>
                  {["Inter","Outfit","Roboto","Georgia","Courier New"].map(f=>(
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <select value={fontSz} onChange={e=>setFontSz(Number(e.target.value))}
                  style={{background:"#141824",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"6px",
                          color:"#e2e8f0",fontSize:"10px",padding:"4px",outline:"none"}}>
                  {[12,16,24,32,48,64].map(s=>(
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>
              <button onClick={addText}
                style={{width:"100%",padding:"8px",borderRadius:"7px",border:"none",
                        background:"linear-gradient(135deg,#0ea5e9,#6366f1)",
                        color:"#fff",fontSize:"12px",fontWeight:700,cursor:"pointer"}}>
                ＋ Add Text to Image
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ GLOBAL CSS for this component ════════════════════════ */}
      <style>{`
        .canvas-sidebar-left,
        .canvas-sidebar-right {
          display: flex !important;
        }
        .canvas-mobile-tabs {
          display: none !important;
        }
        @media (max-width: 768px) {
          .canvas-sidebar-left,
          .canvas-sidebar-right {
            display: none !important;
          }
          .canvas-mobile-tabs {
            display: flex !important;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
