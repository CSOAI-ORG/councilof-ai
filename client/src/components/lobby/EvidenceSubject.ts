/**
 * EvidenceSubject — what evidence we hold for ONE named model, as a PURE function.
 *
 * WHY THIS EXISTS. Re-test 7 Oct 2026: asking the Evidence pack pane about a model (qwen3:8b)
 * returned a JSON index of the live board, whose rows name each axis's LEADER — other people's
 * models. The stranger's own model appeared only as a string printed at the top. That answered a
 * question nobody asked. This module answers the one they did: "what do you hold for my model?"
 *
 * SOURCE. /interop/models-measured.json, built by scripts/build-models-measured.mjs from the two
 * signed corpora (the signed card index and the verified OIDC-signed mill cards). Every count in
 * the answer is a field of that file for that one model; nothing is typed, summed or estimated here.
 *
 * THE RULES, ALL COVERED BY EvidenceSubject.test.ts:
 *   1. The answer is about the subject the reader named, or it says plainly that we hold nothing
 *      for it yet. It never substitutes another model's evidence.
 *   2. An exact match (after removing only the runtime wrapper: an "ollama:"/"t4:" prefix, an
 *      "@sha256:" digest and ":latest", the file's own identity rule) answers directly. A looser
 *      spelling that fits exactly one model answers and says which id it matched. A spelling that
 *      fits two or more is never resolved for the reader: they are listed to pick from, because an
 *      Ollama tag and a Hugging Face repo are different weights.
 *   3. A withheld name (name_published false) is never matched, suggested or shown.
 *   4. Our own models are answered, labelled as ours, and never called a result to compare.
 *   5. "None" is not a score. It means we have not measured it, and the answer says that.
 */

export const MODELS_MEASURED_PATH = "/interop/models-measured.json";

export interface MeasuredModel {
  id: string;
  name_published: boolean;
  kind: string;
  cards: number;
  axes: number;
  sources: string[];
  admission_receipt: boolean;
  first_signed_card: string | null;
  recorded_as: string[];
}

export interface ModelsMeasuredFile {
  schema?: string;
  identity_rule?: string;
  own_model_rule?: string;
  inputs_sha256?: string;
  models: MeasuredModel[];
}

export type Tone = "measured" | "own" | "none";

export interface SubjectCard {
  state: "found" | "none" | "ambiguous";
  query: string;
  /** The model id the answer is about. Null when we hold nothing for the query. */
  subject: string | null;
  chip: string;
  tone: Tone;
  /** One or two plain sentences. */
  sentence: string;
  numbers: { label: string; value: number }[];
  button: { label: string; href: string };
  /** Spellings the reader can pick from (state "ambiguous" or "none"). Published names only. */
  pick: string[];
  /** The raw record behind the answer, for the Details expander. */
  details: Record<string, unknown>;
}

/** The file's own identity rule: drop the runtime wrapper, nothing else. */
export function normaliseModelId(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^(?:ollama|t4):/, "")
    .replace(/@sha256:[0-9a-f]+$/, "")
    .replace(/:latest$/, "");
}

/** Spelling-insensitive key, for suggestions only: "Qwen3 8B" and "qwen3:8b" share it. */
const loose = (s: string) => normaliseModelId(s).replace(/[^a-z0-9]+/g, "");
const base = (id: string) => id.slice(id.lastIndexOf("/") + 1);

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** Read the file defensively: a malformed row is dropped, never coerced into a number. */
export function readModelsFile(j: unknown): ModelsMeasuredFile {
  if (!isRecord(j) || !Array.isArray(j.models)) throw new Error(`${MODELS_MEASURED_PATH} carried no models list`);
  const models: MeasuredModel[] = [];
  for (const m of j.models) {
    if (!isRecord(m) || typeof m.id !== "string" || !m.id) continue;
    if (typeof m.cards !== "number" || typeof m.axes !== "number") continue;
    models.push({
      id: m.id,
      name_published: m.name_published === true,
      kind: typeof m.kind === "string" ? m.kind : "unknown",
      cards: m.cards,
      axes: m.axes,
      sources: Array.isArray(m.sources) ? m.sources.filter((s): s is string => typeof s === "string") : [],
      admission_receipt: m.admission_receipt === true,
      first_signed_card: typeof m.first_signed_card === "string" && /^[0-9a-f]{64}$/.test(m.first_signed_card) ? m.first_signed_card : null,
      recorded_as: Array.isArray(m.recorded_as) ? m.recorded_as.filter((s): s is string => typeof s === "string") : [],
    });
  }
  return {
    schema: typeof j.schema === "string" ? j.schema : undefined,
    identity_rule: typeof j.identity_rule === "string" ? j.identity_rule : undefined,
    own_model_rule: typeof j.own_model_rule === "string" ? j.own_model_rule : undefined,
    inputs_sha256: typeof j.inputs_sha256 === "string" ? j.inputs_sha256 : undefined,
    models,
  };
}

