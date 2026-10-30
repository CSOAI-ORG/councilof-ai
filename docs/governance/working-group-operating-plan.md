# Public Watchdog working-group operating plan
Status: implementation candidate, 30 October 2026. Seven groups are forming. No chair, accepted reviewer, adopted standard or regulator endorsement is implied.

## Decision
Use the existing GitHub Discussions forum with a public, Git-backed document tracker and an email participation route first. Keep Council OS as the human-review workspace, GSPC as the measurement source and the existing authority service as the consequential-action boundary.

Two runnable options now exist:
1. **Public tracker + existing forum:** native Watchdog view, public JSON, a lightweight static tracker and structured GitHub discussion/review forms. Git commits supply version history; human-reviewed PRs curate the public record.
2. **Local SQLite discussion lab:** comments survive reload, stale concurrent writes are rejected, moderation hides are journalled, original events remain exportable. It binds to loopback, accepts same-origin requests only and has no authenticated people or decision powers. It is a feasibility exercise, not a production forum.

Recommendation is an engineering judgment based on existing infrastructure, not a measured total-cost comparison. Option 1 adds no new application server. Option 2 proves persistence and moderation mechanics but still needs production identity, operations and abuse controls. Do not expose the lab through a tunnel.

## Components and ownership
Owner labels below describe roles that need to accept responsibility; they are not appointments.

| Component | Present or built | Remaining acceptance condition / owner |
|---|---|---|
| Group registry and charter | Existing seven-group proposal, dated 33-axis mapping; task briefs | Chair and deputy accept scope, deliverables, term and conflicts; secretariat |
| Public discussion | GitHub Discussions already enabled; ideas form uses the verified category slug | Confirm anonymous access from target regions and appoint moderators; community lead |
| Proposal / document tracker | New canonical IDs, pinned sources, status, versions, editor/reviewer fields, history and public views | Human-reviewed adoption and all later transitions; chair + independent reviewer |
| Contribution intake | Downloadable review drafts, existing email route, new issue form | Acknowledgement, triage owner and response expectations; secretariat |
| Document editing and review | Protected repository workflow; proposed review record template | Resolve/docket objections and record actual participants with consent; editor |
| Consensus and dissent | Proposed reasoned decision and dissent template | Named chair adjudicates evidence; a poll does not automatically decide |
| Appeals and corrections | Existing dispute/corrections surfaces linked | Independent reviewer, conflict substitution and auditable correction outcome |
| Meetings and calendar | Agenda/minutes template; asynchronous review as default | Name organiser, publish timezone-aware agenda and accessible minutes; no meetings scheduled |
| Human identity and competence | Existing Council HITL gate and competency modules | Shared operator token + typed name is not verified named-human identity; authority lane |
| Consequential actions | Existing authority, revocation and host-binding lanes | Scope, target, expiry, revocation and executor must match a valid receipt; no forum-derived permission |
| MEOK / H.I.M. | Existing receipt compatibility and HOLD vocabulary | Private service was not tested here; preserve bounded receipt contract, not runtime dependency |
| GSPC and N-Sites | Existing board, grader and adapter contract | Source/version/digest and denominator checks; no proposal or catalogue row becomes a measurement |
| MCP | Real SDK stdio preview: public document reads + unsent review draft | Host-by-host tests, auth/transport decisions and locked live-tool registration before remote release |
| Plugins | Resource kit generated through the canonical distribution renderer; existing tool fleet unchanged | Existing platform owner integrates after review; marketplace installation is not claimed |
| Hugging Face | Generated static Space files with public data only | Select authorised destination, upload, then test the hosted embed; no GPU needed |
| Kaggle | Generated offline notebook and private upload-metadata template | Verify publisher, execute staged notebook and review upload; no dataset licence silently changed |
| Website / other sites | Native view plus portable static projection | Normal protected release; content hash readback; custom-site auth is separate |
| Inclusive participation | Plain language, keyboard controls, mobile layouts, no-JS readable export, email alternative | Human testing with disabled, older, multilingual and low-bandwidth participants; accessibility lead |
| Moderation and reporting | Existing host controls; local prototype of reasoned hides | Code of conduct, incident escalation, moderator coverage and appeal route before inviting scale |
| Privacy and retention | Public/synthetic-only intake and separation from private cases | Agree retention/deletion, publication consent and access roles; privacy owner |
| Notifications / mail | Existing contact mechanism only; no new mail delivery promise | SMTP rotation/delivery checks belong to existing mail lane; configure opt-in notifications |
| Backups / recovery | Versioned public records; lab persistence test | Production restore drill, encrypted backup ownership, retention and RPO/RTO agreement; operations |
| Search / syndication | Search by group, axis and text; JSON snapshots and portable outputs | Indexing policy, feed updates and stale-content indicators; secretariat + platform owner |
| Transparency / funding | Existing independence rules; draft conflict disclosures | Publish funding sources, reviewer compensation policy and recusals; governance owner |

