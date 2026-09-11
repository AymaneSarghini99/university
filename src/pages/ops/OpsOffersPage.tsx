import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { fetchOffers, verifyOffer, deleteOffer } from "@/services/opsService";
import { OFFER_LABELS, OFFER_STATUSES, type OfferStatus } from "@/types/ops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OpsOfferCard } from "@/components/ops/OpsCards";
import { OpsLoading } from "@/components/ops/OpsLayout";
import { OpsEmptyState, OpsPageHeader, OpsSearchInput } from "@/components/ops/OpsPage";
import { VerifyOfferDialog } from "@/components/ops/VerifyOfferDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/context/AuthContext";
import { formatIntakeLabel, PINNED_INTAKES } from "@/lib/operatingCycle";
import { Trash2 } from "lucide-react";
import { OpsDialog } from "@/components/ops/OpsTabs";

export default function OpsOffersPage() {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const status = (params.get("status") as OfferStatus | "all") || "all";
  const [intake, setIntake] = useState("");
  const [maxTuition, setMaxTuition] = useState("");
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [verifyOfferId, setVerifyOfferId] = useState<string | null>(null);
  const [verifyOfferLabel, setVerifyOfferLabel] = useState("");
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);
  const [deleteOfferLabel, setDeleteOfferLabel] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops-offers-list", status, intake, maxTuition, scholarshipOnly, search],
    queryFn: () =>
      fetchOffers({
        status: status === "all" ? "all" : status,
        intake: intake || undefined,
        maxTuition: maxTuition ? Number(maxTuition) : undefined,
        scholarshipOnly,
        search,
      }),
  });

  const intakes = useMemo(() => {
    const set = new Set((data ?? []).map((o) => o.intake));
    return Array.from(set).sort();
  }, [data]);

  const verifyMutation = useMutation({
    mutationFn: (input: { offerId: string; infoSource: string; sourceUrl: string; verificationNotes: string }) =>
      verifyOffer(input.offerId, {
        infoSource: input.infoSource,
        sourceUrl: input.sourceUrl || null,
        verifiedBy: user?.id ?? null,
        verificationNotes: input.verificationNotes || null,
      }),
    onSuccess: () => {
      toast({ title: "Offer verified & active" });
      setVerifyOfferId(null);
      qc.invalidateQueries({ queryKey: ["ops-offers-list"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (offerId: string) => deleteOffer(offerId),
    onSuccess: () => {
      toast({ title: "Offer deleted" });
      setDeleteOfferId(null);
      qc.invalidateQueries({ queryKey: ["ops-offers-list"] });
      qc.invalidateQueries({ queryKey: ["ops-offers"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Could not delete offer", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <OpsPageHeader title="Offers" />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap">
        <OpsSearchInput value={search} onChange={setSearch} className="w-full lg:max-w-xs" />
        <Select
          value={status}
          onValueChange={(v) => {
            const next = new URLSearchParams(params);
            if (v === "all") next.delete("status");
            else next.set("status", v);
            setParams(next);
          }}
        >
          <SelectTrigger className="w-full rounded-xl lg:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {OFFER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {OFFER_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={intake || "all"} onValueChange={(v) => setIntake(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full rounded-xl lg:w-[140px]">
            <SelectValue placeholder="Intake" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All intakes</SelectItem>
            {PINNED_INTAKES.map((value) => (
              <SelectItem key={value} value={value}>
                {formatIntakeLabel(value)}
              </SelectItem>
            ))}
            {intakes
              .filter((i) => !(PINNED_INTAKES as readonly string[]).includes(i))
              .map((i) => (
                <SelectItem key={i} value={i}>
                  {formatIntakeLabel(i)}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Max ¥"
          value={maxTuition}
          onChange={(e) => setMaxTuition(e.target.value)}
          className="w-full rounded-xl lg:w-24"
        />
        <Button
          type="button"
          variant={scholarshipOnly ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-9 rounded-xl px-3.5 font-medium",
            scholarshipOnly && "shadow-sm shadow-brand/20",
          )}
          onClick={() => setScholarshipOnly((value) => !value)}
          aria-pressed={scholarshipOnly}
        >
          Scholarship
        </Button>
      </div>

      {error ? <p className="text-sm text-amber-800">Could not load.</p> : null}

      {isLoading ? (
        <OpsLoading />
      ) : (data ?? []).length === 0 ? (
        <OpsEmptyState
          title="No offers"
          action={
            <Button asChild variant="outline">
              <Link to="/ops/universities">Universities</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(data ?? []).map((o) => (
            <OpsOfferCard
              key={o.id}
              universityId={o.university_id}
              universityName={o.university?.name}
              programName={o.program?.name}
              intake={o.intake}
              status={o.status}
              tuition={o.tuition}
              currency={o.currency}
              scholarship={o.scholarship_type ?? undefined}
              scholarshipNotes={o.scholarship_notes ?? undefined}
              deadline={o.deadline ?? undefined}
              infoSource={o.info_source}
              lastVerifiedAt={o.last_verified_at}
              sourceUrl={o.source_url}
                  actions={
                    <>
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/ops/universities/${o.university_id}`}>View</Link>
                      </Button>
                      {o.status !== "active" || !o.last_verified_at ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setVerifyOfferId(o.id);
                            setVerifyOfferLabel(
                              `${o.university?.name ?? "University"} · ${o.program?.name ?? "Program"} · ${o.intake}`,
                            );
                          }}
                        >
                          Verify
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                        onClick={() => {
                          setDeleteOfferId(o.id);
                          setDeleteOfferLabel(
                            `${o.university?.name ?? "University"} · ${o.program?.name ?? "Program"} · ${o.intake}`,
                          );
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </>
                  }
            />
          ))}
        </div>
      )}

      <OpsDialog
        open={Boolean(deleteOfferId)}
        onClose={() => setDeleteOfferId(null)}
        title="Delete offer?"
        description={`Remove ${deleteOfferLabel}? Linked student snapshots are preserved.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOfferId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteOfferMutation.isPending}
              onClick={() => {
                if (deleteOfferId) deleteOfferMutation.mutate(deleteOfferId);
              }}
            >
              Delete
            </Button>
          </>
        }
      />

      <VerifyOfferDialog
        open={Boolean(verifyOfferId)}
        onClose={() => setVerifyOfferId(null)}
        offerLabel={verifyOfferLabel}
        loading={verifyMutation.isPending}
        onConfirm={(input) => {
          if (!verifyOfferId) return;
          verifyMutation.mutate({ offerId: verifyOfferId, ...input });
        }}
      />
    </div>
  );
}
