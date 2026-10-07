# HITL Authority → Effect Profile

Status: **candidate CSOAI profile**, 7 October 2026. It is not an Open Secure AI Alliance standard and does not require GSPC, OpenShell, OpenBMC, LFX, or any particular engine.

This profile closes one specific gap: a system can record that a human reviewed something, and separately record that a tool ran, without proving that the exact reviewed scope is the scope that executed. The record binds the proposal, decision, authority epoch, scope digest, invocation, observed effect and independent verification.

The normative separation is:

`proposal ≠ approval ≠ invocation ≠ effect ≠ verification ≠ claim maintenance`.

A human or other explicitly authorized principal may approve, deny or revoke. Approval is scoped, time-bounded and versioned. A DENY or REVOKE record cannot accompany an EXECUTED invocation. An EXECUTED invocation requires an APPROVE decision plus executor, time and invocation digest. An observed effect requires its own digest. A VERIFIED/FAILED/PARTIAL verification requires a verifier, method and retained evidence.

GSPC is an optional verifier/claim-maintenance consumer. It may ingest the record as evidence, but measurement never grants execution authority. OpenShell can be an executor, but the profile is runtime-neutral. OpenBMC/Redfish can supply host evidence where separately authorized. LFX can supply public project/security observations but never execution authority.

For SAFE, this is intended to compose with approval-to-execution scope binding (#13), replay/re-execution distinction (#42), evidence states (#31/#64), persistent finding identity/corrections (#35), and the separate CSOAI SAFE re-verification profile. A SAFE re-verification dependency of kind `approval` can pin this record by URI+digest; no change to the existing re-verification schema is required.

Claim maintenance remains separate. A claim derived from an effect can reference a re-verification record and declare `CURRENT`, `RETEST_DUE`, `STALE`, `UNMEASURED`, or `NOT_WATCHED`. Subject/version, policy, authority, dependency, evidence conflict, incident/near-miss, or age can trigger re-measurement.

Security properties:
- default deny on malformed/unknown authority;
- no self-expanding scope;
- no reusable raw credentials in the record;
- revocation is a new decision, never an edit of history;
- effect verification is distinct from invocation success;
- signatures/timestamps/transparency receipts prove origin/integrity/time claims only;
- historical records are retained and superseded rather than rewritten.

Reference implementation note: CSOAI's current constitutional harness already separates policy, authority state, executor, GSPC measurement, effect receipts, signer and publisher. This profile makes the approval event itself portable and independently bindable.

[executed on device: IOKs-MacBook-Air.local (3a313181-9802-49ab-b57a-b58a3fd4466a)]