import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UniversityLogo } from "@/components/ops/UniversityLogo";
import { OpsDialog } from "@/components/ops/OpsTabs";
import { OfferStatusBadge, OpsStatusPill } from "@/components/ops/OpsStatusBadge";
import { VerificationBlock, formatIntake, formatLocation } from "@/components/ops/VerificationBlock";
import type { OfferStatus } from "@/types/ops";
import type { LibrarySearchHit } from "@/types/library";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string, string> = {
  public_catalog: "Catalog",
  pipeline: "Pipeline",
  partner: "Partner",
  ops: "Ops",
};

export function AddToOpsDialog({
  hit,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  hit: LibrarySearchHit | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}) {
  if (!hit) return null;

  return (
    <OpsDialog
      open={open}
      onClose={onClose}
      title="Add to Operations?"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Adding…" : "Add"}
          </Button>
        </>
      }
    />
  );
}

export function LibraryUniversityCard({
  hit,
  onAdd,
  onOpen,
  adding,
}: {
  hit: LibrarySearchHit;
  onAdd: () => void;
  onOpen: () => void;
  adding?: boolean;
}) {
  const inOps = Boolean(hit.opsUniversityId);

  return (
    <article
      className={cn(
        "group rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition-all hover:shadow-card",
        inOps && "border-brand/20 bg-brand/[0.02]",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <UniversityLogo
            slug={hit.slug}
            logoUrl={hit.logo_url}
            name={hit.name}
            className="h-12 w-12 shrink-0"
            imgClassName="h-8 w-8"
          />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{hit.name}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatLocation([hit.city, hit.province, hit.country || "China"])}
            </p>
            {hit.chinese_name ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{hit.chinese_name}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hit.sources.map((s) => (
                <OpsStatusPill
                  key={s}
                  label={SOURCE_LABELS[s] ?? s}
                  tone={s === "ops" ? "success" : "neutral"}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {inOps ? (
            <Button onClick={onOpen}>Open</Button>
          ) : (
            <Button onClick={onAdd} disabled={adding}>
              {adding ? "Adding…" : "Add"}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function OpsOfferCard({
  universityName,
  universityId,
  programName,
  intake,
  status,
  tuition,
  currency,
  scholarship,
  deadline,
  infoSource,
  lastVerifiedAt,
  sourceUrl,
  actions,
}: {
  universityName?: string;
  universityId?: string;
  programName?: string;
  intake: string;
  status: OfferStatus;
  tuition?: number | null;
  currency?: string | null;
  scholarship?: string | null;
  deadline?: string | null;
  infoSource?: string | null;
  lastVerifiedAt?: string | null;
  sourceUrl?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition hover:shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{formatIntake(intake)}</p>
          {universityId && universityName ? (
            <Link
              to={`/ops/universities/${universityId}`}
              className="mt-0.5 block text-base font-semibold text-foreground hover:text-brand"
            >
              {universityName}
            </Link>
          ) : null}
          <p className="mt-0.5 text-sm text-muted-foreground">{programName}</p>
        </div>
        <OfferStatusBadge status={status} />
      </div>

      <div className="mt-4">
        <VerificationBlock
          compact
          valueLabel="Tuition"
          value={
            tuition != null
              ? `¥${Number(tuition).toLocaleString()} ${currency ?? "CNY"}`
              : "TBD"
          }
          infoSource={infoSource}
          lastVerifiedAt={lastVerifiedAt}
          sourceUrl={sourceUrl}
        />
      </div>

      {(scholarship || deadline) && (
        <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          {scholarship ? (
            <div>
              <dt className="font-medium text-muted-foreground">Scholarship</dt>
              <dd className="mt-0.5 text-foreground">{scholarship}</dd>
            </div>
          ) : null}
          {deadline ? (
            <div>
              <dt className="font-medium text-muted-foreground">Deadline</dt>
              <dd className="mt-0.5 text-foreground">{deadline}</dd>
            </div>
          ) : null}
        </dl>
      )}

      {actions ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.04] pt-4">{actions}</div>
      ) : null}
    </article>
  );
}

export function OpsProgramCard({
  name,
  degreeType,
  language,
  duration,
  intakeHint,
  to,
}: {
  name: string;
  degreeType?: string | null;
  language?: string | null;
  duration?: string | null;
  intakeHint?: string | null;
  to?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:shadow-card">
      <p className="font-medium text-foreground">{name}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {[duration, intakeHint, degreeType, language].filter(Boolean).join(" · ") ||
          "Details pending"}
      </p>
      {to ? <p className="mt-3 text-xs font-medium text-brand">View</p> : null}
    </div>
  );

  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}
