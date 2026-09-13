"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Languages,
  Play,
  RotateCcw,
  Send,
  X,
  Radio,
  Zap,
} from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  extractInspectionFromTranscript,
  ExtractedInspectionData,
  SupportedLanguage,
} from "@/lib/ai/speech-transcriber";
import { cn } from "@/lib/utils";

interface VoiceToReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyData: (data: ExtractedInspectionData) => void;
}

const DEFAULT_WAVEFORM = [15, 20, 25, 18, 22, 16, 20, 24, 18, 15, 20, 16];

export function VoiceToReportModal({
  isOpen,
  onClose,
  onApplyData,
}: VoiceToReportModalProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(
    SUPPORTED_LANGUAGES[0]
  );
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [waveformData, setWaveformData] = useState<number[]>([15, 25, 45, 20, 60, 30, 80, 40, 20, 50, 75, 30]);

  // Derived state via useMemo (avoids cascading render)
  const extractedData = useMemo(() => {
    if (transcript.trim().length > 5) {
      return extractInspectionFromTranscript(transcript, selectedLang.code);
    }
    return null;
  }, [transcript, selectedLang.code]);

  // Simulated audio waveform animator when recording is active
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setWaveformData((prev) =>
        prev.map(() => Math.floor(Math.random() * 85) + 15)
      );
    }, 120);
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartSimulatedDictation = () => {
    setIsRecording(true);
    setTranscript("");

    const phrase = selectedLang.samplePhrase;
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      charIndex += 3;
      if (charIndex <= phrase.length) {
        setTranscript(phrase.substring(0, charIndex));
      } else {
        setTranscript(phrase);
        setIsRecording(false);
        setWaveformData(DEFAULT_WAVEFORM);
        clearInterval(typingInterval);
      }
    }, 60);
  };

  const handleToggleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      setWaveformData(DEFAULT_WAVEFORM);
    } else {
      handleStartSimulatedDictation();
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onApplyData(extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div
        className="w-full max-w-3xl bg-slate-950 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">
                  Multilingual Voice-to-Report Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  AI Auto-Fill
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Dictate unannounced field audit observations in regional Indian languages.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Language Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-indigo-400" />
              Select Spoken Language:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-between transition text-left",
                    selectedLang.code === lang.code
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-sm"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  )}
                >
                  <span className="truncate">
                    {lang.nativeLabel} ({lang.label})
                  </span>
                  <span className="text-sm">{lang.flag}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live Recording Waveform & Mic */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center gap-1.5 h-16 px-4">
              {waveformData.map((height, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 rounded-full transition-all duration-100",
                    isRecording
                      ? "bg-gradient-to-t from-indigo-500 to-cyan-400 shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                      : "bg-slate-700"
                  )}
                  style={{ height: `${Math.max(10, height)}%` }}
                />
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleToggleMic}
                className={cn(
                  "px-6 py-3 rounded-2xl font-extrabold text-sm flex items-center gap-2.5 shadow-xl transition-all cursor-pointer",
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                    : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white"
                )}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-4 h-4" /> Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" /> Start Voice Dictation
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleStartSimulatedDictation}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Simulate Field Officer Audio
              </button>
            </div>
          </div>

          {/* Live Spoken Transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                Transcribed Audio Text ({selectedLang.nativeLabel}):
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Live transcript will appear here as you speak or dictate..."
              rows={3}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
            />
          </div>

          {/* AI Extracted Structured Checklist Preview */}
          {extractedData && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
                    AI Auto-Extracted Checklist &amp; Headcount
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Confidence: {Math.round(extractedData.confidenceScore * 100)}%
                </span>
              </div>

              {extractedData.observedAttendance && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Observed Headcount:</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">
                    {extractedData.observedAttendance} Beneficiaries
                  </span>
                </div>
              )}

              {/* Checklist Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(extractedData.answers).map(([qId, val]) => (
                  <div
                    key={qId}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="text-slate-400 uppercase">{qId}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        val === "YES"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : val === "NO"
                          ? "bg-rose-500/20 text-rose-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              {/* Critical Defects Identified */}
              {extractedData.criticalDefects.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Identified Non-Compliance Points:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-200">
                    {extractedData.criticalDefects.map((defect, idx) => (
                      <li key={idx}>{defect}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!extractedData}
            onClick={handleApply}
            className={cn(
              "px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all",
              extractedData
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white cursor-pointer"
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
            )}
          >
            <CheckCircle2 className="w-4 h-4" />
            Apply to Statutory Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
