import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MajorNameInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Names already used for this degree type at any university (shown first). */
  usedNames: string[];
  /** Official names for this degree type. */
  officialNames: string[];
  placeholder?: string;
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Program name box with suggestions: pick an existing/official major, or type a new one. */
export function MajorNameInput({ value, onChange, usedNames, officialNames, placeholder }: MajorNameInputProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout>>();

  const options = useMemo(() => {
    const q = norm(value);
    const seen = new Set<string>();
    const rows: { name: string; group: "used" | "official" }[] = [];
    const add = (name: string, group: "used" | "official") => {
      const key = norm(name);
      if (!key || seen.has(key)) return;
      if (q && !key.includes(q)) return;
      seen.add(key);
      rows.push({ name, group });
    };
    usedNames.forEach((n) => add(n, "used"));
    officialNames.forEach((n) => add(n, "official"));
    return rows.slice(0, 40);
  }, [value, usedNames, officialNames]);

  const exactMatch = options.some((o) => norm(o.name) === norm(value));
  const showNew = value.trim().length > 0 && !exactMatch;

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder={placeholder}
        className="rounded-xl"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, options.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && options[active]) {
            e.preventDefault();
            choose(options[active].name);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && (options.length > 0 || showNew) && (
        <div
          className="absolute left-0 right-0 top-full z-[120] mt-1 max-h-64 overflow-y-auto rounded-xl border bg-popover p-1 text-sm shadow-lg"
          onMouseDown={(e) => {
            // keep focus so the click lands
            e.preventDefault();
            clearTimeout(blurTimer.current);
          }}
        >
          {options.map((o, i) => {
            const firstOfGroup = i === 0 || options[i - 1].group !== o.group;
            return (
              <div key={`${o.group}-${o.name}`}>
                {firstOfGroup && (
                  <p className="px-2 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {o.group === "used" ? "Already used at your universities" : "Official major names"}
                  </p>
                )}
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-lg px-2 py-1.5 text-left hover:bg-muted",
                    i === active && "bg-muted",
                  )}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o.name)}
                >
                  {o.name}
                </button>
              </div>
            );
          })}
          {showNew && (
            <button
              type="button"
              className="mt-1 flex w-full items-center gap-1.5 rounded-lg border-t px-2 py-2 text-left text-muted-foreground hover:bg-muted"
              onClick={() => choose(value.trim())}
            >
              <Plus className="h-3.5 w-3.5" />
              Use “{value.trim()}” as a new name
            </button>
          )}
        </div>
      )}
    </div>
  );
}
