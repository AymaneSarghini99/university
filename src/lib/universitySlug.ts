/** Stable slug for deduplication and media folder paths. Match apps/web/src/lib/universities/slug.ts */
export function universitySlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/['']/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
