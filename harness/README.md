# Measurement Body — Harness Structure (MONOREPO-MASTER-SPEC 2026-08-24)

The measurement body is the signed, re-measurable evidence layer. This harness is the
consolidation of the estate's measurement tooling into the spec's layered structure. The
signing key never leaves the node; compute is never the Mac.

## Layers (spec §3)

| Spec layer | Lives here | What it is |
|---|---|---|
| `measurement-card` | `harness/arena/canon.py` + `public/signed/*.json` | the 3KB signed card: content_id + Ed25519 over canonical JSON (CROWN JEWEL) |
| `sov-instrument` | `harness/arena/*.py` + `~/clawd/csoai-static-deploy2/sov_instrument.py` | the deterministic transform — scores subjects, never trains, selftest 9/9 |
| `gspc-axes` | `harness/regulator/eu_ai_act_article_map.json` + `functions/api/gspc.ts` | the 16/17-axis GSPC definitions + environment commitment |
| `x402-receipt` | `functions/api/x402.js` (if present) | A2A settlement receipt edge |
| `arena-math` | `harness/arena/elo.py` | preference Elo + Wilson CI + McNemar (MIT — open rails) |
| `engine` | `harness/arena/axis_arena.py` + `pod-bench.sh` | the EAT overnight driver (measure → sign → publish) |
| `signer` | `_evacuation`/pod — key NEVER in repo | node-local signing |
| `registry` | `harness/regulator/*.py` + `public/signed/` | MEASURED/REPORTED/UNMEASURED honest register + evidence-index |

## Doctrine (binding)
- Measurement, not certification. No certified claim, no issuance of stamps.
- Buyer-side only, never issuer-paid. Never the scored.
- Honest registers: MEASURED / REPORTED / UNMEASURED — a disagreement is a row, never a hide.
- Signed + replayable: every score Ed25519-ed, stranger-verifiable offline.

## The white-label regulator door (the pivot)
`functions/api/regulator-findings.ts` serves the measured compliance findings at axis
(`?deployment=`), article (`?by=article`), and sector (`?sector=insurance|bond|cobol`)
granularity — from the signed GSPC board + regulation penalty tiers + the live EAT
compliance board. `functions/api/challenge.ts` is the measured-subject redress door.

## Verify path (the differentiator)
`/api/arena/scoreboard?verify=1` recomputes `sha256(canonical body)` on the edge and returns
`match: true|false` against `signature.content_id`. This is what neither a usage rank
(OpenRouter) nor a crowd Elo (LMArena) can offer.
