/**
 * embed — the Council Lobby iframe contract.
 *
 * The lobby frames live same-origin routes with `?embed=1`. That flag is now a
 * real contract: the framed app drops site chrome (header, footer, cookie
 * banner, the lobby badge itself) and keeps every same-origin navigation
 * inside the pane. The parent lobby listens for `coai:embed-nav` so the pane
 * rail can follow the reader without remounting the iframe.
 *
 * Protocol is one message: `{ type: "coai:embed-nav", path, search, title }`.
 * There is no `ready` or `theme` event. Unused listeners must not be invented.
 * `?embed=1` is also the partner spray hint on `/embed` (their origin, our glass).
 * It is not how OS frames `/` `/os` `/dashboard` — those are unframeable.
 *
 * `window.self !== window.top` is the fallback when a framed page drops the query.
 */
import { useEffect } from "react";
import { isSiteDoor, LOBBY_TABS, type LobbyTab } from "../components/lobby/tabs";
import { isUnframeable, withoutEmbed } from "./unframeable";

export const EMBED_PARAM = "embed";
export const EMBED_NAV_TYPE = "coai:embed-nav";

export type EmbedNavMessage = {
  type: typeof EMBED_NAV_TYPE;
  path: string;
  search: string;
  title: string;
};

export function isEmbedded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get(EMBED_PARAM) === "1") return true;
    return window.self !== window.top;
  } catch {
    // Cross-origin frame access threw — treat as embedded and stay quiet.
    return true;
  }
}

/** Path only, no query or hash. */
export function pathOnly(href: string): string {
  const cut = href.split("#")[0]?.split("?")[0] ?? href;
  if (!cut) return "/";
  return cut.startsWith("/") ? cut : cut;
}

/**
 * Append or keep `embed=1` on a same-app href. Hash-only, mailto, and
 * javascript URLs are left alone.
 */
export function withEmbed(href: string, base = "https://councilof.ai"): string {
  if (!href) return href;
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return href;
  }
  try {
    const url = new URL(href, base);
    const rel = url.pathname + url.search + url.hash;
    // Never stamp embed=1 onto unframeable chrome (OS mounts, DSH, demo) or
    // marketing site doors. A harness panel is minted as `/os?embed=1&lobby=board`
    // by osPanelHref(), not by this helper — stamping /os here nests OS in OS.
    if (isUnframeable(url.pathname) || isSiteDoor(url.pathname + url.search)) {
      return /^https?:\/\//i.test(href) ? url.toString() : rel;
    }
    url.searchParams.set(EMBED_PARAM, "1");
    if (/^https?:\/\//i.test(href)) return url.toString();
    return url.pathname + url.search + url.hash;
  } catch {
    return href;
  }
}

/** Longest matching lobby tab for a path, or null when the page is not a pane. */
export function tabForPath(path: string): LobbyTab | null {
  const clean = pathOnly(path);
  let best: LobbyTab | null = null;
  for (const tab of LOBBY_TABS) {
    if (!tab.path) continue;
    if (clean === tab.path || clean.startsWith(`${tab.path}/`)) {
      if (!best || tab.path.length > best.path.length) best = tab;
    }
  }
  return best;
}

export function isEmbedNav(data: unknown): data is EmbedNavMessage {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.type === EMBED_NAV_TYPE && typeof d.path === "string";
}

function currentNav(): EmbedNavMessage {
  return {
    type: EMBED_NAV_TYPE,
    path: window.location.pathname || "/",
    search: window.location.search || "",
    title: document.title || "",
  };
}

export function postEmbedNav(): void {
  if (typeof window === "undefined" || !isEmbedded()) return;
  // Unframeable paths break out; they must not become an override chip.
  if (isUnframeable(window.location.pathname)) return;
  try {
    window.parent.postMessage(currentNav(), window.location.origin);
  } catch {
    /* parent gone or origin mismatch — the pane still works */
  }
}

/** Leave the iframe as a top-level page, without `embed=1`. */
export function breakOutOfFrame(href: string): void {
  const dest = withoutEmbed(href, typeof window !== "undefined" ? window.location.origin : "https://councilof.ai");
  try {
    if (typeof window !== "undefined" && window.top && window.top !== window.self) {
      window.top.location.assign(dest);
      return;
    }
  } catch {
    /* cross-origin top — fall through */
  }
  if (typeof window !== "undefined") window.location.assign(dest);
}

export type EmbedNavDecision =
  | { action: "leave"; href: string }
  | { action: "follow-route"; tabId: LobbyTab["id"]; path: string }
  | { action: "drop-iframe"; tabId: LobbyTab["id"] }
  | { action: "override"; path: string };

/**
 * Parent treatment of a `coai:embed-nav` ping. Never remounts iframe.src.
 * Unframeable → leave OS. Route tab → follow the rail. Native/local → drop
 * the iframe and switch pane. Else override chip (Pricing inside Products).
 */
