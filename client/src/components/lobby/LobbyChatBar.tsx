import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "wouter";
import { Send, Square, Sparkles, ShieldCheck, RotateCcw } from "lucide-react";
import { LobbyThread } from "./LobbyThread";
import { MeasuredToolCard } from "./MeasuredToolCard";
import { useLobbyChat } from "./useLobbyChat";
import { LOBBY_SUGGESTIONS } from "./suggestions";
import { getLobbyAccess, setLobbyAccess, type LobbyAccess } from "@/lib/lobbyAccess";
import { getJurisdiction } from "@/lib/jurisdictionStore";

const ACCESS_OPTIONS: { value: LobbyAccess; label: string; hint: string }[] = [
  { value: "guest", label: "Guest", hint: "Public desk · no account" },
  { value: "member", label: "Member", hint: "Signed-in operator" },
  { value: "council", label: "Council", hint: "Internal governance seat" },
];

export function LobbyChatBar() {
  const [draft, setDraft] = useState("");
  const [access, setAccess] = useState<LobbyAccess>(() => getLobbyAccess());
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    messages,
    toolCards,
    status,
    error,
    send,
    stop,
    clear,
    retryLast,
  } = useLobbyChat();

  useEffect(() => {
    setLobbyAccess(access);
  }, [access]);

  const busy = status === "streaming" || status === "thinking";
  const desk = getJurisdiction();

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    void send(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  function pickSuggestion(text: string) {
    if (busy) return;
    setDraft("");
    void send(text);
  }

  return (
    <section className="lobby-chat" aria-label="Council Lobby">
      <header className="lobby-chat__header">
        <div className="lobby-chat__brand">
          <Sparkles size={16} aria-hidden />
          <div>
            <h2 className="lobby-chat__title">Lobby</h2>
            <p className="lobby-chat__sub">
              Ask the board · desk {desk.label} · {access}
            </p>
          </div>
        </div>
        <div className="lobby-chat__access" role="group" aria-label="Access mode">
          {ACCESS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`lobby-chat__access-btn${access === opt.value ? " is-active" : ""}`}
              onClick={() => setAccess(opt.value)}
              title={opt.hint}
              disabled={busy}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </header>

      <LobbyThread messages={messages} status={status} />

      {toolCards.length > 0 && (
        <div className="lobby-chat__cards" aria-label="Measured tool cards">
          {toolCards.map((card) => (
            <MeasuredToolCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {error && (
        <div className="lobby-chat__error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void retryLast()} className="lobby-chat__retry">
            <RotateCcw size={14} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {!messages.length && (
        <div className="lobby-chat__suggestions" aria-label="Suggested prompts">
          {LOBBY_SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="lobby-chat__chip"
              onClick={() => pickSuggestion(s)}
              disabled={busy}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form className="lobby-chat__form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="lobby-draft">
          Message the lobby
        </label>
        <textarea
          id="lobby-draft"
          ref={inputRef}
          className="lobby-chat__input"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask the board…"
          disabled={busy}
        />
        <div className="lobby-chat__actions">
          {busy ? (
            <button type="button" className="lobby-chat__send is-stop" onClick={stop} aria-label="Stop">
              <Square size={16} aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              className="lobby-chat__send"
              disabled={!draft.trim()}
              aria-label="Send"
            >
              <Send size={16} aria-hidden />
            </button>
          )}
          {messages.length > 0 && !busy && (
            <button type="button" className="lobby-chat__clear" onClick={clear} aria-label="Clear thread">
              Clear
            </button>
          )}
        </div>
      </form>

      <footer className="lobby-chat__footer">
        <ShieldCheck size={12} aria-hidden />
        <span>
          Measurement, not certification ·{" "}
          <Link href="/payg">PAYG</Link> ·{" "}
          <Link href="/competitors">Competitors</Link>
        </span>
      </footer>
    </section>
  );
}
