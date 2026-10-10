# CSOAI / SAFE-GALC synthetic compatibility scenario v0.1

This is a review-only companion to Gary Gayle's request on OpenSecureAIAlliance/RFCs PR 39 (comment 6071812927). All records, IDs, transactions, provider evidence, and effects are **invented**. It is not a demonstration of payment, execution, authenticated custody, signature verification, or SAFE adoption.

## Files and interpretation

- scenario-input.json: one logical action (A1), two distinct attempts (T1/T2), two observations (O1/O2), one original finding F1 and one append-only correction F2.
- verification-context.json: separately declared synthetic provider-operation truth. Only OP1 has an effect receipt and sink record.
- expected-output.json: linkage expectations, not an oracle for SAFE-GALC semantic-property status.
- validate_fixture.py: four local structural checks with tampered negative controls.
- MANIFEST.sha256: byte-level freeze of the four contents above and this README.

Attempt T1 times out on the client, without establishing whether execution occurred. T2 is a retry of the same logical action; its response identifies provider operation OP1. The declared synthetic context independently includes one committed effect and receipt. O1/O2 do **not** prove two executions; neither is a payer count.

F1 remains an original unknown finding. F2 names F1 in supersedes and changes to observed only on the declared synthetic provider-receipt and sink-record basis. The original observations and findings remain preserved. If the synthetic provider receipt were unavailable, the effect claim would be unsupported, not automatically a failed control.

### Crosswalk boundary

| CSOAI record | Possible SAFE-GALC comparison | Limit |
|---|---|---|
| logical_action.id | governed logical action | distinct from each attempt |
| attempts[].id | specific request attempts | retries do not imply additional executions |
| provider_operations[].id | provider operation | supplied by separate synthetic context, not client timeout |
| observations[].id | separately observed outcomes | two observations are not two operations |
| findings[].external_effect_status | effect/consequence candidate | preserve CSOAI semantics; no automatic GALC status conversion |
| context.custody.availability | custody status | available record does not itself establish external effect |
| findings[].supersedes | correction linkage | preserve the original finding as separate record |

No new SAFE requirement, state enum or schema is proposed. A future reviewer may map these bindings to PR 39's existing contract, but the local tests check **structural consistency only**, not the proposed GALC semantic verifier, source authenticity, runtime behavior, cryptographic integrity, temporal anchoring or third-party reproduction.

Run: python3 validate_fixture.py
