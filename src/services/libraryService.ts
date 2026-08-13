import libraryJson from "@/data/university-library.json";
import { resolveCatalogLogoUrl } from "@/lib/libraryLogos";
import { scaffoldUniversityMedia } from "@/lib/scaffoldUniversityMedia";
import { supabase } from "@/lib/supabase";
import { createOpsUniversity } from "@/services/opsService";
import type { OpsUniversity } from "@/types/ops";
import type { LibrarySearchHit, LibrarySource, LibraryUniversity } from "@/types/library";
import { normalizeUniversityName } from "@/types/library";

/** Read-only snapshot of www public catalog (253). Regenerate via apps/docs/scripts/phase5-export-web-library.mjs --write */
export const UNIVERSITY_LIBRARY = libraryJson as LibraryUniversity[];

export function getLibraryBySlug(slug: string): LibraryUniversity | undefined {
  return UNIVERSITY_LIBRARY.find((u) => u.slug === slug);
}

export function searchLibraryCatalog(query: string, limit?: number): LibraryUniversity[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    const all = [...UNIVERSITY_LIBRARY].sort((a, b) => a.name.localeCompare(b.name));
    return limit ? all.slice(0, limit) : all;
  }

  const scored = UNIVERSITY_LIBRARY.map((u) => {
    const hay =
      `${u.name} ${u.chinese_name ?? ""} ${u.city ?? ""} ${u.province ?? ""} ${u.slug}`.toLowerCase();
    let score = 0;
    if (u.name.toLowerCase() === q) score = 100;
    else if (u.name.toLowerCase().startsWith(q)) score = 80;
    else if (u.slug.includes(q.replace(/\s+/g, "-"))) score = 70;
    else if (hay.includes(q)) score = 50;
    else return null;
    return { u, score };
  }).filter(Boolean) as { u: LibraryUniversity; score: number }[];

  const results = scored
    .sort((a, b) => b.score - a.score || a.u.name.localeCompare(b.u.name))
    .map((s) => s.u);

  return limit ? results.slice(0, limit) : results;
}

function mergeHit(
  map: Map<string, LibrarySearchHit>,
  partial: {
    name: string;
    slug?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string;
    chinese_name?: string | null;
    website?: string | null;
    abbreviation?: string | null;
    university_type?: string | null;
    logo_url?: string | null;
    source: LibrarySource;
    opsId?: string | null;
    pipelineId?: string | null;
    partnerId?: string | null;
    library?: LibraryUniversity | null;
  },
) {
  const slug = partial.slug ?? null;
  const key = slug || `name:${normalizeUniversityName(partial.name)}`;
  const existing = map.get(key);

  if (!existing) {
    map.set(key, {
      key,
      name: partial.name,
      slug,
      city: partial.city ?? null,
      province: partial.province ?? null,
      country: partial.country ?? "China",
      chinese_name: partial.chinese_name ?? null,
      website: partial.website ?? null,
      abbreviation: partial.abbreviation ?? null,
      university_type: partial.university_type ?? null,
      logo_url: partial.logo_url ?? null,
      sources: [partial.source],
      opsUniversityId: partial.opsId ?? null,
      pipelineUniversityId: partial.pipelineId ?? null,
      partnerUniversityId: partial.partnerId ?? null,
      library: partial.library ?? null,
    });
    return;
  }

  if (!existing.sources.includes(partial.source)) {
    existing.sources.push(partial.source);
  }
  if (partial.opsId) existing.opsUniversityId = partial.opsId;
  if (partial.pipelineId) existing.pipelineUniversityId = partial.pipelineId;
  if (partial.partnerId) existing.partnerUniversityId = partial.partnerId;
  if (partial.library) existing.library = partial.library;
  if (!existing.slug && slug) existing.slug = slug;
  if (!existing.city && partial.city) existing.city = partial.city;
  if (!existing.province && partial.province) existing.province = partial.province;
  if (!existing.chinese_name && partial.chinese_name) {
    existing.chinese_name = partial.chinese_name;
  }
  if (!existing.logo_url && partial.logo_url) existing.logo_url = partial.logo_url;
  if (!existing.logo_url && partial.library?.slug) {
    existing.logo_url = resolveCatalogLogoUrl(partial.library.slug, partial.library.logo_url);
  }
}

function enrichHitLogo(hit: LibrarySearchHit) {
  hit.logo_url = resolveCatalogLogoUrl(hit.slug, hit.logo_url);
}

/**
 * Federated library search: public catalog (read-only) + ops + pipeline + partner.
 * Merges by slug / normalized name. Does not create or migrate anything.
 */
