import { useEffect, useRef, useState } from "react";
import { FOCUS } from "@/components/lobby/glass";
import { AnswerText } from "@/components/lobby/answerText";
import OsDoorBody from "./OsDoors";
import OsGlassCard from "./OsGlassCard";
import GspcStreamCard from "./GspcStreamCard";
import OsSignGate from "./OsSignGate";
import { DOORS, DOOR_TO_LOBBY, type DoorId } from "./doors";
import { liveCountLine, OS_EMPTY, OS_PROMPT } from "./osChat";
import { useOsChat } from "./useOsChat";

const CHIPS: { id: string; label: string; door: DoorId; think: string }[] = [
  { id: "card", label: "I was sent a card", door: "verify", think: "Is this real?" },
  { id: "work", label: "I use AI at work", door: "assess", think: "What applies to me?" },
  { id: "board", label: "Show the board", door: "board", think: "What’s actually measured?" },
];

/**
 * Council OS product shell — chat as front door, five tabs, four tools.
 * First paint is for a stranger: three chips, one box, no 22-cell wall.
 */
export default function OsShell({
  variant,
  door,
  onDoor,
}: {
  variant: "page" | "hero";
  door: DoorId | null;
  onDoor: (id: DoorId) => void;
}) {
  const chat = useOsChat(onDoor);
  const [q, setQ] = useState("");
  const [strip, setStrip] = useState("Reading the board…");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let live = true;
    fetch("/api/gspc", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => {
        if (!live) return;
        setStrip(liveCountLine(j?.totals ?? {}));
      })
      .catch(() => {
        if (live) setStrip("Board is unreachable right now. Empty stays empty.");
      });
    return () => {
      live = false;
    };
  }, []);

  function submit() {
    const text = q.trim();
    if (!text || chat.busy) return;
    setQ("");
    void chat.send(text);
  }

  function pickChip(c: (typeof CHIPS)[number]) {
    onDoor(c.door);
    if (c.door === "verify") {
      inputRef.current?.focus();
    }
  }

  return (
    <section
      data-testid="os-shell"
      data-variant={variant}
      className={
        variant === "hero"
          ? "flex min-h-[calc(100svh-4rem)] flex-col bg-slate-50"
          : "flex min-h-[70vh] flex-col bg-white"
      }
      aria-labelledby="os-h1"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-6">
        <h1 id="os-h1" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Check an AI claim. Or measure your system.
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Empty cells stay empty. Not a certificate. Free, no account.
        </p>

        <nav aria-label="Council OS sections" className="mt-4 flex flex-wrap gap-1" data-testid="os-tabs">
          {DOORS.map((d) => {
            const active = door === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDoor(d.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${FOCUS} ${
                  active
                    ? "bg-emerald-100 text-emerald-900"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 flex flex-wrap gap-2" data-testid="os-chips">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              type="button"
              title={c.think}
              data-testid={`os-chip-${c.id}`}
              onClick={() => pickChip(c)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${FOCUS} ${
                door === c.door
                  ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                  : "border-slate-300 bg-white text-slate-800 hover:border-emerald-600 hover:bg-emerald-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label htmlFor="os-chat" className="sr-only">
            {OS_PROMPT}
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="os-chat"
              ref={inputRef}
              value={q}
              rows={2}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={OS_PROMPT}
              className="min-h-[2.75rem] w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[15px] text-slate-900 placeholder-slate-500 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/30"
            />
            <button
              type="button"
              onClick={submit}
              disabled={chat.busy || !q.trim()}
              className="shrink-0 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {chat.busy ? "…" : "Ask"}
            </button>
          </div>
          {chat.turns.length === 0 && (
            <p className="mt-2 text-[13px] text-slate-600" data-testid="os-empty">
              {OS_EMPTY}
            </p>
          )}
        </div>

        <p className="mt-3 text-[13px] font-semibold text-emerald-800" data-testid="os-live-strip">
          {strip}
        </p>
        <p className="mt-1 text-[12px] text-slate-600" data-testid="os-art50">
          Marking rules are in force. We measure them. We do not certify you.
        </p>

        {chat.turns.length > 0 && (
          <div
            role="log"
            aria-live="polite"
            aria-label="Council OS conversation"
            className="mt-4 max-h-64 space-y-3 overflow-y-auto"
          >
            {chat.turns.map((t, i) => (
              <div key={i} className={t.role === "user" ? "ml-auto max-w-[min(42rem,92%)]" : "max-w-[min(44rem,96%)]"}>
                <div
                  className={
                    "rounded-2xl px-4 py-3 text-[15px] leading-relaxed " +
                    (t.role === "user"
                      ? "whitespace-pre-wrap bg-emerald-700 text-white"
                      : "border border-slate-200 bg-white text-slate-900")
                  }
                >
                  {t.role === "user" ? t.text : <AnswerText text={t.text} />}
                </div>
                {t.role === "council" && t.verdict && <OsGlassCard verdict={t.verdict} />}
                {t.role === "council" && (t.streamAxis !== undefined || t.streamSha) && (
                  <div className="mt-2">
                    <GspcStreamCard axis={t.streamAxis} cardSha256={t.streamSha} />
                  </div>
                )}
                {t.role === "council" && t.tool && (
                  <p className="mt-1 font-mono text-[10px] text-slate-500">{t.tool}</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-3">
          <OsSignGate />
        </div>

        {door ? (
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-8" data-testid="os-door-body">
            <OsDoorBody door={door} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

export { DOOR_TO_LOBBY };
