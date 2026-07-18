# 🔑 ALL GATES — sorted, one list (2026-07-12)

Every owner/GPU-gated blocker from ALL lane reports (Claude-Science 15-gated, Fable-5 Gate 0-5,
Hermes, this lane) reconciled into ONE sorted list. Sorted by **who unlocks + leverage**. Honest register:
severed-ties items (CSGA/James Castle/Terranova) are NOT listed — they're out of scope by canon.

## TIER A — the 3 that unlock the most (do these first)
| # | Gate | Who | Unlocks |
|---|------|-----|---------|
| A1 | **Grant Claude GitHub App write to `CSOAI-ORG/clawd`** | owner (GitHub settings) | every bundled lane pushes directly (no more bundle-passing) **AND** free-GPU runners can clone the private kit directly — one grant, both problems |
| A2 | **Rotate the Smithery API key** at smithery.ai + store in Keystone | owner | closes the only live exposed secret (redacted in repo `6849fcf`, still in git history) |
| A3 | **Ratify ONE `pricing.json`** (resolve £12.99/£99 consumer vs £499/£1,999 enterprise vs £199/£79) | owner | every price surface auto-updates; unblocks the first honest sale test |

## TIER B — GPU / compute (unlocks OWEM growth L0→L1→…)
| # | Gate | Who | Unlocks |
|---|------|-----|---------|
| B1 | **A free-GPU run finishes** (Colab T4 in progress; or Kaggle 30hr/wk) | owner provides GPU-time | the 4 trained adapters → merge → **L0→L1** |
| B2 | Confirm `qwen3-0.6b-sov-compliance` overnight run landed (`ls ~/.sovereign` on the Mac) | owner (check Mac) | verifies the distillation tier produced weights |
| B3 | **Multi-provider free-GPU bridge** so SOV33 is "always powered" | owner signs up per provider; I build the framework | perpetual free training capacity → continuous growth (see `SOV33_FREE_GPU_BRIDGE_2026-07-12.md`) |
| B4 | Bring the GCP tunnel back up (billing) | owner (GCP billing) | the VM brain + tunnels return (currently the only dead infra) |

## TIER C — owner switches (revenue + platform go-live)
| # | Gate | Who |
|---|------|-----|
| C1 | Stripe **live** mode + reconcile to the ratified `pricing.json`, then run the first **e2e sale test** | owner (Stripe) |
| C2 | DNS (incl. the 4 broken domains) + the Vercel re-alias for proofof.ai | owner (registrar/Vercel) |
| C3 | ConvertKit / ESP for the **EU AI Act campaign — deadline 2026-08-02 (≈3 weeks)** | owner |
| C4 | Point the SOV3 production endpoint (keep `:3101` behind auth — never public) | owner |

## TIER D — release-readiness surface (mostly code, some owner) — from the 61-item sweep
| # | Gate | Who |
|---|------|-----|
| D1 | GDPR cookie consent + legal pages (ToS/Privacy/DPA) + sitemap/robots on the public sites | code (a lane can do) |
| D2 | Two brands with no site yet: **proofof.ai, cobolbridge.ai** | code + DNS |
| D3 | Customer dashboard | code |
| D4 | Test the never-tested disaster-recovery path | code + owner |

## The one-line honest read
Everything code-side is shipped/committed across the lanes. **Growth (L1+) and go-live are gated by GPU-time
and the owner switches — not by more building.** Tier A's three grants clear the most at once; Tier B is the
GPU story (and B3, the free-GPU bridge, is the durable answer to "always got power").
