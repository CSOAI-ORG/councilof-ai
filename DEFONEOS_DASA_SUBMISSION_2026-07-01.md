# DEFONEOS — DASA Open Call Submission (DRAFT · Nick submits)

_Draft for the UK MOD Defence and Security Accelerator (DASA) open call on AI Safety & Assurance. SME-focused, UK Ltd-only, Phase 1 typically £50k–£150k (6–9 months) with a clear DASA Follow-on route to Phase 2 (~£300k–£1M+). Angle: DEFONEOS as the **trust/assurance layer** for AI in defence & critical infrastructure — not a weapons capability. Live proof point: https://os.meok.ai/systemcard.html · registry: https://os.meok.ai/registry.html_

---

## Fit — which open call / theme

Primary: **AI Safety & Assurance** strand of DASA's current open call (DASA challenge themes for 2026/27 explicitly list _"safety + assurance"_ for AI in defence). DEFONEOS is **dual-use by construction**: the identical signed-assurance layer secures AI in defence *and* civilian CNI (energy, water, finance, health, transport). No weapon, no export-control blocker, no platform integration work — it sits **on top of** Anduril / Helsing / Palantir / BAE / in-house stacks.

Secondary fit: **Resilience of critical national infrastructure** — DASA increasingly funds assurance tools for the same civilian systems that JSP 936 and NIS2 / DORA-style obligations now require.

## The one-liner

> **DEFONEOS is the independent, cryptographically-signed assurance layer for AI in critical systems — prove any AI decision was governed, and let anyone verify it offline, forever.**

## Problem (why now, in DASA's own words)

- **DASA's own "Frequently Asked Questions about developing AI for Defence"** (published on gov.uk) calls out that suppliers must produce independent assurance evidence and that **buyers cannot rely on a vendor's self-declaration** — but it gives vendors **no standard format** and **no independent anchor** to publish against.
- **Dstl's "AI Assurance Framework"** (published August 2024, the operational anchor for everything DASA funds in this space) defines the principles (reliability, understandability, traceability, responsibility) — but it is a *framework*, not an *artefact*. Nothing in it tells a supplier how to ship a System Card, Model Card or Registry entry that a third party can **verify offline** without trusting the supplier's portal.
- **DASA's current open-call themes** list **"safety + assurance"** as a priority. The hundreds of bids that land in that inbox right now are PDFs, dashboards, and PDF-rendered "model cards". None of them are cryptographically signed. None of them can be checked offline. None of them survive a vendor going dark.
- **The assurance gap is procurement-shaped, not engineering-shaped.** The MOD has JSP 936, has the Defence AI Centre, has Dstl, and now has the £11M UK assurance fund (Spring 2026). What it does not have is a **portable, vendor-neutral signed primitive** that an SME can ship in 6 months and a prime can consume in 1.

## Solution (what we built, working today)

A signed-assurance layer that sits **on top of** existing AI stacks, not competing with them. Four pieces, all deployed, all verifiable today:

1. **Signed System & Model Cards** — built 1:1 against the Dstl AI Assurance Framework and the DAIC/Turing template. Ed25519-signed, **offline-verifiable** by anyone with the public key (no portal, no vendor uptime, no API key). _(Live: verify them yourself — one tampered byte fails.)_
2. **Signed Card Registry** — the shareable, searchable store the field lacks; the index itself is signed; rotatable to any UK sovereign host (GCS, MOD networks, on-prem). _(Live.)_
3. **Governed substrate** — care-floor + immutable hard-stops (no kinetic targeting / no individual surveillance / no unvoted autonomy) + a 531-hive governed MCP fleet; every action signed.
4. **Post-quantum ready** — ML-DSA-65 for long-term archival integrity (UK NCSC-aligned PQC migration path).

## Why us / why it's credible to DASA

