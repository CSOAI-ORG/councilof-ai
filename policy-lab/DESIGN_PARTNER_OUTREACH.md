# CSOAI Design-Partner Outreach — Raise-Unlock Package
**Author:** Claude · **Date:** 2026-06-22 · **Status:** ready to run · **Companion:** `CLAUDE_13DAY_LAUNCH_ONEPAGER_2026-06-22.md`

> Honesty register: every claim below is from a verified source or an experiment that actually ran and was signed. In-simulation results are labeled as such. No fabricated metrics. Weaknesses are owned.

---

## 1. Why this is different from a demo ask

A standalone demo generates applause; a design partner generates a term sheet. Named sitting GPs on record (Wing VC, Work-Bench) say the same thing: what unlocks a 2026 raise is a customer using the product in **real day-to-day production who will take a reference call** — "revenue without narrative is a feature; narrative without traction is vaporware — you need both." So the artifact we are chasing is not a sharper demo; it is **one regulated firm running our attested Policy Lab on their own compliance question and vouching for it to an investor.**

## 2. The re-sequence (the actual strategic move)

The 13-day plan puts design-partner outreach at Days 12–13. That is backwards. This is the **longest-lead** item in the plan (weeks of relationship work) and the **least auto-fireable** (it is Nick's relationship, not a script). Everything else — engine PoC, watchable view, proof assets, video cuts — is something Claude or a script can execute. **Start the design-partner track on Day 1, in parallel with the engine work.** The engine gets built while the first call is being booked; the two tracks meet when the partner runs their experiment on the now-hardened ledger.

## 3. What makes a GOOD design partner for CSOAI

A good partner is not the biggest logo; it is the firm where all four are true:

- **Regulated under an in-force framework** — DORA (in force 17 Jan 2025; critical ICT third-party providers designated Nov 2025), NIS2 (transposition Oct 2024; active EU enforcement), or GDPR. *Not* the EU AI Act high-risk (Annex III moved to ~2 Dec 2027, Annex I to ~2 Aug 2028 — no "Aug 2 2026 countdown"; that is a known recurring error, kill it).
- **Feels real pain on a specific, named compliance question** — a concrete reporting/control obligation they spend time or money on today, not "AI governance" in the abstract.
- **Will run the Policy Lab on THEIR question** — give us one real control-vs-treatment scenario from their world to encode; we return a signed, Bitcoin-anchored result.
- **Will take a reference call** for the raise — the single thing that unlocks the round.

**Prospect shortlist (7) — Nick to fill:**
1. `[name — firm, jurisdiction, framework, the pain]`
2. `[ … ]`
3. `[ … ]`
4. `[ … ]`
5. `[ … ]`
6. `[ … ]`
7. `[ … ]`

Rank by: pain concreteness > jurisdiction fit (EU/UK first) > likelihood of vouching > logo size.

## 4. Cold-outreach email template (~150 words, measured, proof-first)

**Subject:** A signed, Bitcoin-anchored answer to one of your DORA/NIS2 questions — no demo required

**Body:**
> [First name],
>
> Most compliance tooling asks you to trust the vendor's dashboard. We do the opposite: every result our Policy Lab produces is Ed25519-signed locally and Bitcoin-anchored via OpenTimestamps, so you can verify a governed-vs-ungoverned outcome existed at a provable time **without trusting us — or any single vendor**. Microsoft's agent audit uses symmetric HMAC (not third-party-verifiable); Asqav signs server-side (not sovereign). We sign locally, offline-verifiable, and the multi-model design means no single model dependency — a point the Jun 12 Fable 5 / Mythos 5 export-control suspension makes timely.
>
> We already ran one experiment: automated DORA incident reporting vs manual review on matched incidents — **4 vs 26 sim-ticks** to initial report, signed and anchored (in-simulation, synthetic, labeled as such; not a compliance claim).
>
> I'd like to run **your** compliance question the same way and hand you the verifiable result. 30 minutes next week?
>
> — Nick

*Discipline: no fabricated detection rates, no TAM, no "Aug 2" urgency. The wedge and the one honest in-sim number do the work.*

## 5. First call — 30-minute agenda

**0–7 min · Their world.** Listen. What compliance obligation actually consumes their time/money this quarter? (DORA incident reporting? NIS2 supplier attestation? GDPR DPIA evidence?) Capture the one concrete scenario.

**7–15 min · Show the proof (honestly labeled).** Screen-share the verifiable anchor: `verify_anchor.py` against a Bitcoin-anchored manifest — a skeptic cross-checks the block merkle root on a public explorer, no CSOAI trust. Then the DORA result: automated 4-tick vs manual 26-tick on 4 matched pairs, signed. State plainly: **in-simulation, synthetic incidents, DORA numerics to-verify against the RTS/ITS, not a compliance determination.**

**15–25 min · The ask, framed as their gain.** "Give us one real scenario from your world. We'll encode it as a control-vs-treatment Policy Lab experiment, run it, and return a signed + Bitcoin-anchored result you can use as evidence." Then the three questions: (a) is this pain real for you? (b) would you run it on your question? (c) if it lands, would you take a 15-min reference call with an investor?

**25–30 min · Close + weaknesses owned.** Acknowledge what we do not yet have: no runtime policy enforcement (we attest, we don't block), no post-quantum signing yet (hybrid Ed25519+ML-DSA is the catch-up). These are the gaps the raise closes. Confirm next step + a date.

## 6. One-page leave-behind (PDF-equivalent outline)

A single page Nick hands the prospect. Sections, one line each:

1. **The wedge in one sentence** — governance no one has to trust us, or any single vendor, to verify: sovereign local Ed25519 signing + Bitcoin-anchored OpenTimestamps proofs (offline + third-party verifiable).
2. **Why it's different** — vs Microsoft Agent Governance Toolkit (symmetric HMAC, not third-party-verifiable) and Asqav (server-side/cloud ML-DSA, not sovereign).
3. **What the Policy Lab is** — a control-vs-treatment compliance experiment engine; each town = one experiment; results signed to a hash-chained ledger and Bitcoin-anchored.
4. **The in-sim result (honestly labeled)** — automated DORA incident reporting: 4 vs 26 sim-ticks to initial report on matched incidents; N=4 pairs; in-simulation, synthetic, not a compliance claim.
5. **The regulatory hook** — DORA (in force), NIS2 (in force), GDPR; we do not sell a moved EU AI Act deadline.
6. **Multi-model / no-single-vendor** — reinforced by the Jun 12 Fable 5 / Mythos 5 export-control suspension.
7. **What you get as a design partner** — your compliance question, run as a signed + Bitcoin-anchored experiment, with a verifiable result you can use as evidence.
8. **What we do not yet have (owned)** — no runtime enforcement (attest, not block); no post-quantum signing yet; in-simulation only, not real-world-validated.
9. **The ask** — one scenario from your world, one reference call for our raise.

*Every figure on this page is reproducible from the published anchors. The leave-behind is a credibility feature precisely because it states its own limits.*

---

*Raise comps to cite in any investor conversation that follows the reference call (real, named, dated): Vijil $17M Nov 2025 (lead with); Braintrust $36M A → $80M B at $800M post; Credo AI $12.8M A. Never cite Axiom Quant's $1.6B for sizing — it is a trap comp (formal code-proving, star-founder megaround), useful only as a "verifiable AI is hot" signal.*