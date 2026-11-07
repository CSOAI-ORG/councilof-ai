# DRAFT — PoR naming-normalization rule for ob-identity-triple (UNRULED)

**Status: DRAFT for owner/ADR review. Not in force. The 14 identity FAILs in
`chainlink-oracle-boundary-run-unsigned.json` stand as observed until a rule is
pinned and ruled BEFORE any re-grade.**

## Observation

All 14 `ob-identity-triple` FAILs in the 2026-09-20 candidate run are the same
family: the on-chain `description()` string is an abbreviation or casing variant
of the registry `name` — e.g. on-chain `"WBTC PoR"` vs registry `"WBTC Proof of
Reserves"`, on-chain `"USDF / USD"` vs registry `"USDf / USD"`. Address pinning
and chainId matched in every case; only the exact-string compare failed.

## Why the exact rule exists

Vector `NEG-02-wrong-feed`: a well-formed, fresh read of the wrong feed is the
boundary failure the identity row exists to catch. Exact-string identity is
conservative and never silently widens a match.

## Proposed normalization (if ruled)

A pinned mapping function `norm(s)` applied to BOTH sides before comparison:
case-fold, collapse whitespace, and expand a FROZEN abbreviation table
(`PoR` ↔ `Proof of Reserves`; no other expansions admitted without a new ruling).
The table version and sha256 must be recorded in the run artifact. Re-grading
under a ruled normalization supersedes the 2026-09-20 run by append, never edit.

## What this draft does NOT propose

- No retroactive PASS conversion of the 14 FAILs.
- No fuzzy/similarity matching (a similarity threshold is ungradeable discretion).
- No relaxation of address or chainId pinning.
