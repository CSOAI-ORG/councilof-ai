# GSPC Measurement Methodology — the unsolicited, statistically-governed, cryptographically-signed attestation (v0.2, 2026-08-25)

**Publication of the methodology is the differentiator.** Moody's Token Integration Engine, S&P on-chain
Stablecoin Assessments, Chainlink ACE, Credora/RedStone, and Particula all compete on brand/integration —
**none** publicly discloses confidence-interval methodology, statistical-separation testing, or third-party
audit of the *sampling uncertainty* behind its scores (they audit process/independence, not statistics).
This doc is the methodology that converts GSPC's hidden statistical discipline into a public, citable
governance asset. The core thesis: **GSPC cannot out-brand Moody's; it can out-rigor and out-independence them.**

## The position (defensible moat)
**Unsolicited + permissionless** (no issuer opt-in, no issuer payment) + **statistically-governed**
(Wilson intervals, conservative separation rule, paired tests) + **cryptographically signed**
(SHA-256 content-addressing, Ed25519, Goofy stranger-verifiable). No incumbent offers that combination.

## Statistical methodology (the honest core)
1. **Rate metrics use Wilson 95% confidence intervals** (Wilson 1927; the de-facto standard for accuracy /
   pass-rate metrics per the 2024 Anthropic evaluation methodology guide, Evan Miller, arXiv:2411.00640,
   and the 2025–26 arXiv benchmark consensus). Wilson avoids the Wald interval's failure near 0 and 1.
2. **Separation rule = deliberately conservative anti-overclaiming.** GSPC declares a *tie* (not a "leader")
   when the leader's Wilson interval overlaps the fleet mean — it does **not** declare a winner on
   overlapping intervals. The research counsel is explicit: overlapping CIs do **not** by themselves prove
   non-significance, so this is documented as a *conservative* design, not a formal significance test.
3. **Paired head-to-head uses a McNemar exact test** (on discordant pairs) — the field standard for
   "does A beat B", added to close the one methodological criticism a sophisticated reviewer could raise.
   Multiple-testing correction (Benjamini-Hochberg at α=0.05) is applied across axes.
4. **UNMEASURED never 0.** A timeout / unavailable measurement is reported UNMEASURED, never scored 0
   (0 is a real measurement; a lack of data is not). Ouroboros gate: a re-measure that times out never
   clobbers a prior real score with `None`.
5. **Frameworks mapped:** NIST AI RMF MEASURE (rigorous testing + measures of uncertainty + structured
   reporting), ISO/IEC 42001 (AI management-system governance), Stanford HELM multi-metric reporting.
   GSPC's discipline is ahead of MLPerf/MLCommons, which reports point estimates with no confidence intervals.

## The measurement card (what a stranger verifies)
`subject_digest · score_vector(+Wilson CI) · env_commitment · replay_merkle_root · method · timestamps`
+ self-description `sig_alg=Ed25519/EdDSA (NIST IR 8547), hash_alg=SHA-256`. Envelope COSE_Sign1 alg -19;
`iss=evaluator, sub=subject`; RFC 9943 §6 / 9942 receipts. Traces stay off-card (reproducible, not shipped).
Inclusion proven by receipt + Merkle root; non-equivocation needs consistency proofs (never implied by the
receipt alone).

## Governance / honesty (bind)
- **Measurement, never certification.** Determination stays with authorities. Never a rating (JI.4).
- **Anti-touting:** demonstrably **not issuer-paid** per asset; no issuer opt-in; transparent methodology.
  Framed with the credit-rating-agency opinion disclaimer (statement of opinion, not fact; not a
  recommendation; no suitability; as-of-date) — drafted on the S&P/Moody's template.
- **Never the scored** (buyer/insurer/regulator/consumer-advocate pays). No issuer payment, ever.
- **JL.5:** a status that cannot be checked cannot say LIVE. Honest zeros / UNMEASURED render.
- **IY Wall 2:** scenario-measurement, never forecast (SYNTHETIC-SIM labels).

## References
- Evan Miller, "Adding Error Bars to Evals" (Anthropic), arXiv:2411.00640, Nov 2024.
- Wilson, E.B. (1927), Probable inference, the law of succession, and statistical inference.
- McNemar (1947) + paired exact test; Benjamini-Hochberg (1995).
- NIST AI RMF (MEASURE function); ISO/IEC 42001:2023; Stanford HELM.
- W3C Verifiable Credentials 2.0 (Recommendation, May 15 2025) — EdDSA cryptosuite maps to XRPL Ed25519;
  ECDSA cryptosuite to EVM secp256k1. XRPL XLS-70 Credentials (mainnet Sept 4 2025) is modeled on it.
- SEC Staff "Statement on Tokenized Securities" (Jan 28 2026) + CRA unsolicited-rating disclaimer template.

## Stranger-verify path
Recompute the canonical body (sorted, compact) → SHA-256 content_id → Ed25519 verify against the embedded
public key (or the estate signing pod, did:web:csoai.org#board-attestation-1). `verify` = VALID/INVALID.
