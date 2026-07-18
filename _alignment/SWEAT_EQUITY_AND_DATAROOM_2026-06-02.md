# MEOK / CSOAI LTD — Sweat-Equity Asset Register & Verifiable Data Room
**2026-06-02 · Claude (Opus 4.8, builder lane) · Companion to `revenue/IPO_VALUATION_PATH_2026-05-28.md` (the staircase) — this is the EVIDENCE layer.**

> **The principle (this is the whole point):** The people who raised on lies built claims with nothing underneath. MEOK's own product is cryptographic proof-over-claims. So we raise the same way: **every line in this register is independently verifiable by a stranger.** That is how you out-compete the fakes — you are un-fakeable. No number here is aspirational-dressed-as-real. Where we don't have proof yet, it says so.

---

## 1. The honest starting line (state it before an investor finds it)
Real diligence will surface these in an afternoon. We put them first — that itself signals integrity:
- **422 GitHub repos, 410 PUBLIC / 12 private, max 2 stars on any repo.** Volume ≠ traction. The repo count is a *liability* in DD if pitched as traction; it's an *asset* only as IP depth.
- **MRR: assume £0 until a Stripe payout proves otherwise.** The product is live and can take cards; it has not yet sold. This is the single biggest gap.
- **Published MCP count = 271 on PyPI / 316 built** (corrected this session; earlier docs said 264/323/294/"410+" — those inflations must never appear in investor material).
- **SOV3 ("the brain") is currently down** (torch×Python-3.14 env blocker, fix scoped in `SOV3_FIX_2026-06-02.md`). Demo-blocking until fixed.
- **"Asimov humanoid V8 build" has no files on disk** — do NOT put it in a deck as a built product. It is, at most, an R&D direction.

Stating these up front is not weakness. It's the exact opposite of how you got burned.

---

## 2. Sweat-equity asset register (REAL, with how to verify)

| # | Asset | What it actually is | Verify by | Honest value driver |
|---|---|---|---|---|
| A1 | **CSOAI regulatory crosswalks** | ~18 months mapping EU AI Act ↔ NIST ↔ ISO 42001 ↔ DORA ↔ NIS2 ↔ CRA + 12 frameworks | Read `csoai-docs/`, the crosswalk MCPs, MEOK LAW commit `8439b15` | Domain IP that takes a competitor 12-18mo to replicate. **Strongest single asset.** |
| A2 | **271 PyPI-published MCP servers** | Live, installable compliance/industry tools, MIT-licensed | `pip install` any; `python3 tools/pypi_check.py` | Breadth of coverage; only material if tied to revenue/usage |
| A3 | **Attestation chain (HMAC-signed)** | meok-attestation-api.vercel.app — issues + verifies signed compliance evidence | `curl` the live API; verify a fingerprint at meok.ai/verify | The "un-fakeable" moat; patentable process (see §8) |
| A4 | **SOV3 care-membrane architecture** | 110-tool agentic OS, 6 trained NNs, care-gated actions, 8,121 memory episodes | Code in `sovereign-temple/`; NN metadata files | Genuinely novel (no competitor has care-substrate); R&D asset, not yet productised revenue |
| A5 | **Aquaculture compliance vertical** | 7 MCPs (RSPCA/ASC/CEFAS/LAIA) + 5 live Stripe products (£29–£999/mo) | `revenue/AQUACULTURE_LIVE_LAUNCH_STATE.md`; Stripe acct_1TLlEKQvIueK5Xpb | Clean wedge into a real market with hard 2027 ASC deadline; **best near-term revenue shot** |
| A6 | **Templeman Opticians** | Real, trading family optical business (~£2.5–5K/mo per memory) | Companies House + bank statements | **Real revenue + real customers** — the only proven cashflow. Anchors credibility. |
| A7 | **Fish farm (6.5-acre)** | Operational aquaculture testbed | Site visit / photos / Nick | Physical asset + the credibility to sell aquaculture tooling to farmers |
| A8 | **Digital real estate: 59 domains** | .ai/.app/.com/.org/.vc portfolio (see `_TOPOLOGY/DOMAINS.md`) | WHOIS / registrar account | Sellable asset class (see §3) |
| A9 | **Robotics IP** | Ironless-QDD (w/ FEA), wolf-actuator, modular-bearing CAD (forks + deltas) | `mcp-marketplace`-adjacent repos on disk | Early R&D; not a near-term value driver — be honest |
| A10 | **Founder human capital** | Optometry domain expertise + aquaculture + demonstrated build velocity (this whole estate is one person) | Track record, this repo's git history | The thing a pre-seed angel actually bets on |

