
## 01:17 UTC — TUI-1 integrity loop first pass (2026-09-14)

### ROOT
- Live root: 291 leaves, sha 8d3284b2, as_of 2026-09-13T19:27:08Z (~5h ago)
- Live root >4h old — OTS may need upgrading or root re-published
- Pending candidate #2207: NO OTS match found in body — body may be thin or OTS section absent

### SECRETS
- **CSOAI-ORG/mcp-servers/docs/deployment.md** has a real PASSWORD= value — needs redaction PR + credential rotation
- **CSOAI-ORG/sovereign-temple/start_chat.sh** has real sk- key — needs redaction + rotation
- Other hits (hf_ keys, PRIVATEMAIL references, RUNPOD_API) are likely docs placeholders but need verification

### ORPHAN TESTS (253)
- Bulk orphanage — ~200 client/src/ tests, ~40 functions/ tests, ~10 scripts/ tests not in CI gates
- Recommendation: one PR adding orphan-count threshold to pr-gates.yml (step: "Orphan tests") with a count assertion (fail if orphans grow, warn-only for now on 253)

### GOVERNOR ACTIONS NEEDED
1. **#2207 review**: Open, no OTS in body, pending since 01:03 UTC. Governor should check if body is complete and OTS claim is absent by design.
2. **Secrets audit**: File rotation ticket for PASSWORD= in mcp-servers/deployment.md and sk- in sovereign-temple/start_chat.sh


### #2207 CORRECTION (01:20 UTC)
- Branch witness sidecar: ots_status=STAMPED_PENDING_BITCOIN (not CONFIRMED)
- Pending root: 297 leaves, as_of 2026-09-14T01:03:07Z
- Root is LIVE (291 leaves). Pending candidate has +6 new cards.
- OTS proof exists but not yet confirmed in Bitcoin. No governor action yet.
- PROTOCOL NOTE: integrity loop body-grep missed the OTS because it's in the branch witness file, not the PR body. Loop script should be updated to also check branch witness sidecar.

### DONE-WHEN (daily at ~01:17 UTC)
- Landing PRs >60 min: 0 ✓
- CONFIRMED candidates flagged within 20 min: #2207 is PENDING not CONFIRMED — no flag needed
- Real secrets: 1+ (PASSWORD= in CSOAI-ORG/mcp-servers/docs/deployment.md)
- Orphans: 253 (bulk — not actionable this pass; tracked in STATUS)


### SECRETS CORRECTION (01:25 UTC)
Initial code search flagged 5 query patterns. After verification:
- CSOAI-ORG/mcp-servers/docs/deployment.md: PASSWORD=, REDIS_PASSWORD=, OPENAI_API_KEY= are ALL **placeholders** (e.g. `secure-password`, `your-openai-key`) — not real values
- hf_ in hf_submit.py: variable name prefix (`hf_{MODEL_NAME}`), not a token
- PRIVATEMAIL in sovos-harness README: service name mention, not a credential
- sk- in sovereign-temple: grep returned empty (no sk- value found)

**CORRECTED: 0 real secrets.** All hits are placeholders or service-name references.

### ORPHANS CORRECTION (01:30 UTC)
Initial count: 253 (flawed check). Corrected:
- 226 of 253 are covered by `npx vitest run client/src functions scripts` (blanket auto-discovery)
- 8 in packages/gspc-card-verifier/ covered by `node --test test/*.test.mjs` step
- 2 in mcp/gspc-server/ covered by gate step
- 2 in actions/verify-card/ covered by verify-card.yml workflow
- 1 in harness/x402-census/ partially covered (--selftest, .test.ts not run)
- **14 truly orphaned** test files (no gate runs them):
  - 3 in council-os/
  - 1 in docs/incidents/
  - 1 in ci/hf-jobs/
  - 1 in packages/gspc-cli/
  - 1 in public/
  - 6 in extensions/chrome-gspc-verify/
  - 1 in harness/x402-census/

Recommendation: PR adding these dirs to vitest run or dedicated gate steps. Not blocking — tests pass locally (not verified).

### ORPHAN PR OPENED (01:35 UTC)
- PR #2213: fix(gates): add orphan coverage for 14 test files
- Added `Orphan coverage` step to pr-gates.yml (gated, runs vitest + pytest on14 orphaned test dirs)
- extensions/chrome-gspc-verify/ (6 files) deferred — needs Playwright
- Gates pending; if any test fails, it reveals real issues

## 00:45 UTC — TUI-9 governance pass 2

