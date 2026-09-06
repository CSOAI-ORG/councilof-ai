import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { isEmbedded, useEmbedNavigation } from "@/lib/embed";
import { dashboardViewHref } from "@/lib/dashboardView";
import { useLobbyDeepLink, type LobbyIntent } from "@/lib/lobbyLink";

/** The global button is only a door into the canonical workspace. */
export function canonicalWorkspaceHref(pathname = "/"): string {
  const params = new URLSearchParams({ tab: "home" });
  if (pathname !== "/" && !pathname.startsWith("/dashboard"))
    params.set("ctx", pathname);
  return `/dashboard?${params.toString()}`;
}

function hrefForIntent(intent: LobbyIntent): string {
  if (intent.route) {
    const href = dashboardViewHref(
      intent.route,
      intent.task || "Published surface",
    );
    const [path, raw = ""] = href.split("?");
    const params = new URLSearchParams(raw);
    if (intent.prompt) params.set("ask", intent.prompt);
    if (intent.ctx) params.set("ctx", intent.ctx);
    if (intent.task) params.set("task", intent.task);
    return `${path}?${params.toString()}`;
  }
  const params = new URLSearchParams({ tab: intent.pane });
  if (intent.prompt) params.set("ask", intent.prompt);
  if (intent.ctx) params.set("ctx", intent.ctx);
  if (intent.task) params.set("task", intent.task);
  return `/dashboard?${params.toString()}`;
}

export default function CouncilLobby() {
  useEmbedNavigation();
  const [location, setLocation] = useLocation();
  const dashboard =
    location === "/dashboard" || location.startsWith("/dashboard/");
  const intent = useLobbyDeepLink(!dashboard);
  const embedded = isEmbedded();

  // Existing openLobby() CTAs now converge on the one dashboard instead of
  // spawning the retired overlay as a second application.
  useEffect(() => {
    if (!intent || dashboard) return;
    setLocation(hrefForIntent(intent));
  }, [dashboard, intent, setLocation]);

  if (embedded || dashboard) return null;

  return (
    <Link
      href={canonicalWorkspaceHref(location)}
      data-council-global-launcher=""
      aria-label="Open the Council of AI workspace"
      title="Open the Council of AI workspace"
      // Lifts above the cookie banner by the banner's OWN measured height
      // (CookieConsent publishes --cookie-banner-h). 0px when there is no banner.
      style={{ bottom: "calc(1.25rem + var(--cookie-banner-h, 0px))" }}
      className="fixed right-5 z-[70] inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#04624a] px-3.5 text-white shadow-lg ring-1 ring-emerald-300/30 transition hover:bg-[#034d3b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#04624a] focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <img src="/csoai-icon.svg" alt="" className="h-6 w-6 rounded-md" />
      <span className="hidden text-xs font-semibold sm:inline">
        Open workspace
      </span>
    </Link>
  );
}
