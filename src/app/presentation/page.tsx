"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Printer, Shield, Scale, MapPin, Award, ExternalLink, Sparkles } from "lucide-react";

export default function PresentationPage() {
  const [activeTab, setActiveTab] = useState<"DECK" | "TECHNICAL_APPROACH" | "VENN">("TECHNICAL_APPROACH");

  const views = {
    DECK: {
      url: "/NIRNAY_SIH2025_Presentation.html",
      title: "Master 6-Slide Official SIH Presentation Deck",
    },
    TECHNICAL_APPROACH: {
      url: "/technical_approach_workflow.html",
      title: "Slide 3: Technical Approach & Tri-Modal Workflow Architecture",
    },
    VENN: {
      url: "/nirnay_workflow_and_venn.html",
      title: "Venn Diagram & Deep Architecture Suite",
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-black text-sm sm:text-base text-white tracking-wider flex items-center gap-2">
              <span>🏛️</span>
              <span>INSIGHT / NIRNAY — SIH 2026 Presentation</span>
            </h1>
            <p className="text-[10px] font-mono text-cyan-400 font-bold">
              Ministry of Social Justice &amp; Empowerment (DoSJE)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-950 border border-slate-800 gap-1 text-xs">
          <button
            onClick={() => setActiveTab("TECHNICAL_APPROACH")}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === "TECHNICAL_APPROACH"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles size={12} /> Slide 3: Technical Approach
          </button>
          <button
            onClick={() => setActiveTab("DECK")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === "DECK"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Official Master Deck
          </button>
          <button
            onClick={() => setActiveTab("VENN")}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeTab === "VENN"
                ? "bg-sky-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Venn &amp; Architecture
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={views[activeTab].url}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 transition border border-slate-700 flex items-center gap-1"
          >
            <ExternalLink size={13} /> Fullscreen
          </a>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-95 transition shadow-lg flex items-center gap-1.5"
          >
            <Printer size={14} /> Export PDF
          </button>
        </div>
      </header>

      {/* Embed Presentation Frame */}
      <main className="flex-1 w-full flex justify-center p-3 sm:p-4">
        <iframe
          key={activeTab}
          src={views[activeTab].url}
          className="w-full max-w-7xl h-[calc(100vh-80px)] rounded-2xl border border-slate-800 shadow-2xl bg-slate-900"
          title={views[activeTab].title}
        />
      </main>
    </div>
  );
}
