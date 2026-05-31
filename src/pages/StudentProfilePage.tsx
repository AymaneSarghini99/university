import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
import { useUniAuth } from "@/context/UniAuthContext";
import {
  useExpressInterest,
  useInterestedIds,
  useLogProfileView,
  useStudent,
} from "@/hooks/useStudents";
import { DocumentList } from "@/components/students/DocumentList";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEGREE_LABELS, formatGpa, getInitials, studentDisplayName } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { account, user } = useUniAuth();
  const { data: student, isLoading, error } = useStudent(id);
  const { data: interestedIds = new Set<string>() } = useInterestedIds(account?.university_id);
  const expressInterest = useExpressInterest(account?.university_id, user?.id);
  const logView = useLogProfileView(account?.university_id);

  const interested = id ? interestedIds.has(id) : false;

  useEffect(() => {
    if (id && account?.university_id) {
      logView.mutate(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, account?.university_id]);

  const handleInterested = async () => {
    if (!id) return;

    try {
      const result = await expressInterest.mutateAsync(id);
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-56 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl border border-border/60 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold">Student not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This profile may no longer be available.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/uni/students">Back to students</Link>
        </Button>
      </div>
    );
  }

  const name = studentDisplayName(student);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Button asChild variant="ghost" className="px-0 text-muted-foreground hover:text-foreground">
        <Link to="/uni/students">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to students
        </Link>
      </Button>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <div className="border-b border-border/60 bg-gradient-to-r from-brand-light/80 to-white px-6 py-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-24 w-24 border-4 border-white shadow-sm">
                {student.photo_url ? <AvatarImage src={student.photo_url} alt={name} /> : null}
                <AvatarFallback className="bg-brand text-2xl font-semibold text-white">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">{name}</h1>
                <p className="mt-1 text-muted-foreground">{student.nationality ?? "—"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {student.degree_level
                      ? DEGREE_LABELS[student.degree_level] ?? student.degree_level
                      : "Degree unavailable"}
                  </Badge>
                  {student.intake_semester ? (
                    <Badge variant="outline">Intake {student.intake_semester}</Badge>
                  ) : null}
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-brand hover:bg-brand-dark"
              disabled={interested || expressInterest.isPending}
              onClick={handleInterested}
            >
              <Heart className={interested ? "mr-2 h-4 w-4 fill-current" : "mr-2 h-4 w-4"} />
              {interested ? "Interested" : expressInterest.isPending ? "Saving..." : "Interested"}
            </Button>
          </div>
        </div>

        <CardContent className="grid gap-6 p-6 md:grid-cols-2">
          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Academic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">GPA</p>
                <p className="font-medium">{formatGpa(student.gpa)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Desired Major</p>
                <p className="font-medium">{student.desired_major ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Degree Level</p>
                <p className="font-medium">
                  {student.degree_level
                    ? DEGREE_LABELS[student.degree_level] ?? student.degree_level
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Intake</p>
                <p className="font-medium">{student.intake_semester ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentList documents={student.documents} />
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
