// Evidence notes — one definition of where each note lives, what its Article node says, and the
// copy rules every note must keep. The press list, the /notes pages, the notes feed and the tests
// all read these, so a URL or a rule cannot drift between them.
import data from "./evidence-notes.json";

export type EvidenceNote = (typeof data.notes)[number];

export const ORIGIN = "https://councilof.ai";
export const NOTES_BASE = "/notes";
export const NOTES_INDEX_URL = `${ORIGIN}${NOTES_BASE}/`;
export const NOTES_FEED_PATH = "/feeds/notes.xml";
export const VERIFY_URL = `${ORIGIN}/gspc-verify/`;

/** Route path (bare, as wouter and the prerender queue spell it). */
export const notePath = (id: string): string => `${NOTES_BASE}/${id}`;
/** Served URL: the prerender writes <route>/index.html, so the trailing slash is canonical. */
export const noteUrl = (id: string): string => `${ORIGIN}${NOTES_BASE}/${id}/`;

/** Newest first by the note's own date; ties keep the data file's order. */
export function notesNewestFirst(notes: EvidenceNote[] = data.notes): EvidenceNote[] {
  return notes
    .map((note, i) => ({ note, i }))
    .sort((a, b) => b.note.date.localeCompare(a.note.date) || a.i - b.i)
    .map((x) => x.note);
}

export const findNote = (id: string | undefined): EvidenceNote | undefined =>
  data.notes.find((n) => n.id === id);

export const PUBLISHER = {
  "@type": "Organization",
  name: "Council of AI",
  legalName: "CSOAI Ltd",
  url: `${ORIGIN}/`,
  identifier: "UK Companies House 16939677",
} as const;

/** schema.org Article for one note. Dates come from the data file; nothing is invented. */
export function articleLd(note: EvidenceNote) {
  const url = noteUrl(note.id);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: note.title,
    description: note.summary,
    datePublished: note.date,
    author: PUBLISHER,
    publisher: PUBLISHER,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    citation: note.artifacts.map((a) => a.url),
    isAccessibleForFree: true,
    inLanguage: "en-GB",
  };
}

/** schema.org CollectionPage for the index, one Article reference per note. */
export function indexLd(notes: EvidenceNote[] = notesNewestFirst()) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Evidence notes",
    url: NOTES_INDEX_URL,
    publisher: PUBLISHER,
    hasPart: notes.map((n) => ({
      "@type": "Article",
      headline: n.title,
      datePublished: n.date,
      url: noteUrl(n.id),
    })),
  };
}

// ── Copy rules ────────────────────────────────────────────────────────────────────────────────
// Words the owner ruled out of public copy. "aggregate-only" is the name of a retired card class,
// not a superlative, so it is neutralised before matching.
export const BANNED = /\b(certified|compliant|safe|endorsed|best|worst|first|only|leading|series a|customers?|partners?)\b/i;
export const ALLOWED_HOSTS = new Set(["councilof.ai", "csoai.org", "github.com", "huggingface.co"]);

export type CopyRule = "shape" | "hosts" | "words" | "accuracy";
export interface CopyViolation { rule: CopyRule; detail: string }

export const bannedIn = (text: string): string | null => {
  const m = text.replace(/aggregate-only/gi, "aggregate_only").match(BANNED);
  if (m) return m[0];
  if (/[$£€]/.test(text)) return "typed currency symbol";
  return null;
};

/** Every copy rule a note must keep. An empty array is a pass. */
export function copyRuleViolations(note: EvidenceNote): CopyViolation[] {
  const out: CopyViolation[] = [];
  const words = note.body.split(/\s+/).filter(Boolean).length;
  if (words < 120 || words > 250) out.push({ rule: "shape", detail: `body is ${words} words (120-250)` });
  if (note.social.length > 280) out.push({ rule: "shape", detail: `social is ${note.social.length} chars (max 280)` });
  if (note.artifacts.length < 1 || note.artifacts.length > 3) out.push({ rule: "shape", detail: `${note.artifacts.length} artifacts (1-3)` });

  for (const artifact of note.artifacts) {
    let url: URL;
    try {
      url = new URL(artifact.url);
    } catch {
      out.push({ rule: "hosts", detail: `unparseable URL ${artifact.url}` });
      continue;
    }
    if (url.protocol !== "https:") out.push({ rule: "hosts", detail: `not https: ${artifact.url}` });
    if (!ALLOWED_HOSTS.has(url.hostname)) out.push({ rule: "hosts", detail: `host not allowed: ${url.hostname}` });
    if (url.hostname === "github.com" && !url.pathname.startsWith("/CSOAI-ORG/")) out.push({ rule: "hosts", detail: `github outside CSOAI-ORG: ${artifact.url}` });
    if (url.hostname === "huggingface.co" && !url.pathname.startsWith("/datasets/csoai/")) out.push({ rule: "hosts", detail: `huggingface outside datasets/csoai: ${artifact.url}` });
  }

  for (const text of [note.title, note.summary, note.body, note.social]) {
    const hit = bannedIn(text);
    if (hit) out.push({ rule: "words", detail: hit });
  }

  for (const match of note.body.matchAll(/\b0\.\d{2,4}\b/g)) {
    const end = (match.index ?? 0) + match[0].length;
    if (!note.body.slice(end, end + 60).includes("(https://councilof.ai/interop/mill-cards-signed/")) {
      out.push({ rule: "accuracy", detail: `${match[0]} without its signed card URL beside it` });
    }
  }
  return out;
}

