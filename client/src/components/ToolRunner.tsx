import { useEffect, useState } from "react";
import { listTools, callTool, sealArtifact, TOOL_META, type SovTool } from "../lib/sovTools";

// ToolRunner - the real thing. Lists the tools the Council engine executes
// server-side, renders each tool's inputs, RUNS it live, shows the governed
// result, and lets the user seal that result to Layer 0 (Ed25519). This is
// working tooling for end users, not a demo.
export default function ToolRunner() {
  const [tools, setTools] = useState<SovTool[]>([]);
  // Three states, never two: still asking, answered, or could not be reached — each said
  // out loud. The badge used to read "connecting…" forever whenever the listing failed.
  const [listState, setListState] = useState<"loading" | "ok" | "unreachable">("loading");
  const [listReason, setListReason] = useState("");
  const [active, setActive] = useState<SovTool | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});
  const [out, setOut] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [seal, setSeal] = useState<string>("");

  useEffect(() => {
    listTools().then((r) => {
      if (r.state !== "ok") { setListState("unreachable"); setListReason(r.reason); return; }
      setListState("ok");
      setTools(r.tools);
      const first = r.tools.find((x) => x.name === "meok_govern") || r.tools[0] || null;
      if (first) pick(first);
    });
  }, []);

  function pick(t: SovTool) {
    setActive(t); setOut(null); setSeal("");
    const props = (t.inputSchema && t.inputSchema.properties) || {};
    const seed: Record<string, string> = {};
    Object.keys(props).forEach((k) => (seed[k] = ""));
    setArgs(seed);
  }

  async function run() {
    if (!active) return;
    setBusy(true); setOut(null); setSeal("");
    const res = await callTool(active.name, args);
    setOut({ ok: res.ok, text: res.text });
    setBusy(false);
  }

  async function doSeal() {
    if (!out) return;
    setBusy(true);
    const res = await sealArtifact(out.text);
    setSeal(res.text);
    setBusy(false);
  }

  const props = (active && active.inputSchema && active.inputSchema.properties) || {};
  const keys = Object.keys(props);

  return (
    <div className="rounded-2xl border border-emerald-500/25 bg-[#05140d] p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-500/10 text-sm">◉</span>
          <div>
            <div className="text-sm font-black text-emerald-100">Run a live governance tool</div>
            <div className="text-[11px] text-emerald-300/60">Executed by the Council engine · governed · Ed25519-signable</div>
          </div>
        </div>
        <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (listState === "unreachable" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300")}>
          {listState === "loading" ? "connecting…" : listState === "unreachable" ? "unreachable" : tools.length + " live"}
        </span>
      </div>

      {listState === "unreachable" && (
        <p className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/5 px-3 py-2 text-[12px] text-amber-100/85">
          The MCP server did not answer tools/list — {listReason}. Nothing is running here; this
          panel is showing you that, rather than a spinner that never resolves. The published
          catalogue below is unaffected.
        </p>
      )}

      {/* tool picker */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tools.map((t) => {
          const m = TOOL_META[t.name] || { glyph: "▸", label: t.name };
          const on = active && active.name === t.name;
          return (
            <button key={t.name} onClick={() => pick(t)}
              className={"rounded-full border px-3 py-1.5 text-xs font-semibold transition " + (on ? "border-emerald-400 bg-emerald-500 text-[#03110b]" : "border-emerald-400/25 bg-emerald-500/5 text-emerald-200/80 hover:bg-emerald-500/15")}>
              {m.glyph} {m.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-4">
          <p className="text-xs text-emerald-300/70">{active.description}</p>
          <div className="mt-3 space-y-2">
            {keys.length === 0 && <p className="text-xs text-emerald-300/40">No inputs — just run it.</p>}
            {keys.map((k) => {
              const p = props[k] || {};
              return (
                <div key={k}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/60">{k}{p.description ? " — " + p.description : ""}</label>
                  <input
                    value={args[k] || ""}
                    onChange={(e) => setArgs({ ...args, [k]: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") run(); }}
                    placeholder={p.description || k}
                    className="w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2.5 text-sm text-emerald-50 placeholder-emerald-300/25 focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
          <button onClick={run} disabled={busy}
            className="mt-3 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">
            {busy ? "Running on the Council engine…" : "Run tool ▶"}
          </button>
        </div>
      )}

      {/* live result */}
      {out && (
        <div className={"mt-4 rounded-xl border p-4 " + (out.ok ? "border-emerald-400/30 bg-emerald-500/5" : "border-amber-400/30 bg-amber-500/5")}>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">{out.ok ? "The server's reply, verbatim" : "Notice"}</span>
            {out.ok && active && active.name !== "meok_sign" && (
              <button onClick={doSeal} disabled={busy} className="rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50">✶ Seal to Layer 0</button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-emerald-50/90">{out.text}</p>
          {seal && <p className="mt-2 break-all rounded-lg bg-black/40 px-3 py-2 font-mono text-[11px] text-emerald-300/80">{seal}</p>}
        </div>
      )}
    </div>
  );
}
