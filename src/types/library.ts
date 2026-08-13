/** Read-only public university library entry (www catalog snapshot). */
export type LibraryUniversity = {
  slug: string;
  name: string;
  abbreviation: string | null;
  city: string | null;
  province: string | null;
  country: string;
  website: string | null;
  chinese_name: string | null;
  university_type: string | null;
  rank: number | null;
  description_short: string | null;
  logo_url: string | null;
};

export type LibrarySource = "public_catalog" | "pipeline" | "partner" | "ops";

export type LibrarySearchHit = {
  key: string;
  name: string;
  slug: string | null;
  city: string | null;
  province: string | null;
  country: string;
  chinese_name: string | null;
  website: string | null;
  abbreviation: string | null;
  university_type: string | null;
  logo_url: string | null;
  sources: LibrarySource[];
  opsUniversityId: string | null;
  pipelineUniversityId: string | null;
  partnerUniversityId: string | null;
  library: LibraryUniversity | null;
};

export function normalizeUniversityName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[’']/g, "")
    .replace(/\buniversity\b/g, "")
    .replace(/\bof\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
