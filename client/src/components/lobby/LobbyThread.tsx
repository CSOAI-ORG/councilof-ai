import type { RefObject } from "react";
import { MEASURE_CHAT, TYPE, TONE } from "./glass";
import { STATE_LABEL, type LobbyChat } from "./useLobbyChat";
import { AnswerText } from "./answerText";
import LobbyGspcObservation from "./LobbyGspcObservation";

const STATE_TONE: Record<string, string> = {
  model_response: TONE.running,
  grounded: TONE.ok,
  runtime_observed: TONE.ok,
  unchecked: TONE.running,
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
      aria-label="Council of AI conversation"
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-8"
    >
      {turns.map((t, i) => (
        <div
          key={i}
          className={`${MEASURE_CHAT} ${t.role === "user" ? "ml-auto max-w-[min(42rem,92%)]" : "max-w-[min(44rem,96%)]"}`}
        >
          <p className="sr-only">
            {t.role === "user"
              ? "You asked:"
              : t.state === "model_response"
                ? "An upstream model replied:"
                : "The Council replied:"}
          </p>
          <p
            className={`mb-1 ${TYPE.section} ${t.role === "user" ? "text-right" : ""}`}
          >
            {t.role === "user"
              ? "You"
              : t.state === "model_response"
                ? "Upstream model"
                : "Council"}
          </p>
          <div
            className={
              "rounded-2xl px-5 py-3.5 text-[15.5px] leading-[1.65] " +
              (t.role === "user"
                ? "whitespace-pre-wrap bg-primary text-primary-foreground"
                : "border border-border bg-card text-foreground")
            }
          >
            {/* The user's own words are shown verbatim — never re-interpreted.
                The Council answers in Markdown, so its turn is rendered (see
                answerText.tsx: React nodes, whitelist, never innerHTML). */}
            {t.role === "user" ? t.text : <AnswerText text={t.text} />}
            {t.role === "council" && t.gspc && (
              <LobbyGspcObservation observation={t.gspc} />
            )}
            {t.role === "council" && t.boardRead && (
              <button
                type="button"
                disabled={chat.busy}
                onClick={() =>
                  void chat.send("Refresh the live GSPC board", () => {})
                }
                className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent disabled:opacity-50"
              >
                {t.gspc ? "Read board again" : "Retry board read"}
              </button>
            )}
          </div>
          {t.role === "council" && (t.state || t.signature || t.provenance) && (
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
                <span className="font-mono text-[10px] text-slate-600">
                  {t.signature}
                </span>
              )}
              {t.provenance && (
                <span className="break-all text-[10px] text-muted-foreground">
                  {t.provenance}
                </span>
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
