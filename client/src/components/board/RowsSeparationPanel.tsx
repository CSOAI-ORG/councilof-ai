/**
 * RowsSeparationPanel — the separation determinations the board computes from the PUBLISHED
 * per-item rows (csoai/gspc-peritem-rows-2026-08-12), read off GET /api/gspc. Nothing is typed:
 * every n, interval, p, leader and card state below is a field of the served payload, and when a
 * field is absent the panel prints nothing for it rather than a number.
 *
 * Wording is fixed by the board's doctrine: a TIE reads "No model separated from the next best on
 * this axis (exact McNemar, p≥0.05, n=…)". There is no "winner" on this board. Where no signed
 * per-model card of this run backs the leader, the panel shows the payload's own note — "leader
 * shown from per-item rows; no signed per-model card yet" — beside it.
 */

type Side = { model?: string; k?: number; n?: number; accuracy?: number; wilson95?: number[] };

export interface RowsAxisView {
  axis: string;
  separation?: string;
  separation_p?: number;
  separation_sentence?: string;
  separation_evidence?: {
    leader?: Side;
    next_best?: Side;
    paired_items?: number;
    mcnemar_p?: number | null;
    control?: { fixed_pair_rate?: number | null; nperm?: number };
  };
  separation_n_note?: string;
  separation_untested_reason?: string;
  leader_source?: string;
  leader_card_state?: string;
  leader_card_note?: string;
  leader_card_url?: string;
  own_model_exclusion_note?: string;
}

const pct = (v?: number) => (typeof v === "number" && Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : null);
const ci = (w?: number[]) =>
  Array.isArray(w) && w.length === 2 && w.every((x) => typeof x === "number")
    ? `[${(w[0] * 100).toFixed(1)}–${(w[1] * 100).toFixed(1)}%]`
    : null;

function side(s?: Side) {
  if (!s?.model) return null;
  return (
    <>
      <span className="font-mono">{s.model}</span>{" "}
      {typeof s.k === "number" && typeof s.n === "number" && (
        <span className="font-mono tabular-nums">{s.k}/{s.n}</span>
      )}{" "}
      {pct(s.accuracy) && <span className="font-mono tabular-nums">{pct(s.accuracy)}</span>}{" "}
      {ci(s.wilson95) && <span className="font-mono tabular-nums text-gray-600">{ci(s.wilson95)}</span>}
    </>
  );
}

export function RowsAxisDetermination({ a }: { a: RowsAxisView }) {
  if (a.leader_source !== "per-item rows" || !a.separation_evidence) {
    if (a.separation === "UNTESTED" && a.separation_untested_reason) {
      return (
        <p className="mt-2 text-sm text-gray-700" data-testid={`rows-untested-${a.axis}`}>
          <strong>UNTESTED.</strong> {a.separation_untested_reason}
        </p>
      );
    }
    return null;
  }
  const e = a.separation_evidence;
  const noCard = a.leader_card_state && a.leader_card_state !== "SIGNED_PER_MODEL_CARD";
  return (
    <div className="mt-2 text-sm text-gray-800" data-testid={`rows-determination-${a.axis}`}>
      {a.separation_sentence && <p className="font-semibold">{a.separation_sentence}</p>}
      <p className="mt-1">
        {a.separation === "SEPARATED" ? "Separated leader" : "Top observed (not separated)"} {side(e.leader)} vs next best {side(e.next_best)}
        {typeof e.paired_items === "number" && <> · {e.paired_items} paired items</>}
        {typeof e.mcnemar_p === "number" && (
          <>
            {" "}· exact McNemar <span className="font-mono">p={e.mcnemar_p}</span>
          </>
        )}
      </p>
      {a.separation_n_note && <p className="mt-1 text-xs text-gray-600">{a.separation_n_note}</p>}
      {a.leader_card_note && (
        <p
          className={`mt-1 text-xs ${noCard ? "font-semibold text-amber-800" : "text-gray-600"}`}
          data-testid={`leader-card-note-${a.axis}`}
        >
          {a.leader_card_note}
          {a.leader_card_url && (
            <>
              {" "}·{" "}
              <a className="underline" href={a.leader_card_url}>
                the card on record
              </a>
            </>
          )}
        </p>
      )}
      {a.own_model_exclusion_note && <p className="mt-1 text-xs text-gray-600">{a.own_model_exclusion_note}</p>}
    </div>
  );
}

export default function RowsSeparationPanel({ data }: { data: { axes?: RowsAxisView[]; peritem_rows?: Record<string, unknown> } }) {
  const axes = Array.isArray(data?.axes) ? data.axes : [];
  const decided = axes.filter((a) => a.leader_source === "per-item rows" && a.separation_evidence);
  const untested = axes.filter((a) => a.separation === "UNTESTED" && typeof a.separation_untested_reason === "string");
  const pr = data?.peritem_rows as
    | { dataset?: string; dataset_url?: string; dataset_revision?: string; peritem_sha256?: string; signed_record?: string; rows_total?: number }
    | undefined;
  if (!pr || (decided.length === 0 && untested.length === 0)) return null;
  return (
    <section className="mt-10 rounded-2xl border border-emerald-600/20 bg-white p-6" data-testid="rows-separation-panel">
      <h2 className="text-lg font-bold text-gray-900">Separation from the published per-item rows</h2>
      <p className="mt-1 text-sm text-gray-600">
        {typeof pr.rows_total === "number" && <>{pr.rows_total.toLocaleString("en-GB")} rows, </>}
        published byte-identical at{" "}
        {pr.dataset_url ? (
          <a className="font-semibold text-emerald-800 underline" href={pr.dataset_url}>
            {pr.dataset}
          </a>
        ) : (
          pr.dataset
        )}
        {pr.peritem_sha256 && (
          <>
            {" "}· peritem_sha256 <span className="break-all font-mono text-xs">{pr.peritem_sha256}</span>
          </>
        )}
        {pr.signed_record && (
          <>
            {" "}·{" "}
            <a className="underline" href={pr.signed_record}>
              signed record
            </a>
          </>
        )}
        . The test was fixed on 2026-08-13: exact McNemar on the discordant items, leader vs the best base
        model, and p&lt;0.05 is required to separate. Our own models are removed before ranking. A TIE is
        not a win.
      </p>
      <ul className="mt-4 space-y-4">
        {decided.map((a) => (
          <li key={a.axis} className="rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              {a.axis} · {a.separation}
            </p>
            <RowsAxisDetermination a={a} />
          </li>
        ))}
      </ul>
      {untested.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-900">Rows published, no determination</h3>
          <ul className="mt-2 space-y-2">
            {untested.map((a) => (
              <li key={a.axis} className="text-sm text-gray-700">
                <span className="font-semibold">{a.axis}</span> — UNTESTED. {a.separation_untested_reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 text-xs text-gray-600">
        Think a row, a grade or a named model is wrong?{" "}
        <a className="underline" href="/census/">
          Object or ask for a re-check
        </a>
        .
      </p>
    </section>
  );
}
