/**
 * Labour / AI-economy companion indices — candidates on the same honesty rail.
 * Declared UNMEASURED publicly (/indices). Never overwrite MEASURED slot 18.
 * Never fuse into GSPC cells. See labourIndices.ts · docs/EAT_PLAYBOOK.md
 */
export const CONTEXT_FIREWALL_INDICES: {
  slug: string;
  title: string;
  status: "UNMEASURED";
  candidacy: string;
  path: string;
  firewall: string;
}[] = [
  {
    slug: "ai-economy",
    title: "AI Economy Index",
    status: "UNMEASURED",
    candidacy: "Companion to slot 23 (agent-economy) — not a fused score",
    path: "/indices/ai-economy",
    firewall: "Contextual only — never SHA-256/Ed25519 grading input",
  },
  {
    slug: "human-labour",
    title: "Human Labour Index",
    status: "UNMEASURED",
    candidacy: "Financial-extension candidate (GAP adjacency slots 24–25)",
    path: "/indices/human-labour",
    firewall: "Contextual only — never SHA-256/Ed25519 grading input",
  },
  {
    slug: "humanoid-labour",
    title: "Humanoid Labour Index",
    status: "UNMEASURED",
    candidacy: "Machinery-conformity adjacency + financial-extension candidate",
    path: "/indices/humanoid-labour",
    firewall: "Contextual only — never SHA-256/Ed25519 grading input",
  },
];
