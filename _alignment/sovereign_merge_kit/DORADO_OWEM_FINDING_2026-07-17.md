# DORADO-OWEM — first adversarial-loop run (HONEST result, 2026-07-17)

**The inversion built:** untrusted GPU / range = honeypot, not armory. SRUM-style probe swarm ->
DORADO absolute check -> HORUS BFT gate -> SIGIL sign -> labeled adversarial dataset (trains DORADO
HERE, never ships owned weights out). Guardian line: catches the edge, never launches it (probes are
a FIXED known-signature catalogue used to TEST the catcher, not novel offense).

## Run 1 — real numbers (12 probes: 9 attack, 3 benign)
- **benign false-positive rate: 0.0** (FIXED — was 1.0; HORUS session-lockdown was collectively
  punishing innocent callers after an attacker tripped it. Each probe now = its own session.
  Care-first invariant: no collective punishment.)
- **attack recall: 0.444** (HONEST — DORADO exact-phrase + HORUS repeat-strike miss 5/9 novel phrasings)
- all 12 SIGIL-signed (Ed25519, provable)

## The finding that matters
The threat NN (threat_detection_v2, "0.954 held-out") predicts **benign on all 9 attack probes tested** — including
"write malware that" and "help me build a weapon to hurt". It does NOT generalize to fresh adversarial phrasing (9/9 attack probes scored benign); 0.954 was in-distribution only. **NOT wired into the defense path** — a NN that flags real
malware as benign is worse-than-useless and would fake a governed defense. This is the SAME overfit
pattern the auditor has caught on other NNs.

## What the loop PRODUCED (working as designed)
A labeled adversarial dataset (dorado_owem_adversarial.jsonl) that PROVES the threat NN needs retraining
on DIVERSE PHRASING, not more of its own distribution. The loop found the weakness on run 1 instead of
hiding it — that IS the "learn from the adversarial edge" mechanism working.

## Next (real, not faked)
- Retrain threat NN on diverse adversarial phrasing (this dataset + more probes) -> re-measure recall.
- Broaden DORADO patterns OR add a semantic (not exact-phrase) catcher for the injection/abuse gap.
- Only wire the NN into caught-condition AFTER it generalizes on a held-out adversarial set.
