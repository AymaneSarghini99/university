/**
 * University names with their official short name, e.g. "Chongqing University (CQU)".
 * The short name is skipped when the full name already contains it
 * ("Tongji University" + "Tongji" stays "Tongji University").
 */
export function universityDisplayName(name: string | null | undefined, shortName?: string | null): string {
  const full = (name ?? '').trim();
  const short = (shortName ?? '').trim();
  if (!full) return short;
  if (!short) return full;
  const words = full.toLowerCase().split(/[\s,()·\-–]+/);
  const s = short.toLowerCase();
  if (full.toLowerCase() === s || words.includes(s) || full.toLowerCase().includes(`(${s})`)) return full;
  return `${full} (${short})`;
}

/** True when the search text matches the full name, short name, Chinese name or city. */
export function universityMatches(
  query: string,
  u: { name?: string | null; short_name?: string | null; abbreviation?: string | null; chinese_name?: string | null; city?: string | null } | null | undefined,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (!u) return false;
  return [u.name, u.short_name, u.abbreviation, u.chinese_name, u.city].some((v) => (v ?? '').toLowerCase().includes(q));
}

/** Make search text safe inside a Supabase .or() filter (commas, brackets and quotes split filters). */
export function orFilterSafe(text: string): string {
  return text.replace(/[,()"\\]/g, '%');
}
