# CSOAI master continuity handover — 14 September 2026

This is the restart document for Codex, Claude, Grok, Hermes M2/M4, and all TUI lanes. Read it before doing anything. Do not generate a competing plan or ledger.

## Mission

Operate one evidence factory:

`discover/commission → typed queue → appropriate worker → measurement → signed card → verified intake → reviewed merge → public root/witness → Council OS → Hugging Face/Kaggle/API/MCP/A2A/x402 mirrors → attribution/corrections`

Success means the complete loop is independently observable from public artifacts. Counts, listings, 402 challenges, and open pull requests are not substitutes for measured, signed, delivered results.

## Canonical authority

1. Main repository: `https://github.com/CSOAI-ORG/councilof-ai`
2. Integration issue: `https://github.com/CSOAI-ORG/councilof-ai/issues/2391`
3. Canonical outward ledger: `docs/operations/outward-placement-ledger-2026-09-14.md`
4. Public worker truth: `https://councilof.ai/api/worker`
5. Public root: `https://councilof.ai/root.json`
6. Signed index: `https://councilof.ai/signed/card_index.json`
7. Agent card: `https://councilof.ai/.well-known/agent-card.json`
8. x402 manifest: `https://councilof.ai/.well-known/x402.json`
9. MCP: `https://councilof.ai/mcp`
10. Offline verifier: `https://councilof.ai/gspc-verify`

GitHub-reviewed main is authority. RunPod is compute, Oracle is a light worker/watchdog, Cloudflare is public delivery, and Hugging Face/Kaggle are mirrors. Never let a compute host or mirror overwrite reviewed public truth.

## Verified state at handover

- Production deploy `34843030147` completed its gated build and deployment successfully for PR #2394, including root/witness integrity and desktop/mobile shell smoke. Its post-merge prover `34843029335` also passed.
- Public root reports 299 leaves as of `2026-09-14T09:45:35Z`.
- Public card matrix reports 335 signed cells, 64 models, 16 populated axes.
- RunPod worker is LIVE/WAITING with 182 successful runs and 0 failed runs.
- Public `/api/worker` serves the new dispatcher field, but `commission_dispatch` is `null`: the website revision is current and the pod process is still the older runtime.
- The typed commission dispatcher and sanitized public observability are merged in PRs #2388 and #2393. PR #2409 also removes already-retrievable subjects from the active commission queue; its deployment is pending.
- Canonical no-duplicate outward ledger and waves are merged in #2395, #2396, #2400 and #2402.
- AI Agents Listing is submitted and awaiting editorial review. The detail URL resolves, but visual inspection shows a private-preview banner saying the entry is not yet published. The CSOAI logo and canonical endpoints are present in the preview; promotional updates were disabled. Do not submit a duplicate or call it live until the banner clears.
- Discussions are live: #2397 verification, #2398 integration, #2399 discrepancy reporting.
- Numerous external editorial PRs are open. Their exact states live in the canonical outward ledger. Never resubmit while open.

## P0 unfinished work

### 1. Refresh the RunPod runtime

Goal: deploy reviewed main to the active worker and restart it so `/commission-dispatch` exists on the pod.

Proof required:

- `https://councilof.ai/api/worker` returns a non-null `commission_dispatch` object.
- It exposes only sanitized queue schema, source revision, last run, admitted/refused/created/already-present counts.
- One fresh dispatch completes and the result is recorded on issue #2391.

Do not invent credentials. Current M2 environment has no working RunPod shell/control path; the historical SSH endpoint timed out.

### 2. Verify the post-merge publication from PR #2394

PR: `https://github.com/CSOAI-ORG/councilof-ai/pull/2394`

PR #2394 merged on 14 September as `fc8758228ce10d9342e56718cb773446fcddc551` after all seven required pre-merge checks passed. Its card-root and hub-queue workflows passed. Deployment `34843030147` and post-merge prover `34843029335` passed.

