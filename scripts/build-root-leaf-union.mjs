/**
 * The union of every coverage-leaf digest any published public-root has committed to.
 *
 * WHAT public/root.json ACTUALLY IS — established 2026-09-04 by reading its own fields:
 *   sources: ["https://xrpl.fi/api/metrics"], kind: csoai.public-root/v1,
 *   leaf_definition: a whole-card digest, with coverage-harvest—not grade—language.
 * It is a COVERAGE SNAPSHOT. Each leaf is also the canonical card SHA-256 stored inside a
 * public/cards/<first16>.json wrapper. A card may be individually signed or unsigned; inclusion
 * in a signed root binds the snapshot, but does not turn the card into a GSPC measurement.
 *
 * A CORRECTION THIS FILE EXISTS TO CARRY: an earlier reading treated root.json's card_sha256 as
 * card identifiers, fetched the full digest as a URL, got 404s, and reported that signed cards had
 * been silently deleted. The deletion claim was wrong: the published resolver uses the first 16
 * hex characters, and every union entry must resolve through it before this builder will emit.
 *
 * What this artifact adds, honestly: the rolling head shows only the current snapshot, so a reader
 * cannot see what an earlier root committed to. This retains the union so they can. It is NOT an
 * argument that the root should be append-only.
 *
 *   node scripts/build-root-leaf-union.mjs [--url <root-history.json>]
 *
 * Release builds always consume the root-history bytes in this checkout. A remote
 * history is useful for an explicit audit, but it must never silently make a build
 * depend on whichever older snapshot happens to be deployed.
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const HISTORY = args.includes("--url")
  ? args[args.indexOf("--url") + 1]
  : "public/receipts/root-history.json";
const OUT = "public/signed/public-root-leaf-union.json";

if (!HISTORY) {
  console.error("✖ --url requires a value");
  process.exit(2);
}

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

const history = existsSync(HISTORY)
  ? JSON.parse(readFileSync(HISTORY, "utf8"))
  : await (await fetch(HISTORY, { headers: { "user-agent": "csoai-log-builder/0.1 (+https://councilof.ai)" } })).json();

const roots = [...(history.roots ?? [])].sort((a, b) => String(a.as_of).localeCompare(String(b.as_of)));
const seen = new Map();               // coverage-leaf digest -> the first root that committed to it
for (const r of roots)
  for (const c of r.card_sha256 ?? [])
    if (!seen.has(c)) seen.set(c, { as_of: r.as_of, merkle_root: r.merkle_root });

const entries = [...seen.entries()].map(([leafDigest, first], i) => ({
  index: i,
  leaf_digest_sha256: leafDigest,
  first_rooted: first.as_of,
  first_root: first.merkle_root,
}));

let individuallySigned = 0;
for (const entry of entries) {
  const cardPath = `public/cards/${entry.leaf_digest_sha256.slice(0, 16)}.json`;
  if (!existsSync(cardPath)) {
    console.error(`✖ coverage leaf has no public card wrapper: ${entry.leaf_digest_sha256}`);
    process.exit(1);
  }
  const wrapper = JSON.parse(readFileSync(cardPath, "utf8"));
  if (wrapper?.card?.sha256 !== entry.leaf_digest_sha256) {
    console.error(`✖ card wrapper does not bind coverage leaf: ${cardPath}`);
    process.exit(1);
  }
  if (/^[0-9a-f]{128}$/u.test(String(wrapper.card.sig_ed25519 ?? ""))) individuallySigned += 1;
}
const root = merkleRoot(entries.map((e) => e.leaf_digest_sha256));
const checkpoint = `councilof.ai/public-root-leaves\n${entries.length}\n${root.toString("base64")}\n`;

// Refuse to shrink. A log that can lose an entry is not a log.
if (existsSync(OUT)) {
  const prev = JSON.parse(readFileSync(OUT, "utf8"));
  if (entries.length < (prev.size ?? 0)) {
    console.error(`✖ refusing to emit: size would fall from ${prev.size} to ${entries.length}`);
    process.exit(1);
  }
  // Read the legacy `card` key so the terminology correction cannot erase history.
  const prevLeaves = new Set((prev.entries ?? []).map((e) => e.leaf_digest_sha256 ?? e.card));
  const lost = [...prevLeaves].filter((c) => !seen.has(c));
  if (lost.length) {
    console.error(`✖ refusing to emit: ${lost.length} entr(y|ies) present in the previous log are absent now`);
    process.exit(1);
  }
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  schema: "councilof.ai/coverage-leaf-union/1",
  what_this_is: "The first-seen union of canonical public-card SHA-256 identifiers carried as coverage leaves by published public-root snapshots. Every identifier resolves to its public card wrapper through the declared first-16 path rule.",
  what_this_is_not: "Not proof that every card is individually signed, measured, current, or correct; not proof of the underlying observation, a Transparency Service, or certification.",
  derived_from: HISTORY === "public/receipts/root-history.json"
    ? "/receipts/root-history.json"
    : HISTORY,
  source_field_note: "Historical roots call this array card_sha256. Each value is the canonical whole-card digest defined by the root leaf rule. Some cards describe external XRPL observations; the digest is an identifier, not a grade.",
  resolution: {
    path_template: "/cards/{card_sha256_first_16}.json",
    resolved_card_wrappers: entries.length,
    individually_signed_card_wrappers: individuallySigned,
    unsigned_card_wrappers: entries.length - individuallySigned,
    note: "The root signature binds snapshot membership and card_count. Individual card signatures are counted separately and absence remains explicit.",
  },
  source_roots: roots.length,
  size: entries.length,
  merkle_root_sha256: root.toString("hex"),
  checkpoint_c2sp: checkpoint,
  checkpoint_note: "C2SP tlog-checkpoint shape (origin, size, base64 root). Unsigned here; signing is GHA OIDC. A later checkpoint must never be inconsistent with an earlier one, and this builder refuses to emit a smaller log.",
  leaf_rule: "RFC 6962: leaf = SHA-256(0x00 || coverage_leaf_digest_bytes); node = SHA-256(0x01 || left || right).",
  as_of: new Date().toISOString().replace(/\.\d+Z$/, "Z"),
  entries,
}, null, 2) + "\n");

console.log(`  size            : ${entries.length} coverage-leaf digests (current snapshot declares ${roots.at(-1)?.card_count})`);
console.log(`  card wrappers   : ${entries.length} resolved (${individuallySigned} individually signed)`);
console.log(`  merkle root     : ${root.toString("hex")}`);
console.log(`  checkpoint      : ${JSON.stringify(checkpoint)}`);
console.log(`  wrote           : ${OUT}`);
