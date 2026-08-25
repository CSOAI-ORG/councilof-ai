/**
 * Master header menu — Council OS + AG-UI living workspace.
 *
 * Opens Council OS panes (dock + chat) or routes that work in the site column
 * while the dock stays open. Full estate map lives in SITE_NAVIGATION (footer).
 */
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  Cpu,
  LayoutDashboard,
  Route,
  Sparkles,
  Wrench,
} from "lucide-react";
import type { LobbyTabId } from "@/components/lobby/tabs";
import type { LobbyTaskId } from "@/lib/lobbyLink";

export type MasterNavAction =
  | { kind: "link"; href: string; external?: boolean }
  | { kind: "lobby"; pane: LobbyTabId; task?: LobbyTaskId };

export interface MasterNavItem {
  name: string;
  description: string;
  action: MasterNavAction;
}

export interface MasterNavGroup {
  name: string;
  href: string;
  icon: LucideIcon;
  description: string;
  submenu: MasterNavItem[];
  /** When set, "View all …" opens Council OS instead of navigating away. */
  groupLobby?: { pane: LobbyTabId; task?: LobbyTaskId };
}

export const MASTER_NAVIGATION: MasterNavGroup[] = [
  {
    name: "Workspace",
    href: "/os",
    icon: Sparkles,
    description: "Council OS — router + harness in one dock (board, models, routes, MCP, chat)",
    groupLobby: { pane: "home" },
    submenu: [
      {
        name: "Council OS home",
        description: "Open the living refinery — dock, AG-UI chat, grouped sidebar",
        action: { kind: "lobby", pane: "home" },
      },
      {
        name: "Live board",
        description: "GSPC leaderboard in the centre pane — refreshes from GET /api/gspc",
        action: { kind: "lobby", pane: "board", task: "read-the-board" },
      },
      {
        name: "Models",
        description: "Rankings with separated leads, ties, and Try-in-chat",
        action: { kind: "lobby", pane: "models" },
      },
      {
        name: "Routes",
        description: "Eunomia routing table — governance instruments, not LLM providers",
        action: { kind: "lobby", pane: "routes", task: "eunomia-router" },
      },
      {
        name: "MCP tools",
        description: "Featured instruments — try in AG-UI or open the catalog",
        action: { kind: "lobby", pane: "tools" },
      },
      {
        name: "Local play",
        description: "Honest gallery — opens a page vs in build",
        action: { kind: "lobby", pane: "play" },
      },
      {
        name: "Ecosystem index",
        description: "Regulators, enterprises, SMBs — GET /api/ecosystem",
        action: { kind: "link", href: "/intel" },
      },
      {
        name: "My systems",
        description: "Portfolio workspace — batch assess, re-attest",
        action: { kind: "link", href: "/workspace" },
      },
      {
        name: "Arena",
        description: "LMArena-style compare on GSPC rounds",
        action: { kind: "lobby", pane: "arena", task: "arena" },
      },
      {
        name: "Verify a card",
        description: "Hash + Ed25519 check in the workspace",
        action: { kind: "lobby", pane: "verify", task: "verify-a-card" },
      },
    ],
  },
  {
    name: "Software",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Dashboard, measurement hub, workbench",
    submenu: [
      {
        name: "Dashboard",
        description: "Software overview — measurement hub embed + Council OS CTA",
        action: { kind: "link", href: "/dashboard" },
      },
      {
        name: "Measurement hub",
        description: "Board, models, routes — same data as Council OS centre pane",
        action: { kind: "link", href: "/dashboard/measurement" },
      },
      {
        name: "Model registry",
        description: "Per-axis leaders from GET /api/gspc — public scoreboard view",
        action: { kind: "link", href: "/models" },
      },
      {
        name: "Analyst workbench",
        description: "Watchdog and analyst tooling",
        action: { kind: "link", href: "/workbench" },
      },
      {
        name: "Open workspace from dashboard",
        description: "Jump into Council OS on the live board",
        action: { kind: "lobby", pane: "board", task: "read-the-board" },
      },
    ],
  },
  {
    name: "Measure",
    href: "/gspc-scoreboard",
    icon: BarChart3,
    description: "Live pages — open beside the dock",
    submenu: [
      {
        name: "East-West",
        description: "One signed measurement mapped across EU, UK, Illinois, China — mapping is not a determination",
        action: { kind: "link", href: "/east-west" },
      },
      {
        name: "GSPC scoreboard",
        description: "Full 13-axis board in the site column",
        action: { kind: "link", href: "/gspc-scoreboard" },
      },
      {
        name: "Get measured",
        description: "Free signed assessment — /assess",
        action: { kind: "lobby", pane: "measured", task: "get-measured" },
      },
      {
        name: "Council Space arena",
        description: "Deterministic rounds — not a model jury",
        action: { kind: "lobby", pane: "space", task: "arena" },
      },
      {
        name: "Eunomia instruments",
        description: "OpenRouter-shaped catalog — MCP, REST, AG-UI per route",
        action: { kind: "link", href: "/instruments" },
      },
      {
        name: "Engine Axis",
        description: "Financial axes 18–25 — bond, insurance, COBOL",
        action: { kind: "link", href: "/engine-axis" },
      },
      {
        name: "Labour & AI-economy indices",
        description: "AI-economy · human-labour · humanoid-labour — UNMEASURED first",
        action: { kind: "link", href: "/indices" },
      },
      {
        name: "Products catalog",
        description: "Living catalog — scores never sold · HO.2",
        action: { kind: "link", href: "/products" },
      },
      {
        name: "Powered by Council OS",
        description: "Option A white-label attestation — not tokenization",
        action: { kind: "link", href: "/powered-by" },
      },
    ],
  },
  {
    name: "Agents",
    href: "/agent-runbook",
    icon: Bot,
    description: "AG-UI wire, runbook, machine surfaces",
    submenu: [
      {
        name: "Agent runbook",
        description: "curl-first — gspc, instruments, AG-UI SSE, bond crossing",
        action: { kind: "link", href: "/agent-runbook" },
      },
      {
        name: "API documentation",
        description: "Every public endpoint — including /api/agui when wired",
        action: { kind: "link", href: "/api-docs" },
      },
      {
        name: "AG-UI bridge",
        description: "Open Council OS with AG-UI handle pre-selected",
        action: { kind: "link", href: "/ag-ui" },
      },
      {
        name: "RECEIPT-SPEC-0.1",
        description: "Signed measurement-card envelope",
        action: { kind: "link", href: "/receipt-spec" },
      },
      {
        name: "GSPC — live JSON",
        description: "GET /api/gspc for agents",
        action: { kind: "link", href: "/api/gspc", external: true },
      },
      {
        name: "SOV Signal Index",
        description: "Regulation × crosswalk × GSPC × arena",
        action: { kind: "link", href: "/api/signal", external: true },
      },
    ],
  },
  {
    name: "Surfaces",
    href: "/assess",
    icon: Cpu,
    description: "Quick routes that pair with the dock",
    submenu: [
      {
        name: "Assess",
        description: "Measure your system — page in site column, chat in dock",
        action: { kind: "link", href: "/assess" },
      },
      {
        name: "Watchdog",
        description: "Report and triage incidents",
        action: { kind: "lobby", pane: "watchdog", task: "report-an-incident" },
      },
      {
        name: "Live training",
        description: "Art. 4 office sim — verified outcome records, never certificates",
        action: { kind: "link", href: "/live-training" },
      },
      {
        name: "Academy",
        description: "Training rail — not conformity",
        action: { kind: "lobby", pane: "academy", task: "live-drill" },
      },
      {
        name: "Council software",
        description: "Software landing in the site column",
        action: { kind: "lobby", pane: "software" },
      },
      {
        name: "Arena harness thesis",
        description: "Downstream of routers — proof DB (DESIGN)",
        action: { kind: "link", href: "/arena-harness" },
      },
    ],
  },
];

/** Compact strip for mobile — icon hints only. */
export const MASTER_QUICK: { id: LobbyTabId; label: string; icon: LucideIcon }[] = [
  { id: "board", label: "Board", icon: BarChart3 },
  { id: "models", label: "Models", icon: Cpu },
  { id: "routes", label: "Routes", icon: Route },
  { id: "tools", label: "Tools", icon: Wrench },
];