## Operating rules proposed for adoption
The process is inspired by open standards working groups, but Council of AI is independent and does not claim IETF, W3C or regulator affiliation.

- Participation is open to independent researchers, practitioners and affected people. A forum account is not a council seat. Qualification for a review depends on relevant competence and conflicts, not employer prestige.
- Each work item has one editor, an accepting chair, a competent reviewer and an independent reviewer for contested or consequential conclusions. An author cannot provide their own independent approval.
- Before work starts, agree the bounded task, time, attribution, publication consent and any compensation. Do not imply volunteer availability or infer demographic characteristics.
- Suggested lifecycle: draft → adopted → review → last-call → published; withdrawn and superseded remain visible with reasons. The proposed last-call window is 14 calendar days, extended for access needs or major changes. This is a Council proposal, not an IETF requirement or a running service promise.
- A transition must link the exact document version, public evidence, review discussion, material objections, disposition of each objection and a named human review reference. The catalogue validator checks a reference is present; it does not authenticate a human or validate a receipt.
- Record minority views and unresolved uncertainty. More votes, more comments or an AI confidence score cannot substitute for a reasoned decision.
- Publish agendas before meetings and accessible minutes afterwards. Decisions reached in a meeting return to the asynchronous discussion for review. Participation should not require travel or presence in one time zone.
- Separate public work from confidential complaints. A public contributor must not upload credentials, medical details or private case records. Agree a private channel and purpose before collecting sensitive evidence.
- Moderators explain removals where safe, preserve an appropriately restricted audit record, and provide an appeal route. Public transparency does not require retaining personal data forever.
- Regulator engagement is a documented liaison/referral with explicit human authority, jurisdiction, evidence and a response log. A regulator is not listed as a council member without consent.

## Architecture and integration contract
The canonical public sources are `council-os/working-groups.json` and `council-os/working-group-tracker.json`. The existing `scripts/harness-x/render.mjs` produces the public/HF/Kaggle kit. Rendered copies must never become independent decision stores.

A public work record can point to: document ID and version; exact source commit and evidence digest; group and axes; public discussion or issue; human review reference; dissent and correction history. A private review may expose only a redacted reference. Never export operator tokens, private case IDs that reveal a person, or unconsented identities.

Council OS remains the review workspace at `/dashboard?tab=staff`. The merged HITL implementation and its separate authority/SDK lanes own eligibility, challenge state and signed decision receipts. This batch adds no decision endpoint. MEOK/H.I.M. compatibility is a schema and state boundary; private LAN availability must not decide whether public readers can inspect a proposal. Every actual action still requires an authorised executor to validate its scope, target, expiry and revocation state.

The GSPC grader remains `harness/gspc-top100/mill_hub_queue.py:read_label`. The N-Sites contract remains `docs/NSITES-ADAPTER-LANE-BRIEF.md`: a catalogue entry or a queued model is not a measured slot. No adapter here changes scores or board counts.

The local MCP preview exposes only `working_group_documents` and `working_group_review_draft`. Its annotations are hints; absence of write handlers is the actual boundary. The hosted GSPC tool list is unchanged. MCP is a transport contract, not proof that all platforms support every transport or installation method.

