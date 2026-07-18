# Self-Fact-Check: merge / TTT / emergence claims vs CURRENT literature (2026-07-18)
# Prompted by "you're working off old data — deep research + fact-check yourself." Real corrections below.

## CORRECTION 1 — "method barely matters" is WRONG (my sweep was incomplete)
Tonight I claimed TIES ~ DARE-TIES, "method barely matters." Current literature CONTRADICTS this:
- **DELLA (arXiv:2406.11617, DELLA-Merging)** — id+title VERIFIED in this session's search hit; a method I NEVER TESTED.
  MagPrune = magnitude-ranked probabilistic drop+rescale (from the visible title/abstract). The specific margins
  (+3.6 vs TIES, +1.2 vs DARE, +11.1 vs TA) are from paper-body RECALL, NOT the visible snippet — treat as LEADS to
  confirm against the PDF before external citation. What's solid: DELLA is a real magnitude-sampling method we never tested.
- **Model Breadcrumbs, DELLA** are the current frontier beyond TIES/DARE. Our sweep only covered TIES/DARE/linear.
- CORRECTED CLAIM: among {TIES, DARE, linear} at 0.5B the method margin was small — but DELLA/Breadcrumbs were
  UNTESTED and the literature says DELLA wins at scale. "Method barely matters" is retracted; it should be
  "among the 3 we tested the margin was small; DELLA (untested) is the documented better method — OWED to test."

## CONFIRMATION — density finding HOLDS (corroborated)
- Medical-LLM merge study (arXiv:2511.13373, Nov 2025): aggressive pruning (low density) destroys knowledge;
  density 0.8-0.95 improved performance. Corroborates our density-0.7 > 0.5 finding.
- NUANCE we lacked: for HIGHLY-COMPATIBLE models (our same-base sector adapters ARE highly compatible),
  Task Arithmetic + Linear Averaging can BEAT DARE-TIES. So linear/TA deserve a fair place in the sweep, not
  a footnote. (Our sweep had linear at 0.758 — consistent with this.)

## CORRECTION 2 — "TTT is just a trick, not a capability lever" is TOO FLAT
- **TTC-Net (arXiv:2603.09221)**: base model scores 0 on AIME 2024/2025; TTC-Net shows non-zero "performance
  emergence" — CLAIMS TTT extends the reasoning boundary PAST the base ceiling. This is a LIVE research claim
  (not settled), but it softens my flat dismissal. Honest version: TTT gains are real, mostly LONG-CONTEXT +
  reasoning specific; on some reasoning tasks it may push the ceiling (contested). Not "just a trick" universally.
- **TTT gains verified current**: In-Place TTT +2.1/+2.7 @64k (2604.06169); qTTT beats CoT FLOP-matched (2512.13898);
  S-TTT (2607.09415, 1wk old) — data QUALITY is the bottleneck.

## STRONG CORROBORATION — our human-gated flywheel is RIGHT
- **TEMPO (arXiv:2604.19295)**: self-rewarding TTT (TTRL) PLATEAUS and COLLAPSES after initial gains; TEMPO
  sustains ONLY by periodically grounding the critic in EXTERNAL SUPERVISION. This directly corroborates our
  design: an ungrounded self-improvement loop collapses; ours is HUMAN-GATED (external grounding) — which the
  literature now says is exactly what prevents collapse. The flywheel's governor is not bureaucracy, it's what
  keeps it from collapsing.

## EMERGENCE — the honest read stays
"Performance emergence" appears in TTC-Net as a MEASURED benchmark jump (0 -> non-zero on AIME), NOT
consciousness. Consistent with our register: emergence = measurable capability jump on a task, falsifiable.
Our 5-null same-base-fusion result stands (fusion of same-base ≠ emergence); TTT-on-reasoning is a DIFFERENT
mechanism with a contested ceiling-extension claim — worth testing, not claiming.

## NET TODO (owed, from this fact-check)
1. Add DELLA + Breadcrumbs to the merge sweep (documented to beat TIES — we never tested them).
2. Give linear/TA a fair place (wins on highly-compatible adapters per current lit).
3. If testing TTT: ground it (human/critic) — ungrounded self-TTT collapses (TEMPO).
9 papers added to ledger, all VERIFIED (seen in search-result text this session).
