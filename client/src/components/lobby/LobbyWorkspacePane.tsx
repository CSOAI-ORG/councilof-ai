import { useEffect, useState } from "react";
import { batchAssess, ensureWorkspace, type Workspace } from "@/lib/workspaceClient";
import { openLobby } from "@/lib/lobbyLink";
import { FOCUS, SP, SURFACE, TYPE } from "./glass";

/** In-lobby workspace pane — portfolio summary; full UI at /workspace. */
export default function LobbyWorkspacePane({
  onOpenRoute,
}: {
  onOpenRoute: (path: string, label: string) => void;
}) {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    ensureWorkspace().then(setWs).catch((e) => setErr(String(e)));
  }, []);

  async function runBatch() {
    if (!ws?.systems.length) return;
    setBusy(true);
    setErr(null);
    try {
      await batchAssess(ws.systems, ws.org.name, ws.org.jurisdictions);
      onOpenRoute("/workspace", "My systems");
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${SP.panel} h-full overflow-y-auto`}>
      <p className={TYPE.section}>My systems</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">{ws?.org.name || "Your workspace"}</h2>
      <p className={`mt-2 ${TYPE.body} text-slate-600`}>
        Training loop — measure, fix via AG-UI/MEOK assist, re-attest. Not a conformity certificate.
      </p>

      {err && <p className="mt-2 text-xs text-rose-600">{err}</p>}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="text-2xl font-black text-emerald-700">{ws?.systems.length ?? 0}</div>
        <div className="text-xs text-slate-500">AI systems registered</div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={busy || !ws?.systems.length}
          onClick={runBatch}
          className={`rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 ${FOCUS}`}
        >
          {busy ? "Running batch assess…" : "Batch assess portfolio →"}
        </button>
        <button
          type="button"
          onClick={() => onOpenRoute("/workspace", "My systems")}
          className={`${SURFACE} rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 ${FOCUS}`}
        >
          Open workspace page →
        </button>
        <button
          type="button"
          onClick={() => openLobby({ task: "enterprise-start", pane: "measured", ctx: ws?.org.name })}
          className={`${SURFACE} rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 ${FOCUS}`}
        >
          Ask Council OS about measurement →
        </button>
      </div>
    </section>
  );
}
