// functions/api/counts.ts — the count grammar as a machine surface.
//
// WHY. The site's "Which number do I quote?" accordion (client/src/components/ModelCountKey.tsx)
// answers a real reader question in HTML only: the estate publishes several figures that are all
// called "the count" by somebody, each counting a different thing in a different file. This door
// serves the same grammar as JSON — every figure labelled with its source, its state and the
// sentence that quotes it — so an agent gets the same answer the human gets, from the same files.
//
// DOCTRINE (identical to the accordion's):
//   - every number is READ from its file at request time; nothing is typed here;
//   - a failed or wrong-shaped read is state "NOT_READ" with the reason — never a number,
//     never a zero;
//   - figures are never summed, reconciled or ranked; where two surfaces disagree they are
//     reported as a relationship, which is itself a fact about the estate;
//   - one derivation per figure: this door reads, it does not re-count what /api/gspc already
//     derives (the board's own counts arrive through the same deriveBoardCounts the board uses).
//
// Clients that want one number should read the number whose `meaning` matches their question.
// None of these figures may be added to another. Not a certificate; a table of reads.
import { AXES } from "./gspc";
import { deriveBoardCounts } from "./_boardCounts";
import { etagFor, ifNoneMatchSatisfied } from "./_etag";
import { headFromGet } from "./_head";

type AssetEnv = { ASSETS: { fetch(request: Request): Promise<Response> } };

export const COUNTS_SCHEMA = "csoai.counts/0.1";

