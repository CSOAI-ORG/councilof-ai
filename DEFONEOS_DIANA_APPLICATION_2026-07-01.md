# DEFONEOS — NATO DIANA Application (DRAFT · Nick submits)

_Draft for the NATO DIANA 2026/2027 Challenge Programme. Dual-use, SME-first, up to €300k. Angle: DEFONEOS as the **trust/assurance layer** for AI in defence & critical infrastructure — not a weapons capability. Live proof point: https://os.meok.ai/systemcard.html · registry: https://os.meok.ai/registry.html_

---

## Fit — which challenge
Primary: **Critical infrastructure & resilience / trusted autonomy** (DIANA runs a "critical infrastructure & logistics" challenge and trust/autonomy themes). DEFONEOS is **dual-use by construction**: the same signed-assurance layer secures AI in defence *and* civilian CNI (energy, water, finance, health). No weapon, no export-control blocker.

## The one-liner
> **DEFONEOS is the independent, cryptographically-signed assurance layer for AI in critical systems — prove any AI decision was governed, and let anyone verify it offline, forever.**

## Problem (why now)
- NATO members are fielding AI in defence and CNI faster than they can *assure* it. There is **no standard, independent way to prove an AI system was governed** — and, per the UK MOD's own guidance, **no formal process to validate a supplier's "deployment-ready" claim** and **no central store** for the assurance records.
- Regulation is arriving unevenly (UK JSP 936 in force now; EU AI Act high-risk slipped to Dec 2027) — so buyers need a **portable, vendor-neutral** assurance primitive that works across nations and frameworks.

## Solution (what we built, working today)
A signed-assurance layer that sits **on top of** existing AI (Anduril/Helsing/Palantir/in-house), not competing with it:
1. **Signed System & Model Cards** — built 1:1 to the DAIC/Turing template; Ed25519-signed, **offline-verifiable** by anyone with the public key. *(Live: verify + tamper-test them yourself.)*
2. **Signed Card Registry** — the shareable, searchable store the field lacks; the index itself is signed. *(Live.)*
3. **Governed substrate** — care-floor + immutable hard-stops (no kinetic targeting / no individual surveillance / no unvoted autonomy) + a 531-hive governed MCP fleet, every action signed.
4. **Post-quantum ready** — ML-DSA-65 for long-term archival integrity.

## Why us / why it's credible
- **Working, verifiable demo now** — reviewers can validate the claim in 30 seconds (verify passes; one tampered byte fails). Not slideware.
- **Sovereign & vendor-neutral** — no lock-in, offline-verifiable, portable across NATO nations.
- **Assurance-not-weapons** — lowers adoption barriers; complements every prime.

## Dual-use
- **Defence:** JSP 936 / Defence AI Centre assurance; prime sub-layer for ASGARD-type programmes.
- **Civilian CNI:** the identical primitive assures AI in energy/finance/health/water — directly relevant to NIS2/DORA-style obligations.

## Traction / TRL
- Live public endpoints + verifier (TRL ~5–6 for the assurance primitive): signing, verification, System/Model Cards, and the registry are deployed and independently checkable today.
- Sovereign substrate: 531 MCP hives (313 live on PyPI); Ed25519 signing + offline verification proven.
- Honest gaps: not yet security-cleared; no defence pilot yet (this programme is the vehicle to get one).

## Use of DIANA support (≤ €300k)
1. Harden the assurance layer to a defence-grade pilot (accreditation prep, security review).
2. Run a **design-partner pilot** issuing signed cards against a real (or realistic) NATO AI use case.
3. Independent validation of the signed-card primitive with an assurance body (e.g. Turing/NPL-type).

## Answers to typical DIANA questions (fill/trim to the form)
- **What problem?** No standard, independent, portable way to prove an AI system in defence/CNI was governed.
- **Your solution?** A signed, offline-verifiable assurance layer (System/Model Cards + registry) on top of any AI.
- **Dual-use?** Yes — same layer for defence AI and civilian critical infrastructure.
- **Why now?** JSP 936 in force; assurance funded (UK £11M fund Spring 2026); EU high-risk lands 2027; buyers need a portable primitive.
- **Team?** Solo founder (Companies House 16939677) + a governed AI substrate; seeking DIANA network for defence access + validation.
- **Traction?** Live, independently-verifiable demo (System/Model Card + registry) + 313 live packages.
- **Ask?** Accreditation-prep + a design-partner pilot + independent validation.

## Send discipline
Nick submits; I draft only. Personalise to the exact open challenge wording before submitting. Lead every reviewer straight to the live verify + tamper demo.
