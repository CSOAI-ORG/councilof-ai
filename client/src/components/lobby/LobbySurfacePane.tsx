import { openLobby, type LobbyTaskId } from "@/lib/lobbyLink";
import type { LobbyTab } from "./tabs";
import { FOCUS, SP, SURFACE, TYPE } from "./glass";

/** Generic in-dock pane for tabs that also have a full site route. */
export default function LobbySurfacePane({
  tab,
  onOpenRoute,
  task,
}: {
  tab: LobbyTab;
  onOpenRoute: (path: string, label: string) => void;
  task?: LobbyTaskId;
}) {
  return (
    <section className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>{tab.label}</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">{tab.label}</h2>
      <p className={`mt-2 ${TYPE.body} text-slate-600`}>{tab.blurb}</p>

      {tab.path && (
        <button
          type="button"
          onClick={() => onOpenRoute(tab.path, tab.label)}
          className={`mt-6 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 ${FOCUS}`}
        >
          Open {tab.path} in site column →
        </button>
      )}

      {task && (
        <button
          type="button"
          onClick={() => openLobby({ task, pane: tab.id })}
          className={`${SURFACE} mt-3 w-full rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 ${FOCUS}`}
        >
          Seed Council OS chat for this surface →
        </button>
      )}

      <p className={`mt-6 ${TYPE.fine}`}>
        The dock stays open — footer visible, AG-UI chat below.
      </p>
    </section>
  );
}
