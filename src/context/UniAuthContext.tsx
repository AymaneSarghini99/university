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
  signOut: () => Promise<void>;
}

const UniAuthContext = createContext<UniAuthContextType | undefined>(undefined);

const MOCK_USER = { id: MOCK_USER_ID, email: MOCK_ACCOUNT.email } as User;

export const UniAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const devPreview = isLocalDevBypass();
  const { user: authUser, mode, signOut: authSignOut } = useAuthContext();
  const [user, setUser] = useState<User | null>(devPreview ? MOCK_USER : null);
  const [account, setAccount] = useState<UniversityAccount | null>(devPreview ? MOCK_ACCOUNT : null);
  const [loading, setLoading] = useState(!devPreview);

  const loadAccount = async (userId: string) => {
    const { data } = await supabase
      .from("university_accounts")
      .select("*, university:partner_universities(*)")
      .eq("id", userId)
      .eq("is_active", true)
      .maybeSingle();
    setAccount((data as UniversityAccount | null) ?? null);
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

      // Only load partner account when in partner mode (admins never get partner data via this path)
      if (authUser && mode === "partner") {
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
  }, [authUser, mode, devPreview]);

  const signOut = async () => {
    if (devPreview) return;
    await authSignOut();
    setUser(null);
    setAccount(null);
  };

  return (
    <UniAuthContext.Provider
      value={{ user, account, loading, isDevPreview: devPreview, signOut }}
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
