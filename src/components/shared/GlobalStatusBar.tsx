"use client";

import { useState, useEffect, useRef } from "react";
import { DEMO_METRICS } from "@/lib/demo-data";
import { formatIndianNumber } from "@/lib/utils";
import { Video, AlertTriangle, Activity, Eye, FileText, AlertCircle, Camera, Users, Clock } from "lucide-react";

interface MetricItem {
  key: keyof typeof DEMO_METRICS;
  label: string;
  icon: React.FC<{ size: number; style?: React.CSSProperties }>;
  color: string;
}

const METRICS: MetricItem[] = [
  { key: "projects_monitored", label: "Projects",   icon: ({ size, style }) => <Eye size={size} style={style} />,           color: "var(--blue-500)"  },
  { key: "active_inspections", label: "Active",     icon: ({ size, style }) => <Activity size={size} style={style} />,      color: "var(--green-500)" },
  { key: "live_sites",         label: "Live Sites", icon: ({ size, style }) => <Video size={size} style={style} />,         color: "var(--blue-500)"  },
  { key: "open_anomalies",     label: "Anomalies",  icon: ({ size, style }) => <AlertTriangle size={size} style={style} />, color: "var(--amber-500)" },
  { key: "pending_reports",    label: "Reports",    icon: ({ size, style }) => <FileText size={size} style={style} />,      color: "var(--text-muted)"},
  { key: "critical_alerts",    label: "Critical",   icon: ({ size, style }) => <AlertCircle size={size} style={style} />,   color: "var(--red-500)"   },
  { key: "inspectors_active",  label: "Inspectors", icon: ({ size, style }) => <Users size={size} style={style} />,         color: "var(--green-500)" },
];

function AnimatedNumber({ value, duration = 180 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const startTime = useRef<number | null>(null);
  const frame = useRef<number>(0);

  useEffect(() => {
    start.current = display;
    startTime.current = null;

    function animate(ts: number) {
      if (startTime.current === null) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start.current + (value - start.current) * eased));
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    }

    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{formatIndianNumber(display)}</>;
}

function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      setTime(
        new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        })
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex items-center gap-1.5 px-3 flex-shrink-0"
      style={{ height: "100%", borderRight: "1px solid var(--border-light)" }}
      title="Indian Standard Time"
    >
      <Clock size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
      <div className="flex items-baseline gap-0.5">
        <span
          className="tabular font-bold"
          style={{ fontSize: "0.88rem", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}
        >
          {time}
        </span>
        <span style={{ fontSize: "0.68rem", color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.04em" }}>IST</span>
      </div>
    </div>
  );
}

export function GlobalStatusBar() {
  const cctvLabel = `${DEMO_METRICS.cctv_online}/${DEMO_METRICS.cctv_total}`;

  return (
    <div
      className="flex items-center gap-0 overflow-x-auto flex-shrink-0"
      style={{
        height: "var(--statusbar-h)",
        background: "var(--surface-card)",
        borderBottom: "1px solid var(--border-light)",
        minHeight: "var(--statusbar-h)",
      }}
      role="status"
      aria-label="System status metrics"
    >
      {METRICS.map(({ key, label, icon: Icon, color }) => {
        const value = DEMO_METRICS[key] as number;
        const isCritical = key === "critical_alerts" && value > 0;
        const isAnomaly  = key === "open_anomalies"  && value > 0;

        return (
          <div
            key={key}
            className="flex items-center gap-2 px-3 flex-shrink-0 transition-colors"
            style={{
              height: "100%",
              borderRight: "1px solid var(--border-light)",
              cursor: "default",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <Icon size={13} style={{ color, flexShrink: 0 }} />
            <div className="flex items-baseline gap-1">
              <span
                className="tabular font-bold"
                style={{
                  fontSize: "0.88rem",
                  color: isCritical
                    ? "var(--color-danger)"
                    : isAnomaly
                    ? "var(--color-warning)"
                    : "var(--text-primary)",
                  letterSpacing: "-0.01em",
                }}
              >
                <AnimatedNumber value={value} />
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-secondary)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}

      {/* CCTV */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0 transition-colors"
        style={{
          height: "100%",
          borderRight: "1px solid var(--border-light)",
          cursor: "default",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-secondary)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <Camera size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        <div className="flex items-baseline gap-1">
          <span className="tabular font-bold" style={{ fontSize: "0.88rem", color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            {cctvLabel}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 700 }}>CCTV</span>
        </div>
      </div>

      {/* Live Clock */}
      <LiveClock />

      {/* LIVE Indicator */}
      <div className="flex items-center gap-1.5 px-3 ml-auto flex-shrink-0">
        <div
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: "var(--green-500)",
            animation: "pulse-dot 2.5s ease-in-out infinite",
          }}
        />
        <span
          className="font-bold"
          style={{
            fontSize: "0.65rem",
            color: "var(--green-600)",
            letterSpacing: "0.06em",
          }}
        >
          LIVE
        </span>
      </div>
    </div>
  );
}
