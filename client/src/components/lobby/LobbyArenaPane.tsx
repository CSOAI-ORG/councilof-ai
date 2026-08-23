import { openLobby } from "@/lib/lobbyLink";
import { FOCUS, SP, SURFACE, TYPE } from "./glass";

/** In-lobby arena summary — full rounds at /gspc-arena in site column. */
export default function LobbyArenaPane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  return (
    <section className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>Arena</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">LMArena-style compare</h2>
      <p className={`mt-2 ${TYPE.body} text-slate-600`}>
        Blind rounds on the GSPC board — deterministic grader, not a model jury. Council Space hosts the full arena in the site column.
      </p>

      <ul className="mt-6 space-y-2 text-sm text-slate-700">
        <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">Head-to-head on published axes only</li>
        <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">TIE when separation fails — never faked rankings</li>
        <li className="rounded-lg border border-slate-200 bg-white px-3 py-2">Signed evidence on GET /api/gspc</li>
      </ul>

      <div className="mt-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => onOpenRoute("/gspc-arena", "Council Space")}
          className={`rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 ${FOCUS}`}
        >
          Open Council Space →
        </button>
        <button
          type="button"
          onClick={() => openLobby({ task: "arena", pane: "space" })}
          className={`${SURFACE} rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          Ask about arena rounds in chat →
        </button>
        <button
          type="button"
          onClick={() => onOpenRoute("/arena-harness", "Arena harness")}
          className={`${SURFACE} rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          Arena harness thesis →
        </button>
      </div>
    </section>
  );
}
