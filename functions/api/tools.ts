// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: Copyright (c) 2026 CSOAI (Council for the Safety of AI, UK)
//
// /api/tools — the MCP catalogue, counted honestly.
//
// WHY THIS EXISTS, AND WHY IT DOES NOT RETURN 377
// The Claims E2E asserted `total >= 377` against os.meok.ai/api/tools. That route now serves
// the SPA, so the assertion has been failing on a missing endpoint rather than on a real count.
// The tempting fix is to publish a number that makes the test go green. That is precisely the
// failure this organisation exists to catch, and our own Refutation Ledger already flagged it:
//
//   "no 9-tool manifest exists; claims-only, with a tools↔servers unit flip in the same page"
//
// A SERVER is not a TOOL. One MCP server exposes many tools, so counting servers and printing
// the result as "tools" inflates the number silently. This endpoint therefore reports both,
// separately, and never adds them together.
//
// `total` is the count of TOOLS we can actually enumerate right now. If that is small, the
// honest answer is a small number — not a historical figure nobody can reproduce.

interface McpServer {
  id: string;
  name: string;
  description?: string;
  tools?: { name: string; description?: string }[];
}

// The catalogue this surface can substantiate. Kept deliberately in one place so the count is
// derived from the list rather than asserted next to it.
const CATALOGUE: McpServer[] = [
  {
    id: "csoai-assess",
    name: "CSOAI Assess",
    description: "AI governance: deterministic EU AI Act / GDPR risk classification, signed.",
    tools: [
      { name: "assess_system", description: "Classify a system against Art 5 / Annex III." },
      { name: "verify_assessment", description: "Verify an Ed25519-signed assessment record." },
      { name: "list_controls", description: "Return the Art 9–15/50 control set." },
    ],
  },
  {
    id: "csoai-article50",
    name: "CSOAI Article 50",
    description: "AI governance: Article 50 transparency-marking passport, issue and verify.",
    tools: [
      { name: "issue_passport", description: "Issue an Article 50 disclosure passport." },
      { name: "verify_passport", description: "Verify a passport against its signature." },
    ],
  },
  {
    id: "csoai-corpus-watch",
    name: "CSOAI Corpus Watch",
    description: "AI governance: regulatory corpus drift detection over frozen hashes.",
    tools: [
      { name: "corpus_status", description: "Current corpus hash and freshness." },
      { name: "corpus_delta", description: "What changed between two corpus versions." },
    ],
  },
];

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase().trim();

  const servers = q
    ? CATALOGUE.filter((s) =>
        `${s.id} ${s.name} ${s.description ?? ""} ${(s.tools ?? [])
          .map((t) => `${t.name} ${t.description ?? ""}`)
          .join(" ")}`
          .toLowerCase()
          .includes(q),
      )
    : CATALOGUE;

  const tools = servers.flatMap((s) =>
    (s.tools ?? []).map((t) => ({ server: s.id, ...t })),
  );

  return Response.json(
    {
      // `total` means TOOLS, and is derived — never typed in beside the list.
      total: tools.length,
      server_count: servers.length,
      catalogue_total_tools: CATALOGUE.reduce((n, s) => n + (s.tools ?? []).length, 0),
      catalogue_total_servers: CATALOGUE.length,
      query: q || null,
      servers,
      tools,
      counting_note:
        "total counts TOOLS, not servers. One server exposes many tools; adding the two, or " +
        "reporting servers as tools, is the unit flip recorded in our refutation ledger. This " +
        "number is what this surface can enumerate and verify today — it is not a historical " +
        "catalogue figure.",
    },
    { headers: { "cache-control": "no-store" } },
  );
};
