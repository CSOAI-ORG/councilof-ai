import { useEffect, useState } from "react";
import { setMetaDescription } from "@/lib/utils";
import { useGspcBoard, type GspcBoardState } from "@/components/board/useGspcBoard";
import { fetchJailArchive, jailVerifyHref, JAIL_INDEX_TIMEOUT_MS, JAIL_INDEX_URL,
  readJailBoard, type JailArchive } from "./jailEvidence";

type ArchiveState = { status: "loading" | "ready" | "error"; data: JailArchive | null };
const link = "text-emerald-800 underline underline-offset-2 focus-visible:outline focus-visible:outline-2";

/** Separate live and historical sections so archived labels cannot become current verdicts. */
export function JailEvidenceContent({ board, archive, retry }: {
  board: GspcBoardState; archive: ArchiveState; retry: () => void;
}) {
  const row = !board.error && !board.loading ? readJailBoard(board.data) : null;
  const idx = archive.status === "ready" ? archive.data : null;
  return (
    <section className="mx-auto max-w-3xl px-4 py-16" data-testid="jail-folder">
      <p className="font-mono text-xs text-emerald-800">GSPC evidence · jail axis</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Jail test evidence</h1>
      <p className="mt-3 text-slate-600">
        Inspect the published escape-attempt detection measurement and its source records.
        The current board and the archived card index are shown separately. A measurement
        is not a safety guarantee or certification.
      </p>
      <nav aria-label="Jail evidence resources" className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm">
        <a className={link} href="/board/">Measurement board</a>
        <a className={link} href="/api/gspc?axis=jail">Read the board API</a>
        <a className={link} href="/corrections/">Corrections ledger</a>
        <a className={link} href={JAIL_INDEX_URL}>Original archived index</a>
      </nav>

      <section aria-labelledby="jail-current-heading" className="mt-8 rounded-lg border border-slate-200 p-5">
        <h2 id="jail-current-heading" className="text-lg font-bold">Current board record</h2>
        <p className="mt-2 text-sm text-slate-600">Source: the shared live GSPC board feed. Loading this page does not run a new measurement.</p>
        <div aria-live="polite" aria-atomic="true" className="mt-4">
          {board.error ? (
            <p role="status">The current board could not be refreshed. Previous or archived results are not displayed as current. Use the board link above to check the source.</p>
          ) : board.loading ? (
            <p role="status">Loading the current board record…</p>
          ) : !row ? (
            <p role="status">A unique jail-axis record is unavailable in this board response. No current result is inferred.</p>
          ) : (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_1fr]" data-testid="jail-current-record">
              <dt className="font-semibold">Measurement status</dt><dd>{row.status}</dd>
              <dt className="font-semibold">Separation status</dt><dd>{row.separation}</dd>
              <dt className="font-semibold">Benchmark</dt><dd>{row.bench ?? "Not published"}</dd>
              <dt className="font-semibold">Published n</dt><dd>{row.n ?? "Not published"}</dd>
              <dt className="font-semibold">Published accuracy</dt><dd>{row.accuracy ?? "Not published"}{row.accuracy !== null && row.accuracyIs ? ` (${row.accuracyIs})` : ""}</dd>
              <dt className="font-semibold">Measurement date</dt><dd>{row.observedOn ?? "Not published"}</dd>
            </dl>
          )}
        </div>
        {row && (row.scope || row.basis) && (
          <details className="mt-4 text-sm text-slate-600">
            <summary className="cursor-pointer font-semibold">Read the measurement scope and separation basis</summary>
            {row.scope && <p className="mt-3">{row.scope}</p>}
            {row.basis && <p className="mt-3">{row.basis}</p>}
          </details>
        )}
      </section>

      <section aria-labelledby="jail-archive-heading" className="mt-8">
        <h2 id="jail-archive-heading" className="text-lg font-bold">Archived source index</h2>
        <p className="mt-2 text-sm text-slate-600">These original records are retained for inspection. Their historical labels do not override the current board or corrections ledger. A link to a signed card does not mean this page has verified its signature.</p>
        {archive.status === "loading" ? (
          <p className="mt-4 text-sm" role="status">Loading the archived source index…</p>
        ) : !idx ? (
          <div className="mt-4 text-sm">
            <p role="status">The archived index could not be loaded or validated. This does not establish that records are absent.</p>
            <button type="button" onClick={retry} className={`${link} mt-3 min-h-11 px-2`}>Retry archived index</button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-sm">Archive date: <time dateTime={idx.asOf}>{idx.asOf}</time>. Historical separation label: <strong>{idx.separation}</strong> (archived, not current).</p>
            <p className="mt-2 text-sm">Dataset: <a className={`${link} break-all`} href={idx.datasetUrl}>{idx.dataset}</a></p>
            <h3 className="mt-5 font-semibold">Cards listed in this archive</h3>
            {idx.cards.length === 0 ? (
              <p className="mt-3 text-sm">This archive lists no cards. This is not a claim about other published records.</p>
            ) : (
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                {idx.cards.map((card) => (
                  <li key={card.id}>
                    <a className={`${link} break-all font-mono text-xs`} href={card.url}>{card.id}</a>
                    <a className={`${link} mt-1 block w-fit min-h-11 py-3`} href={jailVerifyHref(card)} aria-label={`Verify archived card ${card.id}`}>Check this card in the verifier</a>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </section>
    </section>
  );
}

export default function JailFolder() {
  const board = useGspcBoard();
  const [attempt, setAttempt] = useState(0);
  const [archive, setArchive] = useState<ArchiveState>({ status: "loading", data: null });
  useEffect(() => {
    document.title = "Jail test evidence | Council of AI";
    setMetaDescription("Inspect the current GSPC jail-axis measurement, its scope and corrections, alongside the separately dated archive and card-verification links.");
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), JAIL_INDEX_TIMEOUT_MS);
    setArchive({ status: "loading", data: null });
    void fetchJailArchive(controller.signal)
      .then((data) => { if (active) setArchive({ status: "ready", data }); })
      .catch(() => { if (active) setArchive({ status: "error", data: null }); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [attempt]);
  return <JailEvidenceContent board={board} archive={archive} retry={() => setAttempt((n) => n + 1)} />;
}
