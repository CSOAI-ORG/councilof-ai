#!/usr/bin/env node
// build-own-model-disclosure.mjs: how many signed cards measure a model CSOAI built itself.
//
// Read by /independence/. Every count in the output is derived here, from the bytes of the
// signed card index (public/signed/card_index.json) and the card bodies it points at. No count
// is typed anywhere, in this file or in the page.
//
// Scope: corpus 3 of the three card corpora (council-os/CARD-CORPORA.md), the signed card index
// and nothing else. Never add these counts to the public-root leaves or the cards-bundle wrappers;
// the three corpora share no identifiers.
//
// How a card is classed. body.model is the only field read. Two name rules, and one explicit list:
//   R1  body.model starts with "sov" or "clan". The rule the own-model recount used
//       (CARD-SCHEMA-v0.2-PROPOSAL §0.1): our own fine-tunes are published under those prefixes.
//   R2  body.model starts with the word "council", or carries "(council specialist)". This is the
//       exact test functions/api/gspc.ts (isOwnCouncilModel) applies to the public board's leader
//       slots; it is copied, not paraphrased, and a test pins the two together.
//   UNCONFIRMED_TAGS  model tags whose names suggest a model we derived, but where no byte we
//       hold says so. They are counted separately and never folded into either side.
// Everything else falls into "no rule matched". That is a statement about the rules, not a
// finding that the model is someone else's.
//
//   node scripts/build-own-model-disclosure.mjs          write public/independence/own-model-disclosure.json
//   node scripts/build-own-model-disclosure.mjs --check  exit 1 if the committed file is stale
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const INDEX = join(ROOT, "public", "signed", "card_index.json");
const OUT = join(ROOT, "public", "independence", "own-model-disclosure.json");

export const isR1 = (m) => typeof m === "string" && /^(sov|clan)/i.test(m.trim());
// Same test as functions/api/gspc.ts isOwnCouncilModel.
export const isR2 = (m) =>
  typeof m === "string" && (/^council\b/i.test(m.trim()) || /\(council specialist\)/i.test(m));

// Owner has not confirmed these. Listed by exact tag; a tag that stops appearing drops out of the
// output on its own, and a new ambiguous tag lands in "no rule matched" until someone lists it here.
export const UNCONFIRMED_TAGS = ["eat-unsloth-050b:2026-08-02", "qwen2.5-0.5b-mined:latest", "muse-glimmer:latest"];

export function derive(indexBytes, readBody) {
  const index = JSON.parse(indexBytes);
  const cards = Array.isArray(index.cards) ? index.cards : [];
  const tally = { r1: new Map(), r2: new Map(), unconfirmed: new Map(), none: new Map() };
  const problems = [];
  for (const c of cards) {
    let rec;
    try {
      rec = readBody(c.card_url);
    } catch (e) {
      problems.push(`${c.card}: body unreadable (${e.message})`);
      continue;
    }
    if (rec?.id !== c.card) problems.push(`${c.card}: body id ${rec?.id} differs from the index`);
    const m = rec?.body?.model;
    const bucket = isR1(m) ? "r1" : isR2(m) ? "r2" : UNCONFIRMED_TAGS.includes(m) ? "unconfirmed" : "none";
    tally[bucket].set(m, (tally[bucket].get(m) || 0) + 1);
  }
  const sum = (mp) => [...mp.values()].reduce((a, b) => a + b, 0);
  const list = (mp) => [...mp.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([model, n]) => ({ model, cards: n }));
  const r1 = sum(tally.r1), r2 = sum(tally.r2), un = sum(tally.unconfirmed), none = sum(tally.none);
  const read = r1 + r2 + un + none;
  return {
    schema: "csoai.own-model-disclosure/0.1",
    what: "How many cards in the signed card index measure a model CSOAI built itself, and the exact rule used to decide.",
    corpus: "The signed card index: corpus 3 of the three card corpora (council-os/CARD-CORPORA.md). Not the public-root leaves, not the cards-bundle wrappers. The three share no identifiers; never add them.",
    source: "/signed/card_index.json",
    source_sha256: createHash("sha256").update(indexBytes).digest("hex"),
    source_created: index.created ?? null,
    n_cards: index.n_cards ?? null,
    cards_read: read,
    header_agrees: index.n_cards === cards.length && read === cards.length && problems.length === 0,
    field_read: "body.model (the only field used)",
    rules: [
      {
        id: "R1",
        test: "body.model starts with \"sov\" or \"clan\"",
        basis: "Our own fine-tunes are published under these two prefixes. A name rule, not a registry.",
        cards: r1,
        model_tags: tally.r1.size,
      },
      {
        id: "R2",
        test: "body.model starts with the word \"council\", or contains \"(council specialist)\"",
        basis: "The same test the public board applies before it withholds a leader (functions/api/gspc.ts, isOwnCouncilModel).",
        cards: r2,
        model_tags: tally.r2.size,
        tags: list(tally.r2),
      },
    ],
    own_model_cards: r1 + r2,
    unconfirmed: {
      cards: un,
      reason: "The names suggest models we derived, but no byte we hold says so. Counted on neither side until the owner confirms.",
      tags: list(tally.unconfirmed),
    },
    no_rule_matched: {
      cards: none,
      note: "No rule above matches these tags. That is a statement about the rules, not a finding about who built the model.",
      tags: list(tally.none),
    },
    problems,
    what_this_does_not_establish: [
      "Ownership is decided by name, not by a registry of model digests. The card schema proposal (v0.2) would add a signed own_model flag decided from such a registry; it does not exist yet.",
      "A card's signature proves who signed its bytes. It says nothing about who built the model it measured.",
    ],
    derived_by: "scripts/build-own-model-disclosure.mjs",
  };
}

function main() {
  const indexBytes = readFileSync(INDEX);
  const doc = derive(indexBytes, (url) => JSON.parse(readFileSync(join(ROOT, "public", String(url).replace(/^\/+/, "")), "utf8")));
  const text = JSON.stringify(doc, null, 1) + "\n";
  if (process.argv.includes("--check")) {
    const cur = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (cur !== text) {
      console.error("own-model-disclosure: public/independence/own-model-disclosure.json is stale; run node scripts/build-own-model-disclosure.mjs");
      process.exit(1);
    }
    console.log("own-model-disclosure: current");
    return;
  }
  if (!doc.header_agrees) {
    console.error("own-model-disclosure: the index header, its card list and the bodies disagree; refusing to publish a count", doc.problems.slice(0, 5));
    process.exit(1);
  }
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, text);
  console.log(`own-model-disclosure: ${doc.own_model_cards} own (R1 ${doc.rules[0].cards}, R2 ${doc.rules[1].cards}), ${doc.unconfirmed.cards} unconfirmed, ${doc.no_rule_matched.cards} no rule, of ${doc.cards_read}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
