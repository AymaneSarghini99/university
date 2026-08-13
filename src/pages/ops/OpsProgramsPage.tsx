import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchAllPrograms } from "@/services/opsService";
import { OpsStatusPill } from "@/components/ops/OpsStatusBadge";
import { OpsLoading } from "@/components/ops/OpsLayout";
import { OpsEmptyState, OpsPageHeader, OpsSearchInput } from "@/components/ops/OpsPage";
import { formatLocation } from "@/components/ops/VerificationBlock";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function cell(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

export default function OpsProgramsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["ops-programs-all", search],
    queryFn: () => fetchAllPrograms(search),
  });

  const rows = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => {
      const uniCompare = (a.university?.name ?? "").localeCompare(b.university?.name ?? "");
      if (uniCompare !== 0) return uniCompare;
      return a.name.localeCompare(b.name);
    });
  }, [data]);

  return (
    <div className="space-y-6 animate-fade-in">
      <OpsPageHeader title="Programs" />

      <OpsSearchInput value={search} onChange={setSearch} className="max-w-md" />

      {error ? <p className="text-sm text-amber-800">Could not load.</p> : null}

      {isLoading ? (
        <OpsLoading />
      ) : rows.length === 0 ? (
        <OpsEmptyState
          title="No programs"
          action={
            <Button asChild>
              <Link to="/ops/universities">Universities</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/[0.06] bg-black/[0.02] text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">University</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Degree</th>
                  <th className="px-4 py-3 font-medium">Language</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-black/[0.04] transition hover:bg-black/[0.015]"
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/ops/universities/${p.university_id}`}
                        className="font-medium hover:text-brand"
                      >
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/ops/universities/${p.university_id}`}
                        className="text-muted-foreground hover:text-brand"
                      >
                        {p.university?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {p.university
                        ? formatLocation([p.university.city, p.university.province, p.university.country])
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{cell(p.degree_type)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {cell(p.teaching_language)}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{cell(p.duration)}</td>
                    <td className="px-4 py-3.5">
                      <OpsStatusPill
                        label={p.active ? "Active" : "Inactive"}
                        tone={p.active ? "success" : "neutral"}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="ghost" size="sm" className="h-8" asChild>
                        <Link to={`/ops/universities/${p.university_id}`}>Open</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((p) => (
              <Link
                key={p.id}
                to={`/ops/universities/${p.university_id}`}
                className={cn(
                  "block rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm transition hover:shadow-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.university?.name ?? "—"}
                      {p.university
                        ? ` · ${formatLocation([p.university.city, p.university.province, p.university.country])}`
                        : null}
                    </p>
                  </div>
                  <OpsStatusPill
                    label={p.active ? "Active" : "Inactive"}
                    tone={p.active ? "success" : "neutral"}
                  />
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Degree</dt>
                    <dd className="mt-0.5 font-medium">{cell(p.degree_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Language</dt>
                    <dd className="mt-0.5 font-medium">{cell(p.teaching_language)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="mt-0.5 font-medium">{cell(p.duration)}</dd>
                  </div>
                </dl>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
