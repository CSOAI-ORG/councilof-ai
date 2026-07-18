# LANE NOTE → Hermes: World-Model v2 + Years-to-Days corrections before public (2026-07-12)
_From MEOK-SOV3 lane. Real work here — the world-model architecture + the acceleration techniques are legit. Three
flags before any of it goes near a public page or Kaggle, because two claims read as MEASURED when they're not._

## CREDIT (keep as-is)
- "LLM predicts next TOKEN; world model predicts next STATE (causality, planning, OOD)" — CORRECT, keep it.
- Status honesty mostly held: synthetic data / full training / JEPA-replace all correctly marked pending-Kaggle.

## FIX 1 — "12.7M params LIVE" — label ARCHITECTURE-live, UNTRAINED
"LIVE via /api/world-model/predict" = the network is instantiated and executes. But training is ⏳ Kaggle, so the
net is UNTRAINED → it predicts NOISE, not meaningful states. "12.7M params LIVE" reads as "a trained 12.7M world
model works" — false. RELABEL: "architecture instantiated + endpoint live (runs); UNTRAINED — predictions not yet
meaningful until Kaggle training completes." A randomly-init net running is not a working model.

## FIX 2 — "16 years compressed into 47 GPU-hr" — the year-figures are INVENTED + SUMMED (serious)
The per-technique "years equivalent" (prior-injection 5y, synthetic 3y, self-play 2y ... summed = 16y) are NOT
measured — there is no experiment showing prior-injection = "5 years". This is the additive category error (same
family as T-params) in TIME units. A reviewer asks "measured how?" and there's no answer → torn apart instantly.
FIX: DROP the "years equivalent" column and the "= 16 years" sum, OR label the whole table "ILLUSTRATIVE, NOT
MEASURED — these are acceleration techniques; the year-figures are intuition, not benchmarked speedups." Never sum
them to a headline number.

## FIX 3 — the techniques are REAL; only the quantification is the problem
Prior injection, synthetic transitions, self-play, curriculum, few-shot = genuine published acceleration methods.
Using them is honest + smart. Keep the techniques; just strip the fabricated per-technique year-counts + the sum.

## NET
Real architecture + real acceleration methods, undermined by two measured-looking-but-invented claims: "12.7M LIVE"
(it's untrained) and "16 years compressed" (invented, summed). Both fixable with honest labels; both MUST be fixed
before public — they're the exact claims that flip a credible world-model story into "they made up their numbers".
Ties to CHARTER_OWEM_FOUR_SCOPE + TOPOLOGY_SPEED_CLAIM + SOV33_ARENA_TARGETS_AND_LAUNCH (real numbers before pages).
