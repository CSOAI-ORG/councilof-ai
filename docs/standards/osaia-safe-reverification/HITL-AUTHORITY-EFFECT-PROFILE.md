# HITL Authority → Effect Profile

Status: **candidate CSOAI profile**, 7 October 2026. It is not an Open Secure AI Alliance standard and does not require GSPC, OpenShell, OpenBMC, LFX, or any particular engine.

**Update — 27 October 2026: v0.2.** `hitl-authority-effect-v0.2.schema.json` supersedes v0.1. The
v0.1 bytes are preserved unchanged. v0.2 closes two bindings that v0.1 left to the consumer, and
both are now executable (`test_hitl_authority_effect_v0_2.py`, 39 checks: 3 must-pass, 29
must-fail, 4 negative controls against v0.1, 3 temporal checks).

1. **A claim that is not CURRENT does not authorize a consequential execution.** `STALE`,
   `RETEST_DUE`, `UNMEASURED` and `NOT_WATCHED` are non-authorizing. Concretely: a live
   (`ACTIVE`) authority release may not rest on a claim that is not `CURRENT`; an `APPROVE`
   decision requires the claim to have been `CURRENT` **at the decision**; an `EXECUTED`
   invocation requires it to have been `CURRENT` **at the invocation**. The decision-time and
   invocation-time states are separate fields from the live watch state, so a claim that goes
   stale *after* a historical execution does not force that history to be rewritten — the
   release is marked no longer live and the record stays truthful.
2. **An `APPROVE` decision is bound to a current external authority record.** The authority
   block must carry the `operational_baseline` (the state of the subject and its dependencies
   the decision was taken against), the `scope_digest`, the `authority_epoch`, the
   `validity_window` (`not_before` / `not_after`, the expiry), the `release_state`, the
   `revocation_state` and the `external_record_ref` + `external_record_digest`. A revocation
   state of `REVOKED` **or `REVOCATION_UNKNOWN`** cannot support an `APPROVE` — unknown fails
   closed.

The negative control is the point: every record that v0.2 rejects in these ways is also run
against v0.1, and **v0.1 accepts it**. If v0.1 rejected them, the gap was never a gap and the
new controls would prove nothing.

Timestamps are the one part JSON Schema cannot compare, so the validity window, the decision
time, the invocation time and the observation times are enforced by the reference checker in the
same test file. Those rules remain consumer requirements in the profile text; the test makes
them executable.

This candidate is a portable structural record relating a reviewed proposal, a scoped decision, an invocation, an observed effect and a verification report. Schema validation checks declared fields and permitted state combinations. It does not authenticate the principal, resolve referenced evidence, compare recorded digests with source bytes, establish current authority or revocation, or prove that the reviewed scope actually executed.

The normative separation is:

`proposal ≠ approval ≠ invocation ≠ effect ≠ verification ≠ claim maintenance`.

A human or other explicitly authorized principal may approve, deny or revoke. Approval is scoped, time-bounded and versioned. A DENY or REVOKE record cannot accompany an EXECUTED invocation. An EXECUTED invocation requires an APPROVE decision plus executor, time and invocation digest. An observed effect requires its own digest. A VERIFIED/FAILED/PARTIAL verification requires a verifier, method and retained evidence.

GSPC is an optional verifier/claim-maintenance consumer. It may ingest the record as evidence, but measurement never grants execution authority. OpenShell can be an executor, but the profile is runtime-neutral. OpenBMC/Redfish can supply host evidence where separately authorized. LFX can supply public project/security observations but never execution authority.

For SAFE, this is intended to compose with approval-to-execution scope binding (#13), replay/re-execution distinction (#42), evidence states (#31/#64), persistent finding identity/corrections (#35), and the separate CSOAI SAFE re-verification profile. A SAFE re-verification dependency of kind `approval` can pin this record by URI+digest; no change to the existing re-verification schema is required.

Claim maintenance remains separate. A claim derived from an effect can reference a re-verification record and declare `CURRENT`, `RETEST_DUE`, `STALE`, `UNMEASURED`, or `NOT_WATCHED`. Subject/version, policy, authority, dependency, evidence conflict, incident/near-miss, or age can trigger re-measurement.

**v0.2 — what "separate" now means in the schema.** Separate is not the same as unconnected. In
v0.1 the two were separate in the text and unconnected in the data, which allowed an `APPROVE`
and an `EXECUTED` invocation to sit beside a `STALE` claim with nothing in the record objecting.
In v0.2 the claim state is connected to the authorization in exactly one direction: a claim that
is not `CURRENT` can no longer authorize. It still cannot *grant* authority, it can only withhold
it. Authority remains a separate decision by a separate principal; the claim's currency is a
precondition on that decision, not a substitute for it.

Consumer requirements (not established by schema validation):
- default deny on malformed/unknown authority;
- no self-expanding scope;
- no reusable raw credentials in the record;
- revocation is a new decision, never an edit of history;
- effect verification is distinct from invocation success;
- signatures/timestamps/transparency receipts prove origin/integrity/time claims only;
- historical records are retained and superseded rather than rewritten.

Consumer acceptance must independently resolve and hash the declared proposal, scope, invocation, effect and evidence artifacts; check their exact source pins and intended producer/consumer binding; and authenticate the relevant principal and assess authority epoch, expiry and current revocation. Invocation timing must fall within the declared approval interval, and stage times must be consistent. These are consumer requirements until an actual resolver and enforcement path implement them. A retained record or synthetic example does not establish those checks, live execution or verifier independence. An observed unauthorized effect must remain available as incident evidence and must not be promoted into a conformant current authorization claim.
