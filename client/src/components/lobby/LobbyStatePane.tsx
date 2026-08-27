import { FOCUS, MEASURE, SP, TYPE } from "./glass";
import { PaneHead } from "./paneKit";
import { factCount, kindTally, useEstateState, type Fact, type FactKind } from "./stateWire";

/**
 * LobbyStatePane — "Estate state", NATIVE in Council OS.
 *
 * WHAT IT IS. A human surface over GET /api/state: every count the estate is
 * entitled to publish, each one shown with the `kind` of thing that produced it
 * and the `as_of` it was read from. Nothing here is typed — including the
 * summary line at the top, whose totals are the lengths of the arrays the
 * endpoint returned.
 *
 * WHY IT IS A TAB. The endpoint exists because the estate's own lanes published
 * counts that contradicted each other, and it shipped with no way for a reader
 * to see it. A governance instrument whose answer to "which number is real?"
 * lives only in a JSON body has answered it for machines and not for people.
 *
 * THE THREE RULES THIS PANE RENDERS RATHER THAN DESCRIBES.
 *   1. A KIND IS NEVER DROPPED. Every value carries its kind as a visible chip.
 *      `catalogued` is a directory listing; `probed` means something answered;
 *      `declared` means a slot was published so a gap is visible; `unmeasured`
 *      means we have not measured it and say so. They are never summed.
 *   2. AN ABSENT TIMESTAMP IS SHOWN AS ABSENT. `as_of: null` renders "no
 *      timestamp published" in amber, with the reason the endpoint gave. It is
 *      never filled in with today's date.
 *   3. NO BOARD, NO NUMBERS. A failed fetch renders the failure and nothing
 *      else. There is deliberately no bundled copy of this payload.
 */

const KIND_TONE: Record<string, string> = {
  measured: "border-emerald-700/25 bg-emerald-50 text-emerald-900",
  probed: "border-sky-700/25 bg-sky-50 text-sky-900",
  catalogued: "border-slate-700/20 bg-slate-100 text-slate-700",
  declared: "border-violet-700/25 bg-violet-50 text-violet-900",
  unmeasured: "border-amber-700/30 bg-amber-50 text-amber-900",
};

/** One line about what a kind actually asserts. Shown, not assumed. */
const KIND_MEANS: Record<string, string> = {
  measured: "a run happened against a frozen bank and was graded",
  probed: "something was contacted and answered, at the time shown",
  catalogued: "it is listed in a register — nothing was contacted or run",
  declared: "a slot published so a gap is visible — no run behind it",
  unmeasured: "it exists and we have not measured it, and we say so",
};

const TITLES: Record<string, string> = {
  board: "The GSPC board",
  mcp_fleet: "MCP fleet",
  signed_cards: "Signed cards",
  claims_register: "Claims register",
  rwa_instruments: "RWA instruments",
};

const prettyKey = (k: string) => k.replace(/_/g, " ");

