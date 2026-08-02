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
  ChevronLeft, ChevronRight, PlusCircle, Camera, Copy, Scissors,
  FastForward, Frame, Layers3, Move, AlignCenter, Repeat,
} from "lucide-react";
import BrandLoader from "./BrandLoader";
import { ThemeContext } from "@/app/providers";

/* ════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════ */
type FileMode    = "none" | "image" | "video" | "audio";
type MainTool    = "pen"|"brush"|"shape"|"erase"|"text"|"crop"|"blur"|"sticker";
type PenType     = "ballpoint"|"felt"|"marker"|"highlighter";
type BrushType   = "soft"|"hard"|"airbrush"|"watercolor"|"oil";
type ShapeType   = "rect"|"circle"|"line"|"arrow"|"triangle"|"star";
type FilterPr    = "none"|"grayscale"|"sepia"|"invert"|"warm"|"cool"|"vivid";
type MenuKey     = "file"|"edit"|"view"|"image"|"filter"|"ai"|"help"|null;
type RightPanel  = "adjust"|"transform"|"audio"|"ai"|"info"|"timeline";

export interface TextClip {
  id: string;
  text: string;
  startTime: number; // in seconds
  duration: number;  // in seconds
  x: number;
  y: number;
  font: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
}

export interface StudioProps {
  file?: File;
  onSave?:(f:File)=>void;
  onCancel?:()=>void;
  portalMode?: boolean;
}

interface WTStep {
  title: string; desc: string; icon: React.ReactNode;
  region?: { top:string; left?:string; right?:string; width:string; height:string };
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
const ASPECT_RATIOS = [
  {label:"16:9 Landscape", ratio:"16:9", w:1920, h:1080},
  {label:"9:16 Shorts/Reels", ratio:"9:16", w:1080, h:1920},
  {label:"1:1 Square", ratio:"1:1", w:1080, h:1080},
  {label:"4:5 Portrait", ratio:"4:5", w:1080, h:1350},
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
    title:"Welcome to Canvas Studio Pro! 🎨",
    desc:"An all-in-one multi-track video, audio, image & AI studio. This tour highlights every feature.",
    icon:<Sparkles size={28} color="#a855f7"/>,
  },
  {
    title:"Open Any File 📁",
    desc:"Drop images, MP4/WebM videos, or MP3/WAV audio tracks. The UI automatically adapts its controls based on your file format.",
    icon:<Upload size={28} color="#22d3ee"/>,
  },
  {
    title:"Multi-Track Video Studio 🎬",
    desc:"For video files: Split clips at playhead, adjust speed (0.5x - 2x), change aspect ratio (16:9, 9:16, 1:1), and add timed text overlays.",
    icon:<Film size={28} color="#f97316"/>,
  },
  {
    title:"Audio Cut & Trim Layer 🎵",
    desc:"Cut, trim and delay audio tracks precisely over video. Set Audio In/Out points and view a live frequency waveform.",
    icon:<Music size={28} color="#22c55e"/>,
  },
  {
    title:"Timed Text & Copy/Paste ✂️",
    desc:"Add text clips to exact timeline timestamps. Select any clip, hit Copy (Ctrl+C), and Paste (Ctrl+V) anywhere at current playhead.",
    icon:<Copy size={28} color="#eab308"/>,
  },
  {
    title:"AI Superpowers 🤖",
    desc:"Auto Enhance, Palette Extraction, Background Removal, Noise Reduction, and Vignette effects in 1-click.",
    icon:<Wand2 size={28} color="#a855f7"/>,
  },
];