- **Working, verifiable demo now** — DASA's "competence + evidence" reviewers can validate the claim in 30 seconds on a clean laptop: a `verify` pass proves it; a single tampered byte fails. Not slideware.
- **UK Ltd, SME-shaped** — CSOAI Ltd (Companies House **16939677**), founder-built, sized to land a DASA Phase 1 with 2–3 design partners and ship a Phase 2 with primes.
- **Sovereign & vendor-neutral** — no lock-in to any prime, any hyperscaler, any framework; offline-verifiable; portable across UK departments, NATO, Five Eyes, EU.
- **Assurance-not-weapons** — lowers adoption barriers (no export-control case), complements every prime, plugs straight into Dstl's Assurance Framework without rebadging.
- **Honest about gaps** — not yet security-cleared (DEFSTAN 05-029 / UK SC clearance is a DASA-Follow-on workstream, not a Phase 1 dependency); no defence pilot yet (this programme is the vehicle to get one).

## Dual-use (DASA explicitly scores for this)

- **Defence:** JSP 936 / Defence AI Centre assurance; sub-layer for ASGARD-type programmes; signed cards as the audit artefact the Dstl Assurance Framework already wants.
- **Civilian CNI:** the **identical primitive** assures AI in energy / finance / health / water — directly relevant to NIS2, DORA, the UK Cyber Security & Resilience Bill and the AI Bill obligations now arriving.

## Traction / TRL

- **Live public endpoints + verifier** (TRL ~5–6 for the assurance primitive): signing, verification, System/Model Cards and the registry are deployed and independently checkable today.
- **Sovereign substrate:** 531 MCP hives (313 live on PyPI); Ed25519 signing + offline verification proven.
- **Honest gaps:** no DASA pilot yet; no SC clearance; no Dstl-issued validation memo (this programme is the vehicle to obtain all three).

## Use of DASA Phase 1 funding (£50k–£150k · 6–9 months)

1. **Harden the assurance layer to a defence-grade pilot** — produce the assurance pack DASA and Dstl expect (security review, threat model, deployment runbook, key-management policy).
2. **Run a DASA design-partner pilot** issuing signed cards against a real (or realistic) UK MOD AI use case — chosen with the DASA technical partner so the artefact is directly useful.
3. **Independent validation** of the signed-card primitive with a UK assurance body (Turing / NPL / a Dstl partner) so the Phase 2 DASA Follow-on bid arrives with a signed validation memo, not just a claim.
4. **Open-call ask:** Phase 1 funding + a named DASA Innovation Partner + introduction to the Dstl AI Assurance team + a clear signpost to a Phase 2 bid.

## Answers to typical DASA questions (fill/trim to the form)

- **What problem?** No standard, independent, portable way to prove an AI system in defence / CNI was governed. PDFs and dashboards don't survive a vendor going dark.
- **Your solution?** A signed, offline-verifiable assurance layer (System & Model Cards + Registry) that drops on top of any existing AI stack and answers the Dstl AI Assurance Framework point-by-point.
- **Dual-use?** Yes — same layer for defence AI and civilian critical national infrastructure.
- **Why now?** Dstl AI Assurance Framework (Aug 2024) is operational; JSP 936 is in force; the UK £11M assurance fund is live; DASA's open-call themes list _"safety + assurance"_; EU AI Act high-risk lands 2027; buyers need a portable primitive *now*, not a multi-year standards project.
- **Team?** Solo founder of CSOAI Ltd (Companies House 16939677) + a governed AI substrate; seeking DASA network for defence access + a DASA Innovation Partner + Dstl validation route.
- **Traction?** Live, independently-verifiable demo (System/Model Card + Registry at os.meok.ai) + 313 live packages + signed-open-source lineage to MIT / CC0.
- **Ask?** Phase 1 DASA funding + a named Innovation Partner + Phase 2 signpost.

## Send discipline

Nick submits; I draft only. Personalise to the exact DASA open-call wording before submitting — DASA scorecards reward **"fits this open call, this quarter, with a named partner"**. Lead every reviewer straight to the live verify + tamper demo (the single highest-leverage line in any DASA bid: _"click, it passes; change one byte, it fails"_). Keep the proposal under DASA's page limit; link to this doc and the DIANA sister for the longer pitch if the form allows attachments.