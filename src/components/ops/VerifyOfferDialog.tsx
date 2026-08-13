import { useState } from "react";
import { OpsDialog } from "@/components/ops/OpsTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type VerifyOfferDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (input: {
    infoSource: string;
    sourceUrl: string;
    verificationNotes: string;
  }) => void;
  loading?: boolean;
  offerLabel?: string;
};

export function VerifyOfferDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  offerLabel,
}: VerifyOfferDialogProps) {
  const [infoSource, setInfoSource] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");

  function handleClose() {
    setInfoSource("");
    setSourceUrl("");
    setVerificationNotes("");
    onClose();
  }

  function handleConfirm() {
    if (!infoSource.trim()) return;
    onConfirm({
      infoSource: infoSource.trim(),
      sourceUrl: sourceUrl.trim(),
      verificationNotes: verificationNotes.trim(),
    });
  }

  return (
    <OpsDialog
      open={open}
      onClose={handleClose}
      title="Verify & activate offer"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button disabled={!infoSource.trim() || loading} onClick={handleConfirm}>
            {loading ? "Saving…" : "Mark verified & active"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {offerLabel ? (
          <p className="text-sm text-muted-foreground">
            Confirming operational truth for: <span className="font-medium text-foreground">{offerLabel}</span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Active offers appear in student matching (docs + Match Students). Only mark active after checking an official source.
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Info source *</label>
          <Input
            placeholder="e.g. Official brochure, IO email, university PDF"
            value={infoSource}
            onChange={(e) => setInfoSource(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Source URL</label>
          <Input
            placeholder="https://…"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Verification notes</label>
          <Textarea
            placeholder="What was checked? Tuition confirmed? Deadline still valid?"
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            className="min-h-[80px] rounded-xl"
          />
        </div>
      </div>
    </OpsDialog>
  );
}
