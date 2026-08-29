import { useEffect, useRef, useState } from "react";
import { FOCUS } from "@/components/lobby/glass";
import { AnswerText } from "@/components/lobby/answerText";
import OsDoorBody from "./OsDoors";
import OsGlassCard from "./OsGlassCard";
import OsSignGate from "./OsSignGate";
import { DOORS, DOOR_TO_LOBBY, type DoorId } from "./doors";
import { OS_EMPTY, OS_PROMPT } from "./osChat";
import { useOsChat } from "./useOsChat";

/**
 * Council OS product shell — chat as front door, five tabs, four tools.
 * Same component on /os and as the homepage hero. No second UI. No iframe of /.
 */
export default function OsShell({
  variant,
  door,
  onDoor,
}: {
  variant: "page" | "hero";
  door: DoorId;
  onDoor: (id: DoorId) => void;
}) {
  const chat = useOsChat(onDoor);
  const [q, setQ] = useState("");
  const [strip, setStrip] = useState("Reading GET /api/gspc…");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const showTabs = variant === "hero";

  useEffect(() => {
    let live = true;
    fetch("/api/gspc", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))))
      .then((j) => {
        if (!live) return;
        const t = j?.totals ?? {};
        setStrip(t.public_count || t.count_grammar || "live GET /api/gspc");
      })
      .catch(() => {
        if (live) setStrip("board unreachable — GET /api/gspc");
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
        <h1 id="os-h1" className={variant === "hero" ? "text-2xl font-black tracking-tight text-slate-900" : "sr-only"}>
          Council OS
        </h1>
        {variant === "hero" && (
          <p className="mt-1 text-sm text-slate-600">
            Chat the board. Paste a card. Empty cells stay empty. Measurement, never certification.
          </p>
        )}

        {showTabs && (
          <nav aria-label="Council OS sections" className="mt-4 flex flex-wrap gap-1">
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
        )}

        <p className="mt-3 font-mono text-[12px] font-semibold text-emerald-800" data-testid="os-live-strip">
          {strip}
        </p>
        <p className="text-[11px] text-slate-500">live from GET /api/gspc · task read-the-board</p>

        <div className="mt-4">
          <label htmlFor="os-chat" className="sr-only">
            {OS_PROMPT}
          </label>
          <div className="flex items-end gap-2">
            <textarea
              id="os-chat"
              ref={inputRef}
              value={q}
              rows={1}
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

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-8">
          <OsDoorBody door={door} />
        </div>
      </div>
    </section>
  );
}

export { DOOR_TO_LOBBY };
