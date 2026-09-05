# CSOAI — IP + Revenue + Automation Master Map

**Date:** 2026-09-03
**Author:** JEEVES (Hermes lane) + Claude Science lane (parallel)
**Question:** How can all our data + value be packaged complete for real IP value and revenue, and all else automated? How can we make what we're mining even stronger?

---

## The four layers — inventory

### Layer 1 — DATA atoms (what we already produce today)

| Atom | Count today | Where it lives | Lane-doable? |
|---|---|---|---|
| 22-axis board card | 22 | `public/signed/board_living.json` | ✓ shipped |
| Per-model × per-axis card | 0 (266 when harvested) | `scripts/badger/harvest-per-model-cards.py` | ✓ built, not yet run live |
| Per-item grade card | 0 (15,580 when harvested) | not yet built | ✓ lane |
| Per-issuer × per-axis card | 0 (~50 when harvested) | not yet built | ✓ lane |
| Corrections before/after pair | 0 (78 when harvested) | not yet built | ✓ lane |
| TIE attestation triple | 0 (~5 when harvested) | not yet built | ✓ lane |
| Witness-receipt binding | 0 (~22 when harvested) | not yet built | ✓ lane |
| HF badge card | 20,550 staged | `scripts/badger/_queue/*.jsonl` | ✓ staged, upload owner-gated |
| A2A probe finding card | 0 (25 when harvested) | not yet built | ✓ lane |
| ERC-8004 live-filter card | 0 (~16-80k when harvested) | not yet built | ✓ lane |
| MCP server conformance card | 0 (~115k when harvested) | not yet built | ✓ lane |
| C2PA manifest card | 0 (uses /api/detect) | not yet built | ✓ lane |
| OTel span hash card | 0 (gated on CSOAI_OTEL) | wired in `functions/mcp/_otel.ts` | ✓ ready, flag owner-gated |
| TRACE trust-record card | 0 (software stub) | not yet built | ✓ lane |
| x402 receipt card | 0 (gated on paid flow) | `/api/measure` not live | ✓ owner-gated |

**Total potential signed atoms from the mill:** ~190,000+
**Currently emitted as signed cards:** ~150
**Coverage:** 0.08% — we have 99.92% headroom.

---

### Layer 2 — PRODUCTS (top of the atoms)

#### Free (today)
1. The 22-axis board — `https://councilof.ai/api/gspc`
2. `/gspc-verify` — paste a card, browser verifies
3. `/mcp` — 4 public tools (board_totals, get_axis, verify_card, list_cards)
4. Chrome MV3 extension — overlay on HF, OpenRouter, Replicate
5. Grok plugin — 4 skills, 4 commands
6. Hermes skill — `~/.hermes/skills/council-of-ai/`
7. npm `csoai-gspc-mcp@0.1.0` — stdio door
8. `/api/xrpl` — 16-asset reader
9. `/api/swift` — 26-bank census
10. `/api/corrections` — 39-entry ledger
11. `/api/pqc` — honesty about Ed25519 only
12. `/api/detect` — C2PA verifier
13. `/api/detector-interop` — crosswalk
14. `/api/intoto` — in-toto attestations
15. `/hf-badge.html` — get the badge on YOUR HF model
16. `/hf-spaces.html` — full Spaces catalog
17. `/what-is-new.html` — the upgrade changelog
18. `/axes.html` + 22 `/axis/<slug>.html` — AEO surface
19. `/visual-board.html` + `/visual-verify.html` — single-page surfaces

#### Paid (lanes; $0 today)
- `/v1/measure` — paid run-and-sign endpoint (x402 paywall)
- `/api/measure-pack` — bulk inclusion packs
- `/api/regulator-pack` — GPAI Article 50 pack
- `/api/insurer-pack` — risk-attestation pack
- `/api/signed-bulk` — bulk historical query

#### Free SKUs (today)
- Verify a card (always free)
- Read the board (always free)
- Use MCP (always free)
- Use the Chrome extension (always free)

---

### Layer 3 — IP / Defensibility

**The asset is the measurement rail, not any single datum.**

