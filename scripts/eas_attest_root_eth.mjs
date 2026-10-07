#!/usr/bin/env node
/**
 * EAS on ETHEREUM L1 — attest the ONE public root (belt-and-braces witness).
 * Mirrors eas_attest_root.mjs, adapted for mainnet v0.26 contracts.
 *
 *   EAS       0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587  (docs.attest.org, code-verified 19,971 B @ block 26138114, 2026-10-07)
 *   Registry  0xA7b39296258348C78294F95B872b282326A97BDF  (docs.attest.org, code-verified 1,976 B)
 *   schema    "bytes32 sha256,string as_of,string did"    (registered once per chain; UID derived)
 *
 * Guards (in order), every one of them fail-closed to an HONEST STATE WRITE, never a fake attestation:
 *   1. no EAS_ATTESTER_PRIVATE_KEY        -> status NOT_YET / no attester key
 *   2. already attested this root sha     -> exit 0, log untouched
 *   3. attester balance < 0.0004 ETH      -> status NOT_FUNDED (funding is owner-gated)
 *   4. gas price > 10 gwei                -> status WAITING_GAS (protects the ≤$2 cap)
 *   5. attest() on-chain, receipt checked -> status ATTESTED with uid + easscan URL
 *
 * The attester is the DEDICATED hot wallet 0x65910f9827e2a87c4acb961b35f33c09ee0c94f2
 * (created 2026-10-07; private key lives only in the GitHub secret). NEVER the owner wallet.
 * Maximum authorised spend for the whole L1 witness: $2.00.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const EAS_ADDR = "0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587";
const REGISTRY_ADDR = "0xA7b39296258348C78294F95B872b282326A97BDF";
const SCHEMA = "bytes32 sha256,string as_of,string did";
const OUT = "public/interop/eas-eth-root-attestations.json";
const MIN_BALANCE_WEI = 400000000000000n;   // 0.0004 ETH
const MAX_GAS_WEI = 10_000_000_000n;        // 10 gwei

const key = (process.env.EAS_ATTESTER_PRIVATE_KEY || "").trim();
const raw = readFileSync("public/root.json");
const root = JSON.parse(raw.toString("utf8"));
const sha = createHash("sha256").update(raw).digest("hex");
const fresh = {
  kind: "csoai.eas-eth-root-attestations/v0",
  chain: "ethereum-mainnet",
  eas: EAS_ADDR,
  schema: SCHEMA,
  attestations: [],
  status: "NOT_YET",
  reason: "not run",
  as_of: new Date().toISOString(),
};
const log = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : fresh;

function finish(state, reason) {
  if (log.status === state && log.reason === reason) {
    console.log(`L1 EAS: ${state} unchanged (${reason}) — bytes left as they are`);
    process.exit(0);
  }
  log.status = state;
  log.reason = reason;
  log.as_of = new Date().toISOString();
  writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n");
  console.log(`L1 EAS: ${state} — ${reason}`);
  process.exit(0);
}

if (!key) finish("NOT_YET", "no attester key in GitHub secrets");
if ((log.attestations || []).some((a) => a.sha256 === sha)) {
  console.log("L1 EAS: root already attested", sha.slice(0, 16));
  process.exit(0);
}

const [{ ethers }, { EAS, SchemaEncoder, SchemaRegistry }] = await Promise.all([
  import("ethers"),
  import("@ethereum-attestation-service/eas-sdk"),
]);

const provider = new ethers.JsonRpcProvider(
  process.env.ETH_RPC_URL || "https://ethereum-rpc.publicnode.com"
);

// Guard 3: balance
const balance = await provider.getBalance("0x65910f9827e2a87c4acb961b35f33c09ee0c94f2");
if (balance < MIN_BALANCE_WEI) {
  finish("NOT_FUNDED", `attester holds ${ethers.formatEther(balance)} ETH; needs >= 0.0004 (owner funds, cap $2.00)`);
}

// Guard 4: gas price
const feeData = await provider.getFeeData();
const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice ?? 0n;
if (gasPrice > MAX_GAS_WEI) {
  finish("WAITING_GAS", `maxFee ${ethers.formatUnits(gasPrice, "gwei")} gwei > 10 gwei cap — retry on a quiet block`);
}

const signer = new ethers.Wallet(key, provider);
const registry = new SchemaRegistry(REGISTRY_ADDR);
registry.connect(signer);
const uid = ethers.solidityPackedKeccak256(["string", "address", "bool"], [SCHEMA, ethers.ZeroAddress, true]);
let schemaUid = uid;
try {
  const s = await registry.getSchema({ uid });
  if (!s || s.uid === ethers.ZeroHash) throw new Error("absent");
} catch {
  console.log("L1 EAS: registering schema once…");
  const tx = await registry.register({ schema: SCHEMA, resolverAddress: ethers.ZeroAddress, revocable: true });
  await tx.wait();
  schemaUid = uid;
}

const eas = new EAS(EAS_ADDR);
eas.connect(signer);
const enc = new SchemaEncoder(SCHEMA);
const data = enc.encodeData([
  { name: "sha256", value: "0x" + sha, type: "bytes32" },
  { name: "as_of", value: String(root.as_of || ""), type: "string" },
  { name: "did", value: String(root.did_intended || ""), type: "string" },
]);
const attTx = await eas.attest({
  schema: schemaUid,
  data: { recipient: ethers.ZeroAddress, expirationTime: 0n, revocable: true, data },
});
const attUid = await attTx.wait();

log.status = "ATTESTED";
log.reason = "";
log.schema_uid = schemaUid;
log.as_of = new Date().toISOString();
log.attestations.unshift({
  sha256: sha,
  merkle_root: root.merkle_root,
  root_as_of: root.as_of,
  uid: attUid,
  url: `https://easscan.org/attestation/view/${attUid}`,
  attester: signer.address,
  gas_price_gwei: ethers.formatUnits(gasPrice, "gwei"),
  at: new Date().toISOString(),
});
writeFileSync(OUT, JSON.stringify(log, null, 1) + "\n");
console.log("L1 EAS: attested", sha.slice(0, 16), "uid", attUid);
