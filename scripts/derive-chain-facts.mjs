#!/usr/bin/env node
/**
 * derive-chain-facts — recompute, from the published bytes, every number the site
 * says about the signed card chain. Nothing here is typed; every field is counted
 * or cryptographically checked at derivation time.
 *
 * WHY THIS EXISTS
 * The copy lane needed to say three things a reader can check: how many card bodies
 * are published, how many verify, and how much of the withheld set is actually
 * attested by a signature rather than merely asserted by a manifest. Every one of
 * those had previously been a hand-typed number on a page, and two of them were
 * wrong (/signed/HOW-TO-VERIFY.md still says "these 150 cannot be migrated" beside
 * its own "313 published"). A page may not type a count, so the count is derived
 * here, committed as an artifact, and served through /api/state.
 *
 * THE ONE THAT MATTERS: `withheld_attested_by_published_parent`.
 * /signed/chain.json lists all 335 positions and says a withheld card is "visible,
 * counted and ordered" rather than absent. That is true of the MANIFEST. But the
 * manifest carries no signature of its own, so a reader who trusts only signatures
 * gets a much smaller guarantee: a withheld id is cryptographically attested only
 * when some PUBLISHED card's signed body names it as `prev`. That is a different
 * number and it is computed here rather than assumed. Saying "the chain proves the
 * withheld cards existed" without this number would be exactly the estate's
 * signature defect — a manifest standing where a signature belongs.
 *
 * Run:  node scripts/derive-chain-facts.mjs
 * Out:  public/signed/chain-facts.json   (derived; safe to regenerate any time)
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyCard } from "../public/signed/verify-card.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const signedDir = join(root, "public", "signed");
const cardsDir = join(signedDir, "cards");

const chain = JSON.parse(readFileSync(join(signedDir, "chain.json"), "utf8"));
const index = JSON.parse(readFileSync(join(signedDir, "card_index.json"), "utf8"));

// ── every published body, verified with the SHIPPED verifier ────────────────
// Using the same file a stranger downloads is the point: if this script needed a
// private canonicaliser, the published verifier would not be the real one.
const files = readdirSync(cardsDir).filter((f) => f.endsWith(".json"));
const tally = { VALID: 0, INVALID: 0, UNCHECKABLE: 0 };
const signedParents = new Set();
const pubkeys = new Set();
for (const f of files) {
  const card = JSON.parse(readFileSync(join(cardsDir, f), "utf8"));
  const r = await verifyCard(card);
  tally[r.state] = (tally[r.state] ?? 0) + 1;
  if (card?.pubkey) pubkeys.add(card.pubkey);
  // `prev` lives INSIDE the body, so it is covered by the card's signature.
  if (r.state === "VALID" && card?.body?.prev) signedParents.add(card.body.prev);
}

// ── the chain manifest, recounted rather than read off its own header ────────
const links = Array.isArray(chain.links) ? chain.links : [];
const withheld = links.filter((l) => l.body_published === false).map((l) => l.id);
const published = links.filter((l) => l.body_published !== false).length;
const withheldAttested = withheld.filter((id) => signedParents.has(id));

// A top-level signature over the manifest is what would make the ORDER itself
// attested. There is none, and that absence is published rather than glossed.
const manifestSigned = ["sig", "signature", "custody_attestation", "jws"].some(
  (k) => chain[k] !== undefined,
);

const indexRows = Array.isArray(index.cards) ? index.cards : [];
const indexResolves = indexRows.filter((r) =>
  files.includes(`${r.card ?? r.id}.json`),
).length;

const out = {
  schema: "csoai.card-chain-facts/1",
  kind: "derived",
  note:
    "Every number in this file was counted or cryptographically verified from the bytes in " +
    "public/signed/ at derivation time by scripts/derive-chain-facts.mjs. None was typed. " +
    "Regenerate it rather than editing it.",
  derived_from: [
    "public/signed/chain.json",
    "public/signed/card_index.json",
    "public/signed/cards/*.json",
    "public/signed/verify-card.mjs (the same verifier a stranger downloads)",
  ],
  as_of: chain.as_of ?? index.created ?? null,
  as_of_field: chain.as_of ? "chain.json → as_of" : index.created ? "card_index.json → created" : null,

  bodies: {
    published: files.length,
    verified_valid: tally.VALID,
    verified_invalid: tally.INVALID,
    uncheckable: tally.UNCHECKABLE,
    distinct_pubkeys: pubkeys.size,
    method:
      "Each body re-canonicalised, SHA-256'd against its own id, and its Ed25519 signature " +
      "checked against the pinned card-attestation key — by public/signed/verify-card.mjs.",
  },

  chain: {
    positions: links.length,
    positions_header: chain.length ?? null,
    header_agrees: chain.length === links.length,
    bodies_published: published,
    bodies_withheld: withheld.length,
    manifest_signed: manifestSigned,
    manifest_signed_note:
      "false means /signed/chain.json carries no signature of its own. Each LINK carries a " +
      "signature, but the list — the ordering, and the assertion that nothing was dropped — is " +
      "unsigned. Do not describe the manifest as proof that no card was removed.",
  },

  withheld: {
    count: withheld.length,
    attested_by_published_parent: withheldAttested.length,
    attested_ids: withheldAttested,
    what_this_means:
      "A withheld id is cryptographically attested only when a PUBLISHED card's signed body names " +
      "it as `prev` — the signature then covers the reference. For the rest, the id and signature " +
      "appear only in an unsigned manifest, so their existence rests on our word. Both numbers must " +
      "travel together; quoting only the count of withheld positions would present a disclosure as " +
      "a proof.",
    why_withheld:
      "The signed body carries an internal identifier we do not publish. The body is what the " +
      "signature is over, so it cannot be redacted without invalidating its id.",
  },

  index: {
    rows: indexRows.length,
    rows_header: index.n_cards ?? null,
    header_agrees: index.n_cards === indexRows.length,
    rows_resolving_to_a_published_body: indexResolves,
    relationship_note:
      "card_index.json is a SUBSET index frozen at the verifiable floor (BOARD-RULING.md), not a " +
      "count of the published card store. Its rows all resolve to published bodies. Quoting the " +
      "index row count as 'cards published' understates the store; quoting the store as the index " +
      "overstates the index. They are two different facts and both are published here.",
  },
};

const json = JSON.stringify(out, null, 2) + "\n";
// Two copies, one derivation. public/ is what a stranger fetches and what /api/state
// is built from; client/src/data/ is what the front end imports as its pre-fetch
// fallback, because Vite's root is client/ and cannot reach public/ at build time.
// Writing both HERE is what stops them drifting: neither is ever hand-edited.
writeFileSync(join(signedDir, "chain-facts.json"), json);
writeFileSync(join(root, "client", "src", "data", "chain-facts.json"), json);
console.log(
  `chain-facts: ${out.bodies.verified_valid}/${out.bodies.published} bodies VALID · ` +
    `${out.chain.positions} positions · ${out.withheld.count} withheld ` +
    `(${out.withheld.attested_by_published_parent} signature-attested) · ` +
    `manifest_signed=${out.chain.manifest_signed}`,
);
if (out.bodies.verified_invalid > 0) {
  console.error("chain-facts: a published body FAILED verification — do not deploy");
  process.exit(1);
}