#### Already public + signed (defensibility = "everyone can re-check")
- **card-v0 schema** (`csoai.gspc-axes/0.5`) — the 3KB signed atom format
- **22-axis GSPC axis set** — the lid
- **14-model fleet + 8 deterministic-fact split** — the doctrine
- **corrections ledger** — the public witness of every change
- **TIE is TIE** — no fake equal
- **writes_board=false** on every reader tape
- **did:web:csoai.org#card-attestation-1** — the pinned signer

#### Trade secret (kept internal, never exposed)
- The frozen item banks (per-axis gold questions)
- The grader code (deterministic, version-pinned)
- The HF Jobs cost model ($0.40/hr T4, $1.50/hr A10G)
- The mill key + the Rekor upload pipeline
- The agent fleet selection logic (which 19 models are in the board)

#### Brand (trademark-pending)
- "Council of AI"
- "GSPC" (the abbreviation)
- "22 axis · 22 measured" (the lid phrase)
- "measurement, not certification" (the doctrine)
- "TIE is TIE" (the discipline)

#### Patent-able (not yet filed)
- The 3KB signed-card format with witness chain binding
- The 14-model fleet selection methodology
- The corrections-ledger pattern with retro/active diff pairs
- The TIE attestation triple with McNemar separation
- The A2A capability-honesty probe with deterministic capability map

---

### Layer 4 — AUTOMATION (what needs to run, with no human)

#### Today (already running)
- `mill_hub_queue.py` — signs + uploads staged cards
- HF Jobs cron — runs when jobs are authorized (owner-gated)
- Rekor upload cron — witnesses the root
- 22 axes live API — refreshed every request

#### Built but not yet deployed
- `scripts/badger/hf-eat-all.py` — 20,550 badges staged, awaiting upload
- `scripts/badger/harvest-per-model-cards.py` — 14 fleet cards ready
- `scripts/badger/csoai-eat-all-chains.py` — 10-chain master cron (just built)
- `scripts/end-to-end-pass.sh` — 6-phase audit

#### Owner-gated (the revenue wall)
- **Stripe live-flip** — first $ blocked
- **npm 2FA** — package publish
- **SMITHERY** — MCP registry listing
- **HF_TOKEN repo.write** — for badge upload

---

## The complete value map

### Tier 1 — Permissionless, lane-doable, $0 cost

| Move | Effort | Yield |
|---|---|---|
| Run `harvest-per-model-cards.py` | 5 min | 14 new cards |
| Run `csoai-eat-all-chains.py` | 15 min | ~100+ new atoms |
| Per-item grade harvester | 1 day | 15,580 cards |
| Per-issuer harvester | 1 day | 50 cards |
| Corrections diff harvester | 2 hr | 78 cards |
| TIE attestation harvester | 2 hr | 5 cards |
| Witness-receipt binder | 2 hr | 22 cards |
| A2A finding harvester | 1 day | 25 cards |
| ERC-8004 live filter | 1 day | ~16k potential |
| MCP server census | 1 day | ~115k potential |

### Tier 2 — Automation crons (the relentless loop)

```
csoai-eat-all-chains.py   every 15 min  → discovers new atoms
mill_hub_queue.py         every 30 min  → signs + uploads the new atoms
/api/gspc refresh         every request → reflects the new cards
rekor upload              every hour    → witnesses the new root
ots anchor                every day     → Bitcoin timestamp
corrections check         every hour    → detects drift, emits correction card
```

### Tier 3 — Revenue (owner-gated)

```
1. Stripe live-flip         → first £ through checkout
2. npm publish              → csoai-gspc-mcp@0.2.0 with 7 tools
3. Smithery listing         → discoverability
4. x402 paid attestation    → $1.00 USDC per signed card
5. Insurer pack             → 6-month licence, ~£25-100k
6. EU AI Act pack           → GPAI Article 50, ~£15-50k
7. Series A                 → ~£5M raise on the data moat
```

---

## What makes it stronger (your question)

### 1. **Coverage density** — more atoms per chain

Right now: HF Hub walk gets 20,550 cards. With **per-axis** harvest we get 14 more. With **per-item** harvest we get 15,580 more. **Per chain, every atom becomes a card.**

