/**
 * GetResults — the first screen of Council OS (owner brief, 1 Oct 2026: RaaS, not a reading room).
 *
 * One input — a model, a server address or a signed record id — then four plain choices, in the
 * order a stranger meets them:
 *   - See what we already know (free, read live);
 *   - Request a fresh run (terms first, from your own wallet; invoiced work is arranged by email;
 *     a receipt and a place in the public queue; paying never buys a result, and no date is promised);
 *   - Track a request (My results: status by receipt, the signed results once published, a free check);
 *   - Re-check every month (a watch request a person reviews; nothing is charged by asking).
 * Reader test, 6 Oct 2026: the earlier strip of five numbered steps ("Queued job", "Fresh run" ...)
 * read like an internal pipeline, so the steps are choices with plain names and no numbers. The
 * protocol words (x402, receipt hash, MCP) live in title tooltips, not on the face of the card.
 *
 * Step one for a server or a record goes to the same free tools /mcp serves (the AG-UI TalkPanel,
 * via onAsk). For a model it reads /interop/models-measured.json, and dates the answer from the
 * newest signed run in /interop/pod-cards-index.json. Nothing is typed in; a failed read says so.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useSearch } from "wouter";
import { ArrowRight, BellRing, ClipboardList, ExternalLink, Search, Sparkles, Zap } from "lucide-react";
import ResultCard from "@/components/talk/ResultCard";
import {
  FRESH_RUN_DOCTRINE,
  classifySubject,
  freeQuestion,
  matchModels,
  modelAnchor,
  modelVerifyHref,
  newestSignedRun,
  type ModelRow,
  type PodCardRow,
  type SubjectKind,
} from "@/lib/resultCard";
import { addMyResult } from "@/lib/myResults";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const ACTION = `inline-flex min-h-11 items-center gap-1 text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`;

const KIND_WORD: Record<Exclude<SubjectKind, "empty">, string> = {
  model: "an AI model",
  server: "a server or web address",
  record: "a published result (record id)",
};

const EXAMPLES = ["github.com", "qwen3:8b", "https://councilof.ai/mcp"];

type ModelsRead = { state: "idle" | "loading" | "ok" | "error"; rows: ModelRow[]; error?: string };
type RunRead = { state: "loading" | "ok" | "error"; run: ReturnType<typeof newestSignedRun> };

function sameOriginPath(url: string): string {
  try {
    const u = new URL(url, "https://councilof.ai");
    return u.origin === "https://councilof.ai" ? `${u.pathname}${u.search}` : u.toString();
  } catch {
    return url;
  }
}

/** The newest signed run on file for one model: its date and the record itself. */
function useNewestRun(modelId: string | null): RunRead {
  const [read, setRead] = useState<RunRead>({ state: "loading", run: null });
  useEffect(() => {
    if (!modelId) return;
    let cancelled = false;
    setRead({ state: "loading", run: null });
    fetch("/interop/pod-cards-index.json", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { cards?: PodCardRow[] }) => {
        if (!cancelled) setRead({ state: "ok", run: newestSignedRun(d?.cards, modelId) });
      })
      .catch(() => {
        if (!cancelled) setRead({ state: "error", run: null });
      });
    return () => {
      cancelled = true;
    };
  }, [modelId]);
  return read;
}

