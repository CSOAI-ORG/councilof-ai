# PROVISIONAL PATENT APPLICATION

**Title:** Runtime Constitutional Gate for Artificial Intelligence Agent Operations

**Applicant:** CSOAI Ltd (UK 16939677)
**Inventor:** Nicholas Templeman
**Priority Date:** 2026-10-07
**Filing Route:** UK IPO Form 1 (provisional) → PCT at 12 months → national phases at 30 months

---

## 1. Field of the Invention

Relates generally to artificial-intelligence governance systems, and more
specifically to methods and systems for enforcing a written constitution as a
runtime control gate over AI agent executions — such that every execution is
audited against enumerated articles before completion, is bound to a
tamper-evident receipt, and terminates with a non-success status code when any
article is violated.

## 2. Background

Constitutional AI (Bai et al., arXiv:2212.08073, 2022) established that a
written list of principles can govern AI behaviour — but exclusively at
**training time**: the constitution shapes self-critique/revision during
fine-tuning and reinforcement learning from AI feedback. Anthropic's published
"Constitutional Classifiers" (Sharma et al., 2025) similarly operate as
input/output classifiers trained around a constitution, again a training- and
inference-filtering approach. Once a model is deployed, neither approach
re-evaluates each operational execution against the constitution.

Runtime guardrail systems exist (NeMo Guardrails, Microsoft's Agent
Governance Toolkit (6,176★), various agent sandboxes), but they take the form
of policy checklists, topic filters, or sandbox perimeters. They do not: (a)
enumerate a versioned constitution as numbered, individually auditable
articles; (b) evaluate a run against the constitution and attach a per-article
pass/fail finding to the run's record; (c) bind the run to a hash-chained
receipt whose verification is a step **separate from** invocation; and (d)
propagate constitutional failure to the caller via process exit status, making
violation machine-actionable rather than merely logged.

Regulation sharpens the unmet need. EU AI Act (Regulation 2024/1689)
Article 12 requires automatic record-keeping; Article 50 requires
transparency; Article 14 requires human oversight mechanisms. A system that
enforces a constitution at runtime, records per-article findings, and refuses
to report success on violation produces precisely the evidence those articles
assume exists.

No existing system combines: a numbered versioned constitution, per-run
per-article audit with machine-readable findings, receipt-bound effects,
separate post-invocation verification, non-automatic signing, explicit failure
stages, and exit-code propagation of constitutional status.

## 3. Summary — Claims

1. **A method for enforcing a written constitution at runtime over AI agent
   executions**, comprising: storing a plurality of numbered constitution
   articles as machine-readable records; receiving an execution request;
   evaluating the request and its resolved execution parameters against a
   subset of articles selected for runtime enforceability; producing, for each
   evaluated article, a finding comprising the article number, a pass/fail
   status, and a human-readable detail; and selecting the process termination
   status of said execution such that any failing finding forces a non-success
   exit status observable to the calling system. *(independent)*

2. **A method according to claim 1**, wherein evaluating includes a
   default-deny determination: a requested model or execution backend not
   present in an allow-listed catalog produces a fail finding, and no silent
   substitution of an alternative model is performed. *(independent)*

3. **A method according to claim 1**, further comprising: appending, for each
   execution, a receipt record to an append-only hash-chained log, said receipt
   bound to said findings; performing chain verification as a step temporally
   separate from invocation; and wherein cryptographic signing of the receipt
   occurs only upon an explicit operator instruction, never automatically.
   *(independent)*

4. **A method according to claim 1**, wherein evaluating includes a budget
   determination (a declared cost ceiling versus an estimated execution cost),
   an explicit-failure-stage determination (an execution whose backend
   reported an error may not produce an aggregate pass result), and a
   no-self-approval determination (any approval vote over the execution is
   produced by voters distinct from the generator of the execution output).
   *(independent)*

5. **An AI agent runtime system** comprising: a constitution store holding a
   versioned article set; an audit engine implementing claims 1-4; a receipt
   log; a verification routine distinct from the invocation path; and an
   agent-harness wrapper that routes model executions of multiple heterogeneous
   backends through said audit engine before returning results to the caller.
   *(independent — integrated system)*

## 4. Detailed Description — Reduction to Practice

Implemented in the `meok-ori` sovereign harness (Python 3.11+, stdlib-only),
operational and tested 2026-10-07.

- **Constitution store** — `meok_ori/core.py`, constant `ARTICLES`: 22
  numbered articles as `(int, str)` tuples (e.g., `(2, "Default deny")`,
  `(19, "No self-approval")`, `(22, "Versioned constitution")`). Mirrored in
  the operational charter `constitutional-harness/index.html` v0.1.0
  (PUBLIC_TWO_HOST_VERIFIED, five SHA-256 source pins) and loaded by
  `run_all_harnesses.py` (432 LOC) which imports all 22 as Python constants.
- **Audit engine** — `audit_run()` returns an `Audit` dataclass
  (`ok`, `findings[]`, `articles_total=22`); findings are produced for the
  nine runtime-enforceable articles: 2 (default-deny over model/backends),
  6 (budget), 7 (research/execution classification), 10 (receipt binding),
  11 (separate verification), 12 (non-automatic signing), 18 (explicit
  failure stages), 19 (no self-approval), 21 (public claim state).
- **Exit-code propagation** — `cli.py::_cmd_run` returns
  `0 if audit.ok and (council is None or council.approved) else 1`; verified
  live: a request for an unknown model exits 1 with failed articles `[2, 18]`.
