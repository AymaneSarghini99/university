import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { resolveAuthMode } from "@/lib/resolveAuthMode";
import type { AuthMode } from "@/types/auth";

export type { AuthMode };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  isAdmin: boolean;
  mode: AuthMode;
  authError: string | null;
  clearAuthError: () => void;
  retryRoleCheck: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; mode?: AuthMode; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setMode] = useState<AuthMode>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const userRef = useRef<User | null>(null);
  const modeRef = useRef<AuthMode>(null);
  const sessionRef = useRef<Session | null>(null);
  const signInInFlightRef = useRef(false);

  useEffect(() => {
    userRef.current = user;
    modeRef.current = mode;
    sessionRef.current = session;
  }, [user, mode, session]);

  const clearSession = () => {
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setMode(null);
    setRoleLoading(false);
    setLoading(false);
  };

  const applyResolved = (next: Session, resolved: AuthMode) => {
    setSession(next);
    setUser(next.user);
    setMode(resolved);
    setIsAdmin(resolved === "admin");
    setRoleLoading(false);
    setLoading(false);
    setAuthError(null);
  };

  const runRoleCheck = async (next: Session) => {
    setRoleLoading(true);
    setAuthError(null);
    try {
      const resolved = await resolveAuthMode(next.user.id, next.access_token);
      if (!mountedRef.current) return;

      if (!resolved) {
        await supabase.auth.signOut();
        clearSession();
        setAuthError("No Sallam admin or university partner account found for this email.");
        return;
      }

      applyResolved(next, resolved);
    } catch (err) {
      console.error("[Auth] role resolve failed", err);
      if (!mountedRef.current) return;
      setRoleLoading(false);
      setLoading(false);
      // Keep session so user can retry without re-entering password
      setSession(next);
      setUser(next.user);
      setAuthError(err instanceof Error ? err.message : "Role check failed");
    }
  };

  const applySession = async (newSession: Session | null, event?: string) => {
    if (!newSession?.user || !newSession.access_token) {
      clearSession();
      return;
    }

    const sameUser = newSession.user.id === userRef.current?.id;
    if (
      sameUser &&
      (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") &&
      modeRef.current
    ) {
      setSession(newSession);
      setUser(newSession.user);
      setLoading(false);
      setRoleLoading(false);
      return;
    }

    // signIn() owns the role check — do not start a parallel one
    if (signInInFlightRef.current) {
      return;
    }

    await runRoleCheck(newSession);
  };

  useEffect(() => {
    mountedRef.current = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mountedRef.current) return;

      if (event === "SIGNED_OUT") {
        clearSession();
        return;
      }

      // Defer out of supabase auth lock
      setTimeout(() => {
        if (mountedRef.current) void applySession(newSession, event);
      }, 0);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email: string, password: string) => {
    if (signInInFlightRef.current) {
      return { success: false, error: "Sign-in already in progress." };
    }

    signInInFlightRef.current = true;
    setLoading(true);
    setAuthError(null);
    setRoleLoading(false);

    try {
      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Password sign-in timed out after 15s.")), 15_000);
      });

      const { data, error } = await Promise.race([authPromise, timeoutPromise]);

      if (error || !data?.user || !data.session?.access_token) {
        return { success: false, error: error?.message ?? "Invalid email or password" };
      }

      // Keep in-flight true through role check so onAuthStateChange does not race
      setSession(data.session);
      setUser(data.user);

      const resolved = await resolveAuthMode(data.user.id, data.session.access_token);
      if (!resolved) {
        await supabase.auth.signOut();
        clearSession();
        return {
          success: false,
          error: "No Sallam admin or university partner account found for this email.",
        };
      }

      applyResolved(data.session, resolved);
      return { success: true, mode: resolved };
    } catch (err) {
      console.error("[Auth] signIn error", err);
      const message = err instanceof Error ? err.message : "An error occurred during login";
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      signInInFlightRef.current = false;
      setLoading(false);
      setRoleLoading(false);
    }
  };

  const retryRoleCheck = async () => {
    const current = sessionRef.current;
    if (!current?.access_token || !current.user) {
      setAuthError("No session to retry. Sign in again.");
      return;
    }
    await runRoleCheck(current);
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise((resolve) => window.setTimeout(resolve, 4000)),
      ]);
    } catch {
      /* ignore */
    } finally {
      clearSession();
      setAuthError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roleLoading,
        isAdmin,
        mode,
        authError,
        clearAuthError: () => setAuthError(null),
        retryRoleCheck,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
};