const REQUEST = { label: "Ask us to measure it", href: "/dashboard?tab=measured" };
const LIST = { label: "See every model we have measured", href: "/models-measured/" };

function source(file: ModelsMeasuredFile): Record<string, unknown> {
  return {
    source: MODELS_MEASURED_PATH,
    schema: file.schema ?? null,
    inputs_sha256: file.inputs_sha256 ?? null,
    identity_rule: file.identity_rule ?? null,
  };
}

/** The answer card for one query. Pure: same query and file, same answer. */
export function answerForSubject(rawQuery: string, file: ModelsMeasuredFile): SubjectCard | null {
  const query = String(rawQuery ?? "").trim().slice(0, 200);
  const q = normaliseModelId(query);
  if (!q) return null;
  const published = file.models.filter((m) => m.name_published);
  const lq = loose(query);

  const exact = published.find((m) => normaliseModelId(m.id) === q || m.recorded_as.some((r) => normaliseModelId(r) === q));
  const looseHits = exact
    ? []
    : published.filter((m) => lq.length > 0 && (loose(m.id) === lq || loose(base(m.id)) === lq || m.recorded_as.some((r) => loose(r) === lq)));
  const hit = exact ?? (looseHits.length === 1 ? looseHits[0] : null);

  if (hit) {
    const own = hit.kind === "own";
    const matchedAs = normaliseModelId(hit.id) === q ? "" : ` (your spelling matched ${hit.id})`;
    const sentence = own
      ? `We hold ${plural(hit.cards, "signed measurement card")} for ${hit.id}${matchedAs}, across ${plural(hit.axes, "axis", "axes")}. ` +
        "It is one of our own models, a prompt overlay on stock weights, so it is listed here but never counted or ranked against anyone else's model."
      : `We hold ${plural(hit.cards, "signed measurement card")} for ${hit.id}${matchedAs}, across ${plural(hit.axes, "axis", "axes")}. ` +
        "Each card is a measurement on a frozen test bank, not a certification or a pass mark.";
    const button = hit.first_signed_card
      ? {
          label: "Check one of its signed cards yourself",
          href: `/gspc-verify/?card=${encodeURIComponent(`/signed/cards/${hit.first_signed_card}.json`)}`,
        }
      : LIST;
    return {
      state: "found",
      query,
      subject: hit.id,
      chip: own ? "Our own model" : "Signed measurements on file",
      tone: own ? "own" : "measured",
      sentence,
      numbers: [
        { label: "signed measurement cards", value: hit.cards },
        { label: hit.axes === 1 ? "axis covered" : "axes covered", value: hit.axes },
      ],
      button,
      pick: [],
      details: { asked: query, matched: hit.id, record: hit, ...source(file) },
    };
  }

  if (looseHits.length > 1) {
    const pick = looseHits.map((m) => m.id).slice(0, 6);
    return {
      state: "ambiguous",
      query,
      subject: null,
      chip: "Which one?",
      tone: "none",
      sentence:
        `“${query}” fits ${plural(looseHits.length, "model")} we have measured under different names. ` +
        "They are different builds, so we will not pick one for you. Choose the one you mean.",
      numbers: [],
      button: LIST,
      pick,
      details: { asked: query, candidates: looseHits.map((m) => m.id), ...source(file) },
    };
  }

  // Close spellings, offered and never answered for. Only for a query long enough to mean something.
  const pick =
    lq.length >= 3
      ? published
          .filter((m) => loose(m.id).includes(lq) || loose(base(m.id)).includes(lq))
          .sort((a, b) => b.cards - a.cards || a.id.localeCompare(b.id))
          .slice(0, 5)
          .map((m) => m.id)
      : [];
  return {
    state: "none",
    query,
    subject: null,
    chip: "No evidence yet",
    tone: "none",
    sentence:
      `We hold no signed measurement for “${query}” yet. That is not a score or a verdict on it: it only means we have not measured it.` +
      (pick.length ? " Some models we have measured have similar names; pick one below if you meant it." : ""),
    numbers: [{ label: "signed measurement cards", value: 0 }],
    button: REQUEST,
    pick,
    details: { asked: query, matched: null, ...source(file) },
  };
}