- **Default-deny, no silent swap** — `complete()` refuses an explicit model
  absent from the backend catalog with `status="error"` *before* any
  tier-pickup occurs (defect found by live execution 2026-10-07 and fixed —
  the audited model is the *requested* model `a.model or res.model`).
- **Receipt chain** — `sign()/append_receipt()/verify_chain()`: HMAC-SHA256
  over canonical JSON, each entry carrying `prev` (genesis `0`×64); tampering
  any field or breaking a prev-link flips `verify_chain()` to false (tested).
  `--sign` is explicit (Art. 12); append is automatic (Art. 10).
- **Meta-seed ordering** — `constitution_cc0.py` folds Anthropic's CC0
  (2026-01-21) 4-tier hierarchy (Broadly safe > Broadly ethical > Compliant >
   Genuinely helpful) over the 22 articles: `coverage()` = 22/22 mapped,
  `priority_order()` sequences findings so oversight failures surface before
  helpfulness failures.
- **Tests** — `test_meok_ori.py` 34/34 pass (3.8s, hermetic);
  `test_all_harnesses_integrated.py` 50/50 pass (constitutional articles ×
  fabric × kernel × harness-x × runner); live smoke: local Ollama inference
  `status=live`, constitution PASS, exit 0; deny case exit 1.

### Prior-art comparison

| System | Enforces at | Numbered articles | Per-run findings | Receipt-bound | Exit-code on violation | Separate verification |
|---|---|---|---|---|---|---|
| Constitutional AI (Bai 2022) | training | yes (prompt) | no | no | no | no |
| Constitutional Classifiers (2025) | train + filter | yes | no | no | no | no |
| NeMo Guardrails | runtime | topics/rules | partial | no | no | no |
| MS Agent Governance Toolkit | runtime | checklist | partial | no | no | no |
| **This invention** | **runtime** | **22 numbered** | **per-article** | **hash-chained** | **yes** | **yes** |

## 5. Prior Art References

1. Bai, S. et al., "Constitutional AI: Harmlessness from AI Feedback,"
   arXiv:2212.08073, 2022. Training-time constitution; no runtime execution gate.
2. Sharma, R. et al., "Constitutional Classifiers," arXiv:2501.18837, 2025.
   Classifier-based filtering; no per-run article findings or receipts.
3. Anthropic, "Claude's Constitution," CC0 1.0, 21 Jan 2026 — cited as
   methodological seed (4-tier priority), incorporated under CC0.
4. Microsoft Agent Governance Toolkit, EU AI Act checklist (2026).
   Documentation-shaped conformance; not exit-code enforcement.
5. EU AI Act, Regulation (EU) 2024/1689, Articles 12, 14, 50 — regulatory
   requirement for record-keeping, oversight, transparency.
6. Castro & Liskov, "Practical Byzantine Fault Tolerance," OSDI 1999 —
   separate verification concept (quorum check separate from request handling).

## 6. Abstract

A runtime constitutional gate for AI agent operations. A numbered, versioned
constitution (22 articles) is stored machine-readably; every model execution
is evaluated against the runtime-enforceable subset, producing per-article
pass/fail findings; each execution appends a hash-chained receipt bound to
those findings; chain verification executes as a step separate from
invocation; signing occurs only on explicit instruction; error states are
explicit and cannot be reported as aggregate pass; approval votes, when
present, come from voters distinct from the output generator; and constitutional
failure forces a non-success process exit code, making violation
machine-actionable. The novelty is the combination of runtime enforcement,
per-article findings, receipt binding, separate verification, and exit-code
propagation — closing the gap between training-time constitutional AI and
operational regulatory evidence requirements.

## 7. Filing Instructions

- **UK IPO Form 1** (provisional, ~£60-100). Establishes priority date 2026-10-07.
- **PCT within 12 months** (by 2026-10-07); national phases at 30 months.
- Target jurisdictions: UK, EPO, US, JP, KR (AI-governance markets).
- **OIN 2.0 scope check (MANDATORY, executed 2026-10-07):** the invention is
  a measurement/governance-layer method over the sovereign substrate — it is
  **NOT** Linux-kernel-adjacent (not a Linux-System component). The OIN 2.0
  Sec. 1.2 grant-back does **not** apply. No Limitation Election required.
  Recorded per AGENTS.md Patent & IP Governance.
- **Public-disclosure warning:** the implementing code (meok-ori) is public on
  GitHub; UK 12-month grace period applies, but file immediately to secure
  the cleanest position.

## 8. Novelty Statement

The novelty resides not in any single primitive — numbered rule sets,
hash-chained receipts, exit codes, and allow-lists are each known — but in
their **combination as a runtime constitutional gate**: the constitution's
articles are the audit's unit of evaluation; each run's record carries
per-article findings; the receipt is bound to those findings and chained;
verification is architecturally separate from invocation; signing is opt-in;
errors are explicit and can never aggregate to pass; and the constitution's
verdict is expressed as process termination status. No cited prior art both
constitutes the constitution at runtime and propagates its verdict
machine-actionably while producing receipt-bound regulatory evidence.

---

*Prepared for CSOAI Ltd (UK 16939677). Inventor: Nicholas Templeman.
This document constitutes a reduction to practice of the claimed inventions
via the `meok-ori` sovereign harness and `constitutional-harness` of the
CSOAI sovereign substrate (34/34 harness tests, 50/50 integration tests
passing; live deny-exit verified 2026-10-07).*
