"use client";

import { DEMO_NOTIFICATIONS } from "@/lib/demo-data";
import { formatRelativeTime } from "@/lib/utils";
import { X, AlertTriangle, Info, AlertCircle, Settings } from "lucide-react";
import type { NotificationPriority } from "@/types";

const PRIORITY_STYLES: Record<NotificationPriority, { bg: string; text: string; icon: React.FC<{ size: number }> }> = {
  critical: { bg: "var(--red-tint)", text: "var(--red-strong)", icon: ({ size }) => <AlertCircle size={size} /> },
  action_required: { bg: "var(--amber-tint)", text: "var(--amber-strong)", icon: ({ size }) => <AlertTriangle size={size} /> },
  information: { bg: "var(--blue-tint)", text: "var(--blue-strong)", icon: ({ size }) => <Info size={size} /> },
  system: { bg: "var(--surface-secondary)", text: "var(--text-muted)", icon: ({ size }) => <Settings size={size} /> },
};

const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  critical: "CRITICAL",
  action_required: "ACTION REQUIRED",
  information: "INFORMATION",
  system: "SYSTEM",
};

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute right-4 top-14 card animate-in slide-in-r w-80"
        style={{ maxHeight: "70vh", display: "flex", flexDirection: "column" }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-base">
          <h2 style={{ fontSize: "0.857rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Notifications
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Close notifications"
          >
            <X size={14} style={{ color: "var(--text-muted)" }} aria-hidden="true" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1" aria-live="polite">
          {DEMO_NOTIFICATIONS.map((n) => {
            const style = PRIORITY_STYLES[n.priority];
            const Icon = style.icon;
            return (
              <button
                key={n.id}
                type="button"
                className="w-full text-left px-4 py-3 border-b border-base last:border-0 hover:bg-secondary focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors cursor-pointer"
                style={{ background: n.is_read ? undefined : "rgba(46,107,255,0.02)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: 28,
                      height: 28,
                      background: style.bg,
                      color: style.text,
                      marginTop: 1,
                    }}
                    aria-hidden="true"
                  >
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="status-pill"
                        style={{ background: style.bg, color: style.text, padding: "1px 5px" }}
                      >
                        {PRIORITY_LABELS[n.priority]}
                      </span>
                      {!n.is_read && (
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "var(--blue-base)",
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: n.is_read ? 400 : 500,
                        color: "var(--text-primary)",
                        lineHeight: 1.3,
                      }}
                    >
                      {n.title}
                    </p>
                    <p style={{ fontSize: "0.714rem", color: "var(--text-muted)", marginTop: 2 }}>
                      {n.message.slice(0, 80)}…
                    </p>
                    <p suppressHydrationWarning style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4 }}>
                      {formatRelativeTime(n.created_at)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-base text-center">
          <button
            type="button"
            style={{ fontSize: "0.75rem", color: "var(--blue-base)", fontWeight: 500 }}
            className="hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
          >
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
}
