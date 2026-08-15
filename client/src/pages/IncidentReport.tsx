import { useEffect, useState } from "react";
import { sealArtifact } from "../lib/sovTools";

// /report — the Global AI Watchdog, made participatory. Anyone (human, analyst,
// agent) can report an AI incident and get a REAL cryptographic receipt: the
// report is sealed to Layer 0 (Ed25519) so it can't be quietly edited or denied.
// Public, verifiable accountability — the whole point of the watchdog.
const SEV = ["Low", "Medium", "High", "Critical"];
const KIND = ["Bias / discrimination", "Safety / physical harm", "Privacy / data", "Deception / manipulation", "Security / misuse", "Transparency (no AI disclosure)", "Other"];

export default function IncidentReport() {
  const [k, setK] = useState(KIND[0]);
  const [sev, setSev] = useState("High");
  const [system, setSystem] = useState("");
  const [where, setWhere] = useState("");
  const [what, setWhat] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ ok: boolean; text: string; id: string; at: string } | null>(null);
  useEffect(() => { document.title = "Report an AI incident — Global AI Watchdog | CSOAI"; }, []);

  async function submit() {
    if (!what.trim() || busy) return;
    setBusy(true);
    const at = new Date().toISOString();
    const id = "WD-" + Date.now().toString(36).toUpperCase();
    const record = [
      "CSOAI WATCHDOG INCIDENT REPORT",
      "id: " + id,
      "reported: " + at,
      "type: " + k,
      "severity: " + sev,
      "system: " + (system || "—"),
      "location: " + (where || "—"),
      "description: " + what.trim(),
    ].join("\n");
    const res = await sealArtifact(record);
    setReceipt({ ok: res.ok, text: res.text, id, at: at.slice(0, 19).replace("T", " ") });
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Global AI Watchdog</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Report an AI incident.</h1>
        <p className="mt-3 text-emerald-100/75">See an AI system causing harm, discriminating, or hiding that it's AI? Report it. Every report is <span className="text-emerald-300">sealed to Layer 0 (Ed25519)</span> — a cryptographic receipt nobody can quietly edit or deny. Public, verifiable accountability.</p>

        {!receipt ? (
          <div className="mt-7 space-y-4 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/60">Type</label>
                <select value={k} onChange={(e) => setK(e.target.value)} className="w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2.5 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none">
                  {KIND.map((x) => <option key={x} value={x} className="bg-[#03110b]">{x}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/60">Severity</label>
                <div className="flex gap-1.5">
                  {SEV.map((s) => (
                    <button key={s} onClick={() => setSev(s)} className={"flex-1 rounded-lg px-2 py-2.5 text-xs font-bold transition " + (sev === s ? "bg-emerald-500 text-[#03110b]" : "border border-emerald-500/25 text-emerald-200/70 hover:bg-emerald-500/10")}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/60">AI system / company</label>
              <input value={system} onChange={(e) => setSystem(e.target.value)} placeholder="e.g. a hiring AI at Acme Corp" className="w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2.5 text-sm text-emerald-50 placeholder-emerald-300/25 focus:border-emerald-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/60">Location (optional)</label>
              <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="e.g. Germany, or remote/online" className="w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2.5 text-sm text-emerald-50 placeholder-emerald-300/25 focus:border-emerald-400 focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-emerald-300/60">What happened</label>
              <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={4} placeholder="Describe the incident — what the system did, who was affected, and how you know." className="w-full rounded-lg border border-emerald-500/30 bg-black/40 px-3 py-2.5 text-sm text-emerald-50 placeholder-emerald-300/25 focus:border-emerald-400 focus:outline-none" />
            </div>
            <button onClick={submit} disabled={busy || !what.trim()} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400 disabled:opacity-40">
              {busy ? "Sealing to Layer 0…" : "Submit + seal report ▶"}
            </button>
            <p className="text-[11px] text-emerald-300/70">Your report is content-sealed with Ed25519 when the Council engine is reachable; the receipt below is your proof it existed, unaltered, at this time.</p>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-emerald-400/40 bg-emerald-500/[0.06] p-6">
            <div className="flex items-center gap-2 text-emerald-200"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-lg">✓</span><span className="text-lg font-black">Report sealed.</span></div>
            <p className="mt-2 text-sm text-emerald-100/80">Incident <span className="font-mono text-emerald-300">{receipt.id}</span> logged at {receipt.at}. Keep this cryptographic receipt — it's your verifiable proof the report existed, unaltered.</p>
            <div className="mt-4 break-all rounded-lg bg-black/40 px-3 py-3 font-mono text-[11px] leading-relaxed text-emerald-300/80">{receipt.text}</div>
            <div className="mt-4 flex gap-2">
              <a href="/watchdog-map" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">See the live watchdog map →</a>
              <button onClick={() => { setReceipt(null); setWhat(""); setSystem(""); setWhere(""); }} className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-200/80 hover:bg-white/5">Report another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
