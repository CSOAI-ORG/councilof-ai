// Private module — the language of each axis's items (2026-10-13).
//
// WHY. The model-comparison banks are written in English and the board did not say so. A reader
// could not tell from GET /api/gspc that no number here describes a model in any other language.
//
// Nothing is typed. Each model-comparison axis reads functions/api/_gspc_bank_language.ts, which
// scripts/gspc_bank_language.py GENERATES from the published item bytes (pinned by revision and
// sha256) and a recorded review of the texts no rule can decide. A dataset card's `language: en`
// tag is NOT enough on its own: the same tag sits on every card, including the fact-run datasets
// that hold no item text, and on the care bank, where one of 199 item texts is not English.
//
// Two states, and a language is asserted in only one of them:
//   CENSUSED    every distinct item text of the SERVED bank was read and accounted for.
//   UNMEASURED  anything else, with a reason code. Never a guess, never a default "en".
//
// The census entry is bound to the served bank by sha256 (servedBankFile in _gspc_power.ts — the
// same file distinct_items is counted from). If a bank is swapped and the census is not re-run,
// the hashes differ and the axis reads UNMEASURED rather than repeating a stale language.
//
// Unsigned serving-layer fields. No signed card, record or stamp preimage is changed.
import type { AxisScore } from "./_gspc_types";
import { BANK_LANGUAGE } from "./_gspc_bank_language";
import { servedBankFile } from "./_gspc_power";

export const LANGUAGE_STATES = ["CENSUSED", "UNMEASURED"] as const;
export const LANGUAGE_UNMEASURED_REASON_CODES = [
  "NO_PROMPT_BANK",
  "NOTHING_MEASURED",
  "BANK_NOT_CENSUSED",
  "CENSUS_IS_NOT_THE_SERVED_BANK",
  "NO_DECLARATION",
  "NO_ITEM_TEXT",
  "UNDECIDED_TEXTS",
] as const;
export type LanguageUnmeasuredReason = (typeof LANGUAGE_UNMEASURED_REASON_CODES)[number];

export type AxisLanguage =
  | {
      state: "CENSUSED";
      languages: string[];
      english_only: boolean;
      item_texts_read: number;
      texts_by_language: Record<string, number>;
      decided_by: { english_function_word: number; reviewer_reading: number };
      declared: string[];
      declaration_holds: boolean;
      /** Present only when some item holds a fenced code cell. Code is not natural language. */
      items_with_code_cell?: number;
      source: string;
      note?: string;
    }
  | {
      state: "UNMEASURED";
      reason_code: LanguageUnmeasuredReason;
      reason: string;
    };

type CensusEntry = {
  dataset: string;
  revision: string;
  file: string;
  file_sha256: string;
  text_field: string;
  source_is: string;
  declared_languages: readonly string[] | null;
  item_texts: number;
  texts_by_language: Record<string, number>;
  texts_decided_by_function_word: number;
  texts_decided_by_review: number;
  texts_undecided: number;
  texts_with_code_fence: number;
  state: string;
  reason_code?: string;
  languages?: readonly string[];
  english_only?: boolean;
  declaration_holds?: boolean;
};
export const LANGUAGE_AXES = BANK_LANGUAGE.axes as unknown as Record<string, CensusEntry>;

// Names for the sentence a person reads. A tag with no name here is shown as the tag itself.
const LANGUAGE_NAME: Record<string, string> = { en: "English", pt: "Portuguese" };
export const languageName = (tag: string): string => LANGUAGE_NAME[tag] ?? tag;

const unmeasured = (reason_code: LanguageUnmeasuredReason, reason: string): AxisLanguage => ({
  state: "UNMEASURED",
  reason_code,
  reason,
});

type Axisish = Pick<AxisScore, "axis" | "kind" | "n_unit">;

