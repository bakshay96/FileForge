"use client";

import React, { useEffect, useState } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export default function CountdownTimer({ expiresAt, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTime = () => {
      const exp = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = exp - now;

      if (diff <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ minutes, seconds, isExpired: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 border border-slate-500/20 text-slate-400">
        <AlertTriangle className="w-3.5 h-3.5" /> File Expired & Deleted
      </div>
    );
  }

  const totalSecs = timeLeft.minutes * 60 + timeLeft.seconds;
  let colorStyle = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  if (totalSecs < 120) {
    colorStyle = "bg-red-500/10 border-red-500/20 text-red-400 animate-pulse";
  } else if (totalSecs < 600) {
    colorStyle = "bg-amber-500/10 border-amber-500/20 text-amber-400";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${colorStyle}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>
        {String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")} left
      </span>
    </div>
  );
}
