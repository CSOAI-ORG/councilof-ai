#!/usr/bin/env node
// evidence-notes-current-cards.mjs: keep each evidence note citing the CURRENT signed mill card.
//
// WHY (A-G2, 2026-10-07). A mill landing PR signs new cards on its branch, and the signer
// supersedes the cell's earlier card in public/interop/mill-cards-signed/SUPERSEDED.jsonl. A note in
// client/src/data/evidence-notes.json that cites the earlier card then fails
// client/src/data/evidence-notes.cards.test.ts ("cites no superseded card without its current
// replacement"). #2815, #2843 and #2846 stopped there; #2802 was fixed by hand, in prose. This is the
// mechanical half of that fix, run by the land workflows on the PR branch after the signer:
//
//   superseded card cited  -> the card that replaces it now (end of the SUPERSEDED.jsonl chain) is
//                             cited too, as an artifact link. The note keeps its 1-3 artifacts: when
//                             it already has three, the superseded card's own artifact link is
//                             pointed at the current card (the body still names the old card, so
//                             both stay cited), else the last artifact that is not a mill card is.
//   withdrawn card cited   -> the citing artifact's label names the correction id.
//
// It never edits a note's title, summary, body or social text and never quotes a number: a note
// whose prose is now wrong still needs a human, and the accuracy rule in the same test still reads
// the old card's own signed accuracy beside the old card's URL. A case it cannot fix mechanically
// (no artifact slot to use) is printed and exits 2.
//
//   node scripts/evidence-notes-current-cards.mjs           # rewrite the notes file when needed
//   node scripts/evidence-notes-current-cards.mjs --check   # exit 1 if a rewrite is needed
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const NOTES = join(ROOT, "client", "src", "data", "evidence-notes.json");
export const MILL = join(ROOT, "public", "interop", "mill-cards-signed");
const CARD_URL = "https://councilof.ai/interop/mill-cards-signed/";
const MILL_CARD_RE = /mill-cards-signed\/(signed-[A-Za-z0-9-]+\.json)/g;
const MAX_ARTIFACTS = 3;

const fileOf = (url) => {
  const m = String(url ?? "").match(/mill-cards-signed\/(signed-[A-Za-z0-9-]+\.json)/);
  return m ? m[1] : null;
};

export function readJsonl(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });
}

/** Same rules as client/src/data/evidence-notes.ts (citedMillCards / currentCardFor), kept browser-free. */
export function citedMillCards(note) {
  const text = [note.title, note.summary, note.body, note.social, ...note.artifacts.map((a) => a.url)].join("\n");
  return [...new Set([...text.matchAll(MILL_CARD_RE)].map((m) => m[1]))];
}

export function currentCardFor(file, superseded) {
  const next = new Map(superseded.map((r) => [r.superseded_file, r.by_file]));
  let at = file;
  const seen = new Set();
  while (next.has(at) && !seen.has(at)) {
    seen.add(at);
    at = next.get(at);
  }
  return at;
}

/** Returns { note, changes: string[], unresolved: string[] } without mutating the input. */
export function refreshNote(input, superseded, withdrawn) {
  const note = structuredClone(input);
  const changes = [];
  const unresolved = [];
  for (const file of citedMillCards(input)) {
    const current = currentCardFor(file, superseded);
    if (current === file || citedMillCards(note).includes(current)) continue;
    const link = { label: `Current card (replaces ${file})`, url: CARD_URL + current };
    const own = note.artifacts.findIndex((a) => fileOf(a.url) === file);
    if (note.artifacts.length < MAX_ARTIFACTS) {
      note.artifacts.splice(own >= 0 ? own + 1 : note.artifacts.length, 0, link);
      changes.push(`${note.id}: cites ${current}, which replaces ${file}`);
      continue;
    }
    // Three artifacts already. Re-point the old card's own link only when the prose still names the
    // old card (so it stays cited); otherwise use the last artifact that is not a mill card.
    const prose = [note.title, note.summary, note.body, note.social].join("\n");
    let slot = own >= 0 && prose.includes(file) ? own : -1;
    if (slot < 0) {
      for (let i = note.artifacts.length - 1; i >= 0; i -= 1) {
        if (!fileOf(note.artifacts[i].url)) {
          slot = i;
          break;
        }
      }
    }
    if (slot < 0) {
      unresolved.push(`${note.id}: ${file} is superseded by ${current}, and no artifact slot can carry it`);
      continue;
    }
    changes.push(`${note.id}: artifact "${note.artifacts[slot].label}" now cites ${current}, which replaces ${file}`);
    note.artifacts[slot] = link;
  }
  for (const file of citedMillCards(note)) {
    const current = currentCardFor(file, superseded);
    const w = withdrawn.find((row) => row.withdrawn_file === current);
    if (!w || JSON.stringify(note).includes(w.correction)) continue;
    const at = note.artifacts.findIndex((a) => fileOf(a.url) === current);
    if (at < 0) {
      unresolved.push(`${note.id}: ${current} is withdrawn (${w.correction}) and is not an artifact link to label`);
      continue;
    }
    note.artifacts[at] = { ...note.artifacts[at], label: `${note.artifacts[at].label} (withdrawn: ${w.correction})` };
    changes.push(`${note.id}: names correction ${w.correction} for ${current}`);
  }
  return { note, changes, unresolved };
}

export function refreshAll(doc, superseded, withdrawn) {
  const out = structuredClone(doc);
  const changes = [];
  const unresolved = [];
  out.notes = doc.notes.map((n) => {
    const r = refreshNote(n, superseded, withdrawn);
    changes.push(...r.changes);
    unresolved.push(...r.unresolved);
    return r.note;
  });
  return { doc: out, changes, unresolved };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = readFileSync(NOTES, "utf8");
  const doc = JSON.parse(raw);
  const { doc: next, changes, unresolved } = refreshAll(
    doc,
    readJsonl(join(MILL, "SUPERSEDED.jsonl")),
    readJsonl(join(MILL, "WITHDRAWN.jsonl")),
  );
  for (const c of changes) console.log(`evidence-notes: ${c}`);
  for (const u of unresolved) console.error(`evidence-notes: UNRESOLVED ${u}`);
  // The committed file is JSON.stringify(doc, null, 1) + "\n"; keep that shape.
  const text = JSON.stringify(next, null, 1) + "\n";
  if (process.argv.includes("--check")) {
    if (changes.length) {
      console.error("evidence-notes-current-cards: a note cites a superseded or withdrawn card; run node scripts/evidence-notes-current-cards.mjs");
      process.exit(1);
    }
    console.log(`evidence-notes-current-cards: ${doc.notes.length} notes cite current cards`);
  } else if (changes.length) {
    writeFileSync(NOTES, text);
    console.log(`evidence-notes-current-cards: rewrote ${changes.length} citation(s)`);
  } else {
    console.log(`evidence-notes-current-cards: ${doc.notes.length} notes already cite current cards`);
  }
  if (unresolved.length) process.exit(2);
}
