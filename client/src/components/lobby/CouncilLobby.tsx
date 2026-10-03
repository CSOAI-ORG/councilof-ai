import { useEffect } from "react";
import { useLocation } from "wouter";
import { useEmbedNavigation } from "@/lib/embed";
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
  const intent = useLobbyDeepLink();

  // Existing openLobby() CTAs now converge on the one dashboard instead of
  // spawning the retired overlay as a second application.
  useEffect(() => {
    if (!intent || dashboard) return;
    setLocation(hrefForIntent(intent));
  }, [dashboard, intent, setLocation]);

  // 27 Sep 2026 (ux-unify): the floating "Open workspace" pill is gone. It overlapped the
  // cookie banner and page content, and it duplicated "Council OS" in the one site header,
  // which every page now renders. This component keeps its two real jobs above: embed
  // navigation, and converging old openLobby() deep links on the dashboard.
  return null;
}
