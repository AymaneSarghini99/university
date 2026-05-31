import { FileText, ExternalLink } from "lucide-react";
import type { StudentDocuments } from "@/types";
import { Button } from "@/components/ui/button";

interface DocumentListProps {
  documents?: StudentDocuments | null;
}

const DOCUMENT_LABELS: Record<keyof StudentDocuments, string> = {
  passport: "Passport",
  transcript: "Transcript",
  certificates: "Certificates",
};

export function DocumentList({ documents }: DocumentListProps) {
  const entries = Object.entries(DOCUMENT_LABELS).map(([key, label]) => ({
    key: key as keyof StudentDocuments,
    label,
    url: documents?.[key as keyof StudentDocuments],
  }));

  return (
    <div className="space-y-3">
      {entries.map(({ key, label, url }) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">
                {url ? "Available" : "Not uploaded"}
              </p>
            </div>
          </div>
          {url ? (
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noreferrer">
                View
                <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ))}
    </div>
  );
}
