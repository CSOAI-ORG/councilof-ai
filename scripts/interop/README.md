# scripts/interop — harness consumers (unsigned only)

Repo-side consumers for the M4 measure dept (`~/.grokbot/harness/run.sh measure`).
Harness itself is not vendored here.

| Script | Bank / pin | Surface | Notes |
| --- | --- | --- | --- |
| `cedulon_recon_consumer.py` | `public/interop/cedulon-recon/bank/*` | `cedulon.recon` | unsigned; no key |
| `scrapi_ccf_consumer.py` | `public/interop/scrapi-ccf/pinned-vectors.json` | `eval.delta` | pin-verify; asserts no `scitt-keys` |
| `emilia_ep_consumer.py` | digest pointers | `eval.delta` | EP≠SCITT on card |

Locks: never wrangler, never certify, no `/api/gspc` score edits, `sig_ed25519` always null, CSOAI is not a TS.
