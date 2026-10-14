# Reproduce one GSPC-G2 card: no model, no GPU, no key

Artifact (one admitted, signed G2 card):
`https://councilof.ai/interop/mill-cards-signed/signed-governan-91857b0eb93f.json`
(file sha256 at time of writing: `91f5f6463fcc4739cd50d98532be6565930b44be3f1203b1afe63c9716eeeccd`)

Group: GSPC-G2 (its own comparison group; not board v2 and never mixed with it). Measurement, not certification.

## What you check
1. **Id.** `id == sha256(canonical(body))`. Canonical = JavaScript JSON with object keys sorted recursively, no whitespace (`{"a":1,"b":[2]}`), UTF-8. The card states this as `preimage_rule: "sha256(canonical body)"`.
2. **Signature.** `signature` (hex, 64 bytes) is Ed25519 over the same canonical body bytes, under the key named in `did`: `did:web:csoai.org#board-attestation-1`, resolved from `https://csoai.org/.well-known/did.json` (`publicKeyJwk`, OKP/Ed25519).
3. **Numbers.** `body.n` and `body.accuracy` are what the card says. Nothing here re-runs the model.

## Steps
```sh
node --version            # >= 18 (built-in fetch + crypto)
node verify-card.mjs      # or: node verify-card.mjs <other card URL>
echo $?                   # 0 = id matches and signature valid
```

## Real output (run 14 Oct 2026, ~13:15 BST)
```
card_url         https://councilof.ai/interop/mill-cards-signed/signed-governan-91857b0eb93f.json
card_file_sha256 91f5f6463fcc4739cd50d98532be6565930b44be3f1203b1afe63c9716eeeccd
did_method       did:web:csoai.org#board-attestation-1 x=k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA
id_claimed       91857b0eb93f82474daa57714f7875579bcaa16bef2a1f75b8989191326c13ae
id_recomputed    91857b0eb93f82474daa57714f7875579bcaa16bef2a1f75b8989191326c13ae
ID_MATCH         true
SIGNATURE_VALID  true
model / axis     ollama:gemma3:12b@sha256:b92b218582c521ba287f38f1d6057dcd3c6cbff036f13cac97b5d861f5e58ec3 / governance
n / accuracy     237 / 0.3629
```
Exit code: 0.

Tamper check (local copy with `body.n` changed 237 -> 238):
```
ID_MATCH         false
SIGNATURE_VALID  false
n / accuracy     238 / 0.3629
```
Exit code: 1.

## Script
```js
// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 COAI - Council of AIs (repo LICENSE, CSOAI-ORG/councilof-ai master 3139d7ad)
// Reproduce one GSPC card with no model: recompute id, verify Ed25519 vs did.json.
// Node >= 18, no dependencies. Usage: node verify-card.mjs [card_url]
import { createHash, createPublicKey, verify } from "node:crypto";
const CARD = process.argv[2] ||
  "https://councilof.ai/interop/mill-cards-signed/signed-governan-91857b0eb93f.json";
const DID = "https://csoai.org/.well-known/did.json";
const canon = (v) => Array.isArray(v) ? "[" + v.map(canon).join(",") + "]"
  : v && typeof v === "object"
    ? "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}"
    : JSON.stringify(v);
const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error(u + " " + r.status); return Buffer.from(await r.arrayBuffer()); };
const raw = await get(CARD);
const card = JSON.parse(raw);
const pre = Buffer.from(canon(card.body), "utf8");
const id = createHash("sha256").update(pre).digest("hex");
const did = JSON.parse(await get(DID));
const vm = did.verificationMethod.find((m) => m.id === card.did);
if (!vm) throw new Error("verification method not found: " + card.did);
const key = createPublicKey({ key: vm.publicKeyJwk, format: "jwk" });
const sigOk = verify(null, pre, key, Buffer.from(card.signature, "hex"));
console.log("card_url        ", CARD);
console.log("card_file_sha256", createHash("sha256").update(raw).digest("hex"));
console.log("did_method      ", vm.id, "x=" + vm.publicKeyJwk.x);
console.log("id_claimed      ", card.id);
console.log("id_recomputed   ", id);
console.log("ID_MATCH        ", id === card.id);
console.log("SIGNATURE_VALID ", sigOk);
console.log("model / axis    ", card.body.model, "/", card.body.axis);
console.log("n / accuracy    ", card.body.n, "/", card.body.accuracy);
process.exit(id === card.id && sigOk ? 0 : 1);
```

## Licence
- Script: MIT (SPDX header), per the repo root `LICENSE` at master 3139d7ad.
- Card data (the signed card JSON): CC-BY-4.0.

## Notes
- The repo's `packages/gspc-card-verifier/bin/gspc-verify.mjs` pins `#card-attestation-1` in its header and stops with `OUT_OF_PROFILE_DOMAIN` under `--profile csoai-gspc-1.json`, so it is not yet a working equivalent for board-key G2 cards. This file does not replace it.
- This card is not yet in a card root (latest root 2026-10-12, 1479 leaves, predates G2). Do not claim root inclusion.
