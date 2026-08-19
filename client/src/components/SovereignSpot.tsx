import { useEffect, useRef, useState } from "react";
import { askSovereign } from "../lib/sovAsk";

// SovereignSpot — a reusable "this page, on the globe + ask the Council assistant" panel.
// Drops the live governance globe (auto-lighting the page's layer) next to a
// topic-scoped, guarded Sovereign chat. One primitive, every route can carry the
// globe + the Sov. Answers go through askSovereign (no companion-persona bleed).
export default function SovereignSpot({
  topic,
  layer,
  suggest,
  height = 300,
}: {
  topic: string;        // scopes the Council assistant's answers + the ask label
  layer?: string;       // globe layerTag to light on load (e.g. "frameworks","regulators","industries")
  suggest?: string;     // a pre-filled example question
  height?: number;
}) {
  const f = useRef<HTMLIFrameElement>(null);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const w = f.current && f.current.contentWindow;
        if (w) {
          if (layer) w.postMessage({ cmd: "layer", tag: layer, on: true }, "*");
          w.postMessage({ cmd: "spin", on: true }, "*");
        }
      } catch (e) {}
    }, 2600);
    return () => clearTimeout(t);
  }, [layer]);

  async function ask(text?: string) {
    const question = (text != null ? text : q).trim();
    if (!question) return;
    setQ(question); setBusy(true); setA("");
    const r = await askSovereign(question, {
      system:
        "You are the CSOAI Council assistant — the AI-governance and cybersecurity assistant. Answer only in that role, specifically about: " +
        topic +
        ". Be concise, concrete and practical (regulations, obligations, dates, controls, risk). Never a personal companion, never poetic.",
    });
    setA(r.text); setBusy(false);
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-emerald-500/20 bg-[#04120c] p-4 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl border border-emerald-500/15 bg-black/40" style={{ height }}>
        <iframe ref={f} src="/globe3d.html" title="Council governance globe" loading="lazy" className="h-full w-full border-0" />
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="text-sm font-bold text-emerald-100">Ask the Council assistant — {topic}</div>
        <div className="mb-2 text-[11px] text-emerald-300/50">Governed answer · AI governance &amp; cybersecurity only · signed to Layer 0</div>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
            placeholder={"Ask about " + topic + "…"}
            className="flex-1 rounded-lg border border-emerald-500/25 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none"
          />
          <button onClick={() => ask()} disabled={busy} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">{busy ? "…" : "Ask"}</button>
        </div>
        {suggest && !a && !busy && (
          <button onClick={() => ask(suggest)} className="mt-2 self-start rounded-full border border-emerald-500/25 px-3 py-1 text-[11px] text-emerald-200/80 hover:bg-emerald-500/10">e.g. “{suggest}”</button>
        )}
        {a && <div className="mt-3 overflow-y-auto rounded-lg border border-emerald-400/20 bg-white/[0.03] p-3 text-sm leading-relaxed text-emerald-50/90" style={{ maxHeight: Math.max(120, height - 90) }}>{a}</div>}
        <a href="/os" className="mt-auto pt-3 text-xs font-semibold text-emerald-300 hover:underline">Open the full AI OS →</a>
      </div>
    </div>
  );
}
