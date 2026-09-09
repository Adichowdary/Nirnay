"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useApp } from "@/components/shell/Providers";
import { ROLE_NAV, ROLE_META } from "@/lib/auth/roles";
import type { RoleId } from "@/lib/auth/roles";
import {
  LayoutDashboard,
  Activity,
  FolderOpen,
  Map,
  ClipboardCheck,
  Brain,
  FileImage,
  Building2,
  BarChart3,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Video,
  X,
  LogOut,
  UserCog,
  MapPin,
  ShieldCheck,
  ScanFace,
  Sparkles,
  HelpCircle,
  Database,
  Ghost,
  MessageSquareWarning,
  Boxes,
} from "lucide-react";

import Image from "next/image";

interface NavItemConfig {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roleSpecificLabels?: Record<string, string>;
}

const ALL_NAV_CONFIG: Record<string, NavItemConfig> = {
  "/dashboard": {
    href: "/dashboard",
    label: "Command Center",
    icon: LayoutDashboard,
  },
  "/dashboard/ghost-detection": {
    href: "/dashboard/ghost-detection",
    label: "Ghost Detection",
    icon: Ghost,
  },
  "/dashboard/grievances": {
    href: "/dashboard/grievances",
    label: "Whistleblower & Triage",
    icon: MessageSquareWarning,
  },
  "/dashboard/database": {
    href: "/dashboard/database",
    label: "Database & Storage",
    icon: Database,
    roleSpecificLabels: {
      AUDIT_SQUAD: "Media & Cloud DB",
      INSPECTION_OFFICER: "Media & Cloud DB",
      AGENCY_PORTAL: "Storage Vault",
    },
  },
  "/dashboard/scenario": {
    href: "/dashboard/scenario",
    label: "System Simulation",
    icon: Sparkles,
  },
  "/dashboard/monitor": {
    href: "/dashboard/monitor",
    label: "Live CCTV",
    icon: Activity,
  },
  "/dashboard/ai-signals": {
    href: "/dashboard/ai-signals",
    label: "AI Signals",
    icon: Brain,
  },
  "/dashboard/projects": {
    href: "/dashboard/projects",
    label: "Projects",
    icon: FolderOpen,
  },
  "/dashboard/map": {
    href: "/dashboard/map",
    label: "Map",
    icon: Map,
    roleSpecificLabels: {
      INSPECTION_OFFICER: "Navigation Map",
      STATE_ADMIN: "State GIS Grid",
    },
  },
  "/dashboard/video-verification": {
    href: "/dashboard/video-verification",
    label: "Video Verification",
    icon: Video,
  },
  "/dashboard/inspections": {
    href: "/dashboard/inspections",
    label: "Inspections",
    icon: ClipboardCheck,
    roleSpecificLabels: {
      CENTRAL_ADMIN: "National Inspections",
      DOSJE_OFFICIAL: "National Inspections",
      INSPECTION_OFFICER: "Field Checklist",
      STATE_ADMIN: "State Audits",
    },
  },
  "/dashboard/evidence": {
    href: "/dashboard/evidence",
    label: "Evidence",
    icon: FileImage,
    roleSpecificLabels: {
      INSPECTION_OFFICER: "Photo Evidence",
      NGO_INSTITUTE: "Compliance Proofs",
      PROJECT_ADMIN: "Compliance Proofs",
    },
  },
  "/dashboard/reports": {
    href: "/dashboard/reports",
    label: "Reports",
    icon: BarChart3,
  },
  "/dashboard/audit": {
    href: "/dashboard/audit",
    label: "Audit Trail",
    icon: BookOpen,
  },
  "/dashboard/settings": {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
  "/dashboard/audit-squad": {
    href: "/dashboard/audit-squad",
    label: "Audit Squad",
    icon: ShieldCheck,
  },
  "/dashboard/agency": {
    href: "/dashboard/agency",
    label: "Agency Portal",
    icon: Building2,
  },
  "/dashboard/inspector": {
    href: "/dashboard/inspector",
    label: "My Missions",
    icon: ClipboardCheck,
  },
  "/dashboard/organization": {
    href: "/dashboard/agency",
    label: "Agency Portal",
    icon: Building2,
  },
  "/dashboard/regional": {
    href: "/dashboard/regional",
    label: "State Operations",
    icon: MapPin,
  },
  "/dashboard/admin": {
    href: "/dashboard/admin",
    label: "Administration",
    icon: UserCog,
  },
  "/dashboard/admin/verification-log": {
    href: "/dashboard/admin/verification-log",
    label: "FRS Telemetry",
    icon: ScanFace,
  },
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isSidebarCollapsed, setSidebarCollapsed, isMobileMenuOpen, setMobileMenuOpen, userRole, userProfile, signOut } = useApp();

  const role: string = (userRole ?? "CENTRAL_ADMIN");
  const meta = ROLE_META[role] || ROLE_META.CENTRAL_ADMIN;
  const allowedHrefs = ROLE_NAV[role] || ROLE_NAV.CENTRAL_ADMIN;

  const roleLogo =
    role === "CENTRAL_ADMIN" || role === "DOSJE_OFFICIAL"
      ? "/images/2 image for dosje official .jpeg"
      : role === "INSPECTION_OFFICER"
      ? "/images/3 image.jpeg"
      : role === "NGO_INSTITUTE" || role === "PROJECT_ADMIN"
      ? "/images/4 image .jpeg"
      : role === "STATE_ADMIN"
      ? "/images/5 imgage .jpeg"
      : role === "ADMIN"
      ? "/images/6 image .jpeg"
      : "/images/main_logo.png";

  const navItems = allowedHrefs
    .map((href) => ALL_NAV_CONFIG[href])
    .filter(Boolean);

  const handleSignOut = async () => {
    await signOut();
    if (typeof document !== "undefined") {
      document.cookie = "insight_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    router.push("/login");
  };

  const displayName = userProfile?.full_name?.replace(" [DEMO]", "") ?? meta.label;
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase() || meta.initials;

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex h-screen flex-col overflow-hidden relative z-20"
        style={{
          width: isSidebarCollapsed ? "var(--sidebar-collapsed-w)" : "var(--sidebar-w)",
          transition: "width 280ms cubic-bezier(0.16, 1, 0.3, 1)",
          flexShrink: 0,
          background: "var(--surface-sidebar)",
          borderRight: "1px solid var(--border-light)",
        }}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-3.5"
          style={{
            height: "var(--header-h)",
            minHeight: "var(--header-h)",
            borderBottom: "1px solid var(--border-light)",
          }}
        >
          <div
            className="flex items-center justify-center rounded-2xl flex-shrink-0 bg-slate-950 border-2 border-blue-500/50 overflow-hidden shadow-xl"
            style={{
              width: 52,
              height: 52,
              boxShadow: `0 6px 20px ${meta.color}45`,
            }}
          >
            <Image
              src={roleLogo}
              alt="NIRNAY Dynamic Portal Emblem"
              width={52}
              height={52}
              className="object-cover"
            />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <div
                className="font-black text-base tracking-wider leading-tight"
                style={{
                  background: "linear-gradient(135deg, var(--text-primary), var(--text-secondary))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                NIRNAY
              </div>
              <div
                className="text-[9px] font-bold uppercase tracking-widest truncate"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
            </div>
          )}
        </div>

        {/* Role Badge */}
        {!isSidebarCollapsed && (
          <div
            className="px-3 py-3"
            style={{ borderBottom: "1px solid var(--border-light)" }}
          >
            <div
              className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold"
              style={{
                background: meta.badgeBg,
                color: meta.color,
                border: `1px solid ${meta.color}20`,
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: meta.color,
                  animation: "pulse-dot 2s ease-in-out infinite",
                }}
              />
              <span className="truncate">{meta.label}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 relative" aria-label="Role navigation">
          {/* Soft top-fade so items don't hard-clip */}
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-4 z-10"
            style={{ background: "linear-gradient(to bottom, var(--surface-sidebar), transparent)" }}
          />
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const { href, icon: Icon } = item;
              const displayLabel = (item.roleSpecificLabels && item.roleSpecificLabels[role]) || item.label;
              const isActive =
                pathname === href ||
                (href !== "/dashboard" &&
                  href !== "/dashboard/inspector" &&
                  href !== "/dashboard/organization" &&
                  href !== "/dashboard/regional" &&
                  href !== "/dashboard/admin" &&
                  pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn("nav-item", isActive && "active")}
                  title={isSidebarCollapsed ? displayLabel : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="truncate">{displayLabel}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div
          className="p-3"
          style={{
            borderTop: "1px solid var(--border-light)",
            background: "var(--surface-secondary)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0 text-white font-bold text-xs"
              style={{ width: 34, height: 34, backgroundColor: meta.color }}
            >
              {initials}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-bold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {displayName}
                </p>
                <p
                  className="text-[10px] truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {meta.workspace}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleSignOut}
              className="p-1.5 rounded-lg transition-colors cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              title="Sign Out"
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-1/2 -right-4 -translate-y-1/2 rounded-full w-8 h-8 flex items-center justify-center shadow-md cursor-pointer transition-colors hover:bg-secondary"
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-default)",
            color: "var(--text-muted)",
          }}
          aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0"
            style={{ background: "var(--surface-overlay)" }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="relative w-72 max-w-[85vw] flex flex-col h-full z-10 shadow-2xl"
            style={{
              background: "var(--surface-sidebar)",
              borderRight: "1px solid var(--border-light)",
            }}
          >
            {/* Mobile Header */}
            <div
              className="flex items-center justify-between p-4"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]"
                >
                  <Image
                    src="/images/main_logo.png"
                    alt="NIRNAY Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <div>
                  <span
                    className="font-black text-sm tracking-wider leading-none block"
                    style={{ color: "var(--text-primary)" }}
                  >
                    NIRNAY
                  </span>
                  <span
                    className="text-[10px] font-bold leading-none block mt-0.5"
                    style={{ color: "var(--color-info)" }}
                  >
                    {meta.workspace}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg transition-colors cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Role Badge */}
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--border-light)" }}
            >
              <div
                className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold"
                style={{
                  background: meta.badgeBg,
                  color: meta.color,
                  border: `1px solid ${meta.color}20`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: meta.color,
                    animation: "pulse-dot 2s ease-in-out infinite",
                  }}
                />
                <span className="truncate">{meta.label}</span>
              </div>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 overflow-y-auto p-3">
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const { href, icon: Icon } = item;
                  const displayLabel = (item.roleSpecificLabels && item.roleSpecificLabels[role]) || item.label;
                  const isActive =
                    pathname === href ||
                    (href !== "/dashboard" &&
                      href !== "/dashboard/inspector" &&
                      href !== "/dashboard/organization" &&
                      href !== "/dashboard/regional" &&
                      href !== "/dashboard/admin" &&
                      pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn("nav-item", isActive && "active")}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      <span className="truncate">{displayLabel}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Footer */}
            <div
              className="p-3 flex items-center justify-between"
              style={{
                borderTop: "1px solid var(--border-light)",
                background: "var(--surface-secondary)",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center"
                  style={{ backgroundColor: meta.color }}
                >
                  {initials}
                </div>
                <div className="truncate max-w-[130px]">
                  <p
                    className="text-xs font-bold truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-[10px] truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {meta.label}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-2 rounded-lg transition-colors cursor-pointer"
                style={{ color: "var(--color-danger)" }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