// ── Card currency ─────────────────────────────────────────────────────────────────────────────
// Signed bytes are never edited; a wrong card is SUPERSEDED (a ledger row names its replacement) or
// WITHDRAWN (a correction id, no replacement). On 2026-09-15 an outside reader found the art5 note
// quoting qwen3:8b at 0.9722 from a card SUPERSEDED.jsonl had replaced with a 0.9444 card — the one
// /api/hub-cards serves. A note may still cite a superseded card (the supersession note exists to),
// but only beside the card that currently replaces it; a withdrawn card only beside its correction id.
// Pure functions: the ledgers and card bodies are passed in, so this file stays browser-safe.

export interface SupersessionRow { superseded_file: string; by_file: string }
export interface WithdrawalRow { withdrawn_file: string; correction: string }

const MILL_CARD_RE = /mill-cards-signed\/(signed-[A-Za-z0-9-]+\.json)/g;

/** Every mill card file a note names, in its body or its artifacts. */
export function citedMillCards(note: EvidenceNote): string[] {
  const text = [note.title, note.summary, note.body, note.social, ...note.artifacts.map((a) => a.url)].join("\n");
  return [...new Set([...text.matchAll(MILL_CARD_RE)].map((m) => m[1]))];
}

/** Follow the supersession chain to the card that is current now. */
export function currentCardFor(file: string, superseded: SupersessionRow[]): string {
  const next = new Map(superseded.map((r) => [r.superseded_file, r.by_file]));
  let at = file;
  const seen = new Set<string>();
  while (next.has(at) && !seen.has(at)) {
    seen.add(at);
    at = next.get(at)!;
  }
  return at;
}

export function stalenessViolations(note: EvidenceNote, superseded: SupersessionRow[], withdrawn: WithdrawalRow[]): string[] {
  const cited = citedMillCards(note);
  const text = JSON.stringify(note);
  const out: string[] = [];
  for (const file of cited) {
    const current = currentCardFor(file, superseded);
    if (current !== file && !cited.includes(current)) {
      out.push(`${file} is superseded; the current card ${current} is not cited beside it`);
    }
    const w = withdrawn.find((row) => row.withdrawn_file === current);
    if (w && !text.includes(w.correction)) {
      out.push(`${current} is withdrawn (${w.correction}); the note does not name the correction`);
    }
  }
  return out;
}

/** Each accuracy quoted with a signed-card URL opening within the copy rule's 60-character window. */
export function quotedAccuracies(note: EvidenceNote): { quoted: string; file: string }[] {
  const out: { quoted: string; file: string }[] = [];
  for (const m of note.body.matchAll(/\b0\.\d{2,4}\b/g)) {
    const end = (m.index ?? 0) + m[0].length;
    // The URL must OPEN inside the window (same rule as copyRuleViolations); the file name that
    // follows it runs past 60 characters, so it is read from a wider slice.
    const card = note.body.slice(end, end + 160).match(/\(https:\/\/councilof\.ai\/interop\/mill-cards-signed\/(signed-[A-Za-z0-9-]+\.json)/);
    if (card && (card.index ?? Infinity) <= 60) out.push({ quoted: m[0], file: card[1] });
  }
  return out;
}

/** An accuracy quoted beside a signed-card URL must be that card's body.accuracy, as signed. */
export function quotedAccuracyMismatches(note: EvidenceNote, accuracyOf: (file: string) => number | null | undefined): string[] {
  const out: string[] = [];
  for (const { quoted, file } of quotedAccuracies(note)) {
    const signed = accuracyOf(file);
    if (signed === undefined) out.push(`${file} is not in public/interop/mill-cards-signed`);
    else if (signed === null || String(signed) !== quoted) out.push(`${quoted} quoted beside ${file}, whose signed body reads ${signed}`);
  }
  return out;
}
