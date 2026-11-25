import { useEffect, useState } from "react";
import { createResearchDraft, validateResearchProjection } from "@/lib/research-experiment-draft.mjs";

const field = "mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-emerald-700";
const initial = { role: "researcher", question: "", baseline: "", candidate: "", metric: "recall", direction: "at_least", threshold: "0.95", sampleSize: "30" };

export default function ResearchExperimentDraft() {
  const [projection, setProjection] = useState<unknown>(null);
  const [state, setState] = useState<"loading" | "ready" | "held">("loading");
  const [repository, setRepository] = useState("");
  const [input, setInput] = useState(initial);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    setProjection(null); setRepository(""); setMessage(""); setState("loading");
    const timer = window.setTimeout(() => controller.abort(), 10000);
    (async () => {
      try {
        const response = await fetch("/api/research-commons", {
          method: "GET", credentials: "omit", signal: controller.signal,
          redirect: "error", headers: { accept: "application/json" },
        });
        if (!response.ok) throw Error("Research source unavailable");
        const raw = await response.text();
        if (raw.length > 100000) throw Error("Oversized source projection");
        const value: unknown = JSON.parse(raw);
        validateResearchProjection(value);
        if (alive) { setProjection(value); setState("ready"); }
      } catch {
        if (alive) setState("held");
      } finally { window.clearTimeout(timer); }
    })();
    return () => { alive = false; window.clearTimeout(timer); controller.abort(); };
  }, [attempt]);
  let source: ReturnType<typeof validateResearchProjection> | null = null;
  if (state === "ready") {
    try { source = validateResearchProjection(projection); } catch { /* expired or invalid; hold */ }
  }
  const selected = source?.candidates.find((r) => r.repository === repository);
  const change = (name: keyof typeof initial, value: string) => {
    setInput((old) => ({ ...old, [name]: value })); setMessage("");
  };
  function download() {
    try {
      if (!input.threshold.trim() || !input.sampleSize.trim()) throw Error("Enter threshold and sample size.");
      const draft = createResearchDraft(projection, repository, { ...input, threshold: Number(input.threshold), sampleSize: Number(input.sampleSize) });
      const blob = new Blob([JSON.stringify(draft, null, 2) + "\n"], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "csoai-private-experiment-draft.json";
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Local draft download requested. No experiment or submission was executed.");
    } catch { setMessage("Draft not created. Check the required fields, source freshness, threshold and planned sample size."); }
  }
  return (
    <section aria-labelledby="research-experiment-heading" className="mt-6 rounded-2xl border border-emerald-800/20 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Research to action · private draft</p>
      <h3 id="research-experiment-heading" className="mt-1 text-lg font-semibold text-slate-950">Plan your own AI experiment</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">Choose a research source, define a comparison and download a local draft. Nothing is submitted, run, signed or admitted to GSPC. Do not enter personal data, confidential material or credentials.</p>
      {state === "loading" && <p role="status" className="mt-4 text-sm text-slate-600">Checking research source…</p>}
      {state !== "loading" && !source && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-950" role="status">
        Research source unavailable, stale or invalid. No draft can be generated from an uncheckable source.
        <button type="button" className="ml-2 min-h-11 font-semibold underline" onClick={() => setAttempt((n) => n + 1)}>Retry source read</button>
      </div>}
      {source && <>
        <p className="mt-3 text-xs text-slate-600">{source.candidates.length} observed source revisions · {source.uncheckable} uncheckable · observed {source.observedAt}. Source metadata only; rights and independent verification are not established.</p>
        {source.candidates.length === 0 ? <p role="status" className="mt-3 text-sm text-slate-700">No observed source revision is available for a draft.</p> : <form className="mt-4 grid gap-4" onSubmit={(e) => { e.preventDefault(); download(); }}>
          <label className="text-sm font-medium">Source revision
            <select className={field} required value={repository} onChange={(e) => { setRepository(e.target.value); setMessage(""); }}>
              <option value="">Select a source</option>
              {source.candidates.map((r) => <option key={r.repository} value={r.repository}>{r.repository}</option>)}
            </select>
          </label>
          {selected && <div className="min-w-0 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-950">
            <p className="break-all">Revision: {selected.revision}</p><p>Suggested research: {selected.proposal.replaceAll("_", " ").toLowerCase()}</p><p>Declared licence: {selected.declaredLicense ?? "Unknown"} · review required</p>
          </div>}
          <label className="text-sm font-medium">Your role<select className={field} value={input.role} onChange={(e) => change("role", e.target.value)}>
            <option value="researcher">Researcher</option><option value="public">Member of the public</option><option value="sme">SME / AI deployer</option><option value="regulator">Regulator</option><option value="developer">Developer / agent operator</option><option value="reviewer">Human reviewer</option>
          </select></label>
          <label className="text-sm font-medium">Research question<textarea className={field} rows={2} maxLength={1000} required value={input.question} onChange={(e) => change("question", e.target.value)} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Baseline<textarea className={field} rows={2} maxLength={1000} required value={input.baseline} onChange={(e) => change("baseline", e.target.value)} /></label>
            <label className="text-sm font-medium">Candidate<textarea className={field} rows={2} maxLength={1000} required value={input.candidate} onChange={(e) => change("candidate", e.target.value)} /></label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Metric<select className={field} value={input.metric} onChange={(e) => change("metric", e.target.value)}>
              <option value="recall">Recall (0–1)</option><option value="accuracy">Accuracy (0–1)</option><option value="false_positive_rate">False positive rate (0–1)</option><option value="latency_ms">Latency (ms)</option><option value="review_time_ms">Review time (ms)</option>
            </select></label>
            <label className="text-sm font-medium">Direction<select className={field} value={input.direction} onChange={(e) => change("direction", e.target.value)}><option value="at_least">At least</option><option value="at_most">At most</option></select></label>
            <label className="text-sm font-medium">Threshold<input className={field} type="number" min="0" max={["recall","accuracy","false_positive_rate"].includes(input.metric)?1:undefined} step="any" required value={input.threshold} onChange={(e) => change("threshold", e.target.value)} /></label>
            <label className="text-sm font-medium">Planned sample size<input className={field} type="number" min="1" max="10000" step="1" required value={input.sampleSize} onChange={(e) => change("sampleSize", e.target.value)} /></label>
          </div>
          <button type="submit" disabled={!selected} className="min-h-11 rounded-lg bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-50">Download private experiment draft</button>
          <p role="status" className="text-sm text-slate-700">{message}</p>
        </form>}
      </>}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <a href="/him" className="font-semibold text-emerald-900 underline underline-offset-4">Discuss scope with H.I.M.</a>
        <a href="/methodology" className="font-semibold text-emerald-900 underline underline-offset-4">Read the measurement methodology</a>
      </div>
    </section>
  );
}
