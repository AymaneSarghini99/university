import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { opsGlobalSearch, type OpsSearchResult } from "@/services/opsService";

export function OpsGlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<OpsSearchResult[]>([]);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setOpen(true);
        ref.current?.querySelector("input")?.focus();
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void opsGlobalSearch(q)
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
        <Input
          placeholder="Search..."
          className="h-10 rounded-xl border-black/[0.06] bg-black/[0.03] pl-10 pr-14 text-sm shadow-none transition-all placeholder:text-muted-foreground/60 focus:border-brand/20 focus:bg-white focus:ring-2 focus:ring-brand/10"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-lg border border-black/[0.06] bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
          ⌘K
        </kbd>
      </div>

      {open && query.trim() ? (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-black/[0.06] bg-white/95 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-xl animate-fade-in">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No results for "{query}"</p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {results.map((result) => (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-black/[0.03]"
                    onClick={() => {
                      navigate(result.href);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <div>
                      <p className="font-medium text-foreground">{result.title}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {result.type}
                        {result.subtitle ? ` · ${result.subtitle}` : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
