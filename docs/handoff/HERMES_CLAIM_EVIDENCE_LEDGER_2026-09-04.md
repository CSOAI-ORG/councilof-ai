# Hermes claim and evidence ledger — consolidation seed

**Snapshot:** 4 September 2026  
**Branch:** `codex/council-master-consolidation`  
**Authority:** audit snapshot only; not a runtime, release or commercial claim  
**Execution plan:** `docs/blueprints/MASTER_CONSOLIDATION_AND_EXECUTION_2026-09-04.md`

## Evidence labels

| Label | Meaning |
| --- | --- |
| `LOCAL_WORKTREE` | Inspected locally; may be modified or untracked and is not deployed proof. |
| `LOCAL_COMMITTED` | Present at an exact Git revision; still not deployed proof. |
| `RUNTIME_OBSERVED` | A bounded current probe produced a retained result. |
| `LOCAL_PREVIEW_OBSERVED` | Observed through a local production-shaped Pages runtime; not evidence of deployment. |
| `ATTACHMENT_UNVERIFIED` | Appears only in pasted terminal material or a generated rundown. |
| `PROPOSED` | Intended architecture/product behaviour. |
| `OWNER_GATE` | Needs credentials, spend, legal/external action or production approval. |
| `QUARANTINED` | Preserved for audit but prohibited from promotion or release. |

## Current ledger

