"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Camera, MapPin, Clock, CheckCircle2, ChevronRight, Lock, Eye, Info } from "lucide-react";
import { createClient } from "@/lib/db/browser";

const CONSENT_VERSION = "v1.0-2025-08";

export default function ConsentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"notice" | "confirm">("notice");

  const handleDecline = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ biometric_status: "CONSENT_DECLINED" }).eq("id", user.id);
    }
    router.push("/dashboard");
  };

  const handleConsent = async () => {
    if (!agreed) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        biometric_status: "ENROLLED",
        consent_given_at: new Date().toISOString(),
        consent_version: CONSENT_VERSION,
      }).eq("id", user.id);
    }
    setSaving(false);
    router.push("/dashboard");
  };

  const checkpoints = [
    { icon: Clock, label: "Login", desc: "When you sign into INSIGHT on a new device" },
    { icon: MapPin, label: "Mission Start", desc: "When you begin a field inspection" },
    { icon: Camera, label: "Evidence Capture", desc: "When you capture photos or video" },
    { icon: Clock, label: "Mission End", desc: "When you submit a completed inspection" },
  ];

  return (
    <div className="min-h-dvh bg-app flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 rounded-[14px] mb-3 bg-blue-base flex items-center justify-center" style={{ boxShadow: "0 4px 16px rgba(46,107,255,.25)" }}>
            <Shield size={26} color="white" />
          </div>
          <h1 className="text-xl font-black text-primary mb-1.5" style={{ letterSpacing: "var(--tracking-tight)" }}>Biometric & Location Notice</h1>
          <p className="text-xs text-secondary leading-relaxed max-w-[360px]">
            INSIGHT collects biometric and location data to verify identity and ensure inspection integrity. Your consent is separate from the Terms of Service.
          </p>
        </div>

        {step === "notice" && (
          <div className="card p-5 space-y-5">
            {/* What is collected */}
            <section>
              <h2 className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5">
                <Camera size={14} className="text-blue-strong" /> What is collected
              </h2>
              <ul className="space-y-1.5">
                {[
                  "A face embedding (not a photo) — matched only against your enrolled reference.",
                  "Your GPS location at four specific checkpoints.",
                  "Device identifier for audit purposes.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-secondary leading-relaxed">
                    <CheckCircle2 size={13} className="text-green-strong flex-shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* When captured */}
            <section>
              <h2 className="text-sm font-bold text-primary mb-2 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-strong" /> When it&apos;s captured (4 checkpoints only)
              </h2>
              <div className="space-y-2">
                {checkpoints.map(cp => (
                  <div key={cp.label} className="flex gap-2.5 items-start">
                    <div className="w-7 h-7 rounded-md bg-blue-tint flex items-center justify-center flex-shrink-0">
                      <cp.icon size={13} className="text-blue-strong" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-primary">{cp.label}</div>
                      <div className="text-[11px] text-muted">{cp.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-2 italic">This is NOT continuous background tracking.</p>
            </section>

            {/* Why */}
            <section>
              <h2 className="text-sm font-bold text-primary mb-1.5 flex items-center gap-1.5">
                <Info size={14} className="text-blue-strong" /> Why this data is collected
              </h2>
              <p className="text-xs text-secondary leading-relaxed">
                To ensure inspection integrity and prevent misrepresentation — similar to the Government of India&apos;s AEBAS attendance system.
              </p>
            </section>

            {/* Who can see */}
            <section>
              <h2 className="text-sm font-bold text-primary mb-1.5 flex items-center gap-1.5">
                <Eye size={14} className="text-blue-strong" /> Who can see this data
              </h2>
              <ul className="space-y-1">
                {[
                  "You — your own verification history",
                  "System Administrator — investigating inspection integrity",
                  "No other role or third party has access",
                  "Every admin view is itself logged",
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs text-secondary">
                    <Lock size={11} className="text-muted flex-shrink-0 mt-0.5" /> {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Retention */}
            <div className="rounded-lg bg-surface-secondary p-3">
              <p className="text-[11px] text-secondary leading-relaxed">
                <strong>Retention:</strong> Verification events kept for <strong>180 days</strong> then auto-deleted. Biometric embedding deleted on consent withdrawal.
              </p>
            </div>

            <button type="button" onClick={() => setStep("confirm")} className="btn-primary w-full flex items-center justify-center gap-2">
              I&apos;ve read the notice <ChevronRight size={14} />
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="card p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-primary mb-1">Your explicit consent</h2>
              <p className="text-xs text-secondary leading-relaxed">
                This consent is separate from the Terms of Service. You are not required to provide it — but certain field assignments may require biometric verification.
              </p>
            </div>

            <label className="flex gap-2.5 cursor-pointer p-3.5 rounded-xl transition-all" style={{
              background: agreed ? "var(--green-tint)" : "var(--surface-secondary)",
              border: `1.5px solid ${agreed ? "var(--green-base)" : "var(--border)"}`,
            }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-0.5 flex-shrink-0 cursor-pointer" style={{ width: 16, height: 16 }} />
              <span className="text-xs text-primary leading-relaxed font-medium">
                I consent to INSIGHT collecting a face embedding, GPS location, and device ID at the four checkpoints described. I understand this is for attendance integrity only, is not continuous tracking, and I can withdraw consent at any time.
              </span>
            </label>

            <div className="flex gap-2.5">
              <button type="button" onClick={handleDecline} className="btn-secondary flex-1">Decline</button>
              <button type="button" onClick={handleConsent} disabled={!agreed || saving}
                className="flex-2 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all"
                style={{
                  background: agreed ? "var(--green-base)" : "var(--surface-secondary)",
                  color: agreed ? "#fff" : "var(--text-muted)",
                  cursor: agreed ? "pointer" : "not-allowed",
                }}
              >
                {saving ? "Saving…" : "I consent — Continue"}
              </button>
            </div>

            <p className="text-[10px] text-muted text-center">Consent: {CONSENT_VERSION} · {new Date().toLocaleString("en-IN")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
