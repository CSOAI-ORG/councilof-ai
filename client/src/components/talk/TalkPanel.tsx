/**
 * TalkPanel — ask Council of AI a question in words and watch it answer from its own tools.
 *
 * It consumes POST /api/agui/run (AG-UI events over SSE; see lib/aguiTalk.ts). Every tool the
 * router calls renders as a small card: the tool's name, the arguments it was called with, the
 * record it cites (id + URL) and the state word the tool itself returned (MEASURED, UNMEASURED,
 * VALID, NOT_MEASURED, PAYMENT_REQUIRED ...). The answer text follows, as streamed.
 *
 * PAID ACTIONS. When the router plans a paid (x402) tool the server does not call it; it sends
 * confirm_required. This panel shows that request with an explicit Confirm and Cancel. Confirm
 * re-sends the question with forwardedProps.confirm naming the tool, and the tool can then only
 * answer with its 402 challenge, which is shown verbatim (resource, network, asset, pay-to and the
 * amount in the challenge's own atomic units). Nothing is paid from this page: payment, if the
 * reader chooses to make it, comes from their own wallet, outside this panel.
 */
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, Loader2, Mic, MicOff, ShieldAlert, Eye } from "lucide-react";
import { useSearch } from "wouter";
import CompanyCasePanel, { type CompanyCaseVerifiedCallback } from "./CompanyCasePanel";
import ConnectedCompanyCasePanel from "./ConnectedCompanyCasePanel";
import { companyWorkspaceSelection, type CompanyCaseConnection } from "./companyCaseModel";
import ResultCard from "@/components/talk/ResultCard";
import ResultFollowUp from "@/components/talk/ResultFollowUp";
import Inline from "@/components/talk/TalkInline";
import { answerSections, checkedLine, chipFor, firstSentence, plainAnswer, statTiles, toolTitle, verifyLink } from "@/lib/resultCard";
import type { PageContext } from "../../../../functions/_lib/uiTools";
import { LISTEN_PRIVACY_NOTE, isListenSupported, startListening, stopListening } from "@/lib/councilListen";
import { stopVoice } from "@/lib/councilVoice";
import {
  argsOf,
  challengeOf,
  newRun,
  interruptRun,
  lineageIdentity,
  observationTimeOf,
  reduceRun,
  streamRun,
  TALK_SUGGESTIONS,
  toneOf,
  type TalkRun,
  type TalkToolCard,
  type Tone,
} from "@/lib/aguiTalk";

export type TalkPanelHandle = { ask: (question: string) => void };

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const TONE: Record<Tone, string> = {
  measured: "border-emerald-700/30 bg-emerald-50 text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-950 dark:text-emerald-100",
  unmeasured: "border-slate-400/50 bg-slate-100 text-slate-800 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-100",
  payment: "border-amber-700/30 bg-amber-50 text-amber-900 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-100",
  problem: "border-rose-700/30 bg-rose-50 text-rose-900 dark:border-rose-400/40 dark:bg-rose-950 dark:text-rose-100",
  neutral: "border-border bg-muted text-foreground",
};

