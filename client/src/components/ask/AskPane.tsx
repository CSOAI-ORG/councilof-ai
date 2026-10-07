import { plannedPageReply } from "@/lib/askNavigation";
/**
 * AskPane — Ask GSPC, the one assistant: a side pane on every page (opened from the header, the
 * command palette or Ctrl/⌘-K → Ask) over the SAME deterministic talk router every door uses
 * (POST /api/agui/run → functions/_lib/talkRouter.ts). It replaces the retired SovereignDock and
 * the DemoOS model chat as separate clients.
 *
 * WHAT IT IS (Article 50). A rule-based surface: keyword and entity matching picks signed-record
 * tools and quotes their fields with a citation. No AI model writes an answer, so no Article 50(1)
 * AI-system notice applies; the pane says so in words, and client/src/lib/ai-surfaces.ts registers
 * it rule_based. An ungrounded question is answered "not measured", with no number.
 *
 * WATCH MODE. Off by default. Switched on, a question that asks to be shown something ("show me
 * safety", "walk me through it", "re-check this") comes back with AG-UI frontend tool calls that
 * this pane executes one by one through lib/uiActions.ts: each step animates, is listed with its
 * state, is spoken to screen readers (aria-live) and goes to the action log. Stop, Undo and Take
 * over are always on screen while it runs. Commit, pay and schedule steps stop at a visible
 * Confirm; nothing here pays, signs or submits.
 *
 * VOICE. Off by default. Voice on speaks answers (councilVoice) and shows a push-to-talk mic
 * (councilListen) with the privacy note that Chrome may send audio to Google.
 */
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { menuTrail } from "@/components/lobby/tabs";
import { CheckCircle2, Circle, CircleSlash, Hand, Loader2, OctagonX, PauseCircle, Undo2, X, XCircle } from "lucide-react";
import { createWatchRequests, takeAskRequest } from "@/lib/askRequests";
import type { AskRequest } from "@/components/ask/askBus";
import TalkPanel, { type TalkPanelHandle } from "@/components/talk/TalkPanel";
import OwmFreshness from "@/components/ask/OwmFreshness";
import { streamRun, type TalkRun, type UiStepCall } from "@/lib/aguiTalk";
import {
  agentConsent,
  canUndo,
  clearHighlight,
  executeStep,
  installAgentBridge,
  logAction,
  pageContext,
  readLog,
  setAgentConsent,
  subscribeLog,
  undoLast,
  type LogEntry,
} from "@/lib/uiActions";
import { prepSpeech, speakVoice, stopVoice } from "@/lib/councilVoice";
import { LISTEN_PRIVACY_NOTE, isListenSupported } from "@/lib/councilListen";
import { crumbFor } from "@/components/ask/paletteIndex";

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type StepState = "pending" | "running" | "awaiting_confirm" | "done" | "skipped" | "refused" | "failed" | "stopped";
type WatchStep = UiStepCall & { state: StepState; detail: string };

const PREF = "coai:ask-prefs";
type Prefs = { watch: boolean; voice: boolean };
function readPrefs(): Prefs {
  try {
    const p = JSON.parse(window.sessionStorage.getItem(PREF) ?? "{}") as Partial<Prefs>;
    return { watch: p.watch === true, voice: p.voice === true };
  } catch {
    return { watch: false, voice: false };
  }
}
function writePrefs(p: Prefs) {
  try {
    window.sessionStorage.setItem(PREF, JSON.stringify(p));
  } catch {
    /* storage blocked: the switches last for this page */
  }
}

const reduceMotion = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function StepIcon({ s }: { s: StepState }) {
  const c = "h-4 w-4 shrink-0";
  if (s === "running") return <Loader2 className={`${c} animate-spin motion-reduce:animate-none text-emerald-700`} aria-hidden="true" />;
  if (s === "done") return <CheckCircle2 className={`${c} text-emerald-700`} aria-hidden="true" />;
  if (s === "awaiting_confirm") return <PauseCircle className={`${c} text-amber-700`} aria-hidden="true" />;
  if (s === "skipped" || s === "stopped") return <CircleSlash className={`${c} text-slate-500`} aria-hidden="true" />;
  if (s === "refused" || s === "failed") return <XCircle className={`${c} text-rose-700`} aria-hidden="true" />;
  return <Circle className={`${c} text-slate-400`} aria-hidden="true" />;
}

const STATE_WORD: Record<StepState, string> = {
  pending: "waiting",
  running: "running",
  awaiting_confirm: "needs your Confirm",
  done: "done",
  skipped: "skipped",
  refused: "refused",
  failed: "failed",
  stopped: "stopped",
};

