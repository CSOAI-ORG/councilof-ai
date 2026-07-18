# CSOAI Sim — Deep Findings Addendum (655 leads) 2026-07-08

Extends CSOAI_SIM_CROSSWALKS_2026-07-08.md with jurisdiction/tier cross-tabs. No new LLM calls —
pure analysis of the 655 enriched sim records. Enrichment remains INFERRED (mean confidence 0.43).

## 1. Jurisdiction is dominated by US-SEC registrants
- **US-SEC: 416 of 655 (64%)**, US 53, UK 33, EU 15, Defence 10, FR 9, JP 7.
- The sample is heavily US-SEC because those leads were seeded from public filings. Confirms the
  white paper's stated sampling skew — the full 2,363 run will rebalance this.

## 2. The wedge splits into TWO distinct segments (sharper than "no-posture")
- **Segment A — unengaged SEC mass:** all 416 tier-9 US-SEC leads score `no_data` (zero compliance
  signals of any kind). These are known companies with NO public AI-governance footprint at all.
- **Segment B — named-but-unposted priority accounts:** tiers 0-8 (231 leads) score
  `no_public_evidence` — they exist and are named (regulators, institutes, Global-500) but show no
  *public* signed compliance posture.
- **Only 8 leads across all tiers have a `measured_gap`** (a real, weak-but-present posture).
- **Implication:** the pitch differs by segment. Segment A = "you have no AI-governance footprint;
  here is a turnkey signed posture." Segment B = "you are named/visible but have no verifiable
  public posture; here is one that proves it." NOT one message.

## 3. Charter demand varies by jurisdiction (new crosswalk nuance)
- US-SEC → accountability (85), data-privacy (65), asi-security (56)
- US → bias-detection (15), asi-security (8)
- UK → bias-detection (8), data-privacy (6), accountability (5)
- EU → sovereign-standards (5), accountability (4), transparency (3)
- **EU uniquely surfaces `sovereign-standards` as #1** — a real jurisdictional signal for charter
  targeting (EU sovereignty framing lands where it doesn't elsewhere).

## 4. Enrichment-quality honesty
- Mean confidence **0.43**, median 0.40. Distribution: 354 medium (0.4-0.6), 283 low (<0.4),
  only **18 high (>0.6)**.
- This is deliberately conservative — cold public-sector/registrant leads with thin signals. Treat
  every enriched field as a hypothesis to verify on contact, not a fact. The value is in the
  aggregate pattern (segments, jurisdiction, charter demand), not any single lead's dossier.

## Status
DATA-SUPPORTED on the 655-lead sample; the two-segment split and EU sovereign-standards signal are
the strongest new findings. Confirm proportions after the full 2,363 enrichment (fresh session).
