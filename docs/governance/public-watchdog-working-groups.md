# Public Watchdog working groups — draft charter
Proposal dated 30 October 2026. Status: forming. This is a proposed operating model, not evidence that members have accepted roles or that a staffed review service is available.

## Purpose and coverage
Use public evidence and reproducible measurements to examine AI claims, publish limitations and corrections, and make room for independent challenge. The groups in [the registry](../../council-os/working-groups.json) map to the axes in the dated 28 October board snapshot. The live board remains the authority for measurement state and counts. This registry complements the existing axis-specialist registry: automated specialists propose; people decide.

Council of AI organises its own groups. W3C, IETF, SAFE and other external participation does not grant endorsement, certification authority or regulatory powers. No organisation or person becomes a member by being mentioned in research.

## People and admission
Start with a small coordinating council and recruit specialists by bounded tasks. Each active axis needs a competent primary reviewer and a separate reviewer for challenge; cross-group expertise is allowed. Affected-user and accessibility perspectives belong in scope review. A member may not independently review their own work or that of a client or employer without a disclosed conflict and an independent replacement reviewer.

Before appointment: verify professional identity and relevant work; agree the role, time commitment, conflicts, confidentiality, attribution and any compensation; obtain explicit acceptance and separate permission for public listing. Institutional affiliation is not a prerequisite. Do not imply salary, equity or operational availability without agreement. Volunteers may contribute research; time-critical review needs a separately funded, staffed service and explicit availability.

Keep a consented membership record with stable reviewer ID, role, axis competence, disclosed conflicts, term, acceptance date and current status. Contact details and private-case access are not public roster fields. No acceptance is inferred from an email draft or a test submission.

## Evidence and human decisions
1. Intake a public signal or claim with exact text, source URL, capture time and scope. Keep allegations and third-party reports attributed; they are not findings.
2. Triage jurisdiction, affected people, confidentiality, urgency and conflicts. Minimise personal data. Sensitive evidence requires an agreed private channel and retention policy.
3. Freeze the source revision, instrument, rule IDs, inputs and hashes. Run bounded tests; record failures, unknown outcomes and missing evidence.
4. Assign a competent reviewer. Record the human's identity, authority, case revision, decision, rationale and time. A model verdict or typed display name alone is not authenticated approval.
5. Seek an independent review for contested or consequential conclusions. Record dissent and permit challenge. No quorum of agents substitutes for independent humans.
6. Obtain explicit publication or action authority. Publish only the approved evidence and limitations. Maintain a dated correction/supersession trail and a right of reply.
7. Route any regulatory concern only after a human has checked jurisdiction, reporter capacity, applicable subject and the official current reporting channel. Record consent, submission reference and follow-up separately. Do not automatically send a failed test to a regulator.

Proposed case states: INTAKE, TRIAGED, EVIDENCE_READY, IN_REVIEW, CHANGES_REQUESTED, APPROVED_FOR_SPECIFIED_ACTION, PUBLISHED, DISPUTED and CLOSED. These are a workflow proposal, not a claim that the existing API enforces them. An approval authorises only its stated action and revision, with expiry and revocation where applicable.

The existing Council OS review workspace is the implementation starting point. Operational release depends on authenticated reviewer identity, competence/conflict enforcement, durable case history, revision-bound approvals, revocation and executor-side authority checks. Until validated, do not advertise guaranteed staffed review or autonomous execution.

## First joint experiment: revocation and halt latency

A [versioned local protocol and runnable controls](revocation-latency-trial.md) are available for independent review. They measure owned synthetic fixtures only; production halt latency remains unmeasured.

Blocking the next call does not establish that in-flight work stopped. Record revocation issued and acknowledged with clock origin and uncertainty; revocation observed at each enforcement point; new calls rejected and reasons; last in-flight action settled including external effects; and quiescence confirmed by the observer, or timeout/unknown.

Measure issue-to-last-action and issue-to-confirmed-quiescence separately from propagation and rejection delay. Last action can precede revocation: report that explicitly and use zero post-revocation activity rather than a misleading negative duration. No-action cases and unobserved external effects need explicit outcomes. Cancellation cannot undo an already committed external effect.

Test nested delegation, queued work, retries, network partitions and non-cancellable operations in a sandbox. Predeclare the bound by action class; do not invent a universal pass threshold. Report observed maximum and distribution with sample size, clock uncertainty, timeouts and unresolved outcomes. A percentile is not a worst-case guarantee. Anchor results to the exact commit, policy and trace. Independent reproduction is required before making a bounded-stop claim.

