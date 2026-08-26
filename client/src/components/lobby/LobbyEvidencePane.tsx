import { useMemo, useState } from "react";
import { FOCUS, MEASURE, PRIMARY, SP, TYPE } from "./glass";
import { Check, CopyBlock, Field, PaneHead, WireNotice } from "./paneKit";
import { determined, quotableWire, stateWord, useBoardWire, type WireAxis } from "./boardWire";
import { composeEvidenceIndex } from "./evidenceIndex";

/**
 * LobbyEvidencePane — the Evidence-pack workflow, NATIVE in Council OS.
 *
 * WHY THIS IS A PANE AND NOT A FRAMED PAGE. /gpai-evidence explains what an
 * evidence pack is. It cannot tell a reader what evidence actually exists for
 * THEIR system today, because that answer lives on the live board. This pane does
 * the work: name the system, tick the axes that bear on the claim, and it compiles
 * a real evidence index from GET /api/gspc — every row carrying the bank's
 * resolvable dataset_url, the leader, the item count, and whether the lead is
 * statistically separated or a tie.
 *
 * WHAT IT IS NOT. The index is compiled ON THIS DEVICE from the published board.
 * It is NOT itself signed, and it is not a certification, a conformity assessment,
 * or legal advice — the pane says so in the artefact it emits. The signed objects
 * are the per-axis cards, and they verify at /gspc-verify against the published
 * key without contacting us.
 *
 * THE HONESTY INVARIANTS, ENFORCED IN CODE, NOT IN COPY:
 *   · No board → no artefact. `WireNotice` renders instead. Nothing is compiled
 *     from a bundled snapshot (see boardWire.ts — there is deliberately none).
 *   · A row carries an accuracy ONLY when `quotableWire()` passes.
 *   · Every axis the reader leaves out, and every axis the board itself cannot
 *     quote, is NAMED in the artefact under `not_included` / `not_quotable` with
 *     its reason. An evidence index that silently omits is a misleading index.
 *   · Every count in the output is `.length` of a real array. Nothing is typed.
 */

