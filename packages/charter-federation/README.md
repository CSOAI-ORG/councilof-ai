# Council of AI charter federation and working-group lab

This package connects the existing constitutional charter and frozen hashes to canonical working-group documents. It provides a validated source register, two public participation views, generated website/HF/Kaggle resources, and three read-only stdio MCP tools. Deployment receipts are separate from source acceptance; staffed operations and authenticated human decisions require genuine participants.

## What already exists

The input charter has 22 articles. The frozen manifest has 417 identifiers across six instruments. The existing coverage report records 1 predicate, 12 related measures, 38 crosswalk-only records and 366 hash-only records. Original normalized legal-text bytes remain unresolved, including for records with related measurements. NIST AI RMF, ISO/IEC 42001 and OWASP are separately listed outside that frozen corpus. Do not describe this as all laws or all frameworks implemented.

The canonical working-group registry defines seven forming groups and first tasks; no chairs or accepted members are inferred. The watchdog intake lane already produces a human-routing queue. This package consumes the former as a pinned input and complements the latter. Neither a source count nor a routing count is GSPC's measured sample size.

## Frozen commitments, live evidence, reviewed change

1. Retain each original source, version, identifier, normalized-byte algorithm and digest. An unrecovered source stays unresolved; a newly downloaded version must not replace its hash.
2. Distinguish law, voluntary framework, organisational governance, software and metadata. Store jurisdiction, entity role, activity, effective period and applicability decision in the future scoped profile.
3. Map individual requirements to a Council article, implementation owner, observable test, retained result and dissent. Similar wording is not equivalence.
4. Watch upstream changes and create proposals with old/new digests. A fetch error or empty body is not a changed law. Human reviewers decide applicability and adoption.
5. Publish a new charter version through the existing amendment/release process. Preserve prior versions and receipts. Never rewrite live authority from a model-generated summary.
6. MEOK may explain or route the proposal. A real authenticated person decides within authority limits. Layer 0 and the executor validate the final arguments, destination, expiry and revocation at dispatch. GSPC measures the declared test, separately from authority.

The new draft tool binds the exact register and charter revision and rejects stale revisions. It does not submit or approve anything. This is a useful control, not a complete amendment system.

## Components and decisions

| Component | Reuse | Decision / missing work |
| --- | --- | --- |
| Existing Council OS / Public Watchdog | Group directory, case entry, evidence links, corrections | Preferred canonical home. Reconcile current merged source and qualify authenticated case decisions. |
| IETF process / Datatracker | Stable draft revisions, milestones, chair decisions, issue history | Borrow the workflow. Full Datatracker deployment adds IETF-specific operations; defer unless required. |
| Existing GitHub Discussions | Public discussion, maintained revision links and email alternative | First-release forum. Public discussion is separate from private reports and formal decisions. |
| Discourse | Forum, categories, moderation, subscriptions | Optional later service if community need justifies it. Requires sign-in mapping, privacy boundaries, moderators, PostgreSQL/Redis, backup and upgrade ownership. Not installed here. |
| Decidim | Public consultation and participatory processes | Consider for a sustained citizen assembly. More operational weight than the immediate need. Not installed here. |
| OSCAL | Catalog, profile, implementation and assessment separation | Best control-data model to map toward. This JSON is not an OSCAL-valid export yet. |
| Croissant | Dataset discovery and loading metadata | Generate descriptors for approved public evidence datasets; licence and privacy checks precede HF/Kaggle export. |
| OpenShell | Sandbox, policy and credential enforcement | Preserve existing adapter. Requalify exact release/policy/host with changed arguments, expiry, denial, replay and revocation. |
| OpenBMC / Redfish | Hardware observations and server management | Existing fixture evidence only. Keep separate from Mac UI and human decisions. No hardware writes. |
| LFX | Project onboarding and community tooling | Confirm actual LF project eligibility and access. Membership does not establish full PCC access. |
| Rust | Existing robust runtime components | Reuse Rust implementations where already supplied; a rewrite does not fix missing identity, evidence or operating ownership. Profile before adding another language. |

No component is assumed CC0. Datatracker is BSD-3-Clause, Discourse GPL-2.0-or-later, Decidim AGPL-3.0, and OpenShell Apache-2.0. Croissant distinguishes Apache-2.0 implementation from CC-BY-ND-4.0 specification. Source pages and version-specific terms are linked in sources.json; preserve required attribution and review redistribution conditions.

## Two prototypes, one record

- **Tracker:** task/evidence-first source cards, group/type search, exact frozen provision lookup, local review note and revision-bound JSON download. Recommended default for accountable work.
- **Discussion:** question-first presentation with the same source evidence and review draft. Recommended supplementary entry for less technical contributors. It is not a shared forum: notes are local to this browser, with a clear storage-failure message.

