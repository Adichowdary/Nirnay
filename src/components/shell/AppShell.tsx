"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { GovernmentUtilityBar } from "@/components/shared/GovernmentUtilityBar";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { useApp } from "@/components/shell/Providers";
import { NIRNAYCopilot } from "@/components/ai/NIRNAYCopilot";
import { CCTVMatrixModal } from "@/components/cctv/CCTVMatrixModal";
import { DigitalInspectionAuditModal } from "@/components/inspection/DigitalInspectionAuditModal";
import {
  LayoutDashboard,
  Map,
  ClipboardCheck,
  Menu,
  Brain,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

function GovernmentFooter() {
  return (
    <footer className="border-t border-base bg-card text-xs text-muted">
      <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
        {/* Main footer content */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">NIRNAY / INSIGHT</span>
              <span className="text-muted/40">|</span>
              <span>Department of Social Justice &amp; Empowerment</span>
            </div>
            <p className="text-[10px] text-muted/70">
              Designed &amp; Maintained by National Informatics Centre (NIC) under Digital India Programme • ISRO Bhuvan Enabled
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px]">
              Last Updated: <span className="font-semibold text-primary">{new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </p>
            <p className="text-[10px] text-muted/60">
              Content Owned by DoSJE · Maintained by NIC
            </p>
          </div>
        </div>

        {/* Bottom links */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-base">
          <div className="flex items-center gap-3 text-[10px] text-muted/60">
            <span>© {new Date().getFullYear()} Copyright NIRNAY</span>
            <span className="hidden sm:inline">·</span>
            <Link href="/consent" className="hover:text-primary transition-colors">Privacy Policy (DPDP 2023)</Link>
            <span className="hidden sm:inline">·</span>
            <span>Terms of Use</span>
            <span className="hidden sm:inline">·</span>
            <span>Help</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-muted/50">Powered by</span>
            <span className="font-semibold text-primary">NIC</span>
            <span className="text-muted/30">|</span>
            <span className="font-semibold text-primary">Digital India</span>
            <span className="text-muted/30">|</span>
            <span className="font-semibold text-primary">ISRO Bhuvan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const { setMobileMenuOpen } = useApp();

  const [showCopilot, setShowCopilot] = useState(false);
  const [showCCTVMatrix, setShowCCTVMatrix] = useState(false);
  const [activeAuditProjectId, setActiveAuditProjectId] = useState<string | null>(null);

  const isMobileInspectionRoute = pathname === "/dashboard/inspections/mobile";

  if (isMobileInspectionRoute) {
    return (
      <main
        className="h-screen w-screen overflow-hidden flex flex-col"
        style={{ background: "var(--surface-bg)" }}
        id="main-content"
        tabIndex={-1}
        aria-label="Mobile Inspection Application"
      >
        {children}
      </main>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--surface-bg)" }}>
      {/* Government Utility Bar — spans full width above everything */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <GovernmentUtilityBar />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ marginTop: 32 }}>
        <TopBar
          title={title}
          subtitle={subtitle}
          onOpenCopilot={() => setShowCopilot(true)}
          onOpenCCTVMatrix={() => setShowCCTVMatrix(true)}
        />

        {/* Breadcrumbs */}
        <div className="px-4 md:px-6 border-b border-base bg-card/50">
          <Breadcrumbs />
        </div>

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0"
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}

          {/* Government Footer */}
          <GovernmentFooter />
        </main>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around z-30 px-2"
          style={{
            height: 56,
            background: "var(--surface-card)",
            borderTop: "1px solid var(--border-light)",
            boxShadow: "0 -1px 4px rgba(0, 0, 0, 0.04)",
          }}
          aria-label="Mobile bottom navigation"
        >
          {[
            { href: "/dashboard", label: "Home", icon: LayoutDashboard },
            { href: "/dashboard/ai-signals", label: "AI", icon: Brain },
            { href: "/dashboard/map", label: "Map", icon: Map },
            { href: "/dashboard/inspections", label: "Tasks", icon: ClipboardCheck },
          ].map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-all"
                style={{
                  color: isActive ? "var(--blue-600)" : "var(--text-muted)",
                  background: isActive ? "var(--color-info-bg)" : "transparent",
                }}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "var(--tracking-wide)",
                    color: isActive ? "var(--blue-600)" : "var(--text-muted)",
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowCopilot(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer text-cyan-500"
            aria-label="Open AI Copilot"
          >
            <Brain size={20} className="animate-pulse" />
            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "var(--tracking-wide)" }}>Copilot</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            aria-label="Open navigation menu"
          >
            <Menu size={20} strokeWidth={1.8} />
            <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "var(--tracking-wide)" }}>Menu</span>
          </button>
        </nav>
      </div>

      {/* Global AI Copilot Drawer */}
      <NIRNAYCopilot
        isOpen={showCopilot}
        onClose={() => setShowCopilot(false)}
        onOpenAuditModal={(pId) => {
          setShowCopilot(false);
          setActiveAuditProjectId(pId);
        }}
      />

      {/* Global CCTV Matrix Modal */}
      {showCCTVMatrix && (
        <CCTVMatrixModal
          onClose={() => setShowCCTVMatrix(false)}
        />
      )}

      {/* Global 10-Point Digital Inspection Audit Modal */}
      {activeAuditProjectId && (
        <DigitalInspectionAuditModal
          projectId={activeAuditProjectId}
          inspectorName="Authorized PMU Field Officer"
          onClose={() => setActiveAuditProjectId(null)}
          onCompleted={() => setActiveAuditProjectId(null)}
        />
      )}
    </div>
  );
}
