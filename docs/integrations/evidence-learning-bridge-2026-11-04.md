# Council OS evidence and learning bridge

Status: draft source integration for review. No Council OS release, human appointment, external connection, notification or deployment is established by this change.

The new native pane uses the same portable component as the private research hub. It reads the existing public GSPC board and per-axis learning-scenario endpoint. It does not introduce another measurement engine or canonical ledger. The component offers source captures, source-scope teaching, three original synthetic exercises, local learning points, a bounded proposal and an unsigned review draft.

## Source and workflow ownership

| Layer | Owner and boundary |
| --- | --- |
| GSPC | Existing public board and verifier. Counts derive from returned records. No model run, grading or promotion here. |
| Academy | Existing `/academy` and `/dashboard?tab=learn` remain the course and axis-path front doors. This component supplies short synthetic evidence-literacy practice, not imported course content or professional qualification. |
| Council OS | One native `evidence-learning` pane under Learn. No private Site iframe or copied private seed records. |
| MEOK / Layer 0 | Existing qualified receiver and acting service must supply identity, competence, exact approval, revocation/replay, scope/expiry and independently observed effect. No action dispatch from this pane. |
| Watchdog / working groups | Selected public references and local drafts only. Source permissions, staffing, privacy controls and receiver acceptance remain required. |
| External AI hosts | Canonical read-only MCP/plugin interfaces and host-specific UI. A source adapter is not proof of installation or end-to-end acceptance. No access to a provider’s internal training database. |

Manual refresh reads allowlisted GET endpoints with credentials omitted and redirects rejected. Opt-in 60-second refresh runs only while the component is connected and the document is visible. Each source displays retrieval time. Failure preserves the last dated capture without presenting it as a successful current read. Byte hashing records retrieved JSON; issuer signatures are not checked by this reader. The existing canonical verifier remains the verification surface.

The independent synthetic lesson progress and proposal fields are browser-local. Learning points grant no role, execution permission or credential. No private incident body, real case dispatch, canonical process event or second case journal is created. An exported draft explicitly references `csoai.evidence-event/0.1` and `csoai.hitl-authority-effect/0.1`; it does not claim to instantiate either. A future qualified adapter must validate and issue the canonical records in the existing service.

The initial reference sources are `docs/PLUGINS.md`, `docs/ACADEMY-GSPC-33-AXIS-MASTER-2026-11-01.md` and the four operating-control/Watchdog documents required by AGENTS.md. Their dated observations do not override a later public readback. The historical 417 figure concerns provisions, not 417 frameworks; its cited freeze file was unavailable during this review. No complete current corpus or legal applicability is inferred. WG-SAFE’s public charter still states under development; local mapping is not adoption or endorsement.

## External handoff path

1. A host retrieves public evidence and exact lesson context through its supported plugin/MCP surface.
2. The end user can inspect, practise, explain and propose; practice stays separate from competence qualification.
3. An enrolled human and qualified receiver accept a revision-bound referral through the existing authority profile.
4. Only the authorised acting system may apply a bounded repair. An independent receiver/readback records the effect.
5. A separate human-controlled disclosure route may prepare privacy-minimised provider or WG-SAFE material. This component only exports drafts; nothing is sent.

## Validation

`node --test scripts/evidence-learning-contract.node-test.mjs`

The portable contract tests cover exact public GET allowlisting, credential omission, schema/count validation, dynamic axis rosters, wrong-axis scenario rejection, educational progress, source-only coaching context and draft HOLD/no-send/no-execution invariants. Browser QA is performed in the private Site with the same component bytes. The complete monorepo build and protected CI are not established by these local checks and must pass before merge. Merge and deployment are not requested by this draft PR.

## Journey revision — component 0.2.0

The component now resumes the selected axis and step, preserves per-axis proposals, pins each proposal to an explicit public-source capture and migrates old local backups. Background refresh updates source status without replacing the active practice/proposal panel. Rebinding a draft to a newer source is explicit. Draft completeness errors identify missing fields and receive focus; incomplete drafts can still be inspected as incomplete. Export adds a SHA-256 content-revision identifier without claiming a signature or receipt. The source cache remains dated metadata and never becomes a current measurement assertion after a failed refresh.

The tablist now has one active tab stop, labelled panels and keyboard navigation. Container queries support narrow host panels independently of viewport size. The native module loader offers recovery after a failed load. The existing navigation regression expectation includes the new Learn destination; no validation is weakened.

Design references consulted: W3C APG Tabs Pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/), WAI form notifications (https://www.w3.org/WAI/tutorials/forms/notifications/) and WCAG status-message guidance (https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html). These inform the implementation and are not a conformance claim.



## Daily report metadata learning — 7 November source candidate

The existing `/api/learning-scenarios` route now optionally reads only the public
`/reports/daily-signal/index.json` metadata. Its shared `dailyBriefing(index, now)`
projection checks the latest declared report identity, exact same-origin dated paths,
count consistency and non-future report day. No report body is fetched. Missing or
invalid optional metadata returns an unavailable briefing while the existing board,
findings and regulation scenario can still be used.

The Learn view displays the report day separately from retrieval time, the declared
report ID, mapped/unmapped event counts and direct links to that exact report and index.
The ID and signing state remain declarations from the index: this view does not verify
report bytes, signatures, legal applicability or human review. RECENT/STALE is only a
day-precision age check against a declared two-day window, recomputed at rendering;
it does not assert source correctness or new measurement activity.

A free question is derived deterministically from these public metadata fields. Its
answer remains in the current view, with no saved score, credential, reviewer role or
execution permission. The existing local proposal workflow and separate qualified
human/acting-system gates remain controlling. There is no model inference, weight
training, external notification, private intake or second canonical evidence store.

The portable public reader now caps the streamed body at 2,000,000 bytes, cancels an
oversized stream, rejects redirects and non-JSON replies, decodes UTF-8 strictly, and
hashes the actual retained response bytes. This avoids a UTF-16 character-count cap
accepting oversized multibyte input or a decoded/re-encoded hash being mistaken for
an exact response-byte hash.

Validation in isolated scratch: 23 Node contract tests passed, including optional
metadata identity/count/link/future-date rejection, source privacy minimisation,
rendered report links/exercise, current-day staleness, stream cancellation, multibyte
overflow, invalid UTF-8 and a BOM-preserving digest. Three stripped-TypeScript route
integration cases passed. Full Vitest/monorepo gates and interactive host/browser
acceptance remain required; a local Chromium launch was blocked by the runtime's
socket restriction and does not count as a passed browser test.
