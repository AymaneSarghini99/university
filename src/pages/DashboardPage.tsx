import { Link } from "react-router-dom";
import { ArrowRight, Heart, Sparkles, Users } from "lucide-react";
import { useUniAuth } from "@/context/UniAuthContext";
import { useDashboardStats } from "@/hooks/useStudents";
import { StatCardSkeleton } from "@/components/students/StudentCardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  const { account } = useUniAuth();
  const { data: stats, isLoading } = useDashboardStats(account?.university_id);

  const cards = [
    {
      label: "Total Students",
      value: stats?.totalStudents ?? 0,
      icon: Users,
      hint: "Approved profiles available to browse",
    },
    {
      label: "New Students",
      value: stats?.newStudents ?? 0,
      icon: Sparkles,
      hint: "Added in the last 7 days",
    },
    {
      label: "Interested",
      value: stats?.interestedStudents ?? 0,
      icon: Heart,
      hint: "Students your team marked as interested",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in">
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Welcome back, {account?.full_name?.split(" ")[0]}</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Discover your next cohort
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse approved student profiles, review their goals, and express interest in seconds.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, index) => <StatCardSkeleton key={index} />)
          : cards.map(({ label, value, icon: Icon, hint }) => (
              <Card key={label} className="border-border/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                        {value}
                      </p>
                    </div>
                    <div className="rounded-xl bg-brand-light p-2 text-brand">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">{hint}</p>
                </CardContent>
              </Card>
            ))}
      </section>

      <section className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Ready to browse students?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Open the student directory and mark profiles you want to pursue.
            </p>
          </div>
          <Button asChild className="bg-brand hover:bg-brand-dark">
            <Link to="/uni/students">
              Browse Students
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
