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
import { ArrowUp, ExternalLink, Loader2, ShieldAlert, Wrench } from "lucide-react";
import {
  argsOf,
  challengeOf,
  newRun,
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
      className={`inline-flex max-w-full items-center rounded-full border px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide break-all ${TONE[toneOf(label)]}`}
      data-testid="talk-state"
    >
      {label}
    </span>
  );
}

/** Inline **bold**, `code` and _emphasis_, rendered as elements (never as HTML). */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\b_[^_]+_\b)/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : p.startsWith("`") && p.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 font-mono text-[0.85em] break-all">
            {p.slice(1, -1)}
          </code>
        ) : p.startsWith("_") && p.endsWith("_") && p.length > 2 ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
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

function ToolCard({ card }: { card: TalkToolCard }) {
  const args = argsOf(card);
  const argText = typeof args === "string" ? args : Object.keys(args).length ? JSON.stringify(args) : "no arguments";
  const cit = card.citation;
  return (
    <li className="rounded-xl border border-border bg-card p-3 shadow-sm" data-testid="talk-tool-card">
      <div className="flex flex-wrap items-center gap-2">
        <Wrench className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold text-foreground">{card.name}</span>
        {card.status === "running" ? (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin motion-reduce:animate-none" aria-hidden="true" /> calling
          </span>
        ) : (
          <StateLabel label={card.label} />
        )}
      </div>
      <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
        <span className="sr-only">arguments: </span>
        {argText}
      </p>
      {card.summary ? <p className="mt-2 text-sm text-foreground [overflow-wrap:anywhere]">{card.summary}</p> : null}
      {cit ? (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="talk-citation">
          <span className="font-medium text-foreground">Cited record: </span>
          <span className="font-mono break-all">{cit.record_id ?? "none named"}</span>
          {cit.url ? (
            <>
              {" · "}
              <a
                href={cit.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-0.5 break-all font-medium text-emerald-800 underline underline-offset-2 dark:text-emerald-300 ${FOCUS} rounded`}
              >
                {cit.url.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {card.label === "PAYMENT_REQUIRED" ? <ChallengeDetails output={card.output} /> : null}
    </li>
  );
}

function RunView({
  run,
  onConfirm,
  onCancel,
}: {
  run: TalkRun;
  onConfirm: (run: TalkRun) => void;
  onCancel: (run: TalkRun) => void;
}) {
  return (
    <article className="space-y-3" aria-label={`Question: ${run.question}`} data-testid="talk-run">
      <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-emerald-800 px-3 py-2 text-sm text-white [overflow-wrap:anywhere] dark:bg-emerald-700">
        {run.question}
      </p>
      {run.tools.length ? (
        <ul className="space-y-2" aria-label="Tools called">
          {run.tools.map((t) => (
            <ToolCard key={t.id} card={t} />
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
      {run.status === "cancelled" ? <p className="text-sm text-muted-foreground">Cancelled. Nothing was called.</p> : null}
      {run.text ? (
        <div className="rounded-xl border border-border bg-card p-3" data-testid="talk-answer">
          <AnswerText text={run.text} />
        </div>
      ) : run.status === "streaming" ? (
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Asking the tools…
        </p>
      ) : null}
      {run.status === "error" ? (
        <p className="rounded-lg border border-rose-700/30 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-400/40 dark:bg-rose-950 dark:text-rose-100" role="alert">
          No answer: {run.error}. No number is shown in its place.
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
};

const TalkPanel = forwardRef<TalkPanelHandle, Props>(function TalkPanel({ variant = "standalone", labelledBy, className = "" }, ref) {
  const [runs, setRuns] = useState<TalkRun[]>([]);
  const [q, setQ] = useState("");
  const [announce, setAnnounce] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);
  const busy = runs.some((r) => r.status === "streaming");

  useEffect(() => () => abortRef.current?.abort(), []);

  const update = useCallback((id: string, fn: (r: TalkRun) => TalkRun) => {
    setRuns((all) => all.map((r) => (r.id === id ? fn(r) : r)));
  }, []);

  const start = useCallback(
    (question: string, confirmTool?: string[]) => {
      const text = question.trim();
      if (!text) return;
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      const id = `run-${++seq.current}`;
      setRuns((all) => [...all.slice(-9), newRun(text, id)]);
      setAnnounce(`Asking: ${text}`);
      let final: TalkRun = newRun(text, id);
      streamRun({
        question: text,
        confirmTool,
        signal: ctl.signal,
        onEvent: (ev) => {
          final = reduceRun(final, ev);
          update(id, (r) => reduceRun(r, ev));
        },
      })
        .then(() => {
          // A stream that closed without RUN_FINISHED is reported as such, not as success.
          if (final.status === "streaming") {
            update(id, (r) => ({ ...r, status: "error", error: "the stream closed before the run finished" }));
            setAnnounce("The answer stream closed early.");
            return;
          }
          const labels = final.tools.map((t) => `${t.name}: ${t.label ?? "no state"}`).join("; ");
          setAnnounce(
            final.status === "awaiting_confirmation"
              ? "A paid tool needs your confirmation. Nothing has been called."
              : final.status === "error"
                ? `No answer: ${final.error ?? "the run failed"}`
                : `Answer ready. ${labels}`,
          );
        })
        .catch((e: unknown) => {
          if (ctl.signal.aborted) return;
          const msg = e instanceof Error ? e.message : String(e);
          update(id, (r) => ({ ...r, status: "error", error: `the tools could not be reached (${msg})` }));
          setAnnounce("No answer: the tools could not be reached.");
        });
    },
    [update],
  );

  useImperativeHandle(ref, () => ({ ask: (question: string) => start(question) }), [start]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [runs.length]);

  const confirm = (run: TalkRun) => {
    const tools = run.confirm?.tools.map((t) => t.tool) ?? [];
    update(run.id, (r) => ({ ...r, status: "done", confirm: null }));
    start(run.question, tools);
  };
  const cancel = (run: TalkRun) => {
    update(run.id, (r) => ({ ...r, status: "cancelled", confirm: null }));
    setAnnounce("Cancelled. Nothing was called.");
  };

  return (
    <section className={`min-w-0 ${className}`} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : "Ask in words"} data-testid="talk-panel">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" id="talk-suggest-h">
          Try a question
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

      {runs.length ? (
        <div className="mt-5 space-y-6" data-testid="talk-transcript">
          {runs.map((r) => (
            <RunView key={r.id} run={r} onConfirm={confirm} onCancel={cancel} />
          ))}
          <div ref={endRef} />
        </div>
      ) : null}

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
      <p className="mt-3 text-xs text-muted-foreground">
        Answers are fields of the named tools&apos; output, the same tools POST /mcp serves. No model writes them. Measurement, not
        certification; paid tools never run without your click, and never pay.
      </p>
    </section>
  );
});

export default TalkPanel;
