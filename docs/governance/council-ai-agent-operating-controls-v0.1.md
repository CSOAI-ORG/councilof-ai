# Council of AI operating controls for people, agents and working groups

| Field | Value |
|---|---|
| Version | 0.1 |
| Status | PROPOSED DRAFT — not adopted |
| Approval owner | Authorized CSOAI company decision-maker — not yet recorded |
| Effective date | None until a human adoption record names the approver, date and version |

This draft sets minimum controls for Council of AI and its responsible operating entity across Desktop Commander sessions, MEOK/H.I.M., GSPC, Council OS, working groups, contractors and software agents. It is an internal proposal. It does not appoint anyone, bind another organisation, create regulator authority, or authorize external action.

## 1. Language and status

Normative words have their usual standards meaning: **MUST** is required, **SHOULD** is expected unless a recorded reason says otherwise, and **MAY** is optional.

Every policy, group, data source, product capability and public claim MUST carry one status:

- **DRAFT** — being written; no authority.
- **PROPOSED** — submitted for a decision; no authority.
- **REVIEWED** — evidence and objections recorded; not adopted.
- **ADOPTED** — an authorized human decision identifies the exact version and scope.
- **OPERATING** — adopted and supported by verified controls, people and evidence.
- **RETIRED** — no longer current; preserved for history.

A Git merge, signature, automated test, catalogue entry or agent statement alone does not change a proposal to ADOPTED or OPERATING. Measurement status is separate: GSPC states such as MEASURED and UNMEASURED do not confer organisational authority.

For evidence findings, keep **SUPPORTED**, **CONTRADICTED**, **NOT_ESTABLISHED** and **NOT_APPLICABLE** distinct. A missing record, unavailable source or failed retrieval is not proof that an event did or did not happen.

## 2. Decision rights and separation of duties

Before an operational service starts, name and record:

- the accountable company decision-maker;
- the product/service owner and technical operator;
- a privacy and information-security owner;
- each working-group chair and deputy;
- qualified human reviewers, alternates and their accepted duty hours;
- an independent challenger or appeals reviewer for contested or consequential decisions.

A person or agent MUST act only within a recorded role, task, scope and validity period. No agent may appoint itself, infer an appointment, approve its own work, expand its tool permissions or turn a recommendation into an external action.

For high-impact or disputed conclusions, the author cannot be the independent reviewer. Record recusals, conflicts, dissent, the reviewer’s competence for the question, and who made the final human decision. A working-group vote or model consensus does not substitute for the authority of the company or an affected person.

## 3. Agent and Desktop Commander rules

Every agent task MUST identify its lane, purpose, repository/device, allowed write surface and stop condition. Before writing, the agent reads the applicable repository instructions and the current device/worktree status. One writer owns a shared path at a time.

Before using Desktop Commander, select the authorized device and verify its approved project roots. An empty `allowedDirectories` setting is unrestricted under Desktop Commander semantics; repository instructions are not a filesystem sandbox. Set machine-wide access boundaries only from an approved per-device root map.

Agents MUST:

1. use a named, least-privilege identity and explicit delegation; delegation MUST state the principal, action, resource, scope, start and expiry;
2. stop when policy, identity, evidence or approval is missing; unknown routes default to deny;
3. preserve existing edits and create a separate branch/worktree for isolated work;
4. stage exact paths, never bulk-stage an unknown worktree, and retain a reviewable diff;
5. keep secrets, private reports and credentials out of prompts, logs, commits and public evidence;
6. treat a signed event as proof of the signed bytes and signer identity only; it does not prove factual correctness or sound judgement;
7. obtain the required human authorization before sending, submitting, publishing, contacting a reporter, changing production authority or executing a repair.

Desktop Commander is a transport and execution tool. Its use does not create organisational authority. MEOK is a governed router and human-attribution gate; it does not create a staffed Watchdog service. A MEOK human receipt must be bound to the actual authenticated operator, action, arguments, case revision and time. A typed name or machine credential is not a human decision.

## 4. Evidence, provenance and research

Every consequential claim or handoff MUST be reconstructable from atomic statements with:

- subject, relation and object;
- event time and record time, plus a validity period where authority changes over time;
- actor, role, principal and delegation;
- the policy or rule that authorized the action;
- a stable evidence reference, capture time, digest where available, and applicable rights;
- decision state, uncertainty, reviewer and correction/supersession history.

Process evidence MUST reuse the canonical `csoai.evidence-event/0.1` schema in `packages/evidence-fabric/schema/evidence-event-0.1.schema.json` and the existing `csoai.hitl-authority-effect/0.1` profile. Do not create a Watchdog-specific event schema or a second case/decision store. Human-readable summaries MUST be generated from those canonical records or reconciled against them. The system must say “no record found in this scoped source at this time” when that is all the evidence establishes.

