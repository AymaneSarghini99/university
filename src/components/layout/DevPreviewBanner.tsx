import { isLocalDevBypass } from "@/lib/dev-mode";

export function DevPreviewBanner() {
  if (!isLocalDevBypass()) return null;

  return (
    <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
      Local preview mode — login skipped, mock student data shown
    </div>
  );
}
