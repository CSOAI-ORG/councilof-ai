import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";
import { LOBBY_TABS, routesIn, type LobbyTab } from "./tabs";
import LivingBoard from "./LivingBoard";

/**
 * LobbyHome — the Council OS desktop.
 *
 * Living board first (every published axis from GET /api/gspc, in-lane kept
 * separate). Rail tabs, then the shipped products, then the audience doors, then
 * the extra live routes those tabs do not own.
 *
 * EVERY TILE READS ITS LABEL, BLURB AND PATH FROM tabs.ts. The audience row used
 * to be a hard-coded array in this file, and it had drifted: the "Enterprises"
 * tile pointed at /assess — the assessment form the Get-measured tab already
 * owns — so the desktop offered two doors, one of them mislabelled. The array is
 * gone; audiences are LOBBY_ROUTES like everything else, which makes a duplicate
 * destination visible in one list instead of hidden in two.
 */

const DESKTOP = LOBBY_TABS.filter((t) => t.id !== "home");

function Tile({
  label,
  blurb,
  path,
  gold,
  native,
  auth,
  onClick,
}: {
  label: string;
  blurb: string;
  path?: string;
  gold?: boolean;
  /** A workflow rendered in-process — it has no page of its own, and says so. */
  native?: boolean;
  /** The framed route is behind RequireAuth — the tile says so before the click. */
  auth?: boolean;
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
      {native && (
        <span className="mt-3 rounded-full border border-emerald-700/25 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-900">
          works in this pane
        </span>
      )}
      {gold && (
        <span className="mt-3 rounded-full border border-amber-700/30 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
          not a measurement surface
        </span>
      )}
      {auth && (
        <span className="mt-3 rounded-full border border-slate-900/15 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-700">
          needs an account
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
              native={t.kind === "native" && !t.path}
              auth={t.auth === "required"}
              onClick={() => onSelect(t)}
            />
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Products</h3>
      <p className={`-mt-1 mb-3 ${MEASURE} ${TYPE.muted}`}>
        The shipped products the rail has no pane for. Evidence pack and Embed kit are panes above —
        they take input and hand you an artefact, so they are not listed twice here.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {routesIn("product").map((x) => (
          <li key={x.path}>
            <Tile label={x.label} blurb={x.blurb} path={x.path} onClick={() => onOpenRoute(x.path, x.label)} />
          </li>
        ))}
      </ul>

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Who you are</h3>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {routesIn("audience").map((x) => (
          <li key={x.path}>
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
