import { supabase } from "@/lib/supabase";

export const OPS_UNIVERSITY_LOGOS_BUCKET = "ops-university-logos";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function extensionForMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export function validateLogoFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Use a PNG, JPEG, WebP, or GIF image.";
  }
  if (file.size > MAX_BYTES) {
    return "Logo must be 2 MB or smaller.";
  }
  return null;
}

/** Upload logo file and return a cache-busted public URL. */
export async function uploadOpsUniversityLogo(
  universityId: string,
  file: File,
): Promise<string> {
  const validationError = validateLogoFile(file);
  if (validationError) throw new Error(validationError);

  const ext = extensionForMime(file.type);
  const path = `${universityId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from(OPS_UNIVERSITY_LOGOS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (error) throw error;

  const { data } = supabase.storage.from(OPS_UNIVERSITY_LOGOS_BUCKET).getPublicUrl(path);
  const base = data.publicUrl;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${Date.now()}`;
}
