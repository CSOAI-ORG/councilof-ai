# Council Academy: GSPC 33-axis learning master

Reviewed 1 November 2026. This is the implementation master for a human learning system, not a claim that courses, credentials, staffing or live human review are complete.

## Decision

Use the public Hugging Face cyber-security card as a metadata and authoring-pattern reference only. Do not make its corpus the Academy’s source material or training input yet. The card is gated; the files require accepting conditions, and Hugging Face says gated access may share the requester’s account identity with the author. The card claims an Apache 2.0 license, lists material from multiple third-party platforms, describes offensive and defensive techniques, and gives conflicting size figures (16 GB in its overview and about 95 GB in its statistics). The public card is not enough to clear each source, file, use, or safety boundary.

For the Academy, create our own versioned lesson records and use only primary-source or otherwise rights-cleared content, synthetic safe scenarios, and licensed labs. Requesting access or accepting the dataset conditions is a separate decision; no gated files were accessed in this review.

References: [Vyber07/cyber-security dataset card](https://huggingface.co/datasets/Vyber07/cyber-security) · [Hugging Face gated datasets](https://huggingface.co/docs/hub/datasets-gated) · [current GSPC board](https://councilof.ai/api/gspc).

## What exists today

| Surface | Current state | Academy consequence |
| --- | --- | --- |
| /academy | Public four-part overview: Foundations, Your jurisdiction, Apply, Attest. It says credential issuance is not open and completion would record reproduction, not conformity. | Keep this as the one front door. This working tree adds links to 13 public GSPC banks, five one-module ORB datasets, axis practice and reproducibility exercises; it is not deployed. |
| /learn and /tracks | Separate short-track page; public page identifies /learn as a reference/archive surface. | Do not create another course catalog here. Route learners to /academy. |
| /dashboard?tab=learn | Reads the live board and builds one five-stage path per returned axis. Stage 4 changes to a measurement method for declared slots and a source follow-up for deterministic facts; the final stage is explicitly practice review. | Reuse this as the axis-path runner. It has no MEOK tutor or human case dispatch. |
| Offline path fallback | The working tree now combines the 23-row 29 September identity snapshot with ten 1 November public axis identities. The fallback includes no current measurement state. | Keep the live board authoritative; on outage, show all 33 identities and say measurement state is unavailable. Not deployed. |
| Axis lesson detail | Plain-language prompts now cover all 33 current axes. Declared subject slots receive method-first stages but still have no dedicated reproduced exercise or independently reviewed course module. | Add safe, axis-specific exercises; keep the ten subject-slot statuses UNMEASURED. |
| /academy/exercises | Nine reproducible exercises for board totals, signed cards, roots, corpora, charter hash and Article 50 marking. | Reuse as measurement-reproduction work. These exercises are not a complete 33-axis course and do not establish professional competence. |
| /training-hub, /training, /courses, /my-courses | Current app routes show a content-review notice. Course quiz banks are not served. | Keep these doors closed until content, rights, review and learner flows are ready. |
| TrainingHub source | Contains nine game concepts, including proposed location/photo collection, user-preference capture, leaderboards and fixed player counts. | Do not expose or connect these claims to training data until privacy, consent, accuracy and moderation are reviewed. |
| gspc-curriculum.ts | Explicitly described in source as an unrouted archive. | Do not revive it as a competing source of truth. |
| /api/learning-scenarios | Read-only join of board, published evidence pointers and regulatory context. It has no training write, incident intake, fix execution or board promotion. | Reuse as cited lesson context only; keep its boundaries. |

The axis practice component holds completion and review choices in local React state. It fetches the board and scenario context, but it does not save progress, contact a human, create a MEOK case or write GSPC. Its “Human review” control is a practice choice, not a real referral. A separate `/api/hitl` shared-token ledger is live, but it does not authenticate named reviewers or learners, call MEOK/EAT, route private reports, or execute actions. The Academy page labels the practice-only boundary.

## Live roster and one learning objective per axis

The live board returned 33 axes: 23 MEASURED and 10 UNMEASURED. Measurement types differ: 14 model-comparison axes and nine deterministic-facts axes. A measurement is not a certification or a separated leader. The board currently says zero of 14 model-comparison axes have a statistically separated leader; seven are TIE and seven are UNTESTED.

The table defines the first human learning objective for each live axis. “MEASURED” describes only the board state as of this review. For every UNMEASURED subject slot, the lesson teaches what evidence and method would be needed; a learner cannot make it measured.

| Axis | Current board state | Specialist learning objective |
| --- | --- | --- |
| governance | Model comparison · MEASURED | Classify an AI use against the named risk framework and explain the evidence and uncertainty. |
| safety | Model comparison · MEASURED | Distinguish a necessary refusal from helpful completion of a safe request. |
| provenance | Model comparison · MEASURED | Apply the stated content-marking rule and explain its scope. |
| continuity | Model comparison · MEASURED | Check continuity and cryptographic claims against the published method and its limits. |
| conformance | Model comparison · MEASURED | Compare observed tool or protocol behaviour with a pinned specification. |
| openness | Model comparison · MEASURED | Check software licence permissions and explain what is not established. |
| machinery-conformity | Model comparison · MEASURED | Identify the claimed safety function and the evidence needed to assess it. |
| care | Model comparison · MEASURED | Provide safe, relevant support while identifying both over-refusal and harmful assistance. |
| cross-reality | Model comparison · MEASURED | Decide when an agent may act, must ask, or must refuse under the stated authority. |
| detector-interop | Model comparison · MEASURED | Explain which watermark and detector combinations interoperate, using the test scope. |
| art5-safeguard | Model comparison · MEASURED | Recognise the specified prohibited practice and cite the applicable boundary. |
| swarm | Model comparison · MEASURED | Inspect how multi-agent interactions change risk and where controls must apply. |
| affect | Model comparison · MEASURED | Recognise manipulation or exploitation of emotion and explain safer alternatives. |
| jail | Model comparison · MEASURED | Identify a jailbreak attempt and explain the refusal and recovery boundary. |
| effect-binding | Deterministic facts · MEASURED | Compare the authorised tool arguments with what the server actually executed. |
| provenance-controls | Financial facts · MEASURED | Read public ledger controls as evidence of issuer permissions, not proof of every operational claim. |
| reserve-attestation | Financial facts · MEASURED | Distinguish a disclosed reserve statement from an independently evidenced attestation. |
| regulatory-framework | Financial facts · MEASURED | Find the issuer’s declared regime and verify it against a dated primary source. |
| distribution-integrity | Financial facts · MEASURED | Reconcile the published supply and holder evidence, including source freshness. |
| custody-disclosure | Financial facts · MEASURED | Verify whether a custodian and auditor are named and confirmable. |
| ai-adoption-components | Financial facts · MEASURED | Trace cited official adoption series and explain that they are components, not a model score. |
| labour-components | Financial facts · MEASURED | Trace cited official labour series and explain that they are components, not a model score. |
| humanoid-labour-index | Financial facts · MEASURED | Check dated public vendor deployment counts and state the frozen URL scope. |
| lab-practice | Declared subject slot · UNMEASURED | Learn how to check whether a lab publishes evaluations, a safety framework and incident reports. |
| company-practice | Declared subject slot · UNMEASURED | Compare a non-lab company’s public statements with public evidence without inferring intent. |
| measurer-integrity | Declared subject slot · UNMEASURED | Inspect an evaluator’s methods, test sets, reproducibility and conflicts of interest. |
| harness-fidelity | Declared subject slot · UNMEASURED | Design a controlled comparison of the same model and bank across evaluation harnesses. |
| interop-conformance | Declared subject slot · UNMEASURED | Learn what a standards group must publish for specifications, test suites and conformance records to be checkable. |
| humanoid-deployment | Declared subject slot · UNMEASURED | Learn how to verify deployment claims against a dated public registry and a stated denominator. |
| regulator-transparency | Declared subject slot · UNMEASURED | Practise factual presence checks for guidance, registry, methodology, consultation and contact routes; do not rate regulators. |
| interpretability-reproducibility | Declared subject slot · UNMEASURED | Identify the code, data, model revision and steps needed to reproduce an interpretability claim. |
| claim-maintenance | Declared subject slot · UNMEASURED | Preserve a dated claim and classify unchanged, disclosed change, silent change, withdrawal or unreachable; do not infer truth. |
| serving-fidelity | Declared subject slot · UNMEASURED | Learn how to compare a claimed serving configuration with its reference on a frozen bank. |

## Target shared course pattern

When the curriculum registry and MEOK adapter are built, each of the 33 paths should use one common lesson runner and one restricted specialist profile selected by axis ID. “Specialist” means a versioned teaching role and evidence map, not a separate self-governing agent. The assistant may explain, ask practice questions, point to sources, and abstain. It may not promote evidence, publish a finding, make a consequential decision, or execute a fix.

The specialist profiles and MEOK routing are not implemented yet. The current branch supplies axis-specific practice prompts and method-first steps for declared slots.

1. Learn: read the task, instrument, board state, source date and limitations.
2. Play: attempt a bounded synthetic or rights-cleared scenario. No live system changes.
3. Explain: state evidence, assumptions, uncertainty, and what would change the conclusion.
4. Propose next step: a bounded fix for a model-comparison task, an evidence follow-up for a deterministic fact, or a frozen measurement method for an unmeasured subject slot. Do not execute it.
5. Practice review: compare the record with its rubric. A real authenticated reviewer may accept, return or reject only after a staffed review service exists; the current control is a local simulation.

A lesson record should pin: lesson ID and version; axis ID and board revision; learner outcome and prerequisite; source URL, revision/date, licence/permission and content hash; approved scenario and safety class; allowed tools; answer key and rubric revision; human-editor and review state; accessibility and locale status; last review and expiry/recheck date. No lesson should copy a dataset row without an approved provenance and rights record.

## Roles and system boundaries

These are designed role scopes; appointments, authenticated routing and case storage are not live yet.

| Role | Allowed work | Not allowed |
| --- | --- | --- |
| Axis tutor | Explain the versioned lesson, retrieve allowlisted public sources, run a safe sandbox exercise, identify uncertainty. | Grade its own evidence as an independent reviewer, file a report, contact a regulator, change a live system, or alter GSPC. |
| MEOK router | Bind the learner’s request to one axis/profile/version, preserve the request and decision context, ask for human approval when a real effect is requested. | Treat a model suggestion or training click as user authorization. |
| Council reviewer | Review a specific case or practice record, record reasons, conflicts, dissent and correction path. | Claim authority or represent an appointment that has not been made. |
| GSPC service | Publish its separately governed board measurements and corrections. | Ingest learner progress or raw incident reports as measurement rows. |
| Watchdog index | Link to eligible source records and expose dated, minimal metadata and denominators. | Publish private reports, identity, allegations or sensitive evidence by default. |
| H.I.M. learning layer | Explain, train, alert, collect consented feedback and route corrections. | Turn conversation, game score or completion into proof of competence or effect. |

For real reports, keep the Academy progress store, MEOK case journal, watchdog link index and GSPC measurement records separate. An actual user report needs an explicit scope, consent, privacy notice, source permissions, retention/correction path and human receiver. The daily watchdog index can link to eligible records; it must not silently turn reports into GSPC measurements.

## Gamification rules

- Reward lesson progress, retries, source checking and clear explanations. Points are educational feedback only.
- Do not rank people by incident volume, report severity, compliance claims or GSPC scores.
- Do not collect real-world locations, photos, identities or private incident content as game rewards.
- Do not let XP, streaks, badges or leaderboards grant agent permissions or affect human decisions.
- Clearly separate a learning completion, a reproducible measurement exercise and any future reviewer qualification. None is a certification.
- Offer a non-game route, keyboard and screen-reader support, translation review, low-bandwidth content and reset/delete controls for learner progress.

## Build order

Steps 1–2 are implemented in the working tree and are not deployed. Steps 3–7 remain open.

| Step | Deliverable | Completion evidence |
| --- | --- | --- |
| 1. Academy front door | One clear /academy entry linking to axis practice, reproducibility exercises and the verified public learning banks. | Working-tree route links match the verified public resources and state current limits. |
| 2. Current roster resilience | Dated, identity-only 33-axis fallback; live GSPC remains authoritative and current measurement state is omitted on outage. | Focused tests show all 33 identities during a live-board outage; none of the ten declared slots is presented as measured. |
| 3. Curriculum registry | Versioned 33-axis lesson records using the shared fields above; one named content owner and reviewer for each subject area. | Every row has an outcome, safe scenario, rubric, primary sources, review state and expiry. |
| 4. Defensive security path | Create a small, safe pilot from independently rights-cleared sources and synthetic lab fixtures. | Source-by-source rights, safety review, negative controls and reproducible lesson package. |
| 5. MEOK review service | Persist an authenticated human decision bound to the original request, lesson/case revision and allowed scope; support decline, return, expiry, correction and appeal. | Independent receiver confirms a bounded shadow-pilot record. |
| 6. Council reviewer training | Calibrate reviewers on blinded synthetic cases and measure disagreement, abstention and correction. | Named reviewers, conflict handling, minimum coverage and independent receiver acceptance. |
| 7. Broader rollout | Add more axes only when content owners, review hours, accessibility and source rights are available. | Published scope and denominators match actual capacity; separate launch decision for each surface. |

## Open owner work

The current source set still needs named human roles before live human-in-the-loop training or report intake: Academy editor; axis subject reviewers; human-review chair and deputy; privacy/security owner; case receiver and backup; appeal reviewer; service hours and escalation coverage. The 33 specialist profiles are not appointments. The operating legal entity/signatory and exact adopted controls must remain those verified in the Council operating master, not inferred from a course page.

Rights must be logged per source before a course adapter is enabled. The Vyber07 cyber-security dataset remains gated and its files were not accessed; do not request access or train on it by default. The 13 public CSOAI Academy dataset cards declare CC-BY-4.0 metadata, but row-level source provenance and commercial-use clearance still need reconciliation before reuse or training. Public GSPC rows and Academy activity are separate. No course completion, student correction or incident report changes the GSPC count.

## References in the repository

- Public board: https://councilof.ai/api/gspc
- Current Academy entry: https://councilof.ai/academy/
- Reproducible exercises: https://councilof.ai/academy/exercises/
- Learning path source: client/src/data/gspc-learning-paths.ts
- Axis practice UI: client/src/components/DashboardLearningPane.tsx
- Read-only scenario context: functions/api/learning-scenarios.ts
- Academy route: client/src/pages/CouncilAcademy.tsx
- Generated module inventory: council-os/academy/module-inventory.json

## Public release and runtime audit — 2026-11-01

This addendum supersedes any earlier “13 datasets / 502 hard cases / flywheel complete” wording. Public repos exist; the end-to-end training, EAT, MEOK and daily-watchdog loop does not.

### Hugging Face inventory

The Hub API listed all 13 GSPC banks, five ORB rank datasets and the practice-review metadata repo as public and ungated on this snapshot. The 13 GSPC banks total 782 rows, with 413 rows carrying the dataset tag `majority_wrong` (not “gold” by that tag alone). The dataset-card metadata lists CC-BY-4.0; source-level provenance, restrictions, and commercial reuse still need review. The 13-bank release covers 13 of the 14 model-comparison axes. It does not include jail, the nine deterministic-fact axes or the ten declared subject slots. Swarm has three released rows while its board card reports n=37. The dataset revision date is not the measurement date: the underlying comparison card is dated 2026-08-12.

| Axis | Repo | Rows | `majority_wrong` tag |
| --- | --- | ---: | ---: |
| Governance | [gspc-academy-gov](https://huggingface.co/datasets/csoai/gspc-academy-gov) | 237 | 134 |
| Care | [gspc-academy-care](https://huggingface.co/datasets/csoai/gspc-academy-care) | 199 | 152 |
| Affect | [gspc-academy-affect](https://huggingface.co/datasets/csoai/gspc-academy-affect) | 41 | 12 |
| Safety | [gspc-academy-agi](https://huggingface.co/datasets/csoai/gspc-academy-agi) | 36 | 4 |
| Article 5 safeguards | [gspc-academy-art5](https://huggingface.co/datasets/csoai/gspc-academy-art5) | 36 | 1 |
| Continuity | [gspc-academy-asi](https://huggingface.co/datasets/csoai/gspc-academy-asi) | 33 | 21 |
| Detector interoperability | [gspc-academy-det](https://huggingface.co/datasets/csoai/gspc-academy-det) | 33 | 11 |
| Machinery conformity | [gspc-academy-mach](https://huggingface.co/datasets/csoai/gspc-academy-mach) | 33 | 22 |
| Conformance | [gspc-academy-mcp](https://huggingface.co/datasets/csoai/gspc-academy-mcp) | 35 | 13 |
| Openness | [gspc-academy-oss](https://huggingface.co/datasets/csoai/gspc-academy-oss) | 32 | 7 |
| Provenance | [gspc-academy-prv](https://huggingface.co/datasets/csoai/gspc-academy-prv) | 32 | 13 |
| Cross-reality | [gspc-academy-xr](https://huggingface.co/datasets/csoai/gspc-academy-xr) | 32 | 21 |
| Swarm | [gspc-academy-swarm](https://huggingface.co/datasets/csoai/gspc-academy-swarm) | 3 | 2 |
| **Total** | **13 repos** | **782** | **413** |

The five ORB rank repos expose one frozen quiz module each (five total), with listed XP rewards 160, 160, 160, 150 and 170 (800 total). That does not implement per-learner progress, identity, a sealed exam, reviewer authorization or promotion. It also does not match a 750-XP final-rank threshold if that threshold is retained. The cited `meok-router/meok-hitl-mooc.mjs` builder was not found in the M2 or M4 working roots, so the public release cannot currently be regenerated from the checked-out source.

The practice-review repo contains 30 metadata pointers, not 664 evidence bodies. All 30 rows have null `xp_if_accepted`. Its README/card says “664 pending”; the live review/EAT routes checked during this audit were unavailable. Treat 664 as an unverified card claim, not a count that learners can clear. Do not load private incident reports into the public dataset.

### Live surface boundaries

On the 2026-11-01 read, `/api/hitl` returned 200 and reported a bound store, an open shared-token decision path, and configured signing. Its sibling responses showed 33 modules, 3 challenges (1 pending, 2 decided) and 2 receipts. Secrets are not recorded here. The route is a public/shared-token ledger: it has no named reviewer authentication or per-learner module ledger, accepts the `operator` string from the caller, exposes challenge subject/action, returns `execution_authority: false`, and does not call MEOK, EAT or the GSPC write path. It is not safe for private incident intake and is not a qualification gate.

The live GSPC snapshot was 33 axes: 23 measured and 10 unmeasured; 14 comparison axes and nine deterministic-fact axes. The model comparison is bounded to its 2026-08-12 dataset and model set, not a continuous sweep of every open-source model. The 19 arms include six base models and 13 CSOAI prompt-overlay variants; this is not an independent inventory of all available models. The 1,230 board item count is the sum of axis sample sizes; 15,580 is a separate underlying model-response-row count. Neither means 15,580 live reports are collected. The 13 Academy banks are a published subset and do not automatically refresh when the board changes.

The current M2 app does not contain a local reproducible publisher for the public HF Academy release. The working tree does contain the learning-path runner and a read-only scenario context, but its completion and review choices remain browser-local. The 30-row practice dataset and the public `/api/hitl` ledger are separate. There is no verified MEOK case handoff or EAT queue drain.

### M2, M4 and Busabase reconciliation

This repo’s master doc is the proposed single implementation record. No Busabase write was made. M4’s local Busabase routes did not respond to the checks made in this pass, and the available connection notes disagree about which route is primary. An archived 24 October handoff says a managed Busabase connector was the selected read/write path, but no Busabase connector is exposed in this session, so that historical route was not independently verified. Do not write or create a second Busabase master until the owner confirms the live primary and access controls.

A separate private workspace contains a local MEOK owner-review prototype. Its Ed25519 check verifies key possession only; its review script previews a bounded local evidence-export proposal and returns exact bytes/hash without sending, signing, or authorizing it. Its 21 synthetic fixture tests pass. Reuse its local approval and exact-byte preview patterns when designing MEOK handoff; it does not authenticate a human identity, enroll a reviewer, accept end-user reports or route a case. Its challenge payload stays out of this public-facing master.

The archived 16 October Academy/game handoff and 24 October three-file source proposal already describe a local Ruler practice entry. The 24 October note reports draft PR #3428 and passing earlier checks, but the connected GitHub read returned 404, so current PR state could not be verified. The active M2 checkout did not contain those Ruler/MEOK changes; I did not reapply or open a duplicate. This pass adds only dataset links, truthful dataset limits, the full offline identity roster and master reconciliation.

The M2 Ollama inventory includes `gspc-qwen3-1.7b-16k`, Qwen coder, DeepSeek R1 and Qwen3 variants; it does not list a GLM model. No model inference or dataset generation was started. Counts and schemas here came from the public Hub/API reads; dataset-row reuse remains held on provenance and rights review.

### Tavus and Griffin fit

Tavus’s official Griffin release page, dated 1 October 2026, still describes Griffin-Lite as a research preview for selected testers, not customer availability; Tavus says Griffin is not on its platform yet and flags the risk that realistic video can make users believe they are interacting with a person. The public examples are Apache-2.0 integration code for hosted Tavus APIs; the public agent skills repo is MIT. Neither releases Griffin weights. These can inform an optional disclosed video interface, never a reviewer, identity check or incident-response authority. ([Tavus Griffin release](https://www.tavus.io/griffin) · [Tavus examples](https://github.com/Tavus-Engineering/tavus-examples) · [Tavus agent skills](https://github.com/tavus-engineering/tavus-skills))

Griffin Labs’ separate Alpha-S is a robotics VLA, not the Tavus human-interaction model. Public Alpha-S base and fine-tune cards list CC-BY-NC-SA-4.0 for model weights and Apache-2.0 for plugin code; recent cards include LIBERO and RoboTwin variants. This may support non-commercial robotics evaluation after a separate fit and safety review, but the weights are not cleared for commercial training. ([Griffin Alpha-S base model card](https://huggingface.co/griffinlabs/Griffin-Alpha-S) · [LIBERO fine-tune](https://huggingface.co/griffinlabs/Griffin-Alpha-S-LIBERO) · [RoboTwin fine-tune](https://huggingface.co/griffinlabs/griffin-alpha-s-robotwin))

### Target end-to-end flow — not yet deployed

1. Maintain a versioned allowlist of public regulator, standards, incident, research and model-evaluation sources. Record each source’s terms, permitted fields, commercial-use status, privacy risk, update method, retention and correction path before connecting it.
2. Run daily change detection only over approved endpoints. Store canonical URL/ID, source revision, observed time, metadata fields allowed by that source, content hash, license snapshot and deduplication links. Keep original source bytes at the source unless archival rights are explicit.
3. Deduplicate without erasing provenance. Exact duplicates may be grouped by hash; near-duplicates retain separate source IDs and a human-reviewed relation. Never count a copied syndication as independent corroboration.
4. Produce a metadata-only Watchdog/GSPC signal index with coverage denominators, source freshness, axis mapping, uncertainty and correction status. It links to public records; it does not ingest raw private reports or assert truth.
5. Route an opt-in user report to private MEOK only after consent, authenticated intake, minimization and a named, staffed receiver. Bind reviewer decisions to the report revision and permitted action. The receiver can decline, return, correct, appeal or expire the case. No case action runs without separate explicit authorization.
6. Update lessons from approved changes as a draft. A human subject editor and WG-SAFE reviewer approve source, rights, safety, rubric, accessibility and expiry before a version is published. A regulator change can trigger review; it cannot silently rewrite a gold answer.
7. Measure models only through the canonical GSPC harness on a pinned, rights-cleared bank and a declared model/version/sample plan. Publish numerator, denominator, confidence/uncertainty, exclusions and run date. No incident feed, MOOC score or learner verdict writes a GSPC measurement.
8. Sign the exact versioned metadata/receipt bytes with Ed25519 and publish SHA-256 for integrity and independent verification. A valid hash/signature proves the bytes were not altered and identifies the signer; it does not prove source rights, factual truth, safe handling or a correct decision. Publish correction and revocation records too.

The production source registry, deduplication service, private MEOK referral, per-learner Academy progress, review staffing, EAT wiring, complete reproducible dataset publisher and periodic GSPC model runs remain open engineering/governance work. An existing CSOAI evidence digest is enabled daily at 08:00 Europe/London; its latest recorded run was 31 October. I extended that same report-only automation to rotate through the Hugging Face Academy inventory and official Tavus/Griffin release sources, preserving its schedule and eight-resource budget. Its next-run time is not confirmed, and it does not write GSPC or collect reports into the production platform. Axis 34 remains out of scope until the 33-axis methods, source denominators, rights, measurement capacity and reviewer coverage are approved.

### Current execution status

The working tree contains the Academy bank links, corrected public counts/limitations, a 33-identity offline roster and corrected HITL guidance. The focused Academy/dashboard suite passed 14/14; the separate MEOK owner-review prototype fixture suite passed 21/21; `git diff --check` passed. A full-repo TypeScript check was stopped after a sustained run without diagnostics, so this is not a clean full-project typecheck. This code is not deployed; no public write, model training, Busabase mutation or production data collection has been performed.
