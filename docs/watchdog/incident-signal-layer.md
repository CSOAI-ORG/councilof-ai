# Public incident signal layer: implementation boundary and next gates

Status: candidate implementation on a non-production branch. The source list is a seed inventory, not an exhaustive global census.

## What this layer currently does

The source registry names six public incident, failure, or threat sources and one official reporting rule that is not a public case database. The scheduled job checks only the listed public landing pages with HTTP HEAD. It stores endpoint state and check time, then publishes a read-only API response in the GSPC continuous-research pane.

It does not retrieve incident records, database snapshots, report text, attachments, or user submissions. It does not classify incidents, contact report authors or affected people, open staff assignments, call MEOK, write to GSPC, or make a safety decision. A reachable page is not evidence that a source's data is current, complete, or usable.

## Source scope

- AI Incident Database: the terms license specified snapshot collections under CC BY-SA and exclude submissions, report text, and linked media/content. Use-case support, field-level scope, attribution, share-alike, and privacy treatment must be reviewed before importing metadata.
- OECD AI Incidents and Hazards Monitor: a news-based daily event pipeline with AI-assisted classification and clustering. Its methodology and definitions differ from a curated submission/report database. Confirm data reuse rights before an adapter copies records.
- AIAAIC Repository: manually compiled incidents and controversies with its own definitions. Its guide requests substantially public-interest use, says adapted/redistributed material must remain CC BY-SA 4.0, and excludes commercial risk-management or text-analysis products/services. No bulk extraction is enabled.
- AVID: a database of general-purpose AI failure and vulnerability reports. It is a complementary failure-evidence source, not a general social-harm census. Confirm record-level data terms.
- MITRE ATLAS: adversary tactics, techniques, mitigations, and case studies. Treat as security context, not as an incident-record denominator.
- AI Incident Index: a newer secondary index. Its terms say its own data release is CC BY 4.0; linked third-party source material remains under its owners' terms. Check each release's provenance and deduplication before use.
- EU AI Act Article 73: a regulatory reporting obligation and authority workflow, not an open case corpus. This monitor does not access submissions.

The seed misses regional and non-English repositories, sector-specific regulators and incident databases, product-safety and transport records, cyber-vulnerability feeds, private reporting channels, and sources that have not yet been discovered. Do not label the result “all global reports.”

## Daily signal index contract

If case ingestion is later approved, keep these stages distinct:

1. **Source status:** availability, update time, access terms, and known coverage limits.
2. **Candidate intake:** retain a source identifier and source URL; exclude report text and personal data by default; deduplicate without overwriting source records.
3. **Human adjudication:** record evidence, uncertainty, correction history, and a named decision owner. Source inclusion is not proof that a claim is true.
4. **Specialist routing:** suggest the relevant GSPC safety or governance specialist only after human triage and an approved duty roster exist.
5. **Intervention:** the affected system's authorised operator decides and executes a fix. A reviewer verifies the change and records an appeal/correction path.
6. **Daily aggregate:** publish source coverage, review backlog, adjudicated signals, and verified follow-up separately. Unknown, inaccessible, or unreviewed is not zero.

The daily index should be evidence for review under a formally adopted WG-SAFE charter. It must not become an automatic safety verdict, regulator filing, certification, or end-user contact mechanism.

## Proposed 34th GSPC axis

Candidate label: **Incident evidence coverage and safe response routing**.

Proposed scope: measure whether a defined, rights-cleared source set is monitored with provenance; whether incident candidates receive timely, independent human review; whether specialist decisions are assigned under an approved roster; and whether operator-reported remediation can be independently checked and corrected.

State: **PROPOSED — not added to the published 33-axis board, not measured, and not scored.** This is an operational capability measure, not an incident count. A versioned method, denominator, source coverage policy, sampling plan, reviewer independence, error/appeal metrics, and WG-SAFE/GSPC charter approval are prerequisites.

## Activation gates

1. Counsel/data owners record allowed fields, license obligations, retention, privacy handling, and public/commercial-use conditions per source. Do not treat a public page as permission for automated bulk copying.
2. Add one approved source adapter at a time. Start with metadata only, source IDs, timestamps, stable citations, and explicit deletion/correction handling.
3. Name trained reviewers and alternates, publish escalation thresholds, conflict rules, service hours, and a human duty rota. A machine suggestion never sends a public accusation or triggers a fix.
4. Approve the WG-SAFE authority and the GSPC method/version. Keep case evidence separate from the 33 published benchmark scores.
5. Run a bounded shadow pilot, compare source duplicates and reviewer decisions, measure missed/false inclusion and review latency, then request a separate decision to publish or route operationally.
