/**
 * The union of every leaf any published public-root has committed to.
 *
 * WHAT public/root.json ACTUALLY IS — established 2026-09-04 by reading its own fields:
 *   sources: ["https://xrpl.fi/api/metrics"], kind: csoai.public-root/v1,
 *   note: "Envelope schema is public-root-v0, not card-v0 ... coverage harvest, not grade".
 * It is a COVERAGE SNAPSHOT of live external XRPL data. Its leaf set changes because the data
 * changes, which is correct. Its 140 leaves do not intersect the 335 gspc.measurement-card ids
 * under public/signed/cards/ at all — different populations, different schemas.
 *
 * A CORRECTION THIS FILE EXISTS TO CARRY: an earlier reading treated root.json's card_sha256 as
 * card identifiers, fetched them as URLs, got 404s, and reported that 281 signed cards had been
 * silently deleted. That was wrong on every count — they are leaf digests under the root's own
 * published leaf_definition and were never fetchable. The union below is still a true statement
 * about what past roots committed to. The alarm attached to it was not.
 *
 * What this artifact adds, honestly: the rolling head shows only the current snapshot, so a reader
 * cannot see what an earlier root committed to. This retains the union so they can. It is NOT an
 * argument that the root should be append-only.
 *
 *   node scripts/build-root-leaf-union.mjs [--url <root-history.json>]
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const URL = args.includes("--url") ? args[args.indexOf("--url") + 1]
                                   : "https://councilof.ai/receipts/root-history.json";
const OUT = "public/signed/public-root-leaf-union.json";

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
const checkpoint = `councilof.ai/public-root-leaves\n${entries.length}\n${root.toString("base64")}\n`;

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
