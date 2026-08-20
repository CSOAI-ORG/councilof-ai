import { useEffect, useRef, useState } from "react";
import { LOBBY_TABS, matchTab, type LobbyTab } from "./tabs";

/**
 * LobbyChatBar — the persistent chat bar across the foot of the Council Lobby.
 *
 * DETERMINISTIC FIRST. Two lanes, and the pill on every answer says which one
 * produced it:
 *
 *   1. A local, deterministic command lane. "Show the board", "verify a card" —
 *      these switch the centre pane. No network, no model, labelled `deterministic`.
 *   2. POST /api/chat (functions/api/chat.ts), which answers from the estate's
 *      published measurements or refuses. We render its `answer`, `state` and
 *      `signature` verbatim, using the same STATE_LABEL contract as
 *      client/src/components/os/CouncilChat.tsx.
 *
 * On a non-200 or a network failure we fall back to a short deterministic help
 * message that is EXPLICITLY labelled deterministic. We never dress a local
 * string up as a live answer, and this bar never writes a compliance verdict —
 * it is a wire. Verdicts come from the signed APIs.
 */

type Turn = {
  role: "user" | "council";
  text: string;
  state?: string;
  signature?: string;
};

/** Copied from client/src/components/os/CouncilChat.tsx — one label vocabulary estate-wide. */
const STATE_LABEL: Record<string, string> = {
  live: "council · live specialist",
  grounded: "grounded in published measurement",
  ungrounded: "refused — no grounding available",
  unreachable: "endpoint unreachable",
  deterministic: "deterministic · local, no model",
};

const STATE_TONE: Record<string, string> = {
  live: "border-emerald-300/40 text-emerald-100",
  grounded: "border-emerald-300/40 text-emerald-100",
  ungrounded: "border-amber-300/40 text-amber-100",
  unreachable: "border-rose-300/40 text-rose-100",
  deterministic: "border-sky-300/40 text-sky-100",
};

const SUGGESTIONS = [
  "Show the live board",
  "Verify a card",
  "How many axes are measured?",
  "Is workplace emotion inference prohibited?",
];

/** The offline help text. Deterministic, and it says so on its face. */
function offlineHelp(reason: string): string {
  return (
    `The Council endpoint did not answer — ${reason}. This reply is a local, deterministic ` +
    `help message, not an answer to your question: no measurement was read and none is implied.\n\n` +
    `What still works right now, with no network: say "show the board", "verify a card", ` +
    `"open Council Space", "get measured", "open the Academy" — each switches the pane on the ` +
    `left of this lobby. The pages themselves fetch their own live data and will tell you if ` +
    `they cannot reach it either.`
  );
}

export default function LobbyChatBar({
  panel,
  onNavigate,
}: {
  panel: React.CSSProperties;
  onNavigate: (tab: LobbyTab) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, [turns, open]);

  const push = (t: Turn) => setTurns((p) => [...p, t]);

  async function send(text?: string) {
    const question = (text ?? q).trim();
    if (!question || busy) return;
    setQ("");
    setOpen(true);
    push({ role: "user", text: question });

    // Lane 1 — deterministic command. Answered locally, labelled locally.
    const tab = matchTab(question);
    if (tab) {
      onNavigate(tab);
      push({
        role: "council",
        text: `Opened “${tab.label}” in the centre pane — ${tab.blurb}\n\nThat was a local pane switch, not a measurement. Whatever the page shows, it fetched itself.`,
        state: "deterministic",
        signature: `local command · ${tab.path}`,
      });
      return;
    }

    // Lane 2 — the estate's honest endpoint.
    setBusy(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: question }] }),
      });
      if (!r.ok) {
        push({ role: "council", text: offlineHelp("HTTP " + r.status), state: "deterministic", signature: "local fallback · no measurement read" });
        return;
      }
      const j: any = await r.json();
      const answer = j?.answer ?? j?.reply;
      if (typeof answer !== "string" || !answer.trim()) {
        push({ role: "council", text: offlineHelp("it returned an empty answer"), state: "deterministic", signature: "local fallback · no measurement read" });
        return;
      }
      push({ role: "council", text: answer, state: j.state, signature: j.signature });
    } catch (e: any) {
      push({
        role: "council",
        text: offlineHelp(String(e?.message ?? e)),
        state: "deterministic",
        signature: "local fallback · no measurement read",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-300/20" style={panel}>
      {open && turns.length > 0 && (
        <div className="max-h-[26vh] space-y-2.5 overflow-y-auto border-b border-white/10 px-4 py-3">
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "ml-auto max-w-[80%]" : "max-w-[92%]"}>
              <div
                className={
                  "whitespace-pre-wrap rounded-xl px-3 py-2 text-[12.5px] leading-relaxed " +
                  (t.role === "user"
                    ? "bg-emerald-500/85 text-white"
                    : "border border-white/10 bg-black/25 text-emerald-50/90")
                }
              >
                {t.text}
              </div>
              {t.role === "council" && (t.state || t.signature) && (
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                  {t.state && (
                    <span
                      className={
                        "rounded-full border bg-black/20 px-2 py-0.5 font-mono uppercase tracking-wide " +
                        (STATE_TONE[t.state] ?? "border-white/20 text-emerald-100/70")
                      }
                    >
                      {STATE_LABEL[t.state] ?? t.state}
                    </span>
                  )}
                  {t.signature && <span className="font-mono text-emerald-200/45">{t.signature}</span>}
                </div>
              )}
            </div>
          ))}
          {busy && <div className="text-[11px] text-emerald-200/50">Council answering…</div>}
          <div ref={endRef} />
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
            aria-label="Ask the Council, or name a pane to open"
            placeholder='Ask the Council — or say "show the board"'
            className="flex-1 rounded-xl border border-emerald-300/25 bg-black/25 px-4 py-2.5 text-[13px] text-emerald-50 placeholder-emerald-200/40 focus:border-emerald-300/60 focus:outline-none"
          />
          <button
            onClick={() => void send()}
            disabled={busy}
            className="rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {busy ? "…" : "Ask"}
          </button>
          {turns.length > 0 && (
            <button
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              className="rounded-xl border border-emerald-300/25 px-3 text-[12px] text-emerald-100/80 transition hover:bg-white/10"
            >
              {open ? "Hide" : "Show"}
            </button>
          )}
        </div>

        {turns.length === 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full border border-emerald-300/20 bg-black/20 px-2.5 py-1 text-[11px] text-emerald-100/75 transition hover:border-emerald-300/50 hover:text-emerald-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <p className="mt-2 text-[10px] leading-relaxed text-emerald-100/40">
          This bar is a wire, not a judge. It answers from what the estate has published and refuses
          rather than improvise; it never issues a compliance verdict. Pane commands (
          {LOBBY_TABS.map((t) => t.label).join(", ")}) are handled locally with no model at all.
        </p>
      </div>
    </div>
  );
}
