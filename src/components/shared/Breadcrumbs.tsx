"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  projects: "Projects",
  inspections: "Inspections",
  "ai-signals": "AI Signals",
  monitor: "Live CCTV",
  inspector: "Inspector",
  evidence: "Evidence",
  beneficiaries: "Beneficiaries",
  organizations: "Organizations",
  regional: "Regional",
  map: "Map",
  "video-verification": "Video Verification",
  audit: "Audit Trail",
  reports: "Reports",
  settings: "Settings",
  admin: "Administration",
  "verification-log": "FRS Verification Log",
  assign: "Assign Inspection",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted py-2 px-1">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home size={12} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={10} className="text-muted/50" />
          {crumb.isLast ? (
            <span className="text-primary font-semibold">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-primary transition-colors">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
