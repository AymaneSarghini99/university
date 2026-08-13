import { cn } from "@/lib/utils";

export function OpsLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      {label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
    </div>
  );
}

export function OpsSkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl border border-black/[0.06] bg-white p-5"
        >
          <div className="space-y-3">
            <div className="h-4 w-1/3 rounded-md bg-black/[0.06]" />
            <div className="h-3 w-1/2 rounded-md bg-black/[0.04]" />
            <div className="h-3 w-1/4 rounded-md bg-black/[0.04]" />
          </div>
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      ))}
    </div>
  );
}

export function OpsPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/[0.06] bg-white shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OpsPanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-black/[0.05] px-5 py-4",
        className,
      )}
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function OpsPanelBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
