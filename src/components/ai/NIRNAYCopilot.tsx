"use client";

import { useState, useRef, useEffect } from "react";
import {
  Brain,
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Shield,
  AlertTriangle,
  MapPin,
  ClipboardCheck,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  Zap,
  Radio,
} from "lucide-react";
import { DEMO_PROJECTS, DEMO_INSPECTORS } from "@/lib/demo-data";
import { useApp } from "@/components/shell/Providers";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  tags?: string[];
  suggestedAction?: {
    label: string;
    actionType: "inspect" | "filter_risk" | "export_pdf";
    payload?: string;
  };
}

const PRESET_PROMPTS = [
  "🚨 Which facilities have breached SLA or critical risk score?",
  "🗺️ Optimize surprise inspection routes for Andhra Pradesh",
  "📊 Summarize nationwide DPDP biometric attendance compliance",
  "⚡ Draft an urgent ministerial verification notice for high-risk NGO centers",
];

let messageCounter = 0;
function createMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function NIRNAYCopilot({
  isOpen,
  onClose,
  onOpenAuditModal,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuditModal?: (projectId: string) => void;
}) {
  const { userRole } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "ai",
      text: `Greetings. I am **NIRNAY AI Intelligence Copilot**, calibrated with real-time geospatial telemetry, ISRO Bhuvan administrative layers, and the DoSJE National Monitoring Database.

How may I assist your command today? You can ask about high-risk facilities, surprise audit assignments, SLA escalation status, or draft executive ministerial briefs.`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      tags: ["DoSJE Command", "ISRO Bhuvan Linked", "AI Risk Engine v2.5"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || isGenerating) return;

    const userMsg: Message = {
      id: createMessageId("user"),
      sender: "user",
      text: textToSend,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setIsGenerating(true);

    try {
      // First attempt to query live local Ollama model "nirnay-ai"
      const res = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "nirnay-ai",
          prompt: `User Query: ${textToSend}\nContext: You are NIRNAY-AI on DoSJE INSIGHT platform. Active facilities: ${DEMO_PROJECTS.length}. Respond with structured government intelligence.`,
          stream: false,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          const aiMsg: Message = {
            id: createMessageId("ai"),
            sender: "ai",
            text: data.response,
            timestamp: getFormattedTime(),
            tags: ["Live Ollama (nirnay-ai)", "Local AI Engine"],
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsGenerating(false);
          return;
        }
      }
    } catch {
      // Fallback seamlessly to local platform intelligence
    }

    // Built-in Deterministic AI Intelligence Engine
    setTimeout(() => {
      const q = textToSend.toLowerCase();
      let aiReply = "";
      let tags: string[] = ["NIRNAY AI", "Local Grounded Engine"];
      let suggestedAction: Message["suggestedAction"] = undefined;

      const criticalProjects = DEMO_PROJECTS.filter((p) => p.ai_risk_score >= 70);
      const offlineCCTVProjects = DEMO_PROJECTS.filter((p) => p.cctv_online === 0);

      if (q.includes("breached") || q.includes("critical") || q.includes("risk")) {
        aiReply = `### 🚨 Critical Risk & SLA Intelligence Brief

Identified **${criticalProjects.length} Facilities** exceeding the national high-risk threshold (Score ≥ 70):

1. **${criticalProjects[0]?.name || "Guntur Senior Citizen Care Center"}** (${criticalProjects[0]?.district_name}, ${criticalProjects[0]?.state})
   - **Risk Score:** ${criticalProjects[0]?.ai_risk_score}/100 🔴
   - **Primary Driver:** CCTV offline for >48 hours + 32% deviation in biometric attendance.
   - **Recommended Action:** Immediate dispatch of unannounced Field Audit Squad via ISRO Bhuvan geofence protocol.

2. **${criticalProjects[1]?.name || "Visakhapatnam Specially-Abled Institute"}** (${criticalProjects[1]?.district_name}, ${criticalProjects[1]?.state})
   - **Risk Score:** ${criticalProjects[1]?.ai_risk_score}/100 🟠
   - **Primary Driver:** Grant expenditure anomaly + delayed quarterly grievance compliance.

*All identified centers have been auto-flagged in the State Admin & Central Directorate resolution queues.*`;
        tags = ["Critical Risk", "SLA Alert", "Field Dispatch"];
        suggestedAction = {
          label: "Dispatch Inspection Squad to Top Risk Center",
          actionType: "inspect",
          payload: criticalProjects[0]?.id,
        };
      } else if (q.includes("route") || q.includes("andhra") || q.includes("inspector")) {
        aiReply = `### 🗺️ Optimized ISRO Bhuvan Surprise Inspection Plan

**Target Jurisdiction:** Andhra Pradesh (Guntur & Visakhapatnam Corridors)

- **Assigned Squad:** Priya Mehta (ID: INS-AP-04) & Special Taskforce
- **Optimized Travel Circuit:**
  1. **Checkpoint Alpha:** Guntur Rehabilitation Complex (Cadastral Plot #44/2A) — Est. Distance: 4.2 km
  2. **Checkpoint Bravo:** Amaravati Welfare Hostel (Cadastral Plot #18) — Est. Distance: 11.8 km
- **Geofence Enforcement:** 100m Bhuvan cadastral perimeter lock with mandatory facial liveness 2FA upon squad entry.
- **Estimated Inspection Completion:** 3h 45m.`;
        tags = ["ISRO Bhuvan GIS", "Route Optimizer", "GNSS Geofenced"];
      } else if (q.includes("dpdp") || q.includes("biometric") || q.includes("attendance")) {
        aiReply = `### 🛡️ DPDP Act 2023 Biometric & Attendance Compliance

- **Total Registered Beneficiaries:** 2,665 active welfare recipients across 41 monitored grantee projects.
- **Privacy Shielding:** All Aadhaar and biometric tokens are stored as **SHA-256 salted hashes** with on-the-fly cryptographic masking (\`XXXX-XXXX-1234\`).
- **Rolling Biometric Accuracy:** **84.2%** average attendance across monitored biometric terminals.
- **Flagged Anomalies:** 8 proxy/duplicate scan attempts automatically isolated and queued for physical officer verification.`;
        tags = ["DPDP 2023", "SHA-256 Privacy", "Biometric FRS"];
      } else if (q.includes("draft") || q.includes("notice") || q.includes("ministerial")) {
        aiReply = `### 📜 Draft Ministerial Verification Notice (DoSJE Order #2026/MON/881)

**TO:** Management / In-charge, *${criticalProjects[0]?.name || "Grantee Welfare Facility"}*  
**FROM:** Central Command Directorate, Department of Social Justice & Empowerment  
**SUBJECT:** Urgent Notice for Rectification of CCTV Stream & Attendance Discrepancies  

> *"You are hereby directed to provide immediate compliance justification within **24 hours** regarding continuous CCTV channel offline status and flagged attendance biometric anomalies detected by the NIRNAY National Monitoring Engine. An unannounced Field Inspection Squad with ISRO Bhuvan GNSS verification has been requisitioned."*

*Draft ready for approval and digital dispatch.*`;
        tags = ["Ministerial Order", "Notice Draft", "Legal Compliance"];
      } else {
        aiReply = `### 💡 NIRNAY Command Intelligence Response

Analyzing platform telemetry for query: **"${textToSend}"**

- **Live Geospatial Scope:** 41 Facilities monitored across Indian States.
- **CCTV Live Ratio:** ${DEMO_PROJECTS.reduce((a, b) => a + b.cctv_online, 0)} / ${DEMO_PROJECTS.reduce((a, b) => a + b.cctv_total, 0)} Cameras Online.
- **Active Field Squads:** ${DEMO_INSPECTORS.length} Officers on active GNSS patrol.
- **ISRO Bhuvan Cadastral Status:** 100% Boundary lock synchronized.

Please specify if you would like to run a what-if scenario, view explainable risk breakdowns, or generate a formal PDF Dossier.`;
      }

      const aiMsg: Message = {
        id: createMessageId("ai"),
        sender: "ai",
        text: aiReply,
        timestamp: getFormattedTime(),
        tags,
        suggestedAction,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl h-full bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-wide text-white">NIRNAY AI Intelligence Copilot</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  ONLINE • v2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                National Decision Support Engine • Context: {userRole || "CENTRAL_ADMIN"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close Copilot"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ai" && (
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={15} className="text-cyan-400" />
                </div>
              )}

              <div
                className={`max-w-[86%] rounded-2xl p-4 leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none shadow-md"
                    : "bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-none shadow-xl"
                }`}
              >
                {/* Formatted Content */}
                <div className="space-y-2 whitespace-pre-wrap font-sans">
                  {msg.text.split("\n").map((line, idx) => {
                    if (line.startsWith("### ")) {
                      return (
                        <h4 key={idx} className="font-extrabold text-sm text-cyan-300 mt-2 mb-1">
                          {line.replace("### ", "")}
                        </h4>
                      );
                    }
                    if (line.startsWith("- **")) {
                      return (
                        <p key={idx} className="pl-2 border-l-2 border-cyan-500/40 py-0.5">
                          {line.replace("- ", "")}
                        </p>
                      );
                    }
                    if (line.startsWith("> *")) {
                      return (
                        <blockquote key={idx} className="p-2.5 rounded-lg bg-slate-900 border-l-4 border-amber-500 text-amber-200/90 text-[11px] my-2">
                          {line.replace("> *", "").replace("*", "")}
                        </blockquote>
                      );
                    }
                    return <p key={idx}>{line}</p>;
                  })}
                </div>

                {/* Tags */}
                {msg.tags && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-slate-700/60">
                    {msg.tags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded bg-slate-900/80 text-cyan-400 font-mono text-[9px] font-bold border border-slate-700">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested Action Button */}
                {msg.suggestedAction && onOpenAuditModal && (
                  <div className="mt-3 pt-2">
                    <button
                      onClick={() => onOpenAuditModal(msg.suggestedAction?.payload || "PRJ-001")}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 transition cursor-pointer shadow-lg"
                    >
                      <Zap size={13} /> {msg.suggestedAction.label}
                    </button>
                  </div>
                )}

                {/* Message Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1">
                  <span>{msg.timestamp}</span>
                  {msg.sender === "ai" && (
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={15} className="text-slate-200" />
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 p-2 animate-pulse font-mono">
              <RefreshCw size={14} className="animate-spin" /> NIRNAY Cognitive Model evaluating telemetry...
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 overflow-x-auto scrollbar-none flex gap-2">
          {PRESET_PROMPTS.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium border border-slate-700 whitespace-nowrap transition cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask NIRNAY AI anything about facilities, risk scores, or routes…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isGenerating}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-lg"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
