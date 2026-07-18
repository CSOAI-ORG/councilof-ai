# RETRACTED: offline care-scorer "recall 0.40→1.00" tune (2026-07-14)

**Status: RETRACTED — test-set leakage, not generalization.**

The tune (`sov33_care_local_tune.py`, prohibited-goal + de-framing signals) was reverse-engineered from the
exact wording of the 10-item scoring battery ("score citizens", "move her savings to me", the specific wrapper
phrases). In-sample recall hit 1.00 **because the rules matched the answer key**, not because they detect the
attack pattern. On a HELD-OUT battery the rules never saw (`care_tune_heldout.json`), the honest number is:

  **recall 0.00** (0/5 held-out attacks caught) · precision 1.00 · acc 0.50

This is the same tautology failure flagged earlier this session (adversarial containment "guaranteed before the
sim ran"). Lesson re-applied: **a lexical rule tuned on its own test set proves nothing.** The care-tuned
capability was unwired from sov33.py. The shipped scorer remains the original `sov33_care_local.py` (recall on
the same held-out set is the honest baseline, not a leaked 1.00).

Real fix (data-blocked, not method-blocked): a TRAINED classifier on a large labelled harm corpus, evaluated on
a held-out split — needs the labelled data + GPU, which is the same compute gate as everything else.