export function decideEmbedNav(path: string, search = ""): EmbedNavDecision {
  if (isUnframeable(path)) {
    const raw = `${path}${search || ""}`;
    return { action: "leave", href: withoutEmbed(raw) };
  }
  const matched = tabForPath(path);
  if (matched) {
    if (matched.kind === "native" || matched.kind === "local") {
      return { action: "drop-iframe", tabId: matched.id };
    }
    return { action: "follow-route", tabId: matched.id, path };
  }
  return { action: "override", path };
}

function isIgnorableHref(href: string): boolean {
  return (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  );
}

function sameOriginUrl(href: string): URL | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    return url;
  } catch {
    return null;
  }
}

/**
 * Keep the framed app inside the lobby pane: preserve `embed=1`, stop
 * `_top` / `_parent` / `_blank` from replacing the parent workspace, and
 * tell the lobby which path is showing.
 *
 * External origins are left alone (many refuse to be framed). Same-origin
 * pages — including raw `<a href>` that would otherwise full-load — stay here.
 */
export function useEmbedNavigation(): void {
  useEffect(() => {
    if (!isEmbedded()) return;

    // Chrome branches and DSH only work with their own nav. Break out before
    // stamping embed=1 or pinging the parent (a `/` ping must not become an override).
    if (isUnframeable(window.location.pathname)) {
      breakOutOfFrame(window.location.pathname + window.location.search + window.location.hash);
      return;
    }

    const url = new URL(window.location.href);
    if (url.searchParams.get(EMBED_PARAM) !== "1") {
      url.searchParams.set(EMBED_PARAM, "1");
      const next = url.pathname + url.search + url.hash;
      window.history.replaceState(window.history.state, "", next);
    }
    postEmbedNav();

    const origPush = window.history.pushState.bind(window.history);
    const origReplace = window.history.replaceState.bind(window.history);

    const keep = (urlLike: string | URL | null | undefined): string | URL | null | undefined => {
      if (urlLike == null || urlLike === "") return urlLike;
      const raw = typeof urlLike === "string" ? urlLike : urlLike.toString();
      if (isIgnorableHref(raw)) return urlLike;
      const parsed = sameOriginUrl(raw);
      if (!parsed) return urlLike;
      return withEmbed(parsed.pathname + parsed.search + parsed.hash, window.location.origin);
    };

    const orBreakOut = (urlLike: string | URL | null | undefined): boolean => {
      if (urlLike == null || urlLike === "") return false;
      const raw = typeof urlLike === "string" ? urlLike : urlLike.toString();
      if (isIgnorableHref(raw)) return false;
      const parsed = sameOriginUrl(raw);
      if (!parsed || !isUnframeable(parsed.pathname)) return false;
      breakOutOfFrame(parsed.pathname + parsed.search + parsed.hash);
      return true;
    };

    window.history.pushState = function pushState(state, title, urlLike) {
      if (orBreakOut(urlLike)) return;
      const ret = origPush(state, title, keep(urlLike) as string);
      postEmbedNav();
      return ret;
    };
    window.history.replaceState = function replaceState(state, title, urlLike) {
      if (orBreakOut(urlLike)) return;
      const ret = origReplace(state, title, keep(urlLike) as string);
      postEmbedNav();
      return ret;
    };

    const onPop = () => postEmbedNav();
    window.addEventListener("popstate", onPop);

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      const el = (e.target as Element | null)?.closest?.("a[href]");
      if (!(el instanceof HTMLAnchorElement)) return;
      if (el.hasAttribute("download")) return;
      const href = el.getAttribute("href") ?? "";
      if (isIgnorableHref(href)) return;

      let dest: URL;
      try {
        dest = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (dest.origin !== window.location.origin) {
        if (el.target === "_parent" || el.target === "_top") {
          e.preventDefault();
          window.open(dest.href, "_blank", "noopener,noreferrer");
        }
        return;
      }

      // Unframeable chrome and marketing site doors leave the iframe without embed=1.
      if (isUnframeable(dest.pathname) || isSiteDoor(dest.pathname + dest.search)) {
        e.preventDefault();
        breakOutOfFrame(dest.pathname + dest.search + dest.hash);
        return;
      }

      // Same-origin: never leave the iframe, even on _blank / modified-click.
      e.preventDefault();
      const next = withEmbed(dest.pathname + dest.search + dest.hash, window.location.origin);
      if (next === window.location.pathname + window.location.search + window.location.hash) {
        postEmbedNav();
        return;
      }
      window.history.pushState(window.history.state, "", next);
      window.dispatchEvent(new PopStateEvent("popstate"));
      postEmbedNav();
    };

    document.addEventListener("click", onClick, true);

    return () => {
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick, true);
    };
  }, []);
}
