import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";
import { LOBBY_TABS, routesIn, type LobbyTab } from "./tabs";
import LivingBoard from "./LivingBoard";

/**
 * LobbyHome — the Council OS desktop.
 *
 * Living board first (every published axis from GET /api/gspc, in-lane kept
 * separate). Rail tabs then the extra live routes those tabs do not own.
 */

const DESKTOP = LOBBY_TABS.filter((t) => t.id !== "home");

/** Existing public landings — not new audiences. Each is a live route. */
const PEOPLE: { label: string; blurb: string; path: string }[] = [
  { label: "Regulators", blurb: "The regulator door — everything free, forever.", path: "/regulators" },
  { label: "Insurers", blurb: "Price AI risk on signed evidence.", path: "/insurers" },
  { label: "Enterprises", blurb: "Prove the system before you ship.", path: "/assess" },
  { label: "Finance", blurb: "The financial axes — UNMEASURED stated first.", path: "/financial-axes" },
  { label: "Compare vendors", blurb: "What we publish versus GRC platforms.", path: "/compare" },
];

function Tile({
  label,
  blurb,
  path,
  gold,
  onClick,
}: {
  label: string;
  blurb: string;
  path?: string;
  gold?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        `${SURFACE} ${SP.card} flex h-full w-full flex-col items-start text-left transition ` +
        `motion-reduce:transition-none ${FOCUS} ` +
        (gold ? "bg-amber-50/80 hover:bg-amber-50" : "bg-white/80 hover:bg-white")
      }
    >
      <span className="text-[14px] font-semibold text-slate-900">{label}</span>
      <span className={`mt-1.5 ${TYPE.muted}`}>{blurb}</span>
      {path && <span className={`mt-3 ${TYPE.mono}`}>{path}</span>}
      {gold && (
        <span className="mt-3 rounded-full border border-amber-700/30 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
          not a measurement surface
        </span>
      )}
    </button>
  );
}

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
        This chat is the AG UI — Council OS. One workspace. The living board
        is below — every axis the API publishes, nothing invented. Benchmarkers,
        models, tools, library, and the workbench are the same glass. Ask
        underneath.
      </p>

      <div className="mt-8">
        <LivingBoard onOpenBoard={openBoard} />
      </div>

      <h3 className={`${TYPE.section} mt-2 mb-3`}>Live surfaces</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DESKTOP.map((t) => (
          <li key={t.id}>
            <Tile
              label={t.label}
              blurb={t.blurb}
              path={t.path || undefined}
              gold={t.accent === "gold"}
              onClick={() => onSelect(t)}
            />
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Who you are</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PEOPLE.map((x) => (
          <li key={x.label}>
            <Tile label={x.label} blurb={x.blurb} path={x.path} onClick={() => onOpenRoute(x.path, x.label)} />
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Layer 0 and the record</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {routesIn("record").map((x) => (
          <li key={x.path}>
            <Tile label={x.label} blurb={x.blurb} path={x.path} onClick={() => onOpenRoute(x.path, x.label)} />
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Analyst desk</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {routesIn("analyst").map((x) => (
          <li key={x.path}>
            <Tile label={x.label} blurb={x.blurb} path={x.path} onClick={() => onOpenRoute(x.path, x.label)} />
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Receipts</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {routesIn("receipts").map((x) => (
          <li key={x.path}>
            <Tile label={x.label} blurb={x.blurb} path={x.path} onClick={() => onOpenRoute(x.path, x.label)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
