# Porting three open items onto the approved SAFE v1.0 — with one worked example of a claim that was maintained

**Prepared contribution to the Shared AI Findings Exchange (SAFE)**
Open Secure AI Alliance, under the Linux Foundation

CSOAI Ltd (Council of AI) · 3rd Floor, 86-90 Paul Street, London EC2A 4NE
26 October 2026 · nicholas@csoai.org · https://councilof.ai
Canonical location of this citable form: `https://councilof.ai/contributions/osaia-safe-v1.0-port-2026-10-26.md`

**Status: prepared, not submitted.** Nothing in this document has been submitted to the Open Secure AI
Alliance, and nothing here states or implies that the Alliance has adopted, endorsed, reviewed or
agreed with any of it. This is our own working position, published so that it can be read, cited and
disagreed with. We measure; we do not certify, and we do not speak for the Alliance.

---

## 1. Why this document exists

Our GitHub account is restricted, so anything it opens is invisible to a logged-out reader. That is a
defect of ours, and it means an issue filed from that account cannot be read by the people it is
meant for. We therefore publish the citable form on our own site, where it is reachable without an
account, and we point at it from the issue.

This document supersedes our 17 September 2026 contribution, which was written against the RFC
before the specification was approved.

## 2. What we verified at source, and how

Verified on 26 October 2026 against `github.com/OpenSecureAIAlliance/RFCs`:

| Fact | Verified how |
| --- | --- |
| `SAFE.md` (20,094 bytes) is the approved specification and now sits beside the superseded `rfc-safe-proposal.md` (7,773 bytes) | repository contents listing |
| Issue **#32** (discriminating power) is open, filed by us on 2026-09-17, 2 comments | issue API |
| Issue **#72** (continuous claim maintenance) is open, filed by us on 2026-10-07, 2 comments | issue API |
| Pull request **#64** is open, not a draft, base `main`, 3 commits, **+24/−0**, one file: `rfc-safe-proposal.md` | pull request API |
| The approved `SAFE.md` contains **none** of: `discriminat`, `negative control`, `insufficient_evidence`, `not_applicable`, `claim maintenance` | full-text read of the approved file |

The last row is the finding that matters, and it is the reason this document exists.

**Our open PR #64 still modifies the superseded `rfc-safe-proposal.md`.** The approved specification
already carries a serving-path row, already uses the four labels in prose — "using pass, fail,
insufficient evidence or not applicable" — and already requires a reproducible verification method to
state its "failure behavior, known systematic error classes and measurement uncertainty". What it
does not carry is the semantics: it never separates an evidence-delivery failure from an underlying
control failure, and it never requires a method to demonstrate that it can fail.

## 3. The proposed change, in full

Four hunks. The patch is deliberately small: a maintainer can review four paragraphs, where a
rewrite of an approved specification is the wrong thing to ask for. Apply with `patch -p1` from the
repository root.

