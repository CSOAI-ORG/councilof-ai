import { useEffect, useState, lazy, Suspense } from "react";
import { Link, useSearch } from "wouter";
import { FOCUS } from "@/components/lobby/glass";
import DenseBoard from "@/components/board/DenseBoard";

/**
 * OsLauncher — the single-frame Council OS at /os. THE AG-UI HOST.
 *
 * ONE FRAME. Board, verify, Harness, Space, assess swap inside it. Nothing
 * mounts at once; the default door (board) loads first, others lazy-load.
 *
 * AG-UI CONTRACT. Reads ?lobby= from the URL (same keys as lobbyLink.ts):
 *   ?lobby=home   → board (home is the board on /os)
 *   ?lobby=board  → board
 *   ?lobby=verify → verify
 *   ?lobby=space  → space
 *   ?lobby=measured → assess
 *   ?lobby=harness → harness
 * /ag-ui, /chat, /console all 308 to /os?lobby=home now.
 *
 * CLEAN HEADER. OpenRouter-style: logo + doors + one control. No KPI dump,
 * no debug chrome, no Fleet/Chain/CardIndex/api-state labels, no pane toggles.
 *
 * SAME BOARD AS HOMEPAGE. The Board door renders DenseBoard — THE SAME
 * component the homepage uses. One component, two surfaces. Counts come from
 * GET /api/gspc. Empty stays empty. provenance-controls n=6 stays —. No
 * CityPanel, no AxisPanel, no unnamed slot, no manifesto, no invented scores.
 *
 * HARNESS = TOOL. MCP + AG-UI attach for Hermes, DSH, GPAI clients. Not a
 * settings page. Never give away the engine, key, compose, or bank recipe.
 *
 * LOGINLESS. Verify stays free. No form wall.
 *
 * Public names only: Council OS, Council Space, GSPC.
 */

type DoorId = "board" | "verify" | "harness" | "space" | "assess";

const DOORS: { id: DoorId; label: string }[] = [
  { id: "board", label: "Board" },
  { id: "verify", label: "Verify" },
  { id: "space", label: "Space" },
  { id: "assess", label: "Assess" },
  { id: "harness", label: "Harness" },
];

const LOBBY_TO_DOOR: Record<string, DoorId> = {
  home: "board",
  board: "board",
  verify: "verify",
  space: "space",
  measured: "assess",
  ras: "assess",
  harness: "harness",
};

const VerifyPane = lazy(() => import("@/components/lobby/LobbyVerifyPane"));

function BoardDoor() {
  return <DenseBoard showScoreboardLink />;
}

function VerifyDoor() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Verify a signed card</h2>
        <p className="mt-1 text-sm text-slate-600">
          Recompute the hash and check the signature in your browser. No login. No fee.
        </p>
      </div>
      <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">Loading…</div>}>
        <VerifyPane />
      </Suspense>
    </div>
  );
}

function HarnessDoor() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Measurement harness</h2>
        <p className="mt-1 text-sm text-slate-600">
          Connect your MCP client or agent to the live measurement rail.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">MCP endpoint</h3>
        <code className="mt-2 block rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-800">
          https://councilof.ai/mcp
        </code>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <code className="font-mono text-slate-600">board_totals</code> — live axis counts
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <code className="font-mono text-slate-600">get_axis</code> — single axis detail
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <code className="font-mono text-slate-600">verify</code> — check a signed card
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <code className="font-mono text-slate-600">record_output</code> — write unsigned evidence
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">AG-UI deep-link</h3>
        <p className="mt-1 text-sm text-slate-600">
          Open surfaces from any agent via query params.
        </p>
        <div className="mt-3 space-y-1.5 font-mono text-xs">
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">?lobby=board</div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">?lobby=verify</div>
          <div className="rounded bg-slate-100 px-2 py-1 text-slate-700">?task=get-measured</div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5">
        <h3 className="font-semibold text-slate-800">For GPAI clients</h3>
        <p className="mt-1 text-sm text-slate-600">
          Use the same MCP tools as measurement input. The harness records outputs;
          you write unsigned evidence back. Signing happens on the measurement node.
        </p>
      </div>

      <Link
        href="/harness"
        className={`inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 ${FOCUS}`}
      >
        Full documentation →
      </Link>
    </div>
  );
}

function SpaceDoor() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Council Space</h2>
        <p className="mt-1 text-sm text-slate-600">
          The governed arena — rounds graded deterministically, never by a model jury.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Head-to-head comparisons on frozen provisions. Every cell is signed evidence.
        </p>
        <Link
          href="/gspc-arena"
          className={`mt-4 inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 ${FOCUS}`}
        >
          Open the Arena →
        </Link>
      </div>
    </div>
  );
}

function AssessDoor() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Get measured</h2>
        <p className="mt-1 text-sm text-slate-600">
          Run an assessment against the rules that govern your system.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          Deterministic checks against frozen provisions. What it finds is what it reports.
        </p>
        <Link
          href="/assess"
          className={`mt-4 inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 ${FOCUS}`}
        >
          Start assessment →
        </Link>
      </div>
    </div>
  );
}

export default function OsLauncher() {
  const search = useSearch();
  const [door, setDoor] = useState<DoorId>(() => {
    const params = new URLSearchParams(search);
    const lobby = params.get("lobby");
    return lobby && LOBBY_TO_DOOR[lobby] ? LOBBY_TO_DOOR[lobby] : "board";
  });

  useEffect(() => {
    document.title = "Council OS | councilof.ai";
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const lobby = params.get("lobby");
    if (lobby && LOBBY_TO_DOOR[lobby]) {
      setDoor(LOBBY_TO_DOOR[lobby]);
    }
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">C</span>
              <span className="text-sm font-semibold text-slate-900">Council OS</span>
            </Link>
            <nav className="flex gap-1">
              {DOORS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDoor(d.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${FOCUS} ${
                    door === d.id
                      ? "bg-emerald-100 text-emerald-900"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </nav>
          </div>
          <a
            href="/gspc-verify"
            className={`rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 ${FOCUS}`}
          >
            Verify free
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {door === "board" && <BoardDoor />}
        {door === "verify" && <VerifyDoor />}
        {door === "harness" && <HarnessDoor />}
        {door === "space" && <SpaceDoor />}
        {door === "assess" && <AssessDoor />}
      </main>
    </div>
  );
}
