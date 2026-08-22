import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";
import { LOBBY_TABS, type LobbyTab } from "./tabs";

/**
 * LobbyHome — the Council OS desktop.
 *
 * This used to iframe /os, which meant an OS inside an OS: a second chat,
 * a second sidebar, and a page that thought it was the launcher. Home is
 * now a native pane. Tiles switch the real destinations. Two extra tiles
 * open crawlable pages in this pane (methodology, honesty) — they are not
 * a second product, they are the receipts.
 */

const DESKTOP = LOBBY_TABS.filter((t) => t.id !== "home");

const EXTRAS: { label: string; blurb: string; path: string }[] = [
  { label: "Methodology", blurb: "How we grade — no model in the verdict.", path: "/methodology" },
  { label: "Honesty gate", blurb: "What we cannot yet measure, published.", path: "/honesty" },
];

export default function LobbyHome({
  onSelect,
  onOpenRoute,
}: {
  onSelect: (t: LobbyTab) => void;
  onOpenRoute: (path: string, label: string) => void;
}) {
  return (
    <section aria-labelledby="coai-os-home-h" className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Council OS</p>
      <h2 id="coai-os-home-h" className="mt-1 text-[22px] font-semibold tracking-tight text-slate-900">
        One workspace. The live surfaces. The ask bar.
      </h2>
      <p className={`mt-3 ${MEASURE} ${TYPE.body}`}>
        This is the Council OS — not a second site. Each tile opens the real page
        in this pane. The ask bar under it reads the published estate; it does
        not invent. Empty cells stay empty. Counts come from GET /api/gspc.
        Hide the sidebars when you want this column alone.
      </p>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Live surfaces</h3>
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
