#!/usr/bin/env node
/**
 * wellknown-index-gen — DERIVE public/.well-known/index.json from the directory it describes.
 *
 * WHY THIS EXISTS. Until 2026-09-05 the index was append-only. Ad-hoc scripts each pushed their
 * own doors onto the array and recomputed `total_doors = doors.length` — see
 * scripts/badger/csoai-take-over-chatgpt.py, which appends "openai" and "chatgpt-skills" and
 * nothing else. Nothing ever scanned the directory. The consequence, measured on 2026-09-05:
 *
 *   300 door files on disk · 292 entries in the index · 9 doors live at HTTP 200 and listed
 *   NOWHERE · and `index` itself listed as a door, so the index claimed to be one of its own doors.
 *
 * A door that serves 200 but is absent from the index is live and undiscoverable through the
 * canonical route — a door a buyer cannot find. Deriving the list removes the whole failure class:
 * you cannot forget to append what you never append.
 *
 * WHAT IS PRESERVED. Curated `name` and `description` for an existing slug are kept verbatim —
 * this regenerates the LIST, it does not rewrite anyone's copy. New slugs take their name and
 * description from the door file's own fields, which is where a door already states them.
 *
 * Usage:
 *   node scripts/wellknown-index-gen.mjs           # rewrite the index
 *   node scripts/wellknown-index-gen.mjs --check   # exit 1 if the index is stale (used by the gate)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WK = path.join(REPO, "public/.well-known");
const INDEX = path.join(WK, "index.json");
const CHECK = process.argv.includes("--check");
const BASE = "https://councilof.ai/.well-known";

const clip = (s, n) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n) : t;
};

function build() {
  const prev = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, "utf8")) : { doors: [] };
  // Curated copy, kept verbatim. The index regenerates the LIST, never someone's wording.
  const curated = new Map((prev.doors || []).map((d) => [d.slug, d]));

  const slugs = fs
    .readdirSync(WK)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => f.slice(0, -5))
    .sort();

  const doors = slugs.map((slug) => {
    const keep = curated.get(slug);
    if (keep) return { ...keep, url: `${BASE}/${slug}.json` };
    // A new door states its own name and description; read them rather than invent them.
    let doc = {};
    try {
      doc = JSON.parse(fs.readFileSync(path.join(WK, `${slug}.json`), "utf8"));
    } catch {
      /* a door we cannot parse still gets listed — absence from the index is the worse failure */
    }
    return {
      slug,
      name: clip(doc.name || slug, 120),
      description: clip(doc.description || doc.what_this_is || "", 240),
      url: `${BASE}/${slug}.json`,
    };
  });

  return {
    ...prev,
    as_of: prev.as_of,           // stamped by the caller/build, not invented here
    total_doors: doors.length,
    doors,
  };
}

const next = build();
const nextText = JSON.stringify(next, null, 2) + "\n";

if (CHECK) {
  const cur = fs.existsSync(INDEX) ? fs.readFileSync(INDEX, "utf8") : "";
  const curDoors = cur ? (JSON.parse(cur).doors || []).map((d) => d.slug).sort() : [];
  const nextDoors = next.doors.map((d) => d.slug).sort();
  const missing = nextDoors.filter((s) => !curDoors.includes(s));
  const spurious = curDoors.filter((s) => !nextDoors.includes(s));
  if (missing.length || spurious.length) {
    console.error("✗ well-known index is stale — it does not describe the directory.\n");
    if (missing.length) {
      console.error(`  ${missing.length} door(s) on disk and NOT in the index:`);
      for (const s of missing) console.error(`    ${s}  (serves ${BASE}/${s}.json)`);
      console.error("  A door that is live but unindexed is a door a buyer cannot find.\n");
    }
    if (spurious.length) {
      console.error(`  ${spurious.length} entry(ies) in the index with no file on disk:`);
      for (const s of spurious) console.error(`    ${s}`);
    }
    console.error("\n  Fix: node scripts/wellknown-index-gen.mjs");
    process.exit(1);
  }
  console.log(`✓ well-known index describes the directory (${nextDoors.length} doors).`);
  process.exit(0);
}

fs.writeFileSync(INDEX, nextText);
console.log(`✓ wrote ${path.relative(REPO, INDEX)} — ${next.doors.length} doors derived from disk.`);
