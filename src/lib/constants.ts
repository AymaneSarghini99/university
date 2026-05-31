export const DEGREE_LABELS: Record<string, string> = {
  bachelor: "Bachelor's",
  master: "Master's",
  language: "Language",
};

export const DEGREE_OPTIONS = [
  { value: "all", label: "All degrees" },
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "language", label: "Language" },
];

export function formatGpa(gpa?: number | null) {
  if (gpa == null) return "—";
  return Number(gpa).toFixed(2);
}

export function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function studentDisplayName(student: { full_name?: string | null }) {
  return student.full_name?.trim() || "Student";
}
