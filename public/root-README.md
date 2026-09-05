# Public root (`/root.json`)

Living unsigned catalogue of card-v0 leaves. **Do not overwrite this file from this honesty PR.**

- Kind: `csoai.public-root/v0`
- Leaves: `sig_ed25519` is **null** (`NO_LAPTOP_SIGN`). Inclusion is membership in `card_sha256[]`.
- Intended DID fragment: `did:web:csoai.org#board-attestation-1` (assertionMethod, not a new key).
- GET `/api/xrpl` is a **reader** of this root (`writes_board` false). Same merkle, locked 16. Not a mill.
- Layer-0 may seal THIS root document. That is not a laptop/keystone card signature on the leaves.
- Do not stamp MEASURED from this catalogue. Do not claim a three-host checksum until HF+GitHub copies exist.

## Measurement witnesses

Honest pointer (unsigned): [`/interop/root-witness-pointer.json`](./interop/root-witness-pointer.json)

- Live sidecar (200): [`/interop/root-witness-2026-09-02.json`](./interop/root-witness-2026-09-02.json)
- OTS proof file (200) for **prior** root bytes: [`/interop/root-2026-09-02.json.ots`](./interop/root-2026-09-02.json.ots)
- Rekor snapshot (200): [`/interop/rekor-root-2026-09-02.json`](./interop/rekor-root-2026-09-02.json)

**Drift:** live root merkle/sha256 ≠ witness artifact (root moved after B1). Against **current** live root, OTS is **UNCHECKABLE** (covers prior bytes; do not invent a matching `.ots` / Rekor UUID). Wrong name `root-witness-2026-09-02.json.ots` is 404.

