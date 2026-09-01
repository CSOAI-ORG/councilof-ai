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
import GspcStreamCard from "@/components/os/GspcStreamCard";
import XrplReaderRail from "@/components/gspc/XrplReaderRail";

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
  { name: "Assess", href: "/assess", what: "Paid measurement. Coming — Paddle. Booking is not live." },
  { name: "Evidence", href: "/methodology", what: "How we grade. No model in the verdict." },
  { name: "Embed", href: "/embed", what: "Self-verifying badge. Measurement, not a mark." },
  { name: "Report", href: "/report", what: "Public incident intake. Signed acknowledgement." },
  { name: "Plugin", href: "/tools", what: "Paste-ready MCP for Claude, Cursor, Kimi, Grok." },
  { name: "Public root", href: "/xrpl-attest", what: "Catalogue + /api/xrpl reader. Not a GSPC mill." },
  { name: "Jail folder", href: "/gspc/jail", what: "MEASURED n=71 TIE. Folder, not a second jail score." },
  { name: "XRPL 16 tape", href: "/interop/xrpl-16.json", what: "located ≠ measured. Ten names without r-address stay DISCOVERED." },
  { name: "SWIFT census tape", href: "/api/swift", what: "26 named: 3 LIVE, 9 COMMITTED, 14 DISCOVERED. Not clients. Not GPI." },
  { name: "TRACE stub", href: "/api/trace", what: "Trust Record. Silicon UNCHECKABLE. Not an axis." },
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
  /** Live AG-UI stream card: axis id for GET /api/gspc, or "" for board totals only. */
  const [streamAxis, setStreamAxis] = useState<string | null>(null);

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
          {board.gspc_family && board.financial_family && (
            <>
              {" "}({board.gspc_family.axes} model-comparison + {board.financial_family.axes} fact
              cards — fact cards carry no leader and no accuracy)
            </>
          )}
          . Hugging Face is the parallel record — a Hub repo is not a grade.
          We measure. We do not certify.
        </p>

        <section aria-label="Council OS door" className="mt-8">
          <OsDoorBody door={door} />
        </section>

        <HfLivingRecord compact />

        {/* OS side rail — the live XRPL reader. Names come from GET /api/xrpl on
            this load, never typed (P0.3). writes_board=false is quoted, and the
            unsigned-leaf honesty flag is computed from the payload. */}
        <div className="mt-8">
          <XrplReaderRail heading="Side rail — XRPL reader, live" />
        </div>

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
              setStreamAxis("");
              void fetch("/api/gspc", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) => setFnNote(`BOARD — ${liveCountLine(j?.totals ?? {})}. Empty stays empty.`))
                .catch((err: Error) => {
                  setStreamAxis(null);
                  setFnNote(`BOARD failed (${err.message}). Cite GET /api/gspc. UNCHECKABLE.`);
                });
              setLocation("/os?lobby=board");
              return;
            }
            if (parsed.fn === "VERIFY") {
              setLocation("/gspc-verify");
              return;
            }
            if (parsed.fn === "AXIS") {
              const axis = (parsed.arg || "").trim();
              setStreamAxis(axis || "");
              setLocation("/os?lobby=board");
              setFnNote(`AXIS ${axis || "—"}. Live row from GET /api/gspc. Empty stays empty.`);
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
            if (parsed.fn === "XRPL") {
              void fetch("/api/xrpl", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) => {
                  const syms = Array.isArray(j?.assets) ? j.assets.map((a: { symbol?: string }) => a.symbol).join(" ") : "";
                  const unsigned = Array.isArray(j?.assets)
                    ? j.assets.filter((a: { sig_ed25519?: string | null }) => !a.sig_ed25519).map((a: { symbol?: string }) => a.symbol)
                    : [];
                  setFnNote(
                    `XRPL reader n=${j?.n} kind=${j?.kind} writes_board=${j?.writes_board}. ${syms}. Unsigned leaves: ${unsigned.join(",") || "none"}. Not the attest-page 16. Cite GET /api/xrpl.`,
                  );
                })
                .catch((err: Error) => setFnNote(`XRPL (${err.message}). Cite GET /api/xrpl.`));
              return;
            }
            if (parsed.fn === "SWIFT") {
              void fetch("/api/swift", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) =>
                  setFnNote(
                    `SWIFT — n=${j?.n} (${j?.n_live} LIVE, ${j?.n_committed} COMMITTED, ${j?.n_discovered} DISCOVERED). Sourced census, not MEASURED. Not clients. cobolbridge.ai is in build (apex 522).`,
                  ),
                )
                .catch((err: Error) => setFnNote(`SWIFT (${err.message}). Cite GET /api/swift after GHA.`));
              return;
            }
            if (parsed.fn === "JAIL") {
              setStreamAxis("jail");
              setLocation("/os?lobby=board");
              setFnNote("JAIL — MEASURED n=71 TIE GoldBank-Detector. Folder /gspc/jail. Not a new run. Not XRPL.");
              return;
            }
            if (parsed.fn === "TRACE") {
              void fetch("/api/trace", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) =>
                  setFnNote(
                    `TRACE — ${j?.claims?.silicon?.status || "UNCHECKABLE"} silicon. Not an axis. ${j?.honesty || ""}`.slice(0, 280),
                  ),
                )
                .catch((err: Error) => setFnNote(`TRACE (${err.message}). Silicon UNCHECKABLE until GET /api/trace 200.`));
              return;
            }
            if (parsed.fn === "AIBOM") {
              setFnNote("AIBOM — stub at packages/aibom. No CycloneDX lineage yet. UNCHECKABLE completeness. Not an axis.");
              return;
            }
            if (parsed.fn === "REPRO") {
              setFnNote("REPRO — packages/repro/repro.sh. Missing seed/dataset hash/grader stay UNCHECKABLE. DOI is not a re-run pack.");
              return;
            }
            if (parsed.fn === "ROOT") {
              void fetch("/root.json", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) =>
                  setFnNote(
                    `ROOT — schema ${j?.schema} · n=${j?.card_count} · sig ${j?.sig_ed25519 ? "present" : "absent"}. Not a certificate.`,
                  ),
                )
                .catch((err: Error) => setFnNote(`ROOT failed (${err.message}). Cite GET /root.json.`));
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
            if (parsed.fn === "PQC") {
              void fetch("/api/pqc", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) => {
                  const c = j?.continuity_axis || {};
                  const e = j?.estate_signatures || {};
                  setFnNote(
                    `PQC — continuity ${c.status} n=${c.n} acc=${c.accuracy} ${c.separation} (${c.bench}). Estate signatures: ${e.algorithm} only (${e.status}). sig_pqc ${e.sig_pqc ?? "absent"} = ${e.pq_migration}. Continuity MEASURED ≠ we are PQC.`,
                  );
                })
                .catch((err: Error) =>
                  setFnNote(
                    `PQC (${err.message}). Continuity is MEASURED on GET /api/gspc. Estate signatures: Ed25519 only until GET /api/pqc 200.`,
                  ),
                );
              return;
            }
            if (parsed.fn === "OTEL") {
              void fetch("/api/otel", { headers: { accept: "application/json" } })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
                .then((j) =>
                  setFnNote(
                    `OTEL — collector ${j?.collector}. OTLP ${j?.otlp}. Not an axis. Cards without otel_trace_id stay valid GSPC.`,
                  ),
                )
                .catch((err: Error) =>
                  setFnNote(`OTEL (${err.message}). Collector UNCHECKABLE. Not a 23rd axis.`),
                );
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
          {streamAxis !== null && (
            <div className="mt-3" data-testid="os-agui-stream-gspc">
              <GspcStreamCard axis={streamAxis || undefined} />
            </div>
          )}
          <p className="mt-3 text-[11px] text-slate-600" data-testid="w3c-agent-conformance-draft">
            Draft opening only:{" "}
            <a
              className="font-medium text-emerald-800 underline-offset-2 hover:underline"
              href="https://www.w3.org/community/agent-conformance/"
              target="_blank"
              rel="noreferrer"
            >
              W3C Agent Conformance and Benchmarking Community Group
            </a>
            {" "}
            — Nick joins. Measurement credential, never certification. No endorsement or “we conform”
            claim.
          </p>
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
