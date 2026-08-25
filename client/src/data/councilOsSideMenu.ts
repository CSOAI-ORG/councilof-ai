/**
 * councilOsSideMenu — single source of truth for Council OS left + right tooling rails.
 *
 * OpenRouter: grouped product nav · LMArena: arena/compare up front · Moody's: depth tooling links.
 */
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  Cpu,
  FileCheck,
  Globe2,
  GraduationCap,
  Home,
  Layers,
  Link2,
  Route,
  Scale,
  Shield,
  Sparkles,
  Swords,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import type { LobbyTabId } from "@/components/lobby/tabs";
import type { LobbyTaskId } from "@/lib/lobbyLink";

export type SideMenuItem =
  | {
      kind: "pane";
      id: string;
      pane: LobbyTabId;
      label: string;
      hint: string;
      icon: LucideIcon;
      task?: LobbyTaskId;
      badge?: "live" | "api" | "train";
    }
  | {
      kind: "route";
      id: string;
      href: string;
      label: string;
      hint: string;
      icon: LucideIcon;
      external?: boolean;
      badge?: "live" | "api" | "train";
    };

export type SideMenuGroup = {
  id: string;
  title: string;
  defaultOpen?: boolean;
  items: SideMenuItem[];
};

export const COUNCIL_OS_LEFT_MENU: SideMenuGroup[] = [
  {
    id: "refinery",
    title: "Refinery",
    defaultOpen: true,
    items: [
      { kind: "pane", id: "home", pane: "home", label: "Home", hint: "Council OS desktop", icon: Home },
      { kind: "route", id: "os", href: "/os", label: "Refinery map", hint: "Master ONE OS overview", icon: Sparkles },
    ],
  },
  {
    id: "measurement",
    title: "Measurement",
    defaultOpen: true,
    items: [
      { kind: "pane", id: "board", pane: "board", label: "Live board", hint: "GET /api/gspc", icon: BarChart3, task: "read-the-board", badge: "live" },
      { kind: "pane", id: "models", pane: "models", label: "Models", hint: "Rankings · separated leads", icon: Cpu },
      { kind: "pane", id: "routes", pane: "routes", label: "Routes", hint: "Eunomia routing table", icon: Route, task: "eunomia-router" },
      { kind: "pane", id: "arena", pane: "arena", label: "Arena", hint: "LMArena-style compare", icon: Swords, task: "arena" },
      { kind: "route", id: "scoreboard", href: "/gspc-scoreboard", label: "Full scoreboard", hint: "13-axis board in site column", icon: BarChart3 },
      { kind: "route", id: "models-page", href: "/models", label: "Model registry", hint: "Per-axis leaders page", icon: Cpu },
      { kind: "route", id: "signal", href: "/api/signal", label: "Signal index", hint: "Regulation × crosswalk × GSPC", icon: Zap, external: true, badge: "api" },
    ],
  },
  {
    id: "indices",
    title: "Indices",
    defaultOpen: true,
    items: [
      {
        kind: "route",
        id: "indices-hub",
        href: "/indices",
        label: "Labour & AI-economy",
        hint: "UNMEASURED first · contextual only",
        icon: TrendingUp,
      },
      {
        kind: "route",
        id: "indices-ai-economy",
        href: "/indices/ai-economy",
        label: "AI Economy Index",
        hint: "measured_score: null",
        icon: BarChart3,
      },
      {
        kind: "route",
        id: "indices-human-labour",
        href: "/indices/human-labour",
        label: "Human Labour Index",
        hint: "Never fused into GSPC",
        icon: BarChart3,
      },
      {
        kind: "route",
        id: "indices-humanoid",
        href: "/indices/humanoid-labour",
        label: "Humanoid Labour Index",
        hint: "Declared empty until bank freeze",
        icon: BarChart3,
      },
      {
        kind: "route",
        id: "indices-api",
        href: "/api/indices",
        label: "Indices API",
        hint: "GET /api/indices",
        icon: Link2,
        external: true,
        badge: "api",
      },
    ],
  },
  {
    id: "ecosystem",
    title: "Ecosystem",
    defaultOpen: true,
    items: [
      { kind: "pane", id: "ecosystem", pane: "ecosystem", label: "Hive index", hint: "Regulators · enterprises · SMBs", icon: Globe2 },
      { kind: "pane", id: "workspace", pane: "workspace", label: "My systems", hint: "Portfolio · batch assess", icon: Building2, task: "enterprise-start" },
      { kind: "route", id: "intel", href: "/intel", label: "Full intel map", hint: "Globe + account cards", icon: Layers },
      { kind: "route", id: "ecosystem-api", href: "/api/ecosystem", label: "Org index API", hint: "Machine-readable JSON", icon: Link2, external: true, badge: "api" },
    ],
  },
  {
    id: "tooling",
    title: "Tooling",
    defaultOpen: true,
    items: [
      { kind: "pane", id: "tools", pane: "tools", label: "MCP tools", hint: "Try in AG-UI chat", icon: Wrench },
      { kind: "pane", id: "verify", pane: "verify", label: "Verify card", hint: "Ed25519 in browser", icon: Shield, task: "verify-a-card" },
      { kind: "route", id: "crosswalk", href: "/crosswalk", label: "Crosswalk", hint: "Framework mapping", icon: Link2 },
      { kind: "route", id: "classifier", href: "/classifier", label: "Classifier", hint: "EU AI Act tier check", icon: Scale },
      { kind: "route", id: "instruments", href: "/instruments", label: "Full catalog", hint: "291 MCP routes", icon: BookOpen },
      { kind: "route", id: "mcp-fleet", href: "/mcp-fleet", label: "MCP fleet", hint: "Executing tools map", icon: Bot },
    ],
  },
  {
    id: "fix",
    title: "Fix & train",
    defaultOpen: false,
    items: [
      { kind: "pane", id: "fix", pane: "fix", label: "Fix lane", hint: "AG-UI/MEOK assist", icon: FileCheck, task: "fix-gaps", badge: "train" },
      { kind: "pane", id: "measured", pane: "measured", label: "Get measured", hint: "Signed /assess", icon: FileCheck, task: "get-measured" },
      { kind: "pane", id: "academy", pane: "academy", label: "Academy", hint: "Training not conformity", icon: GraduationCap, task: "academy", badge: "train" },
      { kind: "route", id: "remediation", href: "/remediation-partners", label: "Remediation", hint: "Independent fixers", icon: Shield },
    ],
  },
  {
    id: "agents",
    title: "Agents & API",
    defaultOpen: false,
    items: [
      { kind: "route", id: "ag-ui", href: "/ag-ui", label: "AG-UI bridge", hint: "Open with wire handle", icon: Bot },
      { kind: "route", id: "runbook", href: "/agent-runbook", label: "Agent runbook", hint: "curl-first surfaces", icon: BookOpen },
      { kind: "route", id: "api-docs", href: "/api-docs", label: "API docs", hint: "Every public endpoint", icon: Link2 },
      { kind: "route", id: "receipt", href: "/receipt-spec", label: "Receipt spec", hint: "Signed card envelope", icon: FileCheck },
    ],
  },
  {
    id: "surfaces",
    title: "Surfaces",
    defaultOpen: false,
    items: [
      { kind: "pane", id: "space", pane: "space", label: "Council Space", hint: "Arena rounds", icon: Swords },
      { kind: "pane", id: "watchdog", pane: "watchdog", label: "Watchdog", hint: "Incidents", icon: Shield, task: "report-an-incident" },
      { kind: "route", id: "dashboard", href: "/dashboard", label: "Dashboard", hint: "DSH software hub", icon: BarChart3 },
      { kind: "route", id: "workbench", href: "/workbench", label: "Workbench", hint: "Analyst tooling", icon: BookOpen },
      { kind: "pane", id: "play", pane: "play", label: "Local play", hint: "Not measurement", icon: Sparkles },
    ],
  },
];