export async function searchUniversityLibrary(query: string): Promise<LibrarySearchHit[]> {
  const q = query.trim();
  const libraryHits = searchLibraryCatalog(q, q ? 80 : undefined);
  const map = new Map<string, LibrarySearchHit>();

  for (const lib of libraryHits) {
    mergeHit(map, {
      name: lib.name,
      slug: lib.slug,
      city: lib.city,
      province: lib.province,
      country: lib.country,
      chinese_name: lib.chinese_name,
      website: lib.website,
      abbreviation: lib.abbreviation,
      university_type: lib.university_type,
      logo_url: resolveCatalogLogoUrl(lib.slug, lib.logo_url),
      source: "public_catalog",
      library: lib,
    });
  }

  let opsQuery = supabase
    .from("ops_universities")
    .select(
      "id, name, slug, public_catalog_slug, city, province, country, chinese_name, website, short_name, university_type, logo_url",
    );
  let pipeQuery = supabase
    .from("pipeline_universities")
    .select("id, name, city, ops_university_id");
  let partnerQuery = supabase
    .from("partner_universities")
    .select("id, name, city, catalog_slug, ops_university_id");

  if (q) {
    opsQuery = opsQuery.or(
      `name.ilike.%${q}%,slug.ilike.%${q}%,public_catalog_slug.ilike.%${q}%,chinese_name.ilike.%${q}%`,
    );
    pipeQuery = pipeQuery.ilike("name", `%${q}%`);
    partnerQuery = partnerQuery.or(`name.ilike.%${q}%,catalog_slug.ilike.%${q}%`);
  }

  const [opsRes, pipeRes, partnerRes] = await Promise.all([
    opsQuery.limit(40).then((r) => r).catch(() => ({ data: null, error: true })),
    pipeQuery.limit(40).then((r) => r).catch(() => ({ data: null, error: true })),
    partnerQuery.limit(40).then((r) => r).catch(() => ({ data: null, error: true })),
  ]);

  // Prefer throwing only when public catalog is empty AND all live queries failed
  const liveFailed = [opsRes, pipeRes, partnerRes].every((r) => "error" in r && r.error);
  if (liveFailed && libraryHits.length === 0) {
    throw new Error("Could not search university registries");
  }

  for (const row of opsRes.data ?? []) {
    const slug = row.public_catalog_slug || row.slug;
    mergeHit(map, {
      name: row.name,
      slug,
      city: row.city,
      province: row.province,
      country: row.country ?? "China",
      chinese_name: row.chinese_name,
      website: row.website,
      abbreviation: row.short_name,
      university_type: row.university_type,
      logo_url: row.logo_url,
      source: "ops",
      opsId: row.id,
    });
  }

  for (const row of pipeRes.data ?? []) {
    const norm = normalizeUniversityName(row.name);
    let attached = false;
    for (const hit of map.values()) {
      if (normalizeUniversityName(hit.name) === norm) {
        if (!hit.sources.includes("pipeline")) hit.sources.push("pipeline");
        hit.pipelineUniversityId = row.id;
        if (row.ops_university_id) hit.opsUniversityId = row.ops_university_id;
        attached = true;
        break;
      }
    }
    if (!attached) {
      mergeHit(map, {
        name: row.name,
        city: row.city,
        source: "pipeline",
        pipelineId: row.id,
        opsId: row.ops_university_id ?? null,
      });
    }
  }

  for (const row of partnerRes.data ?? []) {
    const slug = row.catalog_slug as string | null;
    const norm = normalizeUniversityName(row.name);
    let attached = false;
    for (const hit of map.values()) {
      if ((slug && hit.slug === slug) || normalizeUniversityName(hit.name) === norm) {
        if (!hit.sources.includes("partner")) hit.sources.push("partner");
        hit.partnerUniversityId = row.id;
        if (row.ops_university_id) hit.opsUniversityId = row.ops_university_id;
        attached = true;
        break;
      }
    }
    if (!attached) {
      mergeHit(map, {
        name: row.name,
        slug,
        city: row.city,
        source: "partner",
        partnerId: row.id,
        opsId: row.ops_university_id ?? null,
      });
    }
  }

  const unresolved = [...map.values()].filter((h) => !h.opsUniversityId);
  if (unresolved.length > 0) {
    const { data: allOps } = await supabase
      .from("ops_universities")
      .select("id, name, slug, public_catalog_slug");
    for (const hit of unresolved) {
      const match = (allOps ?? []).find(
        (o) =>
          (hit.slug && (o.public_catalog_slug === hit.slug || o.slug === hit.slug)) ||
          normalizeUniversityName(o.name) === normalizeUniversityName(hit.name),
      );
      if (match) {
        hit.opsUniversityId = match.id;
        if (!hit.sources.includes("ops")) hit.sources.push("ops");
      }
    }
  }

  for (const hit of map.values()) enrichHitLogo(hit);

  return [...map.values()].sort((a, b) => {
    const aOps = a.opsUniversityId ? 1 : 0;
    const bOps = b.opsUniversityId ? 1 : 0;
    if (aOps !== bOps) return bOps - aOps;
    return a.name.localeCompare(b.name);
  });
}

export type AddToOpsResult =
  | { status: "created"; university: OpsUniversity }
  | { status: "existing"; university: OpsUniversity };

