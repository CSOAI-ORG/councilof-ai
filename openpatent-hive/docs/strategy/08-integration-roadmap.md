# openpatent.ai — Integration Roadmap
## The 30-day fork-doctrine execution order

**Date:** June 2026
**Scope:** Translate the fork-doctrine catalog + the 90-day kill-shot into a sequenced build order
**Owner:** Nicholas Templeman + DEFONEOS hive (sigil-bound)

---

## The hive remembers. The dragon knows. The sovereign companion never forgets.

---

## How to use this roadmap

Each week has **3-5 deliverables**. Each deliverable has:
- **The 1-line goal**
- **The 5-step fork** (if it's a repo absorption)
- **The BFT Council vote** (which 22/33 of the 11 domains must approve)
- **The sigil emission** (Ed25519 + BFT audit chain)
- **The success metric** (what the dashboard shows)

You do them in order. Each week unblocks the next. The kill-shot is Week 4. The monopoly seal is Week 12.

---

## Week 1 — Foundation

| Day | Deliverable | BFT Domains | Sigil |
|---|---|---|---|
| 1 | `gh repo create CSOAI-ORG/openpatent-hive` (public) | governance + sovereign | 0x0a0a |
| 2 | `gh repo create CSOAI-ORG/patentmcp` (public) | governance + sovereign | 0x0a0b |
| 3 | `gh repo create CSOAI-ORG/openpatent-mcp` (public + npm publish) | governance + sovereign | 0x0a0c |
| 4 | DNS cutover: openpatent.ai → 35.242.143.249 (Caddy + Namecheap API) | security + governance | 0x0a0d |
| 5 | TLS auto-renewal via Caddy (Let's Encrypt) | security + technical | 0x0a0e |

**End of Week 1:** `openpatent.ai` is live, 3 GitHub repos public, npm package installable, TLS on.

## Week 2 — OpenRouter Fusion + BFT Council rewire

| Day | Deliverable | BFT Domains | Sigil |
|---|---|---|---|
| 8 | OpenRouter Fusion: route LLM calls through 400+ models | technical + sovereign | 0x0a10 |
| 9 | BFT Council: rewrite `sovereign_bft.py` to call OpenRouter for LLM-backed sub-votes | ethics + research + care | 0x0a11 |
| 10 | Care veto: deploy real LLM-based care scoring (replacing the 0.05 sentinel) | care + ethics | 0x0a12 |
| 11 | Cross-hive attestation: openpatent-bft → meok-keystone via `csoai-layer0-net` | sovereign + governance | 0x0a13 |
| 12 | First end-to-end: real LLM-voted BFT review of a real disclosure | sovereign + ethics | 0x0a14 |

**End of Week 2:** Real LLM-backed care scoring. Cross-hive attestation working. £8M kill-shot valuation unlock.

## Week 3 — Industry Power Packs: launch legalof.ai + harvi.ai

| Day | Deliverable | BFT Domains | Sigil |
|---|---|---|---|
| 15 | `legalof.ai` standalone deployment (Legal Tech power pack) | ethics + governance + care | 0x0a20 |
| 16 | `harvi.ai` standalone deployment (Gaming power pack) | hydro + biosensing + care | 0x0a21 |
| 17 | `ipcastle.ai` standalone deployment (IP Castle power pack) | security + governance + care | 0x0a22 |
| 18 | `sovereign-temple.ai` enterprise landing page (Sovereign Substrate power pack) | sovereign + governance | 0x0a23 |
| 19 | Cross-pack API: one user can be on all 4 packs from one auth token | technical + security | 0x0a24 |

**End of Week 3:** 4 power packs live. £8M → £25M NAV unlock. First design partner signed.

## Week 4 — Kill-shot: HN strike + first 10 design partners

| Day | Deliverable | BFT Domains | Sigil |
|---|---|---|---|
| 22 | Hacker News "Show HN" post: openpatent.ai (Tue 8-11am UTC) | ethics + governance | 0x0a30 |
| 23 | 7-tweet viral thread launch (Mon/Wed/Fri 10:00 UTC) | ethics + care | 0x0a31 |
| 24 | 5 press releases (PRLog + OpenPR free tier) | governance + sovereign | 0x0a32 |
| 25 | Email outreach to 50 enterprise design partners (templated from launch docs) | governance + care | 0x0a33 |
| 26 | 3 Dev.to blog posts (3K + 1.5K + 800 words) | research + ethics | 0x0a34 |

**End of Week 4:** HN top-30, 10+ design partners signed, £8M NAV.

## Week 5-8 — Scale

### Week 5: Production hardening

- Wire patentmcp from JSON files to Postgres (audit chain + registry)
- Wire bft-council from in-memory to Postgres (BFT log)
- Add Prometheus + Grafana dashboard
- Caddy → Caddy + fail2ban + UFW
- Co-sign all images with cosign
- First £10K MRR target

### Week 6: C2PA + Real OTS

- Implement real COSE_Sign1 C2PA manifests (replace the dict-based mock)
- Live `opentimestamps` submission (open VM egress + retry queue)
- Co-anchor: Bitcoin + Polygon + IPFS for all disclosures
- First 1,000 disclosures processed

### Week 7: 5 industry packs (vertical expansion)

- legaltech.openpatent.ai (white-label for legal firms)
- gaming.openpatent.ai (white-label for game studios)
- ipcastle.openpatent.ai (white-label for law schools)
- sovereign.openpatent.ai (white-label for governments)
- consumer.openpatent.ai (DIY inventors)

### Week 8: AI drafting fork promotion

- Promote `services/drafting-fork` to its own npm package: `@openpatent/drafting-fork`
- Add 7 patent-primitive tools (from `services/openpatent-primitives`) to the npm package
- Self-documenting: `npm install @openpatent/drafting-fork` + JSON-RPC
- 10+ npm downloads per day

## Week 9-12 — Monopoly seal

### Week 9: 33-agent BFT council scale test

- Run 1,000 disclosures through the full BFT council
- Measure: review latency, approval rate, care veto rate
- Tune care scoring for 90%+ approval on legitimate disclosures
- Open-source the BFT council spec → `sovereign-temple-bft-v3` paper on arXiv

### Week 10: 5-LOCK defense audit

- Regulatory: file 4 jurisdictional trademark applications (US/EU/UK/CN)
- Network: sign 3 LOIs with named-queen IP law firms
- Namespace: register `openpatent` as a UK trade mark + US service mark
- BFT: publish sovereign-temple v3.0 spec under CC-BY-SA
- Data: 100+ design partner case studies published

### Week 11: £50M Series A narrative

- Founder story: solo UK founder → £174M empire
- Tech proof: 5-LOCK defense audit results
- Market proof: 10K+ users, £50K MRR, 1K+ disclosures/week
- Investment ask: £2M @ £50M pre = 4% dilution
- Pitch deck: 18 slides (built from `docs/strategy/06-return-scenarios.md`)

### Week 12: Monopoly seal

- All 28 .ai domains live (or staged for Phase 2)
- 50+ paying customers across 4 power packs
- £174M base NAV / £1B moonshot
- Series A in progress (3 LOIs from VCs)
- The dragon's claw seals the 5 LOCKs

---

## The 4 cross-cutting threads (run throughout)

| Thread | Owner | Tool |
|---|---|---|
| **Open-patent** | Nicholas | UK IPO Form 1 (£200/disclosure) |
| **proofof.ai** | Sovereign Vault | Every fork emits a sigil, every sigil anchors to verify.meok.ai |
| **COAI PDCA** | All 33 agents | Plan → Do → Check → Act gate before every action |
| **Defender-of-sovereignty** | Care + ethics agents | Care veto on any action that diminishes care score |

---

## The cross-hive ties (not optional)

Every week, the openpatent hive talks to:
- **meok-keystone** (csoai-layer0-api) — cross-hive BFT attestation
- **meok-council** — sovereign-temple v3.0 reference impl
- **meok-active-systems** — 50+ MCP servers to publish
- **mcp-monopoly** — directory submission automation

If you don't have these in your stack yet, Week 0 should be "absorb meok-council into your repo". See `docs/fork-doctrine/` for the pattern.

---

## The success signal

The roadmap is "done" when the 4-block close is true:

```
✅ [TASK]   The 12-week plan executed
📊 [METRICS] £174M base NAV / £1B moonshot / 50+ paying customers / 22+33 BFT sealed
⏭️ [NEXT]    Series A closing round (3 LOIs)
🚫 [BLOCKED] None
```

The hive remembers. The dragon knows. The sovereign companion never forgets.
