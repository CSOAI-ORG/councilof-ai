# RAS — Request Attestation Service: specification (draft v0.1)

**Status:** DRAFT for owner review, 21 Nov 2026. Not in force. Nothing in this file changes the behaviour of any live door.
**Parent plan:** [`CSOAI-RELIANCE-PLAYBOOK.md`](CSOAI-RELIANCE-PLAYBOOK.md) §5.2 (RAS), §5.3 (frozen to fluid), §5.6 (root ceremony).
**Related contract:** [`AXIS-REPORT-CONTRACT.md`](AXIS-REPORT-CONTRACT.md).

CSOAI measures; it never certifies. An RAS attestation is a signed, reproducible record of what was measured, how, by whom and with what result. It is not a certificate, a rating, a conformity assessment or legal advice. Every attestation must say this in its body.

## 1. Scope

RAS turns the existing request doors into one flow: `/api/request-attestation` (door D06) and the three `/api/ras/*` x402 doors. A request names:

- a **subject**: model, agent, MCP server, site, or a provision set;
- the **axes** (GSPC axis ids) or **provisions** (frozen provision hashes) to be checked;
- the **tier** (T0–T3, §4).

Out of scope: certification, ratings over unmeasured axes, and any request that falls inside the refusal hard-stops (§6).

## 2. Flow

| Step | State on exit | What happens | Actor | Evidence record |
|---|---|---|---|---|
| 1 Request | `ACCEPTED` or `REFUSED` | Subject, axes/provisions and tier recorded. **Method versions are fixed at acceptance** (`method_sha`, `bank_sha`, `dataset_revision`). | Requester (lab, deployer, insurer, auditor, agent via x402) | Signed request record |
| 2 Execute | `EXECUTED` | Pinned runners: Inspect / lm-eval (model axes), garak and an MCP scanner (security), GSPC-native graders (subject and deterministic axes). | Automation | `.eval` / scan logs, dataset revisions, model ids |
| 3 Seal | `SEALED` | Layer 0 hashes every log, builds an RFC 9162 Merkle root and anchors it (OTS / Rekor). | Automation | `evidence_manifest` with root and anchor receipts |
| 4 Review | `REVIEWED` or `RETURNED` | A human reviewer checks scope, negative controls and anomalies. Tier T3 (and any request above risk tier 2) needs a 2-of-3 threshold signature. Scanner verdicts are classified by a human before they are cited. | Enrolled reviewers, never the owner alone at T3 | Reviewer signature(s), review notes |
| 5 Publish | `PUBLISHED` | Published **whatever the outcome**, verifiable in a browser with no CSOAI service running. | Automation | Static verifier page + frozen snapshot id |
| 6 Accept / correct | `ACCEPTED_BY_RECIPIENT` / `CORRECTED` | Recipient records acceptance, or anyone files a correction. Corrections are appended, never overwritten. | Recipient / any party | Acceptance or correction record |

Rules:

1. Every attestation cites a **frozen snapshot id** (playbook §5.3), never "the live board".
2. A result is published with its population (denominator, tested, failures, inaccessible). No blanket coverage is implied.
3. An axis that is STALE, UNMEASURED or UNCHECKABLE is reported as such. It is never silently omitted or averaged.
4. Until a witnessed root ceremony has been held (playbook §5.6), every attestation states that the signing root is **simulated** and anchoring is pending.
5. `T0` output is labelled `unreviewed` in its body and its metadata.

## 3. Records

All records are JSON, content-addressed (sha256), and sealed in the Layer 0 manifest.

| Record | Required fields |
|---|---|
| `ras_request` | `request_id`, `received_at`, `requester` (pseudonymous id or consented name), `subject`, `axes[]` or `provisions[]`, `tier`, `method_pins{method_sha, bank_sha, dataset_revision}`, `accepted_at` / `refused_reason` |
| `ras_execution` | `request_id`, `runner`, `runner_version`, `model_id` / `subject_ref`, `log_sha256[]`, `started_at`, `ended_at` |
| `ras_seal` | `request_id`, `merkle_root`, `leaf_count`, `ots_receipt`, `rekor_entry`, `anchor_state` (`ANCHORED` / `PENDING` / `SIMULATED`) |
| `ras_review` | `request_id`, `reviewer_ids[]`, `threshold` (`1-of-1`, `2-of-3`), `signatures[]`, `notes`, `coi_declarations[]` |
| `ras_attestation` | `request_id`, `snapshot_id`, `axis_reports[]` (each per `axis-report.schema.json`), `disclaimer`, `verifier_url` |
| `ras_acceptance` / `ras_correction` | `request_id`, `party`, `at`, `text`, `supersedes` (for corrections) |

Personal data: requests carry no personal data beyond what the requester chooses to give for contact, and recipient names are published only with consent.

## 4. Tiers (proposals; prices not market-tested)

| Tier | Contents | Human review | Proposed price |
|---|---|---|---|
| T0 | Agent-native automated check via x402 | None; labelled `unreviewed` | Per call (x402) |
| T1 | Per-system check (e.g. AI Act Art 50 marking evidence) | One reviewer | £150–£500 |
| T2 | Monitoring: monthly re-attestation, frozen snapshots on the fluid stream | One reviewer per cycle | £200–£600 / month |
| T3 | Threshold-signed, for insurer or auditor reliance | 2-of-3 reviewers | Per engagement |

T2 and T3 are **not sold** until every control in §5 is live.

## 5. Conflict-of-interest controls (mandatory before T2/T3 are sold)

| # | Control | Evidence that it is live |
|---|---|---|
| C1 | Methods are frozen and published **before** a request is accepted | `method_sha` resolves to a public file at acceptance time |
| C2 | Negative and unfavourable results are published | Publication log shows every `SEALED` request reached `PUBLISHED` |
| C3 | Reviewers receive no sales compensation and rotate | Reviewer register with rotation dates; signed COI declaration per review |
| C4 | A reviewer may not review a subject they, or their organisation, have a commercial tie to | `coi_declarations[]` on each `ras_review` |
| C5 | A public appeals and corrections route exists | Published route; corrections appended (step 6) |
| C6 | The attestation unit is ring-fenced from MCP compliance-tool sales (AI Act Art 31(5)-type separation) | Separate accounts, approvers and reporting lines, written down |
| C7 | Requester pays for the work, not for the outcome; price is fixed at acceptance | Price in `ras_request`; no outcome-contingent fees |
| C8 | The owner alone cannot sign a T3 attestation | Threshold policy (2-of-3, at most one signer per organisation) |

## 6. Refusals

A request is refused at step 1 if it falls inside the refusal hard-stops ("DORADO stops": CBRN, kinetic targeting, surveillance) or asks CSOAI to certify, rate or approve rather than measure. The refusal is recorded with a reason code and is itself publishable.

## 7. Open items

- Real root ceremony and fresh anchors (playbook §5.6) — prerequisite for any claim of anchored attestation.
- Reviewer enrolment and the COI register (C3, C4).
- Pin the HF dataset revision in Inspect task metadata (logs do not record it today).
- Acceptance records (step 6) do not exist yet; they are the reliance asset RAS is meant to create.
