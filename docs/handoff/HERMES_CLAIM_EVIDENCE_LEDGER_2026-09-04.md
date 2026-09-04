# Hermes claim-to-evidence ledger

**Observed:** 2026-09-04
**Branch:** `codex/council-release-live`
**Rule:** a transcript, file name, configured provider or styled UI is not runtime proof

| Claim | State | Evidence reference | Owner | Blocker / boundary |
| --- | --- | --- | --- | --- |
| One canonical Council OS shell | `CANDIDATE_TESTED` | `/dashboard`; shell E2E 27 passed, 1 conditional skip on desktop/mobile | TUI 1 | Production deployment not yet verified |
| GSPC has 22 canonical axes | `MEASURED_PUBLISHED_LOCAL` | `GET /api/gspc`; 14 comparison axes + 8 deterministic-fact axes | TUI 2 | A measured axis is not certification |
| 33 independent BFT agents are live | `RETRACTED` | `csoai-bft-council.py` was one process with placeholder keys and constant YES votes | Hermes | No runtime quorum or independent identities |
| Latest council independence | `MEASURED_LIMITED` | `public/interop/council-independence.json`: 3 lineages, 2 providers, 12 items/10 comparable, `rho=1`, `n_eff=1` | Hermes | Raw responses absent; point experiment only; no fault tolerance |
| Seven named engines have live MCP/A2A wiring | `RETRACTED` | Generated discovery files had no corresponding executable Functions; moved to incident archive | TUI 2 | Reintroduce only per tested capability adapter |
| 22 Web3 rails are operational | `PLANNED` | `public/interop/axes-v2-web3.json`; fail-closed generator test | TUI 2 | No deployment, signature, chain transaction, BFT or coverage proof |
| Invalid historical proof files were deleted | `FALSE` | Byte-for-byte incident archive + manifest | Root/witness lane | History is preserved but unserved |
| Public proof inventory is clean | `LOCALLY_VERIFIED` | evidence-integrity gate passes; three served OTS files parse and bind their targets | Root/witness lane | Fresh current-root witnesses still require GHA |
| Current public root is release-ready | `BLOCKED_CURRENT_ROOT` | root/witness gate reports only stale schema-v0 declaration and stale sidecar/pointer bindings | Claude Master | Run authorised `public-root.yml` after merge; never hand-edit signatures |
| Leaf-union is a signed-card index | `RETRACTED` | builder now derives exact first-seen coverage-leaf union from root history | Claude Master | 22 historical roots / 755 unique opaque leaf digests at this checkpoint |
| Learn-loop issues verified attestations | `UNAVAILABLE_FAIL_CLOSED` | endpoint tests and quarantine guard | TUI 2 | No payment or placeholder receipt accepted |
| General agentic repair is operational | `NOT_IMPLEMENTED` | action API is staging state; Phase-1 executor is an in-memory deterministic fixture | TUI 2 | Needs durable ledger, allowlist, approval, rollback, retest and admission |
| Live two-model LM Arena battle works | `NOT_IMPLEMENTED` | arena tests render recorded comparisons and refuse fake inference | TUI 1 | Needs real provider endpoint, identity, capture, consent and replay |
| Hugging Face registry dataset is public | `PUBLISHED_WITH_CAVEATS` | `csoai/registry-harvest-xrpl-mica-lei` at `500e71…`: six configs, 733 rows | Hermes | Manifest/timestamp stale; producers/raw CASP input absent; normalization undocumented |
| SCITT conformance is established | `PLANNED` | RFC 9942/9943 and CCF profile review | Hermes | 32 tagged SCITT-valid encodings, not 64; no verified SCITT Receipt |
| Local monitor helper is a wire protocol | `FALSE` | `packages/gspc-card-verifier/src/monitor-attestation.mjs` audit | TUI 2 | Coverage predicate only; no signature, checkpoint, replay, Permit-at-commit or atomic effect boundary |
| Production carries this candidate | `NOT_YET_ESTABLISHED` | deployment workflow and served-commit check pending | Claude Master | PR, CI, public-root workflow and live verification required |

## Release decision

Include the one-shell dashboard, real GSPC data, verified cards and fail-closed
capability/evidence contracts. Quarantine simulated runtimes, speculative rails
and invalid proof-shaped history. Defer provider execution, live battle,
automatic repair, SCITT wire claims and current witness claims until their
negative tests and exact-byte evidence exist.
