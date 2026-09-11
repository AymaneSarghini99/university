/** Ops entity types — University Operations canonical model */

/** Operational status of a university Sallam has selected for work. */
export type OperationalStatus =
  | "research"
  | "verifying"
  | "active"
  | "closed"
  | "archived";

/** Relationship status of Sallam with the university. */
export type RelationshipStatus =
  | "no_relationship"
  | "contact_identified"
  | "contacted"
  | "in_discussion"
  | "partner"
  | "inactive"
  | "archived";

/** @deprecated Use RelationshipStatus. Kept for compatibility with legacy code. */
export type PartnershipStatus = RelationshipStatus;

export type OfferStatus = "potential" | "verifying" | "active" | "closed" | "expired";

export type ContactStatus = "active" | "inactive" | "archived";

export type RecordSource =
  | "research"
  | "pipeline_import"
  | "partner_import"
  | "web_catalog"
  | "manual";

/** CSCA / entrance exam policy for a university. */
export type CscaRequirement = "required" | "not_required" | "optional" | "unknown";

/** Whether the university accepts applicants under 18. */
export type Under18Policy = "yes" | "no" | "case_by_case" | "unknown";

export const CSCA_REQUIREMENT_OPTIONS: { value: CscaRequirement; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "required", label: "CSCA required" },
  { value: "not_required", label: "CSCA not required" },
  { value: "optional", label: "CSCA optional" },
];

export const UNDER_18_OPTIONS: { value: Under18Policy; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "yes", label: "Accepts under 18" },
  { value: "no", label: "Does not accept under 18" },
  { value: "case_by_case", label: "Case by case" },
];

