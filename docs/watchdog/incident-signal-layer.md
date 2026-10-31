# Watchdog incident-signal layer: verified state and build gates

**As of:** 31 October 2026
**Status:** design and local metadata preview. This is not a connected incident-collection or staffed case service.

## Verified current state

- The Public Watchdog working group, registry, tracker and read-only MCP participation resources already exist. PRs [#3641](https://github.com/CSOAI-ORG/councilof-ai/pull/3641) and [#3657](https://github.com/CSOAI-ORG/councilof-ai/pull/3657) are merged. The inspected records show no accepted chairs or members and no staffed incident service.
- The official [WG-SAFE charter](https://github.com/OpenSecureAIAlliance/wg-safe/blob/main/CHARTER.md) remains under development pending Steering Committee approval; its public [RFC](https://github.com/OpenSecureAIAlliance/wg-safe/blob/main/rfc-safe-proposal.md) is a proposal. This internal delta does not adopt that charter or claim SAFE membership or endorsement.
- The existing daily CSOAI evidence digest is bounded and report-only. It reads public pages, including AIID, OECD AIM and AIAAIC. It does not download snapshots, retain incident records, create cases, assign reviewers, write to GSPC or file to SAFE.
- The existing Watchdog source monitor uses `scripts/watchdog/source-status.mjs` and `functions/api/watchdog-sources.ts`. It checks the seven entries in `data/watchdog/source-registry.json` with HTTP HEAD; the saved snapshot has six monitored pages and one not monitored. It reads no report body or incident record.
- A local draft generator, `scripts/watchdog/daily-index.mjs`, now turns that existing registry and saved HEAD snapshot into the draft metadata-only index. The 31 October snapshot yields 7 registered pages, 6 monitored pages (6/7), and incident counts marked not in scope. The preview was generated from the saved snapshot without network access. This isolated branch also wires generation into the existing daily `reg-watch` review-PR workflow; that change is not active on main until reviewed and merged, and it does not auto-merge or publish a final index.
- The runtime availability inventory and the controlled source-permission register are separate records. The runtime inventory has seven public source-page entries; the permission register has six bounded rows for AIID, OECD AIM, AIAAIC, the EU reporting reference, Council intake and the GSPC board. There is no reviewed crosswalk between them. A reachable page is not an ingestion permission; runtime rights states remain unknown and all record-level adapters remain disabled.
- Legacy M2 Watchdog code uses mock incidents and has no verified durable public intake or case store. The M2 workspace is dirty and its active scope is locked to the gateway and `/api/a2a`; no M2 source was changed.
- The public GSPC endpoint reports 33 axes: 23 measured and 10 unmeasured. It is a measurement board, not an incident feed. Watchdog may link to GSPC; it must not copy incident counts into GSPC or change axis scores.

## Source and index boundary

The [daily index schema](daily-incident-signal-index.schema.json) and generator are draft artifacts. The generator reads only the local source registry and saved HEAD status. It makes no network request, reads no incident record, and performs no MEOK, GSPC, Busabase or publication write. It reports endpoint state, checked time, HTTP status and unknown rights state. Incident intake, deduplication, case quality and human-review counts are explicitly not in scope; they are not zero-event claims.

The source-page inventory is not exhaustive and does not measure report coverage. Geography, language and sector scope are unspecified. The source-specific permission register remains controlling for any later record-level adapter. Join the two registers through an owner-reviewed source-ID crosswalk before changing any rights state or enabling an adapter.

Public output must exclude report text, reporter identity, attachments, personal data and small cells that could reveal a person. Unknown, inaccessible, restricted and unreviewed are not zero. The index must name its sources and period and state its coverage gaps.

## Human referral and evidence

Use the existing `csoai.evidence-event/0.1` schema in `packages/evidence-fabric/schema/evidence-event-0.1.schema.json` and the existing `csoai.hitl-authority-effect/0.1` profile. Do not define another event schema or create a second case or decision store.

A future MEOK referral must bind the exact case revision digest, intended human role, permitted task scope and expiry. Issue, receipt, acknowledgement, acceptance, decision and action are separate facts. An authenticated human key and explicit human acceptance are required; a recommendation or machine signature is not a human decision. If no reviewer has accepted the role, the state is `NOT_STAFFED`. MEOK must not contact a reporter, provider, regulator or affected person automatically.

The existing M4 `/api/meok-library/cases` route is a private company-case gateway, not a Watchdog staff-review queue. Its source comment says the private origin and grant are not installed by that change. Do not repurpose it for Watchdog referrals. No Watchdog receiver, accepted reviewer roster or reviewer key was verified.

## Gates before any pilot

1. The authorized company decision-maker records a signed adoption of the exact internal operating-controls and integration-delta versions. The official WG-SAFE charter remains under development, so there is no approved external charter version to adopt or claim affiliation with yet.
2. Named humans accept chair, deputy, privacy/security, reviewer and alternate roles, with conflicts, competence, consent, service hours, escalation, funding and appeals recorded. The 33 specialist declarations do not appoint people.
3. The source owner records permitted fields, purpose, commercial-use terms, privacy controls, retention and correction path for each source. All record-level adapters remain disabled.
4. Connect the owner-approved source-ID crosswalk; preserve the existing evidence event and authority-effect profile; implement a revision-bound MEOK route only after the actual review receiver and access protocol are qualified. Keep the public index metadata-only and GSPC link-only.
5. Start a bounded 30-day shadow pilot only for a source with written rights approval and an accepted independent receiver. Measure freshness, missingness, duplicates, reviewer disagreement, corrections and latency.
6. Consider Axis 34 only through a separate approved GSPC process after the construct, denominator, rights, method, human capacity, uncertainty and independent validation are approved.

## Accurate language

**Current:** “The existing daily evidence digest reads a bounded set of public pages, including AIID, OECD AIM and AIAAIC. The Watchdog can generate a local metadata-only source-availability preview for seven named pages. It does not ingest incident cases or provide a staffed Watchdog service.”

**After launch, if evidence supports it:** “The Watchdog index reports coverage only for named sources and authorized reports, with freshness and human-review state as of a stated time.”

Do not claim all global reports, continuous incident collection, 24/7 human review, legal compliance, certification or a 34th live axis.
