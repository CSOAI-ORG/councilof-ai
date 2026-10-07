# HITL Authority → Effect Profile

Status: **candidate CSOAI profile**, 7 October 2026. It is not an Open Secure AI Alliance standard and does not require GSPC, OpenShell, OpenBMC, LFX, or any particular engine.

This candidate is a portable structural record relating a reviewed proposal, a scoped decision, an invocation, an observed effect and a verification report. Schema validation checks declared fields and permitted state combinations. It does not authenticate the principal, resolve referenced evidence, compare recorded digests with source bytes, establish current authority or revocation, or prove that the reviewed scope actually executed.

The normative separation is:

`proposal ≠ approval ≠ invocation ≠ effect ≠ verification ≠ claim maintenance`.

A human or other explicitly authorized principal may approve, deny or revoke. Approval is scoped, time-bounded and versioned. A DENY or REVOKE record cannot accompany an EXECUTED invocation. An EXECUTED invocation requires an APPROVE decision plus executor, time and invocation digest. An observed effect requires its own digest. A VERIFIED/FAILED/PARTIAL verification requires a verifier, method and retained evidence.

GSPC is an optional verifier/claim-maintenance consumer. It may ingest the record as evidence, but measurement never grants execution authority. OpenShell can be an executor, but the profile is runtime-neutral. OpenBMC/Redfish can supply host evidence where separately authorized. LFX can supply public project/security observations but never execution authority.

For SAFE, this is intended to compose with approval-to-execution scope binding (#13), replay/re-execution distinction (#42), evidence states (#31/#64), persistent finding identity/corrections (#35), and the separate CSOAI SAFE re-verification profile. A SAFE re-verification dependency of kind `approval` can pin this record by URI+digest; no change to the existing re-verification schema is required.

Claim maintenance remains separate. A claim derived from an effect can reference a re-verification record and declare `CURRENT`, `RETEST_DUE`, `STALE`, `UNMEASURED`, or `NOT_WATCHED`. Subject/version, policy, authority, dependency, evidence conflict, incident/near-miss, or age can trigger re-measurement.

Consumer requirements (not established by schema validation):
- default deny on malformed/unknown authority;
- no self-expanding scope;
- no reusable raw credentials in the record;
- revocation is a new decision, never an edit of history;
- effect verification is distinct from invocation success;
- signatures/timestamps/transparency receipts prove origin/integrity/time claims only;
- historical records are retained and superseded rather than rewritten.

Consumer acceptance must independently resolve and hash the declared proposal, scope, invocation, effect and evidence artifacts; check their exact source pins and intended producer/consumer binding; and authenticate the relevant principal and assess authority epoch, expiry and current revocation. Invocation timing must fall within the declared approval interval, and stage times must be consistent. These are consumer requirements until an actual resolver and enforcement path implement them. A retained record or synthetic example does not establish those checks, live execution or verifier independence. An observed unauthorized effect must remain available as incident evidence and must not be promoted into a conformant current authorization claim.
