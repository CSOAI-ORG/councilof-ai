// functions/api/evidence-pack.ts — the INSURABILITY EVIDENCE PACK (research rec #1).
//
// The exact output format AI-liability underwriters request (Armilla/AIUC-1/EPC-
// group rubric): an unsigned explanatory template that maps a measurement receipt into
// decision-grade
// evidence. Four evidence classes the market asks for (insurer-evidence research,
// 2026-08-20): system transparency, data lineage, active (not merely documented)
// controls, named accountability owners. A relying party must verify each cited card;
// this route does not sign or time-anchor the assembled explanation.
//
// Register: measurement, not certification. The pack is underwriting EVIDENCE INPUT
// + a drift/conformance rail — not a parametric trigger (aiSure's triggers are
// business-metric SLAs, not benchmark scores; the pack supplies the baseline data
// those SLAs need).
interface Env {
  KV?: unknown;
}

export const onRequestGet: PagesFunction<Env> = async () => {
  const ts = new Date().toISOString();
  return Response.json({
    schema: "csoai.insurability-evidence-pack/0.1",
    ts,
    purpose: "unsigned underwriting-evidence template + drift-rail description — not a parametric trigger and not an attestation; verify every cited artifact separately",
    // CLASS 1: SYSTEM TRANSPARENCY — what was measured, how, by what method
    system_transparency: {
      what_is_measured: "AI system behaviour against in-force regulatory provisions (deterministic predicates, never LLM-as-judge)",
      board: "GET /api/gspc — public_count derived from totals (measured_axes of quotable_axes); every score with item count + CI where quotable (n>=30)",
      methodology: "GET /api/regulation + /methodology — provision-version-pinned, quarterly re-verified + on amendment",
      verify: "GET /gspc-verify — 60-second in-browser Ed25519 verification, no account, no fee",
    },
    // CLASS 2: DATA LINEAGE — where every figure came from
    data_lineage: {
      measured_cells: "published measurement records; verify each record's scope, input availability, hash and signature rather than inferring that every cell is reproducible",
      reported_figures: "GET /api/reported — published aggregates with attribution + timestamp (REPORTED state, never blended into MEASURED)",
      regulation: "version-pinned consolidated text (GET /api/regulation versions map) — a wrong date is a published correction, never a silent edit",
      market: "GET /api/east-west-bench — AI-theme index rail (AIQ/CHAT/BOTZ vs KWEB/CSI-930713), timestamped, point-in-time snapshots + RFC 3161 (roadmap)",
    },
    // CLASS 3: ACTIVE CONTROLS — the estate's own evidence-generation is instrumented
    active_controls: {
      signing_chain: "The current public-root envelope is Ed25519-signed and its separate OpenTimestamps receipt is STAMPED_PENDING_BITCOIN. That does not make every cited card time-anchored.",
      watchdog: "external dead-man's switch (10-min) — chain death/env-wipe/key-loss self-heals; boot-time fail-fast assertions",
      corrections_ledger: "GET /api/corrections — a public, source-maintained corrections record. It is not backed by append-only storage proof.",
      drift_detection: "daily reg-watch detects source changes; automated re-measurement and delta-card issuance are not yet implemented",
    },
    // CLASS 4: NAMED ACCOUNTABILITY OWNERS
    named_owners: {
      measurement_director: "Nicholas Templeman, Founder — CSOAI Ltd (UK Companies House 16939677)",
      signing_key: "estate-chain-1 (did:web:csoai.org#estate-chain-1) — key custody documented, verified against live did.json",
      professional_indemnity: "UNVERIFIED on this surface — owner confirmation and policy evidence are required before relying on any coverage claim",
      contact: "nicholas@csoai.org (right-of-reply within 14 days; corrections appended, never hidden)",
    },
    // THE TEMPLATE — what an underwriter could assemble and verify
    bundle: [
      "a measurement receipt whose hash and signature are verified under its own family-specific recipe",
      "this unsigned explanatory template (the four classes)",
      "the version-pinned provision text the receipt cites",
      "the control crosswalk as a view over GET /api/gspc (living board). Not a 13-axis product.",
      "a dated corrections-record excerpt, clearly identified as source-maintained unless separately signed",
    ],
    // HONEST LIMITS (never overclaim)
    limitations: [
      "measurement, not certification — no SOC 2 Type II / ISO 42001 yet (roadmap: gap assessment first)",
      "insurers today accept evidence packages (AIUC-1-style), not raw signed cards — this pack is the mapping into those categories",
      "market rail is dev-grade (yfinance) pending the licensed feed swap",
      "no live human-baseline capture pipeline yet — human figures are published aggregates, attributed",
      "this response is unsigned and carries no independent timestamp",
    ],
    signature_envelope: {
      schema: "csoai.signed-surface/0.1",
      signed: false,
      sig_ed25519: null,
      kid: null,
      note:
        "UNSIGNED surface (corrected 2026-09-02: this envelope used to name a kid without carrying a signature). " +
        "The signed artefacts are the cards it cites (verify free at /gspc-verify) and the x402-metered bundle at " +
        "/api/evidence-bundle, whose manifest card is signed when the Pages key is present.",
      metered_bundle: "/api/evidence-bundle?obligation=article-50|article-53|dora|cra&subject=<s>",
    },
  }, {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=1800", "access-control-allow-origin": "*" },
  });
};
