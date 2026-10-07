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
//   prose names a superseded card, and nothing in the note cites its replacement yet (a link a
//   person placed beside it, with their label, is their call and stands)
//                          -> one update sentence is appended to the body, always last:
//                             "Update from SUPERSEDED.jsonl: <old>, cited above, is superseded by
//                             <current URL>. The text above describes the cited cards as they stood
//                             before that; the current card states its own n and status."
//                             Re-pointing a link alone left prose such as "has a current signed,
//                             admitted card (<old>)" false beside it (verifier, 2026-10-07): the
//                             sentence says in the text itself that the card it calls current is
//                             not. It quotes no number, and it is rebuilt (or dropped) on every run.
//   artifact links a superseded card -> it links the current card instead ("Current card (replaces
//                             <old>)"), and a link to the old card's admission receipt follows to the
//                             current card's receipt, so the links never mix two cards.
//   withdrawn card cited   -> the citing artifact's label names the correction id.
//
// It never edits a note's title, summary, social text or the body above the update sentence, and
// the accuracy rule in the same test still reads the old card's own signed accuracy beside the old
// card's URL. A case it cannot fix mechanically (the sentence would break the 250-word body rule, a
// withdrawn card with no artifact to label) is printed and exits 2: a human rewrites that note.
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
const ADMISSION_URL = "https://councilof.ai/interop/mill-evidence/";
const MILL_CARD_RE = /mill-cards-signed\/(signed-[A-Za-z0-9-]+\.json)/g;
// client/src/data/evidence-notes.ts copyRuleViolations: a body is 120-250 words.
const MAX_BODY_WORDS = 250;
export const ERRATA_MARK = "Update from SUPERSEDED.jsonl:";
const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

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

/** [body above the update sentence, the update sentence or ""]. The sentence is always last. */
export function splitErrata(body) {
  const at = body.indexOf(ERRATA_MARK);
  return at < 0 ? [body, ""] : [body.slice(0, at).trimEnd(), body.slice(at)];
}

/** The update sentence for Map(current file -> superseded files the prose names). No numbers. */
export function errataSentence(byCurrent) {
  const parts = [...byCurrent].map(
    ([current, files]) => `${files.join(" and ")}, cited above, ${files.length > 1 ? "are" : "is"} superseded by ${CARD_URL}${current}`,
  );
  return `${ERRATA_MARK} ${parts.join("; ")}. The text above describes the cited cards as they stood before that; the current card states its own n and status.`;
}

/** Returns { note, changes: string[], unresolved: string[] } without mutating the input.
 *  admissionOf(file) -> the admission receipt file a signed card names, or null. */
export function refreshNote(input, superseded, withdrawn, admissionOf = () => null) {
  const note = structuredClone(input);
  const changes = [];
  const unresolved = [];

  // 1. The prose. Superseded cards the prose names, grouped by the card that replaces them now.
  const [text, oldErrata] = splitErrata(note.body);
  const prose = [note.title, note.summary, text, note.social].join("\n");
  const named = [...new Set([...prose.matchAll(MILL_CARD_RE)].map((m) => m[1]))];
  // A note that already links the current card beside one its prose names was handled by a person
  // (care-read-n-before-accuracy: "current re-run ... the body quotes the superseded ..." on the
  // link's label); their wording stands. The sentence is this script's, kept once it wrote it.
  const linked = new Set(input.artifacts.map((a) => fileOf(a.url)).filter(Boolean));
  const ownSentence = new Set([...oldErrata.matchAll(/signed-[A-Za-z0-9-]+\.json/g)].map((m) => m[0]));
  const byCurrent = new Map();
  for (const file of named) {
    const current = currentCardFor(file, superseded);
    if (current === file || named.includes(current)) continue;
    if (linked.has(current) && !ownSentence.has(file)) continue;
    if (!byCurrent.has(current)) byCurrent.set(current, []);
    byCurrent.get(current).push(file);
  }
  const errata = byCurrent.size ? errataSentence(byCurrent) : "";
  if (errata !== oldErrata) {
    const body = errata ? `${text} ${errata}` : text;
    if (wordCount(body) > MAX_BODY_WORDS) {
      unresolved.push(
        `${note.id}: the prose names ${[...byCurrent.values()].flat().join(", ")}, now superseded, and the update sentence would take the body past ${MAX_BODY_WORDS} words; a human must rewrite it`,
      );
    } else {
      note.body = body;
      for (const [current, files] of byCurrent) {
        changes.push(`${note.id}: the body now says ${files.join(" and ")} ${files.length > 1 ? "are" : "is"} superseded by ${current} (update sentence; the prose above it is unchanged)`);
      }
      if (!errata) changes.push(`${note.id}: update sentence dropped (the prose names every current card itself)`);
    }
  }

  // 2. The links. A link to a superseded card links the current card; the old card's admission
  //    receipt, when linked, follows it, so the artifacts never pair one card with another's receipt.
  for (let i = 0; i < note.artifacts.length; i += 1) {
    const file = fileOf(note.artifacts[i].url);
    if (!file) continue;
    const current = currentCardFor(file, superseded);
    if (current === file || note.artifacts.some((a) => fileOf(a.url) === current)) continue;
    note.artifacts[i] = { label: `Current card (replaces ${file})`, url: CARD_URL + current };
    changes.push(`${note.id}: artifact links ${current}, which replaces ${file}`);
    const oldReceipt = admissionOf(file);
    const newReceipt = admissionOf(current);
    const at = oldReceipt ? note.artifacts.findIndex((a) => a.url === ADMISSION_URL + oldReceipt) : -1;
    if (at >= 0 && newReceipt && newReceipt !== oldReceipt) {
      note.artifacts[at] = { label: `Current card's admission receipt (replaces ${oldReceipt})`, url: ADMISSION_URL + newReceipt };
      changes.push(`${note.id}: admission receipt link follows to ${newReceipt}, the receipt ${current} names`);
    } else if (at >= 0) {
      unresolved.push(`${note.id}: links ${oldReceipt}, the receipt of superseded ${file}, and ${current} names no receipt to link instead`);
    }
  }

  // 3. Withdrawals.
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

export function refreshAll(doc, superseded, withdrawn, admissionOf = () => null) {
  const out = structuredClone(doc);
  const changes = [];
  const unresolved = [];
  out.notes = doc.notes.map((n) => {
    const r = refreshNote(n, superseded, withdrawn, admissionOf);
    changes.push(...r.changes);
    unresolved.push(...r.unresolved);
    return r.note;
  });
  return { doc: out, changes, unresolved };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const raw = readFileSync(NOTES, "utf8");
  const doc = JSON.parse(raw);
  const admissionOf = (file) => {
    try {
      const f = JSON.parse(readFileSync(join(MILL, file), "utf8"))?.body?.admission?.file;
      return typeof f === "string" && /^admission-[A-Za-z0-9-]+\.json$/.test(f) ? f : null;
    } catch {
      return null;
    }
  };
  const { doc: next, changes, unresolved } = refreshAll(
    doc,
    readJsonl(join(MILL, "SUPERSEDED.jsonl")),
    readJsonl(join(MILL, "WITHDRAWN.jsonl")),
    admissionOf,
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