```diff
--- a/SAFE.md
+++ b/SAFE.md
@@ -134,7 +134,7 @@

 ## Review Framework

-Examine each incident across the complete operating stack. For every applicable control layer, state the expected outcome, assessment and supporting evidence, using pass, fail, insufficient evidence or not applicable. Pass means the stated control outcome is supported; fail means it is contradicted. Missing, inaccessible or inconclusive evidence is insufficient evidence, with the reason recorded. These labels describe a specific assessment but do not indicate general system safety or legal compliance.
+Examine each incident across the complete operating stack. For every applicable control layer, state the expected outcome, assessment and supporting evidence, using pass, fail, insufficient evidence or not applicable. Pass means the stated control outcome is supported; fail means it is contradicted. Missing, inaccessible or inconclusive evidence is insufficient evidence, with the reason recorded. The evidence-delivery state, the underlying control outcome and the attribution of a failure to a layer are three separate records. Evidence that did not arrive cannot produce a pass or a fail: where delivery was expected and did not occur, the outcome is insufficient evidence unless the expected producer, the delivery obligation, the observation window and a functioning collection path are all established, in which case the absence is recorded as an evidence-delivery failure and not as a failure of the control. A layer is credited with a failure only on evidence delivered to it. These labels describe a specific assessment but do not indicate general system safety or legal compliance.

 | Control layer | Review Criteria |
 |---|---|
@@ -147,6 +147,7 @@
 | Human operations | Responsibilities, escalation paths and stop procedures were clear, and people had an opportunity to understand, contest or recover from the outcome. |
 | Supply chain | A partner or third-party dependency (cloud, evaluation, data or tooling provider) upheld assumed controls. |
 | Serving path | The invoked model, runtime, gateway, cache, proxy and wrapper matched configurations and produced expected results. |
+| Evidence delivery | The expected producer existed, the delivery obligation was met, the observation window closed and the collection path functioned, so an absence of evidence can be attributed to delivery rather than to the control. |
 | Authorization and commitment | The consequential action matches valid authorization at commitment, including delegation, expiry and revocation. |
 | Workflow composition | The combined sequence, shared state and interactions did not cross a trust boundary and did not exceed the originating scope.

@@ -175,7 +176,7 @@
 - The failure and affected systems
 - The required defensive outcome
 - The minimum control and acceptable alternatives
-- A reproducible verification method stating its subject, scope, assumptions, evidence path, failure behavior, known systematic error classes and measurement uncertainty
+- A reproducible verification method stating its subject, scope, assumptions, evidence path, failure behavior, known systematic error classes and measurement uncertainty, together with evidence that the method can produce its intended negative outcome: a control that must pass and a control that must fail under the same configuration. A method whose must-fail control passed is not discriminating, and any outcome it produced is unverified rather than verified
 - The evidence to retain, responsible owner and implementation deadline
 - Adoption, effectiveness and review metrics
 - The distinctions among an observed event, a reported claim, a structural finding, a control recommendation and a verified test result (stating the evidence and limitations for each)
@@ -186,6 +187,30 @@

 ---

+## Maintained Claims
+
+A finding is not a claim, and a claim is not a permission. A machine-readable claim that is still current for its
+observed baseline is evidence state; whether an accountable external principal presently permits an action is
+authority state. These are separate, and neither extends the other: a current measurement cannot authorise an
+action, and a maintained claim cannot restore or enlarge its own authority.
+
+SAFE does not require any particular claim format, and nothing here obliges a member to maintain claims
+machine-readably. Where a party does so, the following lifecycle is offered as an optional companion profile:
+
+- a stable claim identity, a finding reference, the subject and scope, the control layer, the authority basis, the
+  evidence and its observation time, the freshness rule and its triggers, the current review state, the transition
+  reason, links to any correction or supersession, the accountable review role, the next review condition, and
+  adoption and effectiveness metrics that do not collapse a measurement into a grade
+- a claim that becomes stale, due for retest or unmeasured is never silently carried forward; where revalidation is
+  required and unavailable, consequential execution fails closed while the history is preserved
+- a correction or supersession is a new record that references the record it replaces; history is not rewritten, and
+  a superseded claim remains retrievable and states why it was superseded
+
+Where revalidation is required and unavailable, the correct behaviour is to fail closed while preserving history,
+not to keep the previous result standing.
+
+---
+
 ## The Compact

 Report honest mistakes and close calls early so the community can prevent the next incident.
```

### What each hunk is for

1. **Review Framework** — the evidence-delivery state, the underlying control outcome and the
   attribution of a failure to a layer become three separate records. Evidence that did not arrive
   cannot produce a pass or a fail.
2. **Review Framework table** — an *Evidence delivery* row, so the layer is tagged rather than
   inferred.
3. **From Lessons to Controls** — a reproducible verification method must carry evidence that it can
   produce its intended negative outcome: a control that must pass and a control that must fail under
   the same configuration.
4. **A new "Maintained Claims" section** — an optional companion profile. It obliges nothing and
   requires no particular claim format.

## 4. The discriminating-power profile, as an executable artefact

The vocabulary for this already existed and was already public: `NOT_DISCRIMINATING` is a
first-class state in the OASF capability enumerations and in the six evidence-event states, and our
`safe-reverification-record-v0.1.schema.json` already carries a required `negative_control` whose
`observed` field states, in its own description, that "PASS means the test accepted a case built to
fail: the test is broken". What did not exist was anything executable. It does now:

| Artefact | What it is |
| --- | --- |
| `safe-discriminating-power-v0.1.schema.json` | A must-pass control, a must-fail control, and the derived path |
| `safe-review-outcome-v0.1.schema.json` | Evidence-delivery state, underlying control outcome and layer attribution as three separate records |
| `test_discriminating_power.py` | Reproduces the one-option answer-menu failure shape and proves the harness can itself detect an instrument that cannot fail |
| `examples/discriminating-power-*.json` | Three worked records: DISCRIMINATING, NOT_DISCRIMINATING, INSUFFICIENT_EVIDENCE |
| `examples/review-outcome-*.json` | A control that failed, an established delivery failure, and an unresolved absence |
| `examples/example-stale-signed-board-freeze.json` | The real worked example for the companion profile |

The example validator routes each example to the schema its `profile` names and mutates every
example into a record its profile forbids. All nineteen mutations are rejected.

