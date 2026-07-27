"use client";

import React, { useEffect, useState } from "react";
import { FileImage, FileText, Eye, Info } from "lucide-react";

interface FilePreviewProps {
  file: File | null;
}

export default function FilePreview({ file }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDimensions(null);
      return;
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
      };
      img.src = url;

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
      setDimensions(null);
    }
  }, [file]);

  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  return (
    <div className="glass-card p-4 mt-4 border-brand-500/20 bg-brand-500/5 animate-fade-up">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-brand-300 uppercase tracking-wider">
        <Eye className="w-3.5 h-3.5" /> Upload Preview
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {isImage && previewUrl && (
          <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          </div>
        )}

        {isPdf && (
          <div className="w-full sm:w-28 h-28 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center flex-shrink-0 text-red-400">
            <FileText className="w-10 h-10 mb-1" />
            <span className="text-[10px] font-bold tracking-widest">PDF DOCUMENT</span>
          </div>
        )}

        <div className="flex-1 text-left w-full">
          <p className="text-sm font-semibold text-slate-100 truncate">{file.name}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-slate-500 block text-[10px]">FILE SIZE</span>
              <span className="font-mono font-medium text-slate-200">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-slate-500 block text-[10px]">FILE TYPE</span>
              <span className="font-mono font-medium text-slate-200 truncate block">
                {file.type || file.name.split(".").pop()?.toUpperCase()}
              </span>
            </div>
            {dimensions && (
              <div className="bg-white/5 rounded-lg p-2 border border-white/5 col-span-2">
                <span className="text-slate-500 block text-[10px]">DIMENSIONS</span>
                <span className="font-mono font-medium text-slate-200">
                  {dimensions.width} px × {dimensions.height} px
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
