import { useEffect, useMemo, useRef, useState } from "react";
import { LOBBY_TABS, type LobbyTab } from "./tabs";
import { AUDIENCES, DEFAULT_AUDIENCE, asksFor } from "./asks";
import { FOCUS, MEASURE, PRIMARY, SP, SURFACE_LIFTED, TYPE, TONE, panelStyle } from "./glass";
import { STATE_LABEL, type LobbyChat } from "./useLobbyChat";

/**
 * LobbyChatBar — the chat bar across the foot of the Council Lobby.
 *
 * WHAT CHANGED AND WHY. It used to run the full width of the overlay, which made
 * a 2000px-wide input nobody could see the edges of. It is now CENTRED and
 * constrained to max-w-3xl, lifted off the ground with real elevation, given a
 * generous padding step from the spacing scale, and given a focused state you
 * can actually see (a two-ring emerald treatment on the field itself, not just
 * the browser default).
 *
 * IT IS NEVER EMPTY. Directly above the field sit the audience chips (AUDIENCES)
 * and the suggested questions for the pane you are looking at
 * (asksFor(path, audience)). Opening the lobby therefore always shows something
 * to ask, cut to who you say you are.
 *
 * THE CONSENT LOCK IS BINDING, AND IT IS ENFORCED HERE. Selecting a suggested
 * question — by click or by Enter — PRE-FILLS the field and FOCUSES it. It does
 * not send. A seeded prompt from a deep link behaves identically. The send is
 * always a deliberate act by the person reading. There is no code path in this
 * file that calls send() from anything other than the Ask button or the Enter
 * key inside the field itself.
 *
 * DETERMINISTIC FIRST. The two lanes and the honest state pills live in
 * useLobbyChat.ts; this file only renders them. A failure says so plainly and is
 * labelled `deterministic`, so a local help string can never be read as an answer.
 */

const STATE_TONE: Record<string, string> = {
  live: TONE.ok,
  grounded: TONE.ok,
  ungrounded: TONE.running,
  unreachable: TONE.failed,
  deterministic: "border-sky-700/30 bg-sky-50 text-sky-900",
};

const AUDIENCE_KEY = "coai.lobby.audience";

function readAudience(): string {
  try {
    const v = localStorage.getItem(AUDIENCE_KEY);
    if (v && AUDIENCES.some((a) => a.id === v)) return v;
  } catch { /* private mode — the default is fine */ }
  return DEFAULT_AUDIENCE;
}

