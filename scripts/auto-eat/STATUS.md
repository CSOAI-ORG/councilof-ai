# EAT — retained input status

Report generated 2026-11-27T18:59:00Z; saved-source liveness is not established.

| Field | Value |
|---|---|
| Discovered queue rows | 13658 |
| Probed identities | 13658 |
| Validated unsigned staged atoms | 8 |
| Retained LIVE/probed sample | 29/33 (0.8788) |
| Earliest retained staged observation | 2026-09-01 |
| Latest retained staged observation | 2026-11-27T18:59:00Z |
| Signature verification | NOT PERFORMED |
| Files with signature text | 8 (not verified signatures) |

## Discovered by kind

| Kind | Count |
|---|---|
| erc8004 | 1815 |
| hf-model | 4239 |
| hf-space | 4224 |
| mcp-server | 669 |
| npm-registry | 2409 |
| xrpl-account | 302 |

## Scope

- A report timestamp is not evidence that the loop ran a fresh probe.
- Non-probe legacy samples are excluded from the reachability denominator: autoeat.swift.census, autoeat.xrpl.twoway.
- `last_signed_batch` stays null: this generator does not verify signatures. Signature-bearing candidates remain explicitly unverified.
- Discovery, reachability, signature verification, model measurement, human approval and training permission remain separate.
- This generator performs no network requests, signing, training or execution approval.