function Switch({ id, label, checked, onChange, hint }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-start gap-2">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${checked ? "border-emerald-800 bg-emerald-700" : "border-slate-400 bg-slate-200 dark:bg-slate-700"} ${FOCUS}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
      <label htmlFor={id} className="text-sm text-foreground">
        <span className="font-semibold">{label}</span>
        {hint ? (
          <span id={`${id}-hint`} className="block text-xs text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </label>
    </div>
  );
}

/**
 * "You are on: …" for the Ask panel. Inside Council OS the pane is named by the menu's own words
 * (?tab=board → "Council OS › Leaderboard"); elsewhere the palette's breadcrumb for the path.
 */
export function askHere(location: string, search: string): string {
  const path = location.replace(/\/+$/, "") || "/";
  if (path === "/dashboard") {
    const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    if (q.get("view")) return "Council OS › A published page";
    const trail = menuTrail(q.get("tab") || "home");
    return ["Council OS", ...trail].join(" › ");
  }
  const here = crumbFor(location);
  return here ? `${here.crumb} › ${here.title}` : location;
}

export default function AskPane({ open, onClose, question, onReady, onQuestionTaken }: {
  open: boolean; onClose: () => void; question?: AskRequest | null;
  onReady?: (handle: TalkPanelHandle | null) => void; onQuestionTaken?: () => void;
}) {
  const [location] = useLocation();
  const search = useSearch();
  const talk = useRef<TalkPanelHandle>(null);
  const titleId = useId();
  const [prefs, setPrefs] = useState<Prefs>(() => readPrefs());
  const [agents, setAgents] = useState<boolean>(() => agentConsent());
  const [tab, setTab] = useState<"ask" | "steps" | "log">("ask");
  const [steps, setSteps] = useState<WatchStep[]>([]);
  const [watchIntent, setWatchIntent] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [narration, setNarration] = useState("");
  const [log, setLog] = useState<LogEntry[]>(() => readLog());
  const [undoable, setUndoable] = useState(false);
  const stopRef = useRef(false);
  const decide = useRef<((d: "confirm" | "skip" | "stop") => void) | null>(null);
  const pendingQuestion = useRef<AskRequest | null>(null);
  const seenQuestion = useRef<number | null>(null);
  const [answering, setAnswering] = useState(false);
  const [watchRequest, setWatchRequest] = useState(0);
  const watchRequests = useRef<ReturnType<typeof createWatchRequests> | null>(null);
  if (!watchRequests.current) watchRequests.current = createWatchRequests(() => setWatchRequest((n) => n + 1));
  const [queueNote, setQueueNote] = useState<string | null>(null);
  useEffect(() => { onReady?.(talk.current); return () => onReady?.(null); }, [onReady]);

  useEffect(() => subscribeLog((l) => { setLog(l); setUndoable(canUndo()); }), []);
  useEffect(() => writePrefs(prefs), [prefs]);
  useEffect(() => {
    if (agents) installAgentBridge();
  }, [agents]);

  // Ask the question the launcher or the palette handed over.
  useEffect(() => {
    if (question?.text && question.n !== seenQuestion.current) {
      seenQuestion.current = question.n;
      pendingQuestion.current = question;
    }
    const waiting = pendingQuestion.current;
    if (!waiting) return;
    setTab("ask");
    setCollapsed(false);
    if (takeAskRequest(pendingQuestion, talk.current)) {
      setQueueNote(null);
      onQuestionTaken?.();
    } else setQueueNote("Your question is kept here and will start when the current answer finishes.");
  }, [question, answering, onQuestionTaken]);

  // Esc closes (and stops a running watch); focus lands in the pane when it opens.
  const paneRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && paneRef.current?.contains(document.activeElement)) close();
    };
    document.addEventListener("keydown", onKey);
    const t = window.setTimeout(() => paneRef.current?.querySelector<HTMLInputElement>("#talk-input")?.focus(), 30);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const say = useCallback(
    (text: string) => {
      setNarration(text);
      if (prefs.voice && text) speakVoice(prepSpeech(text));
    },
    [prefs.voice],
  );

  const patch = (id: string, p: Partial<WatchStep>) => setSteps((all) => all.map((s) => (s.id === id ? { ...s, ...p } : s)));

  const stop = useCallback((why: "stopped" | "took_over" = "stopped") => {
    stopRef.current = true;
    decide.current?.("stop");
    stopVoice();
    clearHighlight();
    setSteps((all) => all.map((s) => (s.state === "pending" || s.state === "running" || s.state === "awaiting_confirm" ? { ...s, state: "stopped", detail: "Not run." } : s)));
    setRunning(false);
    logAction({ by: "you", stepId: "-", tool: "watch", args: {}, outcome: why, detail: why === "took_over" ? "You took over; the remaining steps were not run." : "Stopped; the remaining steps were not run." });
    setNarration(why === "took_over" ? "You have the page. Nothing else will move." : "Stopped. Nothing else will move.");
  }, []);

  const close = useCallback(() => {
    if (running) stop();
    stopVoice();
    onClose();
  }, [running, stop, onClose]);

  const takeOver = () => {
    stop("took_over");
    setCollapsed(true);
    onClose();
    window.setTimeout(() => document.getElementById("main-content")?.focus(), 30);
  };

  /** Run the frontend steps of a finished run, one at a time, visibly. */
  const runWatch = useCallback(
    async (run: TalkRun) => {
      const calls = run.ui.filter((u) => u.ended);
      if (!calls.length) return;
      stopRef.current = false;
      const list: WatchStep[] = calls.map((c) => ({ ...c, state: "pending", detail: "" }));
      setSteps(list);
      setWatchIntent(typeof (run.state.watch as Record<string, unknown> | undefined)?.intent === "string" ? String((run.state.watch as Record<string, unknown>).intent) : run.question);
      setRunning(true);
      setTab("steps");
      if (window.matchMedia?.("(max-width: 640px)").matches) setCollapsed(true);
      const results: { toolCallId: string; content: string; error?: string }[] = [];
      for (const s of list) {
        if (stopRef.current) break;
        patch(s.id, { state: "running" });
        say(s.say || s.tool);
        let confirmed = false;
        if (s.confirm) {
          patch(s.id, { state: "awaiting_confirm", detail: "Waiting for your Confirm. Nothing has happened yet." });
          setCollapsed(false);
          const d = await new Promise<"confirm" | "skip" | "stop">((res) => (decide.current = res));
          decide.current = null;
          if (d === "stop" || stopRef.current) break;
          if (d === "skip") {
            patch(s.id, { state: "skipped", detail: "You skipped it. Nothing was done." });
            logAction({ by: "you", stepId: s.id, tool: s.tool, args: s.args, outcome: "skipped", detail: "Skipped at Confirm." });
            results.push({ toolCallId: s.id, content: "skipped by the viewer" });
            continue;
          }
          confirmed = true;
          logAction({ by: "you", stepId: s.id, tool: s.tool, args: s.args, outcome: "confirmed", detail: `Confirmed a ${s.effect} step.` });
        }
        const out = await executeStep({ id: s.id, tool: s.tool, args: s.args, effect: s.effect, confirm: s.confirm }, { confirmed });
        if (stopRef.current) break;
        patch(s.id, { state: out.state, detail: out.detail });
        setUndoable(canUndo());
        setNarration(`${s.say ? `${s.say} ` : ""}${out.detail}`);
        results.push({ toolCallId: s.id, content: out.detail, ...(out.ok ? {} : { error: out.state }) });
        await sleep(reduceMotion() ? 50 : 650);
      }
      setRunning(false);
      if (!stopRef.current) setNarration("Done. Every step is in the log; Undo reverts the last one.");
      // AG-UI: report the frontend results back as tool messages (the run records them in /watch).
      if (results.length) streamRun({ question: "", toolResults: results, declareUi: true, onEvent: () => undefined }).catch(() => undefined);
    },
    [say],
  );

  const onRunDone = useCallback(
    (run: TalkRun) => {
      if (prefs.voice && run.text) {
        const voiceText = !run.tools.length && run.ui.length ? plannedPageReply(run.ui.length) : run.text;
        const first = voiceText.split(/\n{2,}/).slice(0, 2).join(". ");
        speakVoice(prepSpeech(first).slice(0, 600));
      }
      if (run.status === "done" && prefs.watch && run.ui.length) void runWatch(run);
    },
    [prefs.voice, prefs.watch, runWatch],
  );

  const enableWatchAndAsk = (run: TalkRun) => {
    setPrefs((p) => ({ ...p, watch: true }));
    watchRequests.current!.queue(run);
    setQueueNote("Your request to show this is kept until the current answer finishes.");
  };
  useEffect(() => {
    if (prefs.watch && watchRequests.current!.hasPending()) {
      if (watchRequests.current!.take(talk.current)) {
        setQueueNote(null);
      } else if (!watchRequests.current!.hasPending()) {
        setQueueNote("That earlier request is no longer available. Ask again to show it.");
      }
    }
  }, [prefs.watch, answering, watchRequest]);

  const here = askHere(location, search);
  const awaiting = steps.find((s) => s.state === "awaiting_confirm");

  return (
    <aside
      ref={paneRef}
      aria-labelledby={titleId}
      data-testid="ask-pane"
      hidden={!open}
      className={`fixed inset-x-0 bottom-0 z-[80] flex flex-col border-t border-border bg-background text-foreground shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] sm:border-l sm:border-t-0 ${collapsed ? "max-h-[40vh]" : "h-[85vh] sm:h-auto"}`}
    >
      <header className="flex items-start gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-base font-bold">
            Ask about the results
          </h2>
          <p className="truncate text-xs text-muted-foreground" data-testid="ask-breadcrumb">
            You are on: {here}
          </p>
        </div>
        {collapsed ? (
          <button type="button" onClick={() => setCollapsed(false)} className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold ${FOCUS}`}>
            Expand
          </button>
        ) : null}
        <button type="button" onClick={close} aria-label="Close Ask" className={`inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted ${FOCUS}`}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>

      {/* Stop / Undo / Take over: always on screen while watch mode runs. */}
      {running || awaiting ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-emerald-50 px-4 py-2 dark:bg-emerald-950" role="toolbar" aria-label="Watch controls" data-testid="watch-controls">
          <span className="mr-auto min-w-0 truncate text-xs font-semibold text-emerald-950 dark:text-emerald-50">
            Watching: {watchIntent}
          </span>
          <button type="button" onClick={() => stop()} className={`inline-flex min-h-11 items-center gap-1 rounded-lg bg-rose-800 px-3 text-sm font-semibold text-white hover:bg-rose-900 ${FOCUS}`} data-testid="watch-stop">
            <OctagonX className="h-4 w-4" aria-hidden="true" /> Stop
          </button>
          <button type="button" disabled={!undoable} onClick={() => { undoLast(); setUndoable(canUndo()); }} className={`inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-semibold disabled:opacity-60 ${FOCUS}`} data-testid="watch-undo">
            <Undo2 className="h-4 w-4" aria-hidden="true" /> Undo
          </button>
          <button type="button" onClick={takeOver} className={`inline-flex min-h-11 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-semibold ${FOCUS}`} data-testid="watch-takeover">
            <Hand className="h-4 w-4" aria-hidden="true" /> Take over
          </button>
        </div>
      ) : null}

      {awaiting ? (
        <div className="border-b border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-50" role="group" aria-label="Confirm this step" data-testid="watch-confirm">
          <p className="font-semibold">Needs your Confirm ({awaiting.effect}): {awaiting.say}</p>
          <p className="mt-1 text-xs">Confirm lets Ask do this one step on the page. It never pays, signs or submits; that stays yours.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => decide.current?.("confirm")} className={`min-h-11 rounded-lg bg-amber-800 px-4 text-sm font-semibold text-white hover:bg-amber-900 ${FOCUS}`}>
              Confirm
            </button>
            <button type="button" onClick={() => decide.current?.("skip")} className={`min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground ${FOCUS}`}>
              Skip
            </button>
          </div>
        </div>
      ) : null}

      <div className={`min-h-0 flex-1 overflow-y-auto px-4 py-3 ${collapsed ? "hidden" : ""}`}>
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground" data-testid="ask-rule-based">
          Answers come only from our published records, by fixed rules, never from an AI model.{" "}
          <a href="/ai-transparency" className="font-medium underline underline-offset-2">
            How this works
          </a>
        </p>

        <div className="mt-3 space-y-3">
          <Switch
            id="ask-watch"
            label="Let it move the page for me"
            checked={prefs.watch}
            onChange={(v) => {
              setPrefs((p) => ({ ...p, watch: v }));
              if (!v && running) stop();
            }}
            hint="Ask can scroll and open things on this page to show you. Off by default; Stop, Undo and Take over stay on screen."
          />
          <Switch
            id="ask-voice"
            label="Voice"
            checked={prefs.voice}
            onChange={(v) => {
              setPrefs((p) => ({ ...p, voice: v }));
              if (!v) stopVoice();
            }}
            hint="Speak answers and show a push-to-talk mic. Text is the default."
          />
          {prefs.voice ? (
            <p className="rounded-lg border border-amber-700/30 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950 dark:text-amber-50" data-testid="voice-privacy">
              {isListenSupported() ? LISTEN_PRIVACY_NOTE : "This browser has no speech recognition, so there is no mic; answers can still be spoken."}
            </p>
          ) : null}
        </div>

        <details className="mt-3 rounded-lg border border-border px-3" data-testid="ask-advanced">
          <summary className={`min-h-11 cursor-pointer py-3 text-sm font-semibold ${FOCUS}`}>Advanced</summary>
          <div className="space-y-3 pb-3">
            <OwmFreshness />
            <Switch
              id="ask-agents"
              label="Let an agent act in this tab"
              checked={agents}
              onChange={(v) => {
                setAgents(v);
                setAgentConsent(v);
              }}
              hint="An agent in this page (window.councilUi) may run the same view steps. Never commit, pay or schedule. Ends when you close the tab."
            />
          </div>
        </details>

        {queueNote ? <p role="status" className="mt-3 text-sm text-muted-foreground">{queueNote}</p> : null}
        <div role="tablist" aria-label="Ask views" className="mt-4 flex gap-1 border-b border-border">
          {(["ask", "steps", "log"] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`ask-tab-${t}`}
              aria-selected={tab === t}
              aria-controls={`ask-panel-${t}`}
              onClick={() => setTab(t)}
              className={`min-h-11 rounded-t-lg px-3 text-sm font-semibold ${tab === t ? "border-b-2 border-emerald-700 text-foreground" : "text-muted-foreground"} ${FOCUS}`}
            >
              {t === "ask" ? "Ask" : t === "steps" ? `Steps${steps.length ? ` (${steps.length})` : ""}` : `Log${log.length ? ` (${log.length})` : ""}`}
            </button>
          ))}
        </div>

        <div id="ask-panel-ask" role="tabpanel" aria-labelledby="ask-tab-ask" hidden={tab !== "ask"} className="pt-3">
          <TalkPanel
            ref={talk}
            page={pageContext}
            declareUi
            watch={prefs.watch}
            onRunDone={onRunDone}
            onBusyChange={setAnswering}
            onEnableWatch={enableWatchAndAsk}
            listen={prefs.voice}
          />
        </div>

        <div id="ask-panel-steps" role="tabpanel" aria-labelledby="ask-tab-steps" hidden={tab !== "steps"} className="pt-3" data-testid="watch-steps">
          {steps.length ? (
            <>
              <p className="text-sm font-semibold">{watchIntent}</p>
              <ol className="mt-2 space-y-2">
                {steps.map((s, i) => (
                  <li key={s.id} className={`flex gap-2 rounded-lg border p-2 text-sm ${s.state === "running" ? "border-emerald-700 bg-emerald-50 dark:bg-emerald-950" : "border-border"}`} data-state={s.state}>
                    <StepIcon s={s.state} />
                    <div className="min-w-0">
                      <p>
                        <span className="font-mono text-xs text-muted-foreground">
                          {i + 1}. {s.tool}
                        </span>{" "}
                        <span className="text-xs font-semibold">{STATE_WORD[s.state]}</span>
                      </p>
                      <p className="[overflow-wrap:anywhere]">{s.say}</p>
                      {s.detail ? <p className="text-xs text-muted-foreground">{s.detail}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground" data-testid="steps-empty">
              <p className="font-semibold text-foreground">No steps yet.</p>
              <p className="mt-1">
                Turn on &ldquo;Let it move the page for me&rdquo; and ask something like &ldquo;show me safety&rdquo;, &ldquo;walk me through it&rdquo; or &ldquo;re-check
                this&rdquo;. Each step appears here as it runs.
              </p>
            </div>
          )}
        </div>

        <div id="ask-panel-log" role="tabpanel" aria-labelledby="ask-tab-log" hidden={tab !== "log"} className="pt-3" data-testid="action-log">
          {log.length ? (
            <ol className="space-y-1 text-xs">
              {[...log].reverse().map((e, i) => (
                <li key={`${e.at}-${i}`} className="rounded border border-border p-2">
                  <span className="font-mono text-muted-foreground">{e.at.slice(11, 19)}Z</span> <span className="font-semibold">{e.by}</span> · {e.tool} ·{" "}
                  <span className="font-semibold">{e.outcome}</span>
                  <span className="block text-muted-foreground [overflow-wrap:anywhere]">{e.detail}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nothing has acted on this page yet. Every step, Confirm, Undo and Stop is written here, with who asked for it. The log stays
              in this tab only.
            </p>
          )}
        </div>
      </div>

      {collapsed && steps.length ? (
        <p className="px-4 py-2 text-sm" aria-hidden="true">
          {narration}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="watch-narration">
        {narration}
      </p>
    </aside>
  );
}
