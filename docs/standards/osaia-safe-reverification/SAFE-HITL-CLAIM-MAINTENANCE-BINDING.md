# SAFE / HITL / Claim-Maintenance Binding

Status: **CSOAI candidate integration note**, 7 October 2026. This is not an Open Secure AI Alliance standard, adoption decision, certification or vendor endorsement.

## Composition

The pieces are intentionally separate and composable:

`persistent finding -> scoped authority decision -> invocation -> observed effect -> independent verification -> maintained claim`

1. A persistent SAFE finding or control keeps its stable identity and revision history.
2. A HITL authority-to-effect record binds the exact proposal and scope to an explicit decision, authority epoch and expiry.
3. A separately authorized executor may invoke the action. The executor does not inherit measurement, signing or publication authority.
4. The observed external effect is recorded independently from the invocation acknowledgement.
5. A separate verifier evaluates the declared effect against retained evidence.
6. A re-verification / claim-maintenance record states the falsifiable claim, dependencies, method, negative control, current result, freshness triggers and retest bound.

## Binding without a new dependency

The existing SAFE re-verification candidate already allows a dependency of kind `approval` with URI and digest. That dependency can point at a `csoai.hitl-authority-effect/0.1` record. The re-verification schema therefore does not need to absorb authority semantics or depend on GSPC.

Likewise, the HITL record contains an optional `claim_maintenance.reverification_record_ref`, so the action record can point forward to the claim-maintenance record without making the verifier an authority.

## Trigger model

A maintained claim becomes `RETEST_DUE`, `STALE` or `UNMEASURED` when the evidence required to keep it current changes or becomes unavailable. Triggers include subject/version change, model/tool/runtime/configuration/policy change, authority epoch/revocation/expiry change, new conflicting evidence, an incident or near miss, and elapsed review age.

A previously valid approval does not keep a derived claim current after a material change. Conversely, a stale claim does not revoke authority by itself; authority and claim state remain separate controls.

## Runtime and protocol placement

- **GSPC / Harness X:** optional measurement, verification, correction and claim-maintenance consumer. It never grants execution authority.
- **OpenShell:** optional bounded executor/enforcement boundary. It never grants measurement or signing authority.
- **OpenBMC / Redfish:** optional read-only physical-host evidence unless a separate explicit state-changing authorization exists.
- **LFX:** optional public project/security observation input; never execution or compliance authority.
- **MCP / A2A:** capability and delegation protocols. Discovery or routing does not equal authorization.
- **AG-UI / A2UI:** interaction/presentation projections only unless separately bound to an authorized effect path.

## Evidence and ceremony

Signatures, transparency logs, SCITT-style receipts, Rekor inclusion, OpenTimestamps, OTEL traces, OCSF records and independent witnesses can bind origin, integrity, timing, custody or observation. None of them, alone, proves the underlying claim true or grants authority. The measurement method and its negative controls remain responsible for the scoped truth claim.

## Conformance sequences

| Case | Authority | Invocation | Effect | Verification | Maintained claim |
| --- | --- | --- | --- | --- | --- |
| Positive | APPROVE/current | EXECUTED | OBSERVED | VERIFIED | CURRENT |
| Denied | DENY | REJECTED | NONE | NOT_RUN | unchanged or NOT_WATCHED |
| Revoked before execution | REVOKE | NOT_INVOKED/REJECTED | NONE | NOT_RUN | RETEST_DUE if claim depended on authority |
| Effect unknown | APPROVE/current | EXECUTED | UNKNOWN | UNCHECKABLE/NOT_RUN | UNMEASURED or RETEST_DUE |
| Dependency drift | still separately evaluated | independent | independent | old result cannot silently stand | RETEST_DUE/STALE |

## Source linkage

- Public constitutional harness: `https://councilof.ai/.well-known/constitutional-harness.json`.
- Candidate HITL schema: `hitl-authority-effect-v0.1.schema.json`.
- Candidate claim-maintenance schema: existing `safe-reverification-record-v0.1.schema.json`.
- Candidate plugin binding: `csoai-alliance-control-plugin-v0.2.json`.

The design target is one control fabric, not one mandatory engine.

[executed on device: IOKs-MacBook-Air.local (3a313181-9802-49ab-b57a-b58a3fd4466a)]