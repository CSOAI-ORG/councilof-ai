import type { RefObject } from "react";
import { MEASURE_CHAT, TYPE, TONE } from "./glass";
import { STATE_LABEL, type LobbyChat } from "./useLobbyChat";
import { AnswerText } from "./answerText";

const STATE_TONE: Record<string, string> = {
  live: TONE.ok,
  grounded: TONE.ok,
  ungrounded: TONE.running,
  unreachable: TONE.failed,
  deterministic: "border-sky-700/30 bg-sky-50 text-sky-900",
};

/**
 * LobbyThread — the conversation stream in the centre workspace.
 *
 * Lives in the main column, not stacked inside the composer dock, so the
 * bottom bar stays one slim row and the thread can breathe.
 */
export default function LobbyThread({
  chat,
  endRef,
}: {
  chat: LobbyChat;
  endRef?: RefObject<HTMLDivElement | null>;
}) {
  const turns = chat.active?.turns ?? [];
  if (turns.length === 0) return null;

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
              "rounded-2xl px-5 py-3.5 text-[15.5px] leading-[1.65] " +
              (t.role === "user"
                ? "whitespace-pre-wrap bg-emerald-700 text-white"
                : "border border-slate-900/10 bg-white text-slate-900")
            }
          >
            {/* The user's own words are shown verbatim — never re-interpreted.
                The Council answers in Markdown, so its turn is rendered (see
                answerText.tsx: React nodes, whitelist, never innerHTML). */}
            {t.role === "user" ? t.text : <AnswerText text={t.text} />}
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
      {chat.busy && (
        <p className={TYPE.fine} role="status">
          Council answering…
        </p>
      )}
      <div ref={endRef} />
    </div>
  );
}
