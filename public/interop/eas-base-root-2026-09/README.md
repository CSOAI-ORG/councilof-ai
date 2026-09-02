# EAS on Base — root attestation scaffold (2026-09)

**Status: UNCHECKABLE** — `writes_board: false`. Not MEASURED. Not certified.

## Why blocked
Estate search found **no Base wallet / private key / funded signer** (box env, M4 env, `gh secret list` on `CSOAI-ORG/councilof-ai`, `estate-crypto-inventory.json`, CDP wallet setup scripts, `.sovereign/keystore`). Existing `public/interop/eas-attestation-batch.json` already notes submission is **owner-gated**.

Per operator lock: **do not invent keys** and **do not ask Nick to pay**. This pack documents the gas-only path and the intended attestation body so a stranger (or a future funded estate signer) can complete it.

## Intended schema
```
bytes32 sha256,string as_of,string did
```

Intended data (from live root witness `2026-09-02`):

| Field | Value |
| --- | --- |
| sha256 | `f372512f38e9e0acd72a64d994dc8aa9fabc18225e3c9508826ef3ebea8be67c` |
| as_of | `2026-09-02T04:22:20Z` |
| did | `did:web:csoai.org#board-attestation-1` |

## Gas-only path (not executed)
1. `SchemaRegistry` `0x4200…0020` on Base — `register(schema, 0x0, false)` if needed → schemaUID
2. `EAS` `0x4200…0021` — `attest(...)` with encoded `{sha256, as_of, did}`
3. Record UID on [base.easscan.org](https://base.easscan.org/)

Cost: **Base gas only** (permissionless; no EAS protocol fee). Off-chain attestations are free but do not yield a chain-recomputable UID.

## Files
- `card-eas-base-root-scaffold-unsigned.json` — card-v0 atom (`sig_ed25519: null`)
- `index.json` / `artefact-manifest.json` / `mirrors/`

## Hard stops
- No keys minted. No wrangler. No `card_index` shrink. No MEASURED stamp. No board write.

## Live root vs witness
- Witness artifact sha256: `61a6d86db8d5dec9c63eaffb529438aa7631c0a12f5bfbb19ac75517c1c94bd6`
- Live `root.json` sha256 at scaffold fetch: `f372512f38e9e0acd72a64d994dc8aa9fabc18225e3c9508826ef3ebea8be67c`
- Match: **False**

Scaffold `intended_data` uses the **current** live root. The witness remains the OTS/Rekor time-proof of the earlier bytes.
