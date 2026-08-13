import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBlockProps {
  valueLabel: string;
  value: string;
  infoSource?: string | null;
  lastVerifiedAt?: string | null;
  verifiedByLabel?: string | null;
  sourceUrl?: string | null;
  compact?: boolean;
  className?: string;
}

export function VerificationBlock({
  valueLabel,
  value,
  infoSource,
  lastVerifiedAt,
  verifiedByLabel,
  sourceUrl,
  compact = false,
  className,
}: VerificationBlockProps) {
  const verified = Boolean(lastVerifiedAt);

  return (
    <div
      className={cn(
        "rounded-xl border border-black/[0.06] bg-black/[0.015] px-4 py-3",
        compact && "px-3 py-2.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {valueLabel}
          </p>
          <p className={cn("mt-0.5 font-semibold text-foreground", compact ? "text-base" : "text-lg")}>
            {value}
          </p>
        </div>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </span>
        ) : (
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
            Unverified
          </span>
        )}
      </div>
      <dl className={cn("mt-3 grid gap-1.5 text-xs text-muted-foreground", compact ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
        <div>
          <dt className="inline font-medium text-foreground/60">Source: </dt>
          <dd className="inline">{infoSource || "—"}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground/60">Verified: </dt>
          <dd className="inline">
            {lastVerifiedAt
              ? `${new Date(lastVerifiedAt).toLocaleDateString()}${verifiedByLabel ? ` by ${verifiedByLabel}` : ""}`
              : "—"}
          </dd>
        </div>
        {sourceUrl ? (
          <div className="sm:col-span-2">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              Open source
            </a>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function formatIntake(intake: string): string {
  const map: Record<string, string> = {
    "2026-09": "September 2026",
    "2027-09": "September 2027",
    "2026-03": "March 2026",
    "2027-03": "March 2027",
  };
  return map[intake] ?? intake;
}

export function formatLocation(parts: (string | null | undefined)[]): string {
  const text = parts.filter(Boolean).join(" · ");
  return text || "Location TBD";
}
