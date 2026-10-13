#!/usr/bin/env node
/**
 * EAS on Base — attest the ONE public root per publish. Fails closed without a key.
 *   schema: "bytes32 sha256,string as_of,string did"  (registered once; UID derived)
 *   attests { sha256(root.json), root.as_of, did_intended } — existence/time of bytes, not certification.
 * Needs: EAS_ATTESTER_PRIVATE_KEY (dedicated hot wallet, dust-funded; NEVER the owner's main wallet),
 *        optional BASE_RPC_URL (default https://mainnet.base.org). Writes public/interop/eas-root-attestations.json.
 *
 * The log is written only when its state changes. It is a stamped public file: its .ots proves
 * exact bytes, and root-witness-release-gate.py checks every public .ots against its target.
 * Rewriting it on every publish just to restate NOT_YET with a fresh as_of moved the bytes off
 * the proof, and the gate blocked every public-root run of 5–6 Oct 2026 (runs 37376012173,
 * 37403227482, 37447955940) on "public .ots digest mismatch". The per-root EAS state is recorded
 * where it belongs, in the exact-root witness sidecar (witness_public_root.py --refresh-eas).
 * When an attestation is appended, the log really changes; the workflow then re-stamps it and
 * keeps the old bytes + old proof as a dated pair (scripts/ots_restamp_ledger.py).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const EAS_ADDR = "0x4200000000000000000000000000000000000021";      // Base mainnet (OP-stack predeploy)
const REGISTRY_ADDR = "0x4200000000000000000000000000000000000020";
const SCHEMA = "bytes32 sha256,string as_of,string did";
const OUT = "public/interop/eas-root-attestations.json";
const NOT_YET_REASON = "no attester key in GitHub secrets";

const key = (process.env.EAS_ATTESTER_PRIVATE_KEY || "").trim();
const raw = readFileSync("public/root.json");
const root = JSON.parse(raw.toString("utf8"));
const sha = createHash("sha256").update(raw).digest("hex");
const log = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { kind: "csoai.eas-root-attestations/v0", chain: "base-mainnet", eas: EAS_ADDR, schema: SCHEMA, attestations: [] };

if (!key) {
  if (existsSync(OUT) && log.status === "NOT_YET" && log.reason === NOT_YET_REASON) {
    // Same state as already recorded: nothing new to write. as_of stays the time NOT_YET was recorded.
    console.log(`EAS: no EAS_ATTESTER_PRIVATE_KEY — NOT_YET, unchanged since ${log.as_of || "(no as_of)"}; log bytes left as they are (fail closed, nothing attested)`);
    process.exit(0);
  }
  console.log("EAS: no EAS_ATTESTER_PRIVATE_KEY — NOT_YET (fail closed, nothing attested)");
  log.status = "NOT_YET"; log.reason = NOT_YET_REASON; log.as_of = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n"); process.exit(0);
}
if (log.attestations.some((a) => a.sha256 === sha)) { console.log("EAS: root already attested", sha.slice(0, 16)); process.exit(0); }

// Dependencies are needed only for the explicit owner-funded EAS branch. ethers
// loads first (ESM-clean) so the funding guards can defer an unfunded or expensive
// attempt WITHOUT touching eas-sdk: its ESM build pulls lodash by named import,
// which Node's CJS interop rejects (lodash assigns properties at runtime, so the
// static lexer finds no named exports). eas-sdk therefore loads only AFTER the
// guards pass, immediately before attestation, and the workflow patches lodash
// interop + functionally verifies the import before this line can ever run.
const { ethers } = await import("ethers");

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org");
const signer = new ethers.Wallet(key, provider);
// Funding guards (added 2026-10-07, the day the attester key first landed in secrets).
// Without them an unfunded attester would attempt schema registration, revert, and
// fail the whole publish step. An honest state write keeps the root ticking; the
// state is written ONLY when it actually changes (the .ots beside this log must
// keep proving the same bytes — see the header note).
{
  const balance = await provider.getBalance(signer.address);
  const NOT_FUNDED = "attester wallet holds < 0.0004 ETH — owner funds the dedicated hot wallet (expected ~$0.001/attest at observed gas, cap $0.05)";
  if (balance < 400000000000000n) {
    if (!(log.status === "NOT_FUNDED" && log.reason === NOT_FUNDED)) {
      log.status = "NOT_FUNDED"; log.reason = NOT_FUNDED; log.as_of = new Date().toISOString();
      writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n");
    }
    console.log(`EAS: NOT_FUNDED — attester ${signer.address} holds ${ethers.formatEther(balance)} ETH; nothing attempted`);
    process.exit(0);
  }
  const feeData = await provider.getFeeData();
  const gp = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
  const WAITING = "maxFee above 10 gwei — retry on a quiet block (cap protection)";
  if (gp > 10_000_000_000n) {
    if (!(log.status === "WAITING_GAS" && log.reason === WAITING)) {
      log.status = "WAITING_GAS"; log.reason = WAITING; log.as_of = new Date().toISOString();
      writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n");
    }
    console.log(`EAS: WAITING_GAS — ${ethers.formatUnits(gp, "gwei")} gwei > 10 gwei; nothing attempted`);
    process.exit(0);
  }
} // end funding guards

// Load eas-sdk only now: key present, root not yet attested, balance >= 0.0004 ETH,
// maxFee <= 10 gwei. A module-load failure here is a genuine infrastructure fault on
// the funded path and fails the step loudly (fail closed) - the workflow has already
// verified this import loads.
const { EAS, SchemaEncoder, SchemaRegistry } = await import("@ethereum-attestation-service/eas-sdk");
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
