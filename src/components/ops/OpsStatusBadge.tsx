import { cn } from "@/lib/utils";
import type { OfferStatus, OperationalStatus, RelationshipStatus } from "@/types/ops";
import {
  OFFER_LABELS,
  OPERATIONAL_LABELS,
  RELATIONSHIP_LABELS,
} from "@/types/ops";

const OFFER_TONES: Record<OfferStatus, string> = {
  potential: "bg-gray-50 text-gray-700 border-gray-200",
  verifying: "bg-amber-50 text-amber-800 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-50 text-slate-600 border-slate-200",
  expired: "bg-rose-50 text-rose-700 border-rose-200",
};

const OPERATIONAL_TONES: Record<OperationalStatus, string> = {
  research: "bg-gray-50 text-gray-700 border-gray-200",
  verifying: "bg-amber-50 text-amber-800 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-50 text-slate-600 border-slate-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
};

const RELATIONSHIP_TONES: Record<RelationshipStatus, string> = {
  no_relationship: "bg-gray-50 text-gray-700 border-gray-200",
  contact_identified: "bg-blue-50 text-blue-700 border-blue-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  in_discussion: "bg-amber-50 text-amber-800 border-amber-200",
  partner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-50 text-slate-600 border-slate-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
};

const BASE =
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function OfferStatusBadge({
  status,
  className,
}: {
  status: OfferStatus;
  className?: string;
}) {
  return (
    <span className={cn(BASE, OFFER_TONES[status], className)}>{OFFER_LABELS[status]}</span>
  );
}

export function OperationalStatusBadge({
  status,
  className,
}: {
  status: OperationalStatus;
  className?: string;
}) {
  return (
    <span className={cn(BASE, OPERATIONAL_TONES[status], className)}>
      {OPERATIONAL_LABELS[status]}
    </span>
  );
}

export function RelationshipStatusBadge({
  status,
  className,
}: {
  status: RelationshipStatus;
  className?: string;
}) {
  return (
    <span className={cn(BASE, RELATIONSHIP_TONES[status], className)}>
      {RELATIONSHIP_LABELS[status]}
    </span>
  );
}

/** @deprecated Use RelationshipStatusBadge. */
export function PartnershipStatusBadge({
  status,
  className,
}: {
  status: RelationshipStatus;
  className?: string;
}) {
  return <RelationshipStatusBadge status={status} className={className} />;
}

export function OpsStatusPill({
  label,
  tone = "neutral",
  className,
}: {
  label: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-gray-50 text-gray-700 border-gray-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return <span className={cn(BASE, tones[tone], className)}>{label}</span>;
}
