"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRealTimeStream, LiveStreamEvent } from "@/hooks/useRealTimeStream";
import {
  Radio,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  ExternalLink,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveActivityTicker() {
  const { events, latestEvent, activeCount, triggerManualEvent } = useRealTimeStream(13000);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [dockPosition, setDockPosition] = useState<"right" | "left">("right");

  const getSeverityBadge = (sev: LiveStreamEvent["severity"]) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "MEDIUM":
        return "bg-sky-500/20 text-sky-400 border-sky-500/30";
      default:
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    }
  };

  const getTargetUrl = (type: LiveStreamEvent["type"]) => {
    switch (type) {
      case "BIOMETRIC_COLLISION":
      case "GRANT_DIVERGENCE":
        return "/dashboard/ghost-detection";
      case "CCTV_ANOMALY":
        return "/dashboard/monitor";
      case "GRIEVANCE_FILED":
        return "/dashboard/grievances";
      case "GEOFENCE_BREACH":
      case "INSPECTION_SYNC":
        return "/dashboard/map";
      default:
        return "/dashboard/ai-signals";
    }
  };

  // If dismissed by user, render a compact floating restore badge on both desktop and mobile
  if (isDismissed) {
    return (
      <div
        className={cn(
          "fixed bottom-20 sm:bottom-4 z-40 transition-all duration-300",
          dockPosition === "right" ? "right-3 sm:right-4" : "left-3 sm:left-72"
        )}
      >
        <button
          type="button"
          onClick={() => {
            setIsDismissed(false);
            setIsMobileOpen(true);
          }}
          className="p-2.5 sm:px-3 sm:py-2 rounded-full bg-slate-950/95 border border-slate-700 text-rose-400 shadow-2xl hover:scale-105 active:scale-95 transition flex items-center gap-2 text-xs font-bold backdrop-blur-md cursor-pointer group"
          title="Restore DoSJE Live Stream"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <Radio size={14} className="group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline text-slate-200">DoSJE Live Stream</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {activeCount}
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Minimized Pill (only visible on mobile when not open) */}
      {!isMobileOpen && (
        <div
          className={cn(
            "sm:hidden fixed bottom-20 z-30 transition-all duration-300",
            dockPosition === "right" ? "right-3" : "left-3"
          )}
        >
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold transition-all active:scale-95 cursor-pointer"
            aria-label="Open live anomaly telemetry stream"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Radio size={12} className="text-rose-400" />
            <span className="text-[11px] font-mono">{activeCount} Pings</span>
          </button>
        </div>
      )}

      {/* Mobile Backdrop when open on mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs sm:hidden z-35"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Main Stream Card — docked on desktop, overlay modal on mobile */}
      <div
        className={cn(
          "z-40 select-none transition-all duration-300",
          "sm:fixed sm:bottom-4 sm:max-w-md sm:w-full sm:block",
          dockPosition === "right" ? "sm:right-4 sm:left-auto" : "sm:left-72 sm:right-auto",
          isMobileOpen
            ? "fixed bottom-20 inset-x-3 max-w-sm mx-auto block"
            : "hidden sm:block"
        )}
      >
        <div className="rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-800 text-slate-100 shadow-2xl overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-200 flex items-center gap-1">
                <Radio size={12} className="text-rose-400" />
                DoSJE Live Stream
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {activeCount} Pings
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDockPosition((pos) => (pos === "right" ? "left" : "right"))}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={dockPosition === "right" ? "Move ticker to Left Side" : "Move ticker to Right Side"}
                aria-label="Toggle side placement"
              >
                <ArrowLeftRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => triggerManualEvent()}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-[10px] flex items-center gap-0.5 cursor-pointer"
                title="Simulate immediate live ping"
              >
                <Sparkles size={11} className="text-purple-400" />
                <span className="hidden sm:inline font-mono">Ping</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title={isExpanded ? "Collapse ticker" : "Expand all events"}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDismissed(true);
                  setIsMobileOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                title="Minimize to floating button"
              >
                <X size={14} />
              </button>
            </div>
          </div>

        {/* Latest Active Event (Always Visible) */}
        {latestEvent && (
          <div className="p-3 hover:bg-slate-900/40 transition">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase border",
                    getSeverityBadge(latestEvent.severity)
                  )}
                >
                  {latestEvent.severity}
                </span>
                <span className="text-[10px] font-bold text-slate-300 font-mono">
                  {latestEvent.location}
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">{latestEvent.timestamp}</span>
            </div>

            <p className="text-xs font-bold text-white tracking-tight leading-snug">
              {latestEvent.title}
            </p>
            <p className="text-[11px] text-slate-200 line-clamp-2 mt-0.5 font-medium">
              {latestEvent.description}
            </p>

            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-800/60 text-[10px]">
              <span className="text-slate-300 truncate max-w-[200px] font-semibold">
                {latestEvent.facilityName}
              </span>
              <Link
                href={getTargetUrl(latestEvent.type)}
                className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 group"
              >
                <span>Investigate</span>
                <ExternalLink size={10} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* Expanded Event History Drawer */}
        {isExpanded && (
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 border-t border-slate-800 bg-slate-950/90">
            {events.slice(1, 8).map((evt) => (
              <div key={evt.id} className="p-2.5 hover:bg-slate-900/50 transition flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase border",
                        getSeverityBadge(evt.severity)
                      )}
                    >
                      {evt.severity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-200 truncate">
                      {evt.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate font-medium">
                    {evt.facilityName} • {evt.location}
                  </p>
                </div>
                <Link
                  href={getTargetUrl(evt.type)}
                  className="text-slate-400 hover:text-rose-400 transition p-1 shrink-0"
                >
                  <ExternalLink size={12} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
  );
}
