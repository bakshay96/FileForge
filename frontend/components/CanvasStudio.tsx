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
  Layers, Minus, ArrowRight, ChevronDown,
  RotateCw, RotateCcw, Grid, Image as ImageIcon,
  Trash2, RefreshCw, Info, Save, Film,
  Music, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward,
  Wand2, Palette, Upload, Smile, HelpCircle,
  Moon, Sun as SunIcon, Waves, Focus, Blend, FileDown,
  ChevronLeft, ChevronRight, PlusCircle, Camera,
} from "lucide-react";
import BrandLoader from "./BrandLoader";
import { ThemeContext } from "@/app/providers";

/* ════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════ */
type FileMode    = "none" | "image" | "video";
type MainTool    = "pen"|"brush"|"shape"|"erase"|"text"|"crop"|"blur"|"sticker";
type PenType     = "ballpoint"|"felt"|"marker"|"highlighter";
type BrushType   = "soft"|"hard"|"airbrush"|"watercolor"|"oil";
type ShapeType   = "rect"|"circle"|"line"|"arrow"|"triangle"|"star";
type FilterPr    = "none"|"grayscale"|"sepia"|"invert"|"warm"|"cool"|"vivid";
type MenuKey     = "file"|"edit"|"view"|"image"|"filter"|"ai"|"help"|null;
type RightPanel  = "adjust"|"transform"|"audio"|"ai"|"info";

interface WTStep {
  title: string; desc: string; icon: React.ReactNode;
  region?: { top:string; left?:string; right?:string; width:string; height:string };
}

export interface StudioProps {
  file?: File;
  onSave?:(f:File)=>void;
  onCancel?:()=>void;
  portalMode?: boolean;
}

/* ════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════ */
const COLORS = ["#3b82f6","#ef4444","#f97316","#eab308","#22c55e","#06b6d4","#a855f7","#ec4899","#ffffff","#000000","#475569","#84cc16"];
const STICKERS = ["😀","❤️","⭐","🔥","🎉","💯","🌟","✨","🎨","📷","🎵","💎","🚀","🌈","💡","😎","🦋","🌺","🎭","🎪","🦄","🍀","🌙","⚡","🎯"];
const FILTERS: {value:FilterPr; label:string; emoji:string}[] = [
  {value:"none",     label:"Original",    emoji:"🖼️"},
  {value:"grayscale",label:"Grayscale",   emoji:"⬛"},
  {value:"sepia",    label:"Sepia",       emoji:"🟤"},
  {value:"warm",     label:"Warm Film",   emoji:"🌅"},
  {value:"cool",     label:"Cool Breeze", emoji:"❄️"},
  {value:"vivid",    label:"Vivid Boost", emoji:"✨"},
  {value:"invert",   label:"Invert",      emoji:"🔀"},
];
const PEN_TYPES: {id:PenType; label:string; emoji:string}[] = [
  {id:"ballpoint",  label:"Ballpoint",   emoji:"🖊️"},
  {id:"felt",       label:"Felt Tip",    emoji:"🖋️"},
  {id:"marker",     label:"Marker",      emoji:"🖊"},
  {id:"highlighter",label:"Highlighter", emoji:"🖍️"},
];
const BRUSH_TYPES: {id:BrushType; label:string; emoji:string}[] = [
  {id:"soft",      label:"Soft Round",  emoji:"🌫️"},
  {id:"hard",      label:"Hard Round",  emoji:"⬤"},
  {id:"airbrush",  label:"Airbrush",    emoji:"🌬️"},
  {id:"watercolor",label:"Watercolor",  emoji:"💧"},
  {id:"oil",       label:"Oil Paint",   emoji:"🎨"},
];
const SHAPE_TYPES: {id:ShapeType; icon:React.ReactNode; label:string}[] = [
  {id:"rect",     icon:<Square    size={13}/>, label:"Rect"},
  {id:"circle",   icon:<Circle    size={13}/>, label:"Circle"},
  {id:"line",     icon:<Minus     size={13}/>, label:"Line"},
  {id:"arrow",    icon:<ArrowRight size={13}/>,label:"Arrow"},
  {id:"triangle", icon:<Triangle  size={13}/>, label:"Triangle"},
  {id:"star",     icon:<Star      size={13}/>, label:"Star"},
];
const CANVAS_PRESETS = [
  {label:"Square",    w:1080, h:1080},
  {label:"Portrait",  w:1080, h:1920},
  {label:"Landscape", w:1920, h:1080},
  {label:"HD 1080p",  w:1920, h:1080},
  {label:"Poster",    w:794,  h:1123},
];
const WT_STEPS: WTStep[] = [
  {
    title:"Welcome to Canvas Studio! 🎨",
    desc:"An all-in-one creative studio for images, videos, music & AI. This 8-step tour will walk you through every feature.",
    icon:<Sparkles size={28} color="#a855f7"/>,
  },
  {
    title:"Open Any File 📁",
    desc:"Drag & drop an image or video anywhere on the canvas, or use File → Open. Supports JPG, PNG, WebP for images and MP4, WebM for videos.",
    icon:<Upload size={28} color="#22d3ee"/>,
  },
  {
    title:"Drawing Tools 🖊️",
    desc:"Left sidebar has Pen, Brush, Shapes, Eraser, Text, Crop, Blur & Stickers. Click a tool to see its sub-options and controls below it.",
    icon:<Pencil size={28} color="#3b82f6"/>,
    region:{top:"56px", left:"0", width:"170px", height:"calc(100% - 56px)"},
  },
  {
    title:"Menu Bar 📋",
    desc:"File, Edit, View, Image, Filter, AI and Help menus are all here. Every action has a keyboard shortcut shown next to it.",
    icon:<Info size={28} color="#fbbf24"/>,
    region:{top:"0", left:"0", width:"100%", height:"28px"},
  },
  {
    title:"Image Adjustments 🎛️",
    desc:"Right panel has: Adjust (brightness, contrast, filters), Transform (rotate, flip), Audio (music layer), AI (smart tools) and Info tabs.",
    icon:<ContrastIcon size={28} color="#f472b6"/>,
    region:{top:"56px", right:"0", width:"185px", height:"calc(100% - 56px)"},
  },
  {
    title:"Add Music 🎵",
    desc:"Click the Audio tab in the right panel. Upload any MP3/WAV/OGG file. See a live waveform, control volume and fade in/out effects.",
    icon:<Music size={28} color="#22c55e"/>,
  },
  {
    title:"AI Superpowers 🤖",
    desc:"Click the AI tab for: Auto Enhance (auto brightness/contrast), Color Palette Extraction, Background Removal, Noise Reduction, and Vignette.",
    icon:<Wand2 size={28} color="#a855f7"/>,
  },
  {
    title:"Video Editor 🎬",
    desc:"Drop a video file to enter Video Mode. A timeline with trim handles appears at the bottom. Add text overlays, apply filters, and export as .webm.",
    icon:<Film size={28} color="#f97316"/>,
  },
];

const clamp = (v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const PEN_CURSOR   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%2322d3ee'/%3E%3C/svg%3E") 0 24, crosshair`;
const ERASE_CURSOR = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect x='2' y='2' width='20' height='20' rx='3' fill='none' stroke='%23f87171' stroke-width='2'/%3E%3C/svg%3E") 10 10, crosshair`;

/* ════════════════════════════════════════════════════════
   AI HELPER FUNCTIONS
════════════════════════════════════════════════════════ */
function aiAutoEnhance(imageData:ImageData):{brightness:number;contrast:number;saturation:number} {
  const d=imageData.data; let totalLum=0,minLum=255,maxLum=0,count=0;
  for(let i=0;i<d.length;i+=64){
    const lum=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];
    totalLum+=lum; if(lum<minLum)minLum=lum; if(lum>maxLum)maxLum=lum; count++;
  }
  const avgLum=totalLum/count;
  const brightnessD=clamp(Math.round((128-avgLum)*0.4),-60,60);
  const range=maxLum-minLum;
  const contrastD=range<100?clamp(Math.round((100-range)*0.3),0,40):0;
  return{brightness:brightnessD,contrast:contrastD,saturation:15};
}

function aiExtractPalette(imageData:ImageData,k=6):string[] {
  const d=imageData.data;
  const pixels:[number,number,number][]=[];
  for(let i=0;i<d.length;i+=80) if(d[i+3]>128) pixels.push([d[i],d[i+1],d[i+2]]);
  if(pixels.length<k) return COLORS.slice(0,k);
  const step=Math.floor(pixels.length/k);
  let centers:[number,number,number][]=Array.from({length:k},(_,i)=>[...pixels[i*step]] as [number,number,number]);
  for(let iter=0;iter<8;iter++){
    const clusters:[number,number,number][][]=Array.from({length:k},()=>[]);
    for(const p of pixels){
      let minD=Infinity,c=0;
      for(let j=0;j<k;j++){
        const d2=(p[0]-centers[j][0])**2+(p[1]-centers[j][1])**2+(p[2]-centers[j][2])**2;
        if(d2<minD){minD=d2;c=j;}
      }
      clusters[c].push(p);
    }
    for(let j=0;j<k;j++){
      if(!clusters[j].length) continue;
      const avg=clusters[j].reduce((a,p)=>[a[0]+p[0],a[1]+p[1],a[2]+p[2]] as [number,number,number],[0,0,0] as [number,number,number]);
      centers[j]=[avg[0]/clusters[j].length,avg[1]/clusters[j].length,avg[2]/clusters[j].length];
    }
  }
  return centers.map(([r,g,b])=>`#${Math.round(r).toString(16).padStart(2,"0")}${Math.round(g).toString(16).padStart(2,"0")}${Math.round(b).toString(16).padStart(2,"0")}`);
}

function aiBgRemoval(ctx:CanvasRenderingContext2D,w:number,h:number,tol=40):void {
  const img=ctx.getImageData(0,0,w,h); const d=img.data;
  const corners=[0,(w-1)*4,(h-1)*w*4,((h-1)*w+w-1)*4];
  let bgR=0,bgG=0,bgB=0;
  for(const i of corners){bgR+=d[i];bgG+=d[i+1];bgB+=d[i+2];}
  bgR=Math.round(bgR/4);bgG=Math.round(bgG/4);bgB=Math.round(bgB/4);
  for(let i=0;i<d.length;i+=4){
    const dr=Math.abs(d[i]-bgR),dg=Math.abs(d[i+1]-bgG),db=Math.abs(d[i+2]-bgB);
    if(dr<tol&&dg<tol&&db<tol) d[i+3]=Math.round(d[i+3]*(1-((tol-Math.max(dr,dg,db))/tol)));
  }
  ctx.putImageData(img,0,0);
}

function aiNoiseReduction(ctx:CanvasRenderingContext2D,w:number,h:number):void {
  const img=ctx.getImageData(0,0,w,h); const d=img.data;
  const out=new Uint8ClampedArray(d);
  for(let y=1;y<h-1;y++) for(let x=1;x<w-1;x++){
    let r=0,g=0,b=0;
    for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
      const idx=((y+dy)*w+(x+dx))*4; r+=d[idx];g+=d[idx+1];b+=d[idx+2];
    }
    const idx=(y*w+x)*4; out[idx]=r/9;out[idx+1]=g/9;out[idx+2]=b/9;out[idx+3]=d[idx+3];
  }
  ctx.putImageData(new ImageData(out,w,h),0,0);
}

function aiVignette(ctx:CanvasRenderingContext2D,w:number,h:number,strength=0.65):void {
  const grad=ctx.createRadialGradient(w/2,h/2,h*0.3,w/2,h/2,Math.max(w,h)*0.7);
  grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,`rgba(0,0,0,${strength})`);
  ctx.save(); ctx.globalCompositeOperation="multiply"; ctx.fillStyle=grad;
  ctx.fillRect(0,0,w,h); ctx.restore();
}

/* ════════════════════════════════════════════════════════
   DRAWING HELPERS
════════════════════════════════════════════════════════ */
function applyPenStroke(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,pt:PenType,sz:number,col:string,op:number){
  ctx.save(); ctx.globalAlpha=pt==="highlighter"?op*0.4:op;
  ctx.strokeStyle=col; ctx.lineCap="round"; ctx.lineJoin="round";
  switch(pt){
    case"ballpoint":ctx.lineWidth=sz*0.7;break;
    case"felt":ctx.lineWidth=sz*1.2;break;
    case"marker":ctx.lineWidth=sz*2.5;ctx.lineCap="square";break;
    case"highlighter":ctx.lineWidth=sz*4;ctx.lineCap="square";ctx.globalCompositeOperation="multiply";break;
  }
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}

function applyBrushStroke(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,bt:BrushType,sz:number,col:string,op:number){
  ctx.save();ctx.strokeStyle=col;ctx.lineCap="round";ctx.lineJoin="round";ctx.globalAlpha=op;
  switch(bt){
    case"soft":ctx.lineWidth=sz;ctx.shadowBlur=sz*0.8;ctx.shadowColor=col;break;
    case"hard":ctx.lineWidth=sz;ctx.shadowBlur=0;break;
    case"airbrush":{
      const dist=Math.sqrt((x2-x1)**2+(y2-y1)**2)||1,steps=Math.max(1,Math.floor(dist/4));
      ctx.globalAlpha=op*0.08;
      for(let i=0;i<steps;i++){const px=x1+(x2-x1)*(i/steps),py=y1+(y2-y1)*(i/steps);
        for(let d=0;d<8;d++){const a=Math.random()*2*Math.PI,r=Math.random()*sz;
          ctx.beginPath();ctx.arc(px+Math.cos(a)*r,py+Math.sin(a)*r,1,0,2*Math.PI);ctx.fillStyle=col;ctx.fill();}}
      ctx.restore();return;}
    case"watercolor":ctx.lineWidth=sz*1.5;ctx.globalAlpha=op*0.15;ctx.shadowBlur=sz*1.5;ctx.shadowColor=col;break;
    case"oil":ctx.lineWidth=sz;ctx.shadowBlur=2;ctx.shadowColor="rgba(0,0,0,0.3)";break;
  }
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore();
}

