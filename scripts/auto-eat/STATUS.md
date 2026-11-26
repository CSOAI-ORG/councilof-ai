# EAT — retained input status

Report generated 2026-11-26T05:03:40Z; saved-source liveness is not established.

| Field | Value |
|---|---|
| Discovered queue rows | 13556 |
| Probed identities | 13556 |
| Validated unsigned staged atoms | 8 |
| Retained LIVE/probed sample | 37/40 (0.925) |
| Earliest retained staged observation | 2026-09-01 |
| Latest retained staged observation | 2026-11-26T05:03:40Z |
| Signature verification | NOT PERFORMED |
| Files with signature text | 8 (not verified signatures) |

## Discovered by kind

| Kind | Count |
|---|---|
| erc8004 | 1807 |
| hf-model | 4200 |
| hf-space | 4184 |
| mcp-server | 668 |
| npm-registry | 2409 |
| xrpl-account | 288 |

## Scope

- A report timestamp is not evidence that the loop ran a fresh probe.
- Non-probe legacy samples are excluded from the reachability denominator: autoeat.swift.census, autoeat.xrpl.twoway.
- `last_signed_batch` stays null: this generator does not verify signatures. Signature-bearing candidates remain explicitly unverified.
- Discovery, reachability, signature verification, model measurement, human approval and training permission remain separate.
- This generator performs no network requests, signing, training or execution approval.