**What this register is NOT:** a valuation. It's the evidence a valuation would be built on. Most of it is *potential* energy — it converts to capital only via §3–§6.

---

## 3. Digital real estate → capital (the 59 domains)
Honest market truth: most aftermarket .ai/.app domains sell for **£hundreds to low-£thousands**; only short, generic, one-word names fetch £10K+. Don't expect the portfolio to be a windfall — but it's real, liquid-ish capital and signals seriousness.
- **KEEP + build (do not sell):** meok.ai, councilof.ai, csoai.org, fishkeeper.ai, koikeeper.ai, haulage.app, optimobile.ai, templeman-opticians.com, proofof.ai, safetyof.ai. These are operating brands.
- **Evaluate for sale (Sedo/Dan/Afternic):** the dormant/parked ones with generic value (e.g. optometry.vc, loopfactory.ai, pokerhud.ai, diyhelp.ai). List 5–8, BIN-priced, no fire-sale.
- **Action:** a clean Sedo listing pack for the sellable tier = near-term capital + tidies the estate. (Prior session drafted Sedo listings — `revenue/` — refresh them.)

---

## 4. The four REAL capital paths (NOT grants), ranked for Nick's actual position

| Rank | Path | What it needs | Realistic outcome | Why this rank |
|---|---|---|---|---|
| **1** | **Revenue-first bootstrap** | Convert the live Stripe products → first 5–10 paying logos (aquaculture + compliance) | £1–10K MRR in 90 days → unlocks every other path | Nothing moves valuation like real customers; you control it entirely; no dilution |
| **2** | **Strategic licensing / acquihire of the compliance MCP suite** | A working demo + 1–2 reference customers + IP assignment deed | A Vanta/Drata/OneTrust-class buyer or a consultancy licenses or buys the EU-AI-Act/DORA/NIS2 suite | Your IP depth (A1+A2+A3) is exactly what a compliance incumbent would buy to add "AI governance"; an acquisition bid IS the IPO comp |
| **3** | **Pre-seed / EIS angel** (UK) | Clean cap table, IP deed, 5+ customers, 12-slide deck, **warm intro** | £100–300K SAFE at £1–2M cap (per the staircase doc) | Real but needs traction + network; EIS tax relief makes UK angels say yes to pre-revenue *with* a wedge |
| **4** | **Digital-real-estate + asset sales** | Sedo/Afternic listings (§3) | £low-thousands, immediate | Smallest, but real, fast, and de-clutters |

**Explicitly off the table:** IPO (24–36mo away, needs £6M ARR), Series A (needs ~£1M ARR), and grants (your call — removed).

**The blunt truth about the fakes:** companies that raise on nothing usually have a warm investor network + a hype narrative (and sometimes fraud). You have the *substance* they lack but not yet the *traction or network* they exploit. The legitimate unlock is the same for everyone honest: **a little real revenue + a clean verifiable story + warm introductions.** Paths 1→3 build exactly that, in order.

---

