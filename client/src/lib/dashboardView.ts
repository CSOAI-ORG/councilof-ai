import { isUnframeable } from "@/lib/unframeable";

const DASHBOARD_ORIGIN = "https://councilof.ai";

/**
 * Accept only a same-origin application route that is safe to show inside the
 * dashboard canvas. This keeps catalogue links useful without turning `view`
 * into an open redirect or allowing Council OS to frame itself recursively.
 */
export function normalizeDashboardView(
  value: string | null | undefined,
): string | null {
  const raw = value?.trim();
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;

  try {
    const url = new URL(raw, DASHBOARD_ORIGIN);
    if (url.origin !== DASHBOARD_ORIGIN || isUnframeable(url.pathname))
      return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function dashboardViewFromSearch(search: string): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  return normalizeDashboardView(params.get("view"));
}

export function dashboardViewLabel(search: string): string | null {
  const params = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  );
  const label = params.get("label")?.trim();
  return label ? label.slice(0, 120) : null;
}

export function dashboardViewHref(path: string, label?: string): string {
  const normalized = normalizeDashboardView(path);
  if (!normalized) return "/dashboard?tab=explore";
  const params = new URLSearchParams({ tab: "explore", view: normalized });
  if (label?.trim()) params.set("label", label.trim().slice(0, 120));
  return `/dashboard?${params.toString()}`;
}
