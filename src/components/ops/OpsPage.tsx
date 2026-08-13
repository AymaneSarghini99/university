import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function OpsSearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border-black/[0.08] bg-white pl-9 shadow-sm"
      />
    </div>
  );
}

export function OpsPageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 animate-fade-in">
      <div>
        {eyebrow ? (
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-foreground md:text-[1.75rem]",
            eyebrow && "mt-1",
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function OpsInlineText({
  value,
  onSave,
  placeholder = "Type here…",
  emptyLabel = "—",
  saving = false,
  required = false,
  autoEdit = false,
  renderDisplay,
  className,
}: {
  value: string | null | undefined;
  onSave: (value: string | null) => Promise<void>;
  placeholder?: string;
  emptyLabel?: string;
  saving?: boolean;
  required?: boolean;
  autoEdit?: boolean;
  renderDisplay?: (value: string) => ReactNode;
  className?: string;
}) {
  const [editing, setEditing] = useState(autoEdit);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const autoEditApplied = useRef(false);

  useEffect(() => {
    if (!editing) setDraft(value ?? "");
  }, [value, editing]);

  useEffect(() => {
    if (autoEdit && !autoEditApplied.current) {
      autoEditApplied.current = true;
      setEditing(true);
    }
  }, [autoEdit]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = async () => {
    const trimmed = draft.trim();
    if (required && !trimmed) {
      setDraft(value ?? "");
      setEditing(false);
      return;
    }
    const next = trimmed || null;
    const current = value?.trim() || null;
    setEditing(false);
    if (next === current) return;
    await onSave(next);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        disabled={saving}
        placeholder={placeholder}
        className={cn("h-8 rounded-lg text-sm", className)}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => void commit()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void commit();
          }
          if (event.key === "Escape") {
            setDraft(value ?? "");
            setEditing(false);
          }
        }}
      />
    );
  }

  const display = value?.trim();

  return (
    <div
      role="button"
      tabIndex={0}
      title="Click to edit"
      onClick={() => setEditing(true)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setEditing(true);
        }
      }}
      className={cn(
        "cursor-text rounded-md px-1 -mx-1 text-left text-sm transition-colors hover:bg-black/[0.04]",
        !display && "text-muted-foreground",
        className,
      )}
    >
      {display ? (renderDisplay ? renderDisplay(display) : display) : emptyLabel}
    </div>
  );
}

export function OpsEmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.08] bg-white/60 px-6 py-10 text-center">
      {Icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-md text-xs text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function OpsSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
