import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { createBlankOpsUniversity, fetchOpsUniversities, fetchOffers } from "@/services/opsService";
import {
  OPERATIONAL_LABELS,
  OPERATIONAL_STATUSES,
  RELATIONSHIP_LABELS,
  type OperationalStatus,
  type RelationshipStatus,
} from "@/types/ops";
import { Button } from "@/components/ui/button";
import {
  OperationalStatusBadge,
  RelationshipStatusBadge,
} from "@/components/ops/OpsStatusBadge";
import { OpsLoading } from "@/components/ops/OpsLayout";
import { OpsEmptyState, OpsPageHeader, OpsSearchInput } from "@/components/ops/OpsPage";
import { formatLocation } from "@/components/ops/VerificationBlock";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function OpsUniversitiesPage() {
  const [params, setParams] = useSearchParams();
  const operationalStatus = (params.get("status") as OperationalStatus | "all") || "all";
  const relationshipStatus = (params.get("relationship") as RelationshipStatus | "all") || "all";
  const followUpOnly = params.get("filter") === "follow_up";
  const [search, setSearch] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops-universities", operationalStatus, relationshipStatus, search],
    queryFn: () =>
      fetchOpsUniversities({
        operationalStatus: operationalStatus === "all" ? "all" : operationalStatus,
        relationshipStatus: relationshipStatus === "all" ? "all" : relationshipStatus,
        search,
      }),
  });

  const offersQ = useQuery({
    queryKey: ["ops-offers-counts"],
    queryFn: () => fetchOffers({ status: "active" }),
  });

  const activeOfferCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const o of offersQ.data ?? []) {
      map[o.university_id] = (map[o.university_id] ?? 0) + 1;
    }
    return map;
  }, [offersQ.data]);

  const createMutation = useMutation({
    mutationFn: createBlankOpsUniversity,
    onSuccess: (uni) => {
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      navigate(`/ops/universities/${uni.id}`);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const rows = useMemo(() => {
    let list = data ?? [];
    if (followUpOnly) {
      const now = Date.now();
      list = list.filter((u) => {
        const due = u.partnership?.next_follow_up_at;
        return due && new Date(due).getTime() <= now;
      });
    }
    return list;
  }, [data, followUpOnly]);

  const addUniversity = () => createMutation.mutate();

  return (
    <div className="space-y-6 animate-fade-in">
      <OpsPageHeader
        title="Universities"
        action={
          <Button disabled={createMutation.isPending} onClick={addUniversity}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <OpsSearchInput value={search} onChange={setSearch} className="w-full sm:max-w-xs" />
        <Select
          value={operationalStatus}
          onValueChange={(v) => {
            const next = new URLSearchParams(params);
            if (v === "all") next.delete("status");
            else next.set("status", v);
            setParams(next);
          }}
        >
          <SelectTrigger className="w-full rounded-xl sm:w-[200px]">
            <SelectValue placeholder="Operational status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All operational statuses</SelectItem>
            {OPERATIONAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {OPERATIONAL_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={relationshipStatus}
          onValueChange={(v) => {
            const next = new URLSearchParams(params);
            if (v === "all") next.delete("relationship");
            else next.set("relationship", v);
            setParams(next);
          }}
        >
          <SelectTrigger className="w-full rounded-xl sm:w-[200px]">
            <SelectValue placeholder="Relationship status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All relationship statuses</SelectItem>
            {Object.keys(RELATIONSHIP_LABELS).map((s) => (
              <SelectItem key={s} value={s}>
                {RELATIONSHIP_LABELS[s as RelationshipStatus]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <p className="text-sm text-amber-800">Could not load.</p>
      ) : null}

      {isLoading ? (
        <OpsLoading />
      ) : rows.length === 0 ? (
        <OpsEmptyState
          title="No universities"
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild>
                <Link to="/ops/library">Library</Link>
              </Button>
              <Button variant="outline" disabled={createMutation.isPending} onClick={addUniversity}>
                Add
              </Button>
            </div>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/[0.06] bg-black/[0.02] text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">University</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Operational</th>
                  <th className="px-4 py-3 font-medium">Relationship</th>
                  <th className="px-4 py-3 font-medium">Offers</th>
                  <th className="px-4 py-3 font-medium">Next action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const followUpDue =
                    u.partnership?.next_follow_up_at &&
                    new Date(u.partnership.next_follow_up_at).getTime() <= Date.now();
                  return (
                    <tr key={u.id} className="border-b border-black/[0.04] transition hover:bg-black/[0.015]">
                      <td className="px-4 py-3.5">
                        <Link to={`/ops/universities/${u.id}`} className="font-medium hover:text-brand">
                          {u.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {formatLocation([u.city, u.province, u.country])}
                      </td>
                      <td className="px-4 py-3.5">
                        <OperationalStatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {u.partnership ? (
                          <RelationshipStatusBadge status={u.partnership.relationship_status} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 tabular-nums">{activeOfferCounts[u.id] ?? 0}</td>
                      <td className="px-4 py-3.5">
                        {followUpDue ? (
                          <span className="text-xs font-medium text-rose-700">Due</span>
                        ) : u.partnership?.next_follow_up_at ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(u.partnership.next_follow_up_at).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {rows.map((u) => (
              <Link
                key={u.id}
                to={`/ops/universities/${u.id}`}
                className={cn(
                  "block rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:shadow-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatLocation([u.city, u.province, u.country])}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <OperationalStatusBadge status={u.status} />
                    {u.partnership ? (
                      <RelationshipStatusBadge status={u.partnership.relationship_status} />
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>{activeOfferCounts[u.id] ?? 0} offers</span>
                  {u.partnership?.next_follow_up_at ? (
                    <span>Next: {new Date(u.partnership.next_follow_up_at).toLocaleDateString()}</span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
