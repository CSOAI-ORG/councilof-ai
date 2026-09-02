# EAT: Microsoft SCITT/CCF + ASG scitt-cose → card-v0 `eval.delta`

Public interop fixtures welded into the CSOAI atom path as an **unsigned**
`eval.delta` coverage card. **Consumer of fixtures only.**

## Hard locks (Owner)

| Lock | Value |
| --- | --- |
| Role | Fixture consumer / denser-root leaf — **never** a Transparency Service |
| `/.well-known/scitt-keys` on councilof.ai | **404 by design** (probed) |
| `scitt-keys` in this repo | **stays absent** — do not add |
| Certify / mint receipts / `POST /entries` | **Forbidden** |
| Board | Never a GSPC axis fill; no `/api/gspc` edits; no wrangler |
| Signatures | `sig_ed25519` is always `null` here |

## Atom

```
public fixture pins → unsigned card-v0 (surface=eval.delta)
  → (later n≥30 + 4way + keystone) → root → witness root only
```

Denser root means the **same** living root-as-index (`GET /root.json`) indexes
more honest leaves. It does **not** open a second board, second scorer, or TS.

## What landed

| Path | Role |
| --- | --- |
| `README.md` | This note — consumer posture + hard stops |
| `FIXTURES.md` | Offline fixture notes + pinned public vectors |
| `pinned-vectors.json` | Machine-readable digests + source_urls (no binaries) |
| `card-unsigned.example.json` | Unsigned `eval.delta` example with data-hash binding requirement |
| `card-unsigned.consumer.json` | Harness consumer pin-verify output (unsigned) |
| `HARNESS.md` | Measure dept wire-up (`run.sh measure`) |

## Data-hash binding (required for any real verify)

Offline verifiers MUST check:

```
proof.leaf.data-hash == HASH(candidate)
```

where `HASH` is SHA-256 over the candidate Signed Statement bytes (or the
declared digest when the statement is hash-bound). This card records the
requirement; it does **not** claim a live check ran on councilof.ai.

## Cite (fixtures we pin, we do not operate)

- Microsoft: https://github.com/microsoft/scitt-ccf-ledger (`test/payloads`, …)
- Action State Group / Iman LC: https://github.com/action-state-group/scitt-cose
  (`interop/ccf/shared-vector.json`, `test-vectors/v1/valid-ccf-vds2`)
- SCRAPI: https://datatracker.ietf.org/doc/draft-ietf-scitt-scrapi/
- Architecture: RFC 9943

ASG `scitt-cose` is explicitly **NOT a Transparency Service** (substrate /
verifier only). Matching our posture.

## Non-goals / hard stops

- Do **not** invent MEASURED / SIGNED.
- Do **not** publish `/.well-known/scitt-keys`.
- Do **not** claim CSOAI operates a SCITT TS or certifies supply chains.
- Do **not** touch `/api/gspc`, wrangler, or fake signatures.
- Do **not** vendor TS private keys or mint receipts in-tree.

## Gaps (declared in `unmeasured[]`)

- `csoai-not-a-ts`
- `no-live-scitt-keys`
- Live receipt re-verify / CI `scitt-cose` run
- n≥30, 4way, keystone

## Harness consumer

See [`HARNESS.md`](./HARNESS.md) and `scripts/interop/scrapi_ccf_consumer.py` (pin-verify → unsigned `eval.delta`; asserts no `scitt-keys`). Measure dept: `~/.grokbot/harness/run.sh measure`.
