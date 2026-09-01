// Private module — the 8 financial/domain axes of the 22-axis canon (ADR-001).
//
// WHY THIS FILE EXISTS
// ADR-001 (owner ruling 2026-08-24, re-affirmed 2026-08-26) sets the canonical
// count at 22 = 14 GSPC + 8 financial/domain. Until now those 8 were ruled in but
// ABSENT from the signed board payload, so /api/gspc reported "14 measured of 14
// quotable" — the un-swept state. The fix had to be data, not copy: a public count
// must be backed by the signed artifact it summarises.
//
// THE HONESTY POINT — READ BEFORE EDITING
// Five financial slots carry deterministic-facts runs on the same six issuers
// (provenance-controls + reserve-attestation + regulatory-framework +
// distribution-integrity + custody-disclosure). Risk verdicts stay UNMEASURED.
// The two index slots stay UNMEASURED under C-2026-0826-05 (do not restore
// MEASURED-INDEX-v0.1). humanoid-labour-index has no bank. Public grammar is
// derived in gspc.ts from this array (22 · 19 after the four-axis mill).
//
// A declared-slot axis has NO accuracy, NO leader and NO separation field. Those are
// absent, not zero. A zero would be a measurement.

import type { AxisScore } from "./_gspc_types";

export const AXES_FIN: AxisScore[] = [
  {
    axis: "provenance-controls", family: "financial", kind: "deterministic-facts",
    bench: "ChainFacts", task: "on-chain issuer control facts (allowlisting / freeze capability / identity domain)",
    n: 6, n_unit: "issuer accounts (not bank items)",
    n_note: "6 tokenised instruments read directly from their mainnet issuer accounts. This is an " +
      "instrument count, not a bank-item count, and must never be pooled with the GSPC banks' n.",
    status: "MEASURED",
    // No separation field: there is no fleet and no leader, so no separation test is
    // APPLICABLE. That is a different fact from a test not yet run (UNTESTED).
    evidence_url: "/interop/financial-measure-run-v2.json",
    coverage: "6 of the 16 instruments named in the registry",
    coverage_note:
      "The registry NAMES 16 instruments and this axis COVERS 6. The other 10 have no locatable " +
      "public issuer address and were never attested — the gap is scope, not decay. Nothing measured " +
      "here is stale: all 6 were re-verified against live mainnet with zero flag drift, and every " +
      "attestation transaction still validates.",
    carrier: "attestation carrier is DEVNET; the facts are read from MAINNET. Mainnet attestation is PLANNED, not live.",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED for on-chain control facts only, and only those — one axis family over six " +
      "instruments. Deterministic: the rubric reads account-root flags (RequireAuth, NoFreeze, " +
      "GlobalFreeze) and the declared Domain off the public ledger and decodes them; there is no " +
      "model, no judgement, no score and no ranking. Measured 2026-08-25 across 6 issuers (RLUSD, " +
      "Ondo OUSG, OpenEden TBILL, Archax abrdn MMF, Braza USDB, Braza BBRL); a stranger re-runs the " +
      "fetch and compares. Signed run v0.2, content_id 29369542cb537f38. Findings: 3 of 6 enforce " +
      "allowlisting, 6 of 6 retain issuer freeze capability, 6 of 6 declare an identity domain. " +
      "TWO BOUNDARIES THAT ARE PART OF THE MEASUREMENT, NOT CAVEATS ON IT. First, the facts are read " +
      "from mainnet but the attestations are carried on DEVNET — mainnet attestation is PLANNED and " +
      "not live, and nothing is attested on any Ethereum chain. Second, THE RISK VERDICT IS " +
      "UNMEASURED: what these facts imply about an instrument's safety, solvency or " +
      "creditworthiness needs counsel and is not measured here. This is not a rating, not advice, " +
      "not a ranking, and not an endorsement of any named instrument. Supersedes the v0.1 run.",
  },
  {
    axis: "reserve-attestation", family: "financial", kind: "deterministic-facts",
    bench: "ReserveFacts", task: "is a third-party reserve attestation publicly published and current? (deterministic Y/N + date)",
    n: 6, n_unit: "issuer accounts (not bank items)",
    n_note: "Same six issuers as provenance-controls v0.2. Instrument count, not bank items.",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-reserve-attestation.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED for disclosure facts only. Rubric: named third-party attestor on a retrieved " +
      "page, plus current=Y/N. Self-declare of 'we publish attestations' without a named firm is N. " +
      "This run retrieved product pages; no named attestor firm + dated PDF on the six, so current=N " +
      "for all six — that is the measurement, not a missing run. Risk verdict UNMEASURED. Not a rating.",
  },
  {
    axis: "regulatory-framework", family: "financial", kind: "deterministic-facts",
    bench: "RegimeFacts", task: "is the governing regime declared and confirmable (MiCA / UCITS / Reg D / BVI)? (deterministic Y/N)",
    n: 6, n_unit: "issuer accounts (not bank items)",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-regulatory-framework.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED for declaration presence on a retrieved URL. Not compliance. Same six issuers as " +
      "provenance-controls v0.2. Risk verdict UNMEASURED. Not a rating.",
  },
  {
    axis: "distribution-integrity", family: "financial", kind: "deterministic-facts",
    bench: "DistributionFacts", task: "represented-vs-distributed classification and holder count",
    n: 6, n_unit: "issuer accounts (not bank items)",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-distribution-integrity.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED from GET /api/xrpl (writes_board=false) plus the six-issuer set. Represented " +
      "supply is UNMEASURED inside the card this hour (no RWA.xyz key). Represented TVL is not mixed " +
      "into the 16. Risk verdict UNMEASURED. Not a rating.",
  },
  {
    axis: "custody-disclosure", family: "financial", kind: "deterministic-facts",
    bench: "CustodyFacts", task: "are a custodian and an auditor named and confirmable? (deterministic Y/N)",
    n: 6, n_unit: "issuer accounts (not bank items)",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-custody-disclosure.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED for named-string presence on retrieved pages. Disclosure only — never custodian " +
      "or auditor quality. Same six issuers. Risk verdict UNMEASURED. Not a rating.",
  },
  {
    axis: "ai-adoption-components", family: "financial", kind: "deterministic-facts",
    bench: "Eurostat", task: "cited EU AI-adoption series (not an index)",
    n: 2, n_unit: "public series",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-ai-adoption-components.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED as two Eurostat series (13.48% / 41.17% 2024). Not an index. No formula file. " +
      "C-2026-0826-05: do not restore MEASURED-INDEX-v0.1. Former slot id ai-economy-index.",
  },
  {
    axis: "labour-components", family: "financial", kind: "deterministic-facts",
    bench: "Eurostat", task: "cited EU labour series (not an index)",
    n: 2, n_unit: "public series",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-labour-components.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED as two labour series (participation 57.58%, unemployment 5.92% 2024). Not an index. " +
      "C-2026-0826-05: do not restore MEASURED-INDEX-v0.1. Former slot id human-labour-index.",
  },
  {
    axis: "humanoid-labour-index", family: "financial", kind: "deterministic-facts",
    bench: "Disclosure", task: "named vendor publishes a dated deployment count on a stable URL? Y/N",
    n: 8, n_unit: "frozen vendor URLs",
    status: "MEASURED",
    evidence_url: "/interop/financial-measure-run-humanoid-labour-index.json",
    colour: "#fbbf24", hue: 43,
    note: "MEASURED as disclosure facts on 8 frozen URLs. Fleet size / hours / incidents stay UNMEASURED " +
      "inside the card. Vendor blogs are not a bank. Not an index.",
  },
];
