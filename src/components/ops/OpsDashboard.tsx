import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function OpsAttentionItem({
  count,
  label,
  to,
  tone = "neutral",
}: {
  count: number;
  label: string;
  to: string;
  tone?: "neutral" | "warning" | "danger" | "success" | "info";
}) {
  const tones = {
    neutral: "hover:border-black/[0.1]",
    warning: "border-amber-200/80 bg-amber-50/50 hover:border-amber-300",
    danger: "border-rose-200/80 bg-rose-50/40 hover:border-rose-300",
    success: "border-emerald-200/80 bg-emerald-50/40 hover:border-emerald-300",
    info: "border-blue-200/80 bg-blue-50/40 hover:border-blue-300",
  };

  if (count === 0) return null;

  return (
    <Link
      to={to}
      className={cn(
        "group flex items-center justify-between rounded-xl border border-black/[0.06] bg-white px-4 py-3.5 shadow-sm transition-all hover:shadow-card",
        tones[tone],
      )}
    >
      <div>
        <p className="text-2xl font-semibold tabular-nums text-foreground">{count}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
    </Link>
  );
}

export function OpsMetricCard({
  label,
  value,
  to,
}: {
  label: string;
  value: number | string;
  to?: string;
}) {
  const inner = (
    <div className="rounded-xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm transition hover:shadow-card">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function OpsActivityItem({
  title,
  meta,
  time,
}: {
  title: string;
  meta?: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-black/[0.04] py-3 last:border-0">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand/70" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{title}</p>
        {meta ? <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
      <time className="shrink-0 text-[11px] text-muted-foreground">{time}</time>
    </div>
  );
}
