"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/shell/Providers";
import { DEMO_NOTIFICATIONS } from "@/lib/demo-data";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Command,
  Menu,
  LogOut,
  Sparkles,
  Radio,
  Video,
  Download,
  Brain,
} from "lucide-react";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { NotificationPanel } from "@/components/shared/NotificationPanel";
import { generateMinistryDossierPDF } from "@/lib/reports/pdf-generator";

const emptySubscribe = () => () => {};

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onOpenCopilot?: () => void;
  onOpenCCTVMatrix?: () => void;
}

export function TopBar({
  title = "National Monitoring Command",
  subtitle,
  onOpenCopilot,
  onOpenCCTVMatrix,
}: TopBarProps) {
  const { isDarkMode, setDarkMode, setMobileMenuOpen, userRole, userProfile, signOut } = useApp();
  const router = useRouter();
  const [showPalette, setShowPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const handleSignOut = async () => {
    await signOut();
    if (typeof document !== "undefined") {
      document.cookie = "insight_demo_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("insight_active_role");
      window.location.href = "/login?signout=true";
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.is_read).length;

  return (
    <>
      <div className="tricolor-strip" />
      <header
        className="flex items-center justify-between px-4 sm:px-6 flex-shrink-0 relative"
        style={{
          height: "var(--header-h)",
          minHeight: "var(--header-h)",
          background: "var(--surface-card)",
          borderBottom: "1px solid var(--border-light)",
        }}
        aria-label="Application header"
      >
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg transition-colors cursor-pointer active:scale-95"
            style={{
              background: "var(--surface-secondary)",
              color: "var(--text-secondary)",
            }}
            aria-label="Open navigation menu"
          >
            <Menu size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="font-bold leading-tight flex items-center gap-2"
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-primary)",
                  letterSpacing: "var(--tracking-tight)",
                }}
              >
                <span>{title}</span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  DoSJE Central Command
                </span>
              </h1>
              {/* ISRO Bhuvan Satellite Lock Indicator */}
              <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Radio size={10} className="animate-pulse text-emerald-500" /> ISRO Bhuvan GNSS (±8.2m)
              </span>
            </div>
            <p
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
                marginTop: 1,
                letterSpacing: "var(--tracking-wide)",
              }}
            >
              {subtitle || today}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* NIRNAY AI Copilot Trigger Button */}
          {onOpenCopilot && (
            <button
              type="button"
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
              style={{
                background: "linear-gradient(135deg, var(--blue-600), var(--purple-600))",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              }}
              title="Open NIRNAY AI Copilot"
            >
              <Brain size={14} className="animate-pulse" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>
          )}

          {/* CCTV Matrix Trigger */}
          {onOpenCCTVMatrix && (
            <button
              type="button"
              onClick={onOpenCCTVMatrix}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
              title="Open 4-Cam CCTV Matrix"
            >
              <Video size={13} />
              <span>CCTV Matrix</span>
            </button>
          )}

          {/* One-Click PDF Dossier Export */}
          <button
            type="button"
            onClick={() => generateMinistryDossierPDF({ generatedBy: userProfile?.full_name || "Official Command", role: userRole || "CENTRAL_ADMIN" })}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl cursor-pointer transition"
            style={{
              border: "1px solid var(--border-default)",
              background: "var(--surface-secondary)",
              color: "var(--text-secondary)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-tertiary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--surface-secondary)"; }}
            title="Download Ministry Audit Dossier"
          >
            <Download size={13} />
            <span>PDF Dossier</span>
          </button>

          {/* Search */}
          <button
            type="button"
            onClick={() => setShowPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: "var(--surface-secondary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-muted)",
              fontSize: "var(--text-xs)",
            }}
            aria-label="Open command palette"
          >
            <Search size={14} />
            <span className="hidden md:inline">Search…</span>
            <kbd
              className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded"
              style={{
                fontSize: "10px",
                background: "var(--surface-card)",
                border: "1px solid var(--border-default)",
                color: "var(--text-muted)",
              }}
            >
              <Command size={8} />K
            </kbd>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1 right-1 flex items-center justify-center rounded-full text-white font-bold"
                style={{
                  width: 16,
                  height: 16,
                  background: "var(--color-danger)",
                  fontSize: "9px",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => setDarkMode(!isDarkMode)}
            className="p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-secondary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            aria-label={mounted && isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            suppressHydrationWarning
          >
            {mounted && isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Sign Out (Desktop) */}
          <button
            type="button"
            onClick={handleSignOut}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            style={{
              background: "var(--surface-secondary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-secondary)",
              fontSize: "var(--text-xs)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; }}
            aria-label="Sign out"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>

          {/* Sign Out (Mobile) */}
          <button
            type="button"
            onClick={handleSignOut}
            className="flex md:hidden p-2 rounded-lg transition-colors cursor-pointer"
            style={{ color: "var(--color-danger)" }}
            aria-label="Sign out"
            title="Sign Out"
          >
            <LogOut size={17} />
          </button>

          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-lg flex-shrink-0 text-white font-semibold cursor-default select-none"
            style={{
              width: 34,
              height: 34,
              fontSize: "var(--text-xs)",
              background: "var(--blue-600)",
              boxShadow: "0 1px 3px rgba(29, 78, 216, 0.25)",
            }}
            title={(userProfile?.full_name ?? "User").replace(" [DEMO]", "")}
          >
            {(userProfile?.full_name ?? "U").replace(" [DEMO]", "").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "U"}
          </div>
        </div>
      </header>

      {showPalette && <CommandPalette onClose={() => setShowPalette(false)} />}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </>
  );
}
