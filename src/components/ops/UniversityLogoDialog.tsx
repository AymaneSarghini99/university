import { useEffect, useRef, useState } from "react";
import { ImagePlus, Link2, Trash2, Upload } from "lucide-react";
import { OpsDialog } from "@/components/ops/OpsTabs";
import { UniversityLogo } from "@/components/ops/UniversityLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  uploadOpsUniversityLogo,
  validateLogoFile,
} from "@/services/opsLogoUpload";

type UniversityLogoDialogProps = {
  open: boolean;
  onClose: () => void;
  universityId: string;
  universityName: string;
  slug?: string | null;
  logoUrl?: string | null;
  saving?: boolean;
  onSaveUrl: (logoUrl: string | null) => Promise<void>;
};

export function UniversityLogoDialog({
  open,
  onClose,
  universityId,
  universityName,
  slug,
  logoUrl,
  saving = false,
  onSaveUrl,
}: UniversityLogoDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlDraft, setUrlDraft] = useState(logoUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUrlDraft(logoUrl ?? "");
      setError(null);
      setBusy(false);
    }
  }, [open, logoUrl]);

  const disabled = busy || saving;

  const close = () => {
    setError(null);
    setUrlDraft(logoUrl ?? "");
    onClose();
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const validationError = validateLogoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const publicUrl = await uploadOpsUniversityLogo(universityId, file);
      await onSaveUrl(publicUrl);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSaveUrl = async () => {
    const trimmed = urlDraft.trim();
    if (!trimmed) {
      setError("Paste an image URL, or upload a file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSaveUrl(trimmed);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save URL");
    } finally {
      setBusy(false);
    }
  };

  const handleClear = async () => {
    setBusy(true);
    setError(null);
    try {
      await onSaveUrl(null);
      setUrlDraft("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not clear logo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <OpsDialog
      open={open}
      onClose={close}
      title="University logo"
      description="Upload an image or paste a public URL. Shown on this ops profile."
      footer={
        <>
          {logoUrl ? (
            <Button
              type="button"
              variant="outline"
              className="mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700"
              disabled={disabled}
              onClick={() => void handleClear()}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
          <Button type="button" variant="outline" disabled={disabled} onClick={close}>
            Cancel
          </Button>
          <Button type="button" disabled={disabled} onClick={() => void handleSaveUrl()}>
            <Link2 className="h-4 w-4" />
            Save URL
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <UniversityLogo
            slug={slug}
            logoUrl={logoUrl}
            name={universityName}
            className="h-20 w-20"
            imgClassName="h-14 w-14"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-file">Upload image</Label>
          <input
            ref={fileRef}
            id="logo-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            disabled={disabled}
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
          >
            {busy ? (
              <Upload className="h-4 w-4 animate-pulse" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            {busy ? "Uploading…" : "Choose file"}
          </Button>
          <p className="text-xs text-muted-foreground">PNG, JPEG, WebP, or GIF · max 2 MB</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo-url">Or paste image URL</Label>
          <Input
            id="logo-url"
            value={urlDraft}
            disabled={disabled}
            placeholder="https://…"
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleSaveUrl();
              }
            }}
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </OpsDialog>
  );
}
