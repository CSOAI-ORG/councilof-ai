/**
 * councilOsNav — ONE master inner-nav contract for Council OS.
 *
 * Patterns borrowed (honestly):
 *   OpenRouter  — Models | Rankings | Routes | Playground tabs stay in one shell
 *   LMArena     — Compare / leaderboard / vote surfaces share one arena chrome
 *   Moody's SaaS — persistent product rail + context breadcrumb, page column beside dock
 *
 * Every item either opens a site route OR a Council OS pane via openLobby().
 */
import type { LobbyTabId } from "@/components/lobby/tabs";
import type { LobbyTaskId } from "@/lib/lobbyLink";

export type CouncilOsNavItem = {
  id: string;
  label: string;
  href: string;
  description?: string;
  pane?: LobbyTabId;
  task?: LobbyTaskId;
  external?: boolean;
};

export type CouncilOsNavSection = {
  id: string;
  label: string;
  items: CouncilOsNavItem[];
};

/** Primary product rail — visible on Intel, Enterprise, Workspace, Models, Instruments. */
export const COUNCIL_OS_PRIMARY: CouncilOsNavItem[] = [
  { id: "refinery", label: "Refinery", href: "/os", description: "Master ONE OS — dock + AG-UI + site column", pane: "home" },
  { id: "board", label: "Board", href: "/gspc-scoreboard", pane: "board", task: "read-the-board" },
  { id: "models", label: "Models", href: "/models", pane: "models" },
  { id: "routes", label: "Routes", href: "/instruments", pane: "routes", task: "eunomia-router" },
  { id: "arena", label: "Arena", href: "/gspc-arena?view=arena", pane: "arena", task: "arena" },
  { id: "ecosystem", label: "Ecosystem", href: "/intel", pane: "ecosystem" },
  { id: "workspace", label: "My systems", href: "/workspace", pane: "workspace", task: "enterprise-start" },
  { id: "fix", label: "Fix & train", href: "/remediation-partners", pane: "fix", task: "fix-gaps" },
];

/** Secondary — measurement + evidence (Moody's-style depth nav). */
export const COUNCIL_OS_MEASURE: CouncilOsNavItem[] = [
  { id: "assess", label: "Assess", href: "/assess", pane: "measured", task: "get-measured" },
  { id: "verify", label: "Verify", href: "/gspc-verify", pane: "verify", task: "verify-a-card" },
  { id: "signal", label: "Signal", href: "/api/signal", external: true },
  { id: "ecosystem-api", label: "Org index", href: "/api/ecosystem", external: true },
];

/** Tooling depth — crosswalk, classifier, engine axis, firewall, compare. */
export const COUNCIL_OS_TOOLING: CouncilOsNavItem[] = [
  { id: "instruments", label: "Instruments", href: "/instruments", pane: "tools" },
  { id: "crosswalk", label: "Crosswalk", href: "/crosswalk" },
  { id: "classifier", label: "Classifier", href: "/classifier" },
  { id: "mcp-fleet", label: "MCP fleet", href: "/mcp-fleet" },
  { id: "engine", label: "Engine axis", href: "/engine-axis" },
  { id: "firewall", label: "Firewall", href: "/firewall-charter" },
  { id: "compare", label: "Compare", href: "/compare" },
  { id: "api-docs", label: "API docs", href: "/api-docs" },
];

export const COUNCIL_OS_SECTIONS: CouncilOsNavSection[] = [
  { id: "product", label: "Product", items: COUNCIL_OS_PRIMARY },
  { id: "measure", label: "Measure", items: COUNCIL_OS_MEASURE },
  { id: "tooling", label: "Tooling", items: COUNCIL_OS_TOOLING },
];

export function navItemForPath(path: string): CouncilOsNavItem | undefined {
  const clean = path.split("?")[0].split("#")[0];
  const all = [...COUNCIL_OS_PRIMARY, ...COUNCIL_OS_MEASURE, ...COUNCIL_OS_TOOLING];
  let best: CouncilOsNavItem | undefined;
  for (const item of all) {
    if (item.external) continue;
    if (clean === item.href || clean.startsWith(item.href + "/")) {
      if (!best || item.href.length > best.href.length) best = item;
    }
  }
  if (clean.startsWith("/brief")) return all.find((i) => i.id === "ecosystem");
  if (clean.startsWith("/enterprise")) return all.find((i) => i.id === "workspace");
  if (clean.startsWith("/remediation")) return all.find((i) => i.id === "fix");
  if (clean.startsWith("/gspc-scoreboard") || clean === "/gspc-verify") return all.find((i) => i.id === "board");
  if (clean.startsWith("/instruments") || clean.startsWith("/mcp-fleet")) return all.find((i) => i.id === "instruments");
  if (clean.startsWith("/agent-runbook") || clean.startsWith("/ag-ui")) return all.find((i) => i.id === "runbook");
  if (clean === "/assess" || clean.startsWith("/assessment")) return all.find((i) => i.id === "assess");
  if (clean.startsWith("/engine-axis")) return all.find((i) => i.id === "engine");
  if (clean.startsWith("/firewall-charter")) return all.find((i) => i.id === "firewall");
  if (clean.startsWith("/compare") || clean.startsWith("/competitors")) return all.find((i) => i.id === "compare");
  if (clean.startsWith("/crosswalk")) return all.find((i) => i.id === "crosswalk");
  if (clean.startsWith("/classifier")) return all.find((i) => i.id === "classifier");
  if (clean.startsWith("/api-docs")) return all.find((i) => i.id === "api-docs");
  return best;
}
