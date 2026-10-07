/**
 * /board/model?id=<model> — everything the board publishes about one model, axis by axis.
 *
 * Each axis on the live board (GET /api/gspc) gets one row: score, n and Wilson 95% range where the
 * board publishes a determination; the board's own reason where it withholds positions; "Not tested
 * yet" where this model never answered that bank; and "not a model axis" for the deterministic-facts
 * axes, which grade records, not models. Nothing is typed and nothing is estimated.
 */
import { useEffect, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useLiveJson } from "@/components/gspc/useLiveJson";
import { FreshnessLine } from "@/components/gspc/LivingBoard";
import {
  FLEET_CSV_URL,
  FLEET_URL,
  comparedModels,
  formatSpread,
  isOwnModel,
  modelCells,
  modelHref,
  pct1,
  type BoardAxis,
  type BoardDoc,
  type FleetDoc,
  type ModelCell,
} from "@/lib/livingBoard";

const REASON_SHORT: Record<string, string> = {
  NO_SIGNED_CARD_FOR_AXIS: "no signed card on this axis yet",
  ROWS_ARE_A_RETIRED_BANK: "the published rows are a retired bank",
  TOO_FEW_DISTINCT_ITEMS: "too few distinct questions for a paired test",
};

function Result({ c, axis }: { c: ModelCell; axis: BoardAxis | undefined }) {
  switch (c.kind) {
    case "scored":
      return (
        <div>
          <p className="font-mono text-base font-bold text-gray-900">
            {c.m.accuracy === null ? "—" : pct1(c.m.accuracy)}
            <span className="ml-2 text-xs font-normal text-gray-700">
              {c.m.k}/{c.m.n} · 95% {pct1(c.m.wilson95[0])}–{pct1(c.m.wilson95[1])}
            </span>
          </p>
          <p className="text-sm text-gray-800">
            Possible position {formatSpread(c.m.rank_spread)}
            <span className="text-gray-600">
              {" "}
              ·{" "}
              {c.determination === "TIE"
                ? c.m.rank_spread[0] === 1
                  ? "could still be first · board: leader and runner-up not separated"
                  : "cannot be first on 95% ranges"
                : `board: ${c.determination.toLowerCase()}`}
            </span>
          </p>
        </div>
      );
    case "jail":
      return (
        <div>
          <p className="font-mono text-base font-bold text-gray-900">
            {pct1(c.accuracy)}
            <span className="ml-2 text-xs font-normal text-gray-700">
              {c.k !== null ? `${c.k}/` : "n="}
              {c.n} · no per-model range published
            </span>
          </p>
          <p className="text-sm text-gray-800">
            No position
            <span className="text-gray-600"> · board: {(axis?.separation ?? "untested").toLowerCase()} · its own 7-model fleet</span>
          </p>
        </div>
      );
    case "withheld": {
      const code = axis?.separation_untested_reason_code ?? "";
      return (
        <div className="text-sm">
          <p className="text-amber-900">
            Answered this bank. No position published: {REASON_SHORT[code] ?? "the board publishes no determination here"}.
          </p>
          <details className="mt-1 text-xs text-gray-700">
            <summary className="cursor-pointer underline">The board's reason</summary>
            <p className="mt-1">{c.reason}</p>
          </details>
        </div>
      );
    }
    case "not-in-fleet":
      return <p className="text-sm font-semibold text-gray-700">Not tested yet</p>;
    case "not-a-model-axis":
      return <p className="text-sm text-gray-600">Not a model axis: it grades public records and servers, not models.</p>;
  }
}

