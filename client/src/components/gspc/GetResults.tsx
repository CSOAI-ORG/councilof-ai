/**
 * GetResults — the first screen of Council OS (owner brief, 1 Oct 2026: RaaS, not a reading room).
 *
 * One input — a model, a server address or a signed record id — and five plain steps:
 *   1. what is already measured (free, read live);
 *   2. a fresh run (x402 from your own wallet, or invoice; no price is printed here);
 *   3. the queued job (a receipt in the public queue);
 *   4. My results (status, the delivered signed pack, verify);
 *   5. Watch (a monthly re-check request).
 * Step 1 for a server or a record goes to the same free tools /mcp serves (the AG-UI TalkPanel,
 * via onAsk). For a model it reads /interop/models-measured.json. Nothing is typed in; a failed
 * read says so.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { ArrowRight, BellRing, ClipboardList, Search, Sparkles, Timer, Zap } from "lucide-react";
import ResultCard from "@/components/talk/ResultCard";
import { classifySubject, freeQuestion, matchModels, type ModelRow, type SubjectKind } from "@/lib/resultCard";
import { addMyResult } from "@/lib/myResults";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const KIND_WORD: Record<Exclude<SubjectKind, "empty">, string> = {
  model: "an AI model",
  server: "a server or web address",
  record: "a signed record",
};

const EXAMPLES = ["github.com", "qwen3:8b", "https://councilof.ai/mcp"];

type ModelsRead = { state: "idle" | "loading" | "ok" | "error"; rows: ModelRow[]; error?: string };

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
  return (
    <ResultCard
      as="div"
      testId="get-results-model"
      title={hits.length ? `${top.id} is on the list` : `“${subject}”`}
      tool="models-measured.json"
      running={read.state === "loading"}
      label={label}
      tiles={
        top
          ? [
              ...(typeof top.cards === "number" ? [{ key: "cards", label: "Signed results", value: String(top.cards) }] : []),
              ...(typeof top.axes === "number" ? [{ key: "axes", label: "Tests", value: String(top.axes) }] : []),
              { key: "kind", label: "Whose model", value: top.kind === "own" ? "ours (listed apart)" : "third party" },
              { key: "matches", label: "Close matches", value: String(hits.length) },
            ]
          : []
      }
      verifyUrl={top ? "/dashboard?tab=verify" : "/models-measured/"}
      verifyText={top ? "Verify a signed result yourself" : "See every model measured"}
      summary={
        read.state === "error"
          ? `The list could not be read (${read.error}). Nothing is shown in its place.`
          : hits.length > 1
            ? `Other matches: ${hits.slice(1).map((h) => h.id).join(", ")}`
            : undefined
      }
      raw={hits.length ? hits : undefined}
    />
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
  children,
  active,
}: {
  n: number;
  icon: typeof Zap;
  title: string;
  body: string;
  children?: ReactNode;
  active: boolean;
}) {
  return (
    <li
      className={`flex min-w-0 flex-col rounded-2xl border p-4 ${active ? "border-emerald-800/20 bg-card shadow-sm" : "border-dashed border-border bg-card/60"}`}
      data-testid={`get-step-${n}`}
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-800 text-xs text-white dark:bg-emerald-600" aria-hidden="true">
          {n}
        </span>
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Step {n}: </span>
        {title}
      </p>
      <p className="mt-2 text-sm leading-snug text-muted-foreground">{body}</p>
      {children ? <div className="mt-auto pt-3">{children}</div> : null}
    </li>
  );
}

type WatchState = { state: "idle" | "confirm" | "sending" | "done" | "error"; text?: string };

export default function GetResults({ onAsk }: { onAsk?: (question: string) => void }) {
  const [value, setValue] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [watch, setWatch] = useState<WatchState>({ state: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const kind: SubjectKind = subject ? classifySubject(subject) : "empty";

  const submit = (raw: string) => {
    const s = raw.trim().slice(0, 300);
    if (!s) {
      inputRef.current?.focus();
      return;
    }
    setValue(s);
    setSubject(s);
    setWatch({ state: "idle" });
    const k = classifySubject(s);
    const q = freeQuestion(k, s);
    if (q && onAsk) {
      onAsk(q);
      addMyResult({ kind: "lookup", subject: s });
    }
  };

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
        setWatch({ state: "done", text: `Received (${d.request_id}). A person accepts or declines it; nothing is scheduled or charged yet.` });
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
        Type a model, a server address or a record id. We show what is already measured, free, and how to get a fresh run.
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
          Model, server address or record id
        </label>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            id="get-results-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. qwen3:8b, example.com/mcp or a record id"
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
          <span className="font-semibold">“{subject}”</span> looks like {kind === "empty" ? "nothing" : KIND_WORD[kind]}.
        </p>
      ) : null}

      <ol className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2 xl:grid-cols-5" aria-label="How getting a result works">
        <Step n={1} icon={Sparkles} title="Already measured" body="Free. What we have already published about it, read live." active={active}>
          {subject ? (
            <a href={kind === "model" ? "#ws-model-answer" : "#ws-answers"} className={`inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`}>
              See the answer below ↓
            </a>
          ) : null}
        </Step>
        <Step
          n={2}
          icon={Zap}
          title="Fresh run"
          body={kind === "record" ? "A record is already a result; verify it instead." : "We measure it now. Pay per run from your own wallet or by invoice; you see the terms before anything is paid."}
          active={active}
        >
          {kind !== "record" ? (
            <Link href={freshHref} className={`inline-flex min-h-11 items-center gap-1 text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`} data-testid="get-fresh-run">
              Request a fresh run →
            </Link>
          ) : (
            <Link href="/dashboard?tab=verify" className={`inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`}>
              Check a result →
            </Link>
          )}
        </Step>
        <Step n={3} icon={Timer} title="Queued job" body="Your request joins the public queue with a receipt. Nothing is measured until it runs." active={active} />
        <Step n={4} icon={ClipboardList} title="My results" body="Status, the signed results when delivered, and a free check that they are genuine." active={active}>
          <Link href="/dashboard?tab=mine" className={`inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`} data-testid="get-my-results">
            Open My results →
          </Link>
        </Step>
        <Step n={5} icon={BellRing} title="Watch" body="Ask for a re-check every month. A person accepts it; nothing is charged by asking." active={active}>
          {subject ? (
            watch.state === "idle" ? (
              <button type="button" onClick={() => setWatch({ state: "confirm" })} className={`inline-flex min-h-11 items-center text-sm font-bold text-emerald-800 underline underline-offset-4 dark:text-emerald-300 ${FOCUS}`} data-testid="get-watch">
                Watch monthly
              </button>
            ) : watch.state === "confirm" ? (
              <span className="flex flex-wrap gap-2">
                <button type="button" onClick={sendWatch} className={`min-h-11 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900 ${FOCUS}`}>
                  Confirm watch
                </button>
                <button type="button" onClick={() => setWatch({ state: "idle" })} className={`min-h-11 rounded-lg border border-border px-3 text-sm font-semibold text-foreground ${FOCUS}`}>
                  Cancel
                </button>
              </span>
            ) : (
              <span role="status" className={`block text-sm ${watch.state === "error" ? "text-rose-800 dark:text-rose-300" : "text-foreground"}`}>
                {watch.state === "sending" ? "Sending…" : watch.text}
              </span>
            )
          ) : null}
        </Step>
      </ol>

      {subject && kind === "model" ? (
        <div className="mt-4" id="ws-model-answer">
          <ModelLookup subject={subject} />
        </div>
      ) : null}
    </section>
  );
}