const clamp = (v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const PEN_CURSOR   = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' fill='%2322d3ee'/%3E%3C/svg%3E") 0 24, crosshair`;

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
      {s.region&&(
        <div style={{position:"fixed",...s.region,borderRadius:"8px",
                     boxShadow:"0 0 0 4px #22d3ee, 0 0 40px rgba(34,211,238,0.3)",
                     pointerEvents:"none",zIndex:1}}/>
      )}
      <div style={{
        background:isDark?"linear-gradient(135deg,#0f1117,#1a2035)":"#fff",
        border:"1px solid rgba(99,102,241,0.3)",borderRadius:"24px",padding:"36px 32px 28px",
        maxWidth:"460px",width:"90vw",textAlign:"center",position:"relative",zIndex:2,
        boxShadow:"0 0 0 1px rgba(99,102,241,0.15), 0 32px 80px rgba(0,0,0,0.7)",
        animation:"wt-in .25s ease",
      }}>
        <button onClick={onSkip} style={{position:"absolute",top:"12px",right:"12px",background:"none",border:"none",
          color:isDark?"#475569":"#94a3b8",cursor:"pointer",padding:"4px",borderRadius:"6px"}}><X size={14}/></button>
        <div style={{width:"64px",height:"64px",borderRadius:"18px",margin:"0 auto 18px",
                     background:"linear-gradient(135deg,rgba(99,102,241,0.15),rgba(34,211,238,0.15))",
                     border:"1px solid rgba(99,102,241,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {s.icon}
        </div>
        <div style={{fontSize:"10px",color:"#6366f1",fontWeight:700,marginBottom:"8px",letterSpacing:"0.08em"}}>
          STEP {idx+1} OF {steps.length}
        </div>
        <h3 style={{fontSize:"22px",fontWeight:800,color:isDark?"#fff":"#0f1117",
                    fontFamily:"'Outfit',sans-serif",marginBottom:"12px",lineHeight:1.2}}>{s.title}</h3>
        <p style={{fontSize:"13px",color:isDark?"#94a3b8":"#475569",lineHeight:1.75,marginBottom:"26px"}}>{s.desc}</p>
        <div style={{display:"flex",justifyContent:"center",gap:"5px",marginBottom:"22px"}}>
          {steps.map((_,i)=>(
            <div key={i} style={{height:"5px",borderRadius:"3px",transition:"all .3s",
              width:i===idx?"22px":"5px",
              background:i===idx?"#6366f1":i<idx?"#22d3ee":"rgba(99,102,241,0.2)"}}/>
          ))}
        </div>
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
            {isLast?"🎨 Launch Studio!":"Next →"}
          </button>
        </div>
      </div>
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
          <span style={{color:V("text-faint"),fontSize:"12px"}}>/ Canvas Studio Pro</span>
        </div>
        <button onClick={onShowTour}
          style={{display:"flex",alignItems:"center",gap:"5px",padding:"5px 10px",borderRadius:"8px",
                  border:`1px solid ${V("border")}`,background:"transparent",
                  color:V("text-muted"),fontSize:"11px",fontWeight:600,cursor:"pointer"}}>
          <HelpCircle size={12}/> Walkthrough Guide
        </button>
      </div>

      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"32px",padding:"16px",maxWidth:"680px",width:"100%"}}>
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
            Open File in Canvas Studio Pro
          </h2>
          <p style={{fontSize:"13px",color:V("text-dim"),marginBottom:"28px",lineHeight:1.7}}>
            Drop an image, MP4 video, or MP3 audio track — or choose a blank template.<br/>
            <span style={{color:V("text-faint"),fontSize:"11px"}}>Images: JPG, PNG, WebP &nbsp;·&nbsp; Videos: MP4, WebM &nbsp;·&nbsp; Audio: MP3, WAV, OGG</span>
          </p>
          <div style={{display:"flex",gap:"12px",justifyContent:"center",flexWrap:"wrap"}}>
            <button onClick={e=>{e.stopPropagation();inputRef.current?.click();}}
              style={{padding:"13px 26px",borderRadius:"12px",border:"none",fontWeight:700,fontSize:"13px",cursor:"pointer",
                      background:"linear-gradient(135deg,#6366f1,#22d3ee)",color:"#fff",
                      display:"flex",alignItems:"center",gap:"8px",
                      boxShadow:"0 4px 20px rgba(99,102,241,0.35)"}}>
              <ImageIcon size={15}/> Open Media File
            </button>
            <button onClick={e=>{e.stopPropagation();onBlankCanvas(1080,1080);}}
              style={{padding:"13px 26px",borderRadius:"12px",fontWeight:600,fontSize:"13px",cursor:"pointer",
                      border:`1px solid ${V("border-2")}`,background:"transparent",
                      color:V("text-muted"),display:"flex",alignItems:"center",gap:"8px"}}>
              <Square size={15}/> Blank Canvas
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/*,video/*,audio/*" style={{display:"none"}}
            onChange={e=>{const f=e.target.files?.[0];if(f)onFileLoaded(f);}}/>
        </div>

        <div style={{textAlign:"center",width:"100%"}}>
          <p style={{fontSize:"10px",color:V("text-faint"),marginBottom:"12px",
                     letterSpacing:"0.07em",textTransform:"uppercase",fontWeight:700}}>
            Preset Canvas Sizes
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
  const videoRafRef  =useRef<number|null>(null);
  const waveRafRef   =useRef<number|null>(null);
  const isDrawing    =useRef(false);
  const startPos     =useRef<{x:number;y:number}|null>(null);
  const lastPos      =useRef<{x:number;y:number}|null>(null);
  const dragCrop     =useRef<{x:number;y:number;box:{top:number;left:number;right:number;bottom:number}}|null>(null);

  // File / Mode state
  const [fileMode,setFileMode]=useState<FileMode>(
    initialFile ? (initialFile.type.startsWith("video/") ? "video" : initialFile.type.startsWith("audio/") ? "audio" : "image") : "none"
  );
  const [loadedFile,setLoadedFile]=useState<File|null>(initialFile||null);
  const [img,setImg]=useState<HTMLImageElement|null>(null);
  const [imgLoading,setImgLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [exporting,setExporting]=useState(false);

  // Tools & Drawing
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
  const [fontSz,setFontSz]=useState(28);
  const [bold,setBold]=useState(false);
  const [italic,setItalic]=useState(false);
  const [blurRadius,setBlurRadius]=useState(8);
  const [selSticker,setSelSticker]=useState("😀");

  // Colors
  const [strokeColor,setStrokeColor]=useState("#3b82f6");
  const [fillColor,setFillColor]=useState("#3b82f633");
  const [colorHistory,setColorHistory]=useState<string[]>([]);

  // Adjustments & Transforms
  const [brightness,setBrightness]=useState(0);
  const [contrast,setContrast]=useState(0);
  const [saturation,setSaturation]=useState(0);
  const [rotation,setRotation]=useState(0);
  const [flipH,setFlipH]=useState(false);
  const [flipV,setFlipV]=useState(false);
  const [zoom,setZoom]=useState(1);
  const [filter,setFilter]=useState<FilterPr>("none");
  const [aspectRatio,setAspectRatio]=useState<string>("16:9");

  // Crop & History
  const [crop,setCrop]=useState({top:0,left:0,right:0,bottom:0});
  const [cropHandle,setCropHandle]=useState<string|null>(null);
  const [history,setHistory]=useState<ImageData[]>([]);
  const [future,setFuture]=useState<ImageData[]>([]);

  // Video Pro Multi-Track State
  const [videoPlaying,setVideoPlaying]=useState(false);
  const [videoTime,setVideoTime]=useState(0);
  const [videoDur,setVideoDur]=useState(0);
  const [trimIn,setTrimIn]=useState(0);
  const [trimOut,setTrimOut]=useState(100);
  const [videoSpeed,setVideoSpeed]=useState<number>(1.0);

  // Timed Text Clips Track
  const [textClips,setTextClips]=useState<TextClip[]>([]);
  const [selectedClipId,setSelectedClipId]=useState<string|null>(null);
  const [copiedClip,setCopiedClip]=useState<TextClip|null>(null);

  // Audio Cut & Trim Layer over Video
  const [audioFile,setAudioFile]=useState<File|null>(null);
  const [audioName,setAudioName]=useState("");
  const [audioPlaying,setAudioPlaying]=useState(false);
  const [audioVol,setAudioVol]=useState(0.8);
  const [audioLoaded,setAudioLoaded]=useState(false);
  const [audioTrimIn,setAudioTrimIn]=useState(0); // audio file start sec
  const [audioTrimOut,setAudioTrimOut]=useState(100); // audio file end sec percentage
  const [audioOffset,setAudioOffset]=useState(0); // start timestamp on video timeline

  // AI & UI
  const [aiPalette,setAiPalette]=useState<string[]>([]);
  const [aiProcessing,setAiProcessing]=useState(false);
  const [aiStatus,setAiStatus]=useState("");
  const [saved,setSaved]=useState(false);
  const [maximized,setMaximized]=useState(true);
  const [rightPanel,setRightPanel]=useState<RightPanel>("adjust");
  const [activeMenu,setActiveMenu]=useState<MenuKey>(null);
  const [showGrid,setShowGrid]=useState(false);
  const [showInfoBar,setShowInfoBar]=useState(true);
  const [toolSubOpen,setToolSubOpen]=useState(false);
  const [cursorPos,setCursorPos]=useState({x:0,y:0});
  const [canvasDims,setCanvasDims]=useState({w:1920,h:1080});
  const [wtActive,setWtActive]=useState(false);
  const [wtIdx,setWtIdx]=useState(0);

  // Walkthrough check
  useEffect(()=>{
    if(!localStorage.getItem("ff_studio_tour_done")){setWtActive(true);}
  },[]);
  const finishTour=useCallback(()=>{
    setWtActive(false);localStorage.setItem("ff_studio_tour_done","1");
  },[]);

  // ── Load media file ──
  useEffect(()=>{
    if(!loadedFile) return;
    const type=loadedFile.type;
    if(type.startsWith("video/")){
      setFileMode("video"); setRightPanel("timeline");
    } else if(type.startsWith("audio/")){
      setFileMode("audio"); setRightPanel("audio"); loadAudio(loadedFile);
    } else {
      setFileMode("image"); setImgLoading(true);
      const url=URL.createObjectURL(loadedFile);
      const i=new Image(); i.crossOrigin="anonymous";
      i.onload=()=>{ setImg(i); setCanvasDims({w:i.naturalWidth,h:i.naturalHeight}); setImgLoading(false); };
      i.onerror=()=>setImgLoading(false);
      i.src=url;
      return()=>URL.revokeObjectURL(url);
    }
  },[loadedFile]);

  // ── Setup Video Element ──
  useEffect(()=>{
    if(fileMode!=="video"||!loadedFile) return;
    const vid=document.createElement("video");
    vid.crossOrigin="anonymous"; vid.muted=true; vid.loop=false;
    vid.src=URL.createObjectURL(loadedFile);
    vid.onloadedmetadata=()=>{
      setVideoDur(vid.duration); setTrimOut(100);
      const w=vid.videoWidth||1920,h=vid.videoHeight||1080;
      setCanvasDims({w,h});
      const c=canvasRef.current; if(c){c.width=w;c.height=h;}
    };
    videoElRef.current=vid;
    return()=>{ vid.src=""; URL.revokeObjectURL(vid.src); };
  },[fileMode,loadedFile]);

  // Sync Video Speed
  useEffect(()=>{
    if(videoElRef.current) videoElRef.current.playbackRate=videoSpeed;
  },[videoSpeed]);

  // ── Video Render Loop ──
  const drawVideoFrame=useCallback(()=>{
    const vid=videoElRef.current; const c=canvasRef.current; const ctx=c?.getContext("2d");
    if(!vid||!c||!ctx) return;
    
    // Draw video frame with brightness/contrast/filter
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
    ctx.drawImage(vid,-c.width/2,-c.height/2,c.width,c.height);
    ctx.restore();

    // Render Timed Text Clips
    const t=vid.currentTime;
    setVideoTime(t);
    textClips.forEach(clip=>{
      if(t>=clip.startTime && t<=clip.startTime+clip.duration){
        ctx.save();
        ctx.font=`${clip.italic?"italic ":""}${clip.bold?"bold ":""}${clip.fontSize}px ${clip.font},sans-serif`;
        ctx.fillStyle=clip.color; ctx.shadowColor="rgba(0,0,0,0.85)"; ctx.shadowBlur=8;
        ctx.fillText(clip.text,clip.x,clip.y);
        ctx.restore();
      }
    });

    const trimOutSec=(trimOut/100)*vid.duration;
    if(vid.currentTime>=trimOutSec){ vid.pause(); setVideoPlaying(false); return; }
    videoRafRef.current=requestAnimationFrame(drawVideoFrame);
  },[brightness,contrast,saturation,filter,rotation,flipH,flipV,trimOut,textClips]);

  useEffect(()=>{
    if(fileMode!=="video") return;
    if(videoPlaying){ videoRafRef.current=requestAnimationFrame(drawVideoFrame); }
    else { if(videoRafRef.current) cancelAnimationFrame(videoRafRef.current); }
    return()=>{ if(videoRafRef.current) cancelAnimationFrame(videoRafRef.current); };
  },[videoPlaying,drawVideoFrame,fileMode]);

  // ── Redraw Base Canvas (Image Mode) ──
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

  // ── Blank Canvas Preset ──
  const initBlankCanvas=useCallback((w:number,h:number)=>{
    setFileMode("image"); setCanvasDims({w,h});
    setTimeout(()=>{
      const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
      c.width=w; c.height=h; ctx.fillStyle=isDark?"#1a1a2e":"#ffffff"; ctx.fillRect(0,0,w,h);
      const ov=overlayRef.current; if(ov){ov.width=w;ov.height=h;}
    },50);
  },[isDark]);

  const handleNewFile=useCallback((f:File)=>{
    setLoadedFile(f); setHistory([]); setFuture([]);
    setCrop({top:0,left:0,right:0,bottom:0});
  },[]);

  // ── Undo / Redo History ──
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

  const pushColor=useCallback((c:string)=>{
    setColorHistory(prev=>[c,...prev.filter(x=>x!==c)].slice(0,6));
  },[]);

  // Coords helper
  const getCoords=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current; if(!c) return{x:0,y:0};
    const r=c.getBoundingClientRect();
    const sx=c.width/r.width,sy=c.height/r.height;
    let cx:number,cy:number;
    if("touches"in e){cx=e.touches[0]?.clientX??0;cy=e.touches[0]?.clientY??0;}
    else{cx=e.clientX;cy=e.clientY;}
    return{x:Math.round((cx-r.left)*sx),y:Math.round((cy-r.top)*sy)};
  };

  // ── Drawing Events ──
  const onStart=(e:React.MouseEvent<HTMLCanvasElement>|React.TouchEvent<HTMLCanvasElement>)=>{
    if(cropHandle||mainTool==="crop") return;
    saveState(); const p=getCoords(e);
    isDrawing.current=true; startPos.current=p; lastPos.current=p;
    
    // Add text clip or instant text
    if(mainTool==="text"&&textInput.trim()){
      if(fileMode==="video"){
        // Add as timed text clip on timeline starting at current videoTime
        const newClip:TextClip={
          id: `clip_${Date.now()}`,
          text: textInput,
          startTime: videoTime,
          duration: 4,
          x: p.x,
          y: p.y,
          font: fontFam,
          fontSize: fontSz,
          color: strokeColor,
          bold, italic,
        };
        setTextClips(prev=>[...prev,newClip]);
        setSelectedClipId(newClip.id);
        setAiStatus(`✍️ Text clip added at ${videoTime.toFixed(1)}s`);
        setTimeout(()=>setAiStatus(""),3000);
      } else {
        const c=canvasRef.current; const ctx=c?.getContext("2d"); if(ctx&&c){
          ctx.save();
          ctx.font=`${italic?"italic ":""}${bold?"bold ":""}${fontSz*2}px ${fontFam},sans-serif`;
          ctx.fillStyle=strokeColor; ctx.shadowColor="rgba(0,0,0,0.7)"; ctx.shadowBlur=5;
          ctx.fillText(textInput,p.x,p.y); ctx.restore();
        }
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

  // Crop drag
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

  // Audio setup
  const loadAudio=useCallback((f:File)=>{
    setAudioFile(f); setAudioName(f.name); setAudioLoaded(false); setAudioPlaying(false);
    if(audioElRef.current){audioElRef.current.pause();audioElRef.current=null;}
    const el=new Audio(URL.createObjectURL(f));
    el.volume=audioVol; el.loop=true;
    el.addEventListener("canplaythrough",()=>setAudioLoaded(true));
    audioElRef.current=el;
    
    // Audio Context Waveform setup
    const ctx=new AudioContext();
    const src=ctx.createMediaElementSource(el);
    const an=ctx.createAnalyser(); an.fftSize=256;
    const gn=ctx.createGain(); gn.gain.value=audioVol;
    src.connect(gn); gn.connect(an); an.connect(ctx.destination);
    audioCtxRef.current=ctx; analyserRef.current=an; gainRef.current=gn;

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

  // Video controls
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

  // ── COPY, PASTE & SPLIT TIMELINE CLIPS ──
  const copyActiveClip=()=>{
    if(!selectedClipId) return;
    const clip=textClips.find(c=>c.id===selectedClipId);
    if(clip){
      setCopiedClip(clip);
      setAiStatus(`📋 Copied clip: "${clip.text.slice(0,15)}…"`);
      setTimeout(()=>setAiStatus(""),3000);
    }
  };

  const pasteClipAtPlayhead=()=>{
    if(!copiedClip) return;
    const newClip:TextClip={
      ...copiedClip,
      id:`clip_${Date.now()}`,
      startTime: videoTime,
    };
    setTextClips(prev=>[...prev,newClip]);
    setSelectedClipId(newClip.id);
    setAiStatus(`📌 Pasted clip at ${videoTime.toFixed(1)}s`);
    setTimeout(()=>setAiStatus(""),3000);
  };

  const splitClipAtPlayhead=()=>{
    if(selectedClipId){
      const clip=textClips.find(c=>c.id===selectedClipId);
      if(clip && videoTime > clip.startTime && videoTime < clip.startTime + clip.duration){
        const firstHalfDuration = videoTime - clip.startTime;
        const secondHalfDuration = clip.duration - firstHalfDuration;
        const updatedFirst:TextClip={ ...clip, duration: firstHalfDuration };
        const secondHalf:TextClip={
          ...clip,
          id:`clip_${Date.now()}`,
          startTime: videoTime,
          duration: secondHalfDuration,
        };
        setTextClips(prev=>[...prev.filter(c=>c.id!==clip.id), updatedFirst, secondHalf]);
        setSelectedClipId(secondHalf.id);
        setAiStatus(`✂️ Split text clip at ${videoTime.toFixed(1)}s`);
        setTimeout(()=>setAiStatus(""),3000);
        return;
      }
    }
    // Split Video Trim
    if(videoDur > 0){
      const currentPct = (videoTime / videoDur) * 100;
      setTrimOut(currentPct);
      setAiStatus(`✂️ Video split at ${videoTime.toFixed(1)}s`);
      setTimeout(()=>setAiStatus(""),3000);
    }
  };

  const deleteSelectedClip=()=>{
    if(!selectedClipId) return;
    setTextClips(prev=>prev.filter(c=>c.id!==selectedClipId));
    setSelectedClipId(null);
  };

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement) return;
      if(e.ctrlKey||e.metaKey){
        if(e.key==="c"){e.preventDefault();copyActiveClip();}
        if(e.key==="v"){e.preventDefault();pasteClipAtPlayhead();}
        if(e.key==="z"){e.preventDefault();undo();}
        if(e.key==="y"){e.preventDefault();redo();}
        if(e.key==="s"){e.preventDefault();doSave();}
        return;
      }
      if(e.key.toLowerCase()==="s"){e.preventDefault();splitClipAtPlayhead();}
      if(e.key==="Delete"||e.key==="Backspace"){deleteSelectedClip();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[selectedClipId,copiedClip,videoTime,textClips,undo,redo]);

  // Export
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
      const a=document.createElement("a"); a.download="pro_studio_video.webm"; a.href=URL.createObjectURL(blob); a.click();
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

  // AI Actions
  const runAutoEnhance=async()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setAiProcessing(true); setAiStatus("Analysing histogram…");
    await new Promise(r=>setTimeout(r,600));
    const img2=ctx.getImageData(0,0,c.width,c.height);
    const {brightness:b,contrast:co,saturation:s}=aiAutoEnhance(img2);
    setBrightness(b); setContrast(co); setSaturation(s);
    setAiStatus(`✨ Enhanced: +${b} brightness, +${co} contrast`);
    setAiProcessing(false); setTimeout(()=>setAiStatus(""),3000);
  };

  const runExtractPalette=async()=>{
    const c=canvasRef.current; const ctx=c?.getContext("2d"); if(!c||!ctx) return;
    setAiProcessing(true); setAiStatus("Extracting color palette…");
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
    setAiStatus("✂️ Background removed!"); setAiProcessing(false); setTimeout(()=>setAiStatus(""),4000);
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

  // Cursor helper
  const getCursor=()=>{
    if(mainTool==="pen") return PEN_CURSOR;
    if(mainTool==="erase") return"none";
    if(mainTool==="text") return"text";
    if(mainTool==="blur") return"cell";
    if(fileMode==="video") return"default";
    return"crosshair";
  };

  const isImage=fileMode==="image";
  const isVideo=fileMode==="video";
  const isAudio=fileMode==="audio";
  const hasFile=fileMode!=="none";
  const drawingEnabled=isImage;

  // Render Tool Panel
  const renderToolPanel=()=>{
    if(!drawingEnabled&&mainTool!=="crop") return(
      <div style={{padding:"14px 10px",textAlign:"center"}}>
        <Film size={24} color="#f97316" style={{margin:"0 auto 8px"}}/>
        <p style={{fontSize:"10px",color:V("text-faint"),lineHeight:1.6}}>
          {isVideo?"Video Pro Studio active. Use multi-track timeline below to add text clips, audio layer & split video.":"Audio Studio active. Cut audio & mix track below."}
        </p>
      </div>
    );
    return null;
  };

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

  return(
    <div id="ff-studio-root" style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,width:"100vw",height:"100vh",
      zIndex:2147483647,display:"flex",flexDirection:"column",overflow:"hidden",
      background:V("bg"),color:V("text"),fontFamily:"'Inter',system-ui,sans-serif",
    }}>
      {imgLoading&&<BrandLoader message="Loading media file…" theme={theme}/>}
      {saving&&<BrandLoader message="Saving changes…" theme={theme}/>}
      {exporting&&<BrandLoader message="Exporting video render…" theme={theme}/>}
      {aiProcessing&&<BrandLoader message={aiStatus||"AI processing…"} theme={theme}/>}

      {wtActive&&<WalkthroughOverlay idx={wtIdx} steps={WT_STEPS} isDark={isDark}
        onNext={()=>setWtIdx(i=>Math.min(i+1,WT_STEPS.length-1))}
        onPrev={()=>setWtIdx(i=>Math.max(i-1,0))}
        onSkip={finishTour}/>}

      {/* ── TOP MENU BAR ── */}
      <div style={{flexShrink:0,height:"28px",background:V("panel"),borderBottom:`1px solid ${V("border")}`,
                   display:"flex",alignItems:"center",paddingLeft:"8px",gap:"2px",fontSize:"12px"}}>
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
          <span style={{padding:"1px 6px",borderRadius:"4px",fontSize:"9px",fontWeight:700,
                        background:isVideo?"rgba(249,115,22,0.2)":isAudio?"rgba(34,197,94,0.2)":"rgba(34,211,238,0.2)",
                        color:isVideo?"#f97316":isAudio?"#22c55e":"#22d3ee",
                        border:`1px solid ${isVideo?"rgba(249,115,22,0.3)":isAudio?"rgba(34,197,94,0.3)":"rgba(34,211,238,0.3)"}`}}>
            {isVideo?"VIDEO PRO STUDIO":isAudio?"AUDIO STUDIO":"IMAGE STUDIO"}
          </span>
        </div>

        {(["file","edit","view","image","filter","ai","help"] as MenuKey[]).map(mk=>{
          const labels:Record<string,string>={file:"File",edit:"Edit",view:"View",image:"Image",filter:"Filter",ai:"AI",help:"Help"};
          const isOpen=activeMenu===mk;
          return(
            <div key={mk as string} style={{position:"relative"}}>
              <button onClick={e=>{e.stopPropagation();setActiveMenu(isOpen?null:mk as MenuKey);}}
                style={{padding:"3px 8px",border:"none",cursor:"pointer",fontSize:"12px",fontWeight:500,borderRadius:"5px",
                        background:isOpen?"rgba(99,102,241,0.15)":"transparent",
                        color:isOpen?"#a5b4fc":V("text-muted")}}>
                {labels[mk as string]}
              </button>
              {isOpen&&(
                <div className="ce-dropdown-menu" onClick={e=>e.stopPropagation()}>
                  {mk==="file"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{const inp=document.createElement("input");inp.type="file";inp.accept="image/*,video/*,audio/*";inp.onchange=e=>{ const f=(e.target as HTMLInputElement).files?.[0]; if(f) handleNewFile(f); };inp.click();setActiveMenu(null);}}>
                      <Upload size={12} color="#22d3ee"/> Open Media File…
                    </button>
                    {isImage&&<button className="ce-dropdown-item" onClick={()=>{doExport("png");setActiveMenu(null);}}>
                      <FileDown size={12} color="#06b6d4"/> Export PNG
                    </button>}
                    {isVideo&&<button className="ce-dropdown-item" onClick={()=>{doExportVideo();setActiveMenu(null);}}>
                      <Film size={12} color="#f97316"/> Export Video (.webm)
                    </button>}
                  </>}
                  {mk==="edit"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{copyActiveClip();setActiveMenu(null);}}>
                      <Copy size={12} color="#eab308"/> Copy Selected Clip <span className="ce-dropdown-shortcut">Ctrl+C</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{pasteClipAtPlayhead();setActiveMenu(null);}}>
                      <Move size={12} color="#22c55e"/> Paste at Playhead <span className="ce-dropdown-shortcut">Ctrl+V</span>
                    </button>
                    <button className="ce-dropdown-item" onClick={()=>{splitClipAtPlayhead();setActiveMenu(null);}}>
                      <Scissors size={12} color="#f97316"/> Split Clip at Playhead <span className="ce-dropdown-shortcut">S</span>
                    </button>
                  </>}
                  {mk==="help"&&<>
                    <button className="ce-dropdown-item" onClick={()=>{setWtIdx(0);setWtActive(true);setActiveMenu(null);}}>
                      <HelpCircle size={12} color="#6366f1"/> Start Tour
                    </button>
                  </>}
                </div>
              )}
            </div>
          );
        })}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"6px",paddingRight:"8px",fontSize:"10px",color:V("text-faint")}}>
          <span style={{fontFamily:"monospace"}}>{canvasDims.w}×{canvasDims.h}</span>
          <span>·</span>
          <span>{loadedFile?.name.slice(0,22)||"Blank Canvas"}</span>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div style={{flexShrink:0,height:"44px",background:V("panel"),borderBottom:`1px solid ${V("border")}`,
                   display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 8px",gap:"6px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px",flex:1,minWidth:0}}>
          {isVideo&&(
            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
              {/* Aspect Ratio Switcher */}
              <div style={{display:"flex",alignItems:"center",gap:"3px",background:V("hover"),padding:"2px 4px",borderRadius:"6px",border:`1px solid ${V("border")}`}}>
                <Frame size={12} color="#22d3ee"/>
                <select value={aspectRatio} onChange={e=>{
                  const r=e.target.value; setAspectRatio(r);
                  const preset=ASPECT_RATIOS.find(a=>a.ratio===r);
                  if(preset) setCanvasDims({w:preset.w,h:preset.h});
                }} style={{background:"transparent",border:"none",color:V("text"),fontSize:"10px",outline:"none",cursor:"pointer",fontWeight:600}}>
                  {ASPECT_RATIOS.map(a=><option key={a.ratio} value={a.ratio}>{a.label}</option>)}
                </select>
              </div>
              {/* Video Speed Selector */}
              <div style={{display:"flex",alignItems:"center",gap:"3px",background:V("hover"),padding:"2px 4px",borderRadius:"6px",border:`1px solid ${V("border")}`}}>
                <FastForward size={12} color="#f97316"/>
                <select value={videoSpeed} onChange={e=>setVideoSpeed(Number(e.target.value))}
                  style={{background:"transparent",border:"none",color:"#f97316",fontSize:"10px",outline:"none",cursor:"pointer",fontWeight:700}}>
                  {[0.5, 1.0, 1.5, 2.0].map(s=><option key={s} value={s}>{s}x Speed</option>)}
                </select>
              </div>
              {/* Split & Copy/Paste quick buttons */}
              <button onClick={splitClipAtPlayhead} title="Split clip/video at playhead (Key: S)"
                style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 8px",borderRadius:"6px",
                        background:"rgba(249,115,22,0.12)",border:"1px solid rgba(249,115,22,0.3)",color:"#f97316",fontSize:"10px",fontWeight:700,cursor:"pointer"}}>
                <Scissors size={11}/> Split
              </button>
              <button onClick={copyActiveClip} disabled={!selectedClipId} title="Copy selected clip (Ctrl+C)"
                style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 8px",borderRadius:"6px",
                        background:selectedClipId?"rgba(234,179,8,0.12)":"transparent",
                        border:`1px solid ${selectedClipId?"rgba(234,179,8,0.3)":V("border")}`,
                        color:selectedClipId?"#eab308":V("text-faint"),fontSize:"10px",fontWeight:600,cursor:"pointer"}}>
                <Copy size={11}/> Copy
              </button>
              <button onClick={pasteClipAtPlayhead} disabled={!copiedClip} title="Paste clip at playhead (Ctrl+V)"
                style={{display:"flex",alignItems:"center",gap:"4px",padding:"4px 8px",borderRadius:"6px",
                        background:copiedClip?"rgba(34,197,94,0.12)":"transparent",
                        border:`1px solid ${copiedClip?"rgba(34,197,94,0.3)":V("border")}`,
                        color:copiedClip?"#22c55e":V("text-faint"),fontSize:"10px",fontWeight:600,cursor:"pointer"}}>
                <Move size={11}/> Paste
              </button>
            </div>
          )}
          {isImage&&(
            <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
              <span style={{fontSize:"10px",fontWeight:700,color:"#3b82f6"}}>Drawing Tools Active</span>
            </div>
          )}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:"4px",flexShrink:0}}>
          <button onClick={undo} disabled={!history.length} style={{padding:"5px 8px",borderRadius:"6px",background:V("hover"),border:`1px solid ${V("border")}`,color:V("text-muted"),fontSize:"11px",cursor:"pointer"}}><Undo2 size={12}/> Undo</button>
          <button onClick={redo} disabled={!future.length} style={{padding:"5px 8px",borderRadius:"6px",background:V("hover"),border:`1px solid ${V("border")}`,color:V("text-muted"),fontSize:"11px",cursor:"pointer"}}><Redo2 size={12}/> Redo</button>
          {isVideo&&<button onClick={doExportVideo} style={{padding:"5px 12px",borderRadius:"6px",background:"linear-gradient(135deg,#f97316,#ef4444)",color:"#fff",fontSize:"11px",fontWeight:700,border:"none",cursor:"pointer"}}><Film size={12}/> Export Video</button>}
          {isImage&&<button onClick={doSave} style={{padding:"5px 12px",borderRadius:"6px",background:"linear-gradient(135deg,#2563eb,#7c3aed)",color:"#fff",fontSize:"11px",fontWeight:700,border:"none",cursor:"pointer"}}><Check size={12}/> Save</button>}
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{flexShrink:0,width:"170px",background:V("panel"),borderRight:`1px solid ${V("border")}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"8px",display:"flex",flexDirection:"column",gap:"2px"}}>
            {([
              {id:"pen",    icon:<Pencil    size={14}/>, label:"Pen",     c:"#3b82f6", dis:!drawingEnabled},
              {id:"brush",  icon:<Paintbrush size={14}/>,label:"Brush",   c:"#06b6d4", dis:!drawingEnabled},
              {id:"shape",  icon:<Square    size={14}/>, label:"Shapes",  c:"#a855f7", dis:!drawingEnabled},
              {id:"erase",  icon:<Eraser    size={14}/>, label:"Eraser",  c:"#ef4444", dis:!drawingEnabled},
              {id:"text",   icon:<Type      size={14}/>, label:"Text Clip",c:"#eab308", dis:!hasFile},
              {id:"crop",   icon:<Crop      size={14}/>, label:"Crop",    c:"#f97316", dis:!isImage},
              {id:"blur",   icon:<Blend     size={14}/>, label:"Blur",    c:"#06b6d4", dis:!drawingEnabled},
              {id:"sticker",icon:<Smile     size={14}/>, label:"Sticker", c:"#a855f7", dis:!drawingEnabled},
            ] as {id:MainTool;icon:React.ReactNode;label:string;c:string;dis:boolean}[]).map(({id,icon,label,c,dis})=>(
              <button key={id} disabled={dis} onClick={()=>setMainTool(id)}
                style={{width:"100%",display:"flex",alignItems:"center",gap:"8px",padding:"7px 9px",borderRadius:"8px",border:"none",
                        cursor:dis?"not-allowed":"pointer",fontSize:"12px",fontWeight:600,textAlign:"left",
                        background:mainTool===id?`${c}22`:"transparent",color:mainTool===id?c:dis?V("text-faint"):V("text-dim"),opacity:dis?.45:1}}>
                <span style={{color:dis?V("text-faint"):c}}>{icon}</span>{label}
              </button>
            ))}
          </div>

          <div style={{height:"1px",background:V("border"),margin:"4px 8px"}}/>

          {/* Text Input Block for Video / Image */}
          {mainTool==="text"&&(
            <div style={{padding:"8px"}}>
              <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
                placeholder="Type text overlay…" rows={3}
                style={{width:"100%",borderRadius:"6px",padding:"6px",fontSize:"11px",color:V("text"),
                        background:V("input-bg"),border:`1px solid ${V("border")}`,outline:"none",resize:"none"}}/>
              <p style={{fontSize:"9px",color:V("text-faint"),marginTop:"4px"}}>
                {isVideo?"Click canvas to add timed text clip at current timestamp.":"Click canvas to draw text."}
              </p>
            </div>
          )}
        </div>

        {/* ── CENTER CANVAS ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <div ref={containerRef}
            style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",
                    overflow:"hidden",backgroundColor:V("canvas-area"),
                    backgroundImage:`linear-gradient(${V("border")} 1px,transparent 1px),linear-gradient(90deg,${V("border")} 1px,transparent 1px)`,
                    backgroundSize:"20px 20px"}}>

            <div style={{position:"relative",display:"inline-block",transform:`scale(${zoom})`,transformOrigin:"center center",transition:"transform .1s"}}>
              <canvas ref={canvasRef}
                onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd}
                style={{display:"block",borderRadius:"4px",border:`1px solid ${V("border-2")}`,
                        boxShadow:"0 0 40px rgba(0,0,0,0.5)",cursor:getCursor(),maxWidth:"100%",maxHeight:"calc(100vh - 250px)"}}/>
              <canvas ref={overlayRef}
                style={{position:"absolute",top:0,left:0,pointerEvents:"none",borderRadius:"4px",maxWidth:"100%",maxHeight:"calc(100vh - 250px)"}}/>
            </div>

            {/* Floating status */}
            <div style={{position:"absolute",bottom:"8px",left:"8px",display:"flex",alignItems:"center",gap:"8px",
                         background:V("status-bg"),border:`1px solid ${V("border")}`,borderRadius:"8px",padding:"4px 10px",fontSize:"10px",color:V("text-dim")}}>
              <Sparkles size={9} color="#a855f7"/>
              <span style={{color:"#a855f7",fontWeight:700}}>Pro Studio</span>
              <span>·</span>
              <span style={{fontFamily:"monospace"}}>{videoTime.toFixed(1)}s / {videoDur.toFixed(1)}s</span>
              {aiStatus&&<span style={{color:"#22d3ee",fontWeight:600}}>· {aiStatus}</span>}
            </div>
          </div>

          {/* ── MULTI-TRACK PRO VIDEO TIMELINE ── */}
          {isVideo&&(
            <div style={{flexShrink:0,background:V("panel"),borderTop:`1px solid ${V("border")}`,padding:"10px 12px"}}>
              {/* Playback Controls & Speed */}
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                <button onClick={()=>seekVideo(trimIn)} style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer"}}><SkipBack size={14}/></button>
                <button onClick={toggleVideo} style={{width:"30px",height:"30px",borderRadius:"50%",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#f97316,#ef4444)"}}>
                  {videoPlaying?<Pause size={13} color="#fff"/>:<Play size={13} color="#fff"/>}
                </button>
                <button onClick={()=>seekVideo(trimOut)} style={{background:"none",border:"none",color:V("text-dim"),cursor:"pointer"}}><SkipForward size={14}/></button>
                <span style={{fontSize:"11px",fontFamily:"monospace",color:"#f97316",fontWeight:700}}>{videoTime.toFixed(2)}s</span>

                {/* Track Headers */}
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"10px",fontSize:"10px"}}>
                  <span style={{color:"#f97316",fontWeight:700,display:"flex",alignItems:"center",gap:"3px"}}><Film size={10}/> Video</span>
                  <span style={{color:"#22c55e",fontWeight:700,display:"flex",alignItems:"center",gap:"3px"}}><Music size={10}/> Audio Cut</span>
                  <span style={{color:"#eab308",fontWeight:700,display:"flex",alignItems:"center",gap:"3px"}}><Type size={10}/> Text Clips ({textClips.length})</span>
                </div>
              </div>

              {/* TRACK 1: Video Track */}
              <div style={{position:"relative",height:"28px",background:isDark?"rgba(249,115,22,0.08)":"rgba(249,115,22,0.04)",borderRadius:"6px",marginBottom:"4px",border:"1px solid rgba(249,115,22,0.2)"}}>
                <div style={{position:"absolute",top:0,bottom:0,left:`${trimIn}%`,right:`${100-trimOut}%`,background:"rgba(249,115,22,0.3)",borderRadius:"4px"}}/>
                <div style={{position:"absolute",top:0,bottom:0,left:`${videoDur>0?(videoTime/videoDur)*100:0}%`,width:"2px",background:"#fff",zIndex:10}}/>
                <div style={{position:"absolute",inset:0,cursor:"pointer"}} onClick={e=>{ const r=e.currentTarget.getBoundingClientRect(); seekVideo(((e.clientX-r.left)/r.width)*100); }}/>
              </div>

              {/* TRACK 2: Audio Cut & Trim Track */}
              {audioFile&&(
                <div style={{position:"relative",height:"26px",background:isDark?"rgba(34,197,94,0.08)":"rgba(34,197,94,0.04)",borderRadius:"6px",marginBottom:"4px",border:"1px solid rgba(34,197,94,0.2)",display:"flex",alignItems:"center",padding:"0 6px"}}>
                  <Music size={10} color="#22c55e" style={{marginRight:"6px"}}/>
                  <span style={{fontSize:"9px",color:"#22c55e",fontWeight:600}}>{audioName}</span>
                  <div style={{position:"absolute",top:0,bottom:0,left:`${audioTrimIn}%`,right:`${100-audioTrimOut}%`,background:"rgba(34,197,94,0.3)",borderRadius:"4px"}}/>
                </div>
              )}

              {/* TRACK 3: Timed Text Clips Track */}
              <div style={{position:"relative",height:"26px",background:isDark?"rgba(234,179,8,0.08)":"rgba(234,179,8,0.04)",borderRadius:"6px",border:"1px solid rgba(234,179,8,0.2)",overflow:"hidden"}}>
                {textClips.map(clip=>{
                  const leftPct=videoDur>0?(clip.startTime/videoDur)*100:0;
                  const widthPct=videoDur>0?(clip.duration/videoDur)*100:10;
                  const isSel=selectedClipId===clip.id;
                  return(
                    <div key={clip.id} onClick={()=>setSelectedClipId(clip.id)}
                      style={{position:"absolute",top:"2px",bottom:"2px",left:`${leftPct}%`,width:`${widthPct}%`,
                              background:isSel?"#eab308":"rgba(234,179,8,0.4)",borderRadius:"4px",
                              border:isSel?"2px solid #fff":"1px solid rgba(255,255,255,0.3)",
                              color:"#000",fontSize:"9px",fontWeight:700,padding:"2px 4px",
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer"}}>
                      {clip.text}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{flexShrink:0,width:"185px",background:V("panel"),borderLeft:`1px solid ${V("border")}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${V("border")}`}}>
            {(["adjust","audio","ai","info"] as RightPanel[]).map(tab=>(
              <button key={tab} onClick={()=>setRightPanel(tab)}
                style={{flex:1,padding:"7px 2px",border:"none",cursor:"pointer",fontSize:"9px",fontWeight:600,
                        background:rightPanel===tab?"rgba(99,102,241,0.1)":"transparent",
                        color:rightPanel===tab?"#a5b4fc":V("text-dim")}}>
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="ce-panel-scroll" style={{flex:1,overflowY:"auto",padding:"10px"}}>
            {rightPanel==="adjust"&&(
              <>
                <div style={{marginBottom:"10px"}}>
                  <span style={{fontSize:"9px",color:V("text-dim")}}>Brightness: {brightness}</span>
                  <input type="range" min={-100} max={100} value={brightness} onChange={e=>setBrightness(Number(e.target.value))} style={{width:"100%",accentColor:"#fbbf24"}}/>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <span style={{fontSize:"9px",color:V("text-dim")}}>Contrast: {contrast}</span>
                  <input type="range" min={-100} max={100} value={contrast} onChange={e=>setContrast(Number(e.target.value))} style={{width:"100%",accentColor:"#60a5fa"}}/>
                </div>
                <div style={{marginBottom:"10px"}}>
                  <span style={{fontSize:"9px",color:V("text-dim")}}>Filter Preset</span>
                  <select value={filter} onChange={e=>setFilter(e.target.value as FilterPr)} style={{width:"100%",background:V("input-bg"),border:`1px solid ${V("border")}`,borderRadius:"6px",color:V("text"),fontSize:"10px",padding:"4px"}}>
                    {FILTERS.map(f=><option key={f.value} value={f.value}>{f.emoji} {f.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {rightPanel==="audio"&&(
              <div>
                <div style={{fontSize:"9px",fontWeight:700,color:V("text-faint"),marginBottom:"8px"}}>Audio Track Cut & Layer</div>
                {!audioFile?(
                  <label style={{cursor:"pointer",padding:"8px",borderRadius:"8px",background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.3)",color:"#22c55e",fontSize:"10px",fontWeight:600,display:"block",textAlign:"center"}}>
                    <Music size={12} style={{display:"inline",marginRight:"4px"}}/> Add Music Track
                    <input type="file" accept="audio/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)loadAudio(f);}}/>
                  </label>
                ):(
                  <div>
                    <div style={{fontSize:"10px",color:"#22c55e",fontWeight:600,marginBottom:"8px"}}>{audioName}</div>
                    <canvas ref={waveCanvasRef} width={160} height={40} style={{width:"100%",height:"40px",borderRadius:"6px",background:"rgba(0,0,0,0.2)",marginBottom:"8px"}}/>
                    <div style={{marginBottom:"8px"}}>
                      <span style={{fontSize:"9px",color:V("text-dim")}}>Volume: {Math.round(audioVol*100)}%</span>
                      <input type="range" min={0} max={1} step={0.01} value={audioVol} onChange={e=>setAudioVol(Number(e.target.value))} style={{width:"100%",accentColor:"#22c55e"}}/>
                    </div>
                  </div>
                )}
              </div>
            )}

            {rightPanel==="ai"&&(
              <div>
                {[
                  {label:"Auto Enhance",act:runAutoEnhance,c:"#a855f7"},
                  {label:"Extract Palette",act:runExtractPalette,c:"#f472b6"},
                  {label:"Remove Background",act:runBgRemoval,c:"#22d3ee"},
                  {label:"Noise Reduction",act:runNoiseReduction,c:"#06b6d4"},
                  {label:"Vignette",act:runVignette,c:"#6366f1"},
                ].map(({label,act,c})=>(
                  <button key={label} onClick={act} style={{width:"100%",padding:"7px",borderRadius:"7px",border:`1px solid ${V("border")}`,background:V("hover"),color:c,fontSize:"10px",fontWeight:700,marginBottom:"5px",cursor:"pointer",textAlign:"left"}}>
                    ✨ {label}
                  </button>
                ))}
              </div>
            )}

            {rightPanel==="info"&&(
              <div style={{fontSize:"10px",color:V("text-dim")}}>
                <div>File: {loadedFile?.name||"Blank"}</div>
                <div>Mode: {fileMode}</div>
                <div>Size: {canvasDims.w}x{canvasDims.h}</div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function CanvasStudio(props: StudioProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (props.portalMode) {
    return createPortal(<CanvasStudioInner {...props} />, document.body);
  }
  return <CanvasStudioInner {...props} />;
}
