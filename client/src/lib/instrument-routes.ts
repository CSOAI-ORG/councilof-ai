import type { RouterEntry } from "@/data/eunomia-router";
import { openLobby } from "@/lib/lobbyLink";

export type InstrumentView = "overview" | "api" | "mcp" | "agui" | "playground";

export function routerPath(item: RouterEntry): string {
  return `/instruments/${item.layer}/${item.slug}`;
}
