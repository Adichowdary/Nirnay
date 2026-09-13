"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Clock, LogOut, RefreshCw } from "lucide-react";

// Standard government session inactivity timeout (15 mins idle, 2 min countdown)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const WARNING_COUNTDOWN_SECONDS = 120;

export function SessionTimeoutWarning() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_COUNTDOWN_SECONDS);
  const lastActivityRef = useRef<number>(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
      setSecondsRemaining(WARNING_COUNTDOWN_SECONDS);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }
  }, [showWarning]);

  const handleLogout = useCallback(() => {
    if (typeof document !== "undefined") {
      document.cookie = "insight_demo_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("insight_active_role");
      window.location.href = "/login?timeout=true";
    }
  }, []);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      if (!showWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));

    // Check idle interval every 15 seconds
    const interval = setInterval(() => {
      if (!showWarning) {
        const elapsed = Date.now() - lastActivityRef.current;
        if (elapsed >= IDLE_TIMEOUT_MS) {
          setShowWarning(true);
          setSecondsRemaining(WARNING_COUNTDOWN_SECONDS);
        }
      }
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleActivity));
      clearInterval(interval);
    };
  }, [showWarning]);

  // Countdown timer once warning is displayed
  useEffect(() => {
    if (showWarning) {
      countdownTimerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };
  }, [showWarning, handleLogout]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-5 animate-in"
        style={{
          background: "var(--surface-primary)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(239, 68, 68, 0.12)",
              color: "var(--red-500, #ef4444)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
              GIGW 3.0 &amp; NIC Security Compliance
            </span>
            <h2 id="session-warning-title" className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Session Inactivity Alert
            </h2>
          </div>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Your session has been inactive for over 15 minutes. For security and to protect sensitive grievance &amp; inspection records, your session will automatically terminate in:
        </p>

        {/* Countdown Box */}
        <div
          className="flex items-center justify-center gap-3 p-4 rounded-xl border"
          style={{
            background: "var(--surface-secondary)",
            borderColor: "var(--border-primary)",
          }}
        >
          <Clock size={22} className="text-amber-500 animate-pulse" />
          <span className="text-3xl font-extrabold font-mono tabular-nums tracking-wider text-amber-500">
            {formattedTime}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border-primary)" }}>
          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border"
            style={{
              borderColor: "var(--border-primary)",
              color: "var(--text-secondary)",
              background: "var(--surface-secondary)",
            }}
          >
            <LogOut size={14} /> Log Out Now
          </button>
          <button
            type="button"
            onClick={resetActivity}
            className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <RefreshCw size={14} /> Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
}
