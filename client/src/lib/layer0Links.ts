/**
 * Layer 0 — Eunomia finance/router surfaces shared by Council OS and DSH.
 */
import { openLobby } from "@/lib/lobbyLink";

export type Layer0Link = {
  label: string;
  blurb: string;
  path: string;
  lobbyTask?: "engine-axis-brief" | "eunomia-router" | "bond-venturi";
  /** Seeded lobby prompt — consent lock applies (prefill only). */
  lobbyPrompt?: string;
};

export const LAYER0_LINKS: Layer0Link[] = [
  {
    label: "Engine Axis",
    blurb: "Bond · insurance · COBOL · east-west — one sign for all markets.",
    path: "/engine-axis",
    lobbyTask: "engine-axis-brief",
    lobbyPrompt:
      "On the engine axis, which crossings are MEASURED today versus PLANNED — and what would a bond-router attestation include?",
  },
  {
    label: "Eunomia Router",
    blurb: "291 MCP routes — governance on every path.",
    path: "/instruments",
    lobbyTask: "eunomia-router",
    lobbyPrompt:
      "Route a logistics request through identity, care ethics, and ISO 42001 — what does each layer return?",
  },
  {
    label: "Bond Venturi",
    blurb: "COBOL batch → A2A stream — metabolic boundary.",
    path: "/venturi",
    lobbyTask: "bond-venturi",
    lobbyPrompt:
      "Walk COBOL overnight batch to A2A T+0 — which steps are SPEC vs MEASURED on councilof.ai today?",
  },
  {
    label: "Legacy Bridge",
    blurb: "Wrap mainframe batch — do not replace.",
    path: "/legacy",
    lobbyPrompt: "What does the legacy bridge publish about COBOL wrap versus replace?",
  },
  {
    label: "Labour & AI-economy indices",
    blurb: "3 indices UNMEASURED — contextual firewall; never GSPC inputs. GET /api/indices",
    path: "/indices",
    lobbyPrompt:
      "What are the three labour/AI-economy indices, why are they UNMEASURED, and why must they never fuse into GSPC grades?",
  },
  {
    label: "Products catalog",
    blurb: "HO.2 living catalog — MEASURED / UNMEASURED / DESIGN honest. Scores never sold.",
    path: "/products",
    lobbyPrompt:
      "List Council OS products that are MEASURED versus UNMEASURED — and confirm grades are never sold.",
  },
  {
    label: "MCP fleet",
    blurb: "291 registry servers · GET /api/mcp · Layer 0 wrapped.",
    path: "/mcp-fleet",
    lobbyPrompt: "What does GET /api/mcp return in local vs production, and how do indices_catalog tools stay UNMEASURED?",
  },
];

/** Trust floor surfaces — shared infra links (not finance-specific). */
export const LAYER0_INFRA: Layer0Link[] = [
  { label: "Agent runbook", blurb: "curl-first — gspc, instruments, AG-UI, bond crossing.", path: "/agent-runbook" },
  { label: "RECEIPT-SPEC", blurb: "Measurement-card format — Ed25519, 3-path verify.", path: "/receipt-spec" },
  { label: "Ownership plan", blurb: "100 moves — standards, domain, data, trust, distribution.", path: "/ownership" },
  { label: "Layer 0", blurb: "The signed trust layer the agent rail stands on.", path: "/layer0" },
  { label: "Trust center", blurb: "Keys, receipts, and what we will not claim.", path: "/trust-center" },
  { label: "Network", blurb: "N sites and where the record lives.", path: "/network" },
  { label: "Hive", blurb: "Frameworks and groups, as published.", path: "/hive" },
  { label: "Intel", blurb: "Competitor and landscape notes.", path: "/intel" },
];

export function openLayer0InLobby(link: Layer0Link) {
  openLobby({
    pane: "home",
    task: link.lobbyTask,
    prompt: link.lobbyPrompt ?? `Open ${link.label} — what is published and what is DESIGN?`,
  });
}
