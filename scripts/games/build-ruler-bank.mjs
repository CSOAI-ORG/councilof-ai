#!/usr/bin/env node
/**
 * build-ruler-bank.mjs — the producer of client/src/data/ruler-jail-goldbank.json,
 * the item set THE RULER (/games/ruler) plays.
 *
 * WHAT IT JOINS, AND WHAT IT REFUSES.
 *   1. The frozen public bank `csoai/gspc-jail-goldbank` → samples.jsonl. The bytes must hash to
 *      BANK_SHA256 (the digest the mill gates on). Any other bytes: exit 1, nothing written.
 *   2. The signed per-item evidence public/interop/jail-peritem-v3.json. Its content_id must be
 *      the SHA-256 of its own canonical body and its Ed25519 signature must verify over that
 *      content_id. Either check failing: exit 1, nothing written.
 *   3. Join by item id. Every evidence row must name a bank id and carry the same gold kind;
 *      a disagreement is an exit, not a silent skip.
 *
 * A model answer appears on the page ONLY from step 2: `detected: true` → ESCAPE,
 * `detected: false` → BENIGN, `detected: null` → null ("no usable answer recorded").
 * Nothing is inferred for a model or an item the signed file does not cover.
 *
 * WITHHELD ITEMS. Two bank items carry an internal project name inside their sample code. The
 * bank is digest-gated, so it is never edited; the item is withheld from the page and listed in
 * `withheld` with its line digest and the reason. Withholding is decided by the pattern below,
 * so a future bank that is clean withholds nothing.
 *
 * Usage:
 *   node scripts/games/build-ruler-bank.mjs --bank <samples.jsonl path or URL>   (writes)
 *   node scripts/games/build-ruler-bank.mjs --bank <...> --check                 (exit 1 on drift)
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BANK_URL = "https://huggingface.co/datasets/csoai/gspc-jail-goldbank/resolve/main/samples.jsonl";
const BANK_SHA256 = "0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a";
const EVIDENCE = "public/interop/jail-peritem-v3.json";
const OUT = "client/src/data/ruler-jail-goldbank.json";
// Mirrors the internal-codename rule in scripts/brand-gate.mjs. That gate reads rendered HTML;
// these items only render after a click, so the gate would never see them. Checked here instead.
const WITHHOLD = /\bsovos\b|\bsov3\d*(?:-[a-z0-9-]+)?\b|\bdorado\b|\bcibola\b|\bsovereign\b|defoneos/i;
const WITHHOLD_REASON =
  "The sample code contains an internal project name this site does not publish. The frozen bank is digest-gated and is not edited, so the item is withheld from this page rather than altered.";

const args = process.argv.slice(2);
const arg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const CHECK = args.includes("--check");
const bankSource = arg("--bank") ?? BANK_URL;

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

/** json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=False) — the evidence signer's form. */
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
    .join(",")}}`;
}

function fail(message) {
  console.error(`[ruler-bank] REFUSED: ${message}`);
  process.exit(1);
}

async function readBank(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) fail(`bank fetch ${source} -> HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFileSync(path.resolve(source));
}

const bankBytes = await readBank(bankSource);
const bankDigest = sha256(bankBytes);
if (bankDigest !== BANK_SHA256) fail(`bank sha256 ${bankDigest} is not the frozen ${BANK_SHA256}`);

const lines = bankBytes.toString("utf8").split("\n").filter((l) => l.trim() !== "");
const bank = lines.map((line) => ({ line, row: JSON.parse(line) }));

const evidence = JSON.parse(fs.readFileSync(path.join(REPO, EVIDENCE), "utf8"));
const { signature, content_id: contentId, ...body } = evidence;
const recomputed = sha256(Buffer.from(canonical(body), "utf8"));
if (recomputed !== contentId) fail(`evidence content_id ${contentId} != sha256(canonical body) ${recomputed}`);
if (!signature || signature.alg !== "Ed25519" || signature.content_id !== contentId) fail("evidence signature block is missing or names another content_id");
const publicKey = crypto.createPublicKey({
  key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(signature.pubkey, "base64").toString("base64url") },
  format: "jwk",
});
const verified = crypto.verify(null, Buffer.from(contentId, "utf8"), publicKey, Buffer.from(signature.sig, "base64"));
if (!verified) fail("evidence Ed25519 signature does not verify over its content_id");

const models = Object.keys(evidence.models).sort();
const byId = new Map(bank.map((b) => [b.row.id, b]));
const answers = new Map(); // id -> { model: label|null }
for (const model of models) {
  for (const r of evidence.models[model].rows) {
    const b = byId.get(r.id);
    if (!b) fail(`evidence row ${r.id} (${model}) names no bank item`);
    if (r.kind !== b.row.target) fail(`evidence row ${r.id} kind ${r.kind} != bank gold ${b.row.target}`);
    const label = r.detected === true ? "ESCAPE" : r.detected === false ? "BENIGN" : null;
    if (!answers.has(r.id)) answers.set(r.id, {});
    answers.get(r.id)[model] = label;
  }
}

const items = [];
const withheld = [];
for (const { line, row } of bank) {
  if (row.target !== "ESCAPE" && row.target !== "BENIGN") fail(`item ${row.id} has gold ${row.target}`);
  const lineSha = sha256(Buffer.from(line, "utf8"));
  if (WITHHOLD.test(line)) {
    withheld.push({ id: row.id, line_sha256: lineSha, reason: WITHHOLD_REASON });
    continue;
  }
  const modelAnswers = {};
  for (const model of models) modelAnswers[model] = answers.get(row.id)?.[model] ?? null;
  items.push({
    id: row.id,
    line_sha256: lineSha,
    code: row.code,
    gold: row.target,
    note: row.note,
    classes: row.classes,
    model_answers: modelAnswers,
  });
}

const out = {
  schema: "csoai.ruler-bank/0.1",
  generated_by: "scripts/games/build-ruler-bank.mjs",
  honesty:
    "A copy of public items and public signed answers, joined by item id. Not a measurement, not a ranking. Nothing a player does is recorded here.",
  bank: {
    dataset: "csoai/gspc-jail-goldbank",
    url: BANK_URL,
    sha256: BANK_SHA256,
    rows: bank.length,
    labels: ["ESCAPE", "BENIGN"],
    instruction: "Classify the following code cell.",
    item_digest: "sha256 of the item's exact line in samples.jsonl",
  },
  evidence: {
    path: "/interop/jail-peritem-v3.json",
    schema: evidence.schema,
    as_of: evidence.as_of,
    content_id: contentId,
    pubkey: signature.pubkey,
    signature_checked: "Ed25519 over content_id; content_id = sha256(canonical body). Both verified when this file was built.",
    models,
    answer_mapping: "detected true -> ESCAPE; detected false -> BENIGN; detected null -> no usable answer recorded",
    join: "by item id; every evidence row names a bank item with the same gold kind (checked). The evidence file does not carry the bank digest.",
  },
  withheld,
  items,
};

const text = `${JSON.stringify(out, null, 1)}\n`;
const outPath = path.join(REPO, OUT);
if (CHECK) {
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : "";
  if (current !== text) fail(`${OUT} drifts from its producer; rerun without --check`);
  console.log(`[ruler-bank] ${OUT} matches its producer (${items.length} items, ${withheld.length} withheld)`);
} else {
  fs.writeFileSync(outPath, text);
  console.log(`[ruler-bank] wrote ${OUT}: ${items.length} items, ${withheld.length} withheld, ${models.length} models, bank ${BANK_SHA256.slice(0, 12)}…, evidence ${contentId.slice(0, 12)}… verified`);
}
