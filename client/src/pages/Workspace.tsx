/**
 * /workspace — user org + AI systems registry (SaaS portfolio view).
 */
import { useEffect, useState } from "react";
import CouncilOsInnerNav from "@/components/os/CouncilOsInnerNav";
import EnterpriseMeasureCta from "@/components/coliseum/EnterpriseMeasureCta";
import {
  addSystem,
  batchAssess,
  ensureWorkspace,
  getWorkspaceToken,
  scheduleReattest,
  type Workspace,
} from "@/lib/workspaceClient";
import { openLobby } from "@/lib/lobbyLink";

export default function WorkspacePage() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [results, setResults] = useState<Array<Record<string, unknown>> | null>(null);

  useEffect(() => {
    document.title = "My systems — Council OS workspace";
    ensureWorkspace().then(setWs);
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ws || !name.trim() || !desc.trim()) return;
    setBusy(true);
    try {
      const r = await addSystem(ws.id, { name, description: desc, frameworks: ws.org.jurisdictions });
      setWs({ ...ws, systems: [...ws.systems, r.system] });
      setName("");
      setDesc("");
      setMsg("System added.");
    } catch (err) {
      setMsg(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onBatch() {
    if (!ws?.systems.length) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await batchAssess(ws.systems, ws.org.name, ws.org.jurisdictions);
      setResults(r.systems);
      setMsg(`Portfolio: ${r.portfolio.measured} measured, avg score ${r.portfolio.avg_compliance_score}%`);
    } catch (err) {
      setMsg(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSchedule(sysId: string, sysName: string) {
    if (!ws) return;
    await scheduleReattest(ws.id, sysId, sysName, 30);
    setMsg(`Re-measure ${sysName} in 30 days — reminder scheduled.`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CouncilOsInnerNav title="My workspace" subtitle="Your portfolio — separate from the public Hive index" />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{ws?.org.name || "My organisation"}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Register systems · batch assess · fix via AG-UI · re-attest on schedule. Training loop, not certification.
            </p>
            {getWorkspaceToken() && (
              <p className="mt-1 font-mono text-[10px] text-slate-400">workspace: {getWorkspaceToken()}</p>
            )}
          </div>
          <EnterpriseMeasureCta orgName={ws?.org.name} />
        </div>

        {msg && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-900">{msg}</p>}

        <form onSubmit={onAdd} className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">Add AI system</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="System name"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What it does (for assess)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
          >
            Add system
          </button>
        </form>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Portfolio ({ws?.systems.length ?? 0})</h2>
            <button
              type="button"
              disabled={busy || !ws?.systems.length}
              onClick={onBatch}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              Batch assess all
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {(ws?.systems || []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-4">
                <div>
                  <div className="font-semibold text-slate-900">{s.name}</div>
                  <div className="text-xs text-slate-500 line-clamp-1">{s.description}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openLobby({ task: "fix-gaps", ctx: s.name, aguiHandle: "remediation-assist" })}
                    className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800"
                  >
                    Fix via AG-UI
                  </button>
                  <button
                    type="button"
                    onClick={() => onSchedule(s.id, s.name)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Re-attest in 30d
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {results && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold text-slate-900">Latest batch results</h3>
            <pre className="mt-2 max-h-64 overflow-auto text-xs text-slate-700">{JSON.stringify(results, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
