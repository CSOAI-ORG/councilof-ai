# The Switchboard Thesis (code-level) — extracted moves

**Source brief:** `~/Downloads/compass_artifact_wf-51e9b049-dac9-5dda-b1c0-1116fea0c823_text_markdown (1).md`
**Mined:** 2026-09-05, TUI-5 (research-intake lane)
**Rule:** the `already live?` column is a PROBE RESULT taken at mine time, never an assumption.
Probe commands are in the Evidence column so a stranger re-runs them.

| move | lane-doable? | owner-gated? | already live? (probed) | evidence |
|---|---|---|---|---|
| ERC-8004 Identity `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` + Reputation `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` (Ethereum mainnet) | **YES** (door recording the addresses) | no | 4 `erc8004` ledger-card slugs exist; **no canonical door naming the two registry addresses** | slug probe |
| Register as an **ERC-8004 validator** once the card bridge exists | no — keys/wallet | **YES** | Validation registry unshipped per brief | brief PART A |
| Consolidate/deprecate ~30 `*-ai-mcp` MEOK registry entries into one canonical entry | no — registry writes | **YES** | **330 latest servers**; 39 advertise unresolvable `api.meok.ai` | registry paginate + `dig +short api.meok.ai` → empty |
| Publish per-issuer XRPL failed-check cards (SG-FORGE, Schuman, Palau) | partly — evidence-card path is draft-only per goal §4 | **YES** (signing) | `/api/xrpl` 200; per-issuer failed-check state not probed | `curl -s https://councilof.ai/api/xrpl` |
| Add an OTS stamp to `root.json` | no — CI | **YES** | **MISSING** — no `ots` field | `curl -s https://councilof.ai/root.json` |
| PyPI `csoai` 0.2.2 no trusted publisher; `csoai-gspc-mcp` 0.1.1 no provenance | no | **YES** | npm **confirmed** no attestations (now 0.2.1) | `curl -s https://registry.npmjs.org/csoai-gspc-mcp/latest` |
| Ship Article 50 disclosure cards on hub-queue top-100 **before 2 Dec 2026** | no | **YES** | `eu-ai-act` door exists; art50 cards not enumerated here | slug probe |
| GENIUS Act NPRM comment — **due 19 Oct 2026** | no | **YES** | n/a — **hard date** | Federal Register, pub. 18 Aug 2026 |

## Cross-check against this lane's own earlier finding

The brief says *"keep `io.github.CSOAI-ORG/gspc` v1.0.0"*. **That is stale** — the registry's
`isLatest` entry is now **v1.2.0**, and it correctly points at `https://councilof.ai/mcp`
(200). The dead `csoai-gspc-mcp.nicholastempleman.workers.dev/mcp` (404) survives only on the
superseded v1.0.0. The consolidation advice still stands for the ~39 entries pointing at
**`api.meok.ai`, which has no DNS record at all**.
