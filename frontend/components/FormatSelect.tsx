"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, FileImage, FileText } from "lucide-react";

export interface FormatOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
}

interface FormatSelectProps {
  value: string;
  options: FormatOption[];
  onChange: (val: string) => void;
  label?: string;
}

export default function FormatSelect({ value, options, onChange, label }: FormatSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={ref}>
      {label && <label className="text-xs text-slate-400 mb-1.5 block font-medium">{label}</label>}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-surface-700 hover:bg-surface-600
                   border border-white/10 hover:border-brand-500/50 rounded-xl px-4 py-2.5 text-sm
                   text-slate-100 font-medium transition-all duration-200 shadow-sm outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        <div className="flex items-center gap-2.5 truncate">
          <span className="w-6 h-6 rounded-md bg-brand-500/20 text-brand-400 font-bold text-xs flex items-center justify-center uppercase">
            {selected.value.slice(0, 3)}
          </span>
          <span className="truncate">{selected.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-brand-400" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface-800 border border-white/10 rounded-xl shadow-2xl
                        py-1.5 max-h-60 overflow-y-auto animate-fade-up backdrop-blur-xl">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm text-left
                            transition-colors duration-150 ${
                              isSelected
                                ? "bg-brand-500/20 text-brand-300 font-medium"
                                : "text-slate-200 hover:bg-white/5 hover:text-white"
                            }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center uppercase ${
                    isSelected ? "bg-brand-500 text-white" : "bg-white/5 text-slate-400"
                  }`}>
                    {opt.value.slice(0, 3)}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-brand-400 flex-shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
