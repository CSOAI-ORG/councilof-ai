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
