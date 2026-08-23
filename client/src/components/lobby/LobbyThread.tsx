import type { RefObject } from "react";
import { MEASURE_CHAT, TYPE, TONE } from "./glass";
import { STATE_LABEL, type LobbyChat } from "./useLobbyChat";

const STATE_TONE: Record<string, string> = {
  live: TONE.ok,
  grounded: TONE.ok,
  ungrounded: TONE.running,
  unreachable: TONE.failed,
  deterministic: "border-sky-700/30 bg-sky-50 text-sky-900",
  agui: "border-violet-500/30 bg-violet-50 text-violet-900",
  "agui-hitl": "border-amber-500/40 bg-amber-50 text-amber-900",
  "agui-streaming": "border-violet-400/30 bg-violet-50/80 text-violet-900",
};

export default function LobbyThread({
  chat,
  endRef,
}: {
  chat: LobbyChat;
  endRef?: RefObject<HTMLDivElement | null>;
}) {
  const turns = chat.active?.turns ?? [];
  if (turns.length === 0) return null;

  const last = turns[turns.length - 1];
  const hitlPending = last?.role === "council" && last.hitl && !chat.busy;

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Council OS conversation"
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-8"
    >
      {turns.map((t, i) => (
        <div key={i} className={`${MEASURE_CHAT} ${t.role === "user" ? "ml-auto max-w-[min(42rem,92%)]" : "max-w-[min(44rem,96%)]"}`}>
          <p className="sr-only">{t.role === "user" ? "You asked:" : "The Council replied:"}</p>
          <p className={`mb-1 ${TYPE.section} ${t.role === "user" ? "text-right" : ""}`}>
            {t.role === "user" ? "You" : "Council"}
          </p>
          <div
            className={
              "whitespace-pre-wrap rounded-2xl px-5 py-3.5 text-[15.5px] leading-[1.65] " +
              (t.role === "user"
                ? "bg-emerald-700 text-white"
                : "border border-slate-900/10 bg-white text-slate-900")
            }
          >
            {t.text || (t.streaming ? "…" : "")}
            {t.streaming && t.text && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-500 align-middle" aria-hidden />
            )}
          </div>
          {t.role === "council" && (t.state || t.signature) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {t.state && (
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                    STATE_TONE[t.state] ?? TONE.idle
                  }`}
                >
                  {STATE_LABEL[t.state] ?? t.state}
                </span>
              )}
              {t.signature && (
                <span className="font-mono text-[10px] text-slate-600">{t.signature}</span>
              )}
            </div>
          )}
        </div>
      ))}

      {hitlPending && last.hitl && (
        <div
          role="region"
          aria-label="Consent checkpoint"
          className="rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p className="font-semibold">Consent required before the next step</p>
          <p className="mt-1 text-xs text-amber-900/90">{last.hitl.reason}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {last.hitl.options.map((opt) => (
              <button
                key={opt}
                type="button"
                disabled={chat.busy}
                onClick={() => void chat.submitHitl(opt === "deny" ? "deny" : "approve")}
                className={
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
                  (opt === "deny"
                    ? "border border-amber-700/30 bg-white text-amber-900 hover:bg-amber-100"
                    : "bg-amber-700 text-white hover:bg-amber-800")
                }
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {chat.busy && !hitlPending && (
        <p className={TYPE.fine} role="status">
          Council answering…
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
