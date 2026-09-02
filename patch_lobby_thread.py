import sys

content = """import type { RefObject } from "react";
import { useState } from "react";
import { MEASURE_CHAT, TYPE, TONE, SURFACE } from "./glass";
import { STATE_LABEL, type LobbyChat } from "./useLobbyChat";
import { AnswerText } from "./answerText";
import { ChevronDown, ChevronRight, Activity, Zap, FileCode } from "lucide-react";

const STATE_TONE: Record<string, string> = {
  live: TONE.ok,
  grounded: TONE.ok,
  ungrounded: TONE.running,
  unreachable: TONE.failed,
  deterministic: "border-sky-700/30 bg-sky-50 text-sky-900",
};

/**
 * LobbyThread — Advanced AG UI OS Conversation Stream
 */
export default function LobbyThread({
  chat,
  endRef,
}: {
  chat: LobbyChat;
  endRef?: RefObject<HTMLDivElement | null>;
}) {
  const turns = chat.active?.turns ?? [];
  const [expandedTrace, setExpandedTrace] = useState<number | null>(null);

  if (turns.length === 0) return null;

  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      aria-label="Council OS conversation"
      className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4 sm:px-8"
    >
      {turns.map((t, i) => (
        <div key={i} className={`${MEASURE_CHAT} ${t.role === "user" ? "ml-auto max-w-[min(42rem,92%)]" : "max-w-[min(44rem,96%)]"}`}>
          <p className="sr-only">{t.role === "user" ? "You asked:" : "The Council replied:"}</p>
          <div className={`mb-1 flex items-center gap-2 ${t.role === "user" ? "justify-end" : ""}`}>
            {t.role === "council" && (
               <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
                 <Zap className="h-3 w-3" />
               </div>
            )}
            <p className={`${TYPE.section}`}>
              {t.role === "user" ? "You" : "Antigravity OS"}
            </p>
          </div>
          
          <div
            className={
              "rounded-2xl px-5 py-4 text-[15.5px] leading-[1.65] " +
              (t.role === "user"
                ? "whitespace-pre-wrap bg-slate-900 text-white shadow-sm"
                : `${SURFACE} bg-white text-slate-800 shadow-sm`)
            }
          >
            {/* Multi-Agent Reasoning Trace (AG UI Feature) */}
            {t.role === "council" && i === turns.length - 1 && !chat.busy && (
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-900/10 bg-slate-50/50">
                <button 
                  onClick={() => setExpandedTrace(expandedTrace === i ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-2 hover:bg-slate-900/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-emerald-600" />
                    <span className={TYPE.fine + " text-slate-600"}>DSH Swarm Execution Trace</span>
                  </div>
                  {expandedTrace === i ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                </button>
                {expandedTrace === i && (
                  <div className="border-t border-slate-900/10 px-4 py-3 font-mono text-[10px] text-slate-500">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      [SYS] Routed to sov33-unified gateway
                    </div>
                    <div>[DSH] Fetching canonical facts from ledger... OK</div>
                    <div>[OOWM] Analyzing statutory constraints (Art. 50)... OK</div>
                    <div>[SYS] Deterministic evaluation complete. Zero hallucinations.</div>
                  </div>
                )}
              </div>
            )}

            {t.role === "user" ? t.text : <AnswerText text={t.text} />}
            
            {/* Artifact Rendering (AG UI Feature) */}
            {t.role === "council" && t.text.includes("```json") && (
               <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-900/10 bg-emerald-50/50 p-3 hover:bg-emerald-50 transition-colors cursor-pointer">
                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                   <FileCode className="h-4 w-4" />
                 </div>
                 <div>
                   <p className="text-[13px] font-semibold text-slate-900">Extracted Measurement Artifact</p>
                   <p className="text-[11px] text-slate-500">JSON Payload • Ed25519 Signed</p>
                 </div>
               </div>
            )}
          </div>

          {t.role === "council" && (t.state || t.signature) && (
            <div className="mt-2 flex flex-wrap items-center gap-2 px-1">
              {t.state && (
                <span
                  className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                    STATE_TONE[t.state] ?? TONE.idle
                  }`}
                >
                  {STATE_LABEL[t.state] ?? t.state}
                </span>
              )}
              {t.signature && (
                <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  {t.signature}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
      {chat.busy && (
        <div className="flex items-center gap-3 px-5 sm:px-8 max-w-[min(44rem,96%)]">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            <Zap className="h-3 w-3 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-slate-900/10 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            <span className="ml-1 text-[11px] font-medium uppercase tracking-widest text-slate-500">Processing</span>
          </div>
        </div>
      )}
      <div ref={endRef} className="h-4" />
    </div>
  );
}
"""

with open("client/src/components/lobby/LobbyThread.tsx", "w") as f:
    f.write(content)
