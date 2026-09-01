/**
 * Permissionless domination playbook — keep the demand, refuse the shortcuts.
 *
 * An external 2026-08-30 brief treats EU AI Act enforcement as a land-grab:
 * fill seven empty slots in a week, email a thousand publishers, mint XRPL
 * MEASURED, sell seats, fuse a compliance score. The demand is real. The
 * shortcuts are not this product.
 */

export type PlaybookVerdict = "keep" | "stale" | "false" | "forbidden";

export type PlaybookClaim = {
  id: string;
  claim: string;
  verdict: PlaybookVerdict;
  live: string;
};

export const PLAYBOOK_RULING =
  "Use the playbook’s demand. Refuse its week-to-MEASURED, auto-email, and fused compliance score.";

export const PLAYBOOK_SOURCE = {
  title: "CSOAI permissionless domination playbook",
  dated: "2026-08-30",
  role: "External war brief. Not GET /api/gspc. Not a signed card.",
} as const;

export const PLAYBOOK_PITCH =
  "AILuminate for chat. GSPC for the rest of the stack. We bind their harnesses as attachments. They never write MEASURED.";

export const PLAYBOOK_CLAIMS: PlaybookClaim[] = [
  {
    id: "eu-demand",
    claim: "EU AI Act enforcement is live. Article 50, GPAI powers and real fines create demand for evidence.",
    verdict: "keep",
    live: "We measure marking and publish empty cells. We do not certify, fine, or stamp COMPLIANT.",
  },
  {
    id: "inventory-gap",
    claim: "Most organisations still lack a basic AI inventory. Speed 0 census is the first honest product.",
    verdict: "keep",
    live: "Hub list + blobs=true. DISCOVERED, never a scoreboard of two million models.",
  },
  {
    id: "empty-names",
    claim: "The seven empty slots are reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-economy-index, human-labour-index, humanoid-labour-index.",
    verdict: "keep",
    live: "Matches GET /api/gspc. Empty is the finding. A scrape does not write MEASURED.",
  },
  {
    id: "ailuminate-bind",
    claim: "MLCommons AILuminate is a chat-risk benchmark. Bind it. Do not become it.",
    verdict: "keep",
    live: "Attachment. Never a 23rd axis. Never a fused GSPC+AILuminate grade.",
  },
  {
    id: "harness-bind",
    claim: "PyRIT, Promptfoo, OWASP LLM Top 10 and lm-eval can ride as joined receipts.",
    verdict: "keep",
    live: "Bind, do not vendor. Keyword-refusal scoring is not a GSPC card.",
  },
  {
    id: "cursor-plugin",
    claim: "Cursor / Grok already have a GSPC plugin door.",
    verdict: "keep",
    live: "Seven read tools on HTTP /mcp. Consent first. No inline 0–1 safety score. No FRIA stamp.",
  },
  {
    id: "scitt-bind",
    claim: "SCITT statements belong on the evidence bundle, not as our log.",
    verdict: "keep",
    live: "Already an attachment. Planned until a transparency service exists.",
  },
  {
    id: "grant-calendar",
    claim: "A dated grant calendar (EU DIGITAL, XRPL, MLCommons) is owner work, not a site SKU.",
    verdict: "keep",
    live: "Enquiry and filings. Do not put award amounts on a public door.",
  },
  {
    id: "stale-13",
    claim: "The brief still says 13 measured axes and a 14-slot instrument.",
    verdict: "stale",
    live: "Living board: 22 axis · 22 measured. Quote GET /api/gspc.",
  },
  {
    id: "stale-300-mcp",
    claim: "300+ MCP servers are this product and each is an axis test.",
    verdict: "stale",
    live: "Planted door is four read tools. Extra catalogues are not GSPC.",
  },
  {
    id: "false-temples",
    claim: "Council OS already maps NIST AI RMF 2.0 and the EU AI Act as one product.",
    verdict: "false",
    live: "Published east-west crosswalk is four regimes. NIST/ISO are not in that map.",
  },
  {
    id: "false-bft",
    claim: "A designed 33-agent council is a live harness layer.",
    verdict: "false",
    live: "DR-0007 retracted that claim. Do not revive it as AutoHarness drop-in.",
  },
  {
    id: "false-measured-thousands",
    claim: "Week 1 ships a live leaderboard of 1,000 scored Hub models.",
    verdict: "false",
    live: "hub-queue is UNMEASURED. 2,200 is a dated eligibility cohort, not a score.",
  },
  {
    id: "forbid-week-fill",
    claim: "Fill each empty slot in seven days and mark it MEASURED.",
    verdict: "forbidden",
    live: "MEASURED needs Card v2, a bolted instrument, n, evidence and verify. Empty stays empty.",
  },
  {
    id: "forbid-xrpl-mainnet",
    claim: "Stand up an XRPL issuer this week and issue GSPC-MEASURED credentials.",
    verdict: "forbidden",
    live: "No XRPL issuer this week. /xrpl-attest is a /root.json reader, not a mill. Attester, never issuer. No on-chain MEASURED. No invented payTo.",
  },
  {
    id: "forbid-auto-email",
    claim: "Auto-email a thousand publishers a red/yellow/green EU compliance report.",
    verdict: "forbidden",
    live: "No mass mail. No Article 50 stamp. Optional discussion after a signed cell.",
  },
  {
    id: "forbid-fused-report",
    claim: "Average GSPC proportions into COMPLIANT / AT_RISK / NON_COMPLIANT.",
    verdict: "forbidden",
    live: "That is the NEWS/TRiSM terminal we refuse. Competent authorities diagnose.",
  },
  {
    id: "forbid-tokens",
    claim: "Mint GAT, T-REX, release bonds and a tradable SOV index from the board.",
    verdict: "forbidden",
    live: "A rank is never sold. Do not mint or mine a grade.",
  },
  {
    id: "forbid-new-axes",
    claim: "Import 200 lm-eval tasks and Agent Security League as new GSPC axes.",
    verdict: "forbidden",
    live: "No 23rd axis. Academic benches attach. They do not rename the chart.",
  },
  {
    id: "forbid-seat-prices",
    claim: "Publish Pro / Enterprise / PAYG seat prices on the growth sequence.",
    verdict: "forbidden",
    live: "Verify is free. Paid SKUs on enquiry. A rank is never sold.",
  },
];

export function playbookByVerdict(v: PlaybookVerdict): PlaybookClaim[] {
  return PLAYBOOK_CLAIMS.filter((c) => c.verdict === v);
}