```
HF Hub       today: 20,550  → with per-axis: +14, per-item: +15,580 = ~36,000
XRPL         today: 0       → with per-issuer: ~50
SWIFT        today: 0       → with per-bank: ~26
ERC-8004     today: 0       → with per-agent: ~16-80k
MCP registry today: 0       → with per-server: ~115k
A2A cards    today: 0       → with per-finding: ~25-1000s
Corrections  today: 39      → with before/after: ~78
TIE ledger   today: 0       → with attestation: ~5
Rekor bonds  today: 4       → with binding: ~22
TOTAL:       ~190k+ signed atoms possible
```

### 2. **Cross-chain linking** — the value compounds

Every card should link to:
- The board axis it belongs to (`/api/gspc?axis=<name>`)
- The corrections ledger (`/api/corrections`)
- The witness receipt (`/api/proof?sha=<id>`)
- The DID document (`did:web:csoai.org#card-attestation-1`)
- The board root (`/api/state`)

**Cross-linking is the AEO/GEO play.** A card on OpenAI/GPT-2 → links to the governance axis → links to the live board → links to all 22 axes. The graph compounds.

### 3. **Branded surfaces** — every chain gets a page

| Chain | Page |
|---|---|
| HF Hub | `/hf-spaces.html` ✓ shipped |
| XRPL | `/xrpl.html` — needs build |
| SWIFT | `/swift.html` — needs build |
| ERC-8004 | `/agents.html` — needs build |
| MCP | `/mcp-fleet.html` ✓ shipped |
| A2A | `/a2a.html` — needs build |
| Corrections | `/corrections.html` — needs build |

Each page is a **branded landing** for that chain, with the live rail, the lid, and the link to the verify flow.

### 4. **AEO/GEO/SEO amplification**

```
Each atom = 1 page:
  /signed/cards/<sha>.html           the card itself
  /axis/<slug>.html                  the axis page (22 shipped)
  /chain/<name>.html                 the chain landing
  /api/<name>                        the JSON endpoint
  /docs/<name>.md                    the human doc
  /llms.txt                          the AEO surface
  /sitemap.xml                       the SEO surface
  /og-image.png                      the social card
```

**Every atom = 8 surfaces.** Multiply by 190k atoms = 1.5M indexable URLs.

### 5. **The relentless cron (built today)**

```cron
*/15 * * * *  cd /Users/nicholas/clawd/councilof-ai && python3 scripts/badger/csoai-eat-all-chains.py
*/30 * * * *  cd /Users/nicholas/clawd/councilof-ai && python3 harness/gspc-top100/mill_hub_queue.py
0   * * * *  cd /Users/nicholas/clawd/councilof-ai && python3 scripts/rekor_upload.py
0   0 * * *  cd /Users/nicholas/clawd/councilof-ai && python3 scripts/ots_anchor.py
```

Every 15 min, the chain-eat discovers new atoms. Every 30 min, the mill signs + uploads. Every hour, Rekor witnesses. Every day, Bitcoin OTS anchors. **No human needed.**

---

## Summary — what gets us there

```
TODAY (lane-doable, no owner):
  1. Run csoai-eat-all-chains.py once → 100+ new atoms
  2. Run harvest-per-model-cards.py → 14 cards
  3. Build per-item harvester → 15,580 cards
  4. Build per-issuer harvester → 50 cards
  5. Build corrections diff harvester → 78 cards
  6. Build TIE harvester → 5 cards
  7. Build witness binder → 22 cards
  8. Build /xrpl.html + /swift.html + /agents.html branded pages
  9. Wire csoai-eat-all-chains.py into LaunchAgent cron

TOMORROW (owner-gated, $):
  10. Flip Stripe live
  11. Publish npm 0.2.0
  12. List on Smithery
  13. x402 attestation endpoint goes live
  14. First paid pack ships

NEXT WEEK (revenue):
  15. Insurer pack → 6-month licence, ~£25-100k
  16. EU AI Act pack → ~£15-50k
  17. Series A → ~£5M on the data moat
```

**The estate already has 99.92% headroom on signed atoms. The relentless loop is built. The owner gates are 5 small items. The revenue wall is 1 Stripe flip away.**

The doctrine holds: **measurement, not certification.**