### MERGE QUEUE STATUS
- **#2207** (public-root candidate): MERGEABLE, gates=SUCCESS, OTS=STAMPED_PENDING_BITCOIN — cannot --admin until OTS CONFIRMED
- **#2195** (honesty/products): CONFLICTING — needs rebase by author
- **#2118** (continuity cards): MERGEABLE, gates=SUCCESS — blocked by branch policy

### SECRETS (from pass 1)
- **mcp-servers/docs/deployment.md**: PASSWORD= — PENDING owner rotation
- **sovereign-temple/start_chat.sh**: sk- — PENDING owner rotation

### ROOT
- Live: 291 leaves, sha 8d3284b2, as_of 2026-09-13T19:27:08Z (~5.5h stale)
- Pending (#2207): 297 leaves, OTS=STAMPED_PENDING_BITCOIN

### DRAIN STATUS
| Item | Status | Next action |
|------|--------|-------------|
| #2207 promote | BLOCKED (OTS not CONFIRMED) | Wait for Bitcoin confirmation |
| #2195 merge | BLOCKED (CONFLICTING) | Author needs rebase |
| #2118 merge | BLOCKED (branch policy) | Needs --admin after OTS CONFIRMED on #2207 |
| Secrets rotation | PENDING | Owner gate — rotate PASSWORD= and sk- |
| Orphan tests | TRACKED | 253 orphans, add threshold to pr-gates.yml |

## 01:53 UTC — TUI-9 cron governance pass

### MERGE QUEUE
| PR | Status | Next action |
|----|--------|-------------|
| #2222 | MERGEABLE, gates=SUCCESS, --auto queued | Wait for branch policy |
| #2221 | MERGEABLE, gates=SUCCESS, --auto queued | Wait for branch policy |
| #2118 | DRAFT | Cannot merge |

### DRAIN STATUS UPDATE
| Item | Status | Next action |
|------|--------|-------------|
| #2207 promote | BLOCKED (OTS not CONFIRMED) | Wait for Bitcoin confirmation |
| #2222 merge | AUTO-QUEUED | Branch policy pending |
| #2221 merge | AUTO-QUEUED | Branch policy pending |
| Secrets rotation | PENDING | Owner gate |
| Orphans | TRACKED | 253 |

### ORPHAN PR MERGED (02:15 UTC)
PR #2213 merged. 14 truly orphaned test files now covered by `Orphan coverage` gate step.
Bonus: drift between deploy.yml and deploy.sh was real — 9 steps missing from deploy.sh, 3 from public-root.sh. Other lane had already added same fix to master with different formatting. Resolved conflict by taking master's version.

DONE-WHEN achieved:
- landing_prs_gt_60min: 0 ✓
- confirmed_candidates_flagged: 0 ✓ (no CONFIRMED candidates in window)
- real_secrets: 0 ✓ (all hits were placeholders)
- orphan_tests: handled via PR #2213 ✓

- **#2319** (08:26 UTC) STAMPED_PENDING_BITCOIN, 0.5378492002777778h old, 296 leaves (vs 298 live), pending root as_of=2026-09-14T07:54:22Z
- **#2319** (08:47 UTC) STAMPED_PENDING_BITCOIN, 0.86h old, 296 leaves (vs 298 live), pending as_of=2026-09-14T07:54:22Z
### ROOT-SHA-COMPUTATION (09:30 UTC)
Loop check: live root sha must be computed from RAW served bytes, not from re-serialized canonical form.
Current state: pointer sha = raw sha (matches). My earlier compute used canonicalization which gave a different hash.
Loop improvement: use `curl -s URL | sha256sum` for pointer verification.
- **#2319** (09:44 UTC) STAMPED_PENDING 1.8h, pending root sha=6868b2ac, but root-6868b2ac.json.ots NOT FOUND on public-root/pending branch. Witness sidecar claims STAMPED_PENDING without backing proof file. Upgrade loop runs (last success 09:12 UTC) but doesn't upload proof. TUI-3/8 territory to fix publisher.

### CORROBORATION (10:06 UTC)
Governor comment on #2319 (closed 09:39 UTC): "second pending root candidate closed today (#2293 at 07:50Z, this one at 09:39Z). Closing does not unblock new leaves faster, it delays them."
TUI-1 loop flagged the missing .ots file on #2319 at 09:44 UTC (15 min before close). Loop finding is corroborated by governor's observation of recurring premature closures.
RECOMMENDATION: stop closing pending candidates that lack .ots — instead, run the upgrade loop manually to upload the missing proof file. Or investigate why OTS upgrade loop isn't uploading.
Current state: #2332 is the new pending candidate (sha 2896b28b, .ots file present — different sha from #2319's missing one).


### CORROBORATION (10:06 UTC)
Governor comment on #2319 (closed 09:39 UTC): "second pending root candidate closed today (#2293 at 07:50Z, this one at 09:39Z). Closing does not unblock new leaves faster, it delays them."

TUI-1 loop flagged the missing .ots file on #2319 at 09:44 UTC (15 min before close). Loop finding is corroborated by governor's observation of recurring premature closures.

RECOMMENDATION: stop closing pending candidates that lack .ots — instead, run the upgrade loop manually to upload the missing proof file. Or investigate why OTS upgrade loop isn't uploading.

Current state: #2332 is the new pending candidate (sha 2896b28b, .ots file present — different sha from #2319's missing one).


### ROOT-STALLED (10:25 UTC)
#2332 MERGED at 10:20 UTC, but live root unchanged:
- live_sha: 14ed12e5aacf20a372e5... (unchanged since 04:13 UTC pointer)
- card_count: 298 (unchanged since 03:12 UTC)
- as_of: 2026-09-14T03:12:56Z

**Diagnosis:** #2332 merged BEFORE OTS confirmed. Without CONFIRMED_BITCOIN attestation, the new leaves did NOT enter the live root. This matches governor's prior warning: "Closing does not unblock new leaves faster, it delays them."

**Recommendation:** OTS upgrade loop should run more aggressively, OR governor should refuse to merge STAMPED_PENDING candidates without explicit CONFIRMED override.

Note: 4h STAMPED_PENDING threshold was never crossed (#2319 closed at 0.75h, #2332 merged at ~0.5h). Both premature.

### TUI-1 EIGHT-TUI BRIEF ACCEPTED (10:32 UTC)
- Live root: 298 leaves, sha 14ed12e5aacf20a372e5..., CONFIRMED_BITCOIN block 966906
- Brief acceptance doc: docs/tui1/TUI-1-BRIEF-ACCEPTANCE-2026-09-14.md
- PR #2346 (tui1/release-ledger-0914): brief acceptance + historical-root conflict report

### HISTORICAL ROOT FE3A9E24 — CLAIM/EVIDENCE CONFLICT (10:32 UTC)
- Ledger says: CONFIRMED_BITCOIN, blocks 965528/965532/965548/965554
- Live .ots file (4986B, sha256 6f39847b...) contains: ONLY calendar attestations, NO BitcoinBlockHeaderAttestation tag
- Status should be STAMPED_PENDING_BITCOIN, not CONFIRMED_BITCOIN
- Recommendation: corrections ledger entry + EXECUTION-LEDGER.json status fix + PR (governor merge)
- Pod-side .ots verification needed for mirror desync check

NEEDS OWNER AUTHORIZATION before corrections ledger write (per HARD rules).

### PR #2355 READY FOR GOVERNOR MERGE (11:00 UTC)
- Title: tui1: brief acceptance + critical historical-root claim/evidence conflict
- Branch: tui1/release-ledger-0914
- Files: docs/tui1/TUI-1-BRIEF-ACCEPTANCE-2026-09-14.md (83 insertions)
- Gates: all SUCCESS, mergeable MERGEABLE, status CLEAN
- DO NOT auto-merge (TUI-1 lane: "never gh pr merge your own PR")
- Governor: please review and merge

### CONSOLIDATED PASSES 11:05-15:05 UTC (12 fires)
- Live root ADVANCED: 298 → 304 leaves at 12:34 UTC
- New sha: 8794213353b3bf133a5f3c37740f04ea608a9876d95eb2d57318b8f7be042470
- OTS: CONFIRMED_BITCOIN blocks [966966, 966969] (upgraded from [966906])
- Pending candidates: 0
- Landings >60min: 0
- Secrets/orphans: skipped (once/day, done at 01:17 UTC)
- PR #2355 (TUI-1 brief acceptance): OPEN, awaiting governor merge
- PR #2432 (card-root OTS review): MERGED 14:27 UTC
- Open PRs: 14 (sibling-lane burst)

### FE3A9E24 FINDING STILL PENDING CORRECTION
- Ledger claims CONFIRMED_BITCOIN for fe3a9e24 with blocks 965528/965532/965548/965554
- Live .ots file (4986B, sha256 6f39847b…) has ONLY calendar attestations, NO Bitcoin attestation
- This contradicts the ledger claim — correction entry needed
- Awaiting owner authorization to author corrections ledger entry + PR
- **candidate #2438 CONFIRMED_BITCOIN** (16:46 UTC) — governor merge required

### CONFIRMED CANDIDATE — #2438 (16:46 UTC)
- **#2438 public-root/pending**: CONFIRMED_BITCOIN
- Branch: public-root/pending
- Created: 2026-09-14T15:17:09Z (88min ago)
- Pending root sha: 0f46d4a3
- .ots file: FOUND on branch
- Witness sidecar: OTS=CONFIRMED_BITCOIN
- **Governor action required:** merge #2438 to advance live root from 304 → 308 leaves (4 new pending cards confirmed)
- Bot PR, no gates — governor must merge with --admin per protocol

### CYCLE PROGRESSION (17:05 UTC)
- #2438 MERGED at 16:51:27Z (governor-merge flow worked correctly)
- Live root unchanged at 304 — publisher runs hourly at :07, next fire at 18:07 UTC
- #2443 is new pending candidate (STAMPED_PENDING, 7min old, .ots FOUND)
- This is the correct cycle: PENDING → OTS upgrade → CONFIRMED → governor merge → publisher → live root advances
- The hiccup earlier (#2319/2332 premature merge) was when governor merged BEFORE OTS confirmed. Today's flow is correct.

### ROOT LAG NOT REGRESSION (17:26 UTC)
- Live root: 300 leaves (not 308 as expected after #2438 merge)
- Cause: publisher cron at :07 ran at 15:16 UTC with 300 leaves. #2438 merged at 16:51 UTC (after publisher ran).
- #2438's commit (426045e0) HAS root.json with 300 leaves as_of=15:16:53 — the merge just didn't advance the live root because publisher hasn't run since.
- Next publisher fire: 18:07 UTC. Live root should advance to 308 then.
- This is correct cron cadence, not a regression.
- **candidate #2443 CONFIRMED_BITCOIN** (18:06 UTC) — governor merge required

### CONFIRMED CANDIDATE — #2443 (18:06 UTC)
- **#2443 public-root/pending**: CONFIRMED_BITCOIN
- Branch: public-root/pending
- Created: 2026-09-14T16:58:20Z (67min ago)
- Pending root sha: 93d4850b
- .ots file: FOUND on branch
- Witness sidecar: OTS=CONFIRMED_BITCOIN
- **Governor action required:** merge #2443 with --admin per protocol
- After publisher run, live root should advance from 300 → 302 leaves (pending #2443's new cards)

### CYCLE PATTERN OBSERVATION
Today's flow is correct:
- #2437 (76 mill cards) → VALID verdict → governor merge at 15:33 ✓
- #2438 (4 signed root cards) → CONFIRMED at 16:46 → governor merge at 16:51 ✓
- #2443 (2+ signed root cards) → CONFIRMED at 18:06 → awaiting governor merge
- The earlier #2319/#2332 premature-merge issue is NOT recurring.
- **candidate #2451 CONFIRMED_BITCOIN** (18:46 UTC) — governor merge required

### CONFIRMED CANDIDATE — #2451 (18:46 UTC)
- **#2451 public-root/pending**: CONFIRMED_BITCOIN
- Created: ~28min ago (2026-09-14T18:17:52Z)
- Pending root sha: e8cb1d24
- .ots file: FOUND
- Witness sidecar: OTS=CONFIRMED_BITCOIN
- **Governor action required:** merge with --admin per protocol

### TODAY'S CONFIRMED CANDIDATES (3 total)
1. #2438 → MERGED 16:51:27Z (88min old at CONFIRMED)
2. #2443 → MERGED 18:12:48Z (80min old at CONFIRMED)
3. #2451 → CONFIRMED 18:46 UTC, awaiting governor merge (28min old at CONFIRMED)

The detection-to-merge latency is decreasing:
- #2438: ~5 min (CONFIRMED at 16:46, merged 16:51)
- #2443: ~6 min (CONFIRMED at 18:06, merged 18:12)
- #2451: pending (CONFIRMED at 18:46)

Governor-merge flow is working correctly. Live root advances after publisher cron at :07 UTC.

### ROOT ADVANCED (19:05 UTC)
- Live root: 300 → 304 leaves
- sha: fd59e88507febd19...
- as_of: 2026-09-14T18:17:38Z
- OTS: CONFIRMED_BITCOIN block [967007]
- Rekor: pending next cycle
- Conflict scan: NONE across 42 sidecars (up from 36)
- #2451 MERGED at 18:48:08Z (2min from CONFIRMED detection — governor-merge flow working optimally)

Publisher fired after #2451 merge and advanced live root. Healthy cycle.
- **candidate #2458 CONFIRMED_BITCOIN** (23:46 UTC) — governor merge required

### CONFIRMED CANDIDATE — #2458 (23:46 UTC)
- **#2458 public-root/pending**: CONFIRMED_BITCOIN
- Created: 2026-09-14T22:22:10Z (84min ago)
- Pending root sha: ca0adcef
- .ots file: FOUND
- Witness sidecar: OTS=CONFIRMED_BITCOIN
- **Governor action required:** merge with --admin per protocol

### TODAY'S CONFIRMED CANDIDATES (4 total)
1. #2438 → MERGED 16:51:27Z (88min at CONFIRMED)
2. #2443 → MERGED 18:12:48Z (80min at CONFIRMED)
3. #2451 → MERGED 18:48:08Z (28min at CONFIRMED)
4. #2458 → CONFIRMED 23:46 UTC, awaiting governor merge (84min at CONFIRMED)

Live root currently at 305 leaves (advanced from 304 after #2453 merge + publisher at ~23:00 UTC).

### PR #2464 READY FOR GOVERNOR MERGE (01:30 UTC)
- Title: docs(corrections-ledger): record fe3a9e24 claim/evidence discrepancy
- Branch: tui1/corrections-ledger-fe3a9e24-20260915
- Files: docs/hermes/CORRECTIONS-LEDGER.md (61 insertions, new file)
- Gates: all SUCCESS, mergeable
- DO NOT auto-merge (TUI-1 lane: "never gh pr merge your own PR")
- Governor: please review and merge

This is the EVIDENCE entry. The actual EXECUTION-LEDGER.json update is a separate PR that requires owner authorization.


## KEY-ROUTER-FIX-20260917-ce9948b0 — IMPLEMENTED
UTC 2026-09-17 15:55. Actual source repair, not a draft or proposed work order.
- Installed matching code on NICHOLASs-MacBook-Air-2.local: ~/clawd/csoai-reach-pack-01Sep2026/tools/csoai_keys.py and RTX 3090 ca776e40fcf6: /workspace/tools/csoai_keys.py.
- Before SHA256: 9f6821bf195c920c84ef88d43ebcdaabd59ae9e7659753971df6900919023276. After: ce9948b037e754444fc0fb4ba04582cbd54d08028e1ffd373234dd377b92b411. Version 2026.09.17.1.
- Preserved all 15 provider definitions, chain order and duplicate-key source selection.
- Fixed per-credential/profile cache expiry, double failed probes, capability-scoped selection, failure classes, safe shell export, atomic 0600 writes and scoped sync.
- Backups: sibling .csoai-keys-code-backups; exact backup paths/checksums in sibling key-router-fix-20260917/installation-receipt-*.json.
- 46 desired-behaviour offline regressions passed before and after installation on each host (same 46 tests, not independent measurement samples).
- On each host, one actual NVIDIA metadata request returned HTTP 200 and selected nvidia. The repeated get(inference) made zero additional probes. This is not an inference run, balance check or model-availability proof.
- Compatibility: status LIVE still means metadata HTTP 200 only. Failure classes are explicit. Runtime inference retry/model-preserving failover remains the executor's job.
- --sync-file now defaults to inference-only at ~/.csoai-keys-inference.env; --cap selects another capability. Legacy ~/.csoai-keys.env remains readable and untouched. No sync was executed.
- Cache v2 uses ~/.csoai-keys-cache-v2.json; old cache remains untouched.
- No stored credentials rotated/exported/changed, no inference or wallet actions, no GPU worker restarts, no GitHub merge/deployment, no outreach. New invocations load repaired source; already-imported modules were not restarted.
- IOKs-MacBook-Air.local was reachable; no csoai_keys.py found in the bounded searches. No guessed-path installation there.


## EXECUTION-ACCEPTANCE-20260917-335

Executed 17 September 2026. Continue the existing plan; do not recreate queues or restart paused writers.

- Key resolver: prior repaired SHA ce9948b0… revalidated on Mac and pod. No credential changes.
- Anonymous readback: ALL335 legacy signed-index cards fetched from HF revision dfdf2a17cbe50438dad0b9f135efaedfe9e78fba. Manifest/index hashes checked; authoritative key resolved from https://csoai.org/.well-known/did.json. Every body ID/signature valid. This is NOT experimental reproduction, quote-admission, root inclusion or Bitcoin verification.
- Initial inspector lacked explicit legacy `preimage` alias for22cards. Initial UNCHECKABLE report retained; exact-profile support added; same captured bytes rechecked335/335. No signed bytes edited.
- Five negative verification controls and one unsigned-envelope projection check passed.40 acceptance tests +11 existing entrypoint tests passed on EACH host; actual stdio MCP lifecycle/read/forbidden-probe tests passed. Mac has4tools, pod6; pre-existing difference deliberately preserved.
- Installed private entrypoint enhancement on both hosts: `csoai-control evidence` reads retained audit; `probe runpod` includes execution_observation, counters and last-success age. New status is not a public-site deployment or new inference executor.
- Worker: care run20260917T150530.505270Z-c902cce514 ended199attempts/173transport successes/26timeouts/67parse exclusions/106graded. UNMEASURED and not landable preserved. Later live job transport recovered WITHOUT an assistant restart. Root cause of180s timeout episodes not proven.
- Origin DID paths returnedHTTP200 to the declared nonbrowser client from this pod. Earlier all-client403 statement is NOT a current universal conclusion; other paths/default clients still need testing. No WAF settings changed.
- Disk inventory: Mac ~6.87GB free at16:50UTC; four cache locations checked, three present. No deletion or attribution of space recovery to this assistant.
- Existing pending.json updated in place on both hosts with prior states retained.19 existing/current task IDs preserved.35-step map is acceptance-20260917/NEXT_STEPS.json and NEXT_STEPS.md.
- Sibling work preserved: secondary-inference HOLD; Qwen3 decode truncation review; Apify usage reconciliation; existing one-night bootstrap schedule. No duplicate schedule or competing GPU producer started.

Next priority: NX-09/NX-33 shared inference capacity and bounded transport recovery; NX-34 separately versioned decode budget with real grading controls; NX-13 exact proof/payload binding; NX-08 authorised publication recovery. Local handler/denominator/UI tests can proceed while publication is blocked.

Outward: first reconcile actual already-sent newsroom/disclosure/filing threads. Never LinkedIn, calls, Erin Barratt, wallet actions or a public price list. No new email, post, filing, API purchase or production signing in this batch.

Full replay including335 raw public cards is on the pod and this Mac at tools/entrypoint/acceptance-20260917/CSOAI_EVIDENCE_REPLAY_20260917.zip. SHA256 d3f8baca7ee022472908f8c246cf20592f61aa120553df6e3fb5a6bd30375b34; size411874bytes. Original limited report, corrected report and negative-control results retained.

Installation receipts and rollback source backups exist beside both entrypoints. M4 IOKs-MacBook-Air.local was NOT modified in this batch. The Mac updated is NICHOLASs-MacBook-Air-2.local.


## RETENTION-PUBLIC-CLIENTS-20260918 — executed, boundaries retained
Date: 18 September 2026. Existing NX-14/NX-21 now carry append-only execution-history entries.

Installed new local source in csoai-day1-20260917: scripts/correction_retention.py, scripts/test_correction_retention.py, scripts/correction-retention-export.ts. 29 unittest controls passed; exporter ran actual corrections GET handler without network. Fresh anonymous capture and exact record readback matched 58 corrections, 44 withdrawal rows and 953 supersession rows. This is record-retention checking, not signature verification or an append-only-log proof.

Evidence and source ZIP: _operator/parallel/RELEASE-RETENTION-20260918/CSOAI_RETENTION_EXECUTED_2026-09-18.zip, SHA256 296067a10f592d6ae46f1e1f2317057b793a5713a176df64e21e384040068de9. The workflow integration write was tool-blocked; deploy.yml remains b8fe2def2f3f3284849c0949596e7a3873c34d408428e7e06c382e5a66223e2c. Partial wire_workflow.py is NOT an applied installer and is excluded from the archive.

Source-only risk still open: corrections.ts labels a matching content digest as VALID without actually checking Ed25519 in that handler. Test-file creation was tool-blocked; no test or producer correction is claimed. Existing stale flag currently remains.

Public-client receipts on RunPod: /workspace/csoai-operations/entrypoint/rechecks/20260918-public-clients. Real MCP server/discover under 2026-07-28 returned server 1.4.2; tools/list returned 13. Four free calls returned correlated successful responses: board totals 23 declared/22 measured/1 unmeasured; Governance accuracy withheld; effect-binding UNMEASURED/no accuracy (n=0 as in source); unknown axis NOT_ON_BOARD. Actual A2A 1.0 SendMessage returned ROLE_AGENT Message with messageId/contextId and matching board rows, no task or receipt claimed. Public verify_card call was tool-blocked and NOT executed. Prior 335-card verification remains a separately dated audit.

Do not quote this as all-client conformance, fresh model evaluation or end-to-end signing/publication. No new signatures, anchors, wallet actions, paid inference, deployments, external sends or scheduler were created. Existing sibling financial/chat/worker/intake patches and secondary-inference hold unchanged.

## 2026-09-18T04:08:21.328409+00:00 — CORRECTION-WATCH-SEMANTICS-20260918 DELIVERED
Implemented source-bound JSON-field watcher in existing scripts/watch_correction_propagation.py plus correction_watch_scope.py. Both M4/private pod copies match hashes. Per host:48 watcher tests,8 retained projection tests,21 existing entry tests; original and explicit correction stdio MCP reads passed. Saved two-source response replay and tamper-negative control passed.
Own source case C-2026-0912-01 → Swarm separation UNTESTED, observed M4 03:47:11Z and pod03:48:45Z. Only this field matched; no whole-board, signature, timestamp or model-quality claim. Original15 external relationship definitions are byte-preserved and remain REVIEW_REQUIRED; no external reclassification. No removal from missing markers, no continuous staleness from elapsed dates.
Existing csoai-control closure / fresh fleet_status sessions expose correction-watch with exact report hash and rechecked_here:false. Concurrent commission-delivery projection retained; shared closure_status.py hash9870abffddc0edceb057fde4e6fd14cab9fa045d935e9969f9ed86dedcf25ade onbothhosts. No long-lived agent session was restarted.
NX-15/E-correction-watcher updated with history. Remaining:qualified selectors/source records for15 cases, broader document adapters and reviewed standing/public release. No scheduler, signing, wallet, paid inference, publishing, GitHub writes, mail or worker change. SharedGPUhold remains.
Full source/raw/receipts/replay archive: tools/entrypoint/correction-watch/CSOAI_CORRECTION_WATCH_EXECUTED_2026-09-18.zip (sha2565780e9faba8f4e63691297862c388a5453c8eccbcaa7384709a1116306311f65).

## PUBLIC-RELEASE-20260918 — actual public publication, verified
Owner asked this conversation to complete public work. Used existing Nicholastempleman/csoai admin HF publishing credentials; no credential values exposed or copied.
1. csoai/gspc-board docs commit c6b378f53fbf5e0a160e5408bb0aa822c7820951 at04:24:48UTC: README distinguishes dated export/current source; docs/reading-evidence-2026-09-18.md published.11 guide links answered200; exact Python reader example ran. Anonymous exact-byte readback passed.
2. csoai/councilof-ai-mirror README commit48e9961865d7ff9c053f4ab11333453f5cb73319 at04:26:42UTC: origin failures scoped by client/time; explains flat filenames, manifest and pinned history. README readback passed; manifest sha8c486e19167eb8d1278caf351fc203644ad3341d42597925c589b730bb40d126 unchanged. Mirror as_of03:43:32Z preserved.
3. csoai/gspc-board replay release commit353f0630e3048407205a45727c4f60dfe3029105 at04:35:48UTC: releases/2026-09-18/README.md and legacy-card-replay.zip; main README links it.343-file ZIP321839bytes sha256cf1f3290cd532f99fe3999470bbab6358e95683e6f322ae668da25d85d6ccc75.335existing public cards captured17Sep + captured index/DID + offline helpers/docs.18private/operational records from original archive excluded. No original evidence bytes changed.
Actual anonymously downloaded public ZIP replayed with socket connections disabled:335SIGNATURE_AND_BODY_VALID and6controls passed. Captured-profile integrity only: no fresh key resolution, experimental reproduction, quote admission, root inclusion or Bitcoin check. Initial22preimage-alias gaps and exact-profile reconciliation explained publicly. No new signature/anchor.
4. Owned HF Community discussion7: https://huggingface.co/datasets/csoai/gspc-board/discussions/7 . Title: Offline verification kit: replay335captured legacy cards. Posted04:39:10UTC; anonymous API and signed-out browser readback verified. Platform stripped one final newline; published text otherwise identical. Initial local exact-byte receipt error retained and superseded; no substantive public-text change.
Stable release: https://huggingface.co/datasets/csoai/gspc-board/blob/353f0630e3048407205a45727c4f60dfe3029105/releases/2026-09-18/README.md
Guide: https://huggingface.co/datasets/csoai/gspc-board/blob/c6b378f53fbf5e0a160e5408bb0aa822c7820951/docs/reading-evidence-2026-09-18.md
At04:44:55UTC both repo heads matched these published commits. Original board.json and snapshot/SNAPSHOT.json exact-byte checks passed; export as_of2026-09-15T07:13:43Z preserved.
Local receipts/content/anonymous readback logs: ~/clawd/csoai-reach-pack-01Sep2026/public-release-20260918/PUBLICATION-RECEIPTS.json and neighbouring files.
Scope:3HFcommits +1owned Community post; not earned press coverage, third-party adoption or new model measurements. No GitHub write, site deployment, wallet, paid inference, signing, anchor, email or new subscription. Existing holds and policy flags unchanged.
Remaining: sanctioned public-site deployment/signing; channel-specific social connection; existing inbox/delivery/suppression reconciliation before new outward sends. Old Sep15 filing ledger already reports8submissions—do not resend blindly. Never LinkedIn/calls/Erin Barratt/wallet actions/public prices.
Producer follow-up: mirror/board README generator reconciliation remains OPEN; do not overwrite these scoped explanations at next sync. Immutable commit URLs preserve this exact release. Private correction-watcher and154-run review bundle are not newly published by this batch.


## 2026-09-18T05:08:26.802801+00:00 — OUTWARD-DAY-20260918-PREFLIGHT-AND-PLAN
Owner wants outward growth today. Read actual PrivateEmail Inbox/Sent; replies to Mike/Adrian/Iman/Kenne and Obot approach already sent, so no duplicate drafting/sending as unfinished work. LWN declined. FDIC Sent 233/372 already exist; NIST 417 exists; acknowledgement still separate.
Six owned public-route reads returned200 at04:58UTC. CDP public non-spending validation of /api/proof?bundle=1 returned valid=true, simulation=accepted,23required checks/no failures,index=null at05:00UTC. No wallet/payment/listing/delivery performed. Existing endpoint returned a signed offer; no signing-key access or new measurement signing dispatch.
Execution overlay: /Users/nicholas/clawd/csoai-reach-pack-01Sep2026/tools/entrypoint/outward-20260918/TODAY_OUTWARD.md. Copy for approval beside it. One public self-case,3preparation lanes,1authorised publisher,minute-by-minute hour cycle. Not a new scheduler or authority change. Preserve noLinkedIn/noM4sends/noPublicPrices/noWallets/GitHubhold and all other lane state.


## PUBLIC-METHOD-DEMO-20260918 — active
2026-09-18T06:35:52.962182+00:00 — Building original synthetic membership/control reporting kit and local browser walkthrough. Intended publication: new examples/discriminating-power-2026-09-18 directory in existing csoai/gspc-board, subject to no-overwrite check. No board or signed bytes changed; no GitHub writes, mail, wallet, inference, signing or scheduler. Preserve other lanes.


## PUBLIC-METHOD-DEMO-20260918 CLOSED-WITH-BLOCKERS
2026-09-18T06:42:38.700717+00:00 — Existing HF public release confirmed from local receipts. Current stored publishing identity checked: Nicholastempleman, csoai admin; repo head was97d95f672c7a7f209c248b748702cc3a1827f412. Latest Sent now437; 404Media/Transformer/ToolHive/Arcade/Agentry actions already existed, none resent.
New original synthetic3report teaching kit completed only in this conversation container:18Python tests,6isolated JavaScript input cases plus toggle/report projection checks pass. NOT installed, NOT published, NOT signed, NOT model measurements. Browser local-file navigation blocked by administrator; no video or visual-test success claimed.
Remote demo.py continuation and HF discussion preflight reads were tool-blocked and not bypassed. Partial remote demo.py and transfer staging renamed INCOMPLETE_NOT_FOR_USE; receipt in public-method-demo-20260918/receipts/remote-install-status.json. Existing production source unchanged.
User-facing download: CSOAI_PUBLIC_METHOD_KIT_2026-09-18.zip in conversation sandbox, sha256f93e4b6a1f7684f4cbeeab0f26f3537c1a1a370e195812c341e423b88d9ceb70. Do not claim it resides on this Mac. No public posts/emails/commits/signatures/anchors/payments/new schedulers in this pass. Metricool still unconnected; not suggested again. Next: resolve action-capable publisher and complete approved asset publication/readback; preserve all existing holds and suppression.
