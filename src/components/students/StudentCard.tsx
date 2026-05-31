import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import type { StudentProfile } from "@/types";
import { DEGREE_LABELS, formatGpa, getInitials, studentDisplayName } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StudentCardProps {
  student: StudentProfile;
  interested?: boolean;
  onInterested?: () => void;
  interestedLoading?: boolean;
}

export function StudentCard({
  student,
  interested = false,
  onInterested,
  interestedLoading = false,
}: StudentCardProps) {
  const name = studentDisplayName(student);
  const degreeLabel = student.degree_level
    ? DEGREE_LABELS[student.degree_level] ?? student.degree_level
    : "—";

  return (
    <article
      className={cn(
        "group animate-fade-in rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 border border-border/60">
          {student.photo_url ? <AvatarImage src={student.photo_url} alt={name} /> : null}
          <AvatarFallback className="bg-brand-light text-brand-dark text-sm font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="truncate text-base font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground">
                {student.nationality ?? "Nationality unavailable"}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {degreeLabel}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">GPA</p>
              <p className="font-medium text-foreground">{formatGpa(student.gpa)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Intake</p>
              <p className="font-medium text-foreground">{student.intake_semester ?? "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Major</p>
              <p className="truncate font-medium text-foreground">
                {student.desired_major ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/uni/students/${student.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Profile
          </Link>
        </Button>
        <Button
          className={cn(
            "flex-1",
            interested ? "bg-secondary text-foreground hover:bg-secondary" : "bg-brand hover:bg-brand-dark",
          )}
          disabled={interested || interestedLoading}
          onClick={onInterested}
        >
          <Heart className={cn("mr-2 h-4 w-4", interested && "fill-current text-brand")} />
          {interested ? "Interested" : interestedLoading ? "Saving..." : "Interested"}
        </Button>
      </div>
    </article>
  );
}