function StateLabel({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 font-mono text-xs font-bold uppercase tracking-wide break-all ${TONE[toneOf(label)]}`}
      data-testid="talk-state"
    >
      {label}
    </span>
  );
}

function AnswerText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-3 text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        const items = lines.filter((l) => l.startsWith("- "));
        const head = lines.filter((l) => !l.startsWith("- "));
        return (
          <div key={i}>
            {head.map((l, j) => (
              <p key={j}>
                <Inline text={l} />
              </p>
            ))}
            {items.length ? (
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {items.map((l, j) => (
                  <li key={j}>
                    <Inline text={l.slice(2)} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ChallengeDetails({ output }: { output: unknown }) {
  const c = challengeOf(output);
  if (!c) return null;
  return (
    <div className="mt-2 rounded-lg border border-amber-700/25 bg-amber-50/60 p-3 text-xs text-amber-950 dark:border-amber-400/30 dark:bg-amber-950/50 dark:text-amber-50" data-testid="talk-challenge">
      <p className="font-semibold">402 challenge (nothing was paid)</p>
      <p className="mt-1">
        This is the tool&apos;s payment challenge, shown as the tool returned it. This page never pays. If you choose to pay, it
        comes from your own wallet, outside this page.
      </p>
      <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
        {c.resource ? (
          <>
            <dt className="font-medium">resource</dt>
            <dd className="break-all font-mono">{c.resource}</dd>
          </>
        ) : null}
        {c.accepts.map((a, i) => (
          <div key={i} className="contents">
            {a.scheme ? (<><dt className="font-medium">scheme</dt><dd className="font-mono">{a.scheme}</dd></>) : null}
            {a.network ? (<><dt className="font-medium">network</dt><dd className="break-all font-mono">{a.network}</dd></>) : null}
            {a.asset ? (<><dt className="font-medium">asset</dt><dd className="break-all font-mono">{a.asset}{a.symbol ? ` (${a.symbol})` : ""}</dd></>) : null}
            {a.payTo ? (<><dt className="font-medium">pay to</dt><dd className="break-all font-mono">{a.payTo}</dd></>) : null}
            {a.amountAtomic ? (<><dt className="font-medium">amount</dt><dd className="break-all font-mono">{a.amountAtomic} (atomic units, as the challenge states)</dd></>) : null}
          </div>
        ))}
      </dl>
      {c.description ? <p className="mt-2 [overflow-wrap:anywhere]">{c.description}</p> : null}
    </div>
  );
}

function ToolCard({ card, answer }: { card: TalkToolCard; answer?: string }) {
  const args = argsOf(card);
  const argText = typeof args === "string" ? args : Object.keys(args).length ? JSON.stringify(args) : "no arguments";
  const cit = card.citation;
  const { chip, toolWord } = chipFor(card.name, card.label);
  return (
    <ResultCard
      title={toolTitle(card.name)}
      tool={card.name}
      label={chip}
      toolWord={toolWord}
      running={card.status === "running"}
      tiles={statTiles(card.output, 4, card.name)}
      checked={checkedLine(card.name, card.output)}
      verifyUrl={verifyLink(card.name, card.output, cit?.record_id, cit?.url)}
      recordId={cit?.record_id ?? null}
      summary={card.summary}
      answer={answer ? <AnswerText text={answer} /> : undefined}
      args={argText}
      raw={card.output ?? undefined}
    >
      {card.status === "unknown" ? <p className="mt-2 text-sm text-muted-foreground">Tool outcome unknown: the connection ended before its result arrived.</p> : null}
      {card.label === "PAYMENT_REQUIRED" ? <ChallengeDetails output={card.output} /> : null}
    </ResultCard>
  );
}

/** This card's part of the streamed answer (its own "**tool** →" block plus the shared lines). */
function sectionFor(run: TalkRun, tool: string, index: number): string | undefined {
  if (!run.text) return undefined;
  const { byTool, shared } = answerSections(run.text);
  const own = byTool[tool];
  if (own) return shared ? `${own}\n\n${shared}` : own;
  // An answer with no per-tool blocks belongs to the first card only, never repeated.
  return index === 0 && !Object.keys(byTool).length ? run.text : undefined;
}

/**
 * The one sentence under a run's cards. A tool with a plain sentence (resultCard.plainAnswer) gets
 * it, built from the same fields as its tiles, so the sentence and the tiles agree (tools audit
 * retest, 6 Oct 2026: the x402 card printed 15 in a tile and 16 in this line). Otherwise the
 * answer's own first sentence.
 */
export function faceSentence(run: Pick<TalkRun, "text" | "tools">): string {
  const plain = run.tools
    .filter((t) => t.status !== "running")
    .map((t) => plainAnswer(t.name, t.output))
    .filter((x): x is string => Boolean(x));
  if (plain.length) return plain.slice(0, 2).join(" ");
  return firstSentence(run.text) || (run.tools.length ? "See the card above." : run.text);
}

const asRecord = (v: unknown): Record<string, unknown> | null => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : null;
const scalar = (v: unknown): string | null => typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : null;
function timeLabel(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "Unknown";
  if (typeof value === "number") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return String(value);
}
function evidenceHref(value: string): string | null {
  try {
    if (!/^https?:\/\//i.test(value) && !(value.startsWith("/") && !value.startsWith("//"))) return null;
    const url = new URL(value, "https://councilof.ai");
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || [...url.searchParams.keys()].some(key => /^(access_token|api_key|token|password|secret|authorization)$/i.test(key))) return null;
    return value.startsWith("/") && !value.startsWith("//") ? value : url.href;
  } catch { return null; }
}
function evidenceFields(tool: TalkToolCard) {
  const output = asRecord(tool.output) ?? {};
  const links = [{ label: "Source", value: tool.citation?.url ?? null }];
  for (const [label, key] of [["Source", "source_url"], ["Source", "source"], ["Receipt", "receipt_url"], ["Receipt", "receipt"], ["Verify", "verify_url"], ["Verify", "verification_url"]] as const) {
    const value = scalar(output[key]) ?? scalar(asRecord(output[key])?.url);
    if (value && !links.some(link => link.value === value)) links.push({ label, value });
  }
  const lineage = asRecord(output.lineage) ?? output;
  return {
    observed: observationTimeOf(output),
    links: links.filter((link): link is { label: string; value: string } => Boolean(link.value)),
    lineage: ["supersedes", "superseded_by", "retest_of", "correction_of"].flatMap(key => {
      const value = lineageIdentity(lineage[key]);
      return value === null ? [] : [{ key, value }];
    }),
  };
}
function statusText(run: TalkRun): string {
  switch (run.status) {
    case "streaming": return "Receiving live progress";
    case "awaiting_confirmation": return "Waiting for permission; the paid tool has not been called";
    case "approved": return "Permission granted; execution is tracked in the next run";
    case "stop_requested": return "Stopped reading; executor stop is unconfirmed";
    case "interrupted": return "Connection or run interrupted; incomplete tool outcomes remain unknown";
    case "cancelled": return run.cancellationSource === "executor" ? "Executor reported cancellation" : "Permission declined; no tool was called";
    case "error": return "Operational error; inspect the retained results";
    default: return "Run finished; each result keeps its own evidence state";
  }
}
function RunTrace({ run, onStop }: { run: TalkRun; onStop: (run: TalkRun) => void }) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground" data-testid="talk-run-status">
        <p role="status">{statusText(run)}</p>
        {run.status === "streaming" ? <button type="button" onClick={() => onStop(run)} className={"min-h-11 rounded-lg border border-border px-3 font-medium " + FOCUS}>Stop reading</button> : null}
      </div>
      <details className="min-w-0 rounded-xl border border-border bg-card p-3 text-xs [overflow-wrap:anywhere]" data-testid="talk-run-evidence">
        <summary className={"min-h-11 cursor-pointer py-2 text-sm font-semibold " + FOCUS}>Run details and evidence</summary>
        <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2">
          <dt>Server run</dt><dd className="break-all font-mono">{run.runId ?? "Unknown"}</dd>
          <dt>Thread</dt><dd className="break-all font-mono">{run.threadId ?? "Unknown"}</dd>
          <dt>Route</dt><dd>{run.route ?? "Not reported"}</dd>
          <dt>Started</dt><dd data-event-time={run.startedAt ?? undefined}>{timeLabel(run.startedAt)}</dd>
          <dt>Last event</dt><dd data-testid="talk-last-event" data-event-time={run.lastEventAt ?? undefined}>{timeLabel(run.lastEventAt)}</dd>
          <dt>Reported cost</dt><dd>{scalar(run.result?.cost) ?? "Unknown"}</dd>
        </dl>
        {run.trace?.length ? <ol className="mt-3 space-y-1" aria-label="Received run events">
          {run.trace.map((event, index) => <li key={event.id ?? index} className="rounded-md bg-muted p-2">
            <span>{event.type}</span>{event.toolId ? <span className="ml-2 break-all font-mono">{event.toolId}</span> : null}
            <span className="block text-muted-foreground">{timeLabel(event.time)}{event.id ? " · " + event.id : ""}</span>
          </li>)}
        </ol> : null}
        {run.tools.map(tool => {
          const detail = evidenceFields(tool);
          return <section key={tool.id} className="mt-3 space-y-1" aria-label={"Evidence from " + tool.name}>
            <p className="font-semibold">{tool.name} · {tool.label ?? "No evidence state returned"}</p>
            <p>Observation time: {detail.observed ?? "Unknown"}</p>
            {detail.links.map(link => {
              const href = evidenceHref(link.value);
              return href ? <a key={link.label + link.value} href={href} target="_blank" rel="noreferrer" className={"mr-4 inline-flex min-h-11 items-center underline " + FOCUS}>{link.label}</a> : null;
            })}
            {detail.lineage.map(item => {
              const href = evidenceHref(item.value);
              return <p key={item.key}>{item.key}: {href && /^https?:|^\//.test(item.value) ? <a href={href} rel="noreferrer" target="_blank" className="underline">{item.value}</a> : item.value}</p>;
            })}
          </section>;
        })}
        <p className="mt-3 text-muted-foreground">Times and identifiers come from received events. Missing values remain unknown. This view does not verify a signature or replay disconnected actions. History here lasts only while this view stays open.</p>
      </details>
    </div>
  );
}

function RunView({
  run,
  onConfirm,
  onCancel,
  onStop,
  onEnableWatch,
  onEdit,
}: {
  run: TalkRun;
  onConfirm: (run: TalkRun) => void;
  onCancel: (run: TalkRun) => void;
  onStop: (run: TalkRun) => void;
  onEnableWatch?: (run: TalkRun) => void;
  onEdit?: (question: string) => void;
}) {
  return (
    <article id={`talk-${run.id}`} className="scroll-mt-4 space-y-3" aria-label={`Question: ${run.question}`} data-testid="talk-run">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-800 px-3 py-2 text-sm text-white [overflow-wrap:anywhere] dark:bg-emerald-700">
        {run.question}
      </p>
      <RunTrace run={run} onStop={onStop} />
      {run.tools.length ? (
        <ul className="space-y-2" aria-label="Tools called">
          {run.tools.map((t, i) => (
            <ToolCard key={t.id} card={t} answer={sectionFor(run, t.name, i)} />
          ))}
        </ul>
      ) : null}
      {run.confirm && run.status === "awaiting_confirmation" ? (
        <div className="rounded-xl border border-amber-700/30 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-950 dark:text-amber-50" role="group" aria-label="Confirm a paid tool" data-testid="talk-confirm">
          <p className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" /> A paid (x402) tool is needed. It has not been called.
          </p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {run.confirm.tools.map((t) => (
              <li key={t.tool} className="break-all">
                {t.tool} {JSON.stringify(t.args)}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Confirm fetches the tool&apos;s 402 payment challenge and shows it here. Nothing is paid or signed by this page; payment,
            if you choose to make it, comes from your own wallet.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onConfirm(run)} className={`min-h-11 rounded-lg bg-amber-800 px-4 text-sm font-semibold text-white hover:bg-amber-900 ${FOCUS}`}>
              Confirm: fetch the 402 challenge
            </button>
            <button type="button" onClick={() => onCancel(run)} className={`min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted ${FOCUS}`}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      {run.status === "cancelled" ? <p className="text-sm text-muted-foreground">{statusText(run)}</p> : null}
      {run.consentRequired && onEnableWatch ? (
        <div className="rounded-xl border border-border bg-muted p-3 text-sm text-foreground" data-testid="talk-consent" role="group" aria-label="Moving the page is switched off">
          <p className="flex items-center gap-2 font-semibold">
            <Eye className="h-4 w-4 shrink-0" aria-hidden="true" /> I can show you this on the page ({run.consentRequired.steps} step
            {run.consentRequired.steps === 1 ? "" : "s"}), but moving the page is switched off.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Nothing on the page moved. Switch on &ldquo;Let it move the page for me&rdquo; and it will; you can stop or undo any step.</p>
          <button type="button" onClick={() => onEnableWatch(run)} className={`mt-2 min-h-11 rounded-lg border border-emerald-800/40 bg-card px-4 text-sm font-semibold text-emerald-900 hover:bg-emerald-50 dark:text-emerald-100 dark:hover:bg-emerald-950 ${FOCUS}`}>
            Switch it on and show me
          </button>
        </div>
      ) : null}
      {run.text ? (
        // The face keeps one sentence. Every field of the answer is inside each card's
        // "Details and raw output" expander (owner brief: no field dump after an answer).
        <div className="rounded-xl border border-border bg-card p-3" data-testid="talk-answer">
          <p className="text-sm leading-relaxed text-foreground [overflow-wrap:anywhere]">
            {faceSentence(run)}
          </p>
          {run.tools.length ? null : (
            <details className="mt-2 text-sm">
              <summary className={`min-h-11 cursor-pointer list-none py-2 font-medium text-muted-foreground hover:text-foreground ${FOCUS}`}>
                Full answer
              </summary>
              <AnswerText text={run.text} />
            </details>
          )}
        </div>
      ) : run.status === "streaming" ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Asking the tools…
        </p>
      ) : null}
      {run.status === "done" && run.tools.length > 0 && run.tools.every((tool) => tool.status === "done") && onEdit ? <ResultFollowUp run={run} onEdit={onEdit} /> : null}
      {run.status === "error" || run.status === "interrupted" ? (
        <p className="rounded-lg border border-rose-700/30 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-400/40 dark:bg-rose-950 dark:text-rose-100" role="alert">
          {run.error ?? "The stream ended without a supported result."} Retained evidence keeps its own state.
        </p>
      ) : null}
    </article>
  );
}

type Props = {
  /** "dock": the page supplies the input (the dashboard's composer); "standalone": the panel has its own. */
  variant?: "dock" | "standalone";
  /** Heading id for aria-labelledby, when the host renders one. */
  labelledBy?: string;
  className?: string;
  /** Where the reader is, read at ask time (forwardedProps.page). */
  page?: () => PageContext;
  /** Declare the watch-mode frontend tools so a run can plan page moves. */
  declareUi?: boolean;
  /** The viewer switched watch on in this tab: send watch consent. */
  watch?: boolean;
  /** Called once per run when it finishes (the watch executor takes its ui steps from here). */
  onRunDone?: (run: TalkRun) => void;
  /** Offered when a run would have moved the page but watch was off. */
  onEnableWatch?: (run: TalkRun) => void;
  /** Show the push-to-talk mic (opt-in voice input). */
  listen?: boolean;
  /** Hide the built-in suggestions (the host shows its own). */
  hideSuggestions?: boolean;
  /** Injected owner-authenticated company adapter; never a public-lookup fallback. */
  company?: CompanyCaseConnection;
  onCaseVerified?: CompanyCaseVerifiedCallback;
};

const PublicTalkPanel = forwardRef<TalkPanelHandle, Props>(function PublicTalkPanel(
  { variant = "standalone", labelledBy, className = "", page, declareUi, watch, onRunDone, onEnableWatch, listen, hideSuggestions },
  ref,
) {
  const [runs, setRuns] = useState<TalkRun[]>([]);
  const [q, setQ] = useState("");
  const [announce, setAnnounce] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const seq = useRef(0);
  const threadRef = useRef<string | null>(null);
  const busy = runs.some((r) => r.status === "streaming");
  const [hearing, setHearing] = useState(false);
  const [micNote, setMicNote] = useState<string | null>(null);
  const micRef = useRef<AbortController | null>(null);
  const micActive = useRef(false);
  const micAllowed = useRef(listen === true);
  micAllowed.current = listen === true;
  const opts = useRef({ page, declareUi, watch, onRunDone });
  opts.current = { page, declareUi, watch, onRunDone };
  useEffect(() => {
    if (!listen) {
      const microphone = micRef.current;
      micRef.current = null;
      micActive.current = false;
      microphone?.abort();
      setHearing(false);
    }
    return () => {
      const microphone = micRef.current;
      micRef.current = null;
      micActive.current = false;
      microphone?.abort();
    };
  }, [listen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const update = useCallback((id: string, fn: (r: TalkRun) => TalkRun) => {
    setRuns((all) => all.map((r) => (r.id === id ? fn(r) : r)));
  }, []);

  const start = useCallback(
    (question: string, confirmTool?: string[], threadId?: string) => {
      const text = question.trim();
      if (!text) return;
      const microphone = micRef.current;
      micRef.current = null;
      micActive.current = false;
      microphone?.abort();
      setHearing(false);
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      const id = `run-${++seq.current}`;
      const sessionThread = threadId ?? threadRef.current ?? "web-" + crypto.randomUUID();
      threadRef.current = sessionThread;
      setRuns((all) => [...all.slice(-9).map(run => run.status === "streaming" ? interruptRun(run, "stop_requested") : run), newRun(text, id)]);
      setAnnounce(`Asking: ${text}`);
      let final: TalkRun = newRun(text, id);
      const o = opts.current;
      streamRun({
        question: text,
        threadId: sessionThread,
        confirmTool,
        page: o.page?.(),
        declareUi: o.declareUi,
        watch: o.watch,
        signal: ctl.signal,
        onEvent: (ev) => {
          if (ctl.signal.aborted || id !== "run-" + seq.current) return;
          if (ev.type === "RUN_STARTED" && typeof ev.threadId === "string") threadRef.current = ev.threadId;
          final = reduceRun(final, ev);
          update(id, (r) => reduceRun(r, ev));
        },
      })
        .then(() => {
          if (ctl.signal.aborted || id !== "run-" + seq.current) return;
          // A stream that closed without RUN_FINISHED is reported as such, not as success.
          if (final.status === "streaming") {
            update(id, (r) => interruptRun(r, "interrupted", "the stream closed before the run finished"));
            setAnnounce("The answer stream closed early.");
            return;
          }
          if (final.status === "done") opts.current.onRunDone?.(final);
          const labels = final.tools.map((t) => `${t.name}: ${t.label ?? "no state"}`).join("; ");
          setAnnounce(
            final.status === "done" && final.result?.grounded === true && final.tools.every(tool => tool.status === "done")
              ? "Answer ready. " + labels
              : statusText(final) + (labels ? ". " + labels : ""),
          );
        })
        .catch((e: unknown) => {
          if (ctl.signal.aborted) return;
          const msg = e instanceof Error ? e.message : String(e);
          update(id, (r) => interruptRun(r, "interrupted", msg));
          if (id === "run-" + seq.current) setAnnounce("The answer stream was interrupted. Executor state is unknown.");
        });
    },
    [update],
  );

  useImperativeHandle(ref, () => ({ ask: (question: string) => start(question) }), [start]);

  const mic = () => {
    if (!micAllowed.current) return;
    if (micRef.current && micActive.current) {
      stopListening({ signal: micRef.current.signal });
      return;
    }
    micRef.current?.abort();
    const controller = new AbortController();
    micRef.current = controller;
    micActive.current = true;
    const owned = () => micAllowed.current && micRef.current === controller && !controller.signal.aborted;
    setMicNote(null);
    stopVoice();
    const started = startListening({
      signal: controller.signal,
      onStart: () => { if (owned()) setHearing(true); },
      onEnd: () => { if (owned()) { micActive.current = false; setHearing(false); } },
      onError: message => { if (owned()) setMicNote(message); },
      onTranscript: (text, isFinal) => {
        if (!owned()) return;
        setQ(text);
        if (isFinal) setAnnounce("Voice draft ready. Review it before sending. Nothing has been sent.");
      },
    });
    if (!started && owned()) { micActive.current = false; setHearing(false); }
  };

  // Bring the newest question to the top of the view when it is asked, so its tool cards and
  // answer stream in below it instead of off-screen under the suggestions.
  const lastId = runs[runs.length - 1]?.id;
  useEffect(() => {
    if (!lastId) return;
    const el = document.getElementById(`talk-${lastId}`);
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [lastId]);

  const confirm = (run: TalkRun) => {
    const tools = run.confirm?.tools.map((t) => t.tool) ?? [];
    update(run.id, (r) => ({ ...r, status: "approved", confirm: null }));
    start(run.question, tools, run.threadId ?? undefined);
  };
  const cancel = (run: TalkRun) => {
    if (run.status !== "awaiting_confirmation") return;
    update(run.id, (r) => ({ ...r, status: "cancelled", cancellationSource: "permission", confirm: null }));
    setAnnounce("Cancelled. Nothing was called.");
  };

  const stop = (run: TalkRun) => {
    if (run.status !== "streaming") return;
    abortRef.current?.abort();
    update(run.id, current => interruptRun(current, "stop_requested"));
    setAnnounce("Stopped reading. Executor stop is unconfirmed.");
  };

  return (
    <section className={`min-w-0 ${className}`} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : "Ask in words"} data-testid="talk-panel">
      {runs.length ? (
        <div className="space-y-6" data-testid="talk-transcript">
          {runs.map((r) => (
            <RunView key={r.id} run={r} onConfirm={confirm} onCancel={cancel} onStop={stop} onEnableWatch={onEnableWatch} onEdit={variant === "standalone" ? (question) => {
              setQ(question);
              setAnnounce("Question ready to edit. Nothing has been run.");
              window.setTimeout(() => document.getElementById("talk-input")?.focus(), 0);
            } : undefined} />
          ))}
        </div>
      ) : null}

      <div className={`${runs.length ? "mt-6" : ""} ${hideSuggestions ? "hidden" : ""}`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" id="talk-suggest-h">
          {runs.length ? "Try another question" : "Try a question"}
        </p>
        <ul className="mt-2 flex flex-wrap gap-2" aria-labelledby="talk-suggest-h">
          {TALK_SUGGESTIONS.map((s) => (
            <li key={s.text}>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(s.text)}
                className={`min-h-11 rounded-full border border-emerald-800/25 bg-card px-3 py-2 text-left text-sm font-medium text-emerald-900 shadow-sm hover:border-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:border-emerald-400/40 dark:text-emerald-100 dark:hover:bg-emerald-950 ${FOCUS}`}
                data-testid="talk-suggestion"
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="talk-live">
        {announce}
      </p>

      {variant === "standalone" ? (
        <form
          className="mt-5 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (busy) return;
            const text = q;
            setQ("");
            start(text);
          }}
        >
          <label htmlFor="talk-input" className="sr-only">
            Your question
          </label>
          <input
            id="talk-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask about the board, an axis, a card id or a server"
            autoComplete="off"
            className={`min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground sm:text-sm ${FOCUS}`}
          />
          {listen && isListenSupported() ? (
            <button
              type="button"
              onClick={mic}
              aria-pressed={hearing}
              aria-label={hearing ? "Stop listening" : "Speak your question"}
              aria-describedby="talk-mic-note"
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted ${FOCUS}`}
              data-testid="talk-mic"
            >
              {hearing ? <MicOff className="h-4 w-4" aria-hidden="true" /> : <Mic className="h-4 w-4" aria-hidden="true" />}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={busy || !q.trim()}
            aria-label="Ask"
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-white hover:bg-emerald-900 disabled:opacity-50 ${FOCUS}`}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ArrowUp className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>
      ) : null}
      {listen && variant === "standalone" ? (
        <p id="talk-mic-note" className="mt-2 text-xs text-muted-foreground" data-testid="talk-mic-note">
          {micNote ? <span className="font-semibold text-foreground">{micNote} </span> : null}
          {isListenSupported() ? LISTEN_PRIVACY_NOTE : "This browser has no speech recognition; typing works everywhere."} Your speech stays in the text field until you send it.
        </p>
      ) : null}
      <p
        className="mt-3 text-xs text-muted-foreground"
        title="Each answer quotes fields of the named tool's output: the same tools POST /mcp serves to agents."
      >
        Every answer quotes a published record or a live read, and names its source. No AI writes them. A measurement, not a certificate;
        nothing paid runs without your click, and this panel never pays.
      </p>
    </section>
  );
});

/** The explicit company workspace selects a separate authorized request path and one composer. */
const TalkPanel = forwardRef<TalkPanelHandle, Props>(function TalkPanel(props, ref) {
  const search = useSearch();
  const company = companyWorkspaceSelection(search);
  if (company.enabled) {
    const companyProps = {
      caseId: company.caseId,
      invalidCase: company.invalidCase,
      variant: props.variant,
      labelledBy: props.labelledBy,
      className: props.className,
      listen: props.listen,
      onCaseVerified: props.onCaseVerified,
    };
    return props.company
      ? <CompanyCasePanel {...companyProps} ref={ref} connection={props.company} />
      : <ConnectedCompanyCasePanel {...companyProps} ref={ref} />;
  }
  return <PublicTalkPanel {...props} ref={ref} />;
});

export default TalkPanel;