The public artifacts retain distinct scopes: `root.json` reports 299 measured-root leaves as of `2026-09-14T09:45:35Z`, while `signed/card_index.json` contains 335 signed cards. Preserve both numbers and labels. Do not add 276 to either count or imply every signed card is a rooted measured leaf.

### 3. Maintain the canonical outward ledger

PR #2401 is merged. Preserve every concurrent row in the canonical outward ledger and record only verified state transitions. AI Agents Listing remains REVIEW PENDING; do not submit it again.

### 4. Complete commission → mill proof

The queue includes `clan-csoai-plain:latest` and `llama3.2:3b`. The first is not installed; the second already has published evidence. Reconcile both honestly. A paid SKU is not automatically an Ollama model ID. The commissioned leaf must carry a runnable model/bank or end in an explicit UNFULFILLABLE state.

Proof required: one genuinely new commissioned subject enters the queue, is admitted by the correct worker, produces a signed card, passes intake, merges, enters the next root, updates public board/mirrors, and is retrievable by the requester.

### 5. Make mirrors deterministic

Hugging Face publication is automated and green. Kaggle ingestion into the same typed intake remains a gap. Implement one connector envelope with source, subject, measurement kind, artifact hash, timestamp, license/provenance, lifecycle state, and error state. Mirrors must consume the reviewed public stream; they must not become competing databases.

## Host allocation

### Hermes M2 — authority, reconciliation, adoption

- Own the canonical outward ledger, UK/AISI/standards readiness, upstream review responses, and public-truth reconciliation.
- Monitor open external PRs and turn merges into exact LIVE rows.
- Never hold signing keys, alter measurements, improvise ceremonies, or send drafts without explicit authorization.
- Immediate goal: reconcile all open external PRs, record verified state changes, and prepare only evidence-backed adoption submissions.

### Hermes M4 — compute and factory integration

- Own RunPod runtime refresh, commission dispatcher, worker playlists, intake, producer determinism, and #2394.
- Rotate applicable axes across locally runnable models; fail closed on unavailable providers.
- Immediate goal: make `commission_dispatch` non-null and prove one genuinely new commission end to end.

### Oracle

- Run lightweight polling, CPU-compatible probes, uptime/watchdog, queue health and mirror verification.
- Never sign authority artifacts or replace RunPod/GitHub truth.

### Hugging Face and Kaggle

- Publish deterministic mirrors and dataset metadata from reviewed artifacts.
- Record downloads separately from measurements and customers.
- No parallel hand-edited datasets.

## Claude goal mode

Convert verified evidence into public understanding and qualified demand.

1. Read the canonical ledger and public artifacts.
2. Audit stranger journeys: homepage → board → finding → verifier → quickstart → commission.
3. Fix only real defects through reviewed PRs.
4. Maintain concise evidence-led launch material; never claim Series A, certification, partnerships, virality, or customer revenue without proof.
5. Prepare targeted regulator/media/design-partner drafts, deduped by organization and evidence object.
6. Do not send or publish through third-party accounts without the required final confirmation.
7. Report outcomes as LIVE, MERGED, SUBMITTED/REVIEW PENDING, BLOCKED, or UNCHECKABLE.

Done when at least one new stranger can find, understand, verify, request, and retrieve a result without Nick explaining the system.

## Grok goal mode

Own time-sensitive external intelligence and contradiction detection.

1. Verify current laws, deadlines, standards, market claims and competitor releases from primary sources.
2. Match each real event to an existing CSOAI measurement kind and public artifact.
3. Flag false/stale claims before publication.
4. Produce a ranked feed of net-new subjects for the queue, each with source URL, timestamp, jurisdiction, measurement axis, and why it matters.
5. Find open registries and public-good datasets only after dedupe against the canonical ledger.
6. No speculative market calls, investment advice, fake urgency, or unsupported first/only claims.

Done when verified external events automatically become typed candidate measurements and evidence-led distribution opportunities.

