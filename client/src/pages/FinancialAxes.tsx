import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { setMetaDescription } from "@/lib/utils";
import { useBoardCount } from "@/lib/boardCount";
import { loadGspcBoard, type GspcAxis } from "@/components/board/useGspcBoard";

/**
 * /financial-axes — the financial/domain half of the GSPC board, honestly displayed.
 *
 * COUNTS AND ROW STATUS ARE LIVE (ADR-001). Authority is GET /api/gspc:
 *   totals.public_count / totals.by_family.financial / axes[] where family=financial.
 * Each row's status and n come from that same live axes[] array — never from a
 * typed "rest are UNMEASURED" narrative, and never invented on this page.
 *
 * The interop measure-run JSON is OPTIONAL detail for the signed on-chain facts
 * table (provenance-controls). It does not own the family's measured count.
 */

interface MeasuredInstrument {
  instrument: string;
  mainnet_issuer: string;
  control_facts: {
    status: string;
    as_of: string;
    facts: Record<string, boolean>;
    domain?: string;
  };
  risk_verdict_status: string;
  devnet_tx: string;
  explorer: string;
}

const STATUS_CHIP: Record<string, string> = {
  MEASURED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  UNMEASURED: "bg-gray-100 text-gray-600 border-gray-300",
};

function axisTitle(axis: string): string {
  return axis
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FinancialAxes() {
  // Board totals + financial family sentence — derived from GET /api/gspc.
  const board = useBoardCount();
  const [finAxes, setFinAxes] = useState<GspcAxis[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [run, setRun] = useState<{ measured: MeasuredInstrument[]; network?: string; honesty?: string } | null>(null);

  useEffect(() => {
    document.title = "Financial axis — the financial half of the GSPC board | Council of AI";
    setMetaDescription(
      "The financial and domain axis of the GSPC board. Each row's status and n come from live GET /api/gspc axes[] (family=financial). Counts quote totals.public_count — never a typed empty-slot story.",
    );

    let cancelled = false;
    loadGspcBoard()
      .then((payload) => {
        if (cancelled) return;
        const rows = (payload.axes ?? []).filter((a) => a.family === "financial");
        setFinAxes(rows);
        setLoadErr(null);

        // Optional signed-run detail for provenance-controls — evidence_url from live axis.
        const pc = rows.find((a) => a.axis === "provenance-controls");
        const evidence = typeof pc?.evidence_url === "string" ? pc.evidence_url : "/interop/financial-measure-run.json";
        return fetch(evidence)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
          .then((mr) => {
            if (!cancelled && mr && Array.isArray(mr.measured)) setRun(mr);
          });
      })
      .catch((e) => {
        if (!cancelled) {
          setFinAxes(null);
          setLoadErr(String((e as Error)?.message ?? e));
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const measuredCount = useMemo(
    () => (finAxes ? finAxes.filter((a) => a.status === "MEASURED").length : 0),
    [finAxes],
  );
  const unmeasuredCount = useMemo(
    () => (finAxes ? finAxes.filter((a) => a.status !== "MEASURED").length : 0),
    [finAxes],
  );
  const familySize = finAxes ? finAxes.length : null;
  const familySentence = board.financial_family?.sentence ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
          The GSPC board{board.live || board.axes ? ` — ${board.public_count}` : ""} — financial half
        </p>
        <h1 className="mt-3 text-4xl font-black text-gray-900">Financial axis — live from GET /api/gspc</h1>
        <p className="mt-3 max-w-3xl text-gray-600">
          Eight financial/domain rows on the board. Each chip is the live{" "}
          <code className="text-xs">axes[].status</code> for <code className="text-xs">family=financial</code>
          ; <code className="text-xs">n</code> is the live sample size.{" "}
          <strong>MEASURED</strong> means a deterministic rubric and a signed run exist — measured is not the
          same as scored (no fleet, no leader, no accuracy on these rows). Read live from{" "}
          <a className="font-semibold text-emerald-700 underline" href="/api/gspc">
            GET /api/gspc
          </a>
          .
        </p>

        {finAxes && (
          <p className="mt-4 text-sm text-gray-500">
            {familySentence ? `${familySentence} (financial family). ` : null}
            {familySize} declared slots · {measuredCount} MEASURED · {unmeasuredCount} UNMEASURED — derived
            from live <code className="text-xs">axes[]</code>, same fetch the board uses. See{" "}
            <a className="underline" href="/api/gspc">
              totals.count_grammar
            </a>
            .
          </p>
        )}

        {loadErr && (
          <p className="mt-8 text-red-600">
            Could not load the live board: {loadErr} — authority is{" "}
            <a className="underline" href="/api/gspc">
              GET /api/gspc
            </a>
            .
          </p>
        )}
        {!finAxes && !loadErr && <p className="mt-8 text-gray-500">Loading live financial axes from GET /api/gspc…</p>}

        {finAxes && (
          <div className="mt-8 grid gap-5">
            {finAxes.map((a) => {
              const id = a.axis;
              const status = String(a.status || "UNMEASURED");
              return (
                <section
                  key={id}
                  id={id}
                  className="rounded-xl border border-emerald-600/15 bg-white p-6 shadow-sm scroll-mt-24"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-gray-900">{axisTitle(id)}</h2>
                      <p className="mt-0.5 font-mono text-xs text-gray-400">/gspc/{id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.kind && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          {a.kind}
                        </span>
                      )}
                      <span
                        className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold ${STATUS_CHIP[status] || STATUS_CHIP.UNMEASURED}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {typeof a.n === "number" && (
                    <p className="mt-3 text-sm text-emerald-800">
                      n={a.n}
                      {a.n_unit ? ` ${a.n_unit}` : a.kind === "deterministic-facts" ? " (deterministic facts)" : ""}
                      {a.coverage ? ` · coverage ${a.coverage}` : ""}
                    </p>
                  )}

                  {typeof a.note === "string" && a.note.trim() && (
                    <p className="mt-2 text-sm text-gray-700">{a.note}</p>
                  )}

                  {typeof a.evidence_url === "string" && a.evidence_url.trim() && (
                    <p className="mt-3 text-xs">
                      <span className="text-gray-400">Evidence: </span>
                      <a className="font-mono text-emerald-700 underline" href={a.evidence_url}>
                        {a.evidence_url}
                      </a>
                    </p>
                  )}

                  {/* MEASURED provenance-controls: optional signed on-chain control facts table. */}
                  {id === "provenance-controls" && run && (
                    <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-600/10 bg-emerald-50/40 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                        On-chain control facts — signed run
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {run.network ? `${run.network}. ` : ""}
                        {run.honesty || ""}
                      </p>
                      <table className="mt-3 w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-gray-600">
                            <th className="py-2 pr-3 font-semibold">Instrument</th>
                            <th className="py-2 px-3 font-semibold">Allowlisting</th>
                            <th className="py-2 px-3 font-semibold">Issuer can freeze</th>
                            <th className="py-2 px-3 font-semibold">Identity domain</th>
                            <th className="py-2 px-3 font-semibold">As of</th>
                            <th className="py-2 pl-3 font-semibold">Devnet tx</th>
                          </tr>
                        </thead>
                        <tbody>
                          {run.measured.map((m) => (
                            <tr key={m.instrument} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 pr-3 font-medium text-gray-800">{m.instrument}</td>
                              <td className="py-2 px-3 font-mono text-xs">
                                {m.control_facts.facts.allowlisting_enforced ? "enforced" : "none"}
                              </td>
                              <td className="py-2 px-3 font-mono text-xs">
                                {m.control_facts.facts.issuer_can_freeze ? "yes" : "no"}
                              </td>
                              <td className="py-2 px-3 font-mono text-xs">
                                {m.control_facts.facts.identity_domain_declared ? "declared" : "none"}
                              </td>
                              <td className="py-2 px-3 font-mono text-xs text-gray-500">{m.control_facts.as_of}</td>
                              <td className="py-2 pl-3">
                                <a
                                  className="font-mono text-xs text-emerald-700 underline"
                                  href={m.explorer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {m.devnet_tx.slice(0, 10)}…
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="mt-2 text-[11px] text-gray-400">
                        Facts only — deterministic on-chain reads. Risk verdicts remain UNMEASURED pending
                        counsel. Not ratings, advice, or endorsements.
                      </p>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
          <Link href="/dashboard?tab=board" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            The full board{board.gspc_family ? ` — behavioural half, ${board.gspc_family.sentence}` : ` — ${board.public_count}`} →
          </Link>
          <Link href="/honesty" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            The honesty gate — our own losses →
          </Link>
          <Link href="/methodology" className="rounded-xl border border-emerald-600/20 bg-white p-4 font-semibold text-emerald-700 hover:bg-emerald-50">
            How we measure →
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-500">
          Measurement, not certification. Live authority is{" "}
          <a className="underline" href="/api/gspc">
            GET /api/gspc
          </a>
          {board.live || board.axes ? ` (${board.public_count}` : ""}
          {board.financial_family ? `; financial family ${board.financial_family.sentence}` : ""}
          {board.live || board.axes ? ")" : ""}. When a future financial slot is declared without a run, its
          live status will read UNMEASURED and the totals will separate again on their own — this page does
          not type that gap.
        </p>
      </div>
    </div>
  );
}
