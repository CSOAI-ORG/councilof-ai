#!/usr/bin/env node
/**
 * EAS on Base — attest the ONE public root per publish. Fails closed without a key.
 *   schema: "bytes32 sha256,string as_of,string did"  (registered once; UID derived)
 *   attests { sha256(root.json), root.as_of, did_intended } — existence/time of bytes, not certification.
 * Needs: EAS_ATTESTER_PRIVATE_KEY (dedicated hot wallet, dust-funded; NEVER the owner's main wallet),
 *        optional BASE_RPC_URL (default https://mainnet.base.org). Writes public/interop/eas-root-attestations.json.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { ethers } from "ethers";
import { EAS, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";

const EAS_ADDR = "0x4200000000000000000000000000000000000021";      // Base mainnet (OP-stack predeploy)
const REGISTRY_ADDR = "0x4200000000000000000000000000000000000020";
const SCHEMA = "bytes32 sha256,string as_of,string did";
const OUT = "public/interop/eas-root-attestations.json";

const key = (process.env.EAS_ATTESTER_PRIVATE_KEY || "").trim();
const raw = readFileSync("public/root.json");
const root = JSON.parse(raw.toString("utf8"));
const sha = createHash("sha256").update(raw).digest("hex");
const log = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { kind: "csoai.eas-root-attestations/v0", chain: "base-mainnet", eas: EAS_ADDR, schema: SCHEMA, attestations: [] };

if (!key) {
  console.log("EAS: no EAS_ATTESTER_PRIVATE_KEY — NOT_YET (fail closed, nothing attested)");
  log.status = "NOT_YET"; log.reason = "no attester key in GitHub secrets"; log.as_of = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n"); process.exit(0);
}
if (log.attestations.some((a) => a.sha256 === sha)) { console.log("EAS: root already attested", sha.slice(0, 16)); process.exit(0); }

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org");
const signer = new ethers.Wallet(key, provider);
const registry = new SchemaRegistry(REGISTRY_ADDR); registry.connect(signer);
const uid = ethers.solidityPackedKeccak256(["string", "address", "bool"], [SCHEMA, ethers.ZeroAddress, true]);
let schemaUid = uid;
try { const s = await registry.getSchema({ uid }); if (!s || s.uid === ethers.ZeroHash) throw new Error("absent"); }
catch { console.log("EAS: registering schema once…"); const tx = await registry.register({ schema: SCHEMA, resolverAddress: ethers.ZeroAddress, revocable: true }); schemaUid = await tx.wait(); }
const eas = new EAS(EAS_ADDR); eas.connect(signer);
const enc = new SchemaEncoder(SCHEMA);
const data = enc.encodeData([{ name: "sha256", value: "0x" + sha, type: "bytes32" }, { name: "as_of", value: String(root.as_of || ""), type: "string" }, { name: "did", value: String(root.did_intended || ""), type: "string" }]);
const tx = await eas.attest({ schema: schemaUid, data: { recipient: ethers.ZeroAddress, expirationTime: 0n, revocable: true, data } });
const attUid = await tx.wait();
log.status = "ATTESTED"; log.schema_uid = schemaUid; log.as_of = new Date().toISOString();
log.attestations.unshift({ sha256: sha, merkle_root: root.merkle_root, root_as_of: root.as_of, uid: attUid, url: `https://base.easscan.org/attestation/view/${attUid}`, attester: signer.address, at: new Date().toISOString() });
writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n");
console.log("EAS: attested", sha.slice(0, 16), "uid", attUid);
