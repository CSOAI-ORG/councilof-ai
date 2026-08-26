# Static benchmarks are collapsing — the fix is procedural

**When a test set sits in the training data, that set stops measuring intelligence and starts measuring memory. The way out is to generate the test the moment the evaluation begins.**

**Key finding:** An audit of a flagship coding benchmark by a frontier lab's own eval team found nearly 60% of the audited tasks contained flawed test cases that rejected functionally correct solutions. Separately, a research agent reached near-perfect scores across eight major benchmarks without solving the underlying tasks — the classic signature of data leakage and benchmark contamination.

**Insight:** Static datasets measure the history of a training run, not the intelligence of the resulting agent. Restoring construct validity takes frozen, held-out procedural generation: a novel environment instance for every evaluation, so the specific parameters never exist in any training corpus. Scoring runs on deterministic mathematical predicates — objective outcomes, not the subjective judgment of another model — and confidential generation seeds keep the run leakage-resistant.

**Bottom line:** The fix is not a bigger static file; it is a procedural arena, anchored to a consent-gated human baseline with strict interface parity and a firewall between the measurement backend and the commercial layer. That is the mathematical path back to construct validity in AI evaluation.

---
*Mined from canon: `Construct_Validity_in_AI_Evaluation` (transcript, 407s) · Council of AI · csoai.org · signed · measured · sovereign — generated 2026-08-25 · Measurement, never certification.*