Both use generated identical register data and explicitly label unresolved sources, forming roles and unsubmitted drafts. No personas, votes, messages or memberships are fabricated. The comparison establishes functional feasibility of two views, not population preference or full-platform scalability.

## Participation and operational gaps

| Audience / situation | Required path | Acceptance still needed |
| --- | --- | --- |
| Affected person without a developer account | Plain-language concern, private evidence, status and correction/appeal | Assisted/offline intake, clear consent, protection from retaliation, accessible notifications. |
| Older user, screen-reader or motor-impaired user | Keyboard navigation, visible focus, readable error recovery | Screen-reader sessions, zoom/contrast audit and affected-user testing; no WCAG conformance claim from a browser script. |
| Low bandwidth / intermittent access | Small text-first pages, save/reopen, explicit stale state | Offline queue reconciliation and conflict handling; never silently resubmit an action. |
| Non-English contributor | Language choice and versioned translations | Translation review, critical decision confirmation and moderator language coverage. |
| Researcher / developer | Exact revision, reproducible fixture, counterexample and export | Independent reproduction and clear licensing. |
| Business / regulated organisation | Tenant identity, scope, retention, evidence export, named accountable reviewer | SSO, RBAC/ABAC, confidentiality and jurisdiction review; no universal compliance promise. |
| Reviewer / working-group chair | Competence, conflict disclosure, availability, reasoned decision and dissent | Genuine appointments, quorum/decision rules, separation of review and appeal, expiry/revocation. |
| Agent / plugin client | Same versioned register and bounded tools | Host-specific acceptance; MCP discovery is not permission to execute. |

Shared operations still require a case/document state machine; reviewer identities and terms; conflict checks; moderation and abuse handling; private/public evidence separation; retention/deletion policy; appeals and right of reply; incident ownership; backups and tested restores; public export controls; meeting agendas/minutes and asynchronous review; sustainable staffing and funding. A forum alone does not supply these.

## Distribution contract

One monorepo source should generate website projections, plugin formats, MCP descriptors and evidence exports. Preserve the existing `scripts/harness-x/render.mjs` and distribution registry. Do not hand-edit parallel platform manifests.

HF and Kaggle receive only approved public dataset snapshots, dataset cards, source licences, dates, digests and Croissant descriptors where supported. N-sites receive the same immutable public release plus a current-revision pointer; private case content stays private. Every receiving platform needs its own validation. Generated outputs and receiving-host publication/readback are distinct evidence stages.

The local MCP server supports protocol **2025-06-18** only, over stdio. Tools: `charter_sources`, `charter_provision`, `charter_prepare_change`. It performs no network calls and exposes no write, approval, signing or execution tools. It is not registered in the user's global client configuration.

## Run and verify

From this package on M4:

```sh
python3 build.py --root ../..
python3 -B -m unittest -v test_register test_participation
python3 -B mcp_server.py
```

The dedicated `charter-federation` CI workflow runs the integrity and read-only MCP tests on Python 3.12, rebuilds from the canonical inputs, and requires byte-identical generated files. It has read-only repository permissions and no deployment steps.

Open `tracker.html` or `discussion.html` directly for the local prototype. The generated register records exact input hashes; source captures are marked as scraped Markdown, not publisher-original bytes or independent attestations. Test receipts distinguish this run from earlier suites and from other lanes.

## Release and operation

The ordered plan in `docs/governance/charter-working-groups-completion.md` separates source integration, qualification, protected release, destination readback, genuine human operation and historical source recovery. Public reference tools can ship before all historical texts are recovered because unresolved states stay explicit. Do not announce complete legal coverage, universal platform support or a fully staffed council from this package.

## Integrated completion path

The canonical group registry and document tracker now supply review destinations. Drafts bind both the charter register and tracker input digest, retain the document ID/version, and point to the existing public forum and email participation route. A browser route or downloaded draft does not submit a review. The original group snapshot remains historical fixture evidence and is no longer the default build input.

`scripts/harness-x/render.mjs` generates `/charter-register/`, the HF static kit, the offline Kaggle notebook, and local MCP configuration from the same validated package. Do not hand-edit those projections. Each external destination requires its own publication/readback receipt. The existing GitHub Discussions forum is the first-release choice; Discourse is an optional later replacement if staffing and need justify it.

See `docs/governance/charter-working-groups-completion.md` and `council-os/charter-completion-plan.json` for the ordered delivery plan, dependencies, acceptance criteria and human operating requirements.
