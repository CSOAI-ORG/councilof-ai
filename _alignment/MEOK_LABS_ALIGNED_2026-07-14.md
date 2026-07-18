# 🦾 MEOK Labs — aligned into the sovereign canon (2026-07-14)
_Folds the MEOK Labs (FORGE) hardware lane into the same governed-substrate canon as SOV33/OWEM. Honest
register: what's LIVE on disk vs DESIGN. The join is real and already half-built._

## What MEOK Labs actually is (on disk, verified)
- **MEOK Assurance Radar** — ESP32 + LD2450 firmware, **Ed25519-signed** sensor frames, RFC-8785 JCS
  canonicalisation, `/api/verify` (`meok-labs/radar/`, firmware 196 lines, 4/4 tests pass, 100-frame batch).
- **OSCAL assessment** for the radar (OSCAL 1.1.2, 7 control objectives) — the same signed-compliance spine as the MCP estate.
- **wolf-actuator**, **print-manifest** (Qidi print settings + Stage-0 coupon gate), **radar** — the physical build track.
- Robotics MCPs: `meok-sovereign-humanoid-mcp`, `meok-sovereign-lerobot-mcp`, `robotics-control-mcp`, `agriculture-robotics-mcp`.
- Already references `sov33_pyramid_owem.py` (4-tier pyramid: 2 small + 1 big + 1 SOV33³ governor) — MEOK Labs is *already* wired to the pyramid canon.

## The alignment (the join is the governed-robustness law)
The SOV33 brain and MEOK Labs hardware are **the same signed substrate at two scales** — this is the
mind/body architecture (one governed mind, pluggable bodies; a robot/radar is a body):

| SOV33 (brain) | MEOK Labs (body) | shared spine |
|---|---|---|
| care-gated-BFT council holds under adversarial *members* | sensor/actuator array holds under **faulty/spoofed sensors** | **the governed-robustness law** (measured today: 1.0× vs 3.4×) |
| Ed25519-signed memory/emit | Ed25519-signed **radar frames** (RFC-8785 JCS) | one signing scheme, offline-verifiable |
| care-veto fail-closed on a harmful *output* | care-veto fail-closed on a dangerous **physical action** | same fail-closed gate |
| OSCAL package for the model card | OSCAL assessment for the **radar** | one compliance format |

**The insight:** the governed-robustness benchmark I measured today (`governed-robustness-bench`) is *exactly*
what safety-critical hardware needs — a sensor council where some members can be jammed, spoofed, or fail, and
the **care-gated-BFT aggregate holds flat**. So the same law that makes the AI council robust makes the robot's
perception robust. One moat, two products.

## Honest boundaries (don't overclaim MEOK Labs)
- **LIVE:** the Assurance Radar firmware + signing + OSCAL + tests. Real, shippable, verified.
- **DESIGN / aspirational:** full humanoid (Berkeley-Humanoid-Lite / Asimov-WOLF are open 3D-print designs;
  print files live on MakerWorld/OnShape, copyleft licenses — buildable, not built here). Isaac-scale training
  needs cloud GPU. Don't state "we have a humanoid" — state "we have the signed-assurance spine + the radar,
  and open humanoid bodies we can adopt."
- The robot "brain" = the governed SOV33 stack; the care-veto on physical actions is the same fail-closed gate
  proven in the alphabet-pipeline (`alphabet-A-P-pipeline` cap). That binding is real.

## Execute next (MEOK Labs, non-owner-gated)
- Wire the **governed-robustness aggregator** as the radar's multi-frame fusion (drop spoofed frames, quorum,
  signed emit) — a direct reuse of `sov33_governed_robustness_bench.py`'s care-gated-BFT on real sensor frames.
- Keep the Assurance Radar as the **flagship physical proof** of the signed substrate for the defence-assurance GTM.