export default function BoardModel() {
  const search = useSearch();
  const model = useMemo(() => (new URLSearchParams(search).get("id") ?? "").trim(), [search]);
  const board = useLiveJson<BoardDoc>("/api/gspc");
  const fleet = useLiveJson<FleetDoc>(FLEET_URL);
  const cards = useLiveJson<{ n_cards?: number }>("/signed/card_index.json");
  const root = useLiveJson<{ as_of?: string }>("/root.json");

  useEffect(() => {
    if (!model) {
      document.title = "A single model on the GSPC board | Council of AI";
      return;
    }
    document.title = `${model} on the GSPC board | Council of AI`;
    setMetaDescription(
      `Every axis of the GSPC measurement board for ${model}: score, n and 95% range where measured, the board's reason where no position is published, and "Not tested yet" where it was not tested.`,
    );
  }, [model]);

  const own = model !== "" && isOwnModel(model);
  const cells = model && board.data && fleet.data && !own ? modelCells(model, fleet.data, board.data) : null;
  const choices = fleet.data ? comparedModels(fleet.data) : [];
  const byAxis = new Map((board.data?.axes ?? []).map((a) => [a.axis, a]));
  const tested = cells?.filter((c) => c.kind === "scored" || c.kind === "jail" || c.kind === "withheld").length ?? 0;
  const notYet = cells?.filter((c) => c.kind === "not-in-fleet").length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Measurement, not certification</p>
      <h1 className="mt-2 break-all font-mono text-2xl font-black text-gray-900 sm:text-3xl" data-testid="model-id">
        {model || "Pick a model"}
      </h1>
      <p className="mt-2 text-sm text-gray-700">
        <Link href="/board" className="underline">
          ← The measurement board
        </Link>
      </p>

      <FreshnessLine board={board.data} fleet={fleet.data} cards={cards.data} root={root.data} />

      {choices.length > 0 && (
        <nav className="mt-4" aria-label="Models compared on the board">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-600">Models compared on the board</p>
          <ul className="mt-2 flex flex-wrap gap-1.5" data-testid="model-choices">
            {choices.map((c) => (
              <li key={c}>
                <Link
                  href={modelHref(c)}
                  aria-current={c === model ? "page" : undefined}
                  className={`inline-block rounded-full border px-3 py-1 font-mono text-xs font-semibold ${
                    c === model ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 text-gray-800 hover:border-gray-500"
                  }`}
                >
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {own && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950" data-testid="own-model">
          This is one of our own prompt overlays. The board does not rank its own models: they are excluded
          before every comparison and get no page here.
        </p>
      )}

      {(board.state === "error" || fleet.state === "error") && (
        <p className="mt-4 rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-950" role="alert">
          Could not read the board ({board.error ?? fleet.error}). Nothing is drawn rather than old figures.
        </p>
      )}

      {cells && (
        <>
          <p className="mt-4 text-sm text-gray-800" data-testid="model-summary">
            <strong>{tested}</strong> of {cells.length} board axes have a run with this model;{" "}
            <strong>{notYet}</strong> not tested yet;{" "}
            {cells.length - tested - notYet} grade records rather than models.
          </p>
          <ul className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-3 sm:px-4" data-testid="model-axes">
            {cells.map((c) => {
              const a = byAxis.get(c.axis);
              return (
                <li
                  key={c.axis}
                  className="grid gap-1 py-3 sm:grid-cols-[15rem_1fr] sm:gap-4"
                  data-testid={`model-cell-${c.kind}`}
                >
                  <div>
                    <Link href={`/gspc/${c.axis}`} className="text-sm font-semibold text-gray-900 underline">
                      {c.axis}
                    </Link>
                    {a?.task && <span className="block text-xs text-gray-600">{a.task}</span>}
                  </div>
                  <Result c={c} axis={a} />
                </li>
              );
            })}
          </ul>
          {tested === 0 && (
            <p className="mt-3 text-sm text-gray-700" data-testid="model-absent">
              This model has no published result on the board. That is not a score: it has not been measured
              here.
            </p>
          )}
          <p className="mt-3 text-xs text-gray-600">
            Scores are the share of frozen questions answered correctly (k/n), with a Wilson 95% range. The
            position range comes from every model's range on the same bank. Download:{" "}
            <a href={FLEET_CSV_URL} className="underline">
              CSV
            </a>{" "}
            ·{" "}
            <a href={FLEET_URL} className="underline">
              JSON
            </a>{" "}
            ·{" "}
            <a href="/api/gspc" className="underline">
              /api/gspc
            </a>
            .
          </p>
        </>
      )}
    </div>
  );
}