## Nine TUI lanes

### TUI-1 — integrity and release governor
Reconcile roots, OTS/Rekor witness states, corrections and release gates. Block stale or contradictory claims. Never call OTS calendar stamping Bitcoin anchoring.

### TUI-2 — Council OS and mobile UX
Make the dashboard usable on mobile and desktop. One master grid, axis drill-down, model search/compare, provenance, empty states and live worker/queue status. No duplicate dashboards.

### TUI-3 — measurement coverage
Run the typed queue across applicable 22-axis instruments, benchmarkers, MCP/A2A/x402 systems and model subjects. Separate indexed, probed, measured, signed and rooted counts.

### TUI-4 — roots, identity and protocol trust
Maintain DID/JWS/Ed25519 verification, in-toto/SCITT/C2PA mappings, OTS/Rekor evidence and honest anchor lifecycle. Ceremonies remain documented owner/two-person events.

### TUI-5 — x402 and commercial delivery
Keep manifests, 402 challenges, settlement verification, requester delivery, per-door attribution and self-pay exclusion aligned. A challenge is not revenue; one wallet across doors is one payer.

### TUI-6 — standards, regulators and qualified outreach
Maintain primary-source crosswalks and submission packs. Dedupe by organization. Send only reviewed, timely evidence with one relevant artifact.

### TUI-7 — models, Hugging Face and Kaggle
Keep model/provider catalogues current, measure runnable models, verify provider routing/billing, and publish deterministic mirrors. Never equate model discovery with evaluation coverage.

### TUI-8 — distribution and indexing
Own sitemap, RSS, llms.txt, IndexNow, structured data, citation/DOI, directories and upstream editorial PRs. Use the canonical ledger; never create parallel trackers or duplicate submissions.

### TUI-9 — operating governor
Maintain the single execution ledger, dependency graph, owner asks, host status and proof thresholds. Close stale PRs, merge only green/reviewed work, and ensure every lane hands back exact evidence.

## Outward rules

- Reconcile first. Never repeat MCP.so, PulseMCP, Glama, Smithery, official MCP Registry, A2A Registry, x402scan, PayAPI, Hugging Face, Kaggle, IndexNow, existing GitHub releases/pins, or any open editorial PR.
- A submission confirmation is REVIEW PENDING. Only an upstream merge or stable public detail page is LIVE.
- Prefer maintained, relevant, editorial or structured registries. Skip paid listings, abandoned sites, arbitrary backlink farms, and policies the project does not satisfy.
- Never manufacture stars, visits, settlements, customers, citations or testimonials.
- Do not promote the AI Agents Listing detail URL while it carries the private-preview banner. When editorial review publishes it, link to the public detail page using the measured-not-certified description already recorded in the ledger.

## Immediate 24-hour sequence

1. Let PR #2409's deployment complete and verify that retrievable subjects no longer appear in the active queue.
2. Refresh RunPod from reviewed main and prove non-null dispatcher telemetry.
3. Prove one genuinely new commission through queue → mill → sign → merge → root → delivery.
4. Monitor AI Agents Listing until the private-preview banner clears; then record LIVE. Do not duplicate the listing.
5. Monitor every open external PR; respond only to maintainer feedback and record merges.
6. Implement the Kaggle/common connector envelope.
7. Re-run public stranger journeys and mobile checks after deployment.
8. Publish one evidence-led update only when a new verified event exists: signed-card merge, root confirmation, independent citation, external registry merge, or outside paid delivery.

## Reporting template

Every lane reports:

```text
STATE: LIVE | MERGED | SUBMITTED/REVIEW PENDING | BLOCKED | UNCHECKABLE
OBJECT:
PROOF URL / COMMIT:
WHAT CHANGED:
VALIDATION:
WHAT IT DOES NOT PROVE:
NEXT ATOMIC ACTION:
```

Anything without proof is a candidate, not progress.
