# GOVERNANCE BENCHMARK — the honest number + a real classifier fix
## OWEM/passport EU AI Act classification, scored against known-correct answers
### CSOAI Ltd · 2026-07-10 · MEOK-SOV3, in charge

> This is the benchmark the whole PR/IP thesis rests on: does the governance layer classify AI
> systems CORRECTLY under the EU AI Act? I built a 12-case battery (all four tiers + edge cases),
> scored the passport MCP's own classifier against it, and it caught REAL bugs. Honest number
> first, fix second. No synthetic labels — expected tiers are the Act's own reading.

## 1. THE HONEST STARTING NUMBER: 8/12 = 66.7%
The passport classifier (as shipped) scored 66.7%, NOT the "100/100" reported elsewhere. Four
real misses, all traced to regex gaps:
- "CV-screening tool that ranks job candidates" → minimal (should be HIGH-RISK — Annex III
  employment; the pattern needed the literal word hiring/recruitment adjacent).
- "credit-scoring model that approves or denies loans" → minimal (should be HIGH-RISK; the
  `(loan|credit)\s*(scoring)` pattern missed the hyphen + word order).
- "exam-proctoring system" → minimal (should be HIGH-RISK education; pattern wanted "exam proctor"
  not "exam-proctoring").
- "emotion recognition in the workplace" → high_risk (should be PROHIBITED — Art 5 affective
  recognition at work; word-order in the prohibited pattern).

## 2. THE FIX: tightened patterns → 12/12 = 100%
Proposed regex tightening (in `governance_benchmark.py`, tested in isolation) closes all four gaps
and holds every previously-passing case. But an HONEST caveat: 100% on a 12-case battery I wrote
AND tuned to is NOT proof of a great classifier — it proves the patterns match THESE cases. A real
eval needs a larger held-out set I did not tune against. This fix is a genuine improvement (4 real
Annex III / Art 5 gaps closed), not a victory lap.

## 3. WHY THIS IS A PROPOSED PATCH, NOT A SILENT EDIT
`classify.py` is a CANONICAL estate file — the passport MCP that Tier-2 revenue depends on. I did
NOT silently edit production code. The tightened patterns live in the benchmark file as a proposal;
apply them to the canonical `classify.py` only on your go-ahead, ideally after a larger eval set.
Some readings are genuinely debatable (workplace emotion recognition: the Act treats it as Art 5
prohibited — that's the call I encoded).

## 4. HOW THIS FEEDS OWEM
OWEM's L2 council / L4 brain should call this classifier for any compliance task. The benchmark is
now the scorecard: every time we change the model or the merge, re-run it and the number is the
truth. This is what turns "OWEM runs" into "OWEM classifies EU AI Act risk at N% accuracy" — a
real, quotable, defensible claim (once the eval set is bigger).

## HONEST BOTTOM LINE
The benchmark exists, it runs, and it did its job: it found the true number (66.7%) and 4 real
bugs, then a fix that hits 100% on this set. Cite "we built a governance benchmark and improved the
classifier from 8/12 to 12/12" — never "100/100 governance." The next real step is a larger
held-out eval set so the number means something beyond these 12.

*MEOK-SOV3, in charge. A benchmark that catches your own bugs is worth more than one that always
says 100. This one caught four.*
