import logoPathsJson from "@/data/university-logos.json";

const logoPaths = logoPathsJson as Record<string, string>;

const DEFAULT_WWW_ORIGIN = "https://www.sallam.ma";

/** Public www origin for catalog media (logos live on www.sallam.ma). */
export const wwwBaseUrl = (
  import.meta.env.DEV
    ? ""
    : (() => {
        const configured = (import.meta.env.VITE_WWW_URL as string | undefined)?.trim();
        return configured || DEFAULT_WWW_ORIGIN;
      })()
).replace(/\/$/, "");

export function resolveCatalogLogoUrl(
  slug: string | null | undefined,
  explicitUrl?: string | null,
): string | null {
  const normalizedExplicit = explicitUrl?.trim() || undefined;
  let path =
    normalizedExplicit ??
    (slug ? logoPaths[slug] : undefined) ??
    (slug ? `/universities/${slug}/logo.webp` : undefined);

  if (!path) return null;

  // Normalize catalog absolute URLs so dev can serve from local public/
  if (path.startsWith("http")) {
    try {
      const url = new URL(path);
      if (url.pathname.startsWith("/universities/")) {
        path = url.pathname;
      } else {
        return path;
      }
    } catch {
      return path;
    }
  }

  return `${wwwBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function hasCatalogLogo(slug: string | null | undefined): boolean {
  return Boolean(slug && (logoPaths[slug] || slug));
}