## Open-source options investigated
Licences below refer to upstream project declarations checked on 30 October 2026. Dependencies and hosting services have their own terms. No third-party code was copied or relicensed in this batch.

| Option | Licence / basis | Useful role | Practical judgment |
|---|---|---|---|
| Existing GitHub Discussions + Issues + git | Hosted service; not CC0 or self-hostable forum source | Open discussion, review queue and version history | Best first release because already enabled; account barrier and provider dependency need email/public-reading alternatives |
| Discourse | GPL-2.0-or-later | Durable public forum, moderation and email-oriented participation | Strong later forum candidate. Official supported self-hosting is Docker on Linux; database, background jobs, mail, backups and upgrades require an owner |
| IETF Datatracker | BSD-3-Clause | Rich standards-document lifecycle and meeting records | Study its workflow; avoid a full fork initially. It is built around the IETF database and Django deployment, so adaptation is substantial |
| Flarum | MIT | Smaller extensible forum | Feasible forum alternative; assess extension maintenance, moderation and access needs in a real pilot |
| Zulip | Apache-2.0 | Topic-based working discussion | Useful optional team chat; it should not replace the public decision/document record |
| Loomio | AGPL-3.0 | Group deliberation and recorded decisions | Consider when decision facilitation becomes the bottleneck; a poll must still preserve objections and governing authority |
| Decidim | AGPL-3.0 | Broader public participation processes | A later option for larger civic participation, with a substantial operating and configuration commitment |
| SQLite | Public-domain deliverable code | Low-operations persistence in the local feasibility lab | Useful component, not a complete forum, identity service or public-domain status for this whole application |

CC0 is a specific dedication, not a synonym for open source or zero hosting cost. This repository remains MIT. The SQLite component's public-domain status does not relicense Council code, forum posts, evidence, personal data or upstream documents. An owner can separately choose a licence for original public templates after verifying rights; nothing here silently makes submitted work CC0.

## Inclusion and end-user acceptance
Automated checks cover the actual tracker, portable export and local lab. They include keyboard focus/order, labelled controls, 320/390px layouts, literal rendering of markup, empty results, draft download/recovery, same-origin lab writes and WCAG-tagged axe checks.

These checks do not establish usability for every demographic. Before wider recruitment, run compensated or explicitly agreed sessions with at least: a screen-reader user, a keyboard-only user, a low-bandwidth/mobile participant, someone reading in a second language, an older participant, an independent researcher and an affected-user representative. One participant may cover several access needs; do not treat this list as statistical representativeness. Ask about access needs voluntarily; do not infer protected traits.

Suggested tasks: find the relevant group; explain whether a draft is adopted; inspect the pinned evidence; prepare a review without GitHub; find the correction route; recover from an empty search; explain why an AI draft is not permission to act. Capture task completion, barriers and requested changes with consent. Publish only anonymised findings that participants agree can be shared. Translation, captions, audio alternatives and safeguarding require actual owners and tests.

## Execute today
Times are a proposed sequence, not a promise of external response.

| When | Concrete action | Done when |
|---|---|---|
| First 30 minutes | Coordinator reads this plan and selects option 1 for the pilot; identifies chair, deputy/secretary, moderator and independent reviewer candidates | People explicitly accept bounded roles and disclose conflicts; otherwise the group stays forming |
| Next 30 minutes | Existing release owner reviews the PR, source pins and focused receipts, reconciles the overlapping Watchdog lane | Required gates pass on the exact merge candidate; release happens only through protected master/GHA |
| Next hour | Open one bounded revocation review through the verified Ideas category, with a consenting editor; use the prepared invitation material | Public topic has a real URL, owner and exact source version; no automatic outreach was sent by this batch |
| Same day | Independent reviewer replays four synthetic controls; affected-user/accessibility reviewer tries the contribution path | Raw results and limitations are linked; failures and unknown effects remain visible |
| Same day | Run the local lab with synthetic data to compare moderation, writing and recovery needs against GitHub | Record actual friction and operating ownership; do not publicly deploy the lab |
| After first review | Chair records objections, proposed disposition and next step; independent reviewer challenges the conclusion | Human review reference and dissent are recorded; no production halt-latency SLA inferred from local controls |
| After release | Stage HF static export and private Kaggle notebook using verified publisher destinations | Hosted readback matches the catalogue digest; platforms tested individually |
| Within pilot | Choose whether a dedicated forum is justified | Evidence of account/access friction, mail needs, moderator coverage, hosting owner and restore drill; then evaluate Discourse against Flarum |

