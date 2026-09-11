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

## Verified delta — 11 September 2026

**Resolved base:** `56a64bfc1c339ffc33ebc6a8826564de9c851535`

This section reconciles the later six-TUI transcripts with merged files and
live production. It supersedes older quantities only where the evidence below
is explicit. Transcript-only totals such as “58 cards”, “83 cards”, “60 cards”
or “all 425 measured” remain research claims and do not change release state.

| Claim | State | Evidence reference | Observed boundary |
| --- | --- | --- | --- |
| Stablecoin estate coverage | `INDEXED_NOT_MEASURED` | `public/interop/stablecoin-universe-2026-09/readiness.json`; PR #1896; production SHA-256 `1eaf817698d7c48dc1ba30089fc6ab9920acad2e958da5da629c02cb8eea7983` | 425 indexed assets, 1,640 asset/chain entries and 211 reported chains; one asset has independent measurement evidence and 424 do not |
| RLUSD coverage | `MEASURED_PARTIAL_XRPL` | stablecoin readiness record and its cited rooted card | Cross-chain coverage is not established by the current rooted evidence; do not repeat the unsupported `4,074` trustline correction or a cross-date supply-gap story |
| Asset-specific protocol coverage | `ZERO` | stablecoin readiness record | Zero stablecoin-specific A2A skills, MCP tools, x402 doors or verified settlements; generic protocol routes are not asset coverage |
| Mill receipt outer signatures | `VALID_36_OF_36` | `public/interop/mill-receipt-readiness.json`; PR #1897; production SHA-256 `a8824964d7e8283d7882213bf75cfc35ca51044c6c470d6fa7175e0edb03ddc2` | Outer Ed25519 validity does not upgrade the inner lifecycle declaration |
| Mill receipt inner lifecycle | `STAGED_UNSIGNED_36_OF_36` | same readiness record | Preserve signed bytes; the inner records still declare `STAGED_UNSIGNED` |
| Mill receipt regulation linkage | `LINKED_5_UNLINKED_31` | same readiness record | Only five receipts are regulation-score eligible; unlinked receipts have no regulation score |
| Current public root | `SIGNED_REKOR_WITNESSED` | `public/interop/public-root-latest.json`; `public/interop/root-witness-latest.json`; deploy run 34589738751 | 167 leaves; root SHA-256 `62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6`; Merkle root `78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5`; Rekor log index 2791822965 |
| Current root witnesses | `REKOR_WITNESSED_OTS_PENDING` | `public/interop/root-witness-latest.json` | OTS remains `STAMPED_PENDING_BITCOIN`; Base EAS and XRPL memo remain `NOT_YET` |
| USBDC | `REPORTED_CANDIDATE_UNMEASURED` | `public/interop/stablecoin-universe-2026-09/discovery-candidates.json`; PR #1898 | Issuer launch report is verified; canonical issuer account, transactions, ledger evidence, signature, root and anchor are still absent |
| x402 promotional door | `LIVE_UNSETTLED_TEST_PENDING` | PR #1895; live 402 challenge from `/api/request-attestation` | Bounded test is 0.01 USDC on Base for existing `llama3.2:3b` evidence; any self-purchase must be labeled `INTERNAL_SELF_FUNDED` and cannot evidence outside demand |
| Revenue | `ONE_HISTORICAL_OUTSIDE_PAYER_NO_REPEAT_PROOF` | existing revenue evidence ledger | The pending internal settlement tests plumbing only; it cannot increase the outside-payer count |
| Directory distribution | `PARTIAL_RECONCILIATION` | live `.well-known/agent-card.json`, `/mcp`, Glama pages and unresolved MCP.so submission state | HTTP reachability and index entries do not establish adoption; stale duplicate descriptions must not be amplified |
| Global-now hunt | `RESEARCH_INPUT_PARTIALLY_VERIFIED` | attached hunt plus official-source checks | NIST AI Documentation Zero Draft input closes 2026-09-16; SEC Regulation Crypto Assets comments close 2026-10-20; all other volatile claims require primary-source verification before cards or copy |

### Immediate gates retained

1. Let the USBDC deployment complete its existing run and verify production
   bytes; never restart it solely because observation timed out.
2. Execute the 0.01 USDC Base settlement only after exact action-time financial
   confirmation, then preserve transaction, facilitator and attribution
   receipts with `INTERNAL_SELF_FUNDED` classification.
3. Reconcile directory listings against canonical copy before any new
   representational submission; do not create duplicates.
4. Do not edit or send the three IETF drafts until the exact send batch has
   action-time confirmation; preserve the requested spacing if authorised.
5. Continue the global hunt as candidate intake: official source, frozen input,
   reproducible reader, admission, signature and root inclusion are separate
   gates.
