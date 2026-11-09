# Public Watchdog SAFE-aligned integration delta v0.1

- **Status:** internal draft for review; not adopted and not an operating service.
- **Scope:** an integration delta for the existing Public Watchdog working group and its internal charter.
- **Group decision:** do not create an eighth group or a second Watchdog charter. Existing working-group infrastructure is in the registry and was released through PRs #3641 and #3657.
- **External SAFE status:** the official [WG-SAFE charter page](https://github.com/OpenSecureAIAlliance/wg-safe/blob/main/CHARTER.md) states that its charter remains under development pending Steering Committee approval. The public [SAFE RFC](https://github.com/OpenSecureAIAlliance/wg-safe/blob/main/rfc-safe-proposal.md) is a proposal, not an adopted charter. This draft makes no claim of alliance membership, endorsement, affiliation or authority.

## Purpose

Give the existing Public Watchdog group a bounded method to report source availability, rights state, freshness and human-review workflow across approved public sources and authorized first-party reports. The index is not a global incident census, safety rating, legal finding, certification or end-user response service.

## Remit

When its internal charter is adopted and people accept the roles, the group may:

- maintain the controlled source and permission register;
- publish a metadata-only daily index with explicit scope, denominators, missingness and corrections;
- measure participating working groups against published interoperability process criteria, with an independent challenge route;
- refer a candidate to an accepted reviewer through a qualified, revision-bound MEOK route;
- publish only approved, privacy-minimized aggregates and limitations.

Alignment with an approved WG-SAFE charter requires that exact version to be published and reviewed first. The group may not infer that a source report is true, determine liability, file a statutory report, promise response coverage, set GSPC scores, or take remediation action through an agent.

## Evidence and authority

Use `csoai.evidence-event/0.1` and the existing `csoai.hitl-authority-effect/0.1` profile. Do not add a Watchdog-specific canonical event schema, a second case store or a separate authority path.

MEOK may suggest a human role and carry a revision-bound referral only after a real review receiver and access protocol are qualified. The request must identify the exact case revision, allowed task scope and expiry. Receipt, acknowledgement, acceptance, decision and action must remain distinct. An authenticated human key is required for a human decision. If no accepted reviewer is on duty, report `NOT_STAFFED`; do not imply continuous service.

GSPC remains a separate measurement instrument. The daily index may link to its public board and state the retrieval date. It must not write reports into GSPC or turn report counts into an axis score. No 34th axis is proposed here.

## Adoption and capacity

The Public Watchdog group has not been shown to have an accepted chair, deputy, privacy/security owner, reviewer rota or service hours. The 33 specialist declarations are logical roles and do not appoint people. Do not publish appointments until each person accepts the role, conflicts and terms are recorded, and coverage is funded.

Source access remains disabled until each row in the controlled source register records permitted fields, purpose, commercial use, privacy, retention, correction route and an approving owner. A public page is not permission to scrape, mirror, train on or sell its contents.

## Acceptance evidence

Before describing this as operating, record the exact adopted internal charter and controls, named role acceptances, source approvals, deployed index build, human-key route, independent receiver result, pilot period, correction/appeal evidence and public limitations. Record the approved WG-SAFE charter version before claiming alignment to or adoption of it. The bounded pilot is not started by this proposal.
