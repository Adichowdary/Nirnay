"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { FlutterWebView } from "@/components/flutter/FlutterWebView";
import { FadeIn } from "@/components/motion/MicroInteractions";
import { Smartphone, ShieldCheck, Zap } from "lucide-react";

export default function FieldAppPage() {
  const [lastSubmit, setLastSubmit] = useState<string | null>(null);

  return (
    <AppShell
      title="Field App — Flutter Bridge"
      subtitle="Native-speed offline capture embedded in web workflow"
    >
      <div className="p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
        <FadeIn>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: Smartphone, t: "Offline-first", d: "Dexie queue + Flutter cache for zero-network zones" },
              { icon: Zap, t: "Micro-animated", d: "Spring presses, lifts, and premium toasts" },
              { icon: ShieldCheck, t: "Zero-trust", d: "Sandboxed iframe, postMessage-only bridge" },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="card-premium p-4">
                <Icon size={18} className="text-blue-base mb-2" />
                <p className="text-sm font-bold text-primary">{t}</p>
                <p className="text-xs text-muted mt-1">{d}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <FlutterWebView
            title="Inspection Capture — Flutter Module"
            height={520}
            onMessage={(msg) => {
              if (msg.type === "inspection-submit") {
                setLastSubmit(JSON.stringify(msg.payload ?? msg));
              }
            }}
          />
        </FadeIn>

        {lastSubmit && (
          <div className="toast-premium card p-4 border-l-4 border-l-green-base">
            <p className="section-label mb-1">Last Flutter submit</p>
            <code className="text-xs font-mono text-primary break-all">{lastSubmit}</code>
          </div>
        )}
      </div>
    </AppShell>
  );
}
