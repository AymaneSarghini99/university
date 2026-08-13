/**
 * Shared admin session storage for docs + finance + uni ops on *.sallam.ma.
 * Uses localStorage per origin and mirrors the session to a parent-domain cookie
 * so logging in on one Sallam admin app keeps you signed in on the others.
 */
export const SALLAM_AUTH_STORAGE_KEY = "sallam-admin-auth";

type AuthStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

export function getAuthCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  if (host === "sallam.ma" || host.endsWith(".sallam.ma")) return ".sallam.ma";
  return undefined;
}

function readCookie(key: string): string | null {
  const prefix = `${encodeURIComponent(key)}=`;
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

function writeCookie(key: string, value: string, domain: string) {
  const encoded = encodeURIComponent(value);
  if (encoded.length > 3500) return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${encodeURIComponent(key)}=${encoded}; domain=${domain}; path=/; max-age=${maxAge}; secure; samesite=lax`;
}

function clearCookie(key: string, domain: string) {
  document.cookie = `${encodeURIComponent(key)}=; domain=${domain}; path=/; max-age=0; secure; samesite=lax`;
}

/** One-time migration from Supabase default localStorage keys. */
function readLegacySupabaseSession(key: string): string | null {
  if (key !== SALLAM_AUTH_STORAGE_KEY) return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (!storageKey || !storageKey.startsWith("sb-") || !storageKey.endsWith("-auth-token")) {
        continue;
      }
      const legacy = localStorage.getItem(storageKey);
      if (legacy) {
        localStorage.setItem(SALLAM_AUTH_STORAGE_KEY, legacy);
        return legacy;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function createSallamAuthStorage(): AuthStorage {
  const domain = getAuthCookieDomain();

  return {
    getItem(key: string) {
      try {
        const local = localStorage.getItem(key);
        if (local) return local;
      } catch {
        /* ignore */
      }

      const legacy = readLegacySupabaseSession(key);
      if (legacy) return legacy;

      if (!domain) return null;
      return readCookie(key);
    },
    setItem(key: string, value: string) {
      try {
        localStorage.setItem(key, value);
      } catch {
        /* ignore */
      }
      if (domain) writeCookie(key, value, domain);
    },
    removeItem(key: string) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      if (domain) clearCookie(key, domain);
    },
  };
}
