import { useRef, useState } from "react";

/**
 * CouncilChat — the AI bar for the unified /os hub.
 *
 * Posts to the real same-origin endpoint `/api/chat` (functions/api/chat.ts).
 * That endpoint answers deterministically from the estate's published
 * measurements ("grounded" lane) or from the tuned specialist when it is wired
 * ("live" lane), and it *refuses* rather than improvises when it cannot ground
 * an answer. We render exactly what it returns — the answer, the state, and the
 * signature — and never a client-side guess.
 *
 * Contract (functions/api/chat.ts):
 *   POST /api/chat  { messages: [{ role, content }] }
 *   -> { answer, reply, signature, state, model }
 */

type Turn = { role: "user" | "assistant"; text: string; state?: string; signature?: string };

const STATE_LABEL: Record<string, string> = {
  live: "council · live specialist",
  grounded: "grounded in published measurement",
  ungrounded: "refused — no grounding available",
  unreachable: "endpoint unreachable",
};

export default function CouncilChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function send() {
    const text = q.trim();
    if (!text || busy) return;
    setQ("");
    setBusy(true);
    setTurns((t) => [...t, { role: "user", text }]);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
      });
      const j: any = await r.json();
      const answer = j.answer ?? j.reply ?? "(empty answer)";
      setTurns((t) => [...t, { role: "assistant", text: String(answer), state: j.state, signature: j.signature }]);
    } catch (e: any) {
      setTurns((t) => [
        ...t,
        { role: "assistant", text: `The Council endpoint is unreachable — ${e?.message ?? e}. No offline guess is shown in its place.`, state: "unreachable" },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  }

  const suggestions = [
    "Is workplace emotion inference prohibited?",
    "What is the governance axis score?",
    "How many GSPC axes are measured?",
    "How do you grade — LLM judge?",
  ];

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-semibold text-slate-900">Ask the Council</span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[1.5px] text-slate-400">
          deterministic · grounded in measurement
        </span>
      </div>

      {turns.length > 0 && (
        <div className="max-h-72 space-y-3 overflow-auto px-5 py-4">
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[92%]"}>
              <div
                className={
                  "whitespace-pre-wrap rounded-xl px-3.5 py-2.5 text-sm leading-relaxed " +
                  (t.role === "user"
                    ? "bg-emerald-500 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700")
                }
              >
                {t.text}
              </div>
              {t.role === "assistant" && (t.state || t.signature) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  {t.state && (
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono uppercase tracking-wide">
                      {STATE_LABEL[t.state] ?? t.state}
                    </span>
                  )}
                  {t.signature && <span className="font-mono">{t.signature}</span>}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="text-[11px] text-slate-400">Council reasoning…</div>}
          <div ref={endRef} />
        </div>
      )}

      <div className="px-5 py-4">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Ask the Council a governance question…"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            onClick={send}
            disabled={busy}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {busy ? "Reasoning…" : "Ask"}
          </button>
        </div>
        {turns.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQ(s)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[12px] text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          The Council answers from what the estate has actually measured, and says <span className="font-medium text-slate-500">"unmeasured"</span> where
          it has not earned a number. It refuses rather than improvise.
        </p>
      </div>
    </div>
  );
}