## Challenges and corrections
Existing public routes: [disputes](https://councilof.ai/dispute/) and [corrections](https://councilof.ai/corrections/). The current dispute page describes owner review; an independent appeals panel remains a recruitment and governance task. The future panel must record conflicts, reasons, minority views and a correction or no-change outcome.

## Participation today
Choose a proposed group at [Public Watchdog](https://councilof.ai/watchdog/?view=groups), download its task brief and prepare a participation enquiry. Briefs are generated from the same registry as the group page and contain the required evidence, review notes, confidentiality boundary and return route. The agent-authority brief links to a commit-pinned protocol with runnable positive, negative and unknown-effect controls.

Agree one public, reproducible task, time, attribution, conflicts and any funding before starting. Use the separate contribution-email route to return the agreed public evidence, source revision, observed result, missing evidence and disagreement. Keep a copy. The coordinator must acknowledge receipt and agree the next step; a response time is not promised. A contested or consequential conclusion still needs a separate competent, unconflicted reviewer who has accepted the task.

Both contact routes prepare a draft in the contributor's email client or allow copying it. Neither submits an application, uploads evidence, creates membership, records a Council OS decision nor grants case access. Downloaded briefs also make this boundary explicit. A draft, sent email and accepted task are distinct states.

## Implementation and acceptance
The group registry is the sole source for group names, axis coverage, first tasks and required review outputs. `client/src/lib/workingGroups.ts` derives both downloaded briefs and the two Contact presets from it. Query parameters may select a registered group and the contribution stage; they cannot choose a recipient or supply an accepted-role status.

The existing Council OS staff pane owns the human-review console. Its UI, decision/history handlers and execution-authority work remain separate controls; the contribution path does not create a second decision store or confer authority. Preserve both the working-group tab and the claim/challenge journey when integrating other Watchdog changes.

Reproduce the contributor acceptance locally with existing repository dependencies and Chromium:

```sh
node scripts/hitl/working-group-acceptance.mjs --output /absolute/path/contributor-acceptance.json
node scripts/hitl/ui-acceptance.mjs --output /absolute/path/human-review-acceptance.json
```

The first checks actual downloads, all seven contribution handoffs, copy recovery, keyboard expansion, navigation, mobile layout and invalid query parameters with external requests blocked. The second uses the real review UI and handlers with synthetic cases, an in-memory store and an ephemeral signer. These checks are distinct from live deployment, email delivery, authenticated named-human identity, operational staffing or execution-authority acceptance. Neither sends a recruitment message or makes a real case decision.

## Release boundary
This charter and registry may be reviewed and amended through the source repository. Public names, staffed-service claims and authority changes require their own supporting evidence. Ship website changes through the protected master release workflow; do not bypass deployment ownership.

## Candidate Human-in-the-Loop measurement overlay (21 November 2026)

**Status: proposed amendment only.** This paragraph does not appoint reviewers, change the frozen constitutional charter, create a new working group or constitute adoption by SAFE, W3C, IETF or other external organisations. It does not authorize an automated action or a regulator notification.

Each of the seven groups uses the **same existing** Council OS and HITL decision infrastructure. Forum discussions, blog comments, public-watchdog tips and agent-generated reports may *nominate* a case; they never silently become findings, votes, appointments or authority. The intake path should preserve source, date, permission, case revision, evidence digest, consent/retention and a right of reply. Private or sensitive material needs separately approved access.

**Proposed adjudication sequence:**

1. **Intake and qualify.** Attribute the reported claim or concern. Confirm source rights, jurisdiction, affected people, conflicts, available expertise and the exact question. State `NO_RECEIVER` / `NOT_STAFFED` when no qualified person has accepted a review.
2. **Freeze and measure.** Pin subject, test-bank revision, grader, negative controls, environment, tool/model versions, source bytes, expected result, observation window and denominators. Use GSPC's canonical instruments where applicable; never mint a bespoke GSPC verdict because a forum comment or person agreed.
3. **HITL authority.** Identify the separately authenticated reviewer, accepted role and competence, disclosed conflicts, scope digest, authority epoch, permitted action and time window. A display name, shared operator token, exercise completion or signed receipt alone does **not** establish human identity, professional competence, independence or authority.
4. **Record the decision.** Record `APPROVE`, `HOLD` or `REJECT` with evidence and rationale against a specific immutable case revision. A model-generated recommendation remains a proposal; an unaccepted proposal remains unexecuted.
5. **Observe any bounded effect.** The executor must independently check current authorization immediately before an action. Preserve `proposed ≠ approved ≠ invoked ≠ effect observed ≠ independently verified`. Denial, expiry, revocation, changed scope and unresolvable authority fail closed. A transport timeout cannot prove the external action failed.
6. **Challenge, appeal and maintain.** An independent reviewer can dispute the decision, inspect the same pinned bytes, record dissent and approve a correction/supersession. Preserve old records and explain unresolved outcomes. Do not publish an unreviewed incident as a verified finding.

**Group-specific review applications, without new group IDs:**

| Group | Human task | Existing GSPC-relevant evidence |
| --- | --- | --- |
| Governance, rights and regulatory evidence | Verify the scope and wording of one self-claim; accept or reject a dated correction | Governance/claim-maintenance run, raw claim source and freshness |
| Agent authority and stopping | Challenge revoked, expired and out-of-scope execution in a synthetic environment | Effect-binding and revocation trial; independent effect observation |
| Evaluation and reproducibility | Blindly rerun one pinned instrument, including a failing control | Instrument, deterministic grader, bank digest, paired per-item output |
| Provenance and open evidence | Inspect rights, source lineage and signed-card verification | Provenance, distribution-integrity and free verifier outcome |
| Runtime and interoperability | Distinguish tool intent, execution receipt and actual effect | Serving-path evidence, conformance bank and unknown-effect handling |
| Human impact and embodied systems | Gather appropriately consented affected-user and specialist review; publish dissent | Care/affect scenario evidence, safety scope and accessibility report |
| Economic evidence and work | Independently review denominator, source and dates without investment advice | Financial facts/claims and source-to-indicator transformations |

**Proposed measurement cards, not yet a released GSPC axis.** Publish one row per frozen experiment with `case_id`, `group_id`, `source_ref`, `case_revision_sha256`, `method_version`, `actor_identity_state`, `reviewer_conflict_state`, `authority_scope_digest`, `authority_epoch`, `decision_state`, `invocation_state`, `effect_state`, `verifier_state`, `challenge_state`, `observed_at`, `retest_due_at`, `negative_control_id`, `evidence_refs`, `known_limits` and `correction_ref`, omitting personal data from public projections.

**Predeclared numerator/denominator examples:**

- *Authority scope binding:* correctly refused altered-scope/expired/revoked attempts divided by **attempted negative-control calls** (not all discovered agents). Report `NOT_TESTED` when no negative controls ran.
- *Reviewer independence:* cases with separately verified reviewer authority and resolved conflicts divided by **cases requiring independent review**; a shared token without identity proof cannot enter the verified numerator.
- *Effect observability:* effects independently observed divided by **authorized invocations in the test window**; unresolved external effects stay a separate `UNKNOWN` bucket.
- *Revocation latency:* elapsed time from accepted revocation to last observed external action and separately to confirmed quiescence, only for cases with compatible clocks and trace windows; unknown and uncancellable cases remain visible.
- *Challenge resolution:* independently disposed public challenges divided by **all received public challenges in the declared window**, with a separate not-staffed / privacy-held / open count; do not advertise time-to-resolution before coverage is agreed.
- *Inter-reviewer agreement:* predeclare two competent independent reviewers, blinded or independently assigned where possible; publish agreement and disagreement with the same pinned evidence. Agreement does not itself establish truth.

Every metric needs its test bank, sampling population, exclusions, minimum observed sample, event taxonomy, missingness, negative controls, source digest, timestamp and rerun instructions. Publish `PASS`, `FAIL`, `INSUFFICIENT_EVIDENCE` and `NOT_APPLICABLE` only under the declared rules; do not interpret `NOT_TESTED` or `UNMEASURED` as a pass. Do **not** add an axis to the 34-axis GSPC board or modify the canonical grader before an independently reproducible, method-approved instrument exists. This is a **cross-cutting process measurement**, not a certification.

**Public readbacks:** [proposed working-group journey](https://councilof.ai/watchdog/?view=groups), [HITL source](https://councilof.ai/api/hitl), [HITL receipt ledger](https://councilof.ai/api/hitl/record), [GSPC board](https://councilof.ai/api/gspc), [H.I.M. explanation](https://councilof.ai/him/), [appeals](https://councilof.ai/dispute/), [corrections](https://councilof.ai/corrections/). SAFE's own [approval-to-execution discussion](https://github.com/OpenSecureAIAlliance/wg-safe/issues/13) may receive a portable measurement proposal, subject to the working group's maintainers; no external adoption is implied.

**Acceptance before calling the overlay operational:** one real consenting reviewer with authenticated identity, written role acceptance, conflict/competence checks, a qualified second reviewer, a permitted dataset, one frozen positive/negative/unknown fixture suite, accepted scope-to-effect verification, an appeal/refusal and public correction example, reviewed retention/privacy terms, and independently rerunnable results. The live `/api/hitl` records board-reading completion and shared-token decisions but currently declares `operator_identity=NOT_VERIFIED`, `human_presence=NOT_ESTABLISHED`, `professional_competence=NOT_ASSESSED` and `execution_authority=false`; do not relabel it a human-authenticated authority system without separate evidence.
