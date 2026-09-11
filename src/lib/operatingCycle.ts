/** Current Sallam operating cycle — keep in sync with apps/docs/src/lib/operatingCycle.ts */
export const CURRENT_OPERATING_YEAR = 2027;
export const CURRENT_PRIMARY_INTAKE = "2027-09";
export const CURRENT_ACADEMIC_YEAR = "2027-2028";

/** Pinned intakes for filters (primary first). Codes keep year; UI labels do not. */
export const PINNED_INTAKES = ["2027-09", "2027-03"] as const;

export function formatIntakeLabel(intake: string): string {
  const map: Record<string, string> = {
    "2027-09": "September",
    "2027-03": "March",
    "2026-09": "September 2026",
    "2026-03": "March 2026",
  };
  return map[intake] ?? intake;
}

export function sortByPreferredIntake<T extends { intake: string }>(
  items: T[],
  preferredIntake: string = CURRENT_PRIMARY_INTAKE,
): T[] {
  return [...items].sort((a, b) => {
    const aPref = a.intake === preferredIntake ? 0 : 1;
    const bPref = b.intake === preferredIntake ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    return b.intake.localeCompare(a.intake);
  });
}