function KindChip({ kind }: { kind: FactKind }) {
  return (
    <span
      title={KIND_MEANS[kind] ?? "kind as published by /api/state"}
      className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-wide ${
        KIND_TONE[kind] ?? "border-slate-700/20 bg-slate-100 text-slate-700"
      }`}
    >
      {kind}
    </span>
  );
}

/** Render whatever the endpoint published, without reshaping it into a number. */
function Value({ v }: { v: unknown }) {
  if (v === null || v === undefined)
    return <span className="text-[13px] font-semibold text-amber-900">null — nothing published</span>;
  if (typeof v === "number")
    return <span className="text-[20px] font-semibold tabular-nums text-slate-900">{v.toLocaleString()}</span>;
  if (typeof v === "boolean")
    return <span className="text-[15px] font-semibold text-slate-900">{String(v)}</span>;
  if (typeof v === "string")
    return <span className={`block ${MEASURE} text-[13px] leading-relaxed text-slate-800`}>{v}</span>;
  // Objects and arrays are shown as the JSON the endpoint served. Flattening
  // them into a headline figure is how a by-family breakdown becomes one number.
  return (
    <pre className="mt-1 max-h-52 overflow-auto rounded-lg border border-slate-900/10 bg-slate-50 p-3 font-mono text-[11px] leading-relaxed text-slate-800">
      <code>{JSON.stringify(v, null, 2)}</code>
    </pre>
  );
}

function FactRow({ f }: { f: Fact }) {
  const scalar = f.value === null || ["number", "boolean"].includes(typeof f.value);
  return (
    <li className="rounded-xl border border-slate-900/10 bg-white/85 p-3.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-[12.5px] font-semibold text-slate-900">{prettyKey(f.key)}</span>
        <KindChip kind={f.kind} />
      </div>
      <div className={scalar ? "mt-1.5 flex items-baseline gap-2" : "mt-1.5"}>
        <Value v={f.value} />
      </div>
      <p className={`mt-2 ${TYPE.mono}`}>
        {f.as_of ? (
          <>
            as of {f.as_of}
            {f.as_of_field ? ` · read from ${f.as_of_field}` : ""}
          </>
        ) : (
          <span className="font-semibold text-amber-800">
            no timestamp published — the artifact carries none, and none is substituted
          </span>
        )}
      </p>
      {f.note && <p className={`mt-1.5 ${MEASURE} ${TYPE.fine}`}>{f.note}</p>}
    </li>
  );
}

export default function LobbyStatePane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const wire = useEstateState();

  return (
    <div className={`${SP.panel} h-full overflow-y-auto`}>
      <PaneHead eyebrow="Estate state" title="Every count, with the kind that produced it">
        This pane is <code className="font-mono text-[12px]">GET /api/state</code> — the one place a
        figure about this estate may come from. Each value carries its <strong>kind</strong> and the{" "}
        <strong>as_of</strong> it was read from, so a catalogue entry can never be read as a
        measurement and a missing timestamp can never look like a fresh one. If a number is not on
        this pane, it is not established.
      </PaneHead>

      {wire.phase === "loading" && (
        <p className={`mt-6 rounded-xl border border-slate-900/10 bg-white/80 px-4 py-3 ${TYPE.muted}`}>
          Reading <code className="font-mono text-[11px]">GET /api/state</code>…
        </p>
      )}

      {wire.phase === "failed" && (
        <div className="mt-6 rounded-xl border border-amber-600/35 bg-amber-50 px-4 py-3.5">
          <p className="text-[13px] font-semibold text-amber-900">The state endpoint did not answer.</p>
          <p className={`mt-1.5 ${MEASURE} text-[12px] leading-relaxed text-amber-900/90`}>
            No figure is shown in its place. This pane keeps no bundled copy of the payload on
            purpose — a state surface served from a stale snapshot is precisely the defect the
            endpoint exists to prevent.
          </p>
          <p className="mt-2 font-mono text-[11px] text-amber-900/80">{wire.error}</p>
        </div>
      )}

      {wire.phase === "ready" && (
        <>
          <div className="mt-5 rounded-2xl border border-slate-900/10 bg-white/85 p-4">
            <p className={`${MEASURE} ${TYPE.body}`}>
              {factCount(wire.state)} published values across {wire.state.groups.length} groups. Both
              figures are the lengths of the arrays the endpoint returned.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {kindTally(wire.state).map((k) => (
                <li key={k.kind} className="flex items-center gap-1.5">
                  <KindChip kind={k.kind} />
                  <span className="text-[12px] tabular-nums text-slate-700">{k.n}</span>
                </li>
              ))}
            </ul>
            <p className={`mt-3 ${MEASURE} ${TYPE.fine}`}>
              These are counted separately and are never added together. A catalogue entry is not a
              reachable server; a declared slot is not a measurement. Summing across kinds is how six
              reachable MCP servers were once published as three hundred and seventy-eight.
            </p>
          </div>

          {wire.state.groups.map((g) => (
            <section key={g.id} className="mt-7">
              <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
                {TITLES[g.id] ?? prettyKey(g.id)}
              </h3>
              {g.meta.length > 0 && (
                <dl className="mt-2 space-y-1">
                  {g.meta.map((m) => (
                    <div key={m.key} className="flex flex-wrap gap-x-2">
                      <dt className={`${TYPE.mono} shrink-0`}>{prettyKey(m.key)}</dt>
                      <dd className={`${MEASURE} ${TYPE.fine}`}>{m.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
                {g.facts.map((f) => (
                  <li key={f.key} className="contents">
                    <FactRow f={f} />
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {(wire.state.contract.length > 0 || wire.state.notCovered.length > 0) && (
            <section className="mt-8 rounded-2xl border border-slate-900/10 bg-slate-50/80 p-5">
              <h3 className={TYPE.section}>The endpoint's own contract</h3>
              <p className={`mt-1 ${MEASURE} ${TYPE.fine}`}>
                Quoted verbatim from the payload, not paraphrased here.
              </p>
              <dl className="mt-3 space-y-2.5">
                {[...wire.state.contract, ...wire.state.notCovered, ...wire.state.doctrine].map((c) => (
                  <div key={c.key}>
                    <dt className={TYPE.mono}>{prettyKey(c.key)}</dt>
                    <dd className={`mt-0.5 ${MEASURE} text-[12.5px] leading-relaxed text-slate-700`}>{c.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <a
              href="/api/state"
              target="_blank"
              rel="noreferrer"
              className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
            >
              The raw payload ↗
            </a>
            <button
              type="button"
              onClick={() => onOpenRoute("/claims-register", "Claims register")}
              className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
            >
              The claims register
            </button>
            <button
              type="button"
              onClick={() => onOpenRoute("/honesty", "Honesty gate")}
              className={`rounded-xl border border-slate-900/12 bg-white px-3.5 py-2 text-[12.5px] font-semibold text-slate-700 transition hover:bg-slate-900/5 motion-reduce:transition-none ${FOCUS}`}
            >
              What we got wrong
            </button>
          </div>
        </>
      )}
    </div>
  );
}
