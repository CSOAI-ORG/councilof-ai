import { useEffect, useState } from "react";
import { lobbyHref, openLobby } from "@/lib/lobbyLink";
import { FOCUS } from "@/components/lobby/glass";
import { QUESTS, XP_MAX, loadSave, mode, type QuestId, type Save } from "./quests";

/**
 * GameBar — the local-play ladder on /os.
 *
 * TWO DEFECTS FIXED HERE (2026-08-26).
 *
 * 1. The first quest linked to `#council-chat`, an anchor that has not existed on
 *    /os since the second chat was removed, AND `onClick` did `if (q.id !== "ask")
 *    markQuest(q.id)` — so it was excluded from marking as well. The quest could
 *    never be completed by anyone, the ladder could never leave CITIZEN, and the
 *    RED rung at 50 XP sat above a reachable maximum of 30.
 *
 * 2. The other two quests were marked for CLICKING THE LINK. "Verify a card with
 *    no login" was awarded to a reader who had verified nothing. The quests now
 *    fire from the surfaces that perform the action — the lobby chat marks `ask`
 *    when a grounded answer lands, the verify pane marks `verify` when a record
 *    actually verifies — so the label and the award describe the same event.
 *    `arena` still fires on the click, because "Open Council Space" IS the click.
 *
 * Local play only. XP lives in this browser. No invented global scores.
 * Modes match the public stack: CITIZEN / MAYOR / RED.
 */

/** Where each quest sends the reader. Marking is the surface's job, not the link's. */
const DEST: Record<QuestId, { href: string; lobbyPane?: "home" | "verify" | "space"; marksOnClick?: boolean }> = {
  ask: { href: lobbyHref({ pane: "home" }), lobbyPane: "home" },
  arena: { href: lobbyHref({ pane: "space" }), lobbyPane: "space", marksOnClick: true },
  verify: { href: lobbyHref({ pane: "verify" }), lobbyPane: "verify" },
};

export { markQuest } from "./quests";

export default function GameBar() {
  const [save, setSave] = useState<Save>({ xp: 0, quests: [] });

  useEffect(() => {
    setSave(loadSave());
    const on = () => setSave(loadSave());
    window.addEventListener("council-os-game", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("council-os-game", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const m = mode(save.xp);
  const pct = Math.min(100, (save.xp / XP_MAX) * 100);

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-400 px-3 py-1 font-mono text-[11px] font-black tracking-[0.18em] text-gray-900">
          {m.name}
        </span>
        <div className="min-w-[12rem] flex-1">
          <div className="flex items-baseline justify-between text-[11px] text-slate-600">
            <span className="font-semibold text-slate-700">Council OS · local play</span>
            <span className="font-mono tabular-nums">
              {save.xp} XP{m.next ? ` · next ${m.next}` : ` · ${XP_MAX} is the top`}
            </span>
          </div>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full bg-amber-100"
            role="progressbar"
            aria-valuenow={save.xp}
            aria-valuemin={0}
            aria-valuemax={XP_MAX}
            aria-label="Council OS local play progress"
          >
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-600">
            {m.hint} Progress stays in this browser — nothing is sent anywhere, and this is not a
            measurement.
          </p>
        </div>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {QUESTS.map((q) => {
          const done = save.quests.includes(q.id);
          const dest = DEST[q.id];
          return (
            <li key={q.id} className="contents">
              <a
                href={dest.href}
                onClick={(e) => {
                  if (dest.marksOnClick) {
                    // Fire-and-forget: this quest's action IS opening the pane.
                    import("./quests").then((m2) => m2.markQuest(q.id));
                  }
                  if (dest.lobbyPane) {
                    e.preventDefault();
                    openLobby({ pane: dest.lobbyPane });
                  }
                }}
                className={`block min-h-[44px] rounded-xl border px-3 py-2 text-[12px] ${FOCUS} ${
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wide">
                  {done ? "done" : `+${q.xp} xp`}
                </span>
                <span className="mt-0.5 block font-semibold">{q.label}</span>
                <span className="mt-0.5 block text-[11px] font-normal text-slate-600">
                  {done ? q.done : "opens the pane that does it"}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
