"use client";

import { useState, useCallback } from "react";
import { Fingerprint, UserCheck, ArrowRight } from "lucide-react";
import { FaceLogin } from "./FaceLogin";
import { FaceEnroll } from "./FaceEnroll";

interface FaceLoginButtonProps {
  userId: string;
  onSuccess: (sessionData: unknown) => void;
  onFallback: () => void;
}

type FaceView = "idle" | "login" | "enroll" | "status";

export function FaceLoginButton({ userId, onSuccess, onFallback }: FaceLoginButtonProps) {
  const [view, setView] = useState<FaceView>("idle");
  const [enrollmentStatus, setEnrollmentStatus] = useState<"loading" | "enrolled" | "not_enrolled">("loading");

  // Check enrollment status when component mounts or userId changes
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/auth/face/status");
      const data = await res.json();
      setEnrollmentStatus(data.enrolled ? "enrolled" : "not_enrolled");
    } catch {
      setEnrollmentStatus("not_enrolled");
    }
  }, []);

  // Check status on first interaction
  const handleOpen = async () => {
    await checkStatus();
    setView("login");
  };

  if (!userId) {
    return (
      <div className="w-full">
        <div
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold"
          style={{
            background: "var(--surface-elevated, #f1f5f9)",
            color: "var(--text-tertiary, #94a3b8)",
            fontSize: "var(--text-sm, 14px)",
            border: "1px solid var(--border-subtle, #e2e8f0)",
          }}
        >
          <Fingerprint size={18} />
          Enter User ID to enable Face Login
        </div>
      </div>
    );
  }

  if (view === "idle") {
    return (
      <div className="w-full">
        <button
          onClick={handleOpen}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold cursor-pointer transition-all hover:opacity-90"
          style={{
            background: "linear-gradient(135deg, #4A2BC2, #7C3AED)",
            color: "#fff",
            fontSize: "var(--text-sm, 14px)",
          }}
        >
          <Fingerprint size={18} />
          Face Login
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  if (view === "login") {
    return (
      <div className="w-full">
        <FaceLogin
          userId={userId}
          onSuccess={onSuccess}
          onFallback={() => setView("idle")}
        />
        {enrollmentStatus === "not_enrolled" && (
          <button
            onClick={() => setView("enroll")}
            className="mt-3 flex items-center justify-center gap-2 w-full py-2 rounded-lg font-medium cursor-pointer transition-all hover:opacity-90"
            style={{
              background: "transparent",
              color: "var(--primary, #4A2BC2)",
              fontSize: "var(--text-xs, 12px)",
              border: "1px dashed var(--primary, #4A2BC2)",
            }}
          >
            <UserCheck size={14} />
            Enroll your face for faster login
          </button>
        )}
      </div>
    );
  }

  if (view === "enroll") {
    return (
      <FaceEnroll
        userId={userId}
        onComplete={() => {
          setEnrollmentStatus("enrolled");
          setView("login");
        }}
        onCancel={() => setView("idle")}
      />
    );
  }

  return null;
}
