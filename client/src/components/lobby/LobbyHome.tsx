import HfLivingRecord from "@/components/HfLivingRecord";
import { FOCUS, MEASURE, SP, SURFACE, TYPE } from "./glass";
import { LOBBY_TABS, OS_RAIL_TABS, type LobbyTab } from "./tabs";
import LivingBoard from "./LivingBoard";

/**
 * LobbyHome — the Council OS desktop.
 *
 * Living board first. Then the five instruments + Play. Not the sitemap.
 * Sign-in is a real navigation to /dashboard (DSH), never an iframe inside /os.
 */

const DESKTOP = OS_RAIL_TABS.filter((t) => t.id !== "home");

function Tile({
  label,
  blurb,
  path,
  gold,
  native,
  auth,
  archive,
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
  /** The site classifies this route as Library/archive (library-ia.isLibraried). */
  archive?: boolean;
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
      {/* The page carries a "Reference / archive" strip when you open it directly, and
          the OS frames it with ?embed=1, which hides that strip. The desktop was
          therefore presenting an archive page as a current surface. The classifier is
          the site's own (library-ia.isLibraried), so the OS cannot disagree with the
          Library about what is archived. */}
      {archive && (
        <span className="mt-3 rounded-full border border-slate-900/15 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
          reference · archive
        </span>
      )}
    </button>
  );
}

export default function LobbyHome({
  onSelect,
}: {
  onSelect: (t: LobbyTab) => void;
  /** Kept so the overlay can pass openRoute; Home tiles never iframe. */
  onOpenRoute?: (path: string, label: string) => void;
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
        is below — every axis the API publishes, nothing invented. Board, verify,
        cards, evidence, embed. Ask on the right. Documents open as pages.
      </p>

      <div className="mt-8">
        <LivingBoard onOpenBoard={openBoard} />
      </div>

      <HfLivingRecord compact />

      <h3 className={`${TYPE.section} mt-8 mb-3`}>Instruments</h3>
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

      <p className={`mt-8 ${MEASURE} ${TYPE.muted}`}>
        <a href="/dashboard" className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950">
          Sign in
        </a>
        {" "}opens the signed-in dashboard as its own page — not inside this workspace.
      </p>
    </section>
  );
}