/**
 * Promote a library (or pipeline/partner) university into Ops.
 * Identity fields only. Never duplicates. Does not touch application FKs.
 */
export async function addUniversityToOps(hit: LibrarySearchHit): Promise<AddToOpsResult> {
  if (hit.slug) {
    const { data: bySlug } = await supabase
      .from("ops_universities")
      .select("*")
      .or(`public_catalog_slug.eq.${hit.slug},slug.eq.${hit.slug}`)
      .maybeSingle();
    if (bySlug) {
      await linkCompatRegistries(bySlug as OpsUniversity, hit);
      return { status: "existing", university: bySlug as OpsUniversity };
    }
  }

  const { data: byNameRows } = await supabase.from("ops_universities").select("*");
  const byName = (byNameRows ?? []).find(
    (o) => normalizeUniversityName(o.name) === normalizeUniversityName(hit.name),
  );
  if (byName) {
    if (hit.slug && !byName.public_catalog_slug) {
      await supabase
        .from("ops_universities")
        .update({ public_catalog_slug: hit.slug, slug: byName.slug || hit.slug })
        .eq("id", byName.id);
      byName.public_catalog_slug = hit.slug;
    }
    await linkCompatRegistries(byName as OpsUniversity, hit);
    return { status: "existing", university: byName as OpsUniversity };
  }

  const lib = hit.library ?? (hit.slug ? getLibraryBySlug(hit.slug) : undefined);
  const fromCatalog = Boolean(lib) || hit.sources.includes("public_catalog");
  const university = await createOpsUniversity({
    name: hit.name,
    chinese_name: hit.chinese_name ?? lib?.chinese_name ?? null,
    short_name: hit.abbreviation ?? lib?.abbreviation ?? null,
    slug: hit.slug ?? lib?.slug ?? null,
    city: hit.city ?? lib?.city ?? null,
    province: hit.province ?? lib?.province ?? null,
    country: hit.country || lib?.country || "China",
    university_type: hit.university_type ?? lib?.university_type ?? null,
    website: hit.website ?? lib?.website ?? null,
    logo_url: resolveCatalogLogoUrl(
      hit.slug ?? lib?.slug ?? null,
      hit.logo_url ?? lib?.logo_url ?? null,
    ),
    public_visibility: false,
    record_source: fromCatalog ? "web_catalog" : "manual",
    public_catalog_slug: hit.slug ?? lib?.slug ?? null,
    description: lib?.description_short ?? null,
    ranking_notes: lib?.rank != null ? `Library reference rank: ${lib.rank}` : null,
    internal_notes:
      "Added from University Library. Identity only — programs, offers, tuition, and contacts must be verified manually.",
  });

  await linkCompatRegistries(university, hit);

  const mediaSlug = university.slug ?? university.public_catalog_slug ?? hit.slug ?? lib?.slug ?? null;
  void scaffoldUniversityMedia(university.name, mediaSlug);

  return { status: "created", university };
}

/** Soft-link pipeline/partner rows to ops. Does not change application FKs. */
async function linkCompatRegistries(ops: OpsUniversity, hit: LibrarySearchHit): Promise<void> {
  if (hit.pipelineUniversityId) {
    await supabase
      .from("pipeline_universities")
      .update({ ops_university_id: ops.id })
      .eq("id", hit.pipelineUniversityId)
      .is("ops_university_id", null);
  } else {
    await supabase
      .from("pipeline_universities")
      .update({ ops_university_id: ops.id })
      .ilike("name", ops.name)
      .is("ops_university_id", null);
  }

  if (hit.partnerUniversityId) {
    await supabase
      .from("partner_universities")
      .update({ ops_university_id: ops.id })
      .eq("id", hit.partnerUniversityId)
      .is("ops_university_id", null);
  } else if (hit.slug) {
    await supabase
      .from("partner_universities")
      .update({ ops_university_id: ops.id })
      .eq("catalog_slug", hit.slug)
      .is("ops_university_id", null);
  } else {
    await supabase
      .from("partner_universities")
      .update({ ops_university_id: ops.id })
      .ilike("name", ops.name)
      .is("ops_university_id", null);
  }
}

export async function createManualOpsUniversity(input: {
  name: string;
  city?: string;
  province?: string;
  website?: string;
}): Promise<OpsUniversity> {
  const hit: LibrarySearchHit = {
    key: `manual:${input.name}`,
    name: input.name.trim(),
    slug: null,
    city: input.city?.trim() || null,
    province: input.province?.trim() || null,
    country: "China",
    chinese_name: null,
    website: input.website?.trim() || null,
    abbreviation: null,
    university_type: null,
    logo_url: null,
    sources: [],
    opsUniversityId: null,
    pipelineUniversityId: null,
    partnerUniversityId: null,
    library: null,
  };
  const result = await addUniversityToOps(hit);
  if (result.status === "created") {
    await supabase
      .from("ops_universities")
      .update({ record_source: "manual" })
      .eq("id", result.university.id);
    result.university.record_source = "manual";
  }
  return result.university;
}
