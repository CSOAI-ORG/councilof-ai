import { useEffect, useState } from "react";
import {
  fetchAxes, hasInterval, hasMacroF1, publicCaption, quotable, wilson,
  type Axis, type InLaneAxis,
} from "@/lib/gspcAxes";

/**
 * CityPanel — Council City inside Council OS.
 *
 * The living printer of the public board. Jail is a measured floor (never an
 * extra axis). An unnamed reserved slot stays honestly empty.
 *
 * Honesty rules enforced here:
 *   - jail is MEASURED (n=71); separation is TIE on the live board — a TIE is not a separated leader
 *   - the reserved slot is shown unnamed — no fabricated instrument label
 *   - Never type a slot count — chrome reads totals.public_count from GET /api/gspc
 *   - Every number comes from GET /api/gspc, never typed into this component
 *   - UNMEASURED stays UNMEASURED; no score invented
 */

const TONE: Record<string, string> = {
  MEASURED: "border-emerald-300 bg-emerald-50 text-emerald-700",
  UNMEASURED: "border-sky-300 bg-sky-50 text-sky-700",
  DRAFT: "border-amber-300 bg-amber-50 text-amber-700",
  SPEC: "border-violet-300 bg-violet-50 text-violet-700",
  PLANNED: "border-slate-300 bg-slate-100 text-slate-500",
  UNTESTED: "border-amber-300 bg-amber-50 text-amber-700",
};

