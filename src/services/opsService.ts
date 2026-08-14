import { supabase } from "@/lib/supabase";
import type {
  OpsContact,
  OpsDashboardStats,
  OpsActivityItem,
  OpsOffer,
  OpsPartnership,
  OpsProgram,
  OpsUniversity,
  OfferStatus,
  RelationshipStatus,
  RichOffer,
  RichProgram,
  RichUniversity,
  OFFER_LABELS,
} from "@/types/ops";

// ── Universities ─────────────────────────────────────────────────────────────

export async function fetchOpsUniversities(filters?: {
  relationshipStatus?: RelationshipStatus | "all";
  operationalStatus?: OpsUniversity["status"] | "all";
  search?: string;
  /** When true (default), hide archived seed/unused universities from operational lists. */
  excludeArchived?: boolean;
}): Promise<RichUniversity[]> {
  let query = supabase
    .from("ops_universities")
    .select("*, partnership:ops_partnerships(*)")
    .order("name");

  if (filters?.search?.trim()) {
    query = query.ilike("name", `%${filters.search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((row) => {
    const partnershipRaw = row.partnership;
    const partnership = Array.isArray(partnershipRaw)
      ? (partnershipRaw[0] as OpsPartnership | undefined) ?? null
      : (partnershipRaw as OpsPartnership | null);
    const { partnership: _, ...uni } = row;
    return { ...(uni as OpsUniversity), partnership };
  });

  let filtered = rows;
  if (filters?.relationshipStatus && filters.relationshipStatus !== "all") {
    filtered = filtered.filter(
      (r) => r.partnership?.relationship_status === filters.relationshipStatus,
    );
  }
  if (filters?.operationalStatus && filters.operationalStatus !== "all") {
    filtered = filtered.filter((r) => r.status === filters.operationalStatus);
  }
  if (filters?.excludeArchived !== false) {
    filtered = filtered.filter((r) => r.status !== "archived");
  }
  return filtered;
}

export async function fetchOpsUniversity(id: string): Promise<RichUniversity | null> {
  const { data, error } = await supabase
    .from("ops_universities")
    .select("*, partnership:ops_partnerships(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const partnershipRaw = data.partnership;
  const partnership = Array.isArray(partnershipRaw)
    ? (partnershipRaw[0] as OpsPartnership | undefined) ?? null
    : (partnershipRaw as OpsPartnership | null);
  const { partnership: _, ...uni } = data;
  return { ...(uni as OpsUniversity), partnership };
}

export async function createOpsUniversity(
  input: Partial<OpsUniversity> & { name: string },
): Promise<OpsUniversity> {
  const { data, error } = await supabase
    .from("ops_universities")
    .insert({
      name: input.name.trim(),
      chinese_name: input.chinese_name ?? null,
      short_name: input.short_name ?? null,
      slug: input.slug ?? null,
      city: input.city ?? null,
      province: input.province ?? null,
      country: input.country ?? "China",
      university_type: input.university_type ?? null,
      website: input.website ?? null,
      logo_url: input.logo_url ?? null,
      public_visibility: input.public_visibility ?? false,
      record_source: input.record_source ?? "manual",
      public_catalog_slug: input.public_catalog_slug ?? null,
      ranking_notes: input.ranking_notes ?? null,
      description: input.description ?? null,
      internal_notes: input.internal_notes ?? null,
      status: input.status ?? "research",
    })
    .select()
    .single();
  if (error) throw error;

  // Ensure partnership row exists
  await supabase.from("ops_partnerships").insert({
    university_id: data.id,
    relationship_status: "no_relationship",
    status: "no_relationship",
  });

  return data as OpsUniversity;
}

export const BLANK_UNIVERSITY_NAME = "New university";

export async function createBlankOpsUniversity(): Promise<OpsUniversity> {
  return createOpsUniversity({
    name: BLANK_UNIVERSITY_NAME,
    record_source: "manual",
    status: "research",
  });
}

export async function updateOpsUniversity(
  id: string,
  patch: Partial<OpsUniversity>,
): Promise<void> {
  const { error } = await supabase.from("ops_universities").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteOpsUniversity(id: string): Promise<void> {
  const { error } = await supabase.from("ops_universities").delete().eq("id", id);
  if (error) throw error;
}

// ── Partnerships ─────────────────────────────────────────────────────────────

export async function upsertPartnership(
  universityId: string,
  patch: Partial<OpsPartnership> & { relationship_status?: RelationshipStatus },
): Promise<OpsPartnership> {
  const { data: existing } = await supabase
    .from("ops_partnerships")
    .select("id")
    .eq("university_id", universityId)
    .maybeSingle();

  // Keep legacy status in sync with relationship_status during transition
  const updatePayload = { ...patch };
  if (patch.relationship_status) {
    updatePayload.status = patch.relationship_status;
  }

  if (existing) {
    const { data, error } = await supabase
      .from("ops_partnerships")
      .update(updatePayload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as OpsPartnership;
  }

  const insertPayload = { university_id: universityId, relationship_status: "no_relationship", status: "no_relationship", ...patch };
  if (patch.relationship_status) insertPayload.status = patch.relationship_status;

  const { data, error } = await supabase
    .from("ops_partnerships")
    .insert(insertPayload)
    .select()
    .single();
  if (error) throw error;
  return data as OpsPartnership;
}

// ── Programs ─────────────────────────────────────────────────────────────────

export async function fetchPrograms(universityId?: string): Promise<OpsProgram[]> {
  let query = supabase.from("ops_programs").select("*").order("name");
  if (universityId) query = query.eq("university_id", universityId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OpsProgram[];
}

export async function createProgram(
  input: Partial<OpsProgram> & { university_id: string; name: string },
): Promise<OpsProgram> {
  const { data, error } = await supabase
    .from("ops_programs")
    .insert({
      university_id: input.university_id,
      name: input.name.trim(),
      degree_type: input.degree_type ?? null,
      teaching_language: input.teaching_language ?? null,
      major_category: input.major_category ?? null,
      duration: input.duration ?? null,
      tuition_guide: input.tuition_guide ?? null,
      accommodation_guide: input.accommodation_guide ?? null,
      application_fee: input.application_fee ?? null,
      currency: input.currency ?? "CNY",
      language_requirements: input.language_requirements ?? null,
      academic_requirements: input.academic_requirements ?? null,
      other_requirements: input.other_requirements ?? null,
      info_source: input.info_source ?? null,
      source_url: input.source_url ?? null,
      last_verified_at: input.last_verified_at ?? null,
      verified_by: input.verified_by ?? null,
      verification_notes: input.verification_notes ?? null,
      active: input.active ?? true,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OpsProgram;
}

export async function updateProgram(id: string, patch: Partial<OpsProgram>): Promise<void> {
  const { error } = await supabase.from("ops_programs").update(patch).eq("id", id);
  if (error) throw error;
}

// ── Offers ───────────────────────────────────────────────────────────────────

export async function fetchOffers(filters?: {
  status?: OfferStatus | "all";
  intake?: string;
  maxTuition?: number;
  scholarshipOnly?: boolean;
  universityId?: string;
  search?: string;
  /** When true, only returns active offers with verification metadata (Phase 4). */
  verifiedOnly?: boolean;
}): Promise<RichOffer[]> {
  let query = supabase
    .from("ops_offers")
    .select("*, university:ops_universities(*), program:ops_programs(*)")
    .order("deadline", { ascending: true, nullsFirst: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.intake) query = query.eq("intake", filters.intake);
  if (filters?.maxTuition != null) query = query.lte("tuition", filters.maxTuition);
  if (filters?.scholarshipOnly) query = query.not("scholarship_type", "is", null);
  if (filters?.universityId) query = query.eq("university_id", filters.universityId);
  if (filters?.verifiedOnly) query = query.not("last_verified_at", "is", null);

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []).map((row) => ({
    ...(row as OpsOffer),
    university: (row.university as OpsUniversity) ?? null,
    program: (row.program as OpsProgram) ?? null,
  }));

  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.university?.name.toLowerCase().includes(q) ||
        r.program?.name.toLowerCase().includes(q) ||
        r.intake.toLowerCase().includes(q),
    );
  }

  return rows;
}

export type OpsSearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: "university" | "program" | "offer";
  href: string;
};

export async function opsGlobalSearch(query: string): Promise<OpsSearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const [universities, programs, offers] = await Promise.all([
    fetchOpsUniversities({ search: q, excludeArchived: false }),
    fetchAllPrograms(q),
    fetchOffers({ status: "all", search: q }),
  ]);

  return [
    ...universities.slice(0, 4).map((u) => ({
      id: u.id,
      title: u.name,
      subtitle: u.city ?? undefined,
      type: "university" as const,
      href: `/ops/universities/${u.id}`,
    })),
    ...programs.slice(0, 4).map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.university?.name ?? undefined,
      type: "program" as const,
      href: `/ops/universities/${p.university_id}`,
    })),
    ...offers.slice(0, 4).map((o) => ({
      id: o.id,
      title: `${o.program?.name ?? "Offer"} · ${o.intake}`,
      subtitle: o.university?.name ?? undefined,
      type: "offer" as const,
      href: `/ops/universities/${o.university_id}`,
    })),
  ];
}

export async function fetchOffer(id: string): Promise<RichOffer | null> {
  const { data, error } = await supabase
    .from("ops_offers")
    .select("*, university:ops_universities(*), program:ops_programs(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...(data as OpsOffer),
    university: (data.university as OpsUniversity) ?? null,
    program: (data.program as OpsProgram) ?? null,
  };
}

export async function createOffer(
  input: Partial<OpsOffer> & { program_id: string; university_id: string; intake: string },
): Promise<OpsOffer> {
  const { data, error } = await supabase
    .from("ops_offers")
    .insert({
      program_id: input.program_id,
      university_id: input.university_id,
      intake: input.intake.trim(),
      academic_year: input.academic_year ?? null,
      tuition: input.tuition ?? null,
      currency: input.currency ?? "CNY",
      scholarship_type: input.scholarship_type ?? null,
      scholarship_notes: input.scholarship_notes ?? null,
      deadline: input.deadline ?? null,
      application_method: input.application_method ?? null,
      availability_notes: input.availability_notes ?? null,
      status: input.status ?? "potential",
      info_source: input.info_source ?? null,
      source_url: input.source_url ?? null,
      last_verified_at: input.last_verified_at ?? null,
      verified_by: input.verified_by ?? null,
      verification_notes: input.verification_notes ?? null,
      internal_notes: input.internal_notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OpsOffer;
}

export async function updateOffer(id: string, patch: Partial<OpsOffer>): Promise<void> {
  const { error } = await supabase.from("ops_offers").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteOffer(id: string): Promise<void> {
  const { error } = await supabase.from("ops_offers").delete().eq("id", id);
  if (error) throw error;
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export async function fetchContacts(universityId: string): Promise<OpsContact[]> {
  const { data, error } = await supabase
    .from("ops_university_contacts")
    .select("*")
    .eq("university_id", universityId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as OpsContact[];
}

export async function createContact(
  input: Partial<OpsContact> & { university_id: string; name: string },
): Promise<OpsContact> {
  const { data, error } = await supabase
    .from("ops_university_contacts")
    .insert({
      university_id: input.university_id,
      name: input.name.trim(),
      position: input.position ?? null,
      department: input.department ?? null,
      email: input.email ?? null,
      wechat: input.wechat ?? null,
      phone: input.phone ?? null,
      contact_type: input.contact_type ?? null,
      status: input.status ?? "active",
      last_contact_at: input.last_contact_at ?? null,
      next_follow_up_at: input.next_follow_up_at ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as OpsContact;
}

export async function updateContact(id: string, patch: Partial<OpsContact>): Promise<void> {
  const { error } = await supabase.from("ops_university_contacts").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from("ops_university_contacts").delete().eq("id", id);
  if (error) throw error;
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardStats(): Promise<OpsDashboardStats> {
  const today = new Date().toISOString().slice(0, 10);
  const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);

  const [
    verifyingOffers,
    expiringOffers,
    activeOffers,
    universities,
    programs,
  ] = await Promise.all([
    supabase
      .from("ops_offers")
      .select("id", { count: "exact", head: true })
      .eq("status", "verifying"),
    supabase
      .from("ops_offers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .gte("deadline", today)
      .lte("deadline", in14),
    supabase
      .from("ops_offers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("ops_universities").select("status"),
    supabase.from("ops_programs").select("id", { count: "exact", head: true }),
  ]);

  const operationalCounts: Record<string, number> = {};
  for (const row of universities.data ?? []) {
    const s = (row as { status: string }).status;
    operationalCounts[s] = (operationalCounts[s] ?? 0) + 1;
  }

  return {
    offersNeedingVerification: verifyingOffers.count ?? 0,
    offersExpiringSoon: expiringOffers.count ?? 0,
    activeOffers: activeOffers.count ?? 0,
    universitiesInResearch: operationalCounts.research ?? 0,
    totalUniversities: Object.values(operationalCounts).reduce((a, b) => a + b, 0),
    totalPrograms: programs.count ?? 0,
  };
}

export async function fetchAllPrograms(search?: string): Promise<RichProgram[]> {
  const { data, error } = await supabase
    .from("ops_programs")
    .select("*, university:ops_universities(*)")
    .order("name");
  if (error) throw error;

  let rows = (data ?? []).map((row) => ({
    ...(row as OpsProgram),
    university: (row.university as OpsUniversity) ?? null,
  }));

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.university?.name.toLowerCase().includes(q) ||
        r.degree_type?.toLowerCase().includes(q),
    );
  }

  return rows;
}

export async function fetchRecentActivity(): Promise<OpsActivityItem[]> {
  const [unis, offers, programs] = await Promise.all([
    supabase
      .from("ops_universities")
      .select("id, name, updated_at")
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("ops_offers")
      .select("id, intake, status, updated_at, university:ops_universities(name), program:ops_programs(name)")
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("ops_programs")
      .select("id, name, updated_at, university:ops_universities(name)")
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const items: OpsActivityItem[] = [];

  for (const u of unis.data ?? []) {
    items.push({
      id: `uni-${u.id}`,
      type: "university",
      title: (u as { name: string }).name,
      meta: "Updated",
      at: (u as { updated_at: string }).updated_at,
    });
  }

  for (const o of offers.data ?? []) {
    const row = o as {
      id: string;
      intake: string;
      status: string;
      updated_at: string;
      university: { name: string } | { name: string }[] | null;
      program: { name: string } | { name: string }[] | null;
    };
    const uni = Array.isArray(row.university) ? row.university[0] : row.university;
    const prog = Array.isArray(row.program) ? row.program[0] : row.program;
    items.push({
      id: `offer-${row.id}`,
      type: "offer",
      title: `${prog?.name ?? "Offer"} · ${OFFER_LABELS[row.status as OfferStatus] ?? row.status}`,
      meta: `${uni?.name ?? "—"} · ${row.intake}`,
      at: row.updated_at,
    });
  }

  for (const p of programs.data ?? []) {
    const row = p as {
      id: string;
      name: string;
      updated_at: string;
      university: { name: string } | { name: string }[] | null;
    };
    const uni = Array.isArray(row.university) ? row.university[0] : row.university;
    items.push({
      id: `prog-${row.id}`,
      type: "program",
      title: row.name,
      meta: uni?.name ?? undefined,
      at: row.updated_at,
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);
}

export async function verifyOffer(
  id: string,
  input: {
    infoSource: string;
    sourceUrl?: string | null;
    verifiedBy?: string | null;
    verificationNotes?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from("ops_offers")
    .update({
      status: "active",
      info_source: input.infoSource.trim(),
      source_url: input.sourceUrl?.trim() || null,
      verified_by: input.verifiedBy ?? null,
      verification_notes: input.verificationNotes?.trim() || null,
      last_verified_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
