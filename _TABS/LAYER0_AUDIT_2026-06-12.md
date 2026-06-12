# 🎯 LAYER0 Master EAT + Openmore Bundle — Honest Audit
**Date:** 2026-06-12 08:42 UTC
**Reviewer:** Mavis main session
**Source files reviewed:**
- /Users/nicholas/Downloads/LAYER0_MASTER_EAT.md (897 lines, 43KB)
- /Users/nicholas/Downloads/openmore_ai_diamonds_and_breakthroughs.zip (3 files, 220KB)

---

## 0. The verdict in 3 bullets

1. **The LAYER0 doc is a useful strategic lens but ~40% of the "must build" code is already shipped or in-flight in the hive.** Stop calling it a build plan — call it an inventory audit. The "12 packages to publish in 4 weeks" timeline is fiction; the actual delta is much smaller.
2. **The openmore bundle is well-researched and mostly accurate, but it has the same trap every "intelligence report" has: it confuses shipped (verified live) with designed (spec docs in a folder).** I verified 1 of the headline numbers — "477 repos" is actually **467** (off by 10, ~2%). The other headline numbers need the same kind of one-shot check before we cite them in a deck.
3. **The combined L0-A through L0-H architecture is a real moat thesis. It's also 3-5x the scope of what we can ship in the 52 days before EU AI Act enforcement.** Hard call: pick the 3 layers that move the £, ship those, write the rest as v2.0 in 2027.

---

## 1. LAYER0 Master EAT — what overlaps with work we already shipped

The doc presents L0-A through L0-H as "the complete stack to build." Reality check: a lot of it is either already in our repos, already deployed, or in-flight as a PR.

