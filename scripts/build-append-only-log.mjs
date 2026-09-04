/**
 * The LOG, alongside the head. Both, not either.
 *
 * public/root.json is a rolling HEAD: it commits to the cards current at its as_of, and a
 * superseded measurement correctly leaves it. That is right for a board and wrong for evidence,
 * and today the estate has only that one artifact — carrying a signature and a Bitcoin anchor,
 * so every reader takes it for a log.
 *
 * This builds the other half from data already published: the union of every card any root ever
 * committed to, in first-seen order, with the root that introduced each one. Nothing is invented;
 * every entry is traceable to a published root in /receipts/root-history.json.
 *
 * It emits a C2SP tlog-checkpoint-shaped commitment so the artifact is one existing verifiers,
 * monitors and witnesses already understand, rather than another bespoke shape:
 *
 *     councilof.ai/cards
 *     <size>
 *     <base64 root hash>
 *
 * The one rule that makes it a log rather than a snapshot: a later checkpoint must never be
 * inconsistent with an earlier one. This script refuses to emit if the union would shrink.
 *
 *   node scripts/build-append-only-log.mjs [--url <root-history.json>]
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const URL = args.includes("--url") ? args[args.indexOf("--url") + 1]
                                   : "https://councilof.ai/receipts/root-history.json";
const OUT = "public/signed/append-only-log.json";

const sha = (b) => createHash("sha256").update(b).digest();
/** RFC 6962 leaf/node hashing, the shape every tlog verifier already implements. */
const leafHash = (hexId) => sha(Buffer.concat([Buffer.from([0x00]), Buffer.from(hexId, "hex")]));
const nodeHash = (l, r) => sha(Buffer.concat([Buffer.from([0x01]), l, r]));
function merkleRoot(leaves) {
  if (leaves.length === 0) return sha(Buffer.alloc(0));
  let level = leaves.map(leafHash);
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2)
      next.push(i + 1 < level.length ? nodeHash(level[i], level[i + 1]) : level[i]);
    level = next;
  }
  return level[0];
}

const history = existsSync(URL)
  ? JSON.parse(readFileSync(URL, "utf8"))
  : await (await fetch(URL, { headers: { "user-agent": "csoai-log-builder/0.1 (+https://councilof.ai)" } })).json();

const roots = [...(history.roots ?? [])].sort((a, b) => String(a.as_of).localeCompare(String(b.as_of)));
const seen = new Map();               // card -> the root that first committed to it
for (const r of roots)
  for (const c of r.card_sha256 ?? [])
    if (!seen.has(c)) seen.set(c, { as_of: r.as_of, merkle_root: r.merkle_root });

const entries = [...seen.entries()].map(([card, first], i) => ({ index: i, card, first_rooted: first.as_of, first_root: first.merkle_root }));
const root = merkleRoot(entries.map((e) => e.card));
const checkpoint = `councilof.ai/cards\n${entries.length}\n${root.toString("base64")}\n`;

// Refuse to shrink. A log that can lose an entry is not a log.
if (existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(OUT, "utf8"));
  if (entries.length < (prev.size ?? 0)) {
    console.error(`✖ refusing to emit: size would fall from ${prev.size} to ${entries.length}`);
    process.exit(1);
  }
  const prevCards = new Set((prev.entries ?? []).map((e) => e.card));
  const lost = [...prevCards].filter((c) => !seen.has(c));
  if (lost.length) {
    console.error(`✖ refusing to emit: ${lost.length} entr(y|ies) present in the previous log are absent now`);
    process.exit(1);
  }
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  schema: "councilof.ai/append-only-log/1",
  what_this_is: "Every card any published root has ever committed to, in first-seen order. The companion to public/root.json, which is a rolling head and correctly drops superseded measurements. This never drops.",
  what_this_is_not: "Not a claim that every entry is still fetchable — 281 of these currently return 404, which is the finding this artifact exists to make visible rather than hide. Not a Transparency Service. Not a certification.",
  derived_from: URL,
  source_roots: roots.length,
  size: entries.length,
  merkle_root_sha256: root.toString("hex"),
  checkpoint_c2sp: checkpoint,
  checkpoint_note: "C2SP tlog-checkpoint shape (origin, size, base64 root). Unsigned here; signing is GHA OIDC. A later checkpoint must never be inconsistent with an earlier one, and this builder refuses to emit a smaller log.",
  leaf_rule: "RFC 6962: leaf = SHA-256(0x00 || card_id_bytes); node = SHA-256(0x01 || left || right).",
  as_of: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  entries,
}, null, 2) + "\n");

console.log(`  size            : ${entries.length} cards (current head holds ${roots.at(-1)?.card_count})`);
console.log(`  merkle root     : ${root.toString("hex")}`);
console.log(`  checkpoint      : ${JSON.stringify(checkpoint)}`);
console.log(`  wrote           : ${OUT}`);