| Claim | State | Evidence reference | Freshness | Owner | Blocker / next bounded proof |
| --- | --- | --- | --- | --- | --- |
| One chat-first dashboard shell exists | `LOCAL_PREVIEW_OBSERVED` | `client/src/components/DashboardLayout.tsx`, `DashboardWorkspace.tsx`; Pages preview `127.0.0.1:4178`; shell E2E 22/22 | 2026-09-04 | TUI 1 | Ten-job rail, desktop/mobile panes, cold legacy doors, chat/tool/game journeys and full dashboard prerender observed locally; current-master integration remains. |
| The consolidated dashboard is live | `UNVERIFIED` | No served-build identity for this branch | 2026-09-04 | Claude | Show local production-shaped preview, then owner-approved GHA release and served-SHA check. |
| Dirty worktree is release-ready | `FALSE` | `git status --short`: 394 paths; worktree 41 commits behind local master | 2026-09-04 | Hermes + Claude | Port reviewed paths onto current master; classify every path and exclude preview state, secrets, unrelated changes and quarantined generators. |
| Exposed test wallet is retired from current tracked files | `LOCAL_COMMITTED` | branch `codex/retire-compromised-wallet-secret`, commit `8f340b98d`; wallet secret gate checks 12,701 tracked paths | 2026-09-04 | Claude + Owner | Clean local repair only; still requires reviewed integration, credential retirement/rotation and separate history-remediation decision. Never fund or reuse it. |
| Historical signed-card inventory | `LOCAL_WORKTREE` | `public/signed/card-matrix.json`: 1,066 `LEGACY_UNADJUDICATED` | 2026-09-04 | TUI 2 | Preserve history; do not promote from signature alone. |
| Current independently admitted/quotable matrix | `LOCAL_WORKTREE: 0` | `public/signed/card-matrix.json` | 2026-09-04 | TUI 2 | One independently reproduced, separately admitted fixture. |
| Current regulator findings | `LOCAL_WORKTREE: 0` | `public/signed/findings_index.json` | 2026-09-04 | TUI 2 | A report remains `REPORTED` until the full finding process verifies. |
| 22 axes are declared | `LOCAL_WORKTREE` | GSPC modules plus platform blueprint E09 | 2026-09-04 | TUI 2 | Publish versioned axis registry and legacy alias/retirement map. |
| All 22 axes are currently measured | `CONTRADICTED` | Static board copy conflicts with admitted matrix | 2026-09-04 | TUI 2 + Hermes | Reducer over admitted cards becomes sole authority. |
| Evidence intake creates candidates | `LOCAL_WORKTREE` | `functions/api/evidence-intake.ts` and focused tests | 2026-09-04 | TUI 2 | It must remain unable to execute, train, admit, sign, witness or publish. |
| Action jobs execute work | `FALSE` | `functions/api/action-jobs.ts`: `SINGLE_WRITER_STAGING` | 2026-09-04 | TUI 2 | Transactional store, lease/heartbeat/result protocol and bounded worker. |
| Hugging Face/RunPod canaries prove provider health | `LIMITED_LOCAL_WORKTREE` | `functions/api/provider-canary.ts` | 2026-09-04 | TUI 2 | A configured or one-token canary is `UNMEASURED`; retain bounded receipts. |
| Canonical full RAS exists | `MISSING` | Current endpoint is commission/re-serve; action ledger stages only | 2026-09-04 | TUI 2 | One schema, transactional event ledger, worker, reproduction and admission. |
| Canonical capability registry exists in this worktree | `MISSING` | `capabilities/registry.json` absent | 2026-09-04 | TUI 2 | Generate MCP/OpenAPI/A2A/plugin/HF declarations from one reviewed registry. |
| MCP is a complete action surface | `PARTIAL` | MCP read/verify tools exist; execution path is not proven | 2026-09-04 | TUI 2 | Stable-version/auth/origin tests plus canonical RAS mutations. |
| A2A is complete | `DECLARED_ONLY` | Agent Card/extension material, no complete Task/Artifact server proof | 2026-09-04 | TUI 2 | Same RAS ID, task history, artifacts, input-required and conformance. |
| AG-UI is complete | `PRESENTATION_PARTIAL` | Local stream/projection code | 2026-09-04 | TUI 2 + TUI 1 | Complete event envelope, reconnect/cursor and validated action return. |
| A2UI is complete | `MISSING` | No canonical adapter found in blueprint audit | 2026-09-04 | TUI 2 + TUI 1 | Validated declarative surfaces driven by the same RAS projection. |
| Hugging Face model coverage is complete | `ATTACHMENT_UNVERIFIED` | Local plans and external assets exist, but no dated eligible denominator/runtime audit in this ledger | 2026-09-04 | Hermes + TUI 2 | Verify org/Space/datasets/jobs, lineage, licence, freshness and exact model state. |
| RTX 3090 is a worker | `RUNTIME_OBSERVED, CAPACITY-CONSTRAINED` | RunPod account/pod audit retained in session; pod local disk nearly full | 2026-09-04 | TUI 2 | Freeze supported workloads, image/model revisions, egress and resource receipts. |
| Existing A100 is a durable backup target | `FALSE` | No attached account Network Volume | 2026-09-04 | Owner + TUI 2 | A pod-volume transfer is only `WORKING_COPY`; attach approved volume or create Console S3 key. |
| Safe offload is ready to dry-run | `LOCAL_WORKTREE` | `/Users/nicholas/clawd/_evacuation/safe-runpod/`; 10 focused tests previously passed | 2026-09-04 | TUI 2 | Execute only after target/durability gate; preservation and quarantine stay separate. |
| Current OTS inventory is fully Bitcoin-verified | `FALSE` | Source-tree scope: 982 `.ots` = 656 with Bitcoin attestations, 314 pending-only, 12 invalid-magic archived; only 13 have a colocated target whose digest matches | 2026-09-04 | TUI 2 + Hermes | Verify exact proof/target pairs; target-absent proofs are not independently rebound by this checkout. Keep inventory scopes separate. |
| Public atom-root OTS proofs bind the current JSON | `P0 FALSE` | Both `public/interop/atom-root-2026-09-03*.json.ots` parse as pending but embed a digest different from the current target bytes | 2026-09-04 | TUI 2 + Claude | Remove from release; freeze and restamp exact target bytes, then retain binding proof. |
| Transcript OTS totals and upgrades are current | `ATTACHMENT_UNVERIFIED` | Pasted counts vary and do not reconcile with this worktree | 2026-09-04 | Hermes | Recompute by parser, proof target and confirmation state, not filename. |
| XRPL adapter covers current token/credential surface | `FALSE` | `functions/api/xrpl.ts`, `functions/api/rwa/evidence.ts`, trustline-oriented scripts | 2026-09-04 | TUI 2 | Official-source research plus pinned-ledger fixtures for current Credentials/MPT/permissioned objects. |
| Generated XRPL queue cards are measurements | `P0 QUARANTINED` | Tracked sample has 10/10 `MEASURED` rows despite three fetch errors each; 13 total cards lack subject/instrument digests and admission, with `signed:false` plus digest values in signature-shaped fields | 2026-09-04 | Hermes + TUI 2 | Keep out of admission, training, roots, board, x402 delivery and release; preserve as negative fixtures. |
| XRPL software support means a feature is enabled on Mainnet | `FALSE` | Official-node probe separated enabled from merely supported amendments | 2026-09-04 | TUI 2 + Hermes | Publish dated network/amendment state using `ENABLED`, `SUPPORTED_NOT_ENABLED`, `UNSUPPORTED`. |
| Every institutional XRPL RWA uses MPT | `ATTACHMENT_UNVERIFIED` | Universal transcript assertion only | 2026-09-04 | Hermes | Do not publish; establish a dated eligible-set census from official/ledger sources. |
| XRPL Credential can carry Council evidence | `PROPOSED` | Attachment hypothesis; technical supplement gap | 2026-09-04 | TUI 2 | Treat as optional witness/eligibility observation; prototype and threat-model without calling it legal identity or admission. |
| x402 is revenue-producing | `UNVERIFIED` | Local implementation/configuration notes, no retained settled customer receipt here | 2026-09-04 | Owner + TUI 2 | v2 conformance then one owner-approved end-to-end settlement/delivery receipt. |
| Public verification/reporting remain free | `LOCAL_POLICY` | Platform blueprint and current product doctrine | 2026-09-04 | Claude + Hermes | Claim/price gates must enforce it across public surfaces. |
| Measure, Evidence Operations and Connect are commercial products | `PROPOSED` | Master/platform blueprints | 2026-09-04 | Hermes + Owner | Validate with one fixed-scope design partner and a delivered evidence outcome. |
| Aggregate governance/index feeds are sellable | `PROPOSED_WITH_RIGHTS_GATE` | Master/platform blueprints | 2026-09-04 | Hermes + Owner | Source licence, consent, privacy, cohort/disclosure and methodology review. |
| Grant applications are revenue | `FALSE` | Draft applications/funding queue | 2026-09-04 | Owner | Treat as non-dilutive funding pipeline until submitted and awarded. |
| Existing standards/board activity is endorsement | `FALSE` | Membership/application evidence may exist; endorsement does not follow | 2026-09-04 | Hermes | Record member, applicant, contributor and externally endorsed as distinct states. |
| Quantity-based EAT/wiring plans prove capability | `QUARANTINED` | New attachment generator source and 300/340-move transcripts | 2026-09-04 | Hermes | Extract testable hypotheses only; do not execute generators or import typed totals. |
| Wallet secret in readiness/queue material is usable | `P0 COMPROMISED` | Exact value intentionally omitted; repository scan found multiple occurrences outside this release worktree | 2026-09-04 | Owner + Claude | Never fund; rotate/replace; remove from release; scan history/logs and downstream copies. |
| Current SCITT artifacts prove Transparency Service operation | `P0 FALSE` | Placeholder all-zero signature vector, copied legacy signature in a new COSE wrapper, and incorrect protocol citations/media claims | 2026-09-04 | TUI 2 + Hermes | Treat as negative fixtures; require genuine COSE_Sign1 plus SCRAPI submission and independently verified receipt. |
| GSPC learning may train directly on games/reports | `FALSE` | Candidate/consent/admission guards and handoffs | 2026-09-04 | TUI 1 + TUI 2 | Separate task use, retention, research, public release and model-training consent. |

## Reproduction commands

These are read-only snapshots; retain their output with timestamp and revision.

```bash
git branch --show-current
git rev-parse HEAD
git status --porcelain=v1 -z
jq '.counts' public/signed/card-matrix.json
jq '.counts' public/signed/findings_index.json
test -f capabilities/registry.json
find public scripts -type f -name '*.ots' -print0
rg -n 'SINGLE_WRITER_STAGING|execution_effects|training_effects' functions/api
rg -n 'MEASURED|signed.false|HTTP Error|control characters' scripts/badger/_queue/xrpl-settlement
```

Do not put the compromised secret, private complaint text, provider tokens or
operator-only runbooks into retained command output.