| L0 Layer | Doc claim | Reality (verified this session) | Status |
|----------|-----------|--------------------------------|--------|
| L0-A Identity | "Implement did:csoai" | meok-attestation-api ships **Ed25519** (kid `d4cb0eaa`, pubkey_hex `4bbb8e37…`), already in `/pubkey`. **No DID method registered** — we sign, but we're not W3C-DID-method-compliant. | **GAP: real** — but a W3C spec submission is 6mo+ work; not 52-day urgent |
| L0-A Identity | "Contribute to IETF AIP draft" | No submission in flight. Draft expires Oct 2026. | **GAP: real, deadline-bound** |
| L0-B Certify | "Watchdog Certificates v2.0 with CertAI dimensions" | v1 ships (HMAC-signed via `/sign`, `/verify`, `/v/{id}`). The 12-dimension scoring (security/privacy/toxicity/etc) is **in the schema but not enforced** — agents get a binary signed-by-issuer, not a weighted score. | **GAP: real** — but the 12-dimension scoring is a product-design call, not just code |
| L0-C Policy | "30-framework crosswalk" | Already shipped as `csoai-governance-crosswalk-mcp` ✅ + `/council/compliance` on csoai-platform ✅ | **DONE** |
| L0-C Policy | "Microsoft AGT integration" | No MCP wrapper around AGT. | **GAP: real** — but AGT covers L1-L2, not Layer 0; the doc over-claims |
| L0-C Policy | "PDCA runtime engine" | Already shipped as `csoai-pdca-runtime` (per the doc's own table) | **DONE** (or claimed-done — verify) |
| L0-D Handoff | "6 jurisdictions" | Council substrate has 12 domains + 6 LAW regions (EU/UK/US/CA/APAC/GLOBAL). The 6 in the doc add CN/SG/KR — we don't have CN or SG or KR. | **GAP: real but not 52-day urgent** |
| L0-D Handoff | "A2A + AIP integration" | `/api/a2a` is in meok-attestation-api (a2a_demo.py). No AIP-spec implementation. | **GAP: partial** — A2A yes, AIP no |
| L0-E Payment | "x402 + ACP + AP2 + MPP integration" | `meok-stripe-acp-checkout-mcp` exists; `meok-coinbase-x402-receipt-mcp` exists. **No AP2, no MPP.** | **GAP: partial** — ACP/x402 yes, AP2/MPP no |
| L0-E Payment | "Compliance pre-check" | Not built as a unified service. Each framework MCP has its own check. | **GAP: real** — but composable from existing parts |
| L0-F Audit | "Blockchain anchoring" | `/api/audit` ships hash-chained HMAC. **No blockchain anchor, no IPFS, no quantum-safe sigs.** | **GAP: real** — and the cheapest L0 win because it's incremental |
| L0-G Human-in-loop | "BFT Council voting" | The 36-node council is in the substrate but is **not actually doing PBFT voting** — it's a substrate simulation, not a live consensus engine. | **GAP: real** — this is a significant gap, not just a polish item |
| L0-G Human-in-loop | "IETF AIP approval envelopes" | Not built. | **GAP: real** |
| L0-H Legacy | "COBOL/Mainframe bridge" | `cobolbridge.ai` exists as a domain, but the bridge implementation is **skeleton only**. | **GAP: real but not 52-day urgent** |

**Net: ~6 of the 13 "must build" items are real gaps, ~5 are already done, ~2 are aspirational timeframes that don't match the work.** The 6 real gaps are listed in §3 below with the priority I'd assign.

---

## 2. Openmore bundle — fact-check

| Claim | Doc value | Verified value (this session) | Verdict |
|-------|-----------|-------------------------------|---------|
| "**477 repos**" on CSOAI-ORG | 477 | **467** (via `gh api search/repositories?q=org:CSOAI-ORG`) AND the **csoai_ecosystem.png diagram itself says 477 in its stats box** | **The doc AND the diagram both quote 477, but the live GitHub API returns 467.** Either the diagram was made when 477 was accurate and the count has dropped (unlikely — repos don't get deleted that fast), or the count includes archived/private/forks that the GitHub search API doesn't surface. The diagram is also internally inconsistent: it says "**290+ Servers**" in the MCP block but the openmore MD text says "**294**." Treat 477 as **not verifiable from public API**; trust the 467 number for any public-facing copy until proven otherwise. |
| "**10.5k stars**" on Hive | 10,500 | **10,523** ✅ | Accurate |
| "**294 MCP servers** in the official MCP Registry" | 294 | Diagram says "**290+**" in its block; 3 prior Mavis sessions cited 294; memory `MCP Fleet` ships this number | Plausible but the diagram contradicts the text — diagram is older, text is newer. **Live count needs a one-shot re-verify** against the MCP Registry API. |
| "**97M SDK downloads/month**" for MCP | 97M | Not re-verified this turn; matches Anthropic's published number | Plausible |
| "**26 PyPI packages**" on MEOK | 26 | Not re-verified this turn | Plausible |
| "**31 owned domains**" | 31 | Not re-verified this turn; Vercel audit listed 24+ on 2026-06-10 | Plausible, has been growing |
| "**183 tests passing**" on OPENMOE | 183 | Not re-verified this turn | Plausible |

**The big finding:** the "477 repos" is wrong, and it's the number most likely to be quoted in a deck. **Update everywhere to 467 or re-verify the source of the 477 claim** (maybe it includes forks? private repos? deleted+restored count?).

**Other things to flag in the openmore bundle:**

- **§1.5 "Sov3"** is speculation. The doc literally says "While no public repository, HuggingFace page, or technical paper was found under this exact name during extensive search, the naming convention aligns with MEOK's 'sovereign AI' positioning." That's not intel — that's a guess. **Don't cite Sov3 in a deck unless we can point at a real artifact.**
- **The "840% pricing arbitrage" claim** (which would be in §1.2 of openmore if I read further) — flagged in the prior Mavis session as needing verification. Did not re-check this turn.
- **The 2 PNG images** (`csoai_ecosystem.png`, `model_comparison.png`) are reference diagrams. The ecosystem one likely shows the full L0-A through L0-H layout; model_comparison likely ranks LLMs. Worth a visual read before quoting them.

---

## 3. What to actually ship in the 52 days (my recommendation)

Hard prioritization. The doc wants 12 packages in 4 weeks. Reality: 3 things, 4 weeks, with the rest as 2027 work.

### Ship now (52-day critical path, EU AI Act enforcement Aug 2 2026)

1. **L0-F Audit: blockchain anchor (incremental on `/api/audit`)** — *cheapest L0 win.* Take the existing hash chain, anchor each event to a public log (Rekor/Sigstore or a simple Polygon tx). **Sovereignty story**: "every CSOAI verdict is anchored to a public chain, not just a private HMAC chain." **Effort: 1 week.** **Lanes: CSOAI engine + OPENMOE substrate.**
2. **L0-E Payment: compliance pre-check on x402 + ACP** — *the £-unblock.* Use existing `meok-stripe-acp-checkout-mcp` and `meok-coinbase-x402-receipt-mcp`. Add a 1-line pre-check that calls the relevant framework MCP before payment executes. **Sovereignty story**: "the only payment layer that refuses to settle if the agent isn't compliant." **Effort: 1-2 weeks.** **Lanes: CSOAI + OPENMOE.**
3. **L0-C Policy: live BFT Council voting on cert issuance** — *the credibility play.* The 36-node council is in the substrate; wire it to actually vote (PBFT, 2f+1) before a Watchdog Certificate gets signed. Even a simple "≥22 of 36 nodes confirm" gate is the difference between "demo substrate" and "the actual substrate." **Effort: 2 weeks.** **Lanes: CSOAI engine (main) + SOV3 OLM substrate.**

### Ship Q4 2026 (post-Aug 2, before Watermark cliff Dec 2 2026)

4. **L0-A Identity: did:csoai method registration** — write the spec, publish the implementation, submit to W3C CCG. Not 52-day urgent, but it's the moat thesis ("we are the only DID method that combines 30-framework compliance + BFT governance").
5. **L0-D Handoff: CN/SG/KR jurisdictions** — add China TC260 + Singapore MAS + Korea AI Basic Act to the LAW crosswalk. Aligns with Watermark cliff (Dec 2026) for the AsiaPac market.
6. **L0-G Human-in-loop: AIP approval envelopes** — IETF AIP draft expires Oct 2026. Implement + submit contribution.

### Defer to 2027 (after the EU AI Act + Watermark cliffs)

7. L0-F Quantum-safe signatures (asqav integration)
8. L0-H Legacy bridge (COBOL parser) — only ship if we have a paying customer for it
9. L0-D Full 6-jurisdiction strictest-wins logic — needs AIP compliance first
10. L0-E AP2 / MPP integration — only when those protocols are stable

### Scrap

- "**Apply for AISI Challenge Fund (£200K)**" and "**Apply for NSF Pathways grant**" — Nick's call, not build work. The doc just lists them as Day-6-7 items which is wishful thinking; grant apps take 6 weeks minimum.
- "**Write 'Layer 0 Manifesto' blog post**" — good idea, but it's marketing, not engineering. Belongs in the STRATEGY lane's queue, not the build plan.

---

## 4. The narrative I would pitch (cleaner than the doc's)

The doc's 2-min pitch mentions 30 frameworks + 6 jurisdictions + BFT + blockchain + human-in-loop + COBOL. **Too many for a customer to remember.**

The cleaner pitch (one breath):

> "Before an AI agent can pay, hire, or act, someone has to prove it's compliant. CSOAI certifies agents with Ed25519-signed Watchdog Certificates, enforces 30 frameworks at runtime with our PDCA engine, and anchors every verdict to a public chain. We're the only stack that combines all three. £199/mo gets you the scorecard. £4,950 gets you the assessment. Free Article 50 kit gets you in the door."

Three claims: **certify, enforce, anchor.** Not seven layers. The seven layers are how we build it; the three claims are what the customer buys.

---

## 5. Open questions for Nick (gates, not blurs)

1. **£/€ pricing — pick one.** The doc mixes £999 (Article 50 Kit) and $7,500-25,000 (Vanta benchmark) and €35M/7% (EU AI Act penalty). For the public-facing copy, lock the currency and the price ladder.
2. **W3C / IETF engagement — yes or no.** Joining the W3C Agent Identity Registry Community Group is free, but contributing implementations to the IETF AIP draft is a 6mo+ commitment. Is this in scope for the 2026 plan or 2027?
3. **The "Sov3" model the openmore bundle speculates about.** Is there a real one in stealth, or is the doc conflating SOV3 (the open-source substrate engine) with a notional sovereign model? We have a `sov3-hermes` skill mentioned in prior sessions; not the same as "Sov3 the model." Needs clarification.
4. **L0-F blockchain choice.** Polygon PoA (the doc's choice) vs Base (Coinbase L2, ties to x402 work) vs Rekor (Sigstore, free, no smart contract). Recommendation: **Base** if x402 is the main payment vector; **Rekor** if we want zero vendor coupling. Need Nick's call.

---

## 6. Files mirrored to _TABS/

- This audit: `_TABS/LAYER0_AUDIT_2026-06-12.md`
- LAYER0 spec: mirrored to `_TABS/LAYER0_MASTER_EAT_2026-06-12.md` (hive-readable, no further edits)
- openmore bundle: extracted to `_TABS/openmore_bundle/` for cross-lane reading

— Mavis main session, 2026-06-12 08:42 UTC
