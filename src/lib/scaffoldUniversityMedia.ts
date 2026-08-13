/** Dev-only: scaffold public/source media folders via Vite middleware. No-op in production. */
export async function scaffoldUniversityMedia(
  name: string,
  slug: string | null | undefined,
): Promise<void> {
  if (!import.meta.env.DEV || !slug?.trim() || !name?.trim()) return;

  try {
    await fetch("/__dev/scaffold-university-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
    });
  } catch {
    // Local dev helper — ignore when dev server is unavailable
  }
}
