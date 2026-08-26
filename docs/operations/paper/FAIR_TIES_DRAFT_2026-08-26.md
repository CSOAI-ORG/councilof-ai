# FAIR TIES: a significance-gated ranking method with a signed anti-gaming event core

**Draft 2026-08-26 · for ARC Prize 2026 paper track + arXiv · CSOAI (COAI) — measurement body, not a lab**
*Authors: CSOAI (K3/JEEVES lane) — status: draft for review*

## Abstract
Ranking AI systems by human preference (the LMArena model) is the field's de facto
authority metric, yet Bradley–Terry estimates over private, un-audited vote streams
are vulnerable to three documented abuses: private best-of-N variant testing,
selective disclosure, and silent deprecation ("The Leaderboard Illusion", 2025).
We propose FAIR TIES: a ranking protocol where (1) two systems are reported as
**statistically separated only when the vote margin passes a significance gate**
(Wilson 95% intervals + McNemar on discordant pairs), and ties are reported as
ties — never as a point-estimate lead; (2) every ranking decision is an
**Ed25519-signed, recomputable artifact**; (3) an **anti-gaming event core**
guarantees that re-publishing identical evidence mints no new verdicts, and any
correction is **appended** to a public ledger, never edited. We report a worked
example from a 7-model × 71-item containment run: the leader's Wilson 95%
[0.475, 0.698] contains the fleet mean 0.5455 → determined TIE, and the board
renders "22 axes · 15 measured" (15 measured of 15 quotable, 7 candidacy axes
honestly UNMEASURED) without a single unverified number. (The worked example
predates the 22-axis sweep; the tie verdict is unchanged by it.)

## 1. Motivation
(IL-policy body) — the market validated independent scorekeepers in 2026
(Vals AI, Arena Intelligence) while the signed/verifiable layer stayed empty.
Contamination anxieties (OpenAI withdrawing SWE-bench Verified) push the field
toward "live" benchmarks — precisely the property of a signed event stream.

## 2. Method
**2.1 Significance-gated ties.** For a pair (A, B) with per-item votes: McNemar
p < 0.05 on discordant pairs, and Wilson-CI non-overlap against the fleet mean —
both required to declare "separated"; otherwise **TIE** (the conservative
anti-overclaiming rule, `stat_suite.separated_leaders`).
**2.2 Signed event core.** event → recompute affected axes → Ed25519 sign →
append-only stream (content_id = sha256(canonical)). Re-publishing identical
evidence mints zero new verdicts (verified property; the anti-gaming invariant).
**2.3 Corrections ledger.** Supersessions are appended with old_cid → new_cid +
reason; strangers verify both survive.

## 3. Worked results (real data)
- Jail containment (7 models × 71 gold cells): leader qwen2.5:0.5b-instruct
  acc 0.5915, Wilson 95% [0.475, 0.698] ∋ fleet mean 0.5455 → **TIE**; 7 models
  all n≥30; best recall 0.237 (published, not hidden).
- Board grammar: 22 axes · 15 measured of 15 quotable (7 candidacy axes honestly
  UNMEASURED; TIE counts as measured; ties are never counted as wins).
- Scorecard honesty: 311 entries, 306 A / 5 C (the C's = fewer disclosed facts —
  the gate functioning as designed).

## 4. Discussion
Versus Bradley–Terry: BT optimizes point estimates; FAIR TIES refuses to rank
what the evidence cannot separate — directly answering the Illusion paper's
"prohibit score retraction / cap private variants / auditable deprecation".
The anti-gaming core makes each item of evidence impossible to double-spend —
the property the market is groping toward (LiveBench, SWE-bench Pro).

## 5. Limitations & honest boundaries
Small-N experiments; one lab; human-vote deployment pending. This is a
measurement methodology, not a certification; no issuer-pays; no tokens.

## 6. Open annex (for reference implementations)
- `scripts/verify_signed.py` (offline verifier) · `harness/rwa-attest/`
- `public/signed/board_living.json` (signed board) · `public/interop/*` (runs)
- Competition entry: ARC Prize 2026 paper track (open-source-to-win, permissive
  release — consistent with the methodology's own doctrine).

*Draft status: for internal review → external reviewers on the card spec (per
OWNERSHIP-100 #76) before submission.*