function drawShape(ctx:CanvasRenderingContext2D,t:ShapeType,x1:number,y1:number,x2:number,y2:number,stroke:string,fill:string|null,lw:number){
  ctx.save();ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.lineJoin="round";
  if(fill)ctx.fillStyle=fill;
  const w=x2-x1,h=y2-y1;
  switch(t){
    case"rect":if(fill)ctx.fillRect(x1,y1,w,h);ctx.strokeRect(x1,y1,w,h);break;
    case"circle":{ctx.beginPath();ctx.ellipse(x1+w/2,y1+h/2,Math.abs(w)/2,Math.abs(h)/2,0,0,2*Math.PI);if(fill)ctx.fill();ctx.stroke();break;}
    case"line":ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();break;
    case"arrow":{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
      const a=Math.atan2(y2-y1,x2-x1),al=18,aa=0.45;
      ctx.beginPath();ctx.moveTo(x2,y2);ctx.lineTo(x2-al*Math.cos(a-aa),y2-al*Math.sin(a-aa));ctx.lineTo(x2-al*Math.cos(a+aa),y2-al*Math.sin(a+aa));
      ctx.closePath();ctx.fillStyle=stroke;ctx.fill();break;}
    case"triangle":ctx.beginPath();ctx.moveTo(x1+w/2,y1);ctx.lineTo(x2,y2);ctx.lineTo(x1,y2);ctx.closePath();if(fill)ctx.fill();ctx.stroke();break;
    case"star":{const cx=x1+w/2,cy=y1+h/2,or=Math.min(Math.abs(w),Math.abs(h))/2,ir=or*0.45;
      ctx.beginPath();
      for(let i=0;i<10;i++){const r=i%2===0?or:ir,ang=(i*Math.PI/5)-Math.PI/2;
        i===0?ctx.moveTo(cx+r*Math.cos(ang),cy+r*Math.sin(ang)):ctx.lineTo(cx+r*Math.cos(ang),cy+r*Math.sin(ang));}
      ctx.closePath();if(fill)ctx.fill();ctx.stroke();break;}
  }
  ctx.restore();
}

