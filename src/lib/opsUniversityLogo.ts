import libraryJson from "@/data/university-library.json";
import { resolveCatalogLogoUrl } from "@/lib/libraryLogos";
import { universitySlug } from "@/lib/universitySlug";
import { normalizeUniversityName } from "@/types/library";
import type { OpsUniversity } from "@/types/ops";

type LibraryRow = { slug: string; name: string; logo_url: string | null };

const LIBRARY = libraryJson as LibraryRow[];

function findLibraryByName(name: string): LibraryRow | undefined {
  const norm = normalizeUniversityName(name);
  return LIBRARY.find((u) => normalizeUniversityName(u.name) === norm);
}

/** Resolve catalog slug for an ops row (DB slug → library name match → generated slug). */
export function resolveOpsCatalogSlug(uni: Pick<OpsUniversity, "name" | "slug" | "public_catalog_slug">): string | null {
  const fromDb = uni.public_catalog_slug?.trim() || uni.slug?.trim();
  if (fromDb) return fromDb;

  const fromLibrary = findLibraryByName(uni.name)?.slug;
  if (fromLibrary) return fromLibrary;

  const generated = universitySlug(uni.name);
  return generated || null;
}

/** Resolve a display-ready logo URL for an ops university row. */
export function resolveOpsUniversityLogo(
  uni: Pick<OpsUniversity, "name" | "slug" | "public_catalog_slug" | "logo_url">,
): string | null {
  const slug = resolveOpsCatalogSlug(uni);
  const explicit = uni.logo_url?.trim() || findLibraryByName(uni.name)?.logo_url || null;
  return resolveCatalogLogoUrl(slug, explicit);
}

/** Logo URL candidates (primary + common extensions) for resilient `<img>` loading. */
export function opsUniversityLogoCandidates(
  uni: Pick<OpsUniversity, "name" | "slug" | "public_catalog_slug" | "logo_url">,
): string[] {
  const slug = resolveOpsCatalogSlug(uni);
  if (!slug) {
    const only = resolveOpsUniversityLogo(uni);
    return only ? [only] : [];
  }

  const explicit = uni.logo_url?.trim() || findLibraryByName(uni.name)?.logo_url || null;
  const candidates = [
    resolveCatalogLogoUrl(slug, explicit),
    resolveCatalogLogoUrl(slug, `/universities/${slug}/logo.png`),
    resolveCatalogLogoUrl(slug, `/universities/${slug}/logo.webp`),
    resolveCatalogLogoUrl(slug, `/universities/${slug}/logo.jpeg`),
    resolveCatalogLogoUrl(slug, `/universities/${slug}/logo.jpg`),
  ].filter(Boolean) as string[];

  return [...new Set(candidates)];
}