/** The language block for one axis. `census` and `served` are injectable so the fail-closed branches can be tested. */
export function axisLanguage(
  a: Axisish,
  census: Record<string, CensusEntry> = LANGUAGE_AXES,
  served: (axis: string) => { file: string; sha256: string } | undefined = servedBankFile,
): AxisLanguage {
  if (a.kind === "deterministic-facts") {
    return unmeasured(
      "NO_PROMPT_BANK",
      `No model is prompted on this axis${a.n_unit ? `; n counts ${a.n_unit}` : ""}. ` +
        "The language of the sources its grader reads has not been censused.",
    );
  }
  if (a.kind !== "model-comparison") {
    return unmeasured("NOTHING_MEASURED", "Nothing is measured on this axis, so there is no item text to read.");
  }
  const e = census[a.axis];
  if (!e) {
    return unmeasured(
      "BANK_NOT_CENSUSED",
      `No language census of this axis's bank is in functions/api/_gspc_bank_language.ts (run ${BANK_LANGUAGE.producer}).`,
    );
  }
  const bank = served(a.axis);
  if (!bank || bank.sha256 !== e.file_sha256) {
    return unmeasured(
      "CENSUS_IS_NOT_THE_SERVED_BANK",
      `The language census read ${e.dataset}/${e.file} (sha256 ${e.file_sha256.slice(0, 16)}…), which is not the file ` +
        `the served bank's items are counted from. Re-run ${BANK_LANGUAGE.producer}.`,
    );
  }
  if (e.state !== "CENSUSED" || !e.languages || !e.declared_languages) {
    const code = (LANGUAGE_UNMEASURED_REASON_CODES as readonly string[]).includes(e.reason_code ?? "")
      ? (e.reason_code as LanguageUnmeasuredReason)
      : "UNDECIDED_TEXTS";
    return unmeasured(
      code,
      code === "UNDECIDED_TEXTS"
        ? `${e.texts_undecided} of ${e.item_texts} distinct item texts are not decided: no rule and no recorded review says what language they are in.`
        : code === "NO_DECLARATION"
          ? "The bank's dataset card declares no language."
          : "No item text was read from the bank file.",
    );
  }
  const others = Object.entries(e.texts_by_language).filter(([tag]) => tag !== "en");
  const notes: string[] = [];
  if (others.length) {
    const n = others.reduce((s, [, k]) => s + k, 0);
    notes.push(
      `${n} of ${e.item_texts} item texts ${n === 1 ? "is" : "are"} not English: ` +
        `${others.map(([tag, k]) => `${k} ${k === 1 ? "reads" : "read"} as ${languageName(tag)}`).join(", ")}. ` +
        `The bank's card declares ${e.declared_languages.map(languageName).join(", ")} only, so the declaration does not hold for ${n === 1 ? "that text" : "those texts"}.`,
    );
  }
  if (e.texts_with_code_fence > 0) {
    notes.push(
      `${e.texts_with_code_fence === e.item_texts ? "Every item" : `${e.texts_with_code_fence} of ${e.item_texts} items`} ` +
        "holds a fenced code cell. Code is not natural language: what was read for language is the text around the code.",
    );
  }
  return {
    state: "CENSUSED",
    languages: [...e.languages],
    english_only: e.english_only === true,
    item_texts_read: e.item_texts,
    texts_by_language: { ...e.texts_by_language },
    decided_by: {
      english_function_word: e.texts_decided_by_function_word,
      reviewer_reading: e.texts_decided_by_review,
    },
    declared: [...e.declared_languages],
    declaration_holds: e.declaration_holds === true,
    ...(e.texts_with_code_fence > 0 ? { items_with_code_cell: e.texts_with_code_fence } : {}),
    source:
      `${e.dataset} ${e.file} (revision ${e.revision.slice(0, 12)}…, sha256 ${e.file_sha256.slice(0, 16)}…), ` +
      `field ${e.text_field} — ${e.source_is}`,
    ...(notes.length ? { note: notes.join(" ") } : {}),
  };
}

export type LanguageAxis<T> = T & { language: AxisLanguage };

export function withLanguage<T extends Axisish>(axis: T): LanguageAxis<T> {
  return { ...axis, language: axisLanguage(axis) };
}

type Served = Axisish & { language: AxisLanguage };
const censused = (a: Served): a is Served & { language: Extract<AxisLanguage, { state: "CENSUSED" }> } =>
  a.language.state === "CENSUSED";

