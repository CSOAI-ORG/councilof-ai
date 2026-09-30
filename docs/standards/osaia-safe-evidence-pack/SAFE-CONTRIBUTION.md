# SAFE contribution: findings that can be corrected, re-checked and carried

DRAFT, 30 September 2026. Not sent or posted. The submitter chooses the delivery path and adds the DCO line when sending.

- Text: CC-BY-4.0.
- Code in the attached pack: Apache-2.0.

SAFE asks for preserved evidence and "a reproducible verification method". It does not say what happens when a published finding turns out to be wrong, or how a finding travels into the tools that people already run. We propose four requirements, and each is shown on a signed record that can be re-derived offline (`verify.py --offline`).

## Requirements

1. **A correction is a new record.**
   - It is dated.
   - It names the record it replaces by identifier and SHA-256.
   - The replaced bytes stay readable.
2. **Answers are not only yes or no.**
   - UNMEASURED carries no number and no estimate.
   - PARTIAL names the part that was read.
   - NOT_DISCRIMINATING means the test ran, but it has not shown that it can return a negative.
3. **PASS and FAIL need a negative control.** The control is a designed-to-fail case, run through the same check, that came back negative.
4. **Signatures and timestamps state their limits.**
   - A pending timestamp is reported as pending.
   - A valid signature shows who signed which bytes, and nothing more.

## Open issues and what the pack answers

| Issue | Answer | Where in the pack |
|---|---|---|
| #4 failure mode, noise floor | Every record states the failure modes the method declares and carries a negative control. Where no noise floor was measured, the field is null; we do not invent one. | `records/*` `test.declared_failure_modes`, `negative_control` |
| #31 no "could not be determined" | UNMEASURED and UNCHECKABLE carry `value: null`. A renderer that is handed a number for them refuses the event. In SARIF they become `kind: open`, in OTel `score.label` with no `score.value`, and in OCSF `status_id` 99 with `status_detail`. | `render/*`, `lib/render/` |
| #34 machine-readable, independence, coverage | Our record and event schemas are machine-readable. Independence is `method.holder` plus the in-toto `assuranceLevel`. Coverage is `limits[]` plus `read_state` plus PARTIAL. We ran the issue's own straw-man schema: it accepts its own example, and it rejects all ten of our records. That is expected, because it describes a day-4 incident filing and ours re-verify published findings. The field map shows which of its fields we can fill, and what ours carry that it lacks. | `rfc34/results.json` |
| #37 integrity, transparency log | Records are Ed25519-signed under did:web:csoai.org. The freeze digest is anchored with OpenTimestamps and logged in Rekor. Corrections are new records. | `FREEZE.*` |
| #41 stable event identity | `event_id` is the sha256 of the RFC 8785 bytes of the event. A correction names the id it supersedes. | `events/event-ids.json` |

## Worked examples in the records

- **C-2026-0928-01.** The reference verifier returned VALID without resolving the signing key. Re-run over the 17 published conformance cases, the pre-fix bytes differ from the expected result on 4 cases and the fix differs on 0.
- **C-2026-0928-02.** A canonicaliser did not follow its own RFC 8785 specification. Compared with node's JSON.stringify over 2,014 values, the pre-fix code differs on 514 values and the fix on 0.
- **Corrections ledger.** The ledger has 88 entries, and it is committed to by a signed content id; a tamper control is rejected. On time-to-correct, 1 entry is exact, 5 have an upper bound only, and 82 are UNMEASURED. We suggest SAFE allow an UNRECORDED `detected_at` rather than invite reconstructed times.
- **MCP contract parity.** The measurement was corrected twice. AUTH INCONSISTENT went from 23 to 10 to 5. All three signed versions remain published, and the newest names the others by SHA-256.

## Disclosure

- CSOAI Ltd is a member of the Open Secure AI Alliance.
- We publish measurements of AI systems and do not grade them.
- We are not asking SAFE to adopt our tools or to vouch for our results.
- No confidential or security-sensitive material is included.
