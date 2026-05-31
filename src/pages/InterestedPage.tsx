import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useUniAuth } from "@/context/UniAuthContext";
import { useInterestedStudents } from "@/hooks/useStudents";
import { StudentCard } from "@/components/students/StudentCard";
import { StudentCardSkeleton } from "@/components/students/StudentCardSkeleton";
import type { StudentProfile } from "@/types";

export default function InterestedPage() {
  const { account } = useUniAuth();
  const { data: rows = [], isLoading, error } = useInterestedStudents(account?.university_id);

  const students = rows
    .map((row) => row.student as StudentProfile | null)
    .filter(Boolean) as StudentProfile[];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in">
      <section className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">Interested</h2>
        <p className="text-sm text-muted-foreground">
          Students your team has marked as interested. Sallam will follow up on next steps.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load interested students.
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <StudentCardSkeleton key={index} />
          ))}
        </div>
      ) : null}

      {!isLoading && students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
            <Heart className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No interested students yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Browse the student directory and mark profiles you want to pursue.
          </p>
          <Link
            to="/uni/students"
            className="mt-6 inline-flex text-sm font-medium text-brand hover:text-brand-dark"
          >
            Browse students
          </Link>
        </div>
      ) : null}

      {!isLoading && students.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} interested />
          ))}
        </div>
      ) : null}
    </div>
  );
}
