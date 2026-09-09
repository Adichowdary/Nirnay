"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Scan,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicQRAssertionModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityName: string;
  facilityId: string;
  onVerified: () => void;
}

export function DynamicQRAssertionModal({
  isOpen,
  onClose,
  facilityName,
  facilityId,
  onVerified,
}: DynamicQRAssertionModalProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [dynamicToken, setDynamicToken] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  // Generate rotating dynamic token every 30 seconds (TOTP crypto simulation)
  useEffect(() => {
    const generateToken = () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let res = "";
      for (let i = 0; i < 8; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${facilityId.toUpperCase()}-${res}`;
    };

    setDynamicToken(generateToken());
    setSecondsRemaining(30);

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setDynamicToken(generateToken());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [facilityId]);

  if (!isOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setVerificationSuccess(true);
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1200);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-md bg-slate-950 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Dynamic Rotating QR Lock</h3>
              <p className="text-[11px] text-slate-400">Anti-Spoofing Physical Presence Assertion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-slate-100 text-sm">{facilityName}</h4>
            <p className="text-xs text-slate-400 max-w-xs">
              Scan the facility's live display terminal or dynamic sticker QR code to prove on-site presence.
            </p>
          </div>

          {/* Dynamic QR Display Box with scanning animation */}
          <div className="relative w-48 h-48 rounded-2xl bg-white p-3 flex flex-col items-center justify-center shadow-2xl border-4 border-cyan-500/40">
            {/* QR Pattern Representation */}
            <div className="grid grid-cols-6 gap-1 w-full h-full p-2 bg-slate-100 rounded-lg">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-sm transition-colors duration-500",
                    (i % 2 === 0 || i % 5 === 0 || i < 6 || i > 30)
                      ? "bg-slate-900"
                      : "bg-transparent"
                  )}
                />
              ))}
            </div>

            {/* Laser scanning bar */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,1)] animate-bounce" />
            )}

            {verificationSuccess && (
              <div className="absolute inset-0 bg-emerald-600/90 rounded-xl flex flex-col items-center justify-center text-white space-y-1 backdrop-blur-sm animate-in zoom-in">
                <CheckCircle2 className="w-10 h-10 text-white" />
                <span className="font-bold text-xs uppercase">QR Validated</span>
              </div>
            )}
          </div>

          {/* Token & Expiry Counter */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">TOTP Token:</span>
              <span className="font-bold text-cyan-300">{dynamicToken}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Rotates in:</span>
              </div>
              <span className="font-mono font-bold text-amber-300">{secondsRemaining}s</span>
            </div>
          </div>

          {/* Action */}
          <button
            type="button"
            disabled={isScanning || verificationSuccess}
            onClick={handleSimulateScan}
            className={cn(
              "w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer",
              verificationSuccess
                ? "bg-emerald-600 text-white"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-95 text-white"
            )}
          >
            <Scan className="w-4 h-4" />
            {isScanning ? "Decoding Cryptographic QR..." : "Scan & Verify Physical Presence"}
          </button>
        </div>
      </div>
    </div>
  );
}
