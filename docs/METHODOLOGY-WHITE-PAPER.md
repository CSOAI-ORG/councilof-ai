# CSOAI / GSPC Measurement Methodology (White Paper)

*Measurement, not certification. Published methodology — the governance asset a stranger can audit.*

## 1. The instrument
A **frozen, exact-label measurement** runs each axis (governance, bond-router, insurance,
stock-market, east-west, sme-fractional, agent-economy, data-dao, eunomia-token,
climate-transition, privacy-risk) against a model. The item bank is hash-pinned (frozen),
gold-labelled, and carries a canary anchor for contamination detection. Only a MEASURED
axis earns a number (JL.5).

## 2. Statistical method (the rigor)
- **Wilson 95% confidence intervals** for every proportion metric (accuracy/pass-rate).
  Wilson is used because it avoids the Wald interval's failures near 0 and 1 — the
  de-facto standard for LLM-eval proportions (Evan Miller, "Adding Error Bars to Evals,"
  arXiv:2411.00640, Anthropic; NIST AI RMF MEASURE function; Wilson, 1927).
- **No leader on overlapping intervals.** A model is only declared a leader if its
  interval does not overlap the fleet mean. This is a **deliberately conservative**
  anti-overclaiming rule (audit-friendly). Paired/McNemar test is used for head-to-head
  leader-vs-runner-up claims (the field standard), closed as a documented conservative rule.
- **Multiple-testing discipline** (Benjamini-Hochberg family) where many axes are compared.
- **Honest zeros + UNTESTED render.** The jail axis renders UNTESTED until earned
  (owner-signed activation + frozen bank + harness disclosure + consent gate + first
  stranger-verified card — all five). A status that cannot be checked cannot say LIVE.

## 3. The Measurement Engine (EAT chain)
measure → Wilson CI → **Ed25519-signed card** (content_id, `did:web:csoai.org#estate-chain-1`)
→ chain → anchor → board → mirror (Oracle-replicated). Every card state: what was measured,
when, against which frozen bank, and what it never proves (quality verdict, compliance
determination, investment relevance). Recompute-able: anyone re-derives the score from the
published frozen bank + harness.

## 4. Governance / anti-claim gate
**ClaimGuard** gates every public claim (rejects absolutist "every problem"/"guaranteed"/
"certified" phrasings; requires the canonical "signed coverage" framing + the estate signer).
**ops/banned-strings** rejects codenames on public surfaces. **Regulators free forever (R8)**;
the commercial lane is data-by-query (evidence packs), never scores. SOS non-equivalence:
never a rating agency (JI.4), never a currency.

## 5. Alignment to published standards
- **Evan Miller (arXiv:2411.00640)** — the reference for eval error bars (Wilson + paired diffs).
- **NIST AI RMF MEASURE** — "rigorous performance evaluation with measurements of
  uncertainty, comparisons to performance benchmarks, structured reporting."
- **ISO/IEC 42001:2023 / 42005:2025** — AI management-system + impact-assessment framing.
- **IOSCO CRA Code of Conduct Fundamentals** — the governance vocabulary we voluntarily map to.
- **Evan Miller's criticism** of "the highest number is best" culture — answered by our
  refusal to declare a leader on overlapping intervals.

## 6. Strangers can verify
Any card verifies at `/gspc-verify` (offline-recompute, loginless, free, independent of us).
The DID (`did:web:csoai.org#estate-chain-1`) resolves; the key is on the signing pod (GX.2).

*Published 2026-08-25. The methodology is the measurement body's governance asset. It is
not a legal opinion; the Wilson-CI + separation rule is documented as deliberately conservative.*