Research releases MUST record the method version, exact inputs, source revision, digest, denominator, exclusions, environment, run time, failures and limitations. Preserve positive and negative controls. Independent reproduction is evidence about reproducibility, not truth of every underlying claim.

GSPC is a measurement instrument. Incident counts, source coverage, review latency and working-group performance are different units; they MUST NOT be averaged into GSPC axis scores. A source monitor, task catalogue, candidate axis or synthetic fixture is not a measured result unless the live board and its method say so.

## 5. Data rights, privacy and security

Public availability is not permission to copy or republish. Before enabling a source adapter, a human owner MUST approve the source, fields, purpose, legal basis, license/terms, attribution, retention, access, deletion/correction route and downstream commercial use. If terms are unclear or restrict commercial reuse, ingestion stays disabled pending written permission or specialist review.

Default to metadata and stable source references, not report text, attachments or personal data. User and end-user reports MUST enter through a separate, access-controlled private channel with clear notice, purpose, optional contact details where feasible, a retention schedule, correction/deletion handling and an escalation owner. Do not publish names, allegations, health details, precise location or case text by default.

Maintain a data map, role-based access, access/revocation records, encryption for restricted evidence, key custody, backup/restore ownership and an incident-response route. Complete the required privacy-risk assessment before processing sensitive or high-risk personal data. Keep a source's correction and retraction history; never silently overwrite the original evidence.

## 6. Human review and actions

Human review is a process with authenticated people, competence, authority, evidence and time—not a UI label. Record these as separate events:

**issued → received → acknowledged → accepted → decided → action observed → closed**

One event does not imply the next. If receipt, acceptance or closure is absent, record that it is not established; do not infer success or failure. A referral MUST identify the destination role and the authenticated recipient or approved queue. Unacknowledged referrals go to an accepted alternate only under a published escalation rule.

A human decision authorizes only the named action, resource, case revision, scope and time window. Disputed or consequential outcomes require independent challenge. The affected person must have a safe way to correct the record or request review. No agent may autonomously contact a person, accuse a provider, report to a regulator or change a deployed system based only on a public signal.

## 7. Working-group and external standards practice

Before a group is OPERATING, it needs an adopted charter, scope, chair and deputy, accepted membership, competence and conflict records, decision method, minutes/decision record, accessible participation route, review/appeal route, privacy rules, funding disclosure and a current work plan.

Participation in W3C, IETF, SAFE, OSAA or another external forum does not imply endorsement, membership, certification or regulator authority. State the exact status and link to the authoritative external record. Do not use an alliance name or logo without permission.

## 8. Commercial claims and service promises

Council of AI must describe its legal entity, product, evidence, commercial relationship and limitations accurately. Disclose sponsorship, reviewer compensation, vendor relationships, model ownership and any conflict that could affect an evaluation.

Do not claim **certified**, **regulator-approved**, **safe**, **complete**, **global coverage**, **independent** or **all reports** unless the exact scoped claim is supported and reviewed. GSPC's existing doctrine is **measurement, not certification**. Payment for a proof, route or service MUST NOT change a measurement or its public status.

A public or customer-facing result must identify the scope, date, source set, denominator, method, evidence link, uncertainty, corrections route and service owner. Do not promise continuous intake, response times, confidentiality, correction or human review until the people, systems and service levels are accepted and operating.

## 9. Release and change control

Every public standard or operational claim needs a named editor, version, owner, status, evidence review, rights/privacy check, accessibility review, approval record and next review date. Preserve old versions and reasons for change. Publish only through the approved release path. Draft documents and local branches remain drafts.

### Ratification record required

- Approver and authority: **TBD**
- Adoption decision and exact version: **TBD**
- Accountable service owner: **TBD**
- Privacy/security owner: **TBD**
- Independent reviewer and appeals route: **TBD**
- Review date and change process: **TBD**

## Standards alignment (not a conformance claim)

Use [W3C PROV-O](https://www.w3.org/TR/prov-o/) as a provenance mapping reference for entities, activities, agents and responsibility; use [OMG SBVR](https://www.omg.org/spec/SBVR/) as a reference for shared business vocabulary and rules. The JSON Schema in this repository is a proposal and has not been declared PROV-O/SBVR conformant.

For personal data, follow the applicable law and current regulator guidance; the [ICO data-protection-by-design guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default) is a UK reference. This document is an operating proposal, not legal advice.
