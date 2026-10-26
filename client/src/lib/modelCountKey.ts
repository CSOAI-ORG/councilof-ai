/**
 * "Which number do I quote?" — five model counts on this site, each read from its own file and
 * each counting a different thing (persona sweep 6 Oct 2026, finding T15: five pages gave five
 * different "model" counts with nothing to say which was which).
 *
 * Rules: every row reads its own source; rows are NEVER summed or reconciled; a failed or partial
 * read is "not read", never a number. No count is typed in this file.
 */
import { comparedModels, FLEET_URL, type FleetDoc } from "@/lib/livingBoard";

export const MODEL_COUNT_SOURCES = {
  fleet: FLEET_URL,
  modelsMeasured: "/interop/models-measured.json",
  cardMatrix: "/signed/card-matrix.json",
  hubCards: "/api/hub-cards",
  ownModels: "/independence/own-model-disclosure.json",
} as const;

export type CountRow = {
  id: keyof typeof MODEL_COUNT_SOURCES;
  label: string;
  /** null = not read (fetch failed, wrong shape, or a partial read that must not be totalled). */
  value: number | null;
  /** Plain-English qualifier shown beside the figure, derived from the same file. */
  detail: string | null;
  source: string;
  href: string;
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export function fleetRow(doc: unknown): CountRow {
  const d = doc as FleetDoc | null;
  const ok = !!d && typeof d === "object" && d.axes && typeof d.axes === "object";
  const models = ok ? comparedModels(d as FleetDoc) : null;
  return {
    id: "fleet",
    label: "Models compared head to head on the board",
    value: models ? models.length : null,
    detail: models && models.length ? models.join(", ") : null,
    source: MODEL_COUNT_SOURCES.fleet,
    href: "/board/",
  };
}

export function modelsMeasuredRow(doc: unknown): CountRow {
  const h = (doc as { headline?: Record<string, unknown> } | null)?.headline;
  const n = num(h?.third_party_models);
  const own = num(h?.own_models_excluded);
  return {
    id: "modelsMeasured",
    label: "Third-party AI models measured on frozen banks (quote this for “how many models”)",
    value: n,
    detail: n !== null && own !== null ? `our own ${own} are listed apart, never counted in` : null,
    source: MODEL_COUNT_SOURCES.modelsMeasured,
    href: "/models-measured/",
  };
}

export function cardMatrixRow(doc: unknown): CountRow {
  const c = (doc as { counts?: Record<string, unknown> } | null)?.counts;
  const all = num(c?.models);
  const third = num(c?.models_third_party);
  const own = num(c?.models_own);
  const unconfirmed = num(c?.models_own_unconfirmed);
  const split = third !== null && own !== null && unconfirmed !== null;
  return {
    id: "cardMatrix",
    label: "Models in the signed card set (a benchmark corpus)",
    value: split ? third : all,
    detail: split
      ? `third-party; our own ${own} (+${unconfirmed} unconfirmed) are in this set and listed apart`
      : all !== null
        ? "all models in the set; this file does not split ours out"
        : null,
    source: MODEL_COUNT_SOURCES.cardMatrix,
    href: "/board/models/",
  };
}

export function hubCardsRow(doc: unknown): CountRow {
  const d = doc as { counts?: { complete?: unknown }; cells?: { model?: unknown }[] } | null;
  // A partial read is never totalled as the population.
  const complete = d?.counts?.complete === true && Array.isArray(d?.cells);
  const models = complete ? new Set(d!.cells!.map((c) => c?.model).filter((m) => typeof m === "string")).size : null;
  return {
    id: "hubCards",
    label: "Models in Hugging Face Hub cells (a separate instrument)",
    value: models,
    detail: d && !complete ? "partial read, not totalled" : null,
    source: MODEL_COUNT_SOURCES.hubCards,
    href: "/dashboard/?tab=board",
  };
}

export function ownModelsRow(doc: unknown): CountRow {
  const d = doc as { rules?: { model_tags?: unknown }[]; unconfirmed?: { tags?: unknown[] } } | null;
  const tags = Array.isArray(d?.rules) ? d!.rules!.map((r) => num(r?.model_tags)) : [];
  const value = tags.length && tags.every((t) => t !== null) ? (tags as number[]).reduce((a, b) => a + b, 0) : null;
  const unconfirmed = Array.isArray(d?.unconfirmed?.tags) ? d!.unconfirmed!.tags!.length : null;
  return {
    id: "ownModels",
    label: "Our own model tags (never ranked)",
    value,
    detail: value !== null && unconfirmed ? `plus ${unconfirmed} unconfirmed, counted on neither side` : null,
    source: MODEL_COUNT_SOURCES.ownModels,
    href: "/independence/",
  };
}

export const ROW_BUILDERS: [keyof typeof MODEL_COUNT_SOURCES, (doc: unknown) => CountRow][] = [
  ["fleet", fleetRow],
  ["modelsMeasured", modelsMeasuredRow],
  ["cardMatrix", cardMatrixRow],
  ["hubCards", hubCardsRow],
  ["ownModels", ownModelsRow],
];

/** The /board scope line: the compared ids, their size range by published tag, and the hosted-model clause. */
export function boardScope(models: string[]): { range: [string, string] | null; namesHosted: boolean } {
  const sizes = models.map((m) => {
    const hit = m.match(/(\d+(?:\.\d+)?)b\b/i);
    return hit ? Number(hit[1]) : null;
  });
  const parsed = sizes.length > 0 && sizes.every((s) => s !== null);
  const fmt = (n: number) => `${n}b`;
  const range: [string, string] | null = parsed
    ? [fmt(Math.min(...(sizes as number[]))), fmt(Math.max(...(sizes as number[])))]
    : null;
  return { range, namesHosted: models.some((id) => /gpt|claude|gemini/i.test(id)) };
}
