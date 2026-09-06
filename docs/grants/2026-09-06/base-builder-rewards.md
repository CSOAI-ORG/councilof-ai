# Base Builder Rewards (Talent Protocol) — 06 Sep 2026

Money type: weekly ETH, tiered. Sponsor: Base, run by Talent Protocol.

## What was read today
- Programme post https://paragraph.com/@talent/introducing-builder-rewards-weekly-eth-for-the-most-impactful-builders-on-base:
  eligibility is "A Basename", "A Builder Score ≥ 40, calculated by Talent Protocol based on onchain and
  open-source activity", "A Human Checkmark verification"; weekly rewards factor "Verified contributions to
  public crypto repositories during that week" and "Activity on verified contracts you've deployed on Base".
  Launch pool: "2 ETH" per week (Tier 1 1 ETH/top 10, Tier 2 0.5 ETH/next 25, Tier 3 0.5 ETH/next 65).
- Web search (E31) cites a "Summer League" of 20 ETH/week to 22 September with a 1 ETH cap per builder —
  **year not verifiable from the pages I could read**; talent.app/~/ecosystems/base returned 404 and
  docs.talentprotocol.com did not resolve. Treat the September 2026 league as **unverified**.
- builderscore.xyz 301s to https://talent.app/ (Builder Score leaderboard only).
- Terms: https://docs.talentprotocol.com/docs/legal/builder-rewards-terms-conditions (unreachable today).

## Fit — 2, and why
- Open-source signal counts only for "public crypto repositories". Whether Talent classes councilof-ai
  (x402 doors, EAS batch staged, Base USDC receipts) as a crypto repo is unknown until a Builder Score is
  computed for the CSOAI-ORG GitHub.
- We have deployed **no contract** on Base; the on-chain signal is zero.
- Everything gating is owner-only: a Basename costs gas; Human Checkmark is an identity verification;
  the Talent account links GitHub + wallet; rewards go to a Farcaster primary wallet (we hold no Farcaster).

## What we will NOT claim
That we "build on Base" in the programme's sense. Our doors settle USDC on Base; that is a receipt, not
a deployment.

## Owner path (only if wanted)
1. https://talent.app → account, connect GitHub (CSOAI-ORG) and the payTo wallet → read the Builder Score.
2. If ≥ 40: Basename (gas), Human Checkmark (ID), and check whether a league is actually running.
3. If < 40: stop; the score is the gate and it is theirs to compute.
