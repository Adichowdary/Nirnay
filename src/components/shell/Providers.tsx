"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { createClient } from "@/lib/db/browser";
import type { User, Session } from "@supabase/supabase-js";
import type { RoleId } from "@/lib/auth/roles";
import { ROLE_META } from "@/lib/auth/roles";

// ─── Auth + App State ──────────────────────────────────────────────────────────

interface AppState {
  // Auth
  user: User | null;
  session: Session | null;
  userRole: RoleId | null;
  userProfile: UserProfile | null;
  authLoading: boolean;
  setUserRole: (role: RoleId | null) => void;
  signOut: () => Promise<void>;

  // UI preferences
  isDemoMode: boolean;
  isDarkMode: boolean;
  isReducedMotion: boolean;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;

  setDarkMode: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  official_id: string | null;
  state: string | null;
  district: string | null;
  biometric_status: string;
  consent_given_at: string | null;
}

const AppContext = createContext<AppState | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient();
  });

  // ── Auth state ──────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRoleState] = useState<RoleId | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── UI state ────────────────────────────────────────────────────────────
  // Single dark-mode authority: light default for office use,
  // stored override wins. GovernmentUtilityBar + TopBar consume this.
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored =
        localStorage.getItem("insight-theme") ??
        localStorage.getItem("insight-dark-mode");
      return stored === "dark" || stored === "true";
    } catch {
      return false;
    }
  });
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Synchronized setter for role (saves cookie + localStorage)
  const setUserRole = useCallback((role: RoleId | null) => {
    setUserRoleState(role);
    if (typeof window !== "undefined") {
      if (role) {
        localStorage.setItem("insight_active_role", role);
        document.cookie = `insight_demo_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      } else {
        localStorage.removeItem("insight_active_role");
        document.cookie = "insight_demo_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  }, []);

  // ── Fetch role + profile for a given user ──────────────────────────────
  const loadUserData = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      try {
        const [{ data: roleRow }, { data: profileRow }] = await Promise.all([
          supabase
            .from("user_roles")
            .select("role_id")
            .eq("user_id", userId)
            .single(),
          supabase
            .from("profiles")
            .select("id, full_name, official_id, state, district, biometric_status, consent_given_at")
            .eq("id", userId)
            .single(),
        ]);

        if (roleRow?.role_id) {
          setUserRole(roleRow.role_id as RoleId);
        }
        setUserProfile(profileRow ?? null);
      } catch {
        // Keep existing stored role if table query fails
      }
    },
    [supabase, setUserRole]
  );

  // ── Auth listener + initial session ────────────────────────────────────
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // 1. Initial role check from localStorage or cookie
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("insight_active_role") as RoleId | null;
      if (storedRole && ROLE_META[storedRole]) {
        setUserRoleState(storedRole);
      } else {
        const match = document.cookie.match(/insight_demo_role=([^;]+)/);
        if (match && match[1] && ROLE_META[match[1] as RoleId]) {
          setUserRoleState(match[1] as RoleId);
        }
      }
    }

    // 2. Get initial session
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserData(session.user.id).finally(() => setAuthLoading(false));
        } else {
          setAuthLoading(false);
        }
      });

      // 3. Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserData(session.user.id);
        }
      });

      return () => subscription.unsubscribe();
    }
    setAuthLoading(false);
    return undefined;
  }, [supabase, loadUserData]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // ── Dark mode ────────────────────────────────────────────────────────────
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setIsReducedMotion(mqMotion.matches);
    const handleMotion = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mqMotion.addEventListener("change", handleMotion);
    return () => mqMotion.removeEventListener("change", handleMotion);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    try {
      localStorage.setItem("insight-theme", isDarkMode ? "dark" : "light");
      localStorage.removeItem("insight-dark-mode");
    } catch {
      /* storage unavailable */
    }
  }, [isDarkMode]);

  const signOut = async () => {
    setUserRole(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("insight_active_role");
      document.cookie = "insight_demo_role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    try {
      await supabase?.auth.signOut();
    } catch {
      // Ignore Supabase network errors in demo/offline mode
    }
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        session,
        userRole,
        userProfile,
        authLoading,
        setUserRole,
        signOut,
        isDemoMode: process.env.NEXT_PUBLIC_DEMO_MODE === "true",
        isDarkMode,
        isReducedMotion,
        isSidebarCollapsed,
        isMobileMenuOpen,
        setDarkMode: setIsDarkMode,
        setSidebarCollapsed,
        setMobileMenuOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export { ROLE_META };
