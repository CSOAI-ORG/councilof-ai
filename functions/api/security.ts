// functions/api/security.ts — the security posture surface, bridged from the ASI-security hive.
//
// WHY THIS EXISTS
// asisecurity.ai is its own product hive, and the arena needs one honest place to read security
// state from. Today the arena has no security surface at all, and asisecurity.ai never names the
// benchmark it maps to. This is the join.
//
// WHAT IT DELIBERATELY DOES NOT DO
// It does not publish a red/blue score. The v1 red-team board was refuted by its own recovered
// data — the regex hid 30% of the ambiguous bucket as breaches, including a control that was
// supposed to be clean. v2 stores full transcripts and runs a dual grader, but **its judge has not
// been validated against the 36-cell gold worksheet**, so 137 spine-unreadable cells (76 of which
// the judge calls breaches) are unresolved: they are either real breaches or judge over-firing, and
// nothing here can tell you which. Until that worksheet is labelled, this endpoint reports the run
// as IN_PROGRESS with no score. A number published before its grader is validated is how the v1
// board became a retraction.

interface Surface {
  id: string;
  name: string;
  status: "MEASURED" | "IN_PROGRESS" | "SPEC" | "UNVALIDATED";
  what: string;
  detail: string;
  n?: number;
  score?: number;
}

const SURFACES: Surface[] = [
  {
    id: "pqc-continuity",
    name: "Post-quantum continuity (GSPC-ASI)",
    status: "MEASURED",
    n: 13,
    what: "Does a cryptographic choice survive the post-quantum transition?",
    detail:
      "Statute-anchored to NIST FIPS 203/204/205 and IR 8547. n=13 is below usable_n=30, so no " +
      "interval is published on this axis, including ours. Cross-company measurement found every " +
      "frontier model tested scoring 0.46-0.69 here while scoring 0.87-1.00 on other axes — the " +
      "widest capability gap in the suite, and the reason this axis exists.",
  },
  {
    id: "mcp-conformance",
    name: "Tool-declaration conformance (GSPC-MCP)",
    status: "MEASURED",
    n: 11,
    what: "Does a tool's observed behaviour match what it declared about itself?",
    detail:
      "Three deterministic predicates: declared-read-only, bounded-egress, faithful-schema. A tool " +
      "that quietly does more than it declares is the supply-chain attack in one sentence. n=11, " +
      "not quotable.",
  },
  {
    id: "art5-safeguard",
    name: "Prohibited-practice safeguards (GSPC-ART5)",
    status: "SPEC",
    what: "How effective are safeguards against Article 5 prohibited generation?",
    detail:
      "Protocol published; no measurement. The corpus is handled only by authorised holders " +
      "(NCMEC/IWF/Thorn) and never by CSOAI. Marking obligation applies 2 December 2026.",
  },
  {
    id: "redblue-v2",
    name: "Adversarial red/blue (v2)",
    status: "IN_PROGRESS",
    what: "Does an adversarial agent induce a charter breach, and does the defence catch it?",
    detail:
      "Running on a dedicated node with full transcripts and a dual grader. NO SCORE IS PUBLISHED. " +
      "v1 was refuted by its own recovered data: the extraction regex hid 30% of the ambiguous " +
      "bucket as breaches, including a control that should have been clean. v2's judge must first " +
      "be validated against a 36-cell hand-labelled gold worksheet; 137 cells the spine could not " +
      "read are unresolved, and 76 of those the judge calls breaches. Until the worksheet is " +
      "labelled we cannot distinguish a real breach from judge over-firing, and publishing either " +
      "way would repeat the v1 failure.",
  },
  {
    id: "hive-lens-detection",
    name: "Security hive — layered lens detection",
    status: "MEASURED",
    n: 40,
    score: 0.88,
    what: "Do layered detection lenses catch injected/unsafe content, and at what false-positive cost?",
    detail:
      "A voting hive of detection lenses (rainbow + BFT string lenses, plus an optional semantic " +
      "lens), with an oversight eye reporting consensus health. Measured: string lenses alone reach " +
      "0.53 recall; adding a semantic lens raises recall to 0.88, with precision holding at " +
      "0.94-0.95 in both configurations. Recall roughly doubles at no precision cost, which is the " +
      "whole argument for layering. " +
      "TWO HONEST CAVEATS: (1) the 0.88 was reached with a FRONTIER semantic lens — the same slot " +
      "filled by a sovereign model is architecturally supported but NOT yet proven, because a " +
      "cold-load timing artifact (first call per model exceeds a short timeout and returns empty) " +
      "produced false zeros that were correctly diagnosed as harness error rather than published as " +
      "capability. (2) n=40 is above no threshold that matters here; treat as directional.",
  },
  {
    id: "oversight-eye",
    name: "Oversight eye — consensus health",
    status: "MEASURED",
    what: "Is the hive's agreement itself healthy, or is a verdict resting on too few voters?",
    detail:
      "Emits a live meta-signal per verdict (voters, flagged, quorum_ok). It is explicitly NOT a " +
      "voting member — an earlier version described it as one while the code never called it, which " +
      "made the claim false and the component dead. It now measures consensus health and is labelled " +
      "as a meta-signal. Recorded here because a component that was loaded-but-never-invoked is " +
      "exactly the failure this estate is built to catch.",
  },
  {
    id: "signing-chain",
    name: "Attestation signing chain",
    status: "MEASURED",
    what: "Is every published result bound to a signature that can be recomputed?",
    detail:
      "Ed25519 today, ML-DSA-65 (FIPS 204) for post-quantum durability. The chain is recomputable " +
      "from published inputs — the claim is verifiability, not trust.",
  },
  {
    id: "endpoint-auth",
    name: "Inference endpoint authentication",
    status: "MEASURED",
    what: "Can an unauthenticated caller bill inference to us?",
    detail:
      "No. The serving endpoint binds to localhost and a token gate holds the public port; an " +
      "unauthenticated request returns 401. This was NOT true earlier today — the endpoint was " +
      "open, and it is recorded here because a security page that only lists its wins is not a " +
      "security page.",
  },
];

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const id = url.searchParams.get("surface");
  const selected = id ? SURFACES.filter((s) => s.id === id) : SURFACES;
  if (id && selected.length === 0) {
    return new Response(
      JSON.stringify({ error: "unknown surface", known: SURFACES.map((s) => s.id) }, null, 2),
      { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  const measured = selected.filter((s) => s.status === "MEASURED");
  const body = {
    schema: "csoai.security-posture/0.1",
    issuer: "CSOAI Ltd (GB, Companies House 16939677)",
    hive: "asisecurity.ai — the security hive is its own product; CSOAI measures it",
    note:
      "Measurement, not certification. This is a posture surface, not an assurance claim about any " +
      "third-party system. Where a run is in progress its grader may not yet be validated, and no " +
      "score is published until it is — a number published ahead of its grader is how the first " +
      "red-team board became a retraction.",
    totals: {
      surfaces: selected.length,
      measured: measured.length,
      in_progress: selected.filter((s) => s.status === "IN_PROGRESS").length,
      spec: selected.filter((s) => s.status === "SPEC").length,
      scores_published: selected.filter((s) => typeof s.score === "number").length,
    },
    surfaces: selected,
    limitations: [
      "Every measured axis here is below usable_n = 30, so no confidence interval is published — including ours.",
      "The adversarial red/blue run publishes NO score: its judge is not yet validated against the gold worksheet.",
      "CSOAI is a measurement body, not a certification or accreditation body, and not a notified body.",
    ],
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "access-control-allow-origin": "*",
    },
  });
};
