"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UploadCloud,
  ArrowRight,
  ExternalLink,
  Info,
  Shield,
  TrendingUp,
  Users,
  Video,
  Send,
  Check,
  Plus,
  Sparkles,
  X,
  FileCheck,
} from "lucide-react";
import { DEMO_PROJECTS } from "@/lib/demo-data";

interface PendingItem {
  id: string;
  type: string;
  title: string;
  project: string;
  deadline: string;
  priority: string;
  status: string;
  details: string;
}

export default function OrganizationPortalPage() {
  const orgProjects = DEMO_PROJECTS.slice(0, 2);

  const [selectedRequest, setSelectedRequest] = useState<PendingItem | null>(null);
  const [responseText, setResponseText] = useState("");
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [submittedRequests, setSubmittedRequests] = useState<string[]>([]);

  // Daily attendance submission
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false);
  const [headcount, setHeadcount] = useState(118);
  const [staffOnDuty, setStaffOnDuty] = useState(12);

  const [pendingItems, setPendingItems] = useState([
    {
      id: "req-1",
      type: "attendance_variance",
      title: "Explanation for 34% Attendance Variance",
      project: "Jaipur Girls Hostel Renovation [DEMO]",
      deadline: "2026-09-02",
      priority: "CRITICAL",
      status: "ACTION_REQUIRED",
      details: "AI anomaly detection flagged a 34% drop in biometric punches between 18 Aug and 24 Aug. Please upload supporting leave records or exam schedules.",
    },
    {
      id: "req-2",
      type: "uc_submission",
      title: "Q1 FY26 Utilization Certificate (Form GFR-12A)",
      project: "Jaipur Girls Hostel Renovation [DEMO]",
      deadline: "2026-09-10",
      priority: "HIGH",
      status: "SUBMITTED",
      details: "Quarterly grant-in-aid expenditure statement duly signed by Chartered Accountant.",
    },
  ]);

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !responseText) return;

    setSubmittedRequests([...submittedRequests, selectedRequest.id]);
    setPendingItems((prev) =>
      prev.map((item) =>
        item.id === selectedRequest.id ? { ...item, status: "SUBMITTED" } : item
      )
    );
    setSelectedRequest(null);
    setResponseText("");
    setAttachedFile(null);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* ── Modal: Respond to Verification Request ── */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
              <FileCheck size={16} />
              Submit Official Department Response
            </div>

            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {selectedRequest.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              {selectedRequest.details}
            </p>

            <form onSubmit={handleSendResponse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Institutional Explanation / Justification
                </label>
                <textarea
                  required
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Explain the operational reasons (e.g. university mid-term exams, scheduled holidays, medical leaves)..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Attach Supporting Documents / Registers (PDF / JPG)
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center bg-slate-50 dark:bg-slate-800/40">
                  <UploadCloud size={20} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    {attachedFile || "Drag & drop signed leave roster or click to browse"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setAttachedFile("Exam_Schedule_Signed_Principal.pdf")}
                    className="mt-1.5 px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg text-[10px] font-bold"
                  >
                    Simulate Attach PDF
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Send size={13} />
                  Transmit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Building2 size={22} className="text-amber-600 dark:text-amber-400" />
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Aadarsh Seva Sansthan — NGO Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Registration No: <span className="font-mono font-semibold">RAJ/NGO/2018/001</span> · Jaipur District, Rajasthan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 size={13} />
            Verified Grantee Institution
          </span>
        </div>
      </div>

      {/* ── Institutional Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5">
          <div className="text-lg font-black text-amber-600 font-mono">2</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Assigned Projects</div>
        </div>

        <div className="card p-3.5">
          <div className="text-lg font-black text-blue-600 font-mono">120</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Enrolled Beneficiaries</div>
        </div>

        <div className="card p-3.5">
          <div className="text-lg font-black text-emerald-600 font-mono">6 / 6</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">CCTV Cameras Online</div>
        </div>

        <div className="card p-3.5">
          <div className="text-lg font-black text-purple-600 font-mono">88%</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">Compliance Health</div>
        </div>
      </div>

      {/* ── ACTION 1: Daily Beneficiary Attendance Submission ── */}
      <div className="card p-5 border-2 border-blue-500/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Today&apos;s Daily Attendance & Biometric Submission
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>

        {!attendanceSubmitted ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Submit today&apos;s verified physical attendance count and on-duty staff roster for national surveillance sync.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Beneficiaries Present Today:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 font-bold text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-400">out of 120 enrolled (98.3%)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Instructors / Staff on Duty:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={staffOnDuty}
                    onChange={(e) => setStaffOnDuty(Number(e.target.value))}
                    className="w-24 px-3 py-1.5 font-bold text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-400">mandatory quota met</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setAttendanceSubmitted(true)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
            >
              <CheckCircle2 size={15} />
              Transmit Verified Daily Attendance to Ministry
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
              <Check size={16} />
              Attendance Transmitted & Synchronized with Command Center
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              Timestamp: {new Date().toLocaleTimeString("en-IN")} · Telemetry Ack: 200 OK
            </p>
          </div>
        )}
      </div>

      {/* ── ACTION 2: Department Verification Inquiries Queue ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white">
              Official Department Verification Notices ({pendingItems.length})
            </h2>
          </div>
        </div>

        <div className="card divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {pendingItems.map((item) => {
            const isDone = item.status === "SUBMITTED" || submittedRequests.includes(item.id);

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isDone
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isDone ? "RESOLVED / SUBMITTED" : item.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.project}</p>
                  <p className="text-[11px] text-slate-400 font-mono">Deadline: {item.deadline}</p>
                </div>

                <div>
                  {!isDone ? (
                    <button
                      onClick={() => setSelectedRequest(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Respond to Inquiry
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={14} /> Submitted
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Document Upload Center ── */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-purple-600" />
          <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
            Compliance & Utilization Certificate (UC) Repository
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Audit Report 2024-25</span>
              <span className="text-[10px] text-slate-400">PDF · Verified by CA</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
              APPROVED
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Building Safety Certificate</span>
              <span className="text-[10px] text-slate-400">Fire & Safety Dept</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">
              VALID
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
