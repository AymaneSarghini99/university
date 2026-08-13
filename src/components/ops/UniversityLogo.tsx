import { Building2 } from "lucide-react";
import { useState } from "react";
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
  const src = resolveCatalogLogoUrl(slug, logoUrl);
  const [failed, setFailed] = useState(false);

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
        onError={() => setFailed(true)}
      />
    </div>
  );
}
