---
title: "The privacy axis — measured, signed, verifiable"
description: "What the Council of AI measures on the privacy axis, how it is signed, and how anyone can re-verify it. Measurement, not certification."
keywords: ["AI governance", "privacy", "GSPC", "signed measurement", "verifiable"]
date: 2026-08-24
author: Council of AI (CSOAI Ltd)
type: axis-analysis
axis: prv
---

# The privacy axis — measured, signed, and verifiable

The privacy axis is one of the GSPC governance-measurement axes. The Council of AI (CSOAI Ltd,
UK 16939677) measures it deterministically — frozen probes, published splits, honest statistics —
and publishes the result **signed** so anyone can re-verify it.

## What is measured

- **Status:** MEASURED — reported honestly, never hidden.
- **Scored items:** 32 ·
- **Models measured:** 19 ·
- **Majority baseline:** 0.5312.

Every score carries n + a 95% confidence interval. A thin-n result is reported *"not sufficient to
rank"* — never invented.

## Verify it yourself (the trust proof)

The measurement is a signed artifact: recompute the canonical body → derive the content_id →
check the Ed25519 signature against the published key. No trust in us required.

- Live board (with n + CI): [GET /api/gspc](https://councilof.ai/api/gspc)
- Verify a card free: [the verify page](https://councilof.ai/gspc-verify)
- Signed per-axis Elo: [the signed leaderboard](https://councilof.ai/api/arena/scoreboard)
- Audit any claim: [ClaimGuard](https://councilof.ai/claimguard)

## Why this matters

A usage-rank can be gamed. A crowd-Elo board has no verified provenance. This axis measurement is
**per-domain, n + CI, signed** — the difference that makes it usable evidence rather than a score.

## Measurement, not certification

This is evidence, never a certification. The verify path is the proof; the free access for
researchers, journalists, and fact-checkers is permanent and unconditional.

## Related

- [The full GSPC board](https://councilof.ai/api/gspc)
- [Article 50 free detection](https://councilof.ai/article-50)