**The failure this addresses is our own.** On 14 September 2026 we withdrew 44 of our own signed
measurement results. Every signature verified, every evidence check passed, and every binding held —
because in one grader configuration each prompt offered a single permitted answer. The grader could
not mark anything wrong, so all 44 results read an accuracy of 1. The instrument was not failing
open and was not mislabelling; it was working exactly as specified against items whose answer space
made a negative outcome impossible. Nothing in the provenance chain could have told us that. A
must-fail control would have.

## 5. The worked example: a signed claim that was maintained, not quietly dropped

This is the concrete instance of the lifecycle in hunk 4.

- The **signed board freeze** — `https://councilof.ai/signed/gspc-board.signed.json`, keyed
  `did:web:csoai.org#gspc-board-22axis-2026`, witnessed in the Rekor transparency log at index
  2687278151 — states **23 axes · 23 measured**.
- The **living board** — `https://councilof.ai/api/gspc` — states **33 axes · 23 measured**.
- The freeze's own pointer, `public/interop/gspc-board-freeze-pointer.json`, carries
  `relying_party_status.state = "SUPERSEDED_KNOWN_CLAIM_DEFECT"`, names the living board as
  `current_authority`, and says not to use it as current authority.

So a signed, externally witnessed claim went out of currency, and the estate records that **in a
machine-readable field on the artefact itself**, rather than leaving a reader to work it out. The two
numbers are two boards at two observation times — not a disagreement about one board — and the record
says so.

The comparison carries a real designed-to-fail control: the same extraction run against a real
document that is not the board does not report the board's figures. **That control was executed to
produce the record, not asserted.**

Note what the example is not. The freeze separates no leader and never did; the separation line
belongs to the living board, which reports 0 of 14 model-comparison axes separated a leader, 7 TIE
and 7 UNTESTED. A TIE is not a win and UNTESTED is not a tie. Nothing in the example authorises any
action, and no current measurement can authorise one.

## 6. What we are not claiming

- That the Alliance has accepted any of this.
- That our board separates any model leader. It does not, at the time of writing.
- That a maintained claim grants authority. It does not, and the companion profile says so in its own
  first paragraph.
- That our own instruments are correct. We publish the controls that would catch us being wrong, and
  we publish the instances where we were wrong.
- Anything about the safety or legal compliance of any system, including our own. The labels in SAFE
  describe a specific assessment; they are not a general safety verdict, and we do not use them as
  one.

## 7. How this is submitted, and what is owner-only

The patch needs a pull request against the approved `SAFE.md`. Because our GitHub account is
restricted, the practical route is the one our existing contribution documents already state: a
co-author with a normal GitHub account opens the pull request, carries the DCO `Signed-off-by` line
with their own name and email, and lists CSOAI Ltd (Council of AI) as co-author with CSOAI's own
sign-off. **No text depends on who posts it.**

Owner-only, and not done here: the co-author's choice and the pull request itself; any change to
`provider.legalEntity` in our published agent card, which is generated from a source document and
signed by an issuer key we do not hold in a form that lets us re-sign it.

## 8. Where the artefacts live

| Artefact | Location |
| --- | --- |
| This citable form | `https://councilof.ai/contributions/osaia-safe-v1.0-port-2026-10-26.md` |
| The patch | `docs/standards/osaia-safe-reverification/SAFE-v1.0-port.patch` in `github.com/CSOAI-ORG/councilof-ai` |
| The two schemas, the executable profile and ten examples | `docs/standards/osaia-safe-reverification/` |
| The companion-profile working note | `docs/standards/osaia-safe-reverification/SAFE-v1.0-PORT-20261026.md` |
| Our 17 September contribution | `https://councilof.ai/contributions/osaia-safe-discriminating-power-2026-09-17.md` |
| The signed freeze and its pointer | `https://councilof.ai/signed/gspc-board.signed.json` and `public/interop/gspc-board-freeze-pointer.json` |
| The living board | `https://councilof.ai/api/gspc` |

## Honesty register

**REAL** — every verification in section 2, checked at source on 26 October 2026 by the repository and
issue APIs. The patch in section 3 applies cleanly to the approved `SAFE.md` (20,094 bytes → 22,852
bytes; all four hunks land). The example validator reports 9 valid examples and 19 rejected
mutations. The worked example in section 5 compares two published artefacts and its designed-to-fail
control was executed, not asserted.

**UNVERIFIED** — whether the Alliance will accept, or even read, this. We do not know and do not
predict. The submission route in section 7 has not been taken.

**KILLED** — the claim that this is a standard, an endorsement, or an adopted profile; the claim that
the example separates anything; and any framing in which a maintained claim authorises an action.
