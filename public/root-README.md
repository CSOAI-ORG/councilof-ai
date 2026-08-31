# Public root (`/root.json`)

Living unsigned catalogue of card-v0 leaves. **Do not overwrite this file from this honesty PR.**

- Kind: `csoai.public-root/v0`
- Leaves: `sig_ed25519` is **null** (`NO_LAPTOP_SIGN`). Inclusion is membership in `card_sha256[]`.
- Intended DID fragment: `did:web:csoai.org#board-attestation-1` (assertionMethod, not a new key).
- GET `/api/xrpl` stays **404** until it would serve the same 16 as this root.
- Layer-0 may seal THIS root document. That is not a laptop/keystone card signature on the leaves.
- Do not stamp MEASURED from this catalogue. Do not claim a three-host checksum until HF+GitHub copies exist.
