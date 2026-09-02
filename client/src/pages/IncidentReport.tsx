import { useEffect, useState } from "react";

// /report — the Global AI Watchdog intake. Anyone (human, analyst, agent) can
// report an AI incident, free, with no account.
//
// WHAT WAS WRONG HERE (2026-08-27, found by operating the form in a browser and
// watching the network layer). Submit POSTed to /api/sign — a path no function
// serves (404) — then hashed the text locally and told the reporter "Report
// sealed … logged", with a "live watchdog map" link that redirected to the OS
// home. The report reached nobody and was stored nowhere. That is the exact
// defect this estate exists to catch, committed on our own intake form.
//
// NOW: the form POSTs to /api/report (functions/api/report.ts), which returns a
// signed acknowledgement when the signing key is bound and says alg:"UNSIGNED"
// when it is not, and says stored:true only when the record actually landed in a
// bound datastore — stored:false comes back with a fallback address and this page
// SHOWS it. If the endpoint cannot be reached at all, the page says the report
// did NOT go through; it never dresses a local hash up as a filing receipt.
const SEV = ["Low", "Medium", "High", "Critical"];
const KIND = ["Bias / discrimination", "Safety / physical harm", "Privacy / data", "Deception / manipulation", "Security / misuse", "Transparency (no AI disclosure)", "Other"];

type Ack = {
  report_id: string;
  received_at: string;
  record_digest: string;
  sig: string;
  kid: string;
  alg: string;
  stored: boolean;
  fallback?: string;
};

export default function IncidentReport() {
  const [k, setK] = useState(KIND[0]);
  const [sev, setSev] = useState("High");
  const [system, setSystem] = useState("");
  const [where, setWhere] = useState("");
  const [what, setWhat] = useState("");
  const [busy, setBusy] = useState(false);
  const [ack, setAck] = useState<Ack | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  useEffect(() => { document.title = "Report an AI incident — Global AI Watchdog | CSOAI"; }, []);

  async function submit() {
    if (!what.trim() || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          incident_type: k,
          severity: sev,
          system,
          location: where,
          description: what.trim(),
        }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j || !j.report_id) {
        throw new Error(j && j.error ? String(j.error) : `HTTP ${res.status}`);
      }
      setAck(j as Ack);
    } catch (e: any) {
      // The truth, not a thank-you: the report did not go through.
      setFailure(
        "Your report was NOT submitted — the intake endpoint could not be reached (" +
          (e?.message || "network error") +
          "). Nothing was recorded. Your text is still in the box; email it to nicholas@csoai.org if this persists.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Global AI Watchdog</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Report an AI incident.</h1>
        <p className="mt-3 text-emerald-100/75">See an AI system causing harm, discriminating, or hiding that it's AI? Report it — free, no account. The intake returns an <span className="text-emerald-300">Ed25519-signed acknowledgement</span> of exactly what you filed, and tells you plainly whether the record was stored or not. Receipt of a report is not a finding; anything acted on is measured on the published instruments like everything else here.</p>

        {!ack ? (
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
              {busy ? "Submitting…" : "Submit report ▶"}
            </button>
            {failure && (
              <p className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2.5 text-[12px] leading-relaxed text-red-200">{failure}</p>
            )}
            <p className="text-[11px] text-emerald-300/70">The intake answers with what actually happened: a signed acknowledgement when the signing key is bound (it says UNSIGNED when it is not), and stored: true only when the record really landed in the datastore.</p>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-emerald-400/40 bg-emerald-500/[0.06] p-6">
            <div className="flex items-center gap-2 text-emerald-200"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-lg">✓</span><span className="text-lg font-black">Report received{ack.stored ? " and stored" : ""}.</span></div>
            <p className="mt-2 text-sm text-emerald-100/80">
              Incident <span className="font-mono text-emerald-300">{ack.report_id.slice(0, 16)}</span> acknowledged at {ack.received_at.slice(0, 19).replace("T", " ")}Z.
            </p>
            {!ack.stored && (
              <p className="mt-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2.5 text-[12.5px] leading-relaxed text-amber-200">
                <strong>Not yet stored:</strong> no datastore is bound on this deployment, so the record above lives only in this acknowledgement. {ack.fallback || "Keep it, and email it with your report to nicholas@csoai.org."}
              </p>
            )}
            <div className="mt-4 break-all rounded-lg bg-black/40 px-3 py-3 font-mono text-[11px] leading-relaxed text-emerald-300/80">
              {ack.alg === "Ed25519" ? (
                <>sha256 {ack.record_digest}{"\n"}sig {ack.sig.slice(0, 64)}… · Ed25519 · {ack.kid}</>
              ) : (
                <>sha256 {ack.record_digest}{"\n"}UNSIGNED — the signing key is not bound on this deployment, so this digest is unsigned and proves content, not receipt.</>
              )}
            </div>
            <p className="mt-2 text-[11px] text-emerald-300/60">
              {ack.alg === "Ed25519"
                ? "The signature is over the canonical record you filed — the acknowledgement cannot be quietly edited without breaking it."
                : null}
            </p>
            <div className="mt-4 flex gap-2">
              <a href="/dashboard?tab=board" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400">Open the live board →</a>
              <button onClick={() => { setAck(null); setWhat(""); setSystem(""); setWhere(""); }} className="rounded-lg border border-emerald-500/30 px-4 py-2 text-sm font-semibold text-emerald-200/80 hover:bg-white/5">Report another</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
