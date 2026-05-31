import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { useUniAuth } from "@/context/UniAuthContext";
import {
  useExpressInterest,
  useInterestedIds,
  useStudentFilters,
  useStudents,
} from "@/hooks/useStudents";
import { StudentCard } from "@/components/students/StudentCard";
import { StudentCardSkeleton } from "@/components/students/StudentCardSkeleton";
import { StudentFiltersBar } from "@/components/students/StudentFiltersBar";
import type { StudentFilters } from "@/types";
import { toast } from "@/hooks/use-toast";

const DEFAULT_FILTERS: StudentFilters = {
  search: "",
  degree: "all",
  major: "all",
  intake: "all",
};

export default function StudentsPage() {
  const { account, user } = useUniAuth();
  const [filters, setFilters] = useState<StudentFilters>(DEFAULT_FILTERS);
  const { data: students = [], isLoading, error } = useStudents(filters);
  const { data: interestedIds = new Set<string>() } = useInterestedIds(account?.university_id);
  const { data: filterOptions } = useStudentFilters();
  const expressInterest = useExpressInterest(account?.university_id, user?.id);

  const majors = filterOptions?.majors ?? [];
  const intakes = filterOptions?.intakes ?? [];

  const emptyState = useMemo(
    () => !isLoading && !error && students.length === 0,
    [isLoading, error, students.length],
  );

  const handleInterested = async (studentId: string) => {
    try {
      const result = await expressInterest.mutateAsync(studentId);
      toast({
        title: result.alreadyInterested ? "Already marked" : "Interest saved",
        description: result.alreadyInterested
          ? "This student is already in your interested list."
          : "Sallam has been notified of your interest.",
      });
    } catch {
      toast({
        title: "Could not save interest",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Students</h2>
        <p className="text-sm text-muted-foreground">
          Browse approved student profiles and express interest in candidates that fit your programs.
        </p>
      </section>

      <StudentFiltersBar
        filters={filters}
        majors={majors}
        intakes={intakes}
        onChange={(next) => setFilters((current) => ({ ...current, ...next }))}
      />

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load students. Please refresh and try again.
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <StudentCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {emptyState ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No students match your filters</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or check back when new profiles are approved.
          </p>
        </div>
      ) : null}

      {!isLoading && students.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              interested={interestedIds.has(student.id)}
              interestedLoading={
                expressInterest.isPending && expressInterest.variables === student.id
              }
              onInterested={() => handleInterested(student.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