export default function LobbyChatBar({
  chat,
  onNavigate,
  paneLabel,
  panePath,
  seedPrompt,
  seedNonce,
}: {
  chat: LobbyChat;
  onNavigate: (tab: LobbyTab) => void;
  paneLabel: string;
  /** The route the centre pane is showing — what the suggestions are cut to. */
  panePath: string;
  /** Pre-filled by a deep link. Typed, never sent. */
  seedPrompt?: string;
  /** Changes on every fresh intent, so the same seed can be re-applied. */
  seedNonce?: number;
}) {
  const [q, setQ] = useState("");
  const [audience, setAudience] = useState<string>(readAudience);
  const [seeded, setSeeded] = useState(false);
  const [logOpen, setLogOpen] = useState(true);
  /** The prompt block is open until the reader has a thread of their own. */
  const [promptsOpen, setPromptsOpen] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  /** Fold the prompt block away ONCE, when the reader gets their first reply. It
   *  is open on arrival — the lobby must never open on an empty box — and the
   *  "Asks" button brings it back at any time. */
  const folded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const turns = chat.active?.turns ?? [];
  const suggestions = useMemo(
    () => asksFor(panePath || "/", audience),
    [panePath, audience],
  );

  useEffect(() => {
    try { localStorage.setItem(AUDIENCE_KEY, audience); } catch { /* ignore */ }
  }, [audience]);

  /**
   * Fill the field and focus it. THAT IS THE WHOLE ACTION — used by the seeded
   * deep link and by every suggestion chip alike. Nothing here sends.
   */
  function prefill(text: string, fromLink: boolean) {
    setQ(text);
    setSeeded(fromLink);
    // setTimeout, not rAF — focus must land even in a background tab.
    setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(text.length, text.length);
    }, 0);
  }

  useEffect(() => {
    const seed = seedPrompt?.trim();
    if (!seed) return;
    prefill(seed, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedNonce, seedPrompt]);

  useEffect(() => {
    if (turns.length > 0 && !folded.current) { folded.current = true; setPromptsOpen(false); }
  }, [turns.length]);

  useEffect(() => {
    if (logOpen && turns.length) {
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: "end" }));
    }
  }, [turns.length, logOpen]);

  function submit() {
    const text = q.trim();
    if (!text || chat.busy) return;
    setQ("");
    setSeeded(false);
    setLogOpen(true);
    void chat.send(text, onNavigate);
  }

  return (
    <div className={`mx-auto flex w-full max-w-3xl shrink-0 flex-col ${SURFACE_LIFTED}`} style={panelStyle}>
      {/* ── the thread ──────────────────────────────────────────────────── */}
      {logOpen && turns.length > 0 && (
        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="Council Lobby conversation"
          className="max-h-[20vh] space-y-3 overflow-y-auto border-b border-slate-900/10 px-5 py-4"
        >
          {turns.map((t, i) => (
            <div key={i} className={t.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[95%]"}>
              <p className="sr-only">{t.role === "user" ? "You asked:" : "The Council replied:"}</p>
              <div
                className={
                  "whitespace-pre-wrap rounded-xl px-4 py-2.5 text-[13px] leading-relaxed " +
                  (t.role === "user"
                    ? "bg-emerald-700 text-white"
                    : "border border-slate-900/10 bg-slate-50 text-slate-800")
                }
              >
                {t.text}
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
            <p className={TYPE.fine} role="status">Council answering…</p>
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className={`${SP.card} space-y-3`}>
        {seeded && (
          <p
            role="status"
            className="rounded-xl border border-sky-700/25 bg-sky-50 px-4 py-2.5 text-[12px] leading-relaxed text-sky-900"
          >
            <strong className="font-bold">Nothing has been asked yet.</strong> That link filled the
            box below with a suggested question — no lane has run, no measurement has been read and
            no model has answered. Edit it, or press Ask to send it yourself.
          </p>
        )}

        {/* ── audience chips + suggested questions ───────────────────── */}
        {promptsOpen && (
          <div id="coai-lobby-asks" className="space-y-2">
            <div className="flex items-center gap-x-2">
              <span id="coai-lobby-audience-h" className={`${TYPE.section} shrink-0`}>Asking as</span>
              <span role="group" aria-labelledby="coai-lobby-audience-h" className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5">
                {AUDIENCES.map((a) => {
                  const on = a.id === audience;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAudience(a.id)}
                      aria-pressed={on}
                      title={a.who}
                      className={
                        `shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition ` +
                        `motion-reduce:transition-none ${FOCUS} ` +
                        (on
                          ? "border-emerald-700/40 bg-emerald-100 text-emerald-900"
                          : "border-slate-900/12 bg-white/80 text-slate-600 hover:border-slate-900/25 hover:text-slate-900")
                      }
                    >
                      {a.label}
                    </button>
                  );
                })}
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span id="coai-lobby-asks-h" className={TYPE.section}>Suggested for “{paneLabel}”</span>
                <span className={TYPE.fine}>— selecting one fills the box, it never sends</span>
              </div>
              <ul aria-labelledby="coai-lobby-asks-h" className="mt-1.5 max-h-[4.75rem] space-y-1 overflow-y-auto pr-1">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => prefill(s, false)}
                      className={`w-full truncate rounded-lg border border-slate-900/12 bg-white/80 px-3 py-1 text-left text-[11.5px] text-slate-700 transition hover:border-emerald-700/40 hover:bg-white hover:text-slate-900 motion-reduce:transition-none ${FOCUS}`}
                      title={s}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── the field ────────────────────────────────────────────────── */}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSeeded(false); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
            aria-label="Ask the Council, or name a pane to open"
            aria-describedby="coai-lobby-chat-note"
            placeholder='Ask the Council — or say "show the board"'
            className="min-w-0 flex-1 rounded-xl border border-slate-900/15 bg-white px-4 py-2.5 text-[13.5px] text-slate-900 placeholder-slate-500 shadow-inner transition outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/30 motion-reduce:transition-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={chat.busy || !q.trim()}
            className={`${PRIMARY} shrink-0 px-6 py-2.5 text-[13.5px]`}
          >
            {chat.busy ? "…" : "Ask"}
          </button>
          <button
            type="button"
            onClick={() => setPromptsOpen((o) => !o)}
            aria-expanded={promptsOpen}
            aria-controls="coai-lobby-asks"
            aria-label={promptsOpen ? "Hide the suggested questions" : "Show the suggested questions"}
            className={`shrink-0 rounded-xl border border-slate-900/12 bg-white/80 px-3.5 text-[12px] font-semibold text-slate-700 transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
          >
            {promptsOpen ? "Hide asks" : "Asks"}
          </button>
          {turns.length > 0 && (
            <button
              type="button"
              onClick={() => setLogOpen((o) => !o)}
              aria-expanded={logOpen}
              aria-label={logOpen ? "Hide the conversation" : "Show the conversation"}
              className={`shrink-0 rounded-xl border border-slate-900/12 bg-white/80 px-3.5 text-[12px] font-semibold text-slate-700 transition hover:bg-white motion-reduce:transition-none ${FOCUS}`}
            >
              {logOpen ? "Hide" : "Show"}
            </button>
          )}
        </div>

        <p id="coai-lobby-chat-note" className={TYPE.fine}>
          A wire, not a judge: it answers from what the estate has published, or it refuses. It never
          issues a compliance verdict.{" "}
          <button
            type="button"
            onClick={() => setNoteOpen((o) => !o)}
            aria-expanded={noteOpen}
            aria-controls="coai-lobby-chat-lanes"
            className={`rounded font-semibold text-emerald-800 underline underline-offset-2 ${FOCUS}`}
          >
            {noteOpen ? "Hide the two lanes" : "How it answers"}
          </button>
        </p>
        {noteOpen && (
          <p id="coai-lobby-chat-lanes" className={`${MEASURE} ${TYPE.fine}`}>
            Two lanes, and the pill on every answer says which one produced it. Pane commands —{" "}
            {LOBBY_TABS.map((t) => t.label).join(", ")} — are matched locally and switch the centre
            pane with no network and no model. Everything else goes to the published-measurement
            endpoint; if that endpoint fails, the reply you get is a local help message explicitly
            labelled <em>deterministic</em>, never an answer dressed up as one.
          </p>
        )}
      </div>
    </div>
  );
}