/** Right-rail quick tooling — opens site column or seeds chat. */
export const COUNCIL_OS_TOOLING_QUICK: SideMenuItem[] = [
  { kind: "route", id: "batch", href: "/workspace", label: "Batch assess", hint: "Portfolio POST /api/assess/batch", icon: Building2 },
  { kind: "route", id: "assess", href: "/assess", label: "Get measured", hint: "Signed /assess flow", icon: FileCheck },
  { kind: "route", id: "crosswalk", href: "/crosswalk", label: "Crosswalk", hint: "Framework mapping", icon: Link2 },
  { kind: "route", id: "classifier", href: "/classifier", label: "Classifier", hint: "EU AI Act tier check", icon: Scale },
  { kind: "route", id: "engine", href: "/engine-axis", label: "Engine axis", hint: "Bond · insurance · COBOL", icon: Zap },
  { kind: "route", id: "firewall", href: "/firewall-charter", label: "Firewall charter", hint: "Measure never fix", icon: Shield },
  { kind: "route", id: "compare", href: "/compare", label: "Compare vendors", hint: "Honest battlecards", icon: Scale },
  { kind: "route", id: "api-docs", href: "/api-docs", label: "API docs", hint: "Every public endpoint", icon: Link2 },
];

export const LEFT_MENU_FLAT_PANES: LobbyTabId[] = COUNCIL_OS_LEFT_MENU.flatMap((g) =>
  g.items.filter((i): i is Extract<SideMenuItem, { kind: "pane" }> => i.kind === "pane").map((i) => i.pane),
);

export function paneOrder(): LobbyTabId[] {
  return LEFT_MENU_FLAT_PANES;
}
