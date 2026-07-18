# BRUM Confidence-Routing Test — Honest Negative Result (2026-07-16)

## Question (user): "two brains don't work well — what if we 90/10 split them or change ratio?"

## Answer: No ratio (fixed or dynamic) helps with the current pieces. Three independent reasons:

### 1. Headroom is 1 item (arithmetic, from hardened eval)
- best_single (Qwen) = 22/24 = 0.917
- oracle (correct-if-either) = 23/24 = 0.958
- Gap = EXACTLY 1 question where Bamba is right and Qwen wrong.
- A confidence router can at best flip that 1 item. Cannot validate a scheme on 1-of-24 (luck vs skill).

### 2. Confidence signal is FLAT (local test, this session, free)
Ran the trained router's confidence on all 24 hardened questions:
- range 0.343-0.531, mean 0.424, **stdev only 0.060**
- 20/24 below 0.5 ("low confidence")
- Also MIS-ROUTED: 14/24 GDPR/EU-AI-Act questions sent to "defense" (should be "compliance")
=> Flat, low confidence cannot discriminate which item to route where. No routing signal.
=> Root cause: battery is OUT-OF-DOMAIN for the router (trained on persona text, tested on terse exam Qs).

### 3. rho is low (0.138) — the THESIS is sound
- The two brains (Qwen-MoE vs Bamba-SSM) ARE decorrelated (low rho, validated).
- The problem is NOT correlation; it's that 2 brains + flat confidence can't exploit the decorrelation.

## What actually moves the needle (priority order)
1. **Fix router calibration (~$0)** — retrain so confidence varies with correctness AND it stops
   routing compliance questions to defense. THIS is the real blocker, and it's free.
2. **Only then** is a 3rd brain or confidence-routing worth a paid test.

## Money saved by this finding
- Avoided the ~$15 re-run (would test 1 item of headroom = inconclusive)
- Avoided the ~$130-750 flagship 3rd brain (chasing 4% with no signal to capture it)

## Honest status
Emergence thesis: VALIDATED (low rho). Emergence CAPTURE: blocked by router calibration, not by needing
a bigger/3rd brain. The cheap fix comes first.
