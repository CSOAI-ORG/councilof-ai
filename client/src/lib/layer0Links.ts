/**
 * Layer 0 — Eunomia finance/router surfaces shared by Council OS and DSH.
 */
import { openLobby } from "@/lib/lobbyLink";

export type Layer0Link = {
  label: string;
  blurb: string;
  path: string;
  lobbyTask?: "engine-axis-brief" | "eunomia-router" | "bond-venturi";
  lobbyPrompt?: string;
};

export const LAYER0_LINKS: Layer0Link[] = [
  { label: "Engine Axis", blurb: "Bond · insurance · COBOL · east-west — one sign for all markets.", path: "/engine-axis", lobbyTask: "engine-axis-brief", lobbyPrompt: "On the engine axis, which crossings are MEASURED today versus PLANNED — and what would a bond-router attestation include?" },
  { label: "Eunomia Router", blurb: "291 MCP routes — governance on every path.", path: "/instruments", lobbyTask: "eunomia-router", lobbyPrompt: "Route a logistics request through identity, care ethics, and ISO 42001 — what does each layer return?" },
  { label: "Bond Venturi", blurb: "COBOL batch → A2A stream — metabolic boundary.", path: "/venturi", lobbyTask: "bond-venturi", lobbyPrompt: "Walk COBOL overnight batch to A2A T+0 — which steps are SPEC vs MEASURED on councilof.ai today?" },
  { label: "Legacy Bridge", blurb: "Wrap mainframe batch — do not replace.", path: "/legacy", lobbyPrompt: "What does the legacy bridge publish about COBOL wrap versus replace?" },
];

export const LAYER0_INFRA: Layer0Link[] = [
  { label: "Layer 0", blurb: "The signed trust layer the agent rail stands on.", path: "/layer0" },
  { label: "Trust center", blurb: "Keys, receipts, and what we will not claim.", path: "/trust-center" },
  { label: "Network", blurb: "N sites and where the record lives.", path: "/network" },
  { label: "Hive", blurb: "Frameworks and groups, as published.", path: "/hive" },
  { label: "Intel", blurb: "Competitor and landscape notes.", path: "/intel" },
];

export function openLayer0InLobby(link: Layer0Link) {
  openLobby({ pane: "home", task: link.lobbyTask, prompt: link.lobbyPrompt ?? `Open ${link.label} — what is published and what is DESIGN?` });
}
