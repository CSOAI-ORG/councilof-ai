import { useEffect, useRef, useState } from "react";
import { AUDIENCES, AUDIENCE_DOORS, DEFAULT_AUDIENCE, asksFor } from "./asks";
import { FOCUS, MEASURE, PRIMARY, TYPE } from "./glass";
import type { LobbyTab } from "./tabs";
import type { LobbyChat } from "./useLobbyChat";

export type ComposerTool = {
  name: string;
  description: string;
};

/**
 * LobbyComposer — one slim dock at the foot of the centre column.
 *
 * Audience chips and suggested asks live in a popover so the dock is never a
 * half-loaded stack of bars. The consent lock is unchanged: suggestions only
 * prefill; nothing sends except Ask or Enter in the field.
 */
export default function LobbyComposer({
  chat,
  onNavigate,
  onOpenRoute,
  paneLabel,
  panePath,
  seedPrompt,
  seedNonce,
  onFirstReply,
  onSubmit,
  onClose,
  tools = [],
  onTool,
}: {
  chat: LobbyChat;
  onNavigate: (tab: LobbyTab) => void;
  onOpenRoute?: (path: string, label: string) => void;
  paneLabel: string;
  panePath: string;
  seedPrompt?: string;
  seedNonce?: number;
  /** Called once when the reader gets their first council reply. */
  onFirstReply?: () => void;
  /** Consume a URL-prefilled prompt after the person submits it. */
  onSubmit?: () => void;
  /** Folds the composer dock away. The overlay passed this for months while the
   *  composer silently dropped it — once opened, the dock could never be closed. */
  onClose?: () => void;
  /** Runtime tools returned by MCP tools/list. An empty array claims nothing. */
  tools?: ComposerTool[];
  /** Opens the usable dashboard pane behind a selected runtime tool. */
  onTool?: (tool: ComposerTool) => void;
}) {
  const [q, setQ] = useState("");
  const [audience, setAudience] = useState<string>(() => {
    try {
      const v = localStorage.getItem("coai.lobby.audience");
      if (v && AUDIENCES.some((a) => a.id === v)) return v;
    } catch {
      /* ignore */
    }
    return DEFAULT_AUDIENCE;
  });
  const [seeded, setSeeded] = useState(false);
  const [asksOpen, setAsksOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const asksRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const asksButtonRef = useRef<HTMLButtonElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const replied = useRef(false);

  const turns = chat.active?.turns ?? [];
  const suggestions = asksFor(panePath || "/", audience);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, [q]);

  useEffect(() => {
    try {
      localStorage.setItem("coai.lobby.audience", audience);
    } catch {
      /* ignore */
    }
  }, [audience]);

  useEffect(() => {
    if (!asksOpen && !toolsOpen) return;
    const close = (e: MouseEvent) => {
      if (asksRef.current && !asksRef.current.contains(e.target as Node))
        setAsksOpen(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node))
        setToolsOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [asksOpen, toolsOpen]);

  useEffect(() => {
    if (!asksOpen && !toolsOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (toolsOpen) toolsButtonRef.current?.focus();
      if (asksOpen) asksButtonRef.current?.focus();
      setToolsOpen(false);
      setAsksOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [asksOpen, toolsOpen]);

  function prefill(text: string, fromLink: boolean) {
    setQ(text);
    setSeeded(fromLink);
    setAsksOpen(false);
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
    const councilTurns = turns.filter((t) => t.role === "council").length;
    if (councilTurns > 0 && !replied.current) {
      replied.current = true;
      onFirstReply?.();
    }
  }, [turns, onFirstReply]);

  function submit() {
    const text = q.trim();
    if (!text || chat.busy) return;
    setQ("");
    setSeeded(false);
    setAsksOpen(false);
    onSubmit?.();
    void chat.send(text, onNavigate, onOpenRoute);
  }

  return (
    <div className="relative shrink-0 border-t border-border bg-card/95 px-3 py-3 backdrop-blur sm:px-6">
      {seeded && (
        <p
          role="status"
          className="mb-2 rounded-lg border border-sky-700/25 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-900"
        >
          <strong className="font-bold">Nothing sent yet.</strong> That link
          filled the box — edit or press Ask yourself.
        </p>
      )}

      <div className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
        <div className="relative min-w-0 basis-full flex-1 sm:basis-auto">
          <textarea
            ref={inputRef}
            value={q}
            rows={1}
            onChange={(e) => {
              setQ(e.target.value);
              setSeeded(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            aria-label="Ask the Council, or name a pane to open"
            aria-describedby="coai-lobby-chat-note"
            placeholder='Ask the Council — paste a card to verify here (nothing uploaded). Or say "show the board"'
            className="max-h-28 min-h-12 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-[15px] leading-snug text-foreground placeholder:text-muted-foreground shadow-inner transition outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 motion-reduce:transition-none"
          />
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={chat.busy || !q.trim()}
          className={`${PRIMARY} min-h-11 shrink-0 px-5 py-2.5 text-[14px]`}
        >
          {chat.busy ? "…" : "Ask"}
        </button>
        {onTool && (
          <div ref={toolsRef} className="relative shrink-0">
            <button
              ref={toolsButtonRef}
              type="button"
              onClick={() => {
                setToolsOpen((open) => !open);
                setAsksOpen(false);
              }}
              aria-expanded={toolsOpen}
              aria-haspopup="dialog"
              aria-label="Open available MCP tools"
              title="Available MCP tools"
              className={`inline-flex h-11 items-center gap-1.5 rounded-xl border border-border bg-background px-3 text-[12px] font-semibold text-foreground transition hover:bg-accent motion-reduce:transition-none ${FOCUS}`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                +
              </span>
              <span className="hidden sm:inline">Tools</span>
            </button>
            {toolsOpen && (
              <div
                role="dialog"
                aria-label="Available MCP tools"
                className="absolute bottom-full right-0 z-30 mb-2 max-h-80 w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-border bg-card p-3 text-foreground shadow-xl"
              >
                <p className={TYPE.section}>Returned by MCP tools/list</p>
                {tools.length ? (
                  <ul className="mt-2 space-y-1">
                    {tools.map((tool) => (
                      <li key={tool.name}>
                        <button
                          type="button"
                          onClick={() => {
                            setToolsOpen(false);
                            onTool(tool);
                          }}
                          className={`w-full rounded-lg border border-slate-900/10 px-3 py-2 text-left transition hover:border-emerald-700/35 hover:bg-emerald-50/50 motion-reduce:transition-none ${FOCUS}`}
                        >
                          <code className="text-[11.5px] font-semibold text-emerald-800">
                            {tool.name}
                          </code>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-600">
                            {tool.description}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 rounded-lg border border-dashed border-slate-900/15 p-3 text-[11.5px] text-slate-600">
                    The MCP catalogue has not answered. No unavailable tool is
                    shown in its place.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <div ref={asksRef} className="relative shrink-0">
          <button
            ref={asksButtonRef}
            type="button"
            onClick={() => {
              setAsksOpen((o) => !o);
              setToolsOpen(false);
            }}
            aria-expanded={asksOpen}
            aria-haspopup="dialog"
            className={`min-h-11 rounded-xl border border-border bg-background px-3 py-2.5 text-[12px] font-semibold text-foreground transition hover:bg-accent motion-reduce:transition-none ${FOCUS}`}
          >
            Asks
            {audience !== DEFAULT_AUDIENCE && (
              <span className="ml-1.5 rounded-full border border-emerald-700/30 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900">
                {AUDIENCES.find((a) => a.id === audience)?.label ?? audience}
              </span>
            )}
          </button>
          {asksOpen && (
            <div
              role="dialog"
              aria-label={`Suggested questions for ${paneLabel}`}
              className="absolute bottom-full right-0 z-20 mb-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card p-3 text-foreground shadow-xl"
            >
              <p className={TYPE.section}>Asking as</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                        `rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition motion-reduce:transition-none ${FOCUS} ` +
                        (on
                          ? "border-emerald-700/40 bg-emerald-100 text-emerald-900"
                          : "border-slate-900/12 bg-white text-slate-600 hover:border-slate-900/25")
                      }
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
              {AUDIENCE_DOORS[audience] && onOpenRoute && (
                <button
                  type="button"
                  onClick={() => {
                    setAsksOpen(false);
                    onOpenRoute(
                      AUDIENCE_DOORS[audience].href,
                      AUDIENCES.find((a) => a.id === audience)?.label ??
                        audience,
                    );
                  }}
                  className={`mt-2 w-full rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-left text-[12px] font-semibold text-emerald-900 transition hover:bg-emerald-100 motion-reduce:transition-none ${FOCUS}`}
                >
                  {AUDIENCE_DOORS[audience].label} →{" "}
                  {AUDIENCE_DOORS[audience].href}
                </button>
              )}
              <p className={`${TYPE.section} mt-3`}>For “{paneLabel}”</p>
              <p className={TYPE.fine}>Tap to fill — never auto-send</p>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => prefill(s, false)}
                      className={`w-full rounded-lg border border-slate-900/10 px-3 py-1.5 text-left text-[12px] text-slate-700 transition hover:border-emerald-700/35 hover:bg-emerald-50/50 motion-reduce:transition-none ${FOCUS}`}
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the composer"
            title="Close the composer"
            className={`shrink-0 rounded-xl border border-slate-900/12 bg-white/90 px-3 py-2.5 text-[12px] font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800 motion-reduce:transition-none ${FOCUS}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* In conversation the sentence folds away — bubbles get the room — but the
          "How it answers" toggle stays clickable and aria-describedby stays intact. */}
      <p id="coai-lobby-chat-note" className={`mt-2 ${TYPE.fine}`}>
        <span className={turns.length > 0 && !noteOpen ? "sr-only" : undefined}>
          Answers from published measurement, or it refuses.
        </span>{" "}
        <button
          type="button"
          onClick={() => setNoteOpen((o) => !o)}
          aria-expanded={noteOpen}
          className={`rounded font-semibold text-emerald-800 underline underline-offset-2 ${FOCUS}`}
        >
          {noteOpen ? "Hide lanes" : "How it answers"}
        </button>
      </p>
      {noteOpen && (
        <p className={`${MEASURE} mt-1 ${TYPE.fine}`}>
          Pane commands switch locally with no model. Everything else hits the
          published endpoint; failures are labelled <em>deterministic</em>.
        </p>
      )}
    </div>
  );
}
