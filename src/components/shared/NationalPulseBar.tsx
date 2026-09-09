"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Video,
  Fingerprint,
  ShieldAlert,
  IndianRupee,
  Sparkles,
  Zap,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NationalPulseBar() {
  const [cctvOnline, setCctvOnline] = useState(148);
  const [biometricToday, setBiometricToday] = useState(18420);
  const [activeInspections, setActiveInspections] = useState(12);
  const [leakagePreventedLakhs, setLeakagePreventedLakhs] = useState(124.6);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    // Subtle real-time ticking simulation
    const interval = setInterval(() => {
      // Small randomized delta
      const checkinDelta = Math.floor(Math.random() * 5) + 1;
      setBiometricToday((prev) => prev + checkinDelta);

      if (Math.random() > 0.6) {
        setCctvOnline((prev) => Math.max(140, Math.min(152, prev + (Math.random() > 0.5 ? 1 : -1))));
      }

      if (Math.random() > 0.7) {
        setLeakagePreventedLakhs((prev) => Number((prev + 0.1).toFixed(1)));
      }

      setPulseKey((k) => k + 1);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 p-3 text-white shadow-lg overflow-hidden relative">
      {/* Background ambient pulse line */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/5 via-transparent to-transparent" />

      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        {/* Live Badge */}
        <div className="flex items-center gap-2.5 pr-3 border-r border-slate-800">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-[10px] font-black tracking-widest uppercase font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            LIVE TELEMETRY
          </div>
          <span className="text-xs font-bold text-slate-300 hidden md:inline">
            National Central Command Pulse
          </span>
        </div>

        {/* Dynamic Metric Tickers */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
          {/* CCTV Feeds */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Video size={13} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Active CCTV Feeds</span>
              <span className="font-mono font-extrabold text-emerald-400 text-xs sm:text-sm">
                {cctvOnline} / 152 <span className="text-[10px] text-emerald-500 font-bold">(97.4%)</span>
              </span>
            </div>
          </div>

          {/* Biometric Check-ins Today */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Fingerprint size={13} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Biometric Check-ins Today</span>
              <span className="font-mono font-extrabold text-indigo-300 text-xs sm:text-sm">
                {biometricToday.toLocaleString("en-IN")}
                <span className="text-[10px] text-indigo-400 font-bold ml-1 animate-pulse">▲ Live</span>
              </span>
            </div>
          </div>

          {/* Active Inspections */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert size={13} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">Surprise Inspections</span>
              <span className="font-mono font-extrabold text-amber-400 text-xs sm:text-sm">
                {activeInspections} In-Flight
              </span>
            </div>
          </div>

          {/* Leakage Prevented */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <IndianRupee size={13} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-medium">DBT Leakage Prevented</span>
              <span className="font-mono font-extrabold text-rose-300 text-xs sm:text-sm">
                ₹{leakagePreventedLakhs} L
              </span>
            </div>
          </div>
        </div>

        {/* AI Health indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400">
          <Sparkles size={11} className="text-purple-400" />
          <span>YOLOv10 + DeepFace 60Hz</span>
        </div>
      </div>
    </div>
  );
}
