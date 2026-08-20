import { findHumanBaseline, findHumanVsAiSlot, pct, useGspcBoard, type GspcPayload } from "./useGspcBoard";
import StatusChip from "./StatusChip";
import { lobbyTaskHref, openLobby } from "@/lib/lobbyLink";

/**
 * HumanVsAiPanel — the human leg beside the AI leg, or an honest empty room.
 *
 * THE RULE THIS COMPONENT EXISTS TO ENFORCE. A human-vs-AI comparison is the
 * easiest chart on this site to fake, so this panel will only draw one when the
 * payload actually carries a human figure (see findHumanBaseline). When it does,
 * the human leg is labelled REPORTED — a published aggregate baseline someone
 * else collected and we cite — and the AI leg is labelled as measured here. The
 * two are shown side by side, never fused into one "gap" number.
 *
 * WHEN THERE IS NO HUMAN FIGURE — which is the case today — the panel says "not
 * yet published" and stops. It does not borrow a number from somewhere adjacent
 * and it does not draw an empty axis that implies a zero.
 *
 * THE `human-vs-ai` SLOT IS NOT A HUMAN SCORE. The board serves an in-lane slot
 * by that name; it measures how often a MODEL agrees with a human key. Where it
 * exists we show it as exactly that — the AI leg — chipped IN-LANE, because it
 * was measured on a smaller fleet with no separation test and is not part of the
 * board.
 */

export default function HumanVsAiPanel({
  data: injected,
  className = "",
}: {
  /** Pass the payload when the parent already has it, to avoid a second read. */
  data?: GspcPayload | null;
  className?: string;
}) {
  const own = useGspcBoard();
  const data = injected ?? own.data;
  const error = injected ? null : own.error;
  const loading = injected ? false : own.loading;

  const human = findHumanBaseline(data);
  const slot = findHumanVsAiSlot(data);
  const aiValue = typeof slot?.accuracy === "number" && Number.isFinite(slot.accuracy) ? slot.accuracy : null;

  return (
    <section className={`rounded-2xl border border-emerald-600/15 bg-white p-6 shadow-sm sm:p-8 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-600">
        Human vs AI
      </p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
        Two legs, never fused
      </h3>

      {error && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          The board endpoint <code className="font-mono">/api/gspc</code> could not be reached
          ({error}). Nothing is shown here because nothing was read — no placeholder stands in for a
          figure we do not have.
        </p>
      )}
      {loading && !error && <p className="mt-4 text-sm text-gray-500">Reading the live board…</p>}

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* ── the AI leg ─────────────────────────────────────────────── */}
          <div className="rounded-2xl border border-emerald-600/20 bg-emerald-50/50 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                AI — measured here
              </span>
              {slot && <StatusChip kind="IN-LANE" />}
            </div>
            {aiValue !== null ? (
              <>
                <p className="mt-3 font-mono text-4xl font-black tracking-tight text-gray-900">
                  {pct(aiValue)}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {slot?.task ?? slot?.bench ?? slot?.axis}
                  {typeof slot?.n === "number" && (
                    <> · <span className="font-mono">n={slot.n}</span></>
                  )}
                </p>
                {slot?.fleet && <p className="mt-1 text-xs text-gray-500">{slot.fleet}</p>}
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  This is a model figure: how often the measured models agreed with a human answer
                  key. It is not a score achieved by people.
                </p>
              </>
            ) : (
              <div className="mt-3">
                <StatusChip kind="UNMEASURED" />
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  The board does not currently serve a human-vs-AI slot. Nothing is drawn in its
                  place.
                </p>
              </div>
            )}
          </div>

          {/* ── the human leg ──────────────────────────────────────────── */}
          <div className="rounded-2xl border border-sky-600/20 bg-sky-50/50 p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-700">
                Human — published baseline
              </span>
              <StatusChip kind={human ? "REPORTED" : "UNMEASURED"} />
            </div>
            {human ? (
              <>
                <p className="mt-3 font-mono text-4xl font-black tracking-tight text-gray-900">
                  {pct(human.value)}
                </p>
                <p className="mt-2 text-sm text-gray-600">{human.label}</p>
                <p className="mt-1 text-xs font-mono text-gray-500">source: {human.source}</p>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  {human.note ??
                    "A published aggregate baseline that someone else collected and we cite — REPORTED context, not our own collection, and not graded by our instrument. Human labels carry their own disagreement, so this leg sits beside the measured figure rather than inside it."}
                </p>
              </>
            ) : (
              <>
                <p className="mt-3 text-lg font-bold tracking-tight text-gray-900">
                  Not yet published
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  The board carries no human baseline figure for this comparison. Rather than borrow
                  a number from an adjacent study and present it as ours, this leg stays empty and
                  says why.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  When a baseline is published it will appear here labelled REPORTED, with its
                  source, and it will still be shown beside the measured figure — never subtracted
                  into a single &ldquo;gap&rdquo;. Regulation and a human aggregate are not
                  commensurable on one scale.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {data && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href={lobbyTaskHref("human-vs-ai")}
            onClick={(e) => { e.preventDefault(); openLobby({ task: "human-vs-ai" }); }}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-500"
          >
            Ask about this in the Council Lobby →
          </a>
          <a
            href="/api/gspc"
            className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline"
          >
            Read the raw payload
          </a>
        </div>
      )}
    </section>
  );
}
