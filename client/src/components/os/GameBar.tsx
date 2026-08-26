import { useEffect, useState } from "react";
import { lobbyHref, openLobby } from "@/lib/lobbyLink";
import { FOCUS } from "@/components/lobby/glass";

/**
 * GameBar — sit above Council chat on /os.
 * Local play only. XP and quests live in this browser. No invented global scores.
 * Modes match the public stack: CITIZEN / MAYOR / RED.
 */

type Save = { xp: number; quests: string[] };

const KEY = "council-os-game-v1";
// 2026-08-26: quest 1 pointed at `#council-chat`, an anchor that has not existed
// on /os since the second chat was removed — the link went nowhere and the quest
// could never be completed, so the bar could never leave CITIZEN. It now opens the
// Council OS lobby (the surface that actually holds the ask bar) and marks itself
// like the other two.
const QUESTS: { id: string; label: string; xp: number; href: string; lobbyPane?: "home" }[] = [
  { id: "ask", label: "Ask the Council one grounded question", xp: 20, href: lobbyHref({ pane: "home" }), lobbyPane: "home" },
  { id: "arena", label: "Open Council Space", xp: 15, href: "/gspc-arena" },
  { id: "verify", label: "Verify a card with no login", xp: 15, href: "/gspc-verify" },
];

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { xp: 0, quests: [] };
    const j = JSON.parse(raw);
    return { xp: Number(j.xp) || 0, quests: Array.isArray(j.quests) ? j.quests : [] };
  } catch {
    return { xp: 0, quests: [] };
  }
}

function mode(xp: number) {
  if (xp >= 50) return { name: "RED", next: null as number | null, hint: "You have the three first quests. Keep measuring." };
  if (xp >= 20) return { name: "MAYOR", next: 50, hint: "Open the arena and verify a card." };
  return { name: "CITIZEN", next: 20, hint: "Ask the Council to start." };
}

export function markQuest(id: string) {
  const s = load();
  const q = QUESTS.find((x) => x.id === id);
  if (!q || s.quests.includes(id)) return s;
  const next = { xp: s.xp + q.xp, quests: [...s.quests, id] };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("council-os-game"));
  return next;
}

export default function GameBar() {
  const [save, setSave] = useState<Save>({ xp: 0, quests: [] });

  useEffect(() => {
    setSave(load());
    const on = () => setSave(load());
    window.addEventListener("council-os-game", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("council-os-game", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  const m = mode(save.xp);
  const pct = Math.min(100, (save.xp / 50) * 100);

  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-amber-400 px-3 py-1 font-mono text-[11px] font-black tracking-[0.18em] text-gray-900">
          {m.name}
        </span>
        <div className="min-w-[12rem] flex-1">
          <div className="flex items-baseline justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Council OS · local play</span>
            <span className="font-mono">{save.xp} XP{m.next ? ` · next ${m.next}` : ""}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{m.hint} Progress stays in this browser.</p>
        </div>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-3">
        {QUESTS.map((q) => {
          const done = save.quests.includes(q.id);
          return (
            <li key={q.id} className="contents">
              <a
                href={q.href}
                onClick={(e) => {
                  markQuest(q.id);
                  if (q.lobbyPane) {
                    e.preventDefault();
                    openLobby({ pane: q.lobbyPane });
                  }
                }}
                className={`block min-h-[44px] rounded-xl border px-3 py-2 text-[12px] ${FOCUS} ${
                  done
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-amber-300"
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wide">{done ? "done" : `+${q.xp} xp`}</span>
                <span className="mt-0.5 block font-semibold">{q.label}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
