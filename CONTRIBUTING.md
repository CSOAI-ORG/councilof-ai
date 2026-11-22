# Contributing — Council of AI (CSOAI Ltd)

## How changes land
- All changes to `master` go through pull requests with the required status checks (see the branch protection rules).
- One maintainer review + green gate battery (lane-guard, build, conflict-guard, selftest, bank-gate-and-delta, card-verifier-parity) before merge.

## Reporting problems
- Security: see SECURITY.md (private reporting; 5-day ack / 90-day fix).
- Disputes about published measurements: https://councilof.ai/corrections/ — corrections are dated ledger entries, never silent edits.

## House rules
- Measurement, never certification.
- Counts come from the live board (https://councilof.ai/api/gspc) — never type a number that the wire cannot reproduce.
- Sign-offs: commits authored under your real identity (org policy; CLA bots check).
