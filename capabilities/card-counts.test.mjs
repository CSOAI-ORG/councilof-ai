/**
 * card-counts.test.mjs — three card numbers, all real, none of them wrong.
 *
 * WHAT HAPPENED. CLAUDE.md is the first file every agent in this estate reads. A revision of
 * it replaced "Cards 335/335" with two other figures and stated that 335/335 "matches neither
 * and was handed to every agent that loaded this file".
 *
 * 335/335 is not an error. It is an OWNER RULING — BOARD-RULING.md, 2026-08-28: "The mine
 * chain is 335 verifying GSPC cards … Restored: n_cards == n_cells == rows == files == 335,
 * all pin-verified" — and it is live and signed. Verified 2026-09-05:
 * GET /signed/card_index.json returns n_cards 335, n_cells 335, cards[] length 335, schema
 * csoai.gspc-card-index/0.1, pubkey d4cb0eaa…, packaged 2026-08-28.
 *
 * There are THREE quantities and they count different things:
 *
 *   card_count       1072      every public/cards/*.json wrapper on disk. The generator's own
 *                              note: "signs nothing, measures nothing". A build aggregate.
 *   root_card_count  152/153   card_sha256 hashes committed to the signed Merkle root.
 *                              The attested set. 152 committed, 153 deployed — build timing.
 *   n_cards/n_cells  335/335   the signed card index. The mine chain. Owner-ruled.
 *
 * "It matches neither of the other two" is the whole point, not a defect. Retiring a live,
 * signed, owner-ruled figure by calling it wrong is worse than the ambiguity it replaced,
 * because every agent inherits it from the first file they read.
 *
 * THIS TEST DEFENDS THE RULING, NOT A NUMBER. If the chain legitimately moves off 335, the
 * live index changes and this test says so — pointing at BOARD-RULING.md, so the next change
 * is made against the ruling rather than around it.
 *
 * Offline by default. LIVE_CARDS=1 re-reads the published index.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const read = (p) => readFileSync(path.join(repo, p), "utf8");

describe("the three card counts, and the ruling behind 335", () => {
  it("card_count matches the wrappers actually on disk", () => {
    const bundle = JSON.parse(read("public/cards-bundle.json"));
    const onDisk = readdirSync(path.join(repo, "public/cards")).filter((f) =>
      f.endsWith(".json"),
    ).length;
    assert.equal(
      bundle.card_count,
      onDisk,
      `cards-bundle.json says ${bundle.card_count} but public/cards holds ${onDisk} json ` +
        `files. This figure is a build aggregate — it must equal the directory, or it is ` +
        `describing something that is not there.`,
    );
  });

  it("root_card_count is the attested set, and is not the disk count", () => {
    const bundle = JSON.parse(read("public/cards-bundle.json"));
    assert.ok(typeof bundle.root_card_count === "number");
    assert.notEqual(
      bundle.root_card_count,
      bundle.card_count,
      "root_card_count has become equal to card_count. If every wrapper on disk is now in " +
        "the signed root that is a real change — confirm it deliberately rather than letting " +
        "an attested set and a build aggregate quietly become one number.",
    );
  });

  it("BOARD-RULING.md still rules the chain at 335", () => {
    const ruling = read("BOARD-RULING.md");
    assert.match(
      ruling,
      /the chain is 335/i,
      "BOARD-RULING.md no longer rules the chain at 335. If an owner has re-ruled it, this " +
        "test and CLAUDE.md both need updating in the same change.",
    );
    assert.match(ruling, /n_cards == n_cells == rows == files == 335/);
  });

  it("CLAUDE.md names where to read card_count instead of pinning a number", () => {
    // FIRST VERSION OF THIS ASSERTION WAS THE WRONG FIX. It checked that CLAUDE.md's pinned
    // card_count equalled the directory, and corrected 1072 -> 1115. Within the hour master
    // had taken it to 1160. The figure moves continuously, so ANY integer typed into the file
    // every agent reads first is stale before the next agent reads it — chasing it just moves
    // the rot from one commit to the next.
    //
    // So the rule is now the property, not the value: this line must point at the artifact.
    // The bundle-vs-directory assertion above is what keeps that artifact honest.
    const claude = read("CLAUDE.md");
    const line = claude.match(/`card_count`[^.]*?every\s+`public\/cards\/\*\.json`\s+wrapper[\s\S]{0,400}/);
    assert.ok(
      line,
      "CLAUDE.md no longer describes cards-bundle.json's card_count at all. It is one of three " +
        "counts that measure different things, and dropping it is how agents conflate them.",
    );
    const block = line[0].slice(0, 400);
    const pinned = [...block.matchAll(/\*\*(\d{3,5})\*\*/g)].map((m) => m[1]);
    assert.deepEqual(
      pinned,
      [],
      `CLAUDE.md pins card_count at ${pinned.join(", ")} again. That number changed three times ` +
        `on 2026-09-05 alone (1072 -> 1115 -> 1160) because master adds wrappers continuously. ` +
        `Name the artifact to read it from; do not type the integer.`,
    );
    assert.match(
      block,
      /cards-bundle\.json/,
      "the line no longer names public/cards-bundle.json as the place to read the count",
    );
  });

  it("CLAUDE.md does not tell every agent that 335/335 is wrong", () => {
    // The defect this file exists for. CLAUDE.md is read first by every agent, so a false
    // claim in it propagates further than the same claim anywhere else.
    const claude = read("CLAUDE.md");
    assert.ok(
      /335\s*\/\s*335/.test(claude),
      "CLAUDE.md no longer names the 335/335 card index at all. It is the owner-ruled mine " +
        "chain and it is live; dropping it hands every agent an incomplete picture.",
    );
    assert.ok(
      !/"Cards 335\/335", which matches neither/.test(claude),
      'CLAUDE.md again says 335/335 "matches neither". It matches neither of the OTHER TWO ' +
        "figures, which is the point — they count different things. It is an owner ruling " +
        "(BOARD-RULING.md 2026-08-28) and it is live at /signed/card_index.json.",
    );
  });

  it("live: the signed card index still publishes 335 / 335", async () => {
    if (!process.env.LIVE_CARDS) {
      console.log("      (offline: LIVE_CARDS unset — card index NOT re-read)");
      return;
    }
    const res = await fetch("https://councilof.ai/signed/card_index.json");
    assert.ok(res.ok, `/signed/card_index.json HTTP ${res.status}`);
    const idx = await res.json();
    assert.equal(idx.n_cards, idx.n_cells, "n_cards and n_cells have diverged again — that is the exact defect BOARD-RULING.md was written to close");
    assert.equal(
      idx.n_cards,
      335,
      `the live card index now publishes ${idx.n_cards}, not the owner-ruled 335. If the ` +
        `chain has legitimately moved, update BOARD-RULING.md and CLAUDE.md in the same ` +
        `change — do not let the ruling and the runtime drift apart silently.`,
    );
    assert.equal(Array.isArray(idx.cards) ? idx.cards.length : -1, 335);
  });
});
