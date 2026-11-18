# Council of AI — approval-to-effect evidence replay pilot

**State: candidate commercial scope only. No customer, payment, booked run, independent assessment or completed fresh measurement.**

## Buyer question

An AI agent or MCP tool may acknowledge permission without doing the action, execute despite a revoked permission, or run twice after retry. We provide a bounded evidence review distinguishing authorization, decision, actual observed effect, missing evidence, and correction.

**Candidate:** a team operating an agent with one precisely defined, authorised sandbox action, one authority record, and one independently readable effect destination.

## Runnable demonstration

The public demo wraps the existing owned-file HITL approval-to-effect executor at harness/hitl/approval-effect-demo.mjs. It does not rewrite the existing engine.

Node 22+, from this repository's root:

    node --test harness/hitl/approval-effect-demo.test.mjs
    node scripts/pilot/approval-effect-replay.mjs --out pilot-demo-result.json

The second command creates a new file and refuses to overwrite an existing result. It checks 14 synthetic cases: one allowed action, observed in a separate local process, plus thirteen refused cases including revocation, stale authority, expiry, wrong scope, changed request, invalid signature, substitute key, missing trust pin, and retry. It fails with nonzero exit when the actual outcomes or limitations differ from expectations.

**Report fields:** trial source SHA-256, observation time, cases, expected effect/readback results and explicit limitations.

This is **not** evidence of a real authenticated human, independent institutional review, production authority, safety certification, GSPC measurement or a paying customer. The demo's trusted authority SHA comes from the local test runner, not an external authority service.

## Proposed engagement — subject to written acceptance

1. **Scope:** buyer names the agent, intended decision, exact action/resource, sandbox, authority provider, data sensitivity, observation point and deadline.
2. **Pre-register:** agree signed or independently pinned authority source, revocation and expiry semantics, expected negative controls, unknown-outcome handling, sample size, permitted use and independent observer.
3. **Run:** exercise the action only in an explicitly authorised sandbox; capture the approval, tool request, acknowledged outcome, independent readback, source digests and retry/revocation controls.
4. **Deliver:** human report plus machine-readable results, scripts, source revision, limitations, corrections route and immutable digests; labels distinguish VERIFIED / INVALID / UNCHECKABLE.
5. **Accept:** buyer or independent reviewer replays the tests, confirms whether acceptance criteria were met and records exceptions. A delivery cannot be called an accepted customer project without this evidence.

## Acceptance gates for first real customer

- Written statement of work and controller/processor responsibilities where relevant.
- Named buyer-controlled action and no secrets supplied over the public form.
- Complete positive or explicit UNCHECKABLE result; no fabricated passing score.
- At least one wrong-scope/revoked action blocked; a modified evidence record rejected; replay does not duplicate the effect.
- Reproduction on separate environment with pinned versions and source bytes.
- Written buyer acceptance of the deliverable; record the actual invoice and payment separately.

## Commercial terms and exclusions

Price and completion window require a separate written quote. No public pricing, blanket compliance assertion or guaranteed certification. Fresh live GSPC measurement must not be promised while worker health and commissioning are unverified. No automatic customer data upload or private-account access exists in this demo.

**Enquiry route:** https://councilof.ai/contact/?arm=pilot — currently email/copy; a draft PR proposes optional KV storage with no email notification.

## Operational prerequisites

Resolve worker health and CI reliability; establish monitored intake, access/retention policies, NDA/DP agreement and review authority. Only after that should customer work begin. The first pilot is success only if real independent readback and the buyer's acceptance are recorded.
