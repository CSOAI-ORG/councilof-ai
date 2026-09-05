# Permissionless Relentless Moves — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-955cb4d9-917c-57df-b973-1eba291de0d0_text_markdown.md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| Permissionless census of open x402 endpoints (signed daily diff feed) | partly (door only) | **YES** (running a probe fleet) | no census door found beyond `x402-discovery-fact` | slug probe |
| Harvest GLEIF / MiCA / XRPL / Eurostat / ERC-8004 / Bazaar into the harness | **YES** (doors) | no | GLEIF+MiCA MISSING; XRPL 12 slugs; erc8004 4 slugs | slug probe |
| Fix own integrity gaps FIRST (brief calls this the binding constraint) | partly | **YES** | see notes — **two of three claims re-probed** | below |
| `GET /api/axis-register` — brief records **fetch failed** | n/a | no | **BRIEF IS STALE — returns 200 today** | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/api/axis-register` |
| `GET /api/verify` — brief records fetch failed | no (functions/, not my area) | no | **CONFIRMED MISSING — 404** | `curl -o /dev/null -w '%{http_code}' https://councilof.ai/api/verify` |
| HF datasets `x402-bazaar-census` etc. shipped at 0 downloads, unlinked from homepage | partly (an interop index could link them) | **YES** (HF writes) | not re-probed this pass — **UNMEASURED** | — |
| Do NOT sign the GPAI Code of Practice (brief's explicit advice) | n/a | **YES** | n/a | brief §Recommendations |
| Opt-in outreach ≤20/day, never unsolicited remediation PRs | no | **YES** | n/a | brief §2.1 — evidence says DON'T |

## Re-probed the brief's own integrity claims

| Brief claim | Re-probed 2026-09-05 |
|---|---|
| `/api/axis-register` fetch failed | **200 — brief is stale** |
| `/api/verify` fetch failed | **404 — confirmed gap** |
| root's Bitcoin anchor only `STAMPED_PENDING_BITCOIN` | deployed `root.json` carries **no** `ots`/`anchor`/`rekor` field at all, but **does** carry `sig_ed25519` — signed, unanchored |
| 26 SWIFT cards carry `sig_algo: SHA256-placeholder` | **not reproduced** in `/interop/swift-registry.json`; the placeholder cards live elsewhere — left UNMEASURED rather than asserted |

Absent ≠ zero: the SWIFT placeholder claim is *unconfirmed by this probe*, which is not the
same as refuted. It stays on the delta as UNMEASURED.
