/**
 * Role resolution via raw REST/RPC fetch (AbortController).
 * Never uses supabase.from() during auth — avoids auth-client deadlocks.
 */
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase";
import type { AuthMode } from "@/types/auth";

const FETCH_MS = 5_000;

async function restFetch<T>(
  path: string,
  accessToken: string,
  init: RequestInit & { label: string },
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_MS);
  const { label, ...rest } = init;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      ...rest,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(rest.headers as Record<string, string> | undefined),
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`${label} failed (${res.status})${body ? `: ${body.slice(0, 160)}` : ""}`);
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`${label} timed out (${FETCH_MS / 1000}s).`);
    }
    throw err;
  } finally {
    window.clearTimeout(timer);
  }
}

async function tryOnce(userId: string, accessToken: string): Promise<AuthMode> {
  // Fast path: security-definer RPC used by RLS elsewhere
  try {
    const isAdmin = await restFetch<boolean>("rpc/is_sallam_admin", accessToken, {
      method: "POST",
      body: "{}",
      label: "Admin RPC",
    });
    if (isAdmin === true) return "admin";
  } catch (err) {
    console.warn("[Auth] is_sallam_admin RPC failed, falling back to profiles", err);
  }

  const profiles = await restFetch<{ role?: string }[]>(
    `profiles?select=role&id=eq.${encodeURIComponent(userId)}`,
    accessToken,
    { method: "GET", label: "Admin role check" },
  );

  const role = profiles?.[0]?.role;
  if (role === "admin" || role === "super_admin") return "admin";

  const accounts = await restFetch<{ id: string }[]>(
    `university_accounts?select=id&id=eq.${encodeURIComponent(userId)}&is_active=eq.true`,
    accessToken,
    { method: "GET", label: "Partner account check" },
  );

  return accounts?.length ? "partner" : null;
}

/** Resolve admin | partner | null using the session access token. */
export async function resolveAuthMode(
  userId: string,
  accessToken: string,
): Promise<AuthMode> {
  try {
    return await tryOnce(userId, accessToken);
  } catch (first) {
    console.warn("[Auth] role check failed, retrying once", first);
    // One retry after a short pause (helps flaky networks)
    await new Promise((r) => window.setTimeout(r, 400));
    return await tryOnce(userId, accessToken);
  }
}
