import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isLocalDevBypass } from "@/lib/dev-mode";
import { MOCK_ACCOUNT, MOCK_USER_ID } from "@/lib/mock-data";
import type { UniversityAccount } from "@/types";
import { useAuthContext } from "@/context/AuthContext";

interface UniAuthContextType {
  user: User | null;
  account: UniversityAccount | null;
  loading: boolean;
  isDevPreview: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const UniAuthContext = createContext<UniAuthContextType | undefined>(undefined);

const MOCK_USER = { id: MOCK_USER_ID, email: MOCK_ACCOUNT.email } as User;

export const UniAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const devPreview = isLocalDevBypass();
  const { user: authUser } = useAuthContext();
  const [user, setUser] = useState<User | null>(devPreview ? MOCK_USER : (authUser ?? null));
  const [account, setAccount] = useState<UniversityAccount | null>(devPreview ? MOCK_ACCOUNT : null);
  const [loading, setLoading] = useState(!devPreview);

  const loadAccount = async (userId: string) => {
    const { data } = await supabase
      .from("university_accounts")
      .select("*, university:partner_universities(*)")
      .eq("id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (data?.university && data.university.is_active === false) {
      setAccount(null);
      return;
    }

    setAccount(data ?? null);
  };

  useEffect(() => {
    if (devPreview) {
      setUser(MOCK_USER);
      setAccount(MOCK_ACCOUNT);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setUser(authUser ?? null);

      if (authUser) {
        try {
          await loadAccount(authUser.id);
        } catch {
          if (!cancelled) setAccount(null);
        }
      } else {
        setAccount(null);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser, devPreview]);

  const signIn = async (email: string, password: string) => {
    if (devPreview) return { success: true };

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.user) {
      return { success: false, error: error?.message ?? "Sign in failed" };
    }

    const { data: uniAccount } = await supabase
      .from("university_accounts")
      .select("id, university:partner_universities(is_active)")
      .eq("id", data.user.id)
      .eq("is_active", true)
      .maybeSingle();

    const partner = uniAccount?.university as { is_active?: boolean } | null;
    if (!uniAccount || partner?.is_active === false) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: partner?.is_active === false
          ? "This university partnership is no longer active."
          : "No university account found for this email.",
      };
    }

    return { success: true };
  };

  const signOut = async () => {
    if (devPreview) return;
    await supabase.auth.signOut();
    setUser(null);
    setAccount(null);
  };

  return (
    <UniAuthContext.Provider
      value={{ user, account, loading, isDevPreview: devPreview, signIn, signOut }}
    >
      {children}
    </UniAuthContext.Provider>
  );
};

export const useUniAuth = () => {
  const ctx = useContext(UniAuthContext);
  if (!ctx) throw new Error("useUniAuth must be used within UniAuthProvider");
  return ctx;
};