function AxisRow({
  a,
  on,
  toggle,
}: {
  a: WireAxis;
  on: boolean;
  toggle: (v: boolean) => void;
}) {
  const word = stateWord(a);
  const tone =
    word === "separated"
      ? "bg-emerald-100 text-emerald-800"
      : word === "tie"
        ? "bg-lime-100 text-lime-900"
        : word === "untested"
          ? "bg-amber-100 text-amber-900"
          : "bg-slate-100 text-slate-600";
  return (
    <li className="rounded-xl border border-slate-900/10 bg-white/85 p-3">
      <Check id={`coai-ev-${a.axis}`} checked={on} onChange={toggle}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-900">{a.axis}</span>
          <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${tone}`}>
            {word}
          </span>
          <span className={TYPE.fine}>
            {a.bench}
            {a.n > 0 ? ` · n=${a.n}` : ""}
          </span>
        </span>
        <span className={`mt-1 block ${TYPE.fine}`}>{a.task || "—"}</span>
        {quotableWire(a) && (
          <span className="mt-1 block font-mono text-[11.5px] tabular-nums text-emerald-800">
            leader {(a.accuracy! * 100).toFixed(1)}
            {a.interval ? ` · 95% [${(a.interval[0] * 100).toFixed(1)}, ${(a.interval[1] * 100).toFixed(1)}]` : " · no interval published"}
            {typeof a.separation_p === "number" ? ` · McNemar p=${a.separation_p}` : ""}
          </span>
        )}
      </Check>
      {/* The bank link sits OUTSIDE the label: a link nested in a <label> both
          navigates and toggles the box, which is neither behaviour a reader asked for. */}
      {a.dataset_url ? (
        <a
          href={a.dataset_url}
          target="_blank"
          rel="noreferrer noopener"
          className={`mt-1.5 ml-[26px] inline-block font-mono text-[11px] text-emerald-800 underline decoration-emerald-800/40 underline-offset-2 ${FOCUS}`}
        >
          {a.dataset_url}
        </a>
      ) : a.dataset ? (
        // The bank is named but not yet resolved to a URL by /api/gspc. Show the
        // slug — it is what the board published — and never build a link from it:
        // the axes are `governance`/`safety` while the banks are `gspc-gov`/`gspc-agi`,
        // so a constructed URL 401s.
        <span className={`mt-1.5 ml-[26px] block ${TYPE.fine}`}>
          bank <code className="font-mono text-[11px] text-slate-700">{a.dataset}</code> · no
          resolvable URL published yet
        </span>
      ) : (
        <span className={`mt-1.5 ml-[26px] block ${TYPE.fine}`}>no bank published for this axis</span>
      )}
    </li>
  );
}

export default function LobbyEvidencePane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const wire = useBoardWire();
  const [system, setSystem] = useState("");
  const [provider, setProvider] = useState("");
  /** axis -> included. Seeded once, from the board, to every quotable+determined axis. */
  const [picked, setPicked] = useState<Record<string, boolean> | null>(null);

  const axes = wire.phase === "ready" ? wire.board.axes : [];
  const selection = useMemo<Record<string, boolean>>(() => {
    if (picked) return picked;
    const seed: Record<string, boolean> = {};
    for (const a of axes) seed[a.axis] = quotableWire(a) && determined(a);
    return seed;
  }, [picked, axes]);

  const setAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    for (const a of axes) next[a.axis] = v;
    setPicked(next);
  };
  const toggle = (axis: string, v: boolean) => setPicked({ ...selection, [axis]: v });

  const included = axes.filter((a) => selection[a.axis]);
  const notIncluded = axes.filter((a) => !selection[a.axis]);
  const notQuotable = axes.filter((a) => !quotableWire(a) || !determined(a));

  const artefact = useMemo(() => {
    if (wire.phase !== "ready" || included.length === 0) return "";
    // Composed by a PURE function so the honesty invariants are enforced by a
    // test rather than by reading JSX — see evidenceIndex.ts / evidenceIndex.test.ts.
    return JSON.stringify(
      composeEvidenceIndex({
        board: wire.board,
        included,
        system,
        provider,
        now: new Date().toISOString(),
      }),
      null,
      2,
    );
  }, [wire, included, system, provider]);

  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <PaneHead eyebrow="Evidence pack" title="Compile the evidence index for one system">
        Name the system, tick the axes that bear on the claim, and this pane compiles a real index
        from the live board — bank URL, item count, leader, and whether the lead is statistically
        separated or a tie. Every axis you leave out is named in the output, so an omission is never
        invisible. We measure; we do not certify.
      </PaneHead>

      {wire.phase !== "ready" ? (
        <WireNotice phase={wire.phase} error={wire.phase === "failed" ? wire.error : undefined} />
      ) : (
        <>
          <p className={`mt-4 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-2.5 ${TYPE.muted}`}>
            Live board · {wire.board.publicCount || "counts from GET /api/gspc"} · measured on{" "}
            {wire.board.measuredOn || "—"}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field
              id="coai-ev-system"
              label="System or model"
              hint="What this index is about. It is printed verbatim into the artefact."
              value={system}
              onChange={setSystem}
              placeholder="e.g. Acme Foundation Model v4"
            />
            <Field
              id="coai-ev-provider"
              label="Provider (legal entity)"
              hint="Optional. Who is answering for the system."
              value={provider}
              onChange={setProvider}
              placeholder="e.g. Acme AI GmbH"
            />
          </div>

          <div className="mt-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className={TYPE.section}>Axes on the live board</h3>
              <p className={`mt-1 ${MEASURE} ${TYPE.muted}`}>
                Seeded to the axes the board can quote today. Untested and unmeasured axes are listed
                too — include one and the artefact carries its state and its reason, never a number.
              </p>
            </div>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={() => setAll(true)}
                className={`rounded-lg border border-slate-900/12 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setAll(false)}
                className={`rounded-lg border border-slate-900/12 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                None
              </button>
            </span>
          </div>

          <ul className="mt-3 grid gap-2 lg:grid-cols-2">
            {wire.board.axes.map((a) => (
              <AxisRow key={a.axis} a={a} on={!!selection[a.axis]} toggle={(v) => toggle(a.axis, v)} />
            ))}
          </ul>

          <div className="mt-8 rounded-2xl border border-slate-900/10 bg-white/90 p-5">
            <h3 className="text-[15px] font-semibold text-slate-900">The index</h3>
            {included.length === 0 ? (
              <p className={`mt-2 ${MEASURE} ${TYPE.body}`}>
                Nothing is selected, so nothing is compiled. An empty pack is not a pack — tick at
                least one axis above.
              </p>
            ) : (
              <>
                <p className={`mt-2 ${MEASURE} ${TYPE.body}`}>
                  {included.length} axis row{included.length === 1 ? "" : "s"} included,{" "}
                  {notIncluded.length} named as left out, {notQuotable.length} named as not quotable
                  on this board. Counts are the arrays' own lengths.
                </p>
                <CopyBlock text={artefact} label="evidence index · JSON" />
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => onOpenRoute("/gpai-evidence", "GPAI Evidence Pack")}
                className={`${PRIMARY} px-3.5 py-2 text-[12.5px]`}
              >
                What a pack is for
              </button>
              <button
                type="button"
                onClick={() => onOpenRoute("/gspc-verify", "Verify a card")}
                className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                Verify a signed card
              </button>
              <button
                type="button"
                onClick={() => onOpenRoute("/methodology", "Methodology")}
                className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
              >
                How we grade
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
