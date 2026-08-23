/**
 * Shared navigation for Eunomia / Layer 0 surfaces — Footer, GlobalSearch, home strips.
 * Keep in sync with Header.tsx Evidence nav and layer0Links.ts.
 */
import { POSITIONING } from "@/lib/positioning";
export type EstateLink = {
  name: string;
  href: string;
  description: string;
  keywords?: string[];
  external?: boolean;
};

/** Finance + router surfaces (Engine Axis family). */
export const EUNOMIA_ESTATE_LINKS: EstateLink[] = [
  {
    name: "Engine Axis",
    href: "/engine-axis",
    description: "Bond, insurance, COBOL, east-west — financial axes 18–25",
    keywords: ["eunomia", "finance", "bond", "engine"],
  },
  {
    name: "Eunomia Router",
    href: "/instruments",
    description: POSITIONING.router.blurb,
    keywords: ["mcp", "router", "instruments", "eunomia"],
  },
  {
    name: "Bond Venturi",
    href: "/venturi",
    description: "COBOL batch → A2A stream — metabolic boundary (DESIGN register)",
    keywords: ["venturi", "cobol", "a2a", "bond"],
  },
  {
    name: "Legacy Bridge",
    href: "/legacy",
    description: "Wrap mainframe batch — do not replace",
    keywords: ["cobol", "mainframe", "legacy"],
  },
];

/** Agent rail + standards surfaces. */
export const AGENT_ESTATE_LINKS: EstateLink[] = [
  {
    name: "Agent runbook",
    href: "/agent-runbook",
    description: "curl-first — gspc, instruments, AG-UI, bond crossing",
    keywords: ["agent", "curl", "api", "runbook"],
  },
  {
    name: "RECEIPT-SPEC-0.1",
    href: "/receipt-spec",
    description: "Measurement-card format — Ed25519 envelope, 3-path verify",
    keywords: ["receipt", "spec", "attestation", "schema"],
  },
  {
    name: "Arena harness",
    href: "/arena-harness",
    description: POSITIONING.harness.blurb,
    keywords: ["stripe", "openrouter", "arena", "harness", "bond"],
  },
  {
    name: "SOV Signal Index",
    href: "/api/signal",
    description: "Regulation × crosswalk × GSPC × arena — GET /api/signal",
    keywords: ["signal", "index", "cross", "divergence", "east-west"],
    external: true,
  },
  {
    name: "Ownership plan",
    href: "/ownership",
    description: "100 moves — standards, domain, data, trust, distribution",
    keywords: ["ownership", "strategy", "moves"],
  },
  {
    name: "Layer 0",
    href: "/layer0",
    description: "The signed trust layer the agent rail stands on",
    keywords: ["layer0", "trust", "agent economy"],
  },
];