/** The board-level block. Every number is summed from the served axes, never typed. */
export function languageContract(axes: readonly Served[]) {
  const read = axes.filter(censused);
  const totals: Record<string, number> = {};
  for (const a of read) {
    for (const [tag, k] of Object.entries(a.language.texts_by_language)) totals[tag] = (totals[tag] ?? 0) + k;
  }
  const byCount = Object.entries(totals).sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
  const reasons: Record<string, string[]> = {};
  for (const a of axes) {
    if (a.language.state !== "UNMEASURED") continue;
    const list = reasons[a.language.reason_code] ?? [];
    list.push(a.axis);
    reasons[a.language.reason_code] = list;
  }
  const sum = (f: (a: (typeof read)[number]) => number) => read.reduce((s, a) => s + f(a), 0);
  return {
    schema: "csoai.gspc-language/0.1",
    rule:
      "A language is asserted for an axis only when every distinct item text of its served bank was read, at a " +
      "pinned revision, and accounted for. Otherwise the value is UNMEASURED and says why. A dataset card's " +
      "language tag alone is never the basis: it is shown as `declared`, and `declaration_holds` says whether " +
      "the items agree with it.",
    method: BANK_LANGUAGE.method,
    scope: BANK_LANGUAGE.scope,
    producer: BANK_LANGUAGE.producer,
    review: BANK_LANGUAGE.review,
    signed: false,
    states: {
      CENSUSED: read.map((a) => a.axis),
      UNMEASURED: axes.filter((a) => a.language.state === "UNMEASURED").map((a) => a.axis),
    },
    unmeasured_reasons: reasons,
    languages_found: byCount.map(([tag]) => tag),
    item_texts_read: sum((a) => a.language.item_texts_read),
    texts_by_language: Object.fromEntries(byCount),
    decided_by: {
      english_function_word: sum((a) => a.language.decided_by.english_function_word),
      reviewer_reading: sum((a) => a.language.decided_by.reviewer_reading),
    },
    english_only_axes: read.filter((a) => a.language.english_only).map((a) => a.axis),
    not_english_only_axes: read.filter((a) => !a.language.english_only).map((a) => a.axis),
    declaration_does_not_hold: read.filter((a) => !a.language.declaration_holds).map((a) => a.axis),
  };
}

/** The one line for limitations[]. Derived from the served axes; it has no number of its own. */
export function languageLimitation(axes: readonly Served[]): string {
  const cmp = axes.filter((a) => a.kind === "model-comparison");
  const facts = axes.filter((a) => a.kind === "deterministic-facts");
  const read = cmp.filter(censused);
  const unread = cmp.filter((a) => !censused(a));
  const texts = read.reduce((s, a) => s + a.language.item_texts_read, 0);
  const english = read.reduce((s, a) => s + (a.language.texts_by_language.en ?? 0), 0);
  const other = texts - english;
  const otherDetail = read
    .flatMap((a) =>
      Object.entries(a.language.texts_by_language)
        .filter(([tag]) => tag !== "en")
        .map(([tag, k]) => `${k} in ${a.axis} ${k === 1 ? "reads" : "read"} as ${languageName(tag)}`),
    )
    .join(", ");
  const byRule = read.reduce((s, a) => s + a.language.decided_by.english_function_word, 0);
  const byReading = read.reduce((s, a) => s + a.language.decided_by.reviewer_reading, 0);
  const code = read.filter((a) => a.language.items_with_code_cell === a.language.item_texts_read).map((a) => a.axis);
  const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const parts: string[] = [];
  if (cmp.length) {
    parts.push(
      read.length
        ? `Language: the item text of ${read.length} of the ${cmp.length} model-comparison ${plural(cmp.length, "bank", "banks")} ` +
            `was checked in full at a pinned revision (${texts} distinct item ${plural(texts, "text", "texts")}): ` +
            `${english} ${plural(english, "is", "are")} English` +
            (other ? ` and ${other} ${plural(other, "is", "are")} not (${otherDetail})` : "") +
            `. ${byRule} ${plural(byRule, "was", "were")} decided by an English function-word rule and ${byReading} by a recorded reading of the text. ` +
            `${other ? `Outside ${plural(other, "that 1 text", `those ${other} texts`)}, no` : "No"} number here ` +
            "rests on an item in another language, so nothing here says how a model behaves outside English."
        : `Language: no model-comparison bank on this view has a language census.`,
    );
    if (code.length) {
      parts.push(`${code.join(", ")}: every item is a code cell, and what was read for language is the instruction text around the code.`);
    }
    if (unread.length) {
      parts.push(
        `${unread.length} model-comparison ${plural(unread.length, "axis has", "axes have")} no complete language census ` +
          `(${unread.map((a) => a.axis).join(", ")}) and ${plural(unread.length, "reads", "read")} UNMEASURED.`,
      );
    }
  } else {
    parts.push("Language:");
  }
  if (facts.length) {
    parts.push(
      `The ${facts.length} deterministic-facts ${plural(facts.length, "axis prompts", "axes prompt")} no model; ` +
        `${plural(facts.length, "its", "their")} language is UNMEASURED.`,
    );
  }
  parts.push("See axes[].language and language_contract.");
  return parts.join(" ");
}
