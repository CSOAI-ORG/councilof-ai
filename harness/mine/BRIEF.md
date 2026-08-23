# mine — learn the mine, improve it, never start it

Learns from `~/.grokbot/mine-evac-20260816` (evacuated 16 Aug from pod
`l7g747oivyq6ab`, which stays EXITED / do-not-start) fused with live pod bench
sources mirrored at `~/.grokbot/harness/results/*/` (+ `pod-sources/`).

v2 sources: master-mine report (23×6 axes) · fleet-art5 cards · sov_signal probes ·
day0 audit · bench_results_7models_24 (AI-act risk battery) · bench_care_60/200 ·
bench_gov_156/193 (+ round2 when it lands) · arena-league ELO.

- Output: `mine-learnt-v2.json` (binding) + `mine-summary-v2.md`.
- Doctrine: no invented scores; missing = absent; every score carries source + n.
- SUSPECT = raw master-mine care/gov/swag (rebench scoring artifacts, not quotable).
  TRUSTED = pod benches (care200 n=200 is publishable per its own note).
- Future data (bench_gov_round2.json, bench_care_200_all.json) folds in automatically
  on next `./learn.sh` — no manual steps.

Run: `run.sh mine learn` (or `./learn.sh`).
