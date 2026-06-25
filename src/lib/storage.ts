import { supabase } from "@/lib/supabase";
import type { StudentDocuments, StudentProfile } from "@/types";

const SIGNED_URL_TTL_SECONDS = 3600;

export function storagePathFromDocumentUrl(urlOrPath: string): string {
  if (!urlOrPath.includes("://")) return urlOrPath;
  const marker = "/student-documents/";
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) return urlOrPath;
  return decodeURIComponent(urlOrPath.slice(idx + marker.length));
}

export async function getStudentDocumentSignedUrl(
  urlOrPath: string,
): Promise<string | null> {
  const path = storagePathFromDocumentUrl(urlOrPath);
  const { data, error } = await supabase.storage
    .from("student-documents")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.warn("[storage] signed URL failed", error?.message);
    return null;
  }
  return data.signedUrl;
}

async function resolveUrl(urlOrPath?: string | null): Promise<string | undefined> {
  if (!urlOrPath?.trim()) return undefined;
  if (urlOrPath.includes("://")) return urlOrPath;
  return (await getStudentDocumentSignedUrl(urlOrPath)) ?? urlOrPath;
}

export async function hydrateStudentProfile(
  profile: StudentProfile,
): Promise<StudentProfile> {
  const documents = profile.documents ?? {};
  const resolvedDocs: StudentDocuments = {};

  for (const key of ["passport", "transcript", "certificates"] as const) {
    if (documents[key]) {
      resolvedDocs[key] = await resolveUrl(documents[key]);
    }
  }

  return {
    ...profile,
    photo_url: await resolveUrl(profile.photo_url),
    documents: resolvedDocs,
  };
}

export async function hydrateStudentProfiles(
  profiles: StudentProfile[],
): Promise<StudentProfile[]> {
  return Promise.all(profiles.map((profile) => hydrateStudentProfile(profile)));
}
