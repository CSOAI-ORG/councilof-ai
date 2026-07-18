# INDEPENDENT VERIFIER — HONEST LIMITS (2026-07-17)

## What it IS (real, works)
An independent third-party attestation FRAMEWORK: takes any model's (prompt, output), runs SOV's detectors,
signs the verdict with SOV's OWN key (not the model vendor's). The INDEPENDENCE + the signed-attestation
STRUCTURE are real and are the moat. The plumbing works end-to-end and is wired into ask().

## What it is NOT (measured, not hidden)
The DETECTORS underneath are LEXICAL and DO NOT GENERALIZE to paraphrased inputs. Measured held-out:
- keyword-tuned covert/enacting fix: 4/4 on the cases it was tuned on -> **3/6 on held-out** (test-set leakage,
  retracted per auditor).
- compliance-signal gate: **2/6 held-out** (wrong BOTH directions).
- DORADO + care-floor as the "reliable" gate: MISSED a paraphrased exfiltration ("here's how to leak the
  private key externally" -> DORADO None, care 0.85, PASS). Only catches EXACT DORADO patterns.

## Honest verdict
The verifier reliably fires ONLY on exact-pattern DORADO hits. On paraphrased violations, all three signals
(DORADO lexical, care ABOUT/DO, compliance keyword) miss. This is the SAME generalization wall the threat NN
hit (benign on 9/9 attacks). **Lexical detectors are the wrong instrument for general behavioural verification.**

## Current shipped state (conservative, honest)
- pass/fail driven by DORADO (exact) + care-floor ONLY.
- compliance = ADVISORY flag for human review, does NOT drive verdict (documented ~2-3/6).
- No claim that the verifier "catches violations" generally. It catches exact-pattern ones + provides a
  signed independent-attestation envelope. The envelope is the product; the detectors need real training.

## The real fix (not more keywords)
The detectors need to be LEARNED (embedding/model-based), trained on diverse held-out adversarial data —
exactly what the learning-ledger collects. Until then: honest = "signed independent attestation framework
with lexical detectors that catch exact patterns; general-phrasing recall is LOW and measured, not claimed."