Do not create seven new forum servers or seven decision stores. Start one shared forum with group tags and a common tracker. Add categories when activity warrants them. The seven organising groups cover the dated 33-axis inventory; they do not assert 33 staffed panels.

## Reproduce
From the repository checkout:
```sh
node scripts/harness-x/render.mjs --check
node --test scripts/working-groups/core.node-test.mjs
python3 tools/working-group-lab/test_lab.py
node scripts/working-groups/acceptance.mjs --output /absolute/private/path/acceptance.json
python3 tools/working-group-lab/server.py --db /absolute/private/path/synthetic-lab.sqlite
```
The lab prints an OS-assigned loopback URL. Stop it with Ctrl-C. Use a dedicated synthetic database, never production storage. The browser runner starts and closes its own servers and records source hashes.

## Primary sources
- Working-group charters, public discussion and meeting records: https://www.rfc-editor.org/rfc/rfc2418.html
- Reasoned consensus and minority objections: https://www.rfc-editor.org/info/rfc7282/
- Datatracker source and licence: https://github.com/ietf-tools/datatracker
- Discourse source/licence: https://github.com/discourse/discourse ; supported install: https://github.com/discourse/discourse/blob/main/docs/INSTALL.md
- Discourse accessibility statement (vendor claim, not an independent result here): https://www.discourse.org/accessibility
- Flarum: https://github.com/flarum/framework
- Zulip licence: https://github.com/zulip/zulip/blob/main/LICENSE
- Loomio: https://github.com/loomio/loomio
- Decidim: https://github.com/decidim/decidim
- SQLite dedication: https://www.sqlite.org/copyright.html
- GitHub category forms and slug rule: https://docs.github.com/en/discussions/managing-discussions-for-your-community/creating-discussion-category-forms
- HF static Spaces: https://huggingface.co/docs/hub/main/spaces-sdks-static
- Kaggle notebook metadata: https://github.com/Kaggle/kaggle-cli/blob/main/docs/kernels_metadata.md
- MCP tools and annotations: https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/docs/specification/2025-06-18/server/tools.mdx
- WCAG 2.2 and scope: https://www.w3.org/TR/wcag/ ; accessible authentication: https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/

Sources are workflow and component references. No standards-body affiliation, legal compliance finding or platform publication is asserted.

## Cross-lane reconciliation on 30 October
Master advanced to `fd7ef854d` while this batch was running. Its #3636 HF/Kaggle presentation lane owns the existing front-page sources and metadata-only publisher (`scripts/hf/FRONTDOOR-MAINTENANCE.md`). This working-group kit is a separate generated resource candidate; do not overwrite those front pages, datasets, licences, privacy settings or the GSPC MCP Space. Link the public tracker through that owner's established source workflow after release.

A full offline distribution audit found a pre-existing invalid Python class name for hyphenated axis tools. The canonical Dify generator now normalises class identifiers while preserving wire tool names; all generated modules are compiled by a regression check. The audit also found an existing stale OASF measurement-agent signature. The OASF record bytes equal the pre-batch HEAD (SHA-256 `2f1c08d231aed238d28bbe31d03804aa21aa519a7ffbcf934a5466dc0d1e233b`). This batch does not issue a replacement signature; the existing signing owner must reconcile that evidence.

## Activate a real review cycle

Use the [working-group activation runbook](working-group-activation-runbook.md) to move from published software to consenting participants, independent evidence, a reasoned human decision and an appeal route. The remote MCP resource and blank review prompt support preparation; they do not submit reviews or appoint people. Retain a separate release receipt and actual host/participant acceptance evidence.
