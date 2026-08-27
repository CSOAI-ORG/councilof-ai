import { FOCUS, MEASURE, SP, TYPE } from "./glass";
import { PLAY_CARDS, PLAY_NOTICE } from "./play";

/**
 * LobbyPlay — the gold "Council OS — local play" section of the centre pane.
 *
 * GOLD, NOT EMERALD, ON PURPOSE. Every measurement surface in this estate is
 * emerald. This one is amber/gold so that a reader can tell at a glance that
 * they have left the measured surfaces: nothing in this gallery is a
 * measurement, and nothing in it is signed.
 *
 * THE HONEST STATE IS THE FEATURE. A card either opens a REAL route in the
 * centre pane, or it carries "Not yet playable — in build" and has no link at
 * all. It is never dressed as playable: the arena wrapper exists only as a local
 * package and nothing is deployed. See the per-card `reality` line in play.ts —
 * it is rendered on every card, on both statuses, with no way to dismiss it.
 */

export default function LobbyPlay({
  onOpenRoute,
}: {
  onOpenRoute: (route: string, label: string) => void;
}) {
  return (
    <section aria-labelledby="coai-lobby-play-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id="coai-lobby-play-h" className="text-[17px] font-semibold tracking-tight text-amber-900">
          Council OS — local play
        </h2>
        <span className="rounded-full border border-amber-600/35 bg-amber-50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-800">
          not a measurement surface
        </span>
      </div>

      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>{PLAY_NOTICE}</p>

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {PLAY_CARDS.map((c) => {
          const live = c.status === "route" && !!c.route;
          return (
            <li
              key={c.id}
              className="overflow-hidden rounded-2xl border border-amber-700/20 bg-white/85 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_28px_-16px_rgba(120,53,15,0.45)]"
            >
              <img
                src={c.image}
                alt={c.alt}
                loading="lazy"
                decoding="async"
                className="h-36 w-full object-cover"
              />
              <div className={SP.card}>
                <div className="flex items-start gap-2">
                  <h3 className="text-[14px] font-semibold leading-snug tracking-tight text-slate-900">
                    {c.title}
                  </h3>
                  <span
                    className={
                      "ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide " +
                      (live
                        ? "border-emerald-700/30 bg-emerald-50 text-emerald-800"
                        : "border-amber-700/35 bg-amber-100 text-amber-900")
                    }
                  >
                    {live ? (c.chip ?? "opens a page") : "in build"}
                  </span>
                </div>

                <p className={`mt-2 ${TYPE.muted}`}>{c.blurb}</p>

                <p
                  className={
                    "mt-3 rounded-lg px-3 py-2 text-[11.5px] leading-relaxed " +
                    (live ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-900")
                  }
                >
                  {!live && <strong className="font-bold">Not yet playable — in build. </strong>}
                  {c.reality}
                </p>

                {live ? (
                  <button
                    type="button"
                    onClick={() => onOpenRoute(c.route!, c.title)}
                    className={`mt-3 inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-amber-900 motion-reduce:transition-none ${FOCUS}`}
                  >
                    {c.chip === "playable now" ? "Play" : "Open"} {c.route} in the centre pane
                  </button>
                ) : (
                  <p className={`mt-3 ${TYPE.fine}`} aria-hidden="false">
                    No link, because there is no destination yet.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className={`mt-6 ${MEASURE} ${TYPE.fine}`}>
        The measured surfaces are the emerald ones in the left rail. If you want a number you can
        check, start with the live board or verify a card — this gallery has none.
      </p>
    </section>
  );
}
