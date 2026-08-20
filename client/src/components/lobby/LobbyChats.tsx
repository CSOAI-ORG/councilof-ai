import { FOCUS, SP, TYPE, insetStyle } from "./glass";
import type { LobbyChat } from "./useLobbyChat";

/**
 * LobbyChats — the "Chats" section of the right rail.
 *
 * The threads opened in THIS page session, newest last, with the first question
 * as the title. Selecting one puts it back in the chat bar.
 *
 * IN MEMORY, AND IT SAYS SO. There is no server-side history and nothing is
 * written to storage: reload the page and this list is empty. The note at the
 * foot states that rather than letting the presence of a list imply a
 * transcript exists somewhere to retrieve.
 */

export default function LobbyChats({ chat }: { chat: LobbyChat }) {
  const { threads, activeId, selectThread, startThread } = chat;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-3">
        <h3 className={TYPE.section}>This session</h3>
        <button
          type="button"
          onClick={startThread}
          className={`ml-auto rounded-lg border border-slate-900/10 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
        >
          New thread
        </button>
      </div>

      {threads.length === 0 ? (
        <p className={`${SP.card} rounded-xl border border-dashed border-slate-900/15 ${TYPE.muted}`}>
          No threads yet. Ask something in the bar below and it will open one here.
        </p>
      ) : (
        <ul className={`${SP.stackTight} overflow-y-auto`}>
          {threads.map((t) => {
            const on = t.id === activeId;
            const replies = t.turns.filter((x) => x.role === "council").length;
            const last = t.turns[t.turns.length - 1];
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => selectThread(t.id)}
                  aria-current={on ? "true" : undefined}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left transition motion-reduce:transition-none ${FOCUS} ${
                    on
                      ? "border-emerald-700/30 bg-emerald-50"
                      : "border-slate-900/10 hover:border-slate-900/20"
                  }`}
                  style={on ? undefined : insetStyle}
                >
                  <span className="block text-[12.5px] font-semibold leading-snug text-slate-900">
                    {t.title}
                  </span>
                  <span className={`mt-1 block ${TYPE.fine}`}>
                    {t.turns.length} message{t.turns.length === 1 ? "" : "s"} · {replies}{" "}
                    {replies === 1 ? "reply" : "replies"}
                    {last?.state ? ` · last state: ${last.state}` : ""}
                  </span>
                  <span className={`mt-0.5 block ${TYPE.mono}`}>
                    started {t.startedAt.replace("T", " ").slice(0, 19)}Z
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className={`mt-auto pt-4 ${TYPE.fine}`}>
        These threads live in this browser tab for as long as it is open. Nothing is stored on a
        server and nothing is written to disk — close or reload the page and this list is gone.
        Minimising the lobby keeps it.
      </p>
    </div>
  );
}
