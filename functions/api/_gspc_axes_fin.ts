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
// Owner lock 1 Sep P0: board is **22 axis · 15 measured · 7 empty**.
// ONLY provenance-controls is MEASURED in the financial family (n=6).
// The other seven financial slots are declared-slot UNMEASURED n=0.
// Unsigned 4-axis n30 lives at /interop/ only — NEVER stamp those MEASURED on this board.
// Component/index slots stay UNMEASURED (C-2026-0826-05). humanoid empty until public registry.
// genius.reserve must not cite a 22·22 payload.
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
    axis: "reserve-attestation", family: "financial", kind: "declared-slot",
    bench: "—", task: "is a third-party reserve attestation publicly published and current? (deterministic Y/N + date)",
    n: 0, n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3", hue: 0,
    note: "Slot declared, rubric written, NO RUN. The rubric is deterministic and the intended inputs " +
      "are named (issuer disclosures + RWA.xyz API), but nothing has been fetched, graded or signed, " +
      "so there is no number and none is shown. Published as an open slot so the gap is public rather " +
      "than quietly missing.",
  },
  {
    axis: "regulatory-framework", family: "financial", kind: "declared-slot",
    bench: "—", task: "is the governing regime declared and confirmable (MiCA / UCITS / Reg D / BVI)? (deterministic Y/N)",
    n: 0, n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3", hue: 0,
    note: "Slot declared, rubric written, NO RUN. Intended inputs: RWA.xyz issuer metadata crosswalked " +
      "against /api/locale. Declaring a regime is not complying with it, and this axis would only ever " +
      "measure whether the declaration is present and confirmable — never whether it is satisfied. " +
      "That distinction is why the slot is published before it is measured.",
  },
  {
    axis: "distribution-integrity", family: "financial", kind: "declared-slot",
    bench: "—", task: "represented-vs-distributed classification and holder count",
    n: 0, n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3", hue: 0,
    note: "Slot declared, rubric written, NO RUN. Intended to flag deterministically where the " +
      "represented supply greatly exceeds the distributed supply. The chain reads this needs are the " +
      "same class as provenance-controls' and are achievable; they have not been run.",
  },
  {
    axis: "custody-disclosure", family: "financial", kind: "declared-slot",
    bench: "—", task: "are a custodian and an auditor named and confirmable? (deterministic Y/N)",
    n: 0, n_unit: "nothing measured",
    status: "UNMEASURED",
    evidence_url: "/interop/financial-axes.json",
    colour: "#a3a3a3", hue: 0,
    note: "Slot declared, rubric written, NO RUN. Measures disclosure presence only — that a custodian " +
      "and auditor are named and the naming is confirmable — never the quality of either.",
  },
  {
    axis: "ai-adoption-components", family: "financial", kind: "declared-slot",
    bench: "—", task: "deterministic index over cited public AI-economy series (compute price, investment, adoption, sector output)",
    n: 0, n_unit: "nothing measured — 2 of 4 input components exist, no index computed",
    status: "UNMEASURED",
    evidence_url: "/interop/ai-economy-index.v0.1.json",
    colour: "#a3a3a3", hue: 0,
    note: "CANDIDATE slot, UNMEASURED. Partial bank: the EU enterprise AI-adoption components are live " +
      "from a real Eurostat fetch (isoc_eb_ai, 2026-08-25; all-enterprise adoption 13.48% in 2024). " +
      "Compute-price, AI-investment and sector-output series are BANK GAPS — stated, not filled. With " +
      "half the inputs missing, no index is computed and no index value is published. " +
      "CORRECTION C-2026-0826-05: MEASURED-INDEX-v0.1 was an over-claim. Eurostat components remain " +
      "as reference inputs (13.48% 2024). This slot stays UNMEASURED until the missing series + " +
      "formula are published and a NEW signed card exists. Do not restore the v0.1 sticker. " +
      "Board GET /api/gspc is authority.",
  },
  {
    axis: "labour-components", family: "financial", kind: "declared-slot",
    bench: "—", task: "deterministic index over cited public labour series (employment, hours, wages, displacement)",
    n: 0, n_unit: "nothing measured — 2 of 4 input components exist, no index computed",
    status: "UNMEASURED",
    evidence_url: "/interop/human-labour-index.v0.1.json",
    colour: "#a3a3a3", hue: 0,
    note: "CANDIDATE slot, UNMEASURED. Partial bank: EU participation and unemployment components are " +
      "live from a real fetch (2024: participation 57.58%, unemployment 5.92%). Displacement " +
      "indicators, wage series and worker-hours-by-AI-exposure are BANK GAPS — stated, not filled. No " +
      "index is computed and none is published. " +
      "CORRECTION C-2026-0826-05: MEASURED-INDEX-v0.1 was an over-claim. Participation 57.58% and " +
      "unemployment 5.92% remain as reference inputs. This slot stays UNMEASURED until the missing " +
      "series + formula are published and a NEW signed card exists. Do not restore the v0.1 sticker.",
  },
  {
    axis: "humanoid-labour-index", family: "financial", kind: "declared-slot",
    bench: "—", task: "deterministic index over cited deployment / utilisation series (installed fleet, hours worked, safety incidents)",
    n: 0, n_unit: "nothing measured — no input bank exists at all",
    status: "UNMEASURED",
    colour: "#a3a3a3", hue: 0,
    note: "CANDIDATE slot, UNMEASURED, and the emptiest of the eight: there is NO input bank and no " +
      "live surface. No authoritative public machine series exists for installed humanoid fleet, hours " +
      "worked or safety-incident rates per deployment. The only available data is vendor self-report, " +
      "which is not stranger-recomputable and so cannot ground a measurement. A deployment registry is " +
      "the prerequisite and is NOT BUILT. Carries no evidence_url because there is no evidence to link.",
  },
];
