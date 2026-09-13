"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Info,
  ScanFace,
  ChevronRight,
  Fingerprint,
  ShieldCheck,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { createClient } from "@/lib/db/browser";

const emptySubscribe = () => () => {};
import { ROLE_META } from "@/lib/auth/roles";
import type { RoleId } from "@/lib/auth/roles";
import { useApp } from "@/components/shell/Providers";
import Image from "next/image";
import { NIRNAY3DLoader } from "@/components/ui/NIRNAY3DLoader";
import { FRSVerificationModal } from "@/components/auth/FRSVerificationModal";
import { FaceLoginButton } from "@/components/auth/FaceLoginButton";

interface PortalRoleOption {
  id: RoleId;
  schemeCode: string;
  schemeTitle: string;
  portalName: string;
  roleName: string;
  description: string;
  accentColor: string;
  iconBg: string;
  emblemText: string;
  emblemSub: string;
  imagePath: string;
  demoEmail: string;
  demoPass: string;
  officerName: string;
  requiresFRS: boolean;
  purposeSummary: string;
}

const PORTAL_ROLES: PortalRoleOption[] = [
  {
    id: "CENTRAL_ADMIN",
    schemeCode: "COMMAND",
    schemeTitle: "CENTRAL COMMAND DIRECTORATE",
    portalName: "Central Command Directorate",
    roleName: "Central Admin",
    description: "National Command Center for Ministry & Central Directorate Officials",
    purposeSummary: "Nationwide monitoring, state admin management, GIS grid, SLA escalation review & policies",
    accentColor: "#E11D48",
    iconBg: "rgba(225, 29, 72, 0.08)",
    emblemText: "केंद्रीय कमान",
    emblemSub: "COMMAND",
    imagePath: "/images/1 image-central admin.jpeg",
    demoEmail: "official@dosje.gov.in",
    demoPass: "Demo@Insight2025",
    officerName: "Rajesh Kumar Sharma",
    requiresFRS: true,
  },
  {
    id: "STATE_ADMIN",
    schemeCode: "STATE",
    schemeTitle: "STATE ADMINISTRATIVE AUTHORITY",
    portalName: "State Administration Portal",
    roleName: "State Admin (Andhra Pradesh)",
    description: "State-Level Operational Authority & District Oversight",
    purposeSummary: "Manage state projects, district-level filters, assign issues to field officers & resolve SLAs",
    accentColor: "#2563EB",
    iconBg: "rgba(37, 99, 235, 0.08)",
    emblemText: "राज्य प्रशासन",
    emblemSub: "STATE ADMIN",
    imagePath: "/images/2 image state administrative.jpeg",
    demoEmail: "stateadmin.ap@dosje.gov.in",
    demoPass: "Demo@Insight2025",
    officerName: "Dr. K. Venkateswarlu",
    requiresFRS: true,
  },
  {
    id: "INSPECTION_OFFICER",
    schemeCode: "AUDIT",
    schemeTitle: "AUDIT SQUAD",
    portalName: "Audit Squad Portal",
    roleName: "Field Inspection Squad",
    description: "Field Audits & Unannounced Inspection Squad",
    purposeSummary: "Receive assignments, 2D map GPS geofence lock & conduct 10-point audits",
    accentColor: "#059669",
    iconBg: "rgba(5, 150, 105, 0.08)",
    emblemText: "ऑडिट दस्ता",
    emblemSub: "AUDIT",
    imagePath: "/images/3 Audit squad.jpeg",
    demoEmail: "inspector@dosje.gov.in",
    demoPass: "Demo@Insight2025",
    officerName: "Priya Mehta",
    requiresFRS: true,
  },
  {
    id: "NGO_INSTITUTE",
    schemeCode: "AGENCY",
    schemeTitle: "AGENCY PORTAL",
    portalName: "Agency Portal",
    roleName: "NGO / Project Admin",
    description: "Grantee Institutions & Welfare Facilities Portal",
    purposeSummary: "Respond to verification notices, submit daily attendance & evidence",
    accentColor: "#D97706",
    iconBg: "rgba(217, 119, 6, 0.08)",
    emblemText: "एजेंसी पोर्टल",
    emblemSub: "AGENCY",
    imagePath: "/images/4 Agency portal.jpeg",
    demoEmail: "contact@samplengo.org",
    demoPass: "Demo@Insight2025",
    officerName: "Anjali Verma",
    requiresFRS: true,
  },
  {
    id: "ADMIN",
    schemeCode: "SYSADMIN",
    schemeTitle: "SYSTEM ADMIN",
    portalName: "System Admin Portal",
    roleName: "System Administrator",
    description: "Platform Administration & Governance Portal",
    purposeSummary: "State admins directory, permissions config & live FRS telemetry audit log",
    accentColor: "#7C3AED",
    iconBg: "rgba(124, 58, 237, 0.08)",
    emblemText: "सिस्टम एडमिन",
    emblemSub: "ADMIN",
    imagePath: "/images/5 system admin.jpeg",
    demoEmail: "admin@insight.gov.in",
    demoPass: "Demo@Insight2025",
    officerName: "Admin User",
    requiresFRS: false,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { isDarkMode, setDarkMode, setUserRole } = useApp();

  const [show3DIntro, setShow3DIntro] = useState(false);
  const [selectedRole, setSelectedRole] = useState<PortalRoleOption | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFRSModal, setShowFRSModal] = useState(false);
  const [frsOfficerName, setFrsOfficerName] = useState("Authorized Official");
  const [frsRoleTitle, setFrsRoleTitle] = useState("Official Portal User");
  const [frsRoleId, setFrsRoleId] = useState("OFFICIAL");
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string>("/dashboard");
  const [lang, setLang] = useState<"en" | "hi">("en");
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    // Reset any active role upon arriving at login page to allow clean sign-in
    setUserRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("insight_active_role");
      document.cookie = "insight_demo_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, [setUserRole]);

  const handleSelectRole = (role: PortalRoleOption) => {
    setSelectedRole(role);
    setEmail(role.demoEmail);
    setPassword(role.demoPass);
    setError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password to proceed.");
      return;
    }

    setLoading(true);
    setError(null);

    const matchedRole = selectedRole || PORTAL_ROLES.find(
      (r) => r.demoEmail.toLowerCase() === email.toLowerCase()
    ) || (email.includes("admin") ? PORTAL_ROLES[4] : PORTAL_ROLES[0]);

    // Set active user role immediately in state, cookie, and storage
    setUserRole(matchedRole.id);

    // Fast background auth attempt with 100ms race timeout
    try {
      const authPromise = supabase?.auth.signInWithPassword({
        email,
        password,
      });
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 100));
      if (authPromise) {
        await Promise.race([authPromise, timeoutPromise]);
      }
    } catch {
      // Prototype demo fallback
    }

    setLoading(false);

    let target = "/dashboard";
    if (matchedRole.id === "INSPECTION_OFFICER" || matchedRole.id === "AUDIT_SQUAD") target = "/dashboard/inspector";
    else if (matchedRole.id === "NGO_INSTITUTE" || matchedRole.id === "PROJECT_ADMIN" || matchedRole.id === "AGENCY_PORTAL") target = "/dashboard/agency";
    else if (matchedRole.id === "STATE_ADMIN") target = "/dashboard/regional";
    else if (matchedRole.id === "ADMIN") target = "/dashboard/admin";

    setPendingRedirectUrl(target);

    // Bypass FRS only for roles explicitly configured with requiresFRS: false
    if (matchedRole.requiresFRS === false) {
      router.push(target);
      router.refresh();
      return;
    }

    // Dynamic officer identity details for FRS Modal
    const rawName = email.split("@")[0].replace(/[._]/g, " ");
    const formattedName = rawName ? rawName.replace(/\b\w/g, (l) => l.toUpperCase()) : "Authorized Official";
    const officerName = selectedRole?.officerName || formattedName;

    setFrsOfficerName(officerName);
    setFrsRoleTitle(matchedRole.roleName);
    setFrsRoleId(matchedRole.id);

    // Stage 2: Trigger mandatory FRS Biometric Facial & Location Verification
    setShowFRSModal(true);
  };

  const handleFRSCompleted = () => {
    setShowFRSModal(false);
    router.push(pendingRedirectUrl);
    router.refresh();
  };

  return (
    <>
      {show3DIntro && (
        <NIRNAY3DLoader onComplete={() => setShow3DIntro(false)} />
      )}

      {showFRSModal && (
        <FRSVerificationModal
          employeeName={frsOfficerName}
          roleTitle={frsRoleTitle}
          roleId={frsRoleId}
          onVerified={handleFRSCompleted}
          onCancel={() => setShowFRSModal(false)}
        />
      )}

      <div className="min-h-[100dvh] flex flex-col" style={{ background: "var(--surface-bg)" }}>
        {/* Government Top Bar */}
        <div className="w-full bg-[#0c1222] text-white text-xs border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-9">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">Government of India</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 font-medium">Ministry of Social Justice &amp; Empowerment</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <Globe size={13} />
                <span>{lang === "en" ? "हिन्दी" : "English"}</span>
              </button>
              <span className="text-slate-700">|</span>
              {mounted ? (
                <button
                  onClick={() => setDarkMode(!isDarkMode)}
                  className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
                  <span>{isDarkMode ? "Light" : "Dark"}</span>
                </button>
              ) : (
                <div className="w-12 h-4" />
              )}
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <header
          className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <div className="flex items-center gap-4">
              {selectedRole ? (
                <button
                  onClick={() => setSelectedRole(null)}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                  aria-label="Back to Portal Selection"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : (
                /* Main Brand Logo - Enlarged & Glowing */
                <div className="relative w-14 h-14 flex items-center justify-center filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
                  <Image
                    src="/images/1 image-central admin.jpeg"
                    alt="NIRNAY Main Logo Emblem"
                    width={56}
                    height={56}
                    className="object-contain"
                    priority
                  />
                </div>
              )}
              <div>
                <h1 className="font-black text-xl text-slate-900 dark:text-white tracking-wider flex items-center gap-2 leading-none">
                  NIRNAY
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 font-bold">
                    v2.5 NATIONAL ENGINE
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                  National Decision Support &amp; Monitoring Engine
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {!selectedRole ? (
            /* PORTAL SELECTION VIEW */
            <div className="w-full animate-in">
              {/* Grand Hero Banner with Enlarged Emblem */}
              <div className="text-center mb-10 pt-4">
                <div className="mb-5 flex justify-center">
                  <div className="relative group">
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-blue-600 via-amber-500 to-rose-600 opacity-65 blur-2xl transition duration-500 group-hover:opacity-90" />
                    <div className="relative w-36 h-36 flex items-center justify-center filter drop-shadow-[0_12px_32px_rgba(245,158,11,0.5)]">
                      <Image
                        src="/images/1 image-central admin.jpeg"
                        alt="NIRNAY Official Main Emblem"
                        width={144}
                        height={144}
                        className="object-contain transform transition duration-300 group-hover:scale-105"
                        priority
                      />
                    </div>
                  </div>
                </div>

                <h2 className="font-black text-2xl sm:text-3xl text-slate-900 dark:text-white uppercase tracking-tight">
                  NIRNAY National Governance &amp; Monitoring Engine
                </h2>
                <p className="max-w-2xl mx-auto mt-2 text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                  Select your operational portal below to proceed with biometric FRS face recognition and GPS geofenced access.
                </p>
                <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
                  Designed &amp; Maintained by National Informatics Centre (NIC)
                </p>
              </div>

              {/* 5 Portal Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {PORTAL_ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className="group relative rounded-3xl overflow-hidden text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col"
                    style={{
                      borderColor: "var(--border-light)",
                    }}
                  >
                    {/* Image Banner */}
                    <div className="relative w-full h-40 overflow-hidden bg-slate-950">
                      <Image
                        src={role.imagePath}
                        alt={role.schemeTitle}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                        <span
                          className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shadow-md"
                          style={{ background: role.accentColor }}
                        >
                          {role.emblemSub}
                        </span>

                        {role.requiresFRS && (
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/70 text-emerald-400 border border-white/20">
                            <Fingerprint size={12} /> FRS &amp; GPS LOCK
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 z-10">
                        <h3 className="font-black text-sm text-white tracking-wide leading-tight drop-shadow-md">
                          {role.schemeTitle}
                        </h3>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <p className="font-bold text-xs mb-1.5 flex items-center gap-1.5" style={{ color: role.accentColor }}>
                          <ShieldCheck size={16} />
                          {role.roleName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                          {role.purposeSummary}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1 font-extrabold text-xs" style={{ color: role.accentColor }}>
                          Access Portal <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">OFFICIAL</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* LOGIN FORM VIEW */
            <div className="w-full max-w-md animate-in pt-4 sm:pt-8">
              <div className="rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
                {/* Role Header */}
                <div
                  className="p-6 border-b border-slate-200 dark:border-slate-800"
                  style={{ background: `${selectedRole.accentColor}08` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white shadow-xl flex-shrink-0"
                      style={{ backgroundColor: selectedRole.accentColor }}
                    >
                      <span className="text-xs font-black">{selectedRole.emblemSub}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        {selectedRole.portalName}
                      </span>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {selectedRole.roleName}
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Authorized Functions Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                    <span className="block font-bold text-slate-900 dark:text-white mb-1">
                      Authorized Portal Functions:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400">{selectedRole.purposeSummary}</span>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Official Work Email / ID
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full text-xs font-semibold px-4 py-3 pl-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full text-xs font-semibold px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <>
                          {selectedRole.requiresFRS ? "Proceed to FRS Verification" : "Sign In & Access"}
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative flex items-center gap-3 py-1">
                      <div className="flex-1 h-px" style={{ background: "var(--border-subtle, #e2e8f0)" }} />
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary, #94a3b8)", fontWeight: 600 }}>OR</span>
                      <div className="flex-1 h-px" style={{ background: "var(--border-subtle, #e2e8f0)" }} />
                    </div>

                    {/* Face Login Button */}
                    <FaceLoginButton
                      userId={email.split("@")[0] || selectedRole?.demoEmail.split("@")[0] || "official"}
                      onSuccess={(sessionData) => {
                        const currentRole = selectedRole || PORTAL_ROLES[0];
                        setUserRole(currentRole.id);
                        let target = "/dashboard";
                        if (currentRole.id === "INSPECTION_OFFICER" || currentRole.id === "AUDIT_SQUAD") target = "/dashboard/inspector";
                        else if (currentRole.id === "NGO_INSTITUTE" || currentRole.id === "PROJECT_ADMIN" || currentRole.id === "AGENCY_PORTAL") target = "/dashboard/agency";
                        else if (currentRole.id === "STATE_ADMIN") target = "/dashboard/regional";
                        else if (currentRole.id === "ADMIN") target = "/dashboard/admin";
                        router.push(target);
                        router.refresh();
                      }}
                      onFallback={() => {
                        /* Stay on password form */
                      }}
                    />
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