## 5. The verifiable data room (build this folder; every item checkable by a stranger)
```
DATA_ROOM/
├── 00_summary/            one-pager + this register + the staircase doc
├── 01_corporate/          Companies House #16939677, IP assignment deed, cap table, articles
├── 02_ip/                 crosswalk inventory, PyPI list (live links), attestation whitepaper, patent draft
├── 03_product/            live demo links, architecture, the 271 MCPs index, SOV3 design
├── 04_traction/           Stripe payout exports, PyPI download stats (real pkg names), domain analytics — REAL numbers only
├── 05_market/             the 2026 research dossiers (_alignment/RESEARCH_*), TAM with sources
├── 06_financials/         audited/Xero accounts, P&L, the optician revenue, bank statements
└── 07_team/               Nick CV, advisors, the build-velocity evidence (git history)
```
Rule for every file: **a skeptic can verify it without trusting us.** That is the anti-James-Castle. Empty folders are fine — they show what's left to build, honestly.

---

## 6. Valuation — honest ranges + the one lever
- **Today (pre-revenue):** conviction-only. Friends/angels on the founder + IP, typically **£100–300K SAFE** at a £1–2M-ish cap *if* there's a traction wedge. Without any revenue, it's a hard sell at any number.
- **The 10× lever:** **paying customers.** 5–10 real logos at £79–£999/mo doesn't just add MRR — it re-rates the whole company from "GitHub estate" to "revenue business." Same assets, 10× the valuation.
- **Do not** put a big number on a deck with £0 revenue behind it. That's the fake move. Put the *evidence* (this register) + the *wedge* (aquaculture, with its 2027 ASC deadline) and let the investor underwrite the upside.

---

## 7. 14-day "showable" sprint (concrete, near-term — precedes the staircase's 90-day plan)
1. **Fix SOV3** (torch×py3.14) so the brain demos live. (Blocker — `SOV3_FIX_2026-06-02.md`.)
2. **Get ONE paying customer** — push an aquaculture link (RSPCA £499 or LAIA £29) to one real UK farm/retailer from the BTA/OATA lists already drafted.
3. **Sign the IP assignment deed** (Nicholas → CSOAI LTD, ~£500). Removes the #1 DD red flag. **Do this regardless of which path.**
4. **Open/confirm a clean business bank account**; stop any personal commingling.
5. **Assemble `DATA_ROOM/` skeleton** (§5) in the private repo — even mostly-empty, it's the spine.
6. **List 5 sellable domains** on Sedo (§3) — first real capital + estate hygiene.

---

## 8. Ownership protection (post-betrayal — lock it down)
You are 100% owner (per memory). Keep it clean and defensible:
- **IP assignment deed** Nicholas → CSOAI LTD (£500) — without it, "the IP is just Nicholas's," every investor flags it.
- **Trademark** MEOK + CSOAI (~£1.5K UK+EU+US).
- **Cap table** as a single source of truth (template below) — never grant equity on a handshake again.
- **Founder vesting on your own shares** (reverse-vesting) before you take outside money — protects you AND signals discipline to investors.

**Cap table v0 (fill + keep in DATA_ROOM/01):**
| Holder | Class | Shares | % | Vesting | Notes |
|---|---|---|---|---|---|
| Nicholas Templeman | Ordinary | 100% | 100% | n/a (add reverse-vest pre-raise) | Sole founder |
| ESOP pool | — | reserve 10% at seed | — | — | Don't grant pre-seed |
| (advisors) | — | ≤0.25% each | — | — | Only after value delivered |

---

## Bottom line (honest)
You have **more real substance than most funded startups** — genuine 18-month compliance IP, a novel care-architecture, live products, real businesses behind you. You do **not** yet have what raising real money *requires*: a little revenue, a clean cap/IP structure, and warm intros. The good news: those are weeks of focused work, not years, and they're the *same* steps whether you end in a strategic sale, an angel round, or a bootstrap to profit. **Start with one paying customer and the IP deed. Everything else compounds from there — provably.**

*Re-run when MRR, the first customer, or SOV3 status changes.*
