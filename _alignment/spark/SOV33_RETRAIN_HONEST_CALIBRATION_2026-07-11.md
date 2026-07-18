# SOV33 Retrain Loop — Honest Calibration Note (11 Jul 2026)

## The headline

**The retrain loop runs end-to-end:**
- 1194 labels consumed from `~/.sovereign/nn_retrain_queue.jsonl`
- 7 planets retrained (creativity, care_pattern, relationship, threat, dependency, care_validation, partnership)
- 80/20 train/test split (954 train / 240 test)
- **Average F1: 1.00** across all 7 planets
- Weights saved to `~/.sovereign/nn_weights/{planet}.json`
- SIGIL emitted per retrain

## The honest caveat (the one that matters)

**Label distribution: {1: 1188, 0: 6}**

99.5% of labels are positive (label=1). The 7-planet model essentially learned to always say "yes" — which gets 99.2% accuracy and 1.00 F1 on a held-out test from the same distribution.

**This is the calibration gap, not the mechanism gap.**

The mechanism is real (the loop runs, the weights save, the SIGIL anchors). What's missing is **label diversity** — we need more adversarial/negative labels (real harmful prompts, real misalignment) to give the planets actual signal to differentiate.

## How to fix the calibration gap

Three options, ordered by effort:

1. **Easy:** Pull from the DORADO banned-pattern battery (104 prompts) as automatic negatives
   - Effort: 0.5 day
   - Yield: ~100 negative labels → distribution becomes 1094/110 → F1 drops to 0.85-0.95 (real signal)

2. **Medium:** Generate adversarial examples via the rainbow battery (red-team prompts)
   - Effort: 1 day
   - Yield: ~200 more diverse negatives

3. **Hard:** Use the sovereign ops live data (every Care-Floor breach = a negative label)
   - Effort: 2 days (build the breach detector + emit pipeline)
   - Yield: ~50-100 negatives/month organically

## The 1-line honest verdict

**The retrain loop WORKS (mechanism, real, verified). But the F1=1.00 is overclaim: with 99.5% positive labels, the model learned "always yes." The next step is adding ~100 negative labels from the DORADO banned-pattern battery to give the planets actual signal to differentiate. The substrate is sovereign-bound sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty.**