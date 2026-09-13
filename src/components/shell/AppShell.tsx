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
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  ClipboardCheck,
  Menu,
  Brain,
  Activity,
  Sparkles,
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

        {/* Breadcrumbs (hidden on map to maximize screen area) */}
        {pathname !== "/dashboard/map" && (
          <div className="px-4 md:px-6 border-b border-base bg-card/50">
            <Breadcrumbs />
          </div>
        )}

        <main
          className={cn(
            "flex-1 min-w-0",
            pathname === "/dashboard/map"
              ? "overflow-hidden"
              : "overflow-y-auto overflow-x-hidden pb-20 md:pb-0"
          )}
          id="main-content"
          tabIndex={-1}
          aria-label="Main content"
        >
          {children}

          {/* Government Footer (hidden on interactive GIS map) */}
          {pathname !== "/dashboard/map" && <GovernmentFooter />}
        </main>

        {/* Mobile Bottom Nav — premium glass morphism design */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30"
          style={{
            background: "var(--surface-card)",
            borderTop: "1px solid var(--border-light)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
          aria-label="Mobile bottom navigation"
        >
          <div className="flex items-stretch justify-around px-1 h-16">
            {[
              { href: "/dashboard", label: "Home", icon: LayoutDashboard },
              { href: "/dashboard/map", label: "Map", icon: Map },
              { href: "/dashboard/ai-signals", label: "Signals", icon: Activity },
              { href: "/dashboard/inspections", label: "Tasks", icon: ClipboardCheck },
            ].map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-1 rounded-xl mx-0.5 my-1 transition-all relative"
                  style={{
                    color: isActive ? "var(--blue-500)" : "var(--text-muted)",
                    background: isActive ? "var(--color-info-bg)" : "transparent",
                  }}
                  aria-current={isActive ? "page" : undefined}
                >
                  {isActive && (
                    <span
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ background: "var(--blue-500)" }}
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: isActive ? 700 : 500,
                      letterSpacing: "var(--tracking-wide)",
                    }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}

            {/* AI Copilot Button */}
            <button
              type="button"
              onClick={() => setShowCopilot(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-1 rounded-xl mx-0.5 my-1 transition-all cursor-pointer relative"
              style={{
                background: "linear-gradient(135deg, rgba(79,70,229,0.14), rgba(139,92,246,0.14))",
                color: "#6366F1",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
              aria-label="Open AI Copilot"
            >
              <Sparkles size={20} strokeWidth={2} className="animate-pulse" />
              <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "var(--tracking-wide)" }}>Copilot</span>
            </button>

            {/* Menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 px-1 rounded-xl mx-0.5 my-1 transition-all cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              aria-label="Open navigation menu"
            >
              <Menu size={20} strokeWidth={1.8} />
              <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "var(--tracking-wide)" }}>More</span>
            </button>
          </div>
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
