import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { createBlankOpsUniversity } from "@/services/opsService";
import { addUniversityToOps, searchUniversityLibrary, UNIVERSITY_LIBRARY } from "@/services/libraryService";
import type { LibrarySearchHit } from "@/types/library";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddToOpsDialog, LibraryUniversityCard } from "@/components/ops/OpsCards";
import { OpsLoading, OpsPanel, OpsPanelBody } from "@/components/ops/OpsLayout";
import { OpsPagination } from "@/components/ops/OpsPagination";
import { OpsEmptyState, OpsPageHeader, OpsSearchInput } from "@/components/ops/OpsPage";
import { toast } from "@/hooks/use-toast";

export default function OpsLibraryPage() {
  const [params] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const [debounced, setDebounced] = useState(initialQ.trim());
  const [opsFilter, setOpsFilter] = useState<"all" | "in_ops" | "not_in_ops">("all");
  const [confirmHit, setConfirmHit] = useState<LibrarySearchHit | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 250);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [debounced, opsFilter, pageSize]);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ["ops-library-search", debounced],
    queryFn: () => searchUniversityLibrary(debounced),
  });

  const addMutation = useMutation({
    mutationFn: (hit: LibrarySearchHit) => addUniversityToOps(hit),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["ops-library-search"] });
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      setConfirmHit(null);
      toast({
        title: result.status === "existing" ? "Already added" : "Added",
      });
      navigate(`/ops/universities/${result.university.id}`);
    },
    onError: (e: Error) =>
      toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const manualMutation = useMutation({
    mutationFn: createBlankOpsUniversity,
    onSuccess: (uni) => {
      qc.invalidateQueries({ queryKey: ["ops-library-search"] });
      qc.invalidateQueries({ queryKey: ["ops-universities"] });
      qc.invalidateQueries({ queryKey: ["ops-dashboard"] });
      navigate(`/ops/universities/${uni.id}`);
    },
    onError: (e: Error) =>
      toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const hits = useMemo(() => {
    let list = data ?? [];
    if (opsFilter === "in_ops") list = list.filter((h) => h.opsUniversityId);
    if (opsFilter === "not_in_ops") list = list.filter((h) => !h.opsUniversityId);
    return list;
  }, [data, opsFilter]);

  const totalPages = Math.max(1, Math.ceil(hits.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedHits = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return hits.slice(start, start + pageSize);
  }, [hits, safePage, pageSize]);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addManual = () => manualMutation.mutate();

  return (
    <div className="space-y-6 animate-fade-in">
      <OpsPageHeader
        title="University Library"
        action={
          <Button variant="outline" disabled={manualMutation.isPending} onClick={addManual}>
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <OpsSearchInput value={query} onChange={setQuery} className="w-full lg:max-w-xl" />
        <Select value={opsFilter} onValueChange={(v) => setOpsFilter(v as typeof opsFilter)}>
          <SelectTrigger className="w-full rounded-xl lg:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All · {UNIVERSITY_LIBRARY.length}</SelectItem>
            <SelectItem value="in_ops">Added</SelectItem>
            <SelectItem value="not_in_ops">Not added</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <OpsPanel>
          <OpsPanelBody className="text-sm text-amber-900">
            Search failed.{" "}
            <button type="button" className="font-medium underline" onClick={() => refetch()}>
              Retry
            </button>
          </OpsPanelBody>
        </OpsPanel>
      ) : null}

      {isFetching ? (
        <OpsLoading />
      ) : hits.length === 0 ? (
        <OpsEmptyState
          title="No results"
          action={
            <Button variant="outline" disabled={manualMutation.isPending} onClick={addManual}>
              Add custom university
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedHits.map((hit) => (
              <LibraryUniversityCard
                key={hit.key}
                hit={hit}
                adding={addMutation.isPending && confirmHit?.key === hit.key}
                onAdd={() => setConfirmHit(hit)}
                onOpen={() => navigate(`/ops/universities/${hit.opsUniversityId}`)}
              />
            ))}
          </div>

          <OpsPagination
            page={safePage}
            pageSize={pageSize}
            totalItems={hits.length}
            onPageChange={goToPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      <AddToOpsDialog
        hit={confirmHit}
        open={Boolean(confirmHit)}
        onClose={() => setConfirmHit(null)}
        onConfirm={() => confirmHit && addMutation.mutate(confirmHit)}
        loading={addMutation.isPending}
      />
    </div>
  );
}
