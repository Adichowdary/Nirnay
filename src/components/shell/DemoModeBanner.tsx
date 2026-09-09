"use client";
import { AlertTriangle } from "lucide-react";

export function DemoModeBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemo) return null;

  return (
    <div className="demo-banner" role="banner" aria-label="Demo environment notice">
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#e0a100",
          flexShrink: 0,
          boxShadow: "0 0 0 2px rgba(224,161,0,0.25)",
        }}
      />
      <AlertTriangle size={12} style={{ color: "#b37e00" }} />
      <span style={{ fontWeight: 600, letterSpacing: "0.04em" }}>DEMO ENVIRONMENT</span>
      <span style={{ opacity: 0.7, marginLeft: 4 }}>
        — All data is fictional. No real beneficiary information is used. Features are for prototype demonstration only.
      </span>
    </div>
  );
}
