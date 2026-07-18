# MEOK — MASTER PLAN / Plan of Record
Date: 2026-06-06 · **North star: £3,333/day (£100k/mo)** · One source of truth; detailed sub-plans linked at bottom.

## ✅ STATE — done & live
- **meok.ai deploy pipeline fixed** (10 consecutive failures → green) + **disk emergency resolved** (100%→~80%).
- **ALL website revenue rails LIVE + proven**: homepage, /pricing, PAYG, 11 buy-surfaces. Both COBOL mischarge links (£999 + £4,990) eliminated site-wide. **9 gap products created live** (PAYG ×3, £1 smoke, NIS2 £99/£499, Article-50 £999, Audit-Prep £4,950, DORA £999). Canonical buy-link registry in `PRICING_SOURCE_OF_TRUTH.md`.
- **Fleet GitHub-side hardened** (16 flagships): `mcp` topic (Glama-indexable) + CodeQL + Dependabot + OpenSSF Scorecard CI + server.json.
- **Severed brands removed from public** (CSGA / Terranova / James Castle): retail/gaming/thn scrubbed; cobol-bridge made private + rebranding to MEOK now.
- **Privacy clean** (no PII/secrets). **Safety strong** (read-only/advisory fleet, shared auth+rate-limit).
- **Daily cloud engine scheduled** (08:00 London) + **Fleet Alignment Standard** codified.

## 🔄 ACTIVE — running now
- cobol-bridge → MEOK rebrand (agent, stays private until you publish).
- Daily engine: revenue-regression guard + GitHub-side fleet lift + outbound drafts + digest.
- Fleet alignment grind: Scorecard (measure) → gate-publisher (republish, LOCAL) → Ralph (long tail).

## 💰 THE MONEY MODEL (how £3,333/day is actually made)
High-ticket B2B + services = the **bulk**; self-serve Pro (£79) + PAYG = the floor; 218k downloads = lead-gen. **Not** "1% of downloads" (~£5–20k/mo). Made by **sales**, fed by the fleet. *(detail: PLAN_3333_PER_DAY.md)*
**90-day ramp:** first £ this week → £500/day → £1.5k/day → £3,333/day.

## 🎯 5 REVENUE WORKSTREAMS (priority order)
1. **High-ticket outbound** (THE driver) — NIS2 late-filers (~18k DE), EU AI Act, DORA Belgium → £5k assessments / Enterprise / Defence.
2. **Conversion** — rails done; optimise: in-MCP upsell, working README buy links, LAUNCH50 everywhere, scorecard lead-magnet.
3. **Distribution** — Glama/Smithery/Anthropic-registry + awesome-lists (PR #6285) → **OpenMCP** to automate. Flagships now Glama-taggable.
4. **PAYG / x402** — Stripe PAYG live; scale agent micro-rev (M3's x402-on-Base).
5. **Products (multipliers)** — proofof.ai Scorecard, OpenMCP, MoE bundles.

## 🧬 FLEET → 100/100 (bring it all together)
Standard codified (`FLEET_ALIGNMENT_STANDARD`). **Tiers:** flagship ~15 → 100 e2e · mid-tier ~50 → climbing · long-tail ~260 → clean+importable+listed. **Hygiene-first:** strip the "Buy Pro" injection (~260 pkgs), fix 6 broken-source pkgs, republish via gate harness (LOCAL). AEO: llms.txt fleet-wide (missing on ~90%).

## 🏛️ THE GROWTH STACK
`csoai.org` (authority) · `proofof.ai` (Scorecard — score, paid) · **OpenMCP** (distribute, open) · `councilof.ai` (storefront) · MoE (premium bundles).

## ▶️ IMMEDIATE NEXT (this week)
1. **First revenue** — watch Stripe £/day (daily engine tracks); fix any leak same-day.
2. **Send high-ticket outbound** — NIS2/EU-AI-Act/DORA sequences (drafts being prepped by the daily engine).
3. **Local hygiene batch** — strip injection + fix 6 broken + republish (gate harness + Ralph).
4. **AEO** — roll out templated `llms.txt` fleet-wide + per-tool README sections + fix H1 acronym casing.
5. **Security to green** — branch-protection (careful) + cosign signed-releases + extend CodeQL/Dependabot/Scorecard to the long tail.
6. **cobol-bridge** — publish clean once rebrand verified.

## 🤔 DECISIONS PENDING NICK
- cobol-bridge: publish timing (rebrand finishing now).
- Outbound: auto-send vs draft-and-review.
- Branch-protection rollout (can lock pushes — needs care).
- proofof.ai / OpenMCP build start (after rails proven converting).

## ⚙️ THE ENGINE (runs without you)
Daily cloud routine (`trig_012ZuQEQ…`) + Ralph + Scorecard engine + gate-protected publisher + parallel agents. **Steer by £/day, not downloads.** Leading indicators: Stripe £/day · checkout sessions · trial→paid % · outbound→reply→close.

## 📎 SUB-PLANS (detail)
PLAN_3333_PER_DAY.md · MCP_DOMINATION_PLAN_2026-06-06.md · FLEET_ALIGNMENT_STANDARD_2026-06-06.md · SCAN_OVERVIEW_2026-06-06.md · revenue_leak_audit_2026-06-06.md · PRICING_SOURCE_OF_TRUTH.md · mcp_scoreboard_2026-06-06.{csv,json,_GAP_MAP.md}

## ⚠️ HONEST CAVEATS
- £3,333/day is a **90-day ramp driven by sales** (the hard part for a solo) — the fleet is the lead engine, not the revenue itself.
- **Re-verify money paths after every change** (broken Stripe links caused £0 twice).
- Full fleet-to-100 is gated on **local republish** (gate harness + PyPI tokens) — the daily engine flags what's pending; Ralph/you ship it.
- Don't quote unverified market stats (x402 figures) in sales/investor copy without a primary source.
