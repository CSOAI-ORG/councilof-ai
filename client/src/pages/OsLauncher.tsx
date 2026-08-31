import { useEffect, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
} from "@/components/os/doors";
import OsHeader from "@/components/os/OsHeader";
import OsDoorBody from "@/components/os/OsDoors";
import { openLobby } from "@/lib/lobbyLink";
import { useBoardCount } from "@/lib/boardCount";
import {
  censusNote,
  correctionsNote,
  parseTerminal,
  TERMINAL_HINT,
} from "@/lib/terminalFn";
import { loadWatchlist, saveWatchlist, upsertWatch } from "@/lib/watchlist";
import { formatComputeReply } from "@/lib/computeBridge";
import { liveCountLine } from "@/components/os/osChat";
import HfLivingRecord from "@/components/HfLivingRecord";

export {
  BOARD_PANE,
  DOOR_TO_LOBBY,
  DOORS,
  doorFromSearch,
  osLeaveForSearch,
  LOBBY_TO_DOOR,
};
export type { DoorId } from "@/components/os/doors";

const PAGES: { name: string; href: string; what: string }[] = [
  { name: "Board", href: "/gspc-scoreboard", what: "What’s actually measured. Empty stays empty." },
  { name: "Verify", href: "/gspc-verify", what: "Paste a card. Nothing is sent." },
  { name: "Assess", href: "/assess", what: "Get measured. Free. The card is yours." },
  { name: "Evidence", href: "/methodology", what: "How we grade. No model in the verdict." },
  { name: "Embed", href: "/embed", what: "Self-verifying badge. Measurement, not a mark." },
  { name: "Report", href: "/report", what: "Public incident intake. Signed acknowledgement." },
  { name: "Plugin", href: "/tools", what: "Paste-ready MCP for Claude, Cursor, Kimi, Grok." },
  { name: "Public root", href: "/xrpl-attest", what: "Unsigned catalogue + /api/xrpl reader. Not a GSPC mill." },
  { name: "Hugging Face record", href: "https://huggingface.co/datasets/csoai/gspc-boards", what: "Hub mirror of the signed record and public-root. Cite GET /api/gspc for the board." },
];

/** /os is the Council OS product frame. Doors are native. Not the unused shell. Not AG-UI. */
export default function OsLauncher() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const leave = osLeaveForSearch(search);
  const door = doorFromSearch(search) ?? "board";
  const board = useBoardCount();
  const [ask, setAsk] = useState("");
  const [fnNote, setFnNote] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Council OS | councilof.ai";
  }, []);

  useEffect(() => {
    if (leave) setLocation(leave);
  }, [leave, setLocation]);

  return (
    <div data-testid="os-directory">
      <OsHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-700">
          Council OS
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
          One workspace. Living counts. Empty stays empty.
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Board, verify, get measured, arena, and the harness — in this window.
          GSPC counts come from GET /api/gspc.{" "}
          <span className="font-semibold text-emerald-900">{board.public_count}</span>
          . Hugging Face is the parallel record — a Hub repo is not a grade.
          We measure. We do not certify.
        </p>

        <section aria-label="Council OS door" className="mt-8">
          <OsDoorBody door={door} />
        </section>

        <HfLivingRecord compact />

        <form
          className="mt-10 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const prompt = ask.trim();
            if (!prompt) {
              document.getElementById("os-chat")?.focus();
              return;
            }
            const parsed = parseTerminal(prompt);
            if (parsed.fn === "BOARD") {
              void fetch("/api/gspc", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) => setFnNote(`BOARD — ${liveCountLine(j?.totals ?? {})}. Empty stays empty.`))
                .catch((err: Error) => setFnNote(`BOARD failed (${err.message}). Cite GET /api/gspc.`));
              setLocation("/os?lobby=board");
              return;
            }
            if (parsed.fn === "VERIFY") {
              setLocation("/gspc-verify");
              return;
            }
            if (parsed.fn === "AXIS") {
              setLocation("/os?lobby=board");
              setFnNote(`AXIS ${parsed.arg || "—"}. Empty stays empty.`);
              return;
            }
            if (parsed.fn === "CORRECT") {
              void fetch("/api/corrections", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) => {
                  const n = Array.isArray(j?.corrections) ? j.corrections.length : j?.count;
                  setFnNote(correctionsNote(n));
                })
                .catch((err: Error) => setFnNote(`CORRECT failed (${err.message}).`));
              return;
            }
            if (parsed.fn === "COMPUTE") {
              void fetch("/api/compute", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) => setFnNote(formatComputeReply(j)))
                .catch((err: Error) => setFnNote(`COMPUTE failed (${err.message}). Cite GET /api/compute.`));
              setLocation("/os?lobby=harness");
              return;
            }
            if (parsed.fn === "CENSUS" || parsed.fn === "WATCH") {
              const id = parsed.arg.trim();
              if (id) {
                const store = typeof localStorage === "undefined" ? null : localStorage;
                saveWatchlist(store, upsertWatch(loadWatchlist(store), [id]));
              }
              setFnNote(id ? censusNote(id) : "CENSUS needs an owner/name id.");
              return;
            }
            openLobby({ prompt });
          }}
        >
          <label htmlFor="os-chat" className="text-sm font-semibold text-slate-900">
            Ask the workspace
          </label>
          <p className="mt-1 text-xs text-slate-600">
            Typed, never sent until you press Ask. Functions first; otherwise the lobby.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              id="os-chat"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="BOARD · AXIS jail · CENSUS Qwen/Qwen3.8-27B · COMPUTE · CORRECT"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Ask
            </button>
          </div>
          <p className="mt-2 font-mono text-[11px] text-emerald-800">{TERMINAL_HINT}</p>
          {fnNote && <p className="mt-2 text-sm text-slate-700">{fnNote}</p>}
        </form>

        <h2 className="mt-12 text-sm font-bold uppercase tracking-wide text-slate-500">
          Also open as a full page
        </h2>
        <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {PAGES.map((p) => {
            const external = p.href.startsWith("http");
            const inner = (
              <>
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-sm text-slate-600">{p.what}</div>
              </>
            );
            return (
              <li key={p.href}>
                {external ? (
                  <a href={p.href} target="_blank" rel="noreferrer" className="block px-5 py-4 hover:bg-slate-50">
                    {inner}
                  </a>
                ) : (
                  <Link href={p.href} className="block px-5 py-4 hover:bg-slate-50">
                    {inner}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
