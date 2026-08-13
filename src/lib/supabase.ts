import { createClient } from "@supabase/supabase-js";
import { createSallamAuthStorage, SALLAM_AUTH_STORAGE_KEY } from "@/lib/auth-storage";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

// On localhost, use default localStorage only (shared cookie storage can fight auth locks).
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(isLocalhost
      ? {}
      : {
          storage: createSallamAuthStorage(),
          storageKey: SALLAM_AUTH_STORAGE_KEY,
        }),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
