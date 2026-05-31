import { supabase } from "@/lib/supabase";
import { isLocalDevBypass } from "@/lib/dev-mode";
import {
  mockDashboardStats,
  mockExpressInterest,
  mockFetchInterestedIds,
  mockFetchInterestedStudents,
  mockFetchStudentById,
  mockFetchStudents,
  mockFilterOptions,
  mockLogProfileView,
} from "@/lib/mock-data";
import type { DashboardStats, StudentFilters, StudentProfile } from "@/types";

const STUDENT_SELECT = "*";

export async function fetchVisibleStudents(filters: StudentFilters): Promise<StudentProfile[]> {
  if (isLocalDevBypass()) return mockFetchStudents(filters);

  let query = supabase
    .from("student_marketplace_profiles")
    .select(STUDENT_SELECT)
    .eq("is_visible", true)
    .order("created_at", { ascending: false });

  if (filters.degree !== "all") {
    query = query.eq("degree_level", filters.degree);
  }

  if (filters.intake !== "all") {
    query = query.eq("intake_semester", filters.intake);
  }

  const { data, error } = await query;
  if (error) throw error;

  let rows = (data ?? []) as StudentProfile[];

  if (filters.major !== "all") {
    rows = rows.filter((student) => student.desired_major === filters.major);
  }

  if (filters.search.trim()) {
    const q = filters.search.trim().toLowerCase();
    rows = rows.filter((student) => {
      const haystack = [
        student.full_name,
        student.nationality,
        student.desired_major,
        student.intake_semester,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return rows;
}

export async function fetchStudentById(id: string): Promise<StudentProfile | null> {
  if (isLocalDevBypass()) return mockFetchStudentById(id);

  const { data, error } = await supabase
    .from("student_marketplace_profiles")
    .select(STUDENT_SELECT)
    .eq("id", id)
    .eq("is_visible", true)
    .maybeSingle();

  if (error) throw error;
  return (data as StudentProfile | null) ?? null;
}

export async function fetchInterestedStudentIds(universityId: string): Promise<Set<string>> {
  if (isLocalDevBypass()) return mockFetchInterestedIds();

  const { data, error } = await supabase
    .from("university_shortlists")
    .select("student_id")
    .eq("university_id", universityId)
    .eq("status", "interested");

  if (error) throw error;
  return new Set((data ?? []).map((row) => row.student_id));
}

export async function fetchInterestedStudents(universityId: string) {
  if (isLocalDevBypass()) return mockFetchInterestedStudents();

  const { data, error } = await supabase
    .from("university_shortlists")
    .select(`id, status, created_at, updated_at, student:student_marketplace_profiles(${STUDENT_SELECT})`)
    .eq("university_id", universityId)
    .eq("status", "interested")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function expressInterest(params: {
  universityId: string;
  studentId: string;
  userId: string;
}) {
  if (isLocalDevBypass()) return mockExpressInterest(params.studentId);

  const { universityId, studentId, userId } = params;

  const { data: existing } = await supabase
    .from("university_shortlists")
    .select("id, status")
    .eq("university_id", universityId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing?.status === "interested") {
    return { alreadyInterested: true };
  }

  const payload = {
    university_id: universityId,
    student_id: studentId,
    status: "interested" as const,
    created_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("university_shortlists").update(payload).eq("id", existing.id)
    : await supabase.from("university_shortlists").insert(payload);

  if (error) throw error;

  await supabase.from("student_profile_views").insert({
    university_id: universityId,
    student_id: studentId,
  });

  return { alreadyInterested: false };
}

export async function fetchDashboardStats(universityId: string): Promise<DashboardStats> {
  if (isLocalDevBypass()) return mockDashboardStats();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const [studentsRes, newRes, interestedRes] = await Promise.all([
    supabase
      .from("student_marketplace_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_visible", true),
    supabase
      .from("student_marketplace_profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_visible", true)
      .gte("created_at", since),
    supabase
      .from("university_shortlists")
      .select("id", { count: "exact", head: true })
      .eq("university_id", universityId)
      .eq("status", "interested"),
  ]);

  if (studentsRes.error) throw studentsRes.error;
  if (newRes.error) throw newRes.error;
  if (interestedRes.error) throw interestedRes.error;

  return {
    totalStudents: studentsRes.count ?? 0,
    newStudents: newRes.count ?? 0,
    interestedStudents: interestedRes.count ?? 0,
  };
}

export async function fetchFilterOptions() {
  if (isLocalDevBypass()) return mockFilterOptions();

  const { data, error } = await supabase
    .from("student_marketplace_profiles")
    .select("desired_major, intake_semester")
    .eq("is_visible", true);

  if (error) throw error;

  const majors = Array.from(
    new Set((data ?? []).map((row) => row.desired_major).filter(Boolean)),
  ).sort() as string[];

  const intakes = Array.from(
    new Set((data ?? []).map((row) => row.intake_semester).filter(Boolean)),
  ).sort() as string[];

  return { majors, intakes };
}

export async function logProfileView(universityId: string, studentId: string) {
  if (isLocalDevBypass()) return mockLogProfileView();

  await supabase.from("student_profile_views").insert({
    university_id: universityId,
    student_id: studentId,
  });
}
