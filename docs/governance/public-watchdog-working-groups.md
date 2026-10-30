# Public Watchdog working groups — draft charter
Proposal dated 30 October 2026. Status: forming. This is a proposed operating model, not evidence that members have accepted roles or that a staffed review service is available.

## Purpose and coverage
Use public evidence and reproducible measurements to examine AI claims, publish limitations and corrections, and make room for independent challenge. The seven groups in [the registry](../../council-os/working-groups.json) map to the 33 axes in the dated 28 October board snapshot. The live board remains the authority for measurement state and counts. This registry complements the existing axis-specialist registry: automated specialists propose; people decide.

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
