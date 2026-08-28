import { FOCUS, SP, TYPE } from "./glass";
import { COUNCIL_OS_TOOLING_QUICK, type SideMenuItem } from "@/data/councilOsSideMenu";
import { openLobby } from "@/lib/lobbyLink";

/** Right-rail "Tooling" section — quick links to missing surfaces. */
export default function LobbyToolingRail({
  onOpenRoute,
}: {
  onOpenRoute?: (path: string, label: string) => void;
}) {
  const go = (item: SideMenuItem) => {
    if (item.kind !== "route") return;
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      openLobby({
        prompt: `What does “${item.label}” publish externally, and how should Council OS chat treat it?`,
      });
      return;
    }
    if (onOpenRoute) onOpenRoute(item.href, item.label);
    else window.location.href = item.href;
    openLobby({
      prompt: `Walk me through ${item.label} at ${item.href} — measure, control, or verify from chat.`,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <h3 className={TYPE.section}>Quick tooling</h3>
      <p className={`mt-1 ${TYPE.fine}`}>Opens in the site column beside this dock.</p>

      <ul className={`${SP.stackTight} mt-3 overflow-y-auto`}>
        {COUNCIL_OS_TOOLING_QUICK.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => go(item)}
                className={`flex w-full items-center gap-2 rounded-xl border border-slate-900/10 bg-white/80 px-3 py-2 text-left hover:bg-white ${FOCUS}`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-800" />
                <span>
                  <span className="block text-[12px] font-semibold text-slate-900">{item.label}</span>
                  <span className="block text-[10px] text-slate-500">{item.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={() => openLobby({ task: "meok-assist", pane: "fix", aguiHandle: "remediation-assist" })}
          className={`w-full rounded-xl bg-emerald-800 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-900 ${FOCUS}`}
        >
          MEOK / AG-UI assist
        </button>
        <button
          type="button"
          onClick={() => openLobby({ task: "eunomia-router", pane: "routes" })}
          className={`w-full rounded-xl border border-slate-900/10 px-3 py-2 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          Seed Eunomia in chat
        </button>
      </div>

      <p className={`mt-auto pt-4 ${TYPE.fine}`}>Council measures. Tooling assists. Fixers remediate. Re-measure free.</p>
    </div>
  );
}
