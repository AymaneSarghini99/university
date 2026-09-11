import { Building2, Camera } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { opsUniversityLogoCandidates } from "@/lib/opsUniversityLogo";
import { resolveCatalogLogoUrl } from "@/lib/libraryLogos";
import { cn } from "@/lib/utils";

export function UniversityLogo({
  slug,
  logoUrl,
  name,
  className,
  imgClassName,
  editable = false,
  onEdit,
}: {
  slug?: string | null;
  logoUrl?: string | null;
  name: string;
  className?: string;
  imgClassName?: string;
  /** When true, show hover overlay and call onEdit on click */
  editable?: boolean;
  onEdit?: () => void;
}) {
  const candidates = useMemo(() => {
    if (name) {
      return opsUniversityLogoCandidates({
        name,
        slug: slug ?? null,
        public_catalog_slug: slug ?? null,
        logo_url: logoUrl ?? null,
      });
    }
    const primary = resolveCatalogLogoUrl(slug, logoUrl);
    return primary ? [primary] : [];
  }, [slug, logoUrl, name]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [logoUrl, slug, name]);

  const src = candidates[index] ?? null;
  const failed = index >= candidates.length;
  const showPlaceholder = !src || failed;
  const hasCustomLogo = Boolean(logoUrl?.trim());
  const label = hasCustomLogo || !showPlaceholder ? "Change logo" : "Add logo";

  const visual = showPlaceholder ? (
    <span
      className="flex h-full w-full items-center justify-center rounded-xl bg-brand/10 text-brand"
      aria-hidden
    >
      <Building2 className={cn("h-5 w-5", imgClassName)} />
    </span>
  ) : (
    <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white">
      <img
        src={src}
        alt=""
        className={cn("h-full w-full object-contain", imgClassName)}
        loading="lazy"
        onError={() => setIndex((i) => i + 1)}
      />
    </span>
  );

  if (editable && onEdit) {
    return (
      <button
        type="button"
        onClick={onEdit}
        title={label}
        aria-label={label}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          className,
        )}
      >
        {visual}
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Camera className="h-4 w-4" />
          <span className="px-1 text-[10px] font-medium leading-tight">{label}</span>
        </span>
      </button>
    );
  }

  return <div className={cn("shrink-0", className)}>{visual}</div>;
}
