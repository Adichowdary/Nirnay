"use client";

import Link from "next/link";
import { DEMO_AI_SIGNALS } from "@/lib/demo-data";
import { formatRelativeTime, getRiskColor } from "@/lib/utils";
import { Brain, ChevronRight, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import type { AISignalSeverity } from "@/types";

const SEVERITY_CONFIG: Record<AISignalSeverity, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: "var(--color-danger)", bg: "var(--color-danger-bg)" },
  high: { icon: AlertTriangle, color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  medium: { icon: AlertTriangle, color: "var(--amber-600)", bg: "var(--amber-50)" },
  low: { icon: CheckCircle, color: "var(--color-success)", bg: "var(--color-success-bg)" },
};

export function AISignalPanel() {
  const unresolved = DEMO_AI_SIGNALS.filter((s) => !s.is_resolved);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-2">
          <Brain size={14} style={{ color: "var(--purple-500)" }} />
          <span
            className="text-xs font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            AI Signals
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-bold"
            style={{
              background: "var(--color-purple-bg)",
              color: "var(--color-purple)",
            }}
          >
            {unresolved.length} OPEN
          </span>
        </div>
        <Link
          href="/dashboard/ai-signals"
          className="flex items-center gap-1 text-[10px] font-semibold transition-colors"
          style={{ color: "var(--color-info)" }}
        >
          All <ChevronRight size={10} />
        </Link>
      </div>

      {/* Disclaimer */}
      <div
        className="px-4 py-2 flex-shrink-0"
        style={{
          background: "var(--color-purple-bg)",
          borderBottom: "1px solid var(--color-purple-border)",
        }}
      >
        <p
          className="text-[10px] font-medium"
          style={{ color: "var(--color-purple)", lineHeight: 1.4 }}
        >
          AI-assisted detection. Human verification required before action.
        </p>
      </div>

      {/* Signals */}
      <div className="overflow-y-auto flex-1">
        {unresolved.map((signal) => {
          const config = SEVERITY_CONFIG[signal.severity];
          const Icon = config.icon;

          return (
            <Link
              key={signal.id}
              href={`/dashboard/ai-signals`}
              className="block transition-colors"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="px-4 py-3">
                {/* Header */}
                <div className="flex items-start gap-2 mb-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: config.bg }}
                  >
                    <Icon size={12} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase"
                        style={{
                          background: config.bg,
                          color: config.color,
                        }}
                      >
                        {signal.severity}
                      </span>
                      <span
                        className="text-[10px] tabular font-bold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {signal.risk_score}/100
                      </span>
                    </div>
                    <p
                      className="text-xs font-semibold leading-tight"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {signal.title}
                    </p>
                  </div>
                </div>

                {/* Project */}
                <p
                  className="text-[10px] mb-1.5 truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {signal.project_name}
                </p>

                {/* Summary */}
                <div className="ai-signal-card mb-2">
                  <p
                    className="text-[11px] leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {signal.summary}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] tabular" style={{ color: "var(--text-muted)" }}>
                    Confidence:{" "}
                    <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                      {signal.explanation.confidence}%
                    </span>
                  </span>
                  <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>
                    {formatRelativeTime(signal.created_at)}
                  </span>
                </div>

                {/* Review Badge */}
                {signal.requires_human_review && (
                  <div
                    className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg"
                    style={{ background: "var(--color-warning-bg)" }}
                  >
                    <AlertTriangle size={10} style={{ color: "var(--color-warning)" }} />
                    <span
                      className="text-[9px] font-semibold"
                      style={{ color: "var(--color-warning)" }}
                    >
                      Human review required
                    </span>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* CTA */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <Link
          href="/dashboard/ai-signals"
          className="btn btn-secondary w-full py-2 text-xs"
        >
          <Brain size={12} style={{ color: "var(--purple-500)" }} />
          View All AI Intelligence
        </Link>
      </div>
    </div>
  );
}
