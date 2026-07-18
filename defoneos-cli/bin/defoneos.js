#!/usr/bin/env node
/*
 * DEFONEOS sovereign assurance CLI.
 * CSOAI Ltd (UK 16939677) · Crown Lineage 1795→2026
 * Care Floor 0.95 · BFT 12-around-1 · SIGIL Ed25519+PQC
 * License: MIT + CC0
 */
const { keypair, canonicalJSON, edSign, sha256Hex } = require('../lib/crypto.js');
const { fingerprint } = require('../lib/sig.js');
const { buildSystemCard, buildModelCard } = require('../lib/builder.js');

const HELP = `
@defoneos/registry — sovereign AI assurance CLI

USAGE
  defoneos init               generate fresh sovereign keypair at ~/.sovereign/keys/ed25519.key
  defoneos sign-system  --out <path> --framework jsp936       sign a DEFONEOS System Card (synthetic demo)
  defoneos sign-model   --out <path> --framework neurips2025   sign a DEFINE Model Card (synthetic demo)
  defoneos verify       --card <path> --signature <sig> --pubkey <hex>
  defoneos fingerprint  --pubkey <hex>          print the sovereign key fingerprint
  defoneos version       print version + license

ENVIRONMENT
  DEFONEOS_KEY_DIR    override the key directory (default ~/.sovereign/keys)
  DEFONEOS_KEY_NAME    override the key filename (default ed25519.key)

EXAMPLES
  $ defoneos sign-system --out mycard.json --framework jsp936 > mycard.signed.json
  $ defoneos verify --card mycard.json --signature <sig> --pubkey <hex>

Crown Lineage 1795→2026. UK CSOAI 16939677. Care Floor 0.95.
`;

async function cmd_init() {
  const { ensureKeys } = require('../lib/keys.js');
  const { pubHex, seed } = ensureKeys();
  console.log("# Sovereign key pair generated");
  console.log("public_key_hex   :", pubHex);
  console.log("sovereign_fp16   :", fingerprint(pubHex));
  console.log("# Run 'defoneos sign-system --out <path>' to issue your first card.");
}

async function cmd_sign_system(opts) {
  const out = opts.out || "sovereign-system-card.signed.json";
  const card = buildSystemCard({
    framework: opts.framework || "jsp936",
    synthetic: true,
    issued_at: new Date().toISOString(),
  });
  const { ensureKeys } = require('../lib/keys.js');
  const { priv, pubHex } = ensureKeys();
  const canonical = canonicalJSON(card);
  // Sign the canonical JSON directly (Ed25519 over raw bytes — same scheme
  // as the live signing backend at os.meok.ai/api/verify).
  const sha = sha256Hex(canonical);
  const sig = edSign(priv, canonical);
  const envelope = {
    spec: "defoneos.systemcard/v1",
    alg: "ed25519",
    signer_fingerprint: fingerprint(pubHex),
    sha256: sha,
    signed_at: new Date().toISOString(),
    card,
    canonical,
    signature: sig,
    publicKey: pubHex,
  };
  const fs = require('fs');
  fs.writeFileSync(out, JSON.stringify(envelope, null, 2));
  console.log(`# wrote ${out}`);
  console.log(`# sovereign_fp: ${fingerprint(pubHex)}`);
  console.log(`# sha256        : ${sha}`);
  console.log(`# signature     : ${sig.slice(0, 24)}...`);
}

async function cmd_sign_model(opts) {
  const out = opts.out || "sovereign-model-card.signed.json";
  const card = buildModelCard({
    framework: opts.framework || "neurips2025",
    synthetic: true,
    issued_at: new Date().toISOString(),
  });
  const { ensureKeys } = require('../lib/keys.js');
  const { priv, pubHex } = ensureKeys();
  const canonical = canonicalJSON(card);
  // Sign the canonical JSON directly (Ed25519 over raw bytes — same scheme
  // as the live signing backend at os.meok.ai/api/verify).
  const sha = sha256Hex(canonical);
  const sig = edSign(priv, canonical);
  const envelope = {
    spec: "defoneos.modelcard/v1",
    alg: "ed25519",
    signer_fingerprint: fingerprint(pubHex),
    sha256: sha,
    signed_at: new Date().toISOString(),
    card,
    canonical,
    signature: sig,
    publicKey: pubHex,
  };
  const fs = require('fs');
  fs.writeFileSync(out, JSON.stringify(envelope, null, 2));
  console.log(`# wrote ${out}`);
  console.log(`# sovereign_fp: ${fingerprint(pubHex)}`);
}

async function cmd_verify(opts) {
  if (!opts.card || !opts.signature || !opts.pubkey) {
    console.error("--card <path> --signature <sig> --pubkey <hex>");
    process.exit(2);
  }
  const fs = require('fs');
  let data = JSON.parse(fs.readFileSync(opts.card, "utf8"));
  let msg = (opts.message) || data.canonical;
  if (typeof msg !== "string") msg = JSON.stringify(data);
  const { edVerify, edVerifySync, sha256Hex } = require('../lib/crypto.js');
  // First sync structural check (cheap)
  if (!edVerifySync(opts.pubkey, opts.signature, msg)) {
    console.log(JSON.stringify({ valid: false, reason: "structural_check_failed" }, null, 2));
    process.exit(1);
  }
  // Then defer to live backend for cryptographic verification
  const ok = await edVerify(opts.pubkey, opts.signature, msg);
  console.log(JSON.stringify({
    valid: ok,
    sovereign_fp_of_signer: fingerprint(opts.pubkey),
    card_fp16_of_message: sha256Hex(msg).slice(0, 16),
    verified_via: process.env.DEFONEOS_VERIFY_URL || "https://os.meok.ai/api/verify",
  }, null, 2));
  process.exit(ok ? 0 : 1);
}

function cmd_fingerprint(opts) {
  if (!opts.pubkey) {
    console.error("--pubkey <hex>");
    process.exit(2);
  }
  console.log(fingerprint(opts.pubkey));
}

function cmd_version() {
  console.log("@defoneos/registry 0.1.0");
  console.log("License: MIT + CC0");
  console.log("UK CSOAI 16939677 · Crown Lineage 1795-2026");
}

function parseArgs(argv) {
  const opts = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      opts[a.slice(2)] = argv[i + 1] || true;
      i++;
    } else {
      opts._.push(a);
    }
  }
  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const sub = opts._[0];
  if (!sub || sub === "help" || sub === "--help") { console.log(HELP); return; }
  if (sub === "version") return cmd_version();
  if (sub === "init") return cmd_init();
  if (sub === "sign-system") return cmd_sign_system(opts);
  if (sub === "sign-model") return cmd_sign_model(opts);
  if (sub === "verify") return cmd_verify(opts);
  if (sub === "fingerprint") return cmd_fingerprint(opts);
  console.error(`Unknown subcommand: ${sub}`);
  console.log(HELP);
  process.exit(1);
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(2); });
