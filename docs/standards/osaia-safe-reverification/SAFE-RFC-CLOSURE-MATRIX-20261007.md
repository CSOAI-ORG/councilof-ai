# SAFE RFC closure matrix — 7 October 2026

Status: CSOAI working map. It distinguishes upstream discussion/proposals from CSOAI implementation evidence. It does not claim Alliance adoption.

| Concern | Upstream vehicle | CSOAI evidence / implementation | Current state |
| --- | --- | --- | --- |
| Approval-to-execution scope | #13, PR #71 | HITL authority-effect schema in PR #2911 | UPSTREAM PR OPEN; CSOAI SOURCE CANDIDATE TESTED |
| Human approval/intervention events | PR #71 | explicit decision id, principal, epoch, expiry, scope digest | SOURCE CANDIDATE |
| External effect separate from invocation | #13 | invocation/effect/verification are separate objects | SOURCE CANDIDATE |
| Serving-path / insufficient evidence | #31, PR #64 | GSPC state separation + dated public readback | PR #64 OPEN |
| Unattributed evidence-delivery failure | PR #64 | final Gary-Gayle semantics applied to branch | CLOSED IN PR BRANCH, AWAITING REVIEW |
| Persistent finding identity/history | #35 | correction/supersession ledgers | UPSTREAM DISCUSSION |
| Continuous claim maintenance | #72 | existing SAFE re-verification draft + PR #2911 binding | NEW UPSTREAM ISSUE OPEN |
| Replay vs later re-execution | PR #42 | runtime/model/provider substitutions already noted | UPSTREAM PR OPEN |
| Verification discriminating power | #32 | 44 historical withdrawals; NOT_DISCRIMINATING state | IMPLEMENTED EVIDENCE, UPSTREAM ISSUE OPEN |
| Small-operator portable evidence | PR #60 | independent checker/reproduction linked in thread | UPSTREAM PR OPEN |
| Runtime enforcement | implementation-neutral | constitutional harness; optional OpenShell adapter | PUBLIC CHARTER + PRIVATE/LOCAL ADAPTER EVIDENCE |
| Physical-host evidence | implementation-neutral | OpenBMC/Redfish read-only schema/profile | SCHEMA/FIXTURE ONLY; PHYSICAL TARGET UNMEASURED |
| Project/security observations | implementation-neutral | LFX adapter | SOURCE CANDIDATE/OBSERVATION ONLY |
| Claim correction history | #35/#72 | corrections API + supersession model | PUBLIC |
| Signature integrity | adjacent evidence threads | Ed25519 correction ledger request-time verification | PUBLIC, VALID AT 2026-10-07 READBACK |
| Current measurement board | implementation evidence | /api/gspc | 23 AXES / 23 MEASURED; NOT AN ADOPTION CLAIM |

## Gaps still worth closing

1. **Accountable owner + implementation deadline** as first-class fields in the maintained control/claim record.
2. **Adoption/effectiveness/review metrics** that do not collapse measurement into a grade.
3. **Near-miss classification** as an explicit incident/finding kind where the source system genuinely provides it.
4. **Control-layer tagging** so evidence can identify Model / Instructions / Safeguards / Tools / Environment / Serving path / Monitoring / Human operations / Supply chain without inference.
5. **Minimum control + acceptable alternatives** in the control recommendation record.
6. **Physical OpenBMC/Sentry/BlueField measurement** only when an authorized target exists; do not manufacture fixture success as hardware evidence.
7. **Public plugin/package release and anonymous served readback** through the existing protected release owner.
8. **Independent outside reproduction** after that public release.

## Composition rule

The target remains one control fabric, not one mandatory engine:

persistent finding -> scoped authority -> invocation -> effect -> independent verification -> maintained claim -> remeasurement on drift.

GSPC may measure and maintain claims. OpenShell may enforce an already-authorized execution. OpenBMC and LFX may provide evidence inputs within their authority boundaries. None of those roles grants another role's authority.
