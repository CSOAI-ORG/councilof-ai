# Hermes claim-to-evidence ledger — post-release checkpoint

**Observed:** 2026-09-04

**Base rule:** resolve and record the latest `origin/master` commit for each audit; do not copy a branch or SHA from an older handoff

**Evidence rule:** a transcript, file name, configured provider, HTTP 200 or styled UI is not runtime proof

| Claim | State | Evidence reference | Owner | Observed at | Blocker / boundary |
| --- | --- | --- | --- | --- | --- |
| One canonical Council OS shell is integrated | `MERGED_REVERIFY_LIVE` | `/dashboard`; current shell tests and served-commit probe | Claude Master | 2026-09-04 checkpoint | TUI 1 supplies UI evidence; local or merged state is not production proof |
| GSPC exposes 22 canonical axis slots | `PUBLISHED_ARTIFACT_REVERIFY` | `GET /api/gspc`; model-comparison and deterministic-fact rows identify their own units and denominators | TUI 2 | 2026-09-04 checkpoint | A measured row is not certification |
| 33 independent BFT agents are live | `RETRACTED` | Public truth gate; prior implementation was one process with placeholder keys and constant affirmative votes | Hermes | 2026-09-04 checkpoint | 33 is a designed membership and 23 a target quorum, not runtime evidence |
| Latest Council independence | `MEASURED_LIMITED` | `public/interop/council-independence.json`: three lineages, two providers, 12 items/10 comparable, `rho=1`, `n_eff=1` | Hermes | 2026-09-04 checkpoint | Point experiment; no fault-tolerance claim |
| Exact current public-root candidate | `SIGNED_REKOR_WITNESSED` | 154 coverage leaves; SHA-256 `9b426735bc7c0e94d32ce64ccd87605880c531350ca957ecccde5046bde505cd`; Merkle `2fe2a76f310ea79268c73a94543c91125fa7acc3bbf11ed489afdfeb845ea745` | Claude Master | 2026-09-04 checkpoint | Re-run gates on any later bytes |
| Current OTS proves a Bitcoin timestamp | `FALSE_PENDING` | `public/interop/root-witness-latest.json`: `STAMPED_PENDING_BITCOIN` | Claude Master | 2026-09-04 checkpoint | Calendar receipt only; no Bitcoin block confirmation |
| The signed-card catalogue is included in that root | `FALSE_SEPARATE_CORPUS` | Root witness scope and signed index | Claude Master | 2026-09-04 checkpoint | 335-card catalogue is separate from the 154-leaf root |
| Historical public-root union | `DERIVED_CHECKPOINT` | `public/signed/public-root-leaf-union.json`: 25 roots / 937 entries | Claude Master | 2026-09-04 checkpoint | 904 individually signed wrappers; 33 unsigned wrappers; not a current-root signature |
| Public proof inventory passes local integrity gates | `LOCALLY_VERIFIED` | evidence-integrity, Council-truth and candidate root/witness gates | Claude Master | 2026-09-04 checkpoint | Production bytes require a fresh live gate |
| Learn-loop issues verified attestations | `UNAVAILABLE_FAIL_CLOSED` | endpoint tests and quarantine guard | TUI 2 | 2026-09-04 checkpoint | Practice or payment cannot manufacture evidence |
| General agentic repair is operational | `NOT_IMPLEMENTED` | action API and bounded fixture tests | TUI 2 | 2026-09-04 checkpoint | Needs durable ledger, allowlist, approval, rollback, retest and admission |
| Live two-model arena battle works | `NOT_IMPLEMENTED` | arena tests and routed disclosures | TUI 1 | 2026-09-04 checkpoint | Recorded comparisons and practice are not live inference |
| Games or training update GSPC | `FALSE_PRACTICE_ONLY` | learning/game state tests | TUI 1 | 2026-09-04 checkpoint | Requires separate reviewed evidence lifecycle |
| PQC attestation is operational | `PLANNED` | PQC plan and truth gate; Hermes supplies audit evidence | TUI 2 | 2026-09-04 checkpoint | No verified PQC runtime or proof |
| Six protocol projections are operational | `CONFORMANCE_WORK_REQUIRED` | HTTP/MCP/A2A/AG-UI/A2UI/SDK parity matrix | TUI 2 | 2026-09-04 checkpoint | Catalogue/configuration is not a live probe |
| Hugging Face registry dataset is public | `PUBLISHED_WITH_CAVEATS` | `csoai/registry-harvest-xrpl-mica-lei` | Hermes | 2026-09-04 checkpoint | Refresh manifest, timestamp, producers, raw-input and normalization evidence before a new claim |
| SCITT conformance is established | `PLANNED` | RFC 9942/9943 and CCF profile review | Hermes | 2026-09-04 checkpoint | Encoding experiments are not a verified SCITT Receipt |
| Revenue has been earned by local journeys | `NOT_EVIDENCED` | revenue evidence ledger | Hermes | 2026-09-04 checkpoint | Tests, requests and proposals are not settled receipts |
| Growth is proved by catalogue coverage | `NOT_EVIDENCED` | reachability/provenance inventory | Hermes | 2026-09-04 checkpoint | Files, HTTP 200 and downloads do not establish adoption |
| Included research/data has documented IP provenance | `AUDIT_REQUIRED` | source/licence/database-right/OIN-scope register | Hermes | 2026-09-04 checkpoint | No external filing or disclosure is authorised |
| Production serves the latest reviewed commit | `REQUIRES_FRESH_PROBE` | apex/Pages served-commit and live root/witness checks | Claude Master | 2026-09-04 checkpoint | Never infer deployment from merge or local build |

## Post-release decision

Keep the one-shell dashboard, evidence-scoped GSPC data, verified card families
and fail-closed capability contracts. Keep simulated runtime, live-BFT,
automatic-compliance, confirmed-OTS and PQC claims withdrawn. TUI 1 owns the
routed UI truth pages; TUI 2 owns lifecycle and protocol contracts; Hermes owns
this ledger; Claude Master owns integration and read-only production
verification. No lane may send email, publish externally, spend, merge or deploy
under these post-release job orders.
