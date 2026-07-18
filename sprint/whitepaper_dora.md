This is a writing task with a clear scope. The user's instructions (CLAUDE.md context) are detailed and load-bearing. No skill matches a "write a white paper outline + intro" task, and no tools are needed — I have all the facts I need from the brief. I'll produce the markdown directly.

# White Paper #1 — Attested Governed-vs-Ungoverned Compliance Simulation: A DORA Case Study

## Outline

### 1. Executive Summary
- One-paragraph statement of the problem (self-attestation), the method (sovereign signing + external anchoring), and the artifact (a third-party-verifiable verdict ledger).
- Explicit scope note: all results are **in-simulation**; this paper demonstrates a *method of proof*, not a production compliance certification.

### 2. The Credibility Gap in AI Governance
- 2.1 The self-attestation problem: in most governance tooling, the same party that *runs* the agents also *judges* and *signs* the outcome. The signature proves custody, not correctness or independence.
- 2.2 Why symmetric/cloud schemes don't close the gap:
  - **Microsoft Agent Governance Toolkit (HMAC):** symmetric secret — the verifier must hold the same key as the signer, so a third party cannot independently verify without trusting the issuer. Not third-party-verifiable.
  - **Asqav (cloud/server-side signing):** signing authority lives with the vendor; introduces single-vendor dependency and a trust root you cannot inspect offline.
- 2.3 What a regulator, auditor, or design partner actually needs: an **offline-verifiable, third-party-verifiable, no-single-vendor** proof.

### 3. CSOAI's Answer: The SIGIL Chain
- 3.1 Sovereign **local asymmetric signing** (Ed25519) on local infrastructure — private key never leaves the operator; anyone can verify with the public key, no vendor in the loop.
- 3.2 **Merkle aggregation** of attestable verdicts into a single root.
- 3.3 **External anchoring** via OpenTimestamps → Bitcoin: independent, non-CSOAI timestamp authority proves *existence-before-time-T* without trusting us.
- 3.4 **Commit-reveal** public proofs: commit to outcomes before reveal to prevent post-hoc selection/cherry-picking.
- 3.5 The separation of powers: *runner ≠ judge ≠ timestamp authority*. This is the structural fix for the self-attestation problem.

### 4. The DORA Policy-Lab Experiment
- 4.1 Why DORA: in force since 17 Jan 2025 — a real, live obligation (ICT risk, incident reporting, operational resilience), not a postponed deadline.
- 4.2 Experiment design as **control vs. treatment**: identical agent workloads run **ungoverned** (control) and **governed** under a DORA-derived policy (treatment).
- 4.3 What is measured in-sim: policy-violation rate, blocked-vs-allowed actions, incident-reporting completeness — *[metrics from attested run]*.
- 4.4 In-sim results (placeholders, to be filled from a signed run):
  - Ungoverned violation rate: `[result from attested run]`
  - Governed violation rate: `[result from attested run]`
  - Delta / governance lift: `[result from attested run]`
- 4.5 Every reported figure traces to a Merkle leaf anchored on Bitcoin — the result is *checkable*, not *claimed*.

### 5. The Multi-Model Jury
- 5.1 Why a jury: a single judge model can be biased, gamed, or simply wrong; trustworthy verdicts need adjudication that isn't a single point of failure.
- 5.2 Architecture: A/B competitors (llama3.1:8b vs gemma3:4b) judged by an independent model (falcon3:7b), on **local Ollama** — sovereign inference, not pooled APIs.
- 5.3 The **attestable** discipline: only decisive, cleanly parsed verdicts are recorded as attestable; ties are re-judged, then recorded as `winner="TIE"` and excluded from attestable counts. Indecision is logged, never laundered into a result.

### 6. Post-Quantum Migration: A Sober Note
- 6.1 Today: Ed25519 is the signing primitive — fast, small, widely verifiable.
- 6.2 Threat horizon: a cryptographically relevant quantum computer would break Ed25519; this is a *future* risk, not a present break. No hype.
- 6.3 Path: migrate to **ML-DSA (FIPS 204)**; design the ledger to support **algorithm agility** and dual-signing so historical anchors remain verifiable across the transition.
- 6.4 Honest limitation: Bitcoin/OpenTimestamps anchoring inherits the chain's own PQC timeline — we anchor the *proof-of-existence*, and the migration plan is staged, not instantaneous.

### 7. Positioning Summary (Comparison Table)
- Axes: signing primitive (asymmetric vs symmetric), where the key lives (local vs cloud), third-party-verifiable (yes/no), offline-verifiable (yes/no), external timestamp authority (yes/no), single-vendor dependency (no/yes).
- CSOAI vs Microsoft AGT (HMAC) vs Asqav (cloud).

### 8. Scope, Limitations, and What This Does *Not* Claim
- In-sim only; no production certification; no claim about real-world firm compliance.
- No fabricated metrics; all numbers carry a verifiable provenance link or are marked as placeholders.
- What would advance this beyond simulation: a design partner running it against real workloads.

### 9. Appendix
- A. Verification walkthrough: how a third party checks a signature, a Merkle proof, and an OpenTimestamps receipt with no CSOAI involvement.
- B. Glossary (Ed25519, Merkle root, OpenTimestamps, commit-reveal, ML-DSA, attestable).
- C. Reproducibility notes and artifact references.

---

## Introduction (≈300 words)

Artificial-intelligence governance has a quiet credibility problem: in most of today's tooling, the same party that operates the agents also judges their behavior and signs the result. A signature produced this way proves only custody — that *someone* held the data — not that the verdict was independent or correct. When the auditor, the regulator, and the vendor all collapse into a single trust root, "attestation" becomes self-attestation, and self-attestation is exactly what an external reviewer cannot rely on.

Existing approaches do not close this gap. Symmetric-key schemes such as Microsoft's Agent Governance Toolkit (HMAC) require the verifier to hold the same secret as the signer, so no genuinely independent third party can check the claim. Cloud or server-side signing services such as Asqav keep the signing authority — and the trust root — inside the vendor, reintroducing single-vendor dependency and removing offline verifiability.

This paper presents an alternative built on a structural separation of powers. CSOAI runs a governed-versus-ungoverned compliance simulation in which the *runner*, the *judge*, and the *timestamp authority* are deliberately distinct. Verdicts are signed locally with Ed25519 (the private key never leaves the operator), aggregated into a Merkle root, and anchored externally to Bitcoin via OpenTimestamps, with commit-reveal preventing post-hoc cherry-picking. The result is a verdict ledger — the SIGIL chain — that is sovereign, offline-verifiable, third-party-verifiable, and free of any single-vendor dependency.

We demonstrate the method through a DORA Policy-Lab experiment: identical agent workloads run as a control-versus-treatment pair, adjudicated by a multi-model jury on local inference, with only decisive verdicts recorded as attestable. All figures here are strictly in-simulation and are reported as placeholders pending signed runs; this is a demonstration of a *method of proof*, not a production compliance certification. We close with a sober Ed25519-to-ML-DSA post-quantum migration note.