export interface OpsUniversity {
  id: string;
  name: string;
  chinese_name: string | null;
  short_name: string | null;
  slug: string | null;
  city: string | null;
  province: string | null;
  country: string;
  university_type: string | null;
  website: string | null;
  logo_url: string | null;
  public_visibility: boolean;
  record_source: RecordSource;
  public_catalog_slug: string | null;
  ranking_notes: string | null;
  description: string | null;
  internal_notes: string | null;
  /** Operational status: research → verifying → active → closed → archived. */
  status: OperationalStatus;
  csca_required?: CscaRequirement;
  accepts_under_18?: Under18Policy;
  requirements_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpsPartnership {
  id: string;
  university_id: string;
  /** @deprecated Legacy mixed-status field. Prefer relationship_status. */
  status?: RelationshipStatus;
  /** Relationship status: no_relationship → contact_identified → contacted → in_discussion → partner. */
  relationship_status: RelationshipStatus;
  works_with_agencies: boolean | null;
  has_agreement: boolean;
  commission_notes: string | null;
  recruitment_notes: string | null;
  owner_staff_id: string | null;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpsProgram {
  id: string;
  university_id: string;
  name: string;
  degree_type: string | null;
  teaching_language: string | null;
  major_category: string | null;
  duration: string | null;
  tuition_guide: number | null;
  accommodation_guide: number | null;
  application_fee: number | null;
  currency: string | null;
  language_requirements: string | null;
  academic_requirements: string | null;
  other_requirements: string | null;
  info_source: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpsOffer {
  id: string;
  program_id: string;
  university_id: string;
  intake: string;
  academic_year: string | null;
  tuition: number | null;
  currency: string | null;
  scholarship_type: string | null;
  scholarship_notes: string | null;
  deadline: string | null;
  application_method: string | null;
  availability_notes: string | null;
  status: OfferStatus;
  info_source: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpsContact {
  id: string;
  university_id: string;
  name: string;
  position: string | null;
  department: string | null;
  email: string | null;
  wechat: string | null;
  phone: string | null;
  contact_type: string | null;
  status: ContactStatus;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Immutable copy of what the student applied for at link time.
 * Must remain understandable even if the live offer/program later changes.
 */
export interface OfferSnapshot {
  offer_id: string;
  university_id: string;
  university_name: string;
  university_city: string | null;
  university_province: string | null;
  university_country: string | null;
  program_id: string;
  program_name: string;
  degree_type: string | null;
  teaching_language: string | null;
  major_category: string | null;
  duration: string | null;
  language_requirements: string | null;
  academic_requirements: string | null;
  other_requirements: string | null;
  intake: string;
  academic_year: string | null;
  tuition: number | null;
  currency: string | null;
  scholarship_type: string | null;
  scholarship_notes: string | null;
  deadline: string | null;
  application_method: string | null;
  availability_notes: string | null;
  offer_status: OfferStatus;
  info_source: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  verification_notes: string | null;
  snapshotted_at: string;
}

export type RichOffer = OpsOffer & {
  university: OpsUniversity | null;
  program: OpsProgram | null;
};

export type RichUniversity = OpsUniversity & {
  partnership: OpsPartnership | null;
};

export interface OpsDashboardStats {
  offersNeedingVerification: number;
  offersExpiringSoon: number;
  activeOffers: number;
  universitiesInResearch: number;
  totalUniversities: number;
  totalPrograms: number;
}

export interface OpsActivityItem {
  id: string;
  type: "university" | "offer" | "partnership" | "program";
  title: string;
  meta?: string;
  at: string;
}

export type RichProgram = OpsProgram & {
  university: OpsUniversity | null;
};

export const OPERATIONAL_STATUSES: OperationalStatus[] = [
  "research",
  "verifying",
  "active",
  "closed",
  "archived",
];

export const RELATIONSHIP_STATUSES: RelationshipStatus[] = [
  "no_relationship",
  "contact_identified",
  "contacted",
  "in_discussion",
  "partner",
  "inactive",
  "archived",
];

/** @deprecated Use RELATIONSHIP_STATUSES. */
export const PARTNERSHIP_STATUSES: RelationshipStatus[] = RELATIONSHIP_STATUSES;

export const OFFER_STATUSES: OfferStatus[] = [
  "potential",
  "verifying",
  "active",
  "closed",
  "expired",
];

export const OPERATIONAL_LABELS: Record<OperationalStatus, string> = {
  research: "Research",
  verifying: "Verifying",
  active: "Active",
  closed: "Closed",
  archived: "Archived",
};

export const RELATIONSHIP_LABELS: Record<RelationshipStatus, string> = {
  no_relationship: "No relationship",
  contact_identified: "Contact identified",
  contacted: "Contacted",
  in_discussion: "In discussion",
  partner: "Partner",
  inactive: "Inactive",
  archived: "Archived",
};

/** @deprecated Use RELATIONSHIP_LABELS. */
export const PARTNERSHIP_LABELS: Record<RelationshipStatus, string> = RELATIONSHIP_LABELS;

export const OFFER_LABELS: Record<OfferStatus, string> = {
  potential: "Potential",
  verifying: "Verifying",
  active: "Active",
  closed: "Closed",
  expired: "Expired",
};

export const SCHOLARSHIP_TYPE_OPTIONS = [
  { value: "", label: "None" },
  { value: "50% tuition", label: "50% tuition" },
  { value: "100% / full", label: "100% / full scholarship" },
  { value: "Partial (other)", label: "Partial (other)" },
  { value: "University scholarship", label: "University scholarship" },
  { value: "CSC", label: "CSC (Chinese Government)" },
  { value: "Other", label: "Other" },
] as const;

export const PROGRAM_DEGREE_TYPES = [
  "Chinese Language",
  "Foundation Program",
  "Bachelor",
  "Master",
  "PhD",
] as const;

export type ProgramDegreeType = (typeof PROGRAM_DEGREE_TYPES)[number];

export const PROGRAM_TEACHING_LANGUAGES = ["Chinese", "English"] as const;

export type ProgramTeachingLanguage = (typeof PROGRAM_TEACHING_LANGUAGES)[number];

export const PROGRAM_DURATION_PRESETS = [
  "1 year",
  "2 years",
  "3 years",
  "4 years",
  "5 years",
] as const;

export type ProgramDurationPreset = (typeof PROGRAM_DURATION_PRESETS)[number];

export function resolveProgramDuration(
  preset: string,
  custom: string,
): string | null {
  if (preset === "__custom__") return custom.trim() || null;
  if (!preset || preset === "__none__") return null;
  return preset;
}

export function programDurationToForm(duration: string | null | undefined): {
  preset: string;
  custom: string;
} {
  const value = duration?.trim() ?? "";
  if (!value) return { preset: "__none__", custom: "" };
  if ((PROGRAM_DURATION_PRESETS as readonly string[]).includes(value)) {
    return { preset: value, custom: "" };
  }
  return { preset: "__custom__", custom: value };
}

export function programMajorCategory(degreeType: string): string {
  if (degreeType === "Chinese Language") return "Chinese Language";
  if (degreeType === "Foundation Program") return "Foundation";
  return degreeType;
}

/** Returns true if the offer is safe to use for student matching. */
export function isOfferActive(offer: Pick<OpsOffer, "status" | "last_verified_at">): boolean {
  return offer.status === "active" && offer.last_verified_at != null;
}

/** Returns true if the offer is visible to staff for verification work. */
export function isOfferVerifiable(offer: Pick<OpsOffer, "status">): boolean {
  return offer.status === "potential" || offer.status === "verifying";
}
