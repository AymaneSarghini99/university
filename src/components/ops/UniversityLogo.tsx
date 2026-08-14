import { Building2 } from "lucide-react";
import { useMemo, useState } from "react";
import { opsUniversityLogoCandidates } from "@/lib/opsUniversityLogo";
import { resolveCatalogLogoUrl } from "@/lib/libraryLogos";
import { cn } from "@/lib/utils";

export function UniversityLogo({
  slug,
  logoUrl,
  name,
  className,
  imgClassName,
}: {
  slug?: string | null;
  logoUrl?: string | null;
  name: string;
  className?: string;
  imgClassName?: string;
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
  const src = candidates[index] ?? null;
  const failed = index >= candidates.length;

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-brand/10 text-brand",
          className,
        )}
        aria-hidden
      >
        <Building2 className="h-5 w-5" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center overflow-hidden rounded-xl bg-white", className)}>
      <img
        src={src}
        alt=""
        className={cn("h-full w-full object-contain", imgClassName)}
        loading="lazy"
        onError={() => setIndex((i) => i + 1)}
      />
    </div>
  );
}
