"use client";
import { AlertTriangle } from "lucide-react";

export function DemoModeBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemo) return null;

  return (
    <div className="demo-banner flex items-center justify-between" role="banner" aria-label="Demo environment notice">
      <div className="flex items-center gap-2">
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#d97706",
            flexShrink: 0,
            boxShadow: "0 0 0 2px rgba(217,119,6,0.25)",
          }}
          className="animate-pulse"
        />
        <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400" />
        <span className="font-bold tracking-wider text-[10px] uppercase font-mono">
          GOVERNMENT SIMULATION SANDBOX
        </span>
        <span className="hidden md:inline opacity-80 text-[11px]">
          — Telemetry & records are simulated for Department of Social Justice & Empowerment prototype evaluation.
        </span>
      </div>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold">
        NIRNAY v3.0-PROTOTYPE
      </span>
    </div>
  );
}