interface CountEntry {
  name: string;
  /** The read figure, or null when the read failed or the shape was wrong. */
  value: number | null;
  state: "READ" | "NOT_READ";
  reason?: string;
  /** The file (or endpoint) the figure was read from — the same file the accordion names. */
  source: string;
  /** The file's own as_of, when it carries one. Absent is absent; never the fetch time. */
  as_of?: string;
  meaning: string;
  quote: string;
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

async function readJson(env: AssetEnv, origin: string, path: string): Promise<unknown | null> {
  try {
    const res = await env.ASSETS.fetch(new Request(new URL(path, origin).toString(), { method: "GET" }));
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

const entry = (
  name: string,
  value: number | null,
  source: string,
  as_of: string | undefined,
  meaning: string,
  quote: string,
  reason?: string,
): CountEntry => ({
  name,
  value,
  state: value === null ? "NOT_READ" : "READ",
  ...(reason ? { reason } : {}),
  source,
  ...(as_of ? { as_of } : {}),
  meaning,
  quote,
});

export const buildCounts = (
  board: ReturnType<typeof deriveBoardCounts>,
  modelsMeasured: unknown,
  cardMatrix: unknown,
  ownModels: unknown,
  root: unknown,
  cardIndex: unknown,
): Record<string, unknown> => {
  const mmHead = (modelsMeasured as { headline?: Record<string, unknown> } | null)?.headline;
  const mmRows = Array.isArray((modelsMeasured as { models?: unknown[] } | null)?.models)
    ? ((modelsMeasured as { models: { kind?: unknown }[] }).models.filter((m) => m?.kind === "third_party").length)
    : null;
  const thirdParty = num(mmHead?.third_party_models);
  // The list's own rows must agree with its headline before the figure is called READ — the same
  // rule LiveBoardGlance applies to this file. A file that disagrees with itself is NOT_READ.
  const thirdPartyOk = thirdParty !== null && mmRows !== null && thirdParty === mmRows ? thirdParty : null;

  const cmCounts = (cardMatrix as { counts?: Record<string, unknown> } | null)?.counts;
  const ownRules = Array.isArray((ownModels as { rules?: { model_tags?: unknown }[] } | null)?.rules)
    ? (ownModels as { rules: { model_tags?: unknown }[] }).rules.map((r) => num(r?.model_tags))
    : [];
  const ownTotal =
    ownRules.length > 0 && ownRules.every((t) => t !== null)
      ? (ownRules as number[]).reduce((a, b) => a + b, 0)
      : null;

  const rootCount = num((root as { card_count?: unknown } | null)?.card_count);
  const rootAsOf = typeof (root as { as_of?: unknown } | null)?.as_of === "string" ? (root as { as_of: string }).as_of : undefined;
  const indexDeclared = num((cardIndex as { n_cards?: unknown } | null)?.n_cards);
  const indexAsOf = typeof (cardIndex as { packaged_at?: unknown } | null)?.packaged_at === "string"
    ? (cardIndex as { packaged_at: string }).packaged_at
    : undefined;

  const figures: CountEntry[] = [
    entry(
      "board_axes",
      board.axes,
      "GET /api/gspc (derived, functions/api/_boardCounts.ts)",
      undefined,
      "Declared slots on the measurement board — a slot is a position, not evidence of a run.",
      "Quote as the first half of the board's count line, always with board_measured beside it.",
    ),
    entry(
      "board_measured",
      board.measured_axes,
      "GET /api/gspc (derived, functions/api/_boardCounts.ts)",
      undefined,
      "Slots with a real run behind them. Never equals evidence of separation.",
      `Quote as "${board.public_count}" — the board's own composed line.`,
    ),
    entry(
      "models_third_party_frozen_banks",
      thirdPartyOk,
      "/interop/models-measured.json",
      typeof mmHead === "object" && typeof (mmHead as { as_of?: unknown })?.as_of === "string"
        ? (mmHead as { as_of: string }).as_of
        : undefined,
      "Third-party models measured on frozen banks; the estate's own models are excluded and listed apart.",
      "Quote this for “how many models”.",
      thirdPartyOk === null && thirdParty !== null
        ? "headline disagrees with the file's own rows — the file is read but not quoted"
        : undefined,
    ),
    entry(
      "own_model_tags",
      ownTotal,
      "/independence/own-model-disclosure.json",
      undefined,
      "The estate's own model tags, listed apart, never ranked and never counted into any figure above.",
      "Quote only beside the figure it is excluded from.",
    ),
    entry(
      "card_matrix_models",
      num(cmCounts?.models),
      "/signed/card-matrix.json",
      undefined,
      "Models present in the signed card set (a benchmark corpus) — a different population from frozen-bank measurements.",
      "Quote only with its split (third-party / own) from the same file.",
    ),
    entry(
      "root_card_count",
      rootCount,
      "/root.json",
      rootAsOf,
      "The signed public root's declared leaf count (a coverage-harvest surface, separate from the board).",
      "Quote with its as_of, never instead of board_measured.",
    ),
    entry(
      "card_index_declared",
      indexDeclared,
      "/signed/card_index.json",
      indexAsOf,
      "What the signed-card index declares about itself.",
      "Quote beside root_card_count as two labelled surfaces; never reconciled here.",
    ),
  ];

  // Relationships are facts about the estate, not corrections to it. If two surfaces disagree,
  // this door shows the disagreement — it never picks a winner and never totals.
  const relationships: Record<string, unknown>[] = [
    {
      surfaces: ["root_card_count", "card_index_declared"],
      relationship:
        rootCount !== null && indexDeclared !== null && rootCount !== indexDeclared
          ? "different figures for different surfaces, as published; each is quoted with its own source and as_of; the disagreement is the finding, and the figures are never summed"
          : "agreed at read time; still two surfaces, still never summed",
    },
  ];

  const grammar: string =
    "Figures in this table count different things in different files. They are never added, " +
    "averaged or reconciled. A NOT_READ row is a read that failed or a shape that disagreed with " +
    "itself — it is published as a state, never as a zero. Quote the one figure whose meaning " +
    "answers your question, and carry its source and as_of with it.";

  return {
    schema: COUNTS_SCHEMA,
    doctrine: "measurement, not endorsement — states only, never certification",
    grammar,
    board_count_line: board.public_count,
    count_grammar: board.count_grammar,
    figures,
    relationships,
    not_a_certification: true,
  };
};

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const env = context.env as unknown as AssetEnv;
  const origin = url.origin;

  const [modelsMeasured, cardMatrix, ownModels, root, cardIndex] = await Promise.all([
    readJson(env, origin, "/interop/models-measured.json"),
    readJson(env, origin, "/signed/card-matrix.json"),
    readJson(env, origin, "/independence/own-model-disclosure.json"),
    readJson(env, origin, "/root.json"),
    readJson(env, origin, "/signed/card_index.json"),
  ]);

  const doc = buildCounts(deriveBoardCounts(AXES), modelsMeasured, cardMatrix, ownModels, root, cardIndex);
  const servedBody = JSON.stringify(doc, null, 2);
  const etag = await etagFor(servedBody);
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=300",
    "access-control-allow-origin": "*",
    etag,
  };
  if (ifNoneMatchSatisfied(context.request.headers.get("if-none-match"), etag)) {
    return new Response(null, { status: 304, headers });
  }
  return new Response(servedBody, { headers });
};

export const onRequestHead = headFromGet(onRequestGet);
