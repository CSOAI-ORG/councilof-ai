/**
 * OpenRouter-style product tabs — the SaaS chrome.
 *
 * Flat, keyboard-first. Chat / Models / Rankings / Apps open Council OS panes.
 * The old mega-menu (Workspace, Software, Measure, Agents, Surfaces) lives in
 * the bottom estate bar so no page is dropped.
 */
import type { LobbyTabId } from "@/components/lobby/tabs";
import type { LobbyTaskId } from "@/lib/lobbyLink";

export type ProductTab = {
  id: string;
  label: string;
  href: string;
  /** Opens Council OS instead of a full navigation. */
  lobby?: { pane: LobbyTabId; task?: LobbyTaskId };
  /** Highlight when path matches. */
  match?: (path: string) => boolean;
};

export const PRODUCT_TABS: ProductTab[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    match: (p) => p === "/",
  },
  {
    id: "models",
    label: "Models",
    href: "/models",
    lobby: { pane: "models" },
    match: (p) => p.startsWith("/models"),
  },
  {
    id: "benchmarks",
    label: "Benchmarks",
    href: "/arena-harness",
    lobby: { pane: "arena", task: "arena" },
    match: (p) => p.startsWith("/arena") || p.startsWith("/gspc-arena") || p.startsWith("/benchmarks"),
  },
  {
    id: "chat",
    label: "Chat",
    href: "/?lobby=home",
    lobby: { pane: "home" },
    match: () => false,
  },
  {
    id: "rankings",
    label: "Rankings",
    href: "/gspc-scoreboard",
    lobby: { pane: "board", task: "read-the-board" },
    match: (p) => p.startsWith("/gspc-scoreboard") || p.startsWith("/gspc-board"),
  },
  {
    id: "apps",
    label: "Apps",
    href: "/instruments",
    lobby: { pane: "tools" },
    match: (p) => p.startsWith("/instruments") || p.startsWith("/mcp"),
  },
  {
    id: "enterprise",
    label: "Enterprise",
    href: "/enterprise",
    match: (p) => p.startsWith("/enterprise"),
  },
  {
    id: "train",
    label: "Train",
    href: "/live-training",
    match: (p) => p.startsWith("/live-training") || p.startsWith("/academy") || p.startsWith("/training"),
  },
  {
    id: "east-west",
    label: "East-West",
    href: "/east-west",
    match: (p) => p.startsWith("/east-west") || p.startsWith("/challenge"),
  },
  {
    id: "indices",
    label: "Indices",
    href: "/indices",
    match: (p) => p.startsWith("/indices"),
  },
  {
    id: "products",
    label: "Products",
    href: "/products",
    match: (p) => p.startsWith("/products") || p.startsWith("/powered-by") || p.startsWith("/payg"),
  },
  {
    id: "docs",
    label: "Docs",
    href: "/api-docs",
    match: (p) => p.startsWith("/api-docs") || p.startsWith("/agent-runbook") || p.startsWith("/docs"),
  },
];