/* ════════════════════════════════════════════════════════
   WALKTHROUGH OVERLAY
════════════════════════════════════════════════════════ */
function WalkthroughOverlay({idx,steps,onNext,onPrev,onSkip,isDark}:{
  idx:number; steps:WTStep[]; onNext:()=>void; onPrev:()=>void; onSkip:()=>void; isDark:boolean;
}) {
  const s=steps[idx]; const isLast=idx===steps.length-1;
  return (
    <div style={{position:"fixed",inset:0,zIndex:2147483648,display:"flex",alignItems:"center",justifyContent:"center",
                 background:"rgba(0,0,0,0.78)",backdropFilter:"blur(2px)"}}>
      {/* Spotlight region */}
      {s.region&&(
        <div style={{position:"fixed",...s.region,borderRadius:"8px",
                     boxShadow:"0 0 0 4px #22d3ee, 0 0 40px rgba(34,211,238,0.3)",
                     pointerEvents:"none",zIndex:1}}/>
      )}
      {/* Step card */}
      <div style={{
        background:isDark?"linear-gradient(135deg,#0f1117,#1a2035)":"#fff",
        border:"1px solid rgba(99,102,241,0.3)",borderRadius:"24px",padding:"36px 32px 28px",
        maxWidth:"460px",width:"90vw",textAlign:"center",position:"relative",zIndex:2,
        boxShadow:"0 0 0 1px rgba(99,102,241,0.15), 0 32px 80px rgba(0,0,0,0.7)",
        animation:"wt-in .25s ease",
      }}>
        {/* Close */}
        <button onClick={onSkip} style={{position:"absolute",top:"12px",right:"12px",background:"none",border:"none",
          color:isDark?"#475569":"#94a3b8",cursor:"pointer",padding:"4px",borderRadius:"6px"}}><X size={14}/></button>
        {/* Icon */}
        <div style={{width:"64px",height:"64px",borderRadius:"18px",margin:"0 auto 18px",
                     background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(34,211,238,0.15))",
                     border:"1px solid rgba(99,102,241,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {s.icon}
        </div>
        {/* Badge */}
        <div style={{fontSize:"10px",color:"#6366f1",fontWeight:700,marginBottom:"8px",letterSpacing:"0.08em"}}>
          STEP {idx+1} OF {steps.length}
        </div>
        {/* Title */}
        <h3 style={{fontSize:"22px",fontWeight:800,color:isDark?"#fff":"#0f1117",
                    fontFamily:"'Outfit',sans-serif",marginBottom:"12px",lineHeight:1.2}}>{s.title}</h3>
        {/* Desc */}
        <p style={{fontSize:"13px",color:isDark?"#94a3b8":"#475569",lineHeight:1.75,marginBottom:"26px"}}>{s.desc}</p>
        {/* Progress dots */}
        <div style={{display:"flex",justifyContent:"center",gap:"5px",marginBottom:"22px"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{height:"5px",borderRadius:"3px",transition:"all .3s",
              width:i===idx?"22px":"5px",
              background:i===idx?"#6366f1":i<idx?"#22d3ee":"rgba(99,102,241,0.2)"}}/>
          ))}
        </div>
        {/* Buttons */}
        <div style={{display:"flex",gap:"10px",justifyContent:"center",alignItems:"center"}}>
          {idx>0&&(
            <button onClick={onPrev} style={{padding:"10px 18px",borderRadius:"10px",
              border:"1px solid rgba(99,102,241,0.2)",background:"transparent",
              color:"#6366f1",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>← Back</button>
          )}
          <button onClick={isLast?onSkip:onNext} style={{padding:"11px 28px",borderRadius:"10px",border:"none",
            background:"linear-gradient(135deg,#6366f1,#22d3ee)",
            color:"#fff",fontSize:"13px",fontWeight:700,cursor:"pointer",
            boxShadow:"0 4px 20px rgba(99,102,241,0.4)"}}>
            {isLast?"🎨 Start Editing!":"Next →"}
          </button>
        </div>
        {!isLast&&(
          <button onClick={onSkip} style={{display:"block",margin:"14px auto 0",background:"none",border:"none",
            color:isDark?"#334155":"#94a3b8",fontSize:"11px",cursor:"pointer"}}>Skip Tour</button>
        )}
      </div>
      <style>{`@keyframes wt-in{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   NO-FILE SPLASH SCREEN
════════════════════════════════════════════════════════ */
function NoFileScreen({onFileLoaded,onBlankCanvas,isDark,onShowTour}:{
  onFileLoaded:(f:File)=>void;
  onBlankCanvas:(w:number,h:number)=>void;
  isDark:boolean;
  onShowTour:()=>void;
}) {
  const [dragOver,setDragOver]=useState(false);
  const inputRef=useRef<HTMLInputElement>(null);
  const V=(n:string)=>`var(--ce-${n})`;

  const handleDrop=(e:React.DragEvent)=>{
    e.preventDefault();setDragOver(false);
    const f=e.dataTransfer.files[0]; if(f) onFileLoaded(f);
  };

  return(
    <div style={{
      position:"fixed",inset:0,zIndex:2147483640,background:V("bg"),
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      fontFamily:"'Inter',sans-serif",
    }}>
      {/* Top bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"48px",background:V("panel"),
                   borderBottom:`1px solid ${V("border")}`,display:"flex",alignItems:"center",
                   padding:"0 16px",gap:"8px",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
          <div style={{width:"22px",height:"22px",borderRadius:"6px",flexShrink:0,
                       background:"linear-gradient(135deg,#22d3ee,#6366f1)",
                       display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Zap size={11} color="#fff" fill="#fff"/>
          </div>
          <span style={{fontFamily:"'Outfit',sans-serif",fontWeight:800,fontSize:"14px",color:V("text")}}>
            File<span style={{color:"#22d3ee"}}>Forge</span>
          </span>
          <span style={{color:V("text-faint"),fontSize:"12px"}}>/ Canvas Studio</span>
        </div>
        <button onClick={onShowTour} title="Show Tour"
          style={{display:"flex",alignItems:"center",gap:"5px",padding:"5px 10px",borderRadius:"8px",
                  border:`1px solid ${V("border")}`,background:"transparent",
                  color:V("text-muted"),fontSize:"11px",fontWeight:600,cursor:"pointer"}}>
          <HelpCircle size={12}/> How to use
        </button>
      </div>

      {/* Background ambient glows */}
      <div style={{position:"absolute",top:"20%",left:"20%",width:"300px",height:"300px",
                   borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%)",
                   filter:"blur(60px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"25%",right:"20%",width:"250px",height:"250px",
                   borderRadius:"50%",background:"radial-gradient(circle,rgba(34,211,238,0.1),transparent 70%)",
                   filter:"blur(60px)",pointerEvents:"none"}}/>

      {/* Main content */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"32px",padding:"16px",maxWidth:"680px",width:"100%"}}>
        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={handleDrop}
          onClick={()=>inputRef.current?.click()}
          style={{
            width:"100%",border:`2px dashed ${dragOver?"#22d3ee":isDark?"rgba(99,102,241,0.35)":"rgba(99,102,241,0.2)"}`,
            borderRadius:"24px",padding:"64px 40px",textAlign:"center",cursor:"pointer",
            background:dragOver?"rgba(34,211,238,0.04)":isDark?"rgba(255,255,255,0.01)":"rgba(99,102,241,0.02)",
            transition:"all .2s",
          }}>
          <div style={{width:"80px",height:"80px",borderRadius:"20px",margin:"0 auto 24px",
                       background:"linear-gradient(135deg,rgba(99,102,241,0.18),rgba(34,211,238,0.18))",
                       border:"1px solid rgba(99,102,241,0.25)",display:"flex",alignItems:"center",justifyContent:"center",
                       boxShadow:"0 8px 32px rgba(99,102,241,0.15)"}}>
            <Upload size={36} color="#6366f1"/>
          </div>
          <h2 style={{fontSize:"26px",fontWeight:800,fontFamily:"'Outfit',sans-serif",
                      color:V("text"),marginBottom:"10px"}}>
            Open a File to Edit
          </h2>
          <p style={{fontSize:"13px",color:V("text-dim"),marginBottom:"28px",lineHeight:1.7}}>
            Drag & drop an image or video here — or click to browse.<br/>
            <span style={{color:V("text-faint"),fontSize:"11px"}}>Images: JPG, PNG, WebP, GIF, BMP &nbsp;·&nbsp; Videos: MP4, WebM, MOV</span>
          </p>
          <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={e=>{e.stopPropagation();inputRef.current?.click();}}
              style={{padding:"13px 26px",borderRadius:"12px",border:"none",fontWeight:700,fontSize:"13px",cursor:"pointer",
                      background:"linear-gradient(135deg,#6366f1,#22d3ee)",color:"#fff",
                      display:"flex",alignItems:"center",gap:"8px",
                      boxShadow:"0 4px 20px rgba(99,102,241,0.35)"}}>
              <ImageIcon size={15}/> Open Image / Video
            </button>
            <button onClick={e=>{e.stopPropagation();onBlankCanvas(1080,1080);}}
              style={{padding:"13px 26px",borderRadius:"12px",fontWeight:600,fontSize:"13px",cursor:"pointer",
                      border:`1px solid ${V("border-2")}`,background:"transparent",
                      color:V("text-muted"),display:"flex",alignItems:"center",gap:"8px"}}>
              <Square size={15}/> Blank Canvas
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*" style={{display:"none"}}
            onChange={e=>{const f=e.target.files?.[0];if(f)onFileLoaded(f);}}/>
        </div>

        {/* Preset sizes */}
        <div style={{textAlign:"center",width:"100%"}}>
          <p style={{fontSize:"10px",color:V("text-faint"),marginBottom:"12px",
                     letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:700}}>
            Or start with a canvas preset
          </p>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",justifyContent:"center"}}>
            {CANVAS_PRESETS.map(({label,w,h})=>(
              <button key={label} onClick={()=>onBlankCanvas(w,h)}
                style={{padding:"8px 14px",borderRadius:"10px",cursor:"pointer",fontSize:"11px",fontWeight:600,
                        border:`1px solid ${V("border")}`,background:V("hover"),color:V("text-dim")}}>
                {label} <span style={{opacity:.5,fontSize:"9px"}}>{w}×{h}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Feature badges */}
        <div style={{display:"flex",gap:"12px",flexWrap:"wrap",justifyContent:"center"}}>
          {[["🖊️","Draw & Annotate"],["🎬","Video Editor"],["🎵","Music Layer"],["🤖","AI Enhance"],["✂️","Smart Crop"],["💎","HD Export"]].map(([icon,label])=>(
            <div key={label as string} style={{display:"flex",alignItems:"center",gap:"6px",padding:"6px 12px",
                            borderRadius:"20px",border:`1px solid ${V("border")}`,
                            background:V("hover"),fontSize:"11px",color:V("text-dim")}}>
              {icon} {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN CANVAS STUDIO INNER
════════════════════════════════════════════════════════ */
function CanvasStudioInner({file:initialFile,onSave,onCancel,portalMode=false}:StudioProps){
  const {theme}=useContext(ThemeContext);
  const isDark=theme==="dark";
  const V=(n:string)=>`var(--ce-${n})`;

  // Refs
  const canvasRef    =useRef<HTMLCanvasElement>(null);
  const overlayRef   =useRef<HTMLCanvasElement>(null);
  const containerRef =useRef<HTMLDivElement>(null);
  const waveCanvasRef=useRef<HTMLCanvasElement>(null);
  const videoElRef   =useRef<HTMLVideoElement|null>(null);
  const audioElRef   =useRef<HTMLAudioElement|null>(null);
  const audioCtxRef  =useRef<AudioContext|null>(null);
  const analyserRef  =useRef<AnalyserNode|null>(null);
  const gainRef      =useRef<GainNode|null>(null);
  const rafRef       =useRef<number|null>(null);
  const waveRafRef   =useRef<number|null>(null);
  const videoRafRef  =useRef<number|null>(null);
  const isDrawing    =useRef(false);
  const startPos     =useRef<{x:number;y:number}|null>(null);
  const lastPos      =useRef<{x:number;y:number}|null>(null);
  const dragCrop     =useRef<{x:number;y:number;box:{top:number;left:number;right:number;bottom:number}}|null>(null);
  const timelineDragging=useRef<"playhead"|"trimIn"|"trimOut"|null>(null);

  // File / Mode state
  const [fileMode,setFileMode]=useState<FileMode>(initialFile?"image":"none");
  const [loadedFile,setLoadedFile]=useState<File|null>(initialFile||null);
  const [img,setImg]=useState<HTMLImageElement|null>(null);
  const [imgLoading,setImgLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [exporting,setExporting]=useState(false);

  // Drawing tools
  const [mainTool,setMainTool]=useState<MainTool>("pen");
  const [penType,setPenType]=useState<PenType>("ballpoint");
  const [penSize,setPenSize]=useState(4);
  const [penOpacity,setPenOpacity]=useState(1);
  const [brushType,setBrushType]=useState<BrushType>("soft");
  const [brushSize,setBrushSize]=useState(20);
  const [brushOpacity,setBrushOpacity]=useState(0.85);
  const [shapeType,setShapeType]=useState<ShapeType>("rect");
  const [shapeFill,setShapeFill]=useState(false);
  const [shapeLineW,setShapeLineW]=useState(3);
  const [eraserSize,setEraserSize]=useState(20);
  const [eraserPos,setEraserPos]=useState<{x:number;y:number}|null>(null);
  const [textInput,setTextInput]=useState("");
  const [fontFam,setFontFam]=useState("Inter");
  const [fontSz,setFontSz]=useState(24);
  const [bold,setBold]=useState(false);
  const [italic,setItalic]=useState(false);
  const [blurRadius,setBlurRadius]=useState(8);
  const [selSticker,setSelSticker]=useState("😀");

  // Color
  const [strokeColor,setStrokeColor]=useState("#3b82f6");
  const [fillColor,setFillColor]=useState("#3b82f633");
  const [colorHistory,setColorHistory]=useState<string[]>([]);

  // Image adjustments
  const [brightness,setBrightness]=useState(0);
  const [contrast,setContrast]=useState(0);
  const [saturation,setSaturation]=useState(0);
  const [rotation,setRotation]=useState(0);
  const [flipH,setFlipH]=useState(false);
  const [flipV,setFlipV]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [filter,setFilter]=useState<FilterPr>("none");

  // Crop
  const [crop,setCrop]=useState({top:0,left:0,right:0,bottom:0});
  const [cropHandle,setCropHandle]=useState<string|null>(null);

  // History
  const [history,setHistory]=useState<ImageData[]>([]);
  const [future,setFuture]=useState<ImageData[]>([]);

  // Video
  const [videoPlaying,setVideoPlaying]=useState(false);
  const [videoTime,setVideoTime]=useState(0);
  const [videoDur,setVideoDur]=useState(0);
  const [trimIn,setTrimIn]=useState(0);
  const [trimOut,setTrimOut]=useState(100);
  const [videoTextOverlay,setVideoTextOverlay]=useState("");

  // Audio
  const [audioFile,setAudioFile]=useState<File|null>(null);
  const [audioName,setAudioName]=useState("");
  const [audioPlaying,setAudioPlaying]=useState(false);
  const [audioVol,setAudioVol]=useState(0.8);
  const [audioLoaded,setAudioLoaded]=useState(false);

  // AI
  const [aiPalette,setAiPalette]=useState<string[]>([]);
  const [aiProcessing,setAiProcessing]=useState(false);
  const [aiStatus,setAiStatus]=useState("");

  // UI
  const [saved,setSaved]=useState(false);
  const [maximized,setMaximized]=useState(true);
  const [rightPanel,setRightPanel]=useState<RightPanel>("adjust");
  const [activeMenu,setActiveMenu]=useState<MenuKey>(null);
  const [showGrid,setShowGrid]=useState(false);
  const [showInfoBar,setShowInfoBar]=useState(true);
  const [toolSubOpen,setToolSubOpen]=useState(false);
  const [cursorPos,setCursorPos]=useState({x:0,y:0});
  const [canvasDims,setCanvasDims]=useState({w:0,h:0});
  const [wtActive,setWtActive]=useState(false);
  const [wtIdx,setWtIdx]=useState(0);

  // ── Check first-time walkthrough ──
  useEffect(()=>{
    const seen=localStorage.getItem("ff_studio_tour_done");
    if(!seen){setWtActive(true);}
  },[]);
  const finishTour=useCallback(()=>{
    setWtActive(false);localStorage.setItem("ff_studio_tour_done","1");
  },[]);

  // ── Load image ──
  useEffect(()=>{
    if(!loadedFile) return;
    const isVideo=loadedFile.type.startsWith("video/");
    if(isVideo){setFileMode("video");return;}
    setFileMode("image"); setImgLoading(true);
    const url=URL.createObjectURL(loadedFile);
    const i=new Image(); i.crossOrigin="anonymous";
    i.onload=()=>{ setImg(i); setCanvasDims({w:i.naturalWidth,h:i.naturalHeight}); setImgLoading(false); };
    i.onerror=()=>setImgLoading(false);
    i.src=url;
    return()=>URL.revokeObjectURL(url);
  },[loadedFile]);

  // ── Setup video ──
  useEffect(()=>{
    if(fileMode!=="video"||!loadedFile) return;
    const vid=document.createElement("video");
    vid.crossOrigin="anonymous"; vid.muted=true; vid.loop=false;
    vid.src=URL.createObjectURL(loadedFile);
    vid.onloadedmetadata=()=>{
      setVideoDur(vid.duration); setTrimOut(100);
      setCanvasDims({w:vid.videoWidth||1280,h:vid.videoHeight||720});
      const c=canvasRef.current; if(c){c.width=vid.videoWidth||1280;c.height=vid.videoHeight||720;}
    };
    videoElRef.current=vid;
    return()=>{ vid.src=""; URL.revokeObjectURL(vid.src); };
  },[fileMode,loadedFile]);

  // ── Video render loop ──
  const drawVideoFrame=useCallback(()=>{
    const vid=videoElRef.current; const c=canvasRef.current; const ctx=c?.getContext("2d");
    if(!vid||!c||!ctx) return;
    ctx.drawImage(vid,0,0,c.width,c.height);
    if(videoTextOverlay){
      ctx.save(); ctx.font=`bold 48px Inter,sans-serif`; ctx.fillStyle="#fff";
      ctx.shadowColor="rgba(0,0,0,0.8)"; ctx.shadowBlur=8;
      ctx.fillText(videoTextOverlay,40,c.height-60); ctx.restore();
    }
    setVideoTime(vid.currentTime);
    const trimOutSec=(trimOut/100)*vid.duration;
    if(vid.currentTime>=trimOutSec){ vid.pause(); setVideoPlaying(false); return; }
    videoRafRef.current=requestAnimationFrame(drawVideoFrame);
  },[videoTextOverlay,trimOut]);

  useEffect(()=>{
    if(fileMode!=="video") return;
    if(videoPlaying){ videoRafRef.current=requestAnimationFrame(drawVideoFrame); }
    else { if(videoRafRef.current) cancelAnimationFrame(videoRafRef.current); }
    return()=>{ if(videoRafRef.current) cancelAnimationFrame(videoRafRef.current); };
  },[videoPlaying,drawVideoFrame,fileMode]);

  // ── Redraw base canvas (image mode) ──
  const redraw=useCallback(()=>{
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
    ctx.translate(c.width/2,c.height/2); ctx.rotate((rotation*Math.PI)/180);
    ctx.scale(flipH?-1:1,flipV?-1:1);
    ctx.drawImage(img,-c.width/2,-c.height/2,c.width,c.height);
    ctx.restore();
  },[img,brightness,contrast,saturation,rotation,flipH,flipV,filter]);
  useEffect(()=>{if(fileMode==="image") redraw();},[redraw,fileMode]);

  // ── Blank canvas init ──
  const initBlankCanvas=useCallback((w:number,h:number)=>{
    setFileMode("image"); setCanvasDims({w,h});
    setTimeout(()=>{
      const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
      c.width=w; c.height=h; ctx.fillStyle=isDark?"#1a1a2e":"#ffffff"; ctx.fillRect(0,0,w,h);
      const ov=overlayRef.current; if(ov){ov.width=w;ov.height=h;}
    },50);
  },[isDark]);

  // ── Handle dropped/opened file ──
  const handleNewFile=useCallback((f:File)=>{
    setLoadedFile(f); setHistory([]); setFuture([]);
    setCrop({top:0,left:0,right:0,bottom:0});
  },[]);

  // ── History ──
  const saveState=()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setHistory(h=>[...h.slice(-30),ctx.getImageData(0,0,c.width,c.height)]); setFuture([]);
  };
  const undo=useCallback(()=>{
    if(!history.length) return;
    const prev=history[history.length-1];
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setFuture(f=>[ctx.getImageData(0,0,c.width,c.height),...f.slice(0,30)]);
    setHistory(h=>h.slice(0,-1)); ctx.putImageData(prev,0,0);
  },[history]);
  const redo=useCallback(()=>{
    if(!future.length) return;
    const next=future[0];
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setHistory(h=>[...h,ctx.getImageData(0,0,c.width,c.height)]);
    setFuture(f=>f.slice(1)); ctx.putImageData(next,0,0);
  },[future]);

  // ── Color history ──
  const pushColor=useCallback((c:string)=>{
    setColorHistory(prev=>[c,...prev.filter(x=>x!==c)].slice(0,6));
  },[]);

  // ── Canvas coords ──
  const getCoords=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current; if(!c) return{x:0,y:0};
    const r=c.getBoundingClientRect();
    const sx=c.width/r.width,sy=c.height/r.height;
    let cx:number,cy:number;
    if("touches"in e){cx=e.touches[0]?.clientX??0;cy=e.touches[0]?.clientY??0;}
    else{cx=e.clientX;cy=e.clientY;}
    return{x:Math.round((cx-r.left)*sx),y:Math.round((cy-r.top)*sy)};
  };

  // ── Drawing events ──
  const onStart=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    if(cropHandle||mainTool==="crop") return;
    saveState(); const p=getCoords(e);
    isDrawing.current=true; startPos.current=p; lastPos.current=p;
    if(mainTool==="text"&&textInput.trim()){
      const c=canvasRef.current; const ctx=c?.getContext("2d"); if(ctx&&c){
        ctx.save();
        ctx.font=`${italic?"italic ":""}${bold?"bold ":""}${fontSz*2}px ${fontFam},sans-serif`;
        ctx.fillStyle=strokeColor; ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=5;
        ctx.globalAlpha=1; ctx.fillText(textInput,p.x,p.y); ctx.restore();
      }
    }
    if(mainTool==="sticker"){
      const c=canvasRef.current; const ctx=c?.getContext("2d"); if(ctx){
        ctx.save(); ctx.font=`${fontSz*3}px serif`;
        ctx.fillText(selSticker,p.x-fontSz*1.5,p.y+fontSz*1.5); ctx.restore();
      }
    }
  };

  const onMove=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    const p=getCoords(e); setCursorPos(p);
    if(mainTool==="erase") setEraserPos(p); else setEraserPos(null);
    if(!isDrawing.current||cropHandle) return;
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if(!ctx||!lastPos.current||!startPos.current) return;

    switch(mainTool){
      case"pen":
        applyPenStroke(ctx,lastPos.current.x,lastPos.current.y,p.x,p.y,penType,penSize,strokeColor,penOpacity);
        lastPos.current=p; break;
      case"brush":
        applyBrushStroke(ctx,lastPos.current.x,lastPos.current.y,p.x,p.y,brushType,brushSize,strokeColor,brushOpacity);
        lastPos.current=p; break;
      case"erase":
        ctx.save(); ctx.globalCompositeOperation="destination-out";
        ctx.lineWidth=eraserSize*2; ctx.lineCap="round"; ctx.lineJoin="round";
        ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(p.x,p.y); ctx.stroke();
        ctx.restore(); lastPos.current=p; break;
      case"blur":{
        // Apply blur to small circle under cursor
        const r=blurRadius*3;
        const x=Math.max(0,Math.round(p.x-r)),y=Math.max(0,Math.round(p.y-r));
        const bw=Math.min(r*2,c!.width-x),bh=Math.min(r*2,c!.height-y);
        if(bw>0&&bh>0){
          const tmp=document.createElement("canvas"); tmp.width=bw; tmp.height=bh;
          const tc=tmp.getContext("2d"); if(tc){
            tc.filter=`blur(${blurRadius}px)`;
            tc.drawImage(c!,x,y,bw,bh,0,0,bw,bh);
            ctx.drawImage(tmp,x,y);
          }
        }
        lastPos.current=p; break;
      }
      case"shape":{
        const ov=overlayRef.current; const octx=ov?.getContext("2d");
        if(octx&&ov){
          octx.clearRect(0,0,ov.width,ov.height);
          drawShape(octx,shapeType,startPos.current.x,startPos.current.y,p.x,p.y,strokeColor,shapeFill?fillColor:null,shapeLineW);
        }
        break;
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
    setEraserPos(null); if(cropHandle) setCropHandle(null);
  };

  // ── Crop handle drag ──
  const startCropHandle=(h:string,e:React.MouseEvent)=>{
    e.stopPropagation(); setCropHandle(h);
    dragCrop.current={x:e.clientX,y:e.clientY,box:{...crop}};
  };
  useEffect(()=>{
    if(!cropHandle) return;
    const mm=(e:MouseEvent)=>{
      if(!dragCrop.current||!containerRef.current) return;
      const r=containerRef.current.getBoundingClientRect();
      const dx=((e.clientX-dragCrop.current.x)/r.width)*100;
      const dy=((e.clientY-dragCrop.current.y)/r.height)*100;
      const b=dragCrop.current.box;
      setCrop(()=>{
        let{top,left,right,bottom}=b;
        if(cropHandle.includes("n")) top=clamp(b.top+dy,0,80);
        if(cropHandle.includes("s")) bottom=clamp(b.bottom-dy,0,80);
        if(cropHandle.includes("w")) left=clamp(b.left+dx,0,80);
        if(cropHandle.includes("e")) right=clamp(b.right-dx,0,80);
        return{top,left,right,bottom};
      });
    };
    const mu=()=>setCropHandle(null);
    window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu);
    return()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
  },[cropHandle]);

  // ── Close menu on outside click ──
  useEffect(()=>{
    if(!activeMenu) return;
    const h=()=>setActiveMenu(null);
    setTimeout(()=>window.addEventListener("click",h),10);
    return()=>window.removeEventListener("click",h);
  },[activeMenu]);

  // ── Keyboard shortcuts ──
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement) return;
      if(e.ctrlKey||e.metaKey){
        if(e.key==="z"){e.preventDefault();undo();}
        if(e.key==="y"||e.key==="Z"){e.preventDefault();redo();}
        if(e.key==="s"){e.preventDefault();doSave();}
        return;
      }
      switch(e.key.toLowerCase()){
        case"p":setMainTool("pen");break; case"b":setMainTool("brush");break;
        case"e":setMainTool("erase");break; case"t":setMainTool("text");break;
        case"s":setMainTool("shape");break; case"c":setMainTool("crop");break;
        case"u":setMainTool("blur");break;
        case"]": adjustSize(2);break; case"[": adjustSize(-2);break;
        case"=":case"+":setZoom(z=>Math.min(5,+(z+0.1).toFixed(1)));break;
        case"-":setZoom(z=>Math.max(0.1,+(z-0.1).toFixed(1)));break;
        case"0":setZoom(1);break;
      }
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[undo,redo,history,future]);

  const adjustSize=(d:number)=>{
    if(mainTool==="pen") setPenSize(s=>clamp(s+d,1,30));
    if(mainTool==="brush") setBrushSize(s=>clamp(s+d,2,80));
    if(mainTool==="erase") setEraserSize(s=>clamp(s+d,2,80));
    if(mainTool==="blur") setBlurRadius(s=>clamp(s+d,1,30));
  };

  // ── Audio setup ──
  const loadAudio=useCallback((f:File)=>{
    setAudioFile(f); setAudioName(f.name); setAudioLoaded(false); setAudioPlaying(false);
    if(audioElRef.current){audioElRef.current.pause();audioElRef.current=null;}
    const el=new Audio(URL.createObjectURL(f));
    el.volume=audioVol; el.loop=true;
    el.addEventListener("canplaythrough",()=>setAudioLoaded(true));
    audioElRef.current=el;
    // Setup Web Audio for waveform
    const ctx=new AudioContext();
    const src=ctx.createMediaElementSource(el);
    const an=ctx.createAnalyser(); an.fftSize=256;
    const gn=ctx.createGain(); gn.gain.value=audioVol;
    src.connect(gn); gn.connect(an); an.connect(ctx.destination);
    audioCtxRef.current=ctx; analyserRef.current=an; gainRef.current=gn;
    // Draw waveform
    const drawWave=()=>{
      const canvas=waveCanvasRef.current; if(!canvas) return;
      const c=canvas.getContext("2d"); if(!c) return;
      const buf=new Uint8Array(an.frequencyBinCount);
      an.getByteTimeDomainData(buf);
      c.clearRect(0,0,canvas.width,canvas.height);
      c.fillStyle=isDark?"rgba(34,211,238,0.08)":"rgba(99,102,241,0.06)";
      c.fillRect(0,0,canvas.width,canvas.height);
      c.beginPath(); c.strokeStyle=isDark?"#22d3ee":"#6366f1"; c.lineWidth=1.5;
      const sw=canvas.width/buf.length;
      for(let i=0;i<buf.length;i++){
        const y=(buf[i]/128-1)*(canvas.height/2)+canvas.height/2;
        i===0?c.moveTo(i*sw,y):c.lineTo(i*sw,y);
      }
      c.stroke();
      waveRafRef.current=requestAnimationFrame(drawWave);
    };
    el.addEventListener("play",()=>drawWave());
    el.addEventListener("pause",()=>{ if(waveRafRef.current) cancelAnimationFrame(waveRafRef.current); });
  },[audioVol,isDark]);

  const toggleAudio=()=>{
    const el=audioElRef.current; if(!el) return;
    if(audioPlaying){ el.pause(); setAudioPlaying(false); }
    else { audioCtxRef.current?.resume(); el.play(); setAudioPlaying(true); }
  };

  useEffect(()=>{
    if(gainRef.current) gainRef.current.gain.value=audioVol;
    if(audioElRef.current) audioElRef.current.volume=audioVol;
  },[audioVol]);

  // ── Video controls ──
  const toggleVideo=()=>{
    const vid=videoElRef.current; if(!vid) return;
    if(videoPlaying){vid.pause();setVideoPlaying(false);}
    else{
      vid.currentTime=(trimIn/100)*(vid.duration||0);
      vid.play(); setVideoPlaying(true);
    }
  };
  const seekVideo=(pct:number)=>{
    const vid=videoElRef.current; if(!vid) return;
    const t=(pct/100)*vid.duration; vid.currentTime=t; setVideoTime(t);
    const c=canvasRef.current; const ctx=c?.getContext("2d");
    if(ctx&&c) ctx.drawImage(vid,0,0,c.width,c.height);
  };

  // ── Save / Export ──
  const doSave=useCallback(()=>{
    const c=canvasRef.current; if(!c) return; setSaving(true);
    const cx=(crop.left/100)*c.width,cy=(crop.top/100)*c.height;
    const cw=c.width*(1-(crop.left+crop.right)/100),ch=c.height*(1-(crop.top+crop.bottom)/100);
    const out=document.createElement("canvas"); out.width=Math.max(10,cw); out.height=Math.max(10,ch);
    out.getContext("2d")?.drawImage(c,cx,cy,cw,ch,0,0,out.width,out.height);
    out.toBlob(blob=>{
      if(!blob){setSaving(false);return;}
      const name=loadedFile?`edited_${loadedFile.name.replace(/\.[^/.]+$/,"")}.png`:"canvas_studio.png";
      if(onSave) onSave(new File([blob],name,{type:"image/png"}));
      setSaving(false); setSaved(true); setTimeout(()=>setSaved(false),2500);
    },"image/png",0.95);
  },[crop,loadedFile,onSave]);

  const doExport=(fmt:"png"|"jpeg"|"webp")=>{
    const c=canvasRef.current; if(!c) return; setExporting(true);
    setTimeout(()=>{
      const a=document.createElement("a");
      const name=loadedFile?loadedFile.name.replace(/\.[^/.]+$/,""):"canvas_studio";
      a.download=`${name}.${fmt}`; a.href=c.toDataURL(`image/${fmt}`,0.92); a.click();
      setExporting(false);
    },300);
  };

  const doExportVideo=()=>{
    const c=canvasRef.current; const vid=videoElRef.current; if(!c||!vid) return;
    setExporting(true);
    const stream=c.captureStream(30);
    const mr=new MediaRecorder(stream,{mimeType:"video/webm"});
    const chunks:BlobPart[]=[];
    mr.ondataavailable=(e)=>chunks.push(e.data);
    mr.onstop=()=>{
      const blob=new Blob(chunks,{type:"video/webm"});
      const a=document.createElement("a"); a.download="studio_export.webm"; a.href=URL.createObjectURL(blob); a.click();
      setExporting(false);
    };
    mr.start(); vid.currentTime=(trimIn/100)*vid.duration; vid.play(); setVideoPlaying(true);
    const dur=((trimOut-trimIn)/100)*vid.duration;
    setTimeout(()=>{ vid.pause(); setVideoPlaying(false); mr.stop(); },dur*1000+200);
  };

  const clearCanvas=()=>{
    saveState(); const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    ctx.clearRect(0,0,c.width,c.height);
  };
  const resetAdjust=()=>{setBrightness(0);setContrast(0);setSaturation(0);setRotation(0);setFlipH(false);setFlipV(false);setFilter("none");};

  // ── AI actions ──
  const runAutoEnhance=async()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setAiProcessing(true); setAiStatus("Analysing image histogram…");
    await new Promise(r=>setTimeout(r,600));
    const img2=ctx.getImageData(0,0,c.width,c.height);
    const {brightness:b,contrast:co,saturation:s}=aiAutoEnhance(img2);
    setBrightness(b); setContrast(co); setSaturation(s);
    setAiStatus(`✨ Enhanced: +${b} brightness, +${co} contrast`);
    setAiProcessing(false); setTimeout(()=>setAiStatus(""),3000);
  };

  const runExtractPalette=async()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setAiProcessing(true); setAiStatus("Extracting colour palette…");
    await new Promise(r=>setTimeout(r,800));
    const pal=aiExtractPalette(ctx.getImageData(0,0,c.width,c.height),6);
    setAiPalette(pal); setAiStatus("🎨 Palette extracted!");
    setAiProcessing(false); setTimeout(()=>setAiStatus(""),4000);
  };

  const runBgRemoval=async()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setAiProcessing(true); setAiStatus("Removing background…"); saveState();
    await new Promise(r=>setTimeout(r,800));
    aiBgRemoval(ctx,c.width,c.height,40);
    setAiStatus("✂️ Background removed! Export as PNG to preserve transparency.");
    setAiProcessing(false); setTimeout(()=>setAiStatus(""),5000);
  };

  const runNoiseReduction=async()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setAiProcessing(true); setAiStatus("Reducing noise…"); saveState();
    await new Promise(r=>setTimeout(r,600));
    aiNoiseReduction(ctx,c.width,c.height);
    setAiStatus("🔇 Noise reduced!"); setAiProcessing(false); setTimeout(()=>setAiStatus(""),3000);
  };

  const runVignette=()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    saveState(); aiVignette(ctx,c.width,c.height,0.65);
    setAiStatus("🎞️ Vignette applied!"); setTimeout(()=>setAiStatus(""),3000);
  };

  // ── Cursor ──
  const getCursor=()=>{
    if(mainTool==="pen") return PEN_CURSOR;
    if(mainTool==="erase") return"none";
    if(mainTool==="text") return"text";
    if(mainTool==="blur") return"cell";
    if(fileMode==="video") return"default";
    return"crosshair";
  };

  // ── Crop handles ──
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

  // ── Feature gate helpers ──
  const isImage=fileMode==="image";
  const isVideo=fileMode==="video";
  const hasFile=fileMode!=="none";
  const drawingEnabled=isImage;

  // ── Section helper ──
  const sec=(title:string,children:React.ReactNode)=>(
    <div style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
      <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>{title}</div>
      {children}
    </div>
  );
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
  const colorHistRow=colorHistory.length>0?(
    <div style={{display:"flex",gap:"3px",marginBottom:"7px",alignItems:"center"}}>
      <span style={{fontSize:"8px",color:V("text-faint"),marginRight:"2px"}}>Recent:</span>
      {colorHistory.map((c,i)=>(
        <button key={i} onClick={()=>setStrokeColor(c)}
          style={{width:"14px",height:"14px",borderRadius:"3px",background:c,cursor:"pointer",flexShrink:0,outline:"none",
                  border:strokeColor===c?"2px solid #22d3ee":"1px solid rgba(128,128,128,0.2)"}}/>
      ))}
    </div>
  ):null;

  // ── Tool sub-menu ──
  const renderToolSub=()=>{
    if(!toolSubOpen||!drawingEnabled) return null;
    let pills:React.ReactNode=null;
    if(mainTool==="pen") pills=(
      <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
        {PEN_TYPES.map(({id,label,emoji})=>(
          <button key={id} onClick={()=>setPenType(id)}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 8px",borderRadius:"7px",border:"none",cursor:"pointer",
                    fontSize:"11px",fontWeight:600,textAlign:"left",
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
          <button key={id} onClick={()=>setBrushType(id)}
            style={{display:"flex",alignItems:"center",gap:"6px",padding:"5px 8px",borderRadius:"7px",border:"none",cursor:"pointer",
                    fontSize:"11px",fontWeight:600,textAlign:"left",
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
            style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",padding:"6px 4px",borderRadius:"7px",
                    border:"none",cursor:"pointer",fontSize:"9px",fontWeight:600,
                    background:shapeType===id?"linear-gradient(135deg,#7c3aed,#db2777)":V("hover"),
                    color:shapeType===id?"#fff":V("text-muted"),transition:"all .12s"}}>
            {icon}{label}
          </button>
        ))}
      </div>
    );
    if(mainTool==="sticker") pills=(
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"2px"}}>
        {STICKERS.map(s=>(
          <button key={s} onClick={()=>setSelSticker(s)}
            style={{fontSize:"18px",padding:"4px",borderRadius:"6px",border:"none",cursor:"pointer",
                    background:selSticker===s?"rgba(99,102,241,0.2)":"transparent",
                    outline:selSticker===s?"2px solid #6366f1":"none"}}>
            {s}
          </button>
        ))}
      </div>
    );
    if(!pills) return null;
    return(
      <div className="ce-tool-submenu">{pills}</div>
    );
  };

  // ── Tool detail panel ──
  const renderToolPanel=()=>{
    if(!drawingEnabled&&mainTool!=="crop") return(
      <div style={{padding:"12px",textAlign:"center"}}>
        <Film size={24} color="#f97316" style={{margin:"0 auto 8px"}}/>
        <p style={{fontSize:"10px",color:V("text-faint"),lineHeight:1.6}}>
          Drawing tools are disabled in video mode. Use the video timeline below to trim and export.
        </p>
      </div>
    );

    const sizeSection=(label:string,val:number,set:(v:number)=>void,min:number,max:number,col:string)=>sec(label,(
      <>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
          <span style={{fontSize:"9px",color:V("text-dim")}}>Size</span>
          <span style={{fontSize:"10px",fontFamily:"monospace",color:col,fontWeight:700}}>{val}px</span>
        </div>
        <input type="range" min={min} max={max} value={val} onChange={e=>set(Number(e.target.value))}
          style={{width:"100%",accentColor:col}}/>
      </>
    ));

    if(mainTool==="pen") return(<>{sizeSection("Pen Size",penSize,setPenSize,1,30,"#22d3ee")}{sec("Opacity",(
      <>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
          <span style={{fontSize:"9px",color:V("text-dim")}}>Opacity</span>
          <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{Math.round(penOpacity*100)}%</span>
        </div>
        <input type="range" min={10} max={100} value={Math.round(penOpacity*100)}
          onChange={e=>setPenOpacity(Number(e.target.value)/100)} style={{width:"100%",accentColor:"#22d3ee"}}/>
      </>
    ))}{sec("Color",<>{colorHistRow}{colorRow}{customColor}</>)}</>);

    if(mainTool==="brush") return(<>{sizeSection("Brush Size",brushSize,setBrushSize,2,80,"#06b6d4")}{sec("Opacity",(
      <>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
          <span style={{fontSize:"9px",color:V("text-dim")}}>Opacity</span>
          <span style={{fontSize:"10px",fontFamily:"monospace",color:"#06b6d4",fontWeight:700}}>{Math.round(brushOpacity*100)}%</span>
        </div>
        <input type="range" min={5} max={100} value={Math.round(brushOpacity*100)}
          onChange={e=>setBrushOpacity(Number(e.target.value)/100)} style={{width:"100%",accentColor:"#06b6d4"}}/>
      </>
    ))}{sec("Color",<>{colorHistRow}{colorRow}{customColor}</>)}</>);

    if(mainTool==="shape") return(<>{sec("Stroke",<>{colorHistRow}{colorRow}{customColor}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
        <span style={{fontSize:"9px",color:V("text-dim")}}>Line Width</span>
        <span style={{fontSize:"10px",fontFamily:"monospace",color:"#a855f7",fontWeight:700}}>{shapeLineW}px</span>
      </div>
      <input type="range" min={1} max={20} value={shapeLineW} onChange={e=>setShapeLineW(Number(e.target.value))}
        style={{width:"100%",accentColor:"#a855f7"}}/>
    </>)}{sec("Fill",(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px"}}>
          <span style={{fontSize:"10px",color:V("text-muted")}}>Enable Fill</span>
          <button onClick={()=>setShapeFill(f=>!f)}
            style={{width:"36px",height:"20px",borderRadius:"10px",border:"none",cursor:"pointer",position:"relative",transition:"all .2s",
                    background:shapeFill?"linear-gradient(135deg,#7c3aed,#db2777)":"rgba(128,128,128,0.15)"}}>
            <div style={{position:"absolute",top:"2px",left:shapeFill?"16px":"2px",width:"16px",height:"16px",borderRadius:"50%",background:"#fff",transition:"all .2s"}}/>
          </button>
        </div>
        {shapeFill&&(
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:"4px"}}>
            {COLORS.map(c=>(
              <button key={c} onClick={()=>setFillColor(c+"88")}
                style={{aspectRatio:"1",borderRadius:"4px",background:c,cursor:"pointer",outline:"none",
                        border:fillColor.startsWith(c)?"2px solid #a855f7":"1px solid rgba(128,128,128,0.2)"}}/>
            ))}
          </div>
        )}
      </div>
    ))}</>);

    if(mainTool==="erase") return(<>{sizeSection("Eraser Size",eraserSize,setEraserSize,2,80,"#f87171")}</>);
    if(mainTool==="blur") return(<>{sizeSection("Blur Radius",blurRadius,setBlurRadius,1,30,"#06b6d4")}
      {sec("Info",<p style={{fontSize:"9px",color:V("text-faint"),lineHeight:1.6}}>Paint over the image to apply a blur effect. Use [ ] keys to adjust strength.</p>)}</>);

    if(mainTool==="text") return(<>
      {sec("Text",(
        <>
          <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
            placeholder="Type text, then click canvas…" rows={3}
            style={{width:"100%",borderRadius:"7px",padding:"7px",fontSize:"11px",color:V("text"),
                    background:V("input-bg"),border:`1px solid ${V("border")}`,outline:"none",resize:"none",fontFamily:"inherit",marginBottom:"6px"}}/>
          <div style={{display:"flex",gap:"5px"}}>
            <button onClick={()=>setBold(b=>!b)}
              style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:900,
                      background:bold?"linear-gradient(135deg,#2563eb,#7c3aed)":V("hover"),color:bold?"#fff":V("text-muted")}}>B</button>
            <button onClick={()=>setItalic(i=>!i)}
              style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"12px",fontStyle:"italic",fontWeight:700,
                      background:italic?"linear-gradient(135deg,#2563eb,#7c3aed)":V("hover"),color:italic?"#fff":V("text-muted")}}>I</button>
          </div>
        </>
      ))}
      {sec("Font",(
        <>
          <select value={fontFam} onChange={e=>setFontFam(e.target.value)}
            style={{width:"100%",background:V("input-bg"),border:`1px solid ${V("border")}`,borderRadius:"6px",color:V("text"),fontSize:"11px",padding:"5px",outline:"none",marginBottom:"6px"}}>
            {["Inter","Outfit","Roboto","Georgia","Arial","Courier New","Impact"].map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
            <span style={{fontSize:"9px",color:V("text-dim")}}>Size</span>
            <span style={{fontSize:"10px",fontFamily:"monospace",color:"#22d3ee",fontWeight:700}}>{fontSz}px</span>
          </div>
          <input type="range" min={8} max={120} value={fontSz} onChange={e=>setFontSz(Number(e.target.value))}
            style={{width:"100%",accentColor:"#22d3ee"}}/>
        </>
      ))}
      {sec("Color",<>{colorHistRow}{colorRow}{customColor}</>)}
    </>);

    if(mainTool==="sticker") return sec("Click to Place Sticker",<p style={{fontSize:"10px",color:V("text-faint"),lineHeight:1.6}}>Select an emoji above, then click anywhere on the canvas to place it. Adjust font size for scale.</p>);

    if(mainTool==="crop") return(
      <>{sec("Crop Region",(
        <>
          <p style={{fontSize:"10px",color:V("text-dim"),lineHeight:1.6,marginBottom:"8px"}}>Drag the 8 handles on the canvas to define your crop region.</p>
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
            style={{width:"100%",padding:"7px",borderRadius:"7px",cursor:"pointer",background:V("hover"),
                    border:`1px solid ${V("border")}`,color:V("text-muted"),fontSize:"11px",fontWeight:600}}>
            Reset Crop
          </button>
        </>
      ))}</>
    );
    return null;
  };

  // ══════════════════════════════════════════════════════════
  // SHOW NO-FILE SCREEN
  // ══════════════════════════════════════════════════════════
  if(fileMode==="none") return(
    <>
      {wtActive&&<WalkthroughOverlay idx={wtIdx} steps={WT_STEPS} isDark={isDark}
        onNext={()=>setWtIdx(i=>Math.min(i+1,WT_STEPS.length-1))}
        onPrev={()=>setWtIdx(i=>Math.max(i-1,0))}
        onSkip={finishTour}/>}
      <NoFileScreen isDark={isDark} onFileLoaded={handleNewFile} onBlankCanvas={initBlankCanvas}
        onShowTour={()=>{setWtActive(true);setWtIdx(0);}}/>
    </>
  );

  // ══════════════════════════════════════════════════════════
  // MINIMIZED BUBBLE
  // ══════════════════════════════════════════════════════════
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
        Expand
      </button>
      {portalMode&&onCancel&&(
        <button onClick={onCancel}
          style={{padding:"4px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",
                  borderRadius:"6px",color:"#f87171",cursor:"pointer",display:"flex"}}>
          <X size={13}/>
        </button>
      )}
    </div>
  );

  /* ════════════════════════════════════════════════════════
     FULL STUDIO RENDER
  ════════════════════════════════════════════════════════ */
  return(
    <div id="ff-studio-root" style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,width:"100vw",height:"100vh",
      zIndex:2147483647,display:"flex",flexDirection:"column",overflow:"hidden",
      background:V("bg"),color:V("text"),fontFamily:"'Inter',system-ui,sans-serif",
      margin:0,padding:0,
    }}>
      {/* Loading overlays */}
      {imgLoading&&<BrandLoader message="Loading file…" subMessage={loadedFile?.name} theme={theme}/>}
      {saving&&<BrandLoader message="Saving changes…" theme={theme}/>}
      {exporting&&<BrandLoader message="Exporting…" subMessage="Preparing download" theme={theme}/>}
      {aiProcessing&&<BrandLoader message={aiStatus||"AI processing…"} subMessage="Just a moment…" theme={theme}/>}

      {/* Walkthrough */}
      {wtActive&&<WalkthroughOverlay idx={wtIdx} steps={WT_STEPS} isDark={isDark}
        onNext={()=>setWtIdx(i=>Math.min(i+1,WT_STEPS.length-1))}
        onPrev={()=>setWtIdx(i=>Math.max(i-1,0))}
        onSkip={finishTour}/>}

      {/* ── MENU BAR ─────────────────────────────────────── */}
      <div style={{flexShrink:0,height:"28px",background:V("panel"),borderBottom:`1px solid ${V("border")}`,
                   display:"flex",alignItems:"center",paddingLeft:"8px",gap:"2px",fontSize:"12px"}}>
        {/* Brand */}
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
          {isVideo&&<span style={{padding:"1px 6px",borderRadius:"4px",fontSize:"9px",fontWeight:700,background:"rgba(249,115,22,0.2)",color:"#f97316",border:"1px solid rgba(249,115,22,0.3)"}}>VIDEO</span>}
        </div>

        {/* Menu items */}
        {(["file","edit","view","image","filter","ai","help"] as MenuKey[]).map(mk=>{
          const labels:Record<string,string>={file:"File",edit:"Edit",view:"View",image:"Image",filter:"Filter",ai:"AI",help:"Help"};
          const isOpen=activeMenu===mk;
          return(
            <div key={mk as string} style={{position:"relative"}}>
              <button onClick={e=>{e.stopPropagation();setActiveMenu(isOpen?null:mk as MenuKey);}}
                style={{padding:"3px 8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:500,borderRadius:"5px",
                        background:isOpen?"rgba(99,102,241,0.15)":"transparent",
                        color:isOpen?"#a5b4fc":V("text-muted"),transition:"all .1s"}}>
                {labels[mk as string]}
              </button>
              {isOpen&&(
                <div className="ce-dropdown-menu" onClick={e=>e.stopPropagation()}>
                  {mk==="file"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept="image/*,video/*";inp.onchange=e=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) handleNewFile(f); };inp.click();setActiveMenu(null);}}>
                      <Upload size={12} color="#22d3ee"/> Open File…
                    </button>
                    <div className="ce-dropdown-separator"/>
                    {isImage&&<>
                      <button className="ce-dropdown-item" onClick={()=>{doExport("png");setActiveMenu(null);}}>
                        <FileDown size={12} color="#06b6d4"/> Export PNG
                      </button>
                      <button className="ce-dropdown-item" onClick={()=>{doExport("jpeg");setActiveMenu(null);}}>
                        <FileDown size={12} color="#f97316"/> Export JPEG
                      </button>
                      <button className="ce-dropdown-item" onClick={()=>{doExport("webp");setActiveMenu(null);}}>
                        <FileDown size={12} color="#a855f7"/> Export WebP
                      </button>
                    </>}
                    {isVideo&&(
                      <button className="ce-dropdown-item" onClick={()=>{doExportVideo();setActiveMenu(null);}}>
                        <Film size={12} color="#f97316"/> Export Video (.webm)
                      </button>
                    )}
                    <div className="ce-dropdown-separator"/>
                    {portalMode&&onCancel&&(
                      <button className="ce-dropdown-item" onClick={()=>{onCancel();setActiveMenu(null);}}>
                        <X size={12} color="#f87171"/> Close Editor
                      </button>
                    )}
                  </>}
                  {mk==="edit"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{undo();setActiveMenu(null);}} style={{opacity:history.length?1:0.35}}>
                      <Undo2 size={12} color="#22d3ee"/> Undo <span className="ce-dropdown-shortcut">Ctrl+Z</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{redo();setActiveMenu(null);}} style={{opacity:future.length?1:0.35}}>
                      <Redo2 size={12} color="#22d3ee"/> Redo <span className="ce-dropdown-shortcut">Ctrl+Y</span>
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{clearCanvas();setActiveMenu(null);}}>
                      <Trash2 size={12} color="#f87171"/> Clear Canvas
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{resetAdjust();setActiveMenu(null);}}>
                      <RefreshCw size={12} color="#94a3b8"/> Reset Adjustments
                    </button>
                  </>}
                  {mk==="view"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{setZoom(z=>Math.min(5,+(z+0.25).toFixed(2)));setActiveMenu(null);}}>
                      <ZoomIn size={12} color="#22d3ee"/> Zoom In <span className="ce-dropdown-shortcut">+</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setZoom(z=>Math.max(0.1,+(z-0.25).toFixed(2)));setActiveMenu(null);}}>
                      <ZoomOut size={12} color="#22d3ee"/> Zoom Out <span className="ce-dropdown-shortcut">-</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setZoom(1);setActiveMenu(null);}}>
                      <Maximize2 size={12} color="#94a3b8"/> Fit 100% <span className="ce-dropdown-shortcut">0</span>
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{setShowGrid(g=>!g);setActiveMenu(null);}}>
                      <Grid size={12} color={showGrid?"#22d3ee":"#94a3b8"}/>{showGrid?"✓ ":""}Show Grid
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setShowInfoBar(b=>!b);setActiveMenu(null);}}>
                      <Info size={12} color={showInfoBar?"#22d3ee":"#94a3b8"}/>{showInfoBar?"✓ ":""}Info Bar
                    </button>
                  </>}
                  {mk==="image"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{setRotation(r=>(r+90)%360);setActiveMenu(null);}}>
                      <RotateCw size={12} color="#22d3ee"/> Rotate 90° CW
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setRotation(r=>(r-90+360)%360);setActiveMenu(null);}}>
                      <RotateCcw size={12} color="#22d3ee"/> Rotate 90° CCW
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" onClick={()=>{setFlipH(f=>!f);setActiveMenu(null);}}>
                      <FlipHorizontal size={12} color={flipH?"#22d3ee":"#94a3b8"}/>{flipH?"✓ ":""}Flip Horizontal
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{setFlipV(f=>!f);setActiveMenu(null);}}>
                      <FlipVertical size={12} color={flipV?"#22d3ee":"#94a3b8"}/>{flipV?"✓ ":""}Flip Vertical
                    </button>
                  </>}
                  {mk==="filter"&&<>
                    {FILTERS.map(({value,label,emoji})=>(
                      <button key={value} className="ce-dropdown-item" onClick={()=>{setFilter(value);setActiveMenu(null);}}>
                        {emoji} {label}{filter===value&&<Check size={10} style={{marginLeft:"auto"}} color="#22d3ee"/>}
                      </button>
                    ))}
                  </>}
                  {mk==="ai"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{runAutoEnhance();setActiveMenu(null);}}>
                      <Wand2 size={12} color="#a855f7"/> Auto Enhance
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{runExtractPalette();setActiveMenu(null);}}>
                      <Palette size={12} color="#f472b6"/> Extract Palette
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{runBgRemoval();setActiveMenu(null);}}>
                      <Focus size={12} color="#22d3ee"/> Remove Background
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{runNoiseReduction();setActiveMenu(null);}}>
                      <Waves size={12} color="#06b6d4"/> Noise Reduction
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{runVignette();setActiveMenu(null);}}>
                      <Blend size={12} color="#6366f1"/> Apply Vignette
                    </button>
                  </>}
                  {mk==="help"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{setWtIdx(0);setWtActive(true);setActiveMenu(null);}}>
                      <HelpCircle size={12} color="#6366f1"/> Start Tour
                    </button>
                    <div className="ce-dropdown-separator"/>
                    <button className="ce-dropdown-item" style={{cursor:"default",opacity:.6}}>
                      <Info size={12}/> Keyboard Shortcuts: P=Pen, B=Brush, E=Eraser, T=Text, S=Shapes, U=Blur, C=Crop, 0=Fit
                    </button>
                  </>}
                </div>
              )}
            </div>
          );
        })}
        {/* Right side of menu bar */}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"6px",paddingRight:"8px",fontSize:"10px",color:V("text-faint")}}>
          <span style={{fontFamily:"monospace"}}>{canvasDims.w}×{canvasDims.h}</span>
          <span>·</span>
          <span>{loadedFile?loadedFile.name.slice(0,22)+(loadedFile.name.length>22?"…":""):"Blank Canvas"}</span>
        </div>
      </div>

      {/* ── TOOLBAR ──────────────────────────────────────── */}
      <div style={{flexShrink:0,height:"44px",background:V("panel"),borderBottom:`1px solid ${V("border")}`,
                   display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px",gap:"6px"}}>
        {/* Left: active tool badge + sliders */}
        <div style={{display:"flex",alignItems:"center",gap:"6px",flex:1,minWidth:0,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:"4px",padding:"3px 8px",borderRadius:"6px",flexShrink:0,
                       background:`rgba(${mainTool==="pen"?"59,130,246":mainTool==="brush"?"6,182,212":mainTool==="shape"?"168,85,247":mainTool==="erase"?"239,68,68":mainTool==="text"?"234,179,8":mainTool==="blur"?"6,182,212":mainTool==="sticker"?"168,85,247":"249,115,22"},0.15)`,
                       border:`1px solid rgba(${mainTool==="pen"?"59,130,246":mainTool==="brush"?"6,182,212":mainTool==="shape"?"168,85,247":mainTool==="erase"?"239,68,68":mainTool==="text"?"234,179,8":mainTool==="blur"?"6,182,212":mainTool==="sticker"?"168,85,247":"249,115,22"},0.3)`}}>
            {mainTool==="pen"&&<Pencil size={10} color="#3b82f6"/>}
            {mainTool==="brush"&&<Paintbrush size={10} color="#06b6d4"/>}
            {mainTool==="shape"&&<Square size={10} color="#a855f7"/>}
            {mainTool==="erase"&&<Eraser size={10} color="#ef4444"/>}
            {mainTool==="text"&&<Type size={10} color="#eab308"/>}
            {mainTool==="blur"&&<Blend size={10} color="#06b6d4"/>}
            {mainTool==="sticker"&&<Smile size={10} color="#a855f7"/>}
            {mainTool==="crop"&&<Crop size={10} color="#f97316"/>}
            <span style={{fontSize:"10px",fontWeight:700,textTransform:"capitalize",
              color:`${mainTool==="pen"?"#3b82f6":mainTool==="brush"?"#06b6d4":mainTool==="shape"?"#a855f7":mainTool==="erase"?"#ef4444":mainTool==="text"?"#eab308":mainTool==="blur"?"#06b6d4":mainTool==="sticker"?"#a855f7":"#f97316"}`}}>
              {mainTool}{mainTool==="pen"?` · ${penType}`:mainTool==="brush"?` · ${brushType}`:mainTool==="shape"?` · ${shapeType}`:""}
            </span>
          </div>
          {/* Size slider */}
          {["pen","brush","erase","blur"].includes(mainTool)&&drawingEnabled&&(
            <div style={{display:"flex",alignItems:"center",gap:"5px",flexShrink:0}}>
              <span style={{fontSize:"9px",color:V("text-dim")}}>Size:</span>
              <input type="range" min={mainTool==="pen"?1:2} max={mainTool==="pen"?30:80}
                value={mainTool==="pen"?penSize:mainTool==="brush"?brushSize:mainTool==="blur"?blurRadius:eraserSize}
                onChange={e=>{const v=Number(e.target.value);if(mainTool==="pen")setPenSize(v);else if(mainTool==="brush")setBrushSize(v);else if(mainTool==="blur")setBlurRadius(v);else setEraserSize(v);}}
                style={{width:"80px",accentColor:"#22d3ee",cursor:"pointer"}}/>
              <span style={{fontSize:"9px",fontFamily:"monospace",color:"#22d3ee",minWidth:"24px"}}>
                {mainTool==="pen"?penSize:mainTool==="brush"?brushSize:mainTool==="blur"?blurRadius:eraserSize}px
              </span>
            </div>
          )}
          {/* Active color dot */}
          {["pen","brush","shape","text"].includes(mainTool)&&drawingEnabled&&(
            <label style={{display:"flex",alignItems:"center",gap:"4px",cursor:"pointer",flexShrink:0}}>
              <div style={{width:"16px",height:"16px",borderRadius:"50%",background:strokeColor,border:`2px solid ${V("border-2")}`,flexShrink:0}}/>
              <input type="color" value={strokeColor} onChange={e=>{setStrokeColor(e.target.value);pushColor(e.target.value);}}
                style={{width:"0",height:"0",opacity:0,position:"absolute",pointerEvents:"none"}}/>
            </label>
          )}
          {/* Video mode indicator */}
          {isVideo&&(
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <Film size={12} color="#f97316"/>
              <span style={{fontSize:"10px",color:"#f97316",fontWeight:600}}>Video Mode</span>
              <span style={{fontSize:"10px",color:V("text-faint")}}>· Add text, apply filters, then export</span>
            </div>
          )}
        </div>
        {/* Right: undo/redo/save/export/controls */}
        <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
          <button onClick={undo} disabled={!history.length} title="Undo (Ctrl+Z)"
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:history.length?V("hover"):"transparent",border:`1px solid ${V("border")}`,
                    color:history.length?V("text-muted"):V("text-faint"),cursor:history.length?"pointer":"default",fontSize:"11px",fontWeight:600}}>
            <Undo2 size={12}/> Undo
          </button>
          <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)"
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:future.length?V("hover"):"transparent",border:`1px solid ${V("border")}`,
                    color:future.length?V("text-muted"):V("text-faint"),cursor:future.length?"pointer":"default",fontSize:"11px",fontWeight:600}}>
            <Redo2 size={12}/> Redo
          </button>
          {isImage&&<button onClick={()=>doExport("png")}
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:V("hover"),border:`1px solid ${V("border")}`,color:V("text-muted"),cursor:"pointer",fontSize:"11px",fontWeight:600}}>
            <Download size={12}/> Export
          </button>}
          {isVideo&&<button onClick={doExportVideo}
            style={{display:"flex",alignItems:"center",gap:"3px",padding:"5px 8px",borderRadius:"6px",
                    background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.3)",color:"#f97316",cursor:"pointer",fontSize:"11px",fontWeight:600}}>
            <Film size={12}/> Export Video
          </button>}
          {isImage&&<button onClick={doSave}
            style={{display:"flex",alignItems:"center",gap:"4px",padding:"5px 14px",borderRadius:"7px",border:"none",color:"#fff",cursor:"pointer",fontSize:"12px",fontWeight:700,
                    background:saved?"linear-gradient(135deg,#16a34a,#15803d)":"linear-gradient(135deg,#2563eb,#7c3aed)",
                    boxShadow:saved?"0 0 14px rgba(22,163,74,0.4)":"0 0 14px rgba(99,102,241,0.3)",transition:"all .3s"}}>
            {saved?<><Star size={11} fill="#fff"/> Saved!</>:<><Check size={11}/> Save</>}
          </button>}
          <button onClick={()=>setMaximized(false)} title="Minimize"
            style={{padding:"5px",borderRadius:"6px",background:V("hover"),border:`1px solid ${V("border")}`,color:V("text-dim"),cursor:"pointer",display:"flex"}}>
            <Minimize2 size={14}/>
          </button>
          {portalMode&&onCancel&&(
            <button onClick={onCancel}
              style={{padding:"5px",borderRadius:"6px",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",color:"#f87171",cursor:"pointer",display:"flex"}}>
              <X size={14}/>
            </button>
          )}
        </div>
      </div>

      {/* ── INFO BAR ─────────────────────────────────────── */}
      {showInfoBar&&(
        <div style={{flexShrink:0,height:"24px",background:V("infobar-bg"),borderBottom:`1px solid ${V("infobar-border")}`,
                     display:"flex",alignItems:"center",paddingLeft:"8px",gap:"10px",fontSize:"10px",color:V("text-dim")}}>
          {isVideo?<><Film size={9} color="#f97316"/><span style={{color:"#f97316",fontWeight:600}}>Video</span></>
                  :<><ImageIcon size={9} color="#22d3ee"/><span style={{color:"#22d3ee",fontWeight:600}}>Image</span></>}
          <span>·</span>
          <span>{canvasDims.w}<span style={{color:V("text-faint")}}>×</span>{canvasDims.h}px</span>
          <span>·</span>
          <span style={{color:"#22d3ee",fontFamily:"monospace"}}>{Math.round(zoom*100)}%</span>
          {isImage&&<><span>·</span><span style={{fontFamily:"monospace",color:V("text-faint")}}>{cursorPos.x},{cursorPos.y}</span></>}
          {isVideo&&<><span>·</span><span style={{fontFamily:"monospace",color:"#f97316"}}>{videoTime.toFixed(1)}s / {videoDur.toFixed(1)}s</span></>}
          {aiStatus&&<><span>·</span><span style={{color:"#a855f7",fontWeight:600}}>{aiStatus}</span></>}
          <span style={{marginLeft:"auto",paddingRight:"8px",display:"flex",alignItems:"center",gap:"8px"}}>
            {audioFile&&<span style={{color:"#22c55e",fontWeight:600,display:"flex",alignItems:"center",gap:"3px"}}><Music size={9}/> {audioName.slice(0,20)}{audioName.length>20?"…":""}</span>}
            <span style={{color:V("text-faint")}}>{history.length}/30 steps</span>
          </span>
        </div>
      )}

      {/* ── BODY ─────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* ── LEFT SIDEBAR ─────────────────────────────── */}
        <div style={{flexShrink:0,width:"170px",background:V("panel"),borderRight:`1px solid ${V("border")}`,
                     display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}} className="ff-sidebar-l">
          {/* Tool buttons */}
          <div style={{flexShrink:0,padding:"8px 8px 0",display:"flex",flexDirection:"column",gap:"2px",position:"relative"}}>
            {([
              {id:"pen",    icon:<Pencil    size={14}/>, label:"Pen",     color:"#3b82f6", disabled:!drawingEnabled},
              {id:"brush",  icon:<Paintbrush size={14}/>,label:"Brush",   color:"#06b6d4", disabled:!drawingEnabled},
              {id:"shape",  icon:<Square    size={14}/>, label:"Shapes",  color:"#a855f7", disabled:!drawingEnabled},
              {id:"erase",  icon:<Eraser    size={14}/>, label:"Eraser",  color:"#ef4444", disabled:!drawingEnabled},
              {id:"text",   icon:<Type      size={14}/>, label:"Text",    color:"#eab308", disabled:!hasFile},
              {id:"crop",   icon:<Crop      size={14}/>, label:"Crop",    color:"#f97316", disabled:!isImage},
              {id:"blur",   icon:<Blend     size={14}/>, label:"Blur",    color:"#06b6d4", disabled:!drawingEnabled},
              {id:"sticker",icon:<Smile     size={14}/>, label:"Sticker", color:"#a855f7", disabled:!drawingEnabled},
            ] as {id:MainTool;icon:React.ReactNode;label:string;color:string;disabled:boolean}[]).map(({id,icon,label,color,disabled})=>(
              <button key={id}
                disabled={disabled}
                onClick={()=>{if(mainTool===id){setToolSubOpen(o=>!o);}else{setMainTool(id);setToolSubOpen(true);}}}
                title={disabled?"Not available for this file type":label}
                style={{width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"7px 9px",borderRadius:"8px",border:"none",
                        cursor:disabled?"not-allowed":"pointer",fontSize:"12px",fontWeight:600,textAlign:"left",transition:"all .15s",
                        background:mainTool===id?`${color}22`:"transparent",
                        borderLeft:mainTool===id?`3px solid ${color}`:"3px solid transparent",
                        color:mainTool===id?color:disabled?V("text-faint"):V("text-dim"),
                        opacity:disabled?.45:1}}>
                <span style={{color:disabled?V("text-faint"):color}}>{icon}</span>
                {label}
                {mainTool===id&&!disabled&&<ChevronDown size={9} style={{marginLeft:"auto",transform:toolSubOpen?"rotate(180deg)":"rotate(0)",transition:"transform .15s"}} color={color}/>}
              </button>
            ))}
            {/* Tool submenu */}
            {renderToolSub()}
          </div>

          <div style={{height:"1px",background:V("border"),margin:"6px 8px"}}/>

          {/* Tool detail panel */}
          <div className="ce-panel-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>
            {renderToolPanel()}
          </div>

          {/* Zoom */}
          <div style={{flexShrink:0,padding:"8px",borderTop:`1px solid ${V("border")}`}}>
            <div style={{display:"flex",alignItems:"center",gap:"2px",background:isDark?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.06)",borderRadius:"7px",padding:"2px"}}>
              <button onClick={()=>setZoom(z=>Math.max(0.1,+(z-0.1).toFixed(1)))}
                style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",padding:"4px",display:"flex"}}><ZoomOut size={12}/></button>
              <span style={{flex:1,textAlign:"center",fontSize:"10px",fontFamily:"monospace",fontWeight:700,color:"#22d3ee"}}>{Math.round(zoom*100)}%</span>
              <button onClick={()=>setZoom(z=>Math.min(5,+(z+0.1).toFixed(1)))}
                style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",padding:"4px",display:"flex"}}><ZoomIn size={12}/></button>
              <button onClick={()=>setZoom(1)}
                style={{background:"none",border:"none",color:V("text-faint"),cursor:"pointer",padding:"4px",display:"flex"}}><Maximize2 size={10}/></button>
            </div>
            {/* Open new file mini button */}
            <button onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept="image/*,video/*";inp.onchange=e=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)handleNewFile(f);};inp.click();}}
              style={{width:"100%",marginTop:"6px",padding:"5px",borderRadius:"6px",border:`1px solid ${V("border")}`,
                      background:V("hover"),color:V("text-dim"),cursor:"pointer",fontSize:"10px",fontWeight:600,
                      display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}>
              <PlusCircle size={11}/> Open File
            </button>
          </div>
        </div>

        {/* ── CANVAS CENTER ────────────────────────────── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <div ref={containerRef}
            style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
                    overflow:"hidden",
                    backgroundImage:showGrid
                      ?"radial-gradient(circle,rgba(99,102,241,0.25) 1px,transparent 1px)"
                      :`linear-gradient(${V("border")} 1px,transparent 1px),linear-gradient(90deg,${V("border")} 1px,transparent 1px)`,
                    backgroundSize:"20px 20px",backgroundColor:V("canvas-area")}}>

            {/* Drag new file onto canvas */}
            <div style={{position:"absolute",inset:0,zIndex:1,pointerEvents:"auto"}} hidden
              onDragOver={e=>{ if(e.dataTransfer.types.includes("Files")){e.preventDefault();} }}
              onDrop={e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)handleNewFile(f);}}
            />

            {/* Zoom wrapper */}
            <div style={{position:"relative",display:"inline-block",transform:`scale(${zoom})`,transformOrigin:"center center",transition:"transform .1s",userSelect:"none"}}>
              <canvas ref={canvasRef}
                onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
                onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
                style={{display:"block",borderRadius:"4px",border:`1px solid ${V("border-2")}`,
                        boxShadow:`0 0 40px rgba(0,0,0,${isDark?.9:.15})`,
                        cursor:getCursor(),maxWidth:"100%",maxHeight:"calc(100vh - 200px)",touchAction:"none"}}/>
              <canvas ref={overlayRef}
                style={{position:"absolute",top:0,left:0,pointerEvents:"none",borderRadius:"4px",maxWidth:"100%",maxHeight:"calc(100vh - 200px)"}}/>
              {/* Eraser cursor */}
              {mainTool==="erase"&&eraserPos&&(()=>{
                const c=canvasRef.current; if(!c) return null;
                const r=c.getBoundingClientRect();
                const sx=r.width/c.width,sy=r.height/c.height;
                const px=eraserPos.x*sx,py=eraserPos.y*sy,sz=eraserSize*2*Math.min(sx,sy);
                return<div style={{position:"absolute",left:px-sz/2,top:py-sz/2,width:sz,height:sz,borderRadius:"50%",border:"2px solid #f87171",background:"rgba(248,113,113,0.08)",pointerEvents:"none",boxSizing:"border-box"}}/>;
              })()}
              {/* Crop overlay */}
              {mainTool==="crop"&&isImage&&(
                <>
                  <div style={{position:"absolute",pointerEvents:"none",top:`${crop.top}%`,left:`${crop.left}%`,right:`${crop.right}%`,bottom:`${crop.bottom}%`,border:"2px dashed #22d3ee",boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)",borderRadius:"2px"}}/>
                  {CROP_HANDLES.map(({h,pos})=>(
                    <div key={h} onMouseDown={e=>startCropHandle(h,e)}
                      style={{position:"absolute",width:"13px",height:"13px",borderRadius:"50%",background:"linear-gradient(135deg,#22d3ee,#6366f1)",border:"2px solid #fff",zIndex:20,...pos}}/>
                  ))}
                </>
              )}
            </div>

            {/* Status bar */}
            <div style={{position:"absolute",bottom:"8px",left:"8px",display:"flex",alignItems:"center",gap:"8px",
                         background:V("status-bg"),border:`1px solid ${V("border")}`,borderRadius:"8px",padding:"4px 10px",
                         fontSize:"10px",color:V("text-faint"),pointerEvents:"none",backdropFilter:"blur(8px)"}}>
              <Sparkles size={9} color="#a855f7"/>
              <span style={{color:"#a855f7",fontWeight:700}}>Canvas Studio</span>
              <span>·</span>
              <span style={{textTransform:"capitalize"}}>{isVideo?"Video Editor":mainTool}</span>
              <span>·</span>
              <span style={{fontFamily:"monospace"}}>{Math.round(zoom*100)}%</span>
            </div>
            {/* History meter */}
            <div style={{position:"absolute",bottom:"8px",right:"8px",display:"flex",alignItems:"center",gap:"6px",
                         background:V("status-bg"),border:`1px solid ${V("border")}`,borderRadius:"8px",padding:"4px 10px",
                         fontSize:"10px",color:V("text-faint"),pointerEvents:"none",backdropFilter:"blur(8px)"}}>
              <Layers size={9} color="#a855f7"/>
              <div style={{width:"55px",height:"3px",borderRadius:"2px",background:V("hover-2")}}>
                <div style={{height:"100%",borderRadius:"2px",background:"linear-gradient(90deg,#22d3ee,#a855f7)",width:`${(history.length/30)*100}%`,transition:"width .3s"}}/>
              </div>
              <span>{history.length}/30</span>
            </div>
          </div>

          {/* ── VIDEO TIMELINE ─────────────────────────── */}
          {isVideo&&(
            <div style={{flexShrink:0,background:V("panel"),borderTop:`1px solid ${V("border")}`,padding:"10px 12px"}}>
              {/* Playback controls */}
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                <button onClick={()=>seekVideo(trimIn)}
                  style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",display:"flex"}}><SkipBack size={16}/></button>
                <button onClick={toggleVideo}
                  style={{width:"32px",height:"32px",borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                          background:"linear-gradient(135deg,#f97316,#ef4444)"}}>
                  {videoPlaying?<Pause size={14} color="#fff"/>:<Play size={14} color="#fff"/>}
                </button>
                <button onClick={()=>seekVideo(trimOut)}
                  style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",display:"flex"}}><SkipForward size={16}/></button>
                <span style={{fontSize:"11px",fontFamily:"monospace",color:"#f97316",fontWeight:700}}>
                  {videoTime.toFixed(2)}s / {videoDur.toFixed(2)}s
                </span>
                <div style={{flex:1}}/>
                {/* Video text overlay input */}
                <input value={videoTextOverlay} onChange={e=>setVideoTextOverlay(e.target.value)}
                  placeholder="Text overlay…"
                  style={{padding:"4px 10px",borderRadius:"6px",border:`1px solid ${V("border")}`,background:V("input-bg"),
                          color:V("text"),fontSize:"11px",outline:"none",width:"180px"}}/>
              </div>
              {/* Timeline */}
              <div style={{position:"relative",height:"36px",background:isDark?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.06)",borderRadius:"8px",overflow:"visible"}}>
                {/* Full track */}
                <div style={{position:"absolute",inset:"8px 0",borderRadius:"4px",background:isDark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.06)"}}/>
                {/* Trim range */}
                <div style={{position:"absolute",top:"8px",bottom:"8px",left:`${trimIn}%`,right:`${100-trimOut}%`,
                             background:"linear-gradient(90deg,rgba(249,115,22,0.5),rgba(239,68,68,0.5))",borderRadius:"4px"}}/>
                {/* Playhead */}
                <div style={{position:"absolute",top:0,bottom:0,left:`${videoDur>0?(videoTime/videoDur)*100:0}%`,width:"2px",background:"#fff",borderRadius:"1px",zIndex:3}}/>
                {/* Trim In handle */}
                <div
                  style={{position:"absolute",top:0,bottom:0,left:`${trimIn}%`,width:"10px",marginLeft:"-5px",
                           background:"#f97316",borderRadius:"4px",cursor:"ew-resize",zIndex:4,
                           display:"flex",alignItems:"center",justifyContent:"center"}}
                  onMouseDown={e=>{ e.preventDefault(); const startX=e.clientX; const startTrim=trimIn;
                    const mm=(me:MouseEvent)=>{ const el=e.currentTarget.parentElement; if(!el) return; const w=el.getBoundingClientRect().width;
                      const pct=clamp(startTrim+((me.clientX-startX)/w)*100,0,trimOut-5); setTrimIn(pct); };
                    const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
                    window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu);
                  }}
                >
                  <div style={{width:"2px",height:"12px",background:"rgba(255,255,255,0.6)",borderRadius:"1px"}}/>
                </div>
                {/* Trim Out handle */}
                <div
                  style={{position:"absolute",top:0,bottom:0,right:`${100-trimOut}%`,width:"10px",marginRight:"-5px",
                           background:"#ef4444",borderRadius:"4px",cursor:"ew-resize",zIndex:4,
                           display:"flex",alignItems:"center",justifyContent:"center"}}
                  onMouseDown={e=>{ e.preventDefault(); const startX=e.clientX; const startTrim=trimOut;
                    const mm=(me:MouseEvent)=>{ const el=e.currentTarget.parentElement; if(!el) return; const w=el.getBoundingClientRect().width;
                      const pct=clamp(startTrim+((me.clientX-startX)/w)*100,trimIn+5,100); setTrimOut(pct); };
                    const mu=()=>{window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);};
                    window.addEventListener("mousemove",mm); window.addEventListener("mouseup",mu);
                  }}
                >
                  <div style={{width:"2px",height:"12px",background:"rgba(255,255,255,0.6)",borderRadius:"1px"}}/>
                </div>
                {/* Click to seek */}
                <div style={{position:"absolute",inset:0,cursor:"pointer"}}
                  onClick={e=>{ const r=(e.currentTarget as HTMLDivElement).getBoundingClientRect(); seekVideo(((e.clientX-r.left)/r.width)*100); }}
                />
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"9px",color:V("text-faint"),marginTop:"4px"}}>
                <span>In: {((trimIn/100)*videoDur).toFixed(1)}s</span>
                <span style={{color:V("text-dim")}}>Click timeline to seek · Drag orange/red handles to trim</span>
                <span>Out: {((trimOut/100)*videoDur).toFixed(1)}s</span>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────── */}
        <div style={{flexShrink:0,width:"185px",background:V("panel"),borderLeft:`1px solid ${V("border")}`,
                     display:"flex",flexDirection:"column",overflow:"hidden"}} className="ff-sidebar-r">
          {/* Right panel tabs */}
          <div style={{flexShrink:0,display:"flex",flexWrap:"wrap",borderBottom:`1px solid ${V("border")}`}}>
            {([
              ["adjust","Adjust"],["transform","Transform"],["audio","🎵 Audio"],["ai","🤖 AI"],["info","Info"],
            ] as [RightPanel,string][]).map(([tab,lbl])=>(
              <button key={tab} onClick={()=>setRightPanel(tab)}
                style={{flex:"1 1 50%",padding:"7px 4px",border:"none",cursor:"pointer",fontSize:"9px",fontWeight:600,
                        background:rightPanel===tab?"rgba(99,102,241,0.1)":"transparent",
                        borderBottom:rightPanel===tab?"2px solid #6366f1":"2px solid transparent",
                        color:rightPanel===tab?"#a5b4fc":V("text-dim")}}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="ce-panel-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden"}}>

            {/* ── ADJUST TAB ── */}
            {rightPanel==="adjust"&&(
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
                    style={{width:"100%",background:V("input-bg"),border:`1px solid ${V("border")}`,borderRadius:"6px",color:V("text"),fontSize:"11px",padding:"4px 6px",outline:"none",cursor:"pointer"}}>
                    {FILTERS.map(({value,label,emoji})=><option key={value} value={value}>{emoji} {label}</option>)}
                  </select>
                </div>
                <div style={{padding:"8px 10px"}}>
                  <button onClick={resetAdjust}
                    style={{width:"100%",padding:"6px",borderRadius:"7px",cursor:"pointer",background:V("hover"),border:`1px solid ${V("border")}`,
                            color:V("text-muted"),fontSize:"11px",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}>
                    <RefreshCw size={11}/> Reset All
                  </button>
                </div>
              </>
            )}

            {/* ── TRANSFORM TAB ── */}
            {rightPanel==="transform"&&(
              <>
                <div style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>Rotate & Flip</div>
                  <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                    {[{label:"CW",act:()=>setRotation(r=>(r+90)%360),icon:<RotateCw size={11} color="#22d3ee"/>},
                      {label:"CCW",act:()=>setRotation(r=>(r-90+360)%360),icon:<RotateCcw size={11} color="#22d3ee"/>}].map(({label,act,icon})=>(
                      <button key={label} onClick={act}
                        style={{flex:"1 1 60px",display:"flex",alignItems:"center",justifyContent:"center",gap:"3px",
                                padding:"6px 4px",borderRadius:"6px",border:`1px solid ${V("border")}`,
                                background:V("hover"),color:V("text-muted"),cursor:"pointer",fontSize:"10px",fontWeight:600}}>
                        {icon} {label}
                      </button>
                    ))}
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
                <div style={{padding:"8px 10px",borderBottom:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"7px"}}>Crop</div>
                  <button onClick={()=>setMainTool("crop")}
                    style={{width:"100%",padding:"7px",borderRadius:"7px",cursor:"pointer",
                            background:mainTool==="crop"?"rgba(249,115,22,0.12)":V("hover"),
                            border:mainTool==="crop"?"1px solid rgba(249,115,22,0.3)":`1px solid ${V("border")}`,
                            color:mainTool==="crop"?"#f97316":V("text-muted"),fontSize:"11px",fontWeight:600,
                            display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"}}>
                    <Crop size={11}/> {mainTool==="crop"?"Crop Active":"Activate Crop"}
                  </button>
                  {mainTool==="crop"&&(
                    <button onClick={()=>setCrop({top:0,left:0,right:0,bottom:0})}
                      style={{width:"100%",marginTop:"6px",padding:"6px",borderRadius:"7px",cursor:"pointer",
                              background:V("hover"),border:`1px solid ${V("border")}`,color:V("text-muted"),fontSize:"11px",fontWeight:600}}>
                      Reset Crop
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── AUDIO TAB ── */}
            {rightPanel==="audio"&&(
              <div style={{padding:"10px"}}>
                <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"10px"}}>
                  Music / Audio Layer
                </div>
                {!audioFile?(
                  <div>
                    <div style={{border:`2px dashed ${V("border")}`,borderRadius:"12px",padding:"24px 16px",textAlign:"center",marginBottom:"10px"}}>
                      <Music size={24} color="#22c55e" style={{margin:"0 auto 10px"}}/>
                      <p style={{fontSize:"11px",color:V("text-dim"),marginBottom:"12px",lineHeight:1.6}}>
                        Upload a music file to add background audio to your canvas.
                      </p>
                      <label style={{cursor:"pointer",padding:"8px 16px",borderRadius:"8px",
                                     background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",
                                     color:"#22c55e",fontSize:"11px",fontWeight:600,display:"inline-block"}}>
                        <Music size={11} style={{display:"inline",marginRight:"5px"}}/> Choose Audio
                        <input type="file" accept="audio/*" style={{display:"none"}}
                          onChange={e=>{const f=e.target.files?.[0];if(f)loadAudio(f);}}/>
                      </label>
                    </div>
                    <p style={{fontSize:"9px",color:V("text-faint"),lineHeight:1.5}}>Supports MP3, WAV, OGG, AAC. Audio plays in the editor and can be included in video exports.</p>
                  </div>
                ):(
                  <div>
                    {/* File name */}
                    <div style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px",borderRadius:"8px",
                                 background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",marginBottom:"10px"}}>
                      <Music size={12} color="#22c55e"/>
                      <span style={{fontSize:"10px",color:"#22c55e",fontWeight:600,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{audioName}</span>
                      <button onClick={()=>{setAudioFile(null);setAudioLoaded(false);setAudioPlaying(false);audioElRef.current?.pause();}}
                        style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer",padding:"2px"}}><X size={11}/></button>
                    </div>
                    {/* Waveform */}
                    <canvas ref={waveCanvasRef} width={155} height={48}
                      style={{width:"100%",height:"48px",borderRadius:"8px",marginBottom:"10px",
                              background:isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"}}/>
                    {/* Play control */}
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"10px"}}>
                      <button onClick={toggleAudio} disabled={!audioLoaded}
                        style={{width:"36px",height:"36px",borderRadius:"50%",border:"none",cursor:"pointer",
                                display:"flex",alignItems:"center",justifyContent:"center",
                                background:audioPlaying?"rgba(34,197,94,0.2)":"linear-gradient(135deg,#22c55e,#16a34a)"}}>
                        {audioPlaying?<Pause size={14} color={isDark?"#22c55e":"#16a34a"}/>:<Play size={14} color="#fff"/>}
                      </button>
                      <span style={{fontSize:"10px",color:V("text-dim"),fontWeight:500}}>
                        {audioLoaded?audioPlaying?"Playing…":"Ready to play":"Loading…"}
                      </span>
                    </div>
                    {/* Volume */}
                    <div style={{marginBottom:"10px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"4px"}}>
                        <span style={{fontSize:"9px",color:V("text-dim"),display:"flex",alignItems:"center",gap:"3px"}}><Volume2 size={9}/>Volume</span>
                        <span style={{fontSize:"9px",fontFamily:"monospace",color:"#22c55e",fontWeight:700}}>{Math.round(audioVol*100)}%</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.01} value={audioVol}
                        onChange={e=>setAudioVol(Number(e.target.value))} style={{width:"100%",accentColor:"#22c55e"}}/>
                    </div>
                    <p style={{fontSize:"9px",color:V("text-faint"),lineHeight:1.5}}>
                      💡 For video exports, the audio will be mixed in. For image exports, you can record the canvas session with audio using screen recording tools.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── AI TAB ── */}
            {rightPanel==="ai"&&(
              <div style={{padding:"10px"}}>
                <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:"10px"}}>
                  AI-Powered Tools
                </div>
                {!isImage?(
                  <p style={{fontSize:"11px",color:V("text-faint"),lineHeight:1.6}}>AI features are available for image files. Open an image to use these tools.</p>
                ):(
                  <>
                    {aiStatus&&(
                      <div style={{padding:"8px 10px",borderRadius:"8px",marginBottom:"10px",
                                   background:"rgba(168,85,247,0.1)",border:"1px solid rgba(168,85,247,0.2)",
                                   fontSize:"10px",color:"#a855f7",fontWeight:600,lineHeight:1.5}}>
                        {aiStatus}
                      </div>
                    )}
                    {[
                      {label:"Auto Enhance",desc:"Auto-correct brightness & contrast from histogram",icon:<Wand2 size={13} color="#a855f7"/>,act:runAutoEnhance,color:"#a855f7"},
                      {label:"Extract Palette",desc:"Find 6 dominant colors in the image",icon:<Palette size={13} color="#f472b6"/>,act:runExtractPalette,color:"#f472b6"},
                      {label:"Remove Background",desc:"Remove solid-color backgrounds (alpha)",icon:<Focus size={13} color="#22d3ee"/>,act:runBgRemoval,color:"#22d3ee"},
                      {label:"Noise Reduction",desc:"Smooth out image noise & grain",icon:<Waves size={13} color="#06b6d4"/>,act:runNoiseReduction,color:"#06b6d4"},
                      {label:"Add Vignette",desc:"Dark edge vignette cinematic effect",icon:<Blend size={13} color="#6366f1"/>,act:runVignette,color:"#6366f1"},
                    ].map(({label,desc,icon,act,color})=>(
                      <button key={label} onClick={act} disabled={aiProcessing}
                        style={{width:"100%",display:"flex",alignItems:"flex-start",gap:"8px",padding:"9px 10px",borderRadius:"10px",
                                border:`1px solid ${V("border")}`,background:V("hover"),marginBottom:"6px",cursor:"pointer",
                                textAlign:"left",transition:"all .15s",opacity:aiProcessing?.5:1}}>
                        <div style={{flexShrink:0,marginTop:"1px"}}>{icon}</div>
                        <div>
                          <div style={{fontSize:"11px",fontWeight:700,color,marginBottom:"2px"}}>{label}</div>
                          <div style={{fontSize:"9px",color:V("text-faint"),lineHeight:1.5}}>{desc}</div>
                        </div>
                      </button>
                    ))}
                    {/* Extracted palette */}
                    {aiPalette.length>0&&(
                      <div style={{marginTop:"10px"}}>
                        <div style={{fontSize:"9px",color:V("text-faint"),marginBottom:"6px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Extracted Palette</div>
                        <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
                          {aiPalette.map((c,i)=>(
                            <button key={i} onClick={()=>{setStrokeColor(c);pushColor(c);}}
                              title={`Use ${c}`}
                              style={{width:"28px",height:"28px",borderRadius:"6px",background:c,border:`2px solid ${strokeColor===c?"#22d3ee":"rgba(128,128,128,0.2)"}`,
                                      cursor:"pointer",outline:"none",transition:"all .1s",transform:strokeColor===c?"scale(1.15)":"scale(1)"}}/>
                          ))}
                        </div>
                        <p style={{fontSize:"9px",color:V("text-faint"),marginTop:"5px"}}>Click any color to use it as your active stroke color.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── INFO TAB ── */}
            {rightPanel==="info"&&(
              <div style={{padding:"10px"}}>
                {[
                  {label:"File Name",  val:loadedFile?.name||"Blank Canvas"},
                  {label:"File Size",  val:loadedFile?`${(loadedFile.size/1024).toFixed(1)} KB`:"—"},
                  {label:"File Type",  val:loadedFile?.type||"image/blank"},
                  {label:"Mode",       val:fileMode.charAt(0).toUpperCase()+fileMode.slice(1)},
                  {label:"Dimensions", val:`${canvasDims.w} × ${canvasDims.h} px`},
                  {label:"Undo Steps", val:`${history.length}/30`},
                  {label:"Zoom",       val:`${Math.round(zoom*100)}%`},
                  {label:"Filter",     val:filter},
                  {label:"Audio",      val:audioFile?audioName:"None"},
                  {label:"Theme",      val:theme},
                ].map(({label,val})=>(
                  <div key={label} style={{marginBottom:"8px"}}>
                    <div style={{fontSize:"9px",color:V("text-faint"),fontWeight:700,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:"2px"}}>{label}</div>
                    <div style={{fontSize:"11px",color:V("text-muted"),fontFamily:"monospace",wordBreak:"break-all"}}>{val}</div>
                  </div>
                ))}
                {/* Shortcuts */}
                <div style={{marginTop:"10px",padding:"8px",borderRadius:"8px",background:V("hover"),border:`1px solid ${V("border")}`}}>
                  <div style={{fontSize:"9px",color:V("text-faint"),fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:"5px"}}>Shortcuts</div>
                  {[["P","Pen"],["B","Brush"],["E","Eraser"],["T","Text"],["S","Shapes"],["U","Blur"],["C","Crop"],
                    ["[/]","Size ±2"],["Ctrl+Z","Undo"],["Ctrl+Y","Redo"],["Ctrl+S","Save"],["+/-","Zoom"],["0","Fit 100%"]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",marginBottom:"3px"}}>
                      <span style={{fontSize:"9px",color:V("text-dim")}}>{v}</span>
                      <kbd style={{fontSize:"8px",fontFamily:"monospace",color:"#22d3ee",background:"rgba(34,211,238,0.08)",
                                   padding:"1px 4px",borderRadius:"3px",border:"1px solid rgba(34,211,238,0.2)"}}>{k}</kbd>
                    </div>
                  ))}
                </div>
                {/* Start tour button */}
                <button onClick={()=>{setWtIdx(0);setWtActive(true);}}
                  style={{width:"100%",marginTop:"10px",padding:"8px",borderRadius:"8px",border:`1px solid ${V("border")}`,
                          background:"rgba(99,102,241,0.08)",color:"#6366f1",fontSize:"11px",fontWeight:600,cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
                  <HelpCircle size={12}/> Replay Walkthrough Tour
                </button>
              </div>
            )}

          </div>

          {/* Footer badge */}
          <div style={{flexShrink:0,padding:"10px"}}>
            <div style={{borderRadius:"9px",padding:"9px",textAlign:"center",
                         background:"rgba(99,102,241,0.06)",border:"1px solid rgba(99,102,241,0.15)"}}>
              <Sparkles size={12} color="#a855f7" style={{margin:"0 auto 3px"}}/>
              <div style={{fontSize:"9px",color:"#a855f7",fontWeight:700}}>Canvas Studio Pro</div>
              <div style={{fontSize:"8px",color:V("text-faint"),marginTop:"2px"}}>Image · Video · Audio · AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE BAR ───────────────────────────────────── */}
      <div className="ff-mobile-bar" style={{flexShrink:0,display:"none",borderTop:`1px solid ${V("border")}`,background:V("panel")}}>
        <div style={{display:"flex",overflowX:"auto",padding:"8px",gap:"6px"}}>
          {([
            {id:"pen",icon:<Pencil size={14}/>,c:"#3b82f6"},
            {id:"brush",icon:<Paintbrush size={14}/>,c:"#06b6d4"},
            {id:"shape",icon:<Square size={14}/>,c:"#a855f7"},
            {id:"erase",icon:<Eraser size={14}/>,c:"#ef4444"},
            {id:"text",icon:<Type size={14}/>,c:"#eab308"},
            {id:"blur",icon:<Blend size={14}/>,c:"#06b6d4"},
            {id:"sticker",icon:<Smile size={14}/>,c:"#a855f7"},
          ] as {id:MainTool;icon:React.ReactNode;c:string}[]).map(({id,icon,c})=>(
            <button key={id} onClick={()=>setMainTool(id)}
              style={{flexShrink:0,padding:"8px 12px",borderRadius:"8px",border:"none",cursor:"pointer",
                      background:mainTool===id?`${c}22`:"transparent",color:mainTool===id?c:V("text-dim"),
                      borderBottom:mainTool===id?`2px solid ${c}`:"2px solid transparent"}}>
              <span style={{color:c}}>{icon}</span>
            </button>
          ))}
        </div>
        <div style={{display:"flex",gap:"4px",flexWrap:"wrap",padding:"6px 8px 8px"}}>
          {COLORS.map(c=>(
            <button key={c} onClick={()=>setStrokeColor(c)}
              style={{width:"22px",height:"22px",borderRadius:"5px",background:c,cursor:"pointer",outline:"none",
                      border:strokeColor===c?"2px solid #22d3ee":"1px solid rgba(128,128,128,0.2)"}}/>
          ))}
        </div>
      </div>

      <style>{`
        #ff-studio-root {
          position: fixed !important; top: 0 !important; left: 0 !important;
          right: 0 !important; bottom: 0 !important;
          width: 100vw !important; height: 100vh !important; height: 100dvh !important;
          z-index: 2147483647 !important; overflow: hidden !important;
          display: flex !important; flex-direction: column !important;
        }
        @media (max-width: 768px) {
          .ff-sidebar-l, .ff-sidebar-r { display: none !important; }
          .ff-mobile-bar { display: flex !important; flex-direction: column; }
        }
        input[type="range"] { cursor: pointer; }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   EXPORT — handles both standalone & portal mode
════════════════════════════════════════════════════════ */
export default function CanvasStudio(props: StudioProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (props.portalMode) {
    return createPortal(
      <CanvasStudioInner {...props} />,
      document.body
    );
  }
  return <CanvasStudioInner {...props} />;
}
