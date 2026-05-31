import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  expressInterest,
  fetchDashboardStats,
  fetchFilterOptions,
  fetchInterestedStudentIds,
  fetchInterestedStudents,
  fetchStudentById,
  fetchVisibleStudents,
  logProfileView,
} from "@/services/studentsService";
import type { StudentFilters } from "@/types";

export function useDashboardStats(universityId?: string) {
  return useQuery({
    queryKey: ["dashboard-stats", universityId],
    queryFn: () => fetchDashboardStats(universityId!),
    enabled: !!universityId,
  });
}

export function useStudents(filters: StudentFilters) {
  return useQuery({
    queryKey: ["students", filters],
    queryFn: () => fetchVisibleStudents(filters),
  });
}

export function useStudentFilters() {
  return useQuery({
    queryKey: ["student-filter-options"],
    queryFn: fetchFilterOptions,
  });
}

export function useStudent(id?: string) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => fetchStudentById(id!),
    enabled: !!id,
  });
}

export function useInterestedIds(universityId?: string) {
  return useQuery({
    queryKey: ["interested-ids", universityId],
    queryFn: () => fetchInterestedStudentIds(universityId!),
    enabled: !!universityId,
  });
}

export function useInterestedStudents(universityId?: string) {
  return useQuery({
    queryKey: ["interested-students", universityId],
    queryFn: () => fetchInterestedStudents(universityId!),
    enabled: !!universityId,
  });
}

export function useExpressInterest(universityId?: string, userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) =>
      expressInterest({
        universityId: universityId!,
        studentId,
        userId: userId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interested-ids", universityId] });
      queryClient.invalidateQueries({ queryKey: ["interested-students", universityId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats", universityId] });
    },
  });
}

export function useLogProfileView(universityId?: string) {
  return useMutation({
    mutationFn: (studentId: string) => logProfileView(universityId!, studentId),
  });
}
