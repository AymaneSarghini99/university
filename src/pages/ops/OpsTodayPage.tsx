import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchRecentActivity } from "@/services/opsService";
import { useAuthContext } from "@/context/AuthContext";
import {
  OpsActivityItem,
  OpsAttentionItem,
  OpsMetricCard,
} from "@/components/ops/OpsDashboard";
import { OpsLoading, OpsPanel, OpsPanelBody, OpsPanelHeader } from "@/components/ops/OpsLayout";
import { OpsPageHeader, OpsSection } from "@/components/ops/OpsPage";
import { CURRENT_ACADEMIC_YEAR, CURRENT_OPERATING_YEAR } from "@/lib/operatingCycle";

function greetingName(email?: string | null) {
  if (!email) return null;
  const local = email.split("@")[0] ?? "";
  const part = local.split(".")[0] ?? local;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

export default function OpsTodayPage() {
  const { user } = useAuthContext();
  const statsQ = useQuery({ queryKey: ["ops-dashboard"], queryFn: fetchDashboardStats });
  const activityQ = useQuery({ queryKey: ["ops-activity"], queryFn: fetchRecentActivity });

  if (statsQ.isLoading) return <OpsLoading />;

  if (statsQ.error) {
    return (
      <OpsPanel>
        <OpsPanelBody className="text-sm text-amber-900">
          Could not load stats. Run migration{" "}
          <code className="rounded bg-amber-50 px-1">053_university_ops.sql</code>.
        </OpsPanelBody>
      </OpsPanel>
    );
  }

  const stats = statsQ.data!;
  const name = greetingName(user?.email);

  return (
    <div className="space-y-8 animate-fade-in">
      <OpsPageHeader
        title="Today"
        eyebrow={
          name
            ? `Good morning, ${name} · ${CURRENT_OPERATING_YEAR}`
            : `Operating cycle ${CURRENT_OPERATING_YEAR}`
        }
        description={CURRENT_ACADEMIC_YEAR}
      />

      <OpsSection title="Needs attention">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <OpsAttentionItem
            count={stats.universitiesInResearch}
            label="Universities in research"
            to="/ops/universities?status=research"
            tone="neutral"
          />
          <OpsAttentionItem
            count={stats.offersNeedingVerification}
            label="Offers to verify"
            to="/ops/offers?status=verifying"
            tone="warning"
          />
          <OpsAttentionItem
            count={stats.offersExpiringSoon}
            label="Offers expiring"
            to="/ops/offers?status=active"
            tone="warning"
          />
        </div>
      </OpsSection>

      <OpsSection title="Overview">
        <div className="grid gap-3 sm:grid-cols-3">
          <OpsMetricCard label="Universities" value={stats.totalUniversities} to="/ops/universities" />
          <OpsMetricCard label="Programs" value={stats.totalPrograms} to="/ops/programs" />
          <OpsMetricCard label="Active Offers" value={stats.activeOffers} to="/ops/offers?status=active" />
        </div>
      </OpsSection>

      <OpsPanel>
        <OpsPanelHeader title="Recent activity" />
        <OpsPanelBody>
          {activityQ.isLoading ? (
            <p className="text-xs text-muted-foreground">Loading…</p>
          ) : (activityQ.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">No activity</p>
          ) : (
            <div>
              {(activityQ.data ?? []).map((item) => (
                <OpsActivityItem
                  key={item.id}
                  title={item.title}
                  meta={item.meta}
                  time={new Date(item.at).toLocaleDateString()}
                />
              ))}
            </div>
          )}
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
