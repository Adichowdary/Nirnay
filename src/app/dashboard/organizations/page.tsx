"use client";
import { DEMO_ORGANIZATIONS } from "@/lib/demo-data";
import { Building2, MapPin, Phone } from "lucide-react";

export default function OrganizationsPage() {
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-primary">Organizations</h1>
        <p className="text-xs text-muted mt-0.5">NGOs and institutes registered under DoSJE schemes</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {DEMO_ORGANIZATIONS.map((org) => (
          <div key={org.id} className="card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-tint flex items-center justify-center">
                  <Building2 size={18} className="text-blue-strong" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary">{org.name}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider">{org.type.replace("_", " ")}</p>
                </div>
              </div>
              <span className="risk-badge tabular" style={{
                background: org.compliance_score >= 80 ? "var(--green-tint)" : org.compliance_score >= 60 ? "var(--amber-tint)" : "var(--red-tint)",
                color: org.compliance_score >= 80 ? "var(--green-text)" : org.compliance_score >= 60 ? "var(--amber-text)" : "var(--red-text)",
              }}>{org.compliance_score}%</span>
            </div>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-xs text-muted"><MapPin size={12} /> {org.district_name}, {org.state}</p>
              <p className="flex items-center gap-2 text-xs text-muted"><Phone size={12} /> {org.contact_phone}</p>
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-base">
              <span className="text-[10px] font-mono text-muted">{org.registration_number}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