function ModelLookup({ subject }: { subject: string }) {
  const [read, setRead] = useState<ModelsRead>({ state: "loading", rows: [] });
  useEffect(() => {
    let cancelled = false;
    setRead({ state: "loading", rows: [] });
    fetch("/interop/models-measured.json", { headers: { accept: "application/json" } })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { models?: ModelRow[] }) => {
        if (!cancelled) setRead({ state: "ok", rows: Array.isArray(d?.models) ? d.models : [] });
      })
      .catch((e: unknown) => {
        if (!cancelled) setRead({ state: "error", rows: [], error: e instanceof Error ? e.message : String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [subject]);

  const hits = read.state === "ok" ? matchModels(read.rows, subject) : [];
  const label = read.state === "loading" ? undefined : read.state === "error" ? "UNREACHABLE" : hits.length ? "MEASURED" : "NOT_MEASURED";
  useEffect(() => {
    if (label) addMyResult({ kind: "lookup", subject, state: label });
  }, [label, subject]);
  const top = hits[0];
  const newest = useNewestRun(top ? top.id : null);
  const run = top && newest.state === "ok" ? newest.run : null;
  return (
    <ResultCard
      as="div"
      testId="get-results-model"
      title={
        top
          ? `${top.id}: published results found`
          : read.state === "ok"
            ? `Nothing published about “${subject}” yet`
            : `“${subject}”`
      }
      tool="From our published list"
      toolHint="Read from /interop/models-measured.json"
      running={read.state === "loading"}
      label={label}
      tiles={
        top
          ? [
              ...(typeof top.cards === "number" ? [{ key: "signed results (cards)", label: "Signed results", value: String(top.cards) }] : []),
              ...(typeof top.axes === "number" ? [{ key: "test areas (axes)", label: "Test areas", value: String(top.axes) }] : []),
              { key: "whose model", label: "Whose model", value: top.kind === "own" ? "ours (listed apart)" : "third party" },
              ...(run ? [{ key: "newest signed run on file (UTC day of its run id)", label: "Newest run", value: run.date }] : []),
            ]
          : []
      }
      verifyUrl={top ? modelVerifyHref(top) : "/models-measured/"}
      recordId={top?.first_signed_card ?? null}
      summary={
        read.state === "error"
          ? `The list could not be read (${read.error}). Nothing is shown in its place.`
          : hits.length > 1
            ? `Other close matches: ${hits.slice(1).map((h) => h.id).join(", ")}`
            : undefined
      }
      raw={hits.length ? hits : undefined}
    >
      {top ? (
        <div className="mt-3 space-y-1 text-sm text-muted-foreground" data-testid="get-results-model-more">
          {typeof top.cards === "number" && top.cards > 0 ? (
            <p>
              <a
                href={`/models-measured/#${modelAnchor(top.id)}`}
                className={`inline-flex min-h-11 items-center font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300 ${FOCUS}`}
                data-testid="get-results-model-results"
              >
                See its {top.cards} result{top.cards === 1 ? "" : "s"}
              </a>
            </p>
          ) : null}
          {run ? (
            <p>
              <a
                href={sameOriginPath(run.url)}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-300 ${FOCUS}`}
                title={run.id ? `Signed record ${run.id}` : undefined}
              >
                Open the newest signed result <ExternalLink className="h-3 w-3" aria-hidden="true" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>{" "}
              — paste it into Check a result to confirm it is genuine.
            </p>
          ) : newest.state === "error" ? (
            <p>The dates of its runs could not be read just now; each signed result carries its own date.</p>
          ) : null}
          <p>
            This list counts every model with a signed result. The{" "}
            <Link href="/dashboard?tab=board" className="underline underline-offset-2 hover:text-foreground">
              leaderboard
            </Link>{" "}
            compares a smaller, fixed set of models.
          </p>
        </div>
      ) : null}
    </ResultCard>
  );
}

function Choice({
  id,
  icon: Icon,
  title,
  body,
  hint,
  children,
  active,
}: {
  id: string;
  icon: typeof Zap;
  title: string;
  body: ReactNode;
  /** The technical words for this choice, kept in the tooltip. */
  hint?: string;
  children?: ReactNode;
  active: boolean;
}) {
  return (
    <li
      className={`flex min-w-0 flex-col rounded-2xl border p-4 ${active ? "border-emerald-800/20 bg-card shadow-sm" : "border-dashed border-border bg-card/60"}`}
      data-testid={`get-choice-${id}`}
      title={hint}
    >
      <p className="flex items-center gap-2 text-base font-bold text-foreground">
        <Icon className="h-4 w-4 shrink-0 text-emerald-800 dark:text-emerald-300" aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1 text-sm leading-snug text-muted-foreground">{body}</p>
      {children ? <div className="mt-auto pt-3">{children}</div> : null}
    </li>
  );
}

type WatchState = { state: "idle" | "confirm" | "sending" | "done" | "error"; text?: string };

export default function GetResults({
  onAsk,
}: {
  /** Send the free question to the Answers panel. The host saves the lookup to My results when the
   *  run finishes, with the state the tool returned (see GspcWorkspaceHome). */
  onAsk?: (question: string, subject: string) => void;
}) {
  const search = useSearch();
  const [value, setValue] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [watch, setWatch] = useState<WatchState>({ state: "idle" });
  const [asked, setAsked] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const kind: SubjectKind = subject ? classifySubject(subject) : "empty";

  // The answer renders below the five steps, out of view on a phone. After each submit, bring
  // it to the top of the view and move focus to its heading, so the reader sees what came back.
  useEffect(() => {
    if (!asked || !subject) return;
    const id = classifySubject(subject) === "model" ? "ws-model-answer" : "ws-answers";
    const frame = window.requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      const heading = el.querySelector<HTMLElement>("h2, h3");
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
        heading.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [asked, subject]);

  const submit = (raw: string) => {
    const s = raw.trim().slice(0, 300);
    if (!s) {
      inputRef.current?.focus();
      return;
    }
    setValue(s);
    setSubject(s);
    setAsked((n) => n + 1);
    setWatch({ state: "idle" });
    const k = classifySubject(s);
    const q = freeQuestion(k, s);
    // A server or record lookup is saved to My results by the host once its run has finished,
    // with the state the tool returned. Saving it here, before any answer, stored a row with no
    // state, which My results then searched for in the paid-request queue and reported missing.
    if (q && onAsk) onAsk(q, s);
  };

  // "Look up again" from My results (a model lookup) lands here with ?lookup=<subject>: the box is
  // filled and focused, and nothing is looked up until the reader presses Get results.
  useEffect(() => {
    const prefill = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("lookup")?.trim().slice(0, 300);
    if (!prefill) return;
    setValue(prefill);
    inputRef.current?.focus();
  }, [search]);

  const sendWatch = async () => {
    if (!subject) return;
    setWatch({ state: "sending" });
    try {
      const r = await fetch("/api/claims/watch-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, cadence: "monthly", confirmed: true, requested_via: "council-os-get-results" }),
      });
      const d = (await r.json().catch(() => ({}))) as { state?: string; request_id?: string; error?: string; reason?: string };
      if (d.state === "RECEIVED_FOR_REVIEW") {
        addMyResult({ kind: "watch", subject, state: d.state, ref: d.request_id });
        setWatch({
          state: "done",
          text: `Recorded for review (${d.request_id}). Nothing is scheduled or charged yet, and there is no status page for watch requests yet, so keep this id.`,
        });
      } else {
        setWatch({ state: "error", text: `Not recorded: ${d.error ?? d.reason ?? d.state ?? `HTTP ${r.status}`}.` });
      }
    } catch (e) {
      setWatch({ state: "error", text: `Not recorded: ${e instanceof Error ? e.message : String(e)}.` });
    }
  };

  const freshHref = subject ? `/dashboard?tab=measured&subject=${encodeURIComponent(subject)}` : "/dashboard?tab=measured";
  const active = Boolean(subject);

  return (
    <section aria-labelledby="get-results-h" className="rounded-3xl border border-emerald-950/10 bg-card p-4 shadow-[0_24px_50px_-38px_rgba(4,18,12,.45)] sm:p-6" data-testid="get-results">
      <h2 id="get-results-h" className="text-xl font-black tracking-tight text-foreground">
        Get results
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        Type an AI model, a server address or a result id. We show what is already measured, free, and how to ask for a new test.
      </p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        role="search"
        aria-label="Get results"
      >
        <label htmlFor="get-results-input" className="sr-only">
          AI model, server address or result id
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            id="get-results-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. qwen3:8b, example.com/mcp or a result id"
            autoComplete="off"
            spellCheck={false}
            maxLength={300}
            className={`min-h-12 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-base text-foreground placeholder:text-muted-foreground ${FOCUS}`}
            data-testid="get-results-input"
          />
        </div>
        <button
          type="submit"
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-6 text-base font-bold text-white hover:bg-emerald-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 ${FOCUS}`}
          data-testid="get-results-submit"
        >
          Get results <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>Try:</span>
        {EXAMPLES.map((x) => (
          <button
            key={x}
            type="button"
            onClick={() => submit(x)}
            className={`min-h-9 rounded-full border border-border bg-background px-3 font-mono text-xs text-foreground hover:border-emerald-700 ${FOCUS}`}
          >
            {x}
          </button>
        ))}
      </p>

      {subject ? (
        <p className="mt-4 text-sm text-foreground" aria-live="polite" data-testid="get-results-kind">
          <span className="font-semibold [overflow-wrap:anywhere]">“{subject}”</span> looks like {kind === "empty" ? "nothing" : KIND_WORD[kind]}.
        </p>
      ) : null}

      <h3 className="mt-5 text-sm font-semibold text-foreground" id="get-choices-h">
        {subject ? "What you can do next" : "What you can do here"}
      </h3>
      <ul className="mt-2 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-4" aria-labelledby="get-choices-h">
        <Choice id="known" icon={Sparkles} title="See what we already know" body="Free. Everything already published about it, with where it came from." active={active}>
          {subject ? (
            <a href={kind === "model" ? "#ws-model-answer" : "#ws-answers"} className={ACTION}>
              See the answer below ↓
            </a>
          ) : null}
        </Choice>
        <Choice
          id="fresh"
          icon={Zap}
          title={kind === "record" ? "Check this result" : "Request a fresh run"}
          hint={kind === "record" ? undefined : "Paid per run over x402 (USDC, from your own wallet); invoiced work is arranged by email. The exact amount appears only in the terms."}
          body={kind === "record" ? "A result id is already a result: check that it is genuine instead. Free." : `${FRESH_RUN_DOCTRINE} Invoiced work is arranged by email.`}
          active={active}
        >
          {kind !== "record" ? (
            <Link href={freshHref} className={ACTION} data-testid="get-fresh-run">
              See the terms →
            </Link>
          ) : (
            <Link href="/dashboard?tab=verify" className={ACTION}>
              Check a result →
            </Link>
          )}
        </Choice>
        <Choice
          id="track"
          icon={ClipboardList}
          title="Track a request"
          hint="Look up by receipt (the sha256 id of your paid request) or by transaction hash."
          body="Where a request stands, its signed results once they are published, and a free check that they are genuine. Look it up by its receipt."
          active={active}
        >
          <Link href="/dashboard?tab=mine" className={ACTION} data-testid="get-my-results">
            Open My results →
          </Link>
        </Choice>
        <Choice
          id="watch"
          icon={BellRing}
          title="Re-check every month"
          body="Ask for it to be tested again each month. A person reviews each request; nothing is charged by asking."
          active={active}
        >
          {subject ? (
            watch.state === "idle" ? (
              <button type="button" onClick={() => setWatch({ state: "confirm" })} className={ACTION} data-testid="get-watch">
                Ask for a monthly re-check
              </button>
            ) : watch.state === "confirm" ? (
              <span className="flex flex-col gap-2">
                <span className="text-sm leading-snug text-foreground" data-testid="get-watch-note">
                  Sends “{subject}, monthly” for a person to review. No email or account is asked for.
                </span>
                <span className="flex flex-wrap gap-2">
                  <button type="button" onClick={sendWatch} className={`min-h-11 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900 ${FOCUS}`}>
                    Send request
                  </button>
                  <button type="button" onClick={() => setWatch({ state: "idle" })} className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground ${FOCUS}`}>
                    Cancel
                  </button>
                </span>
              </span>
            ) : (
              <span role="status" className={`block text-sm [overflow-wrap:anywhere] ${watch.state === "error" ? "text-rose-800 dark:text-rose-300" : "text-foreground"}`}>
                {watch.state === "sending" ? "Sending…" : watch.text}
              </span>
            )
          ) : null}
        </Choice>
      </ul>

      {subject && kind === "model" ? (
        <div className="mt-4 scroll-mt-4" id="ws-model-answer">
          <ModelLookup subject={subject} />
        </div>
      ) : null}
    </section>
  );
}
