import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";
import { LOBBY_TABS, type LobbyTab } from "./tabs";
import LivingBoard from "./LivingBoard";

/**
 * LobbyHome — the Council OS desktop.
 *
 * Living board first (every published axis from GET /api/gspc, in-lane kept
 * separate). Tiles then switch the real destinations. Two extra tiles open
 * crawlable receipts in this pane.
 */

const DESKTOP = LOBBY_TABS.filter((t) => t.id !== "home");

const EXTRAS: { label: string; blurb: string; path: string }[] = [
  { label: "Methodology", blurb: "How we grade — no model in the verdict.", path: "/methodology" },
  { label: "Honesty gate", blurb: "What we cannot yet measure, published.", path: "/honesty" },
];

/** Existing public landings — not new audiences. Each is a live route. */
const PEOPLE: { label: string; blurb: string; path: string }[] = [
  { label: "Regulators", blurb: "Check behaviour against the published board.", path: "/for/regulator" },
  { label: "Insurers", blurb: "Price AI risk on signed evidence.", path: "/insurers" },
  { label: "Enterprises", blurb: "Prove the system before you ship.", path: "/for/enterprise" },
  { label: "Finance", blurb: "Credit, DORA, and the Act — evidenced once.", path: "/for/finance" },
  { label: "Compare vendors", blurb: "What we publish versus GRC platforms.", path: "/compare" },
];

const LAYER0: { label: string; blurb: string; path: string }[] = [
  { label: "Layer 0", blurb: "The signed trust layer the agent rail stands on.", path: "/layer0" },
  { label: "Trust center", blurb: "Keys, receipts, and what we will not claim.", path: "/trust-center" },
  { label: "Network", blurb: "N sites and where the record lives.", path: "/network" },
  { label: "Hive", blurb: "Frameworks and groups, as published.", path: "/hive" },
  { label: "Intel", blurb: "Competitor and landscape notes.", path: "/intel" },
];

export default function LobbyHome({
  onSelect,
  onOpenRoute,
}: {
  onSelect: (t: LobbyTab) => void;
  onOpenRoute: (path: string, label: string) => void;
}) {
  const openBoard = () => {
    const board = LOBBY_TABS.find((t) => t.id === "board");
    if (board) onSelect(board);
  };

  return (
    <section aria-labelledby="coai-os-home-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Council OS</p>
      <h2 id="coai-os-home-h" className="mt-1 text-[26px] font-semibold tracking-tight text-slate-900">
        Measure. Sign. Check.
      </h2>
      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>
        This chat is the AG UI — Council OS. One workspace, not a model
        playground. The living board is below — every axis the API publishes,
        nothing invented. Models and tools are ranked by signed measurement,
        not tokens. Ask underneath.
      </p>

      <div className="mt-8">
        <LivingBoard onOpenBoard={openBoard} />
      </div>

      <h3 className={`${TYPE.section} mt-2 mb-3`}>Live surfaces</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DESKTOP.map((t) => {
          const gold = t.accent === "gold";
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t)}
                className={
                  `${SURFACE} ${SP.card} flex h-full w-full flex-col items-start text-left transition ` +
                  `motion-reduce:transition-none ${FOCUS} ` +
                  (gold
                    ? "bg-amber-50/80 hover:bg-amber-50"
                    : "bg-white/80 hover:bg-white")
                }
              >
                <span className="text-[14px] font-semibold text-slate-900">{t.label}</span>
                <span className={`mt-1.5 ${TYPE.muted}`}>{t.blurb}</span>
                {t.path && <span className={`mt-3 ${TYPE.mono}`}>{t.path}</span>}
                {gold && (
                  <span className="mt-3 rounded-full border border-amber-700/30 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                    not a measurement surface
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Who you are</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PEOPLE.map((x) => (
          <li key={x.path}>
            <button
              type="button"
              onClick={() => onOpenRoute(x.path, x.label)}
              className={`${SURFACE} ${SP.card} flex h-full w-full flex-col items-start bg-white/80 text-left transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
            >
              <span className="text-[14px] font-semibold text-slate-900">{x.label}</span>
              <span className={`mt-1.5 ${TYPE.muted}`}>{x.blurb}</span>
              <span className={`mt-3 ${TYPE.mono}`}>{x.path}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Layer 0 and the record</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {LAYER0.map((x) => (
          <li key={x.path}>
            <button
              type="button"
              onClick={() => onOpenRoute(x.path, x.label)}
              className={`${SURFACE} ${SP.card} flex h-full w-full flex-col items-start bg-white/80 text-left transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
            >
              <span className="text-[14px] font-semibold text-slate-900">{x.label}</span>
              <span className={`mt-1.5 ${TYPE.muted}`}>{x.blurb}</span>
              <span className={`mt-3 ${TYPE.mono}`}>{x.path}</span>
            </button>
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Receipts</h3>
      <ul className="grid gap-3 sm:grid-cols-2">
        {EXTRAS.map((x) => (
          <li key={x.path}>
            <button
              type="button"
              onClick={() => onOpenRoute(x.path, x.label)}
              className={`${SURFACE} ${SP.card} flex h-full w-full flex-col items-start bg-white/80 text-left transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
            >
              <span className="text-[14px] font-semibold text-slate-900">{x.label}</span>
              <span className={`mt-1.5 ${TYPE.muted}`}>{x.blurb}</span>
              <span className={`mt-3 ${TYPE.mono}`}>{x.path}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