function AxisCard({ a }: { a: Axis }) {
  const scored = quotable(a);
  const withCI = hasInterval(a);
  // `scored` guarantees a.accuracy is a real number — see quotable() in gspcAxes.
  const [lo, hi] = scored ? wilson(a.accuracy as number, a.n) : [0, 0];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">{a.axis}</div>
          <div className="font-mono text-[11px] text-slate-500">{a.bench}</div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${TONE[a.status] ?? TONE.PLANNED}`}>
          {a.status}
        </span>
      </div>
      {scored ? (
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tabular-nums text-emerald-600">{(a.accuracy as number).toFixed(3)}</span>
            <span className="text-[11px] text-slate-500">accuracy · n={a.n}</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-500">
            {hasMacroF1(a) ? `macro F1 ${(a.macro_f1 as number).toFixed(3)} · ` : ""}
            {withCI
              ? `Wilson 95% [${lo.toFixed(3)}, ${hi.toFixed(3)}]`
              : "n<30 usable — no interval"}
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {/* An axis with a bank but no accuracy is not an axis with no bank. */}
          <div className="text-sm font-medium text-slate-500">
            {a.status === "MEASURED" && a.n > 0 ? "Measured, but no accuracy published" : "No score — not earned"}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            {a.n
              ? a.status === "MEASURED"
                ? `Item bank n=${a.n} — this axis publishes no accuracy, so none is shown`
                : `Item bank n=${a.n}`
              : "No item bank yet (n=0)"}
          </div>
        </div>
      )}
      <p className="mt-2 text-[12px] leading-snug text-slate-500">{a.task}</p>
    </div>
  );
}

export default function CityPanel() {
  const [axes, setAxes] = useState<Axis[]>([]);
  const [inLane, setInLane] = useState<InLaneAxis[]>([]);
  const [jail, setJail] = useState<Axis | null>(null);
  const [caption, setCaption] = useState("Reading live board from GET /api/gspc…");
  const [source, setSource] = useState<"wire" | "snapshot" | "loading">("loading");

  useEffect(() => {
    const ac = new AbortController();
    fetchAxes(ac.signal).then((r) => {
      const jailAxis = r.axes.find((a) => a.axis === "jail") ?? null;
      const canonical = r.axes.filter((a) => a.axis !== "jail");
      setAxes(canonical);
      setJail(jailAxis);
      setInLane(r.inLane);
      // Prefer the API sentence. Do not fall back to jail-filtered countOf
      // (that prints "N measured of N" and hides the live public_count).
      setCaption(publicCaption(r.publicCount));
      setSource(r.source);
    });
    return () => ac.abort();
  }, []);

  return (
    <div className="space-y-8">
      {/* The living board — counts from GET /api/gspc */}
      <section>
        <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-xl font-bold text-slate-900">The living board</h2>
          {/* Same as AxisPanel: say so when this is the bundled snapshot rather
              than a live read, instead of passing stale figures off as fresh. */}
          <p className="text-[13px] text-slate-500">
            {source === "loading" ? "Reading GET /api/gspc…" : caption}
            {" · "}MEASURED shows a number; empty stays empty.
            {source === "snapshot" && (
              <>
                {" "}
                <em className="text-amber-800">
                  (GET /api/gspc did not answer — these are the last recorded figures bundled with
                  the page, not a live read. The endpoint is the authority.)
                </em>
              </>
            )}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {axes.map((a) => (
            <AxisCard key={a.axis} a={a} />
          ))}
        </div>
      </section>

      {/* Jail — the measured floor (not an extra axis) */}
      {jail && (
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/60 to-white p-6">
          <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h3 className="text-lg font-bold text-slate-900">Jail — the measured floor</h3>
            <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide ${TONE[jail.status] ?? TONE.PLANNED}`}>
              {jail.status}
            </span>
          </div>
          <p className="text-[13px] text-slate-600 max-w-2xl">
            Can this model be talked out of its guardrails? Jail is <strong>MEASURED</strong>
            {jail.n ? ` (n=${jail.n} gold cells)` : ""} on a smaller fleet; separation is{" "}
            <strong>TIE</strong> on the live board — a TIE is not a separated leader. Never counted
            as an extra axis. The live board reads{" "}
            <strong>{source === "loading" ? "totals.public_count from GET /api/gspc" : caption}</strong>.
            The best detector still misses most escapes.
          </p>
          {quotable(jail) && (
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold tabular-nums text-slate-700">{(jail.accuracy as number).toFixed(3)}</span>
              <span className="text-[11px] text-slate-500">
                accuracy · n={jail.n} · separation TIE
              </span>
            </div>
          )}
          <p className="mt-2 text-[12px] text-slate-500">{jail.task}</p>
        </section>
      )}

      {/* Unnamed reserved slot — shown honestly empty */}
      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-5">
        <h3 className="text-sm font-bold text-slate-800">Unnamed reserved slot</h3>
        <p className="mt-1 text-[12px] text-slate-500">
          Reserved. No name. No score. No fabricated instrument. Shown honestly empty.
        </p>
        {inLane.length > 0 && (
          <div className="mt-4">
            <p className="text-[11px] text-slate-500 mb-3">
              (In-lane measurements exist on GET /api/gspc under <code className="rounded bg-slate-100 px-1 text-slate-700">measured_in_lane</code>.
              They are not the board — published for honesty, not quotable as axes.)
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {inLane.map((r) => (
                <li key={r.axis} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900">{r.axis}</span>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wide text-slate-500">{r.status}</span>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">{r.bench || r.task}</p>
                  {r.n > 0 && (
                    <p className="mt-2 font-mono text-[13px] tabular-nums text-slate-700">
                      {typeof r.accuracy === "number" ? `${r.accuracy.toFixed(3)} · ` : "no accuracy published · "}n={r.n}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Town honesty — what the City does and does not claim */}
      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
        <h3 className="text-lg font-bold text-slate-900">Town honesty</h3>
        <ul className="mt-4 space-y-2 text-[13px] text-slate-600">
          <li>
            <strong>Measurement credential.</strong> Council of AI measures AI behaviour against frozen, published tests.
            We sign the result. We are not a certification or accreditation body.
          </li>
          <li>
            <strong>Empty stays empty.</strong> A slot without a score is honestly unmeasured — we do not invent numbers.
          </li>
          <li>
            {/* n is read off the live jail row, never typed. It was `n=71` in this
                sentence while the row above it printed the wire's own n — two
                numbers for one fact, one of which would go stale silently. */}
            <strong>Jail is a floor.</strong>{" "}
            {jail
              ? `${jail.status}${jail.n ? ` (n=${jail.n})` : ""}, separation TIE on the live board`
              : "Not on the board this stamp"}{" "}
            — a TIE is not a separated leader. Never called an extra axis.
          </li>
          <li>
            <strong>Ties are ties.</strong> If the lead is not statistically separated (McNemar p{"<"}0.05), it is a tie and we do not count it as a win.
          </li>
          <li>
            <strong>Live counts.</strong> Every number on this page reads from{" "}
            <a href="/api/gspc" className="underline decoration-emerald-400 underline-offset-2 hover:text-emerald-700">GET /api/gspc</a>
            {source !== "loading" && (
              <> ({caption})</>
            )}
            . None is typed by hand.
          </li>
          <li>
            <strong>Verify free.</strong> Anyone can check a signed card at{" "}
            <a href="/gspc-verify" className="underline decoration-emerald-400 underline-offset-2 hover:text-emerald-700">/gspc-verify</a>{" "}
            — no account, no login, no fee.
          </li>
          <li>
            <strong>Paper District.</strong> The flagship research library lives at{" "}
            <a href="https://councilof.ai/paper-district" className="underline decoration-emerald-400 underline-offset-2 hover:text-emerald-700" target="_blank" rel="noreferrer">councilof.ai/paper-district</a>.
          </li>
        </ul>
      </section>
    </div>
  );
}
