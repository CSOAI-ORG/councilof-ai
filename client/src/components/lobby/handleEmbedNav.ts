/**
 * Parent body of the `coai:embed-nav` listener.
 *
 * The protocol stays one-way: the child reports the path showing in the frame.
 * This module never remounts iframe.src. Unframeable paths leave OS; a native
 * or local tab drops the iframe; a route tab follows the rail; anything else
 * is an override chip.
 */
import { decideEmbedNav, isEmbedNav } from "@/lib/embed";
import type { LobbyTabId } from "./tabs";

const SITE_NAMES = /^(council of ai|csoai|councilof\.ai)$/i;

export function paneNameFor(title: unknown, path: string): string {
  const raw = typeof title === "string" ? title.split(/\s[|\u2014]\s/)[0].trim() : "";
  if (!raw || raw.length > 40 || SITE_NAMES.test(raw)) return path;
  return raw;
}

export type EmbedNavApply = {
  assignTop: (href: string) => void;
  setFrameSrc: (src: string) => void;
  setFramePath: (path: string) => void;
  setTabId: (id: LobbyTabId) => void;
  setOverride: (value: { path: string; label: string } | null) => void;
};

/** Listener body. Origin + envelope guards, then the four branches. */
export function handleEmbedNav(
  e: MessageEvent,
  apply: EmbedNavApply,
  expectedOrigin: string | null = typeof window !== "undefined" ? window.location.origin : null,
): void {
  if (expectedOrigin != null && e.origin !== expectedOrigin) return;
  if (!isEmbedNav(e.data)) return;
  const d = decideEmbedNav(e.data.path, e.data.search);
  if (d.action === "leave") {
    apply.assignTop(d.href);
    return;
  }
  if (d.action === "drop-iframe") {
    apply.setFrameSrc("");
    apply.setFramePath("");
    apply.setTabId(d.tabId);
    apply.setOverride(null);
    return;
  }
  if (d.action === "follow-route") {
    apply.setFramePath(d.path);
    apply.setTabId(d.tabId);
    apply.setOverride(null);
    return;
  }
  apply.setFramePath(d.path);
  apply.setOverride({ path: d.path, label: paneNameFor(e.data.title, d.path) });
}
