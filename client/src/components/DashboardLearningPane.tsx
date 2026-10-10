import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  Check,
  Circle,
  Gamepad2,
  RotateCcw,
  ShieldCheck,
  Swords,
  Wrench,
} from "lucide-react";
import { Link, useSearch } from "wouter";
import {
  GSPC_LEARNING_PATHS,
  buildLearningPaths,
  deriveLearningProgress,
  type GspcLearningPath,
  type LearningStageId,
} from "@/data/gspc-learning-paths";
import { boardAxisLabel } from "@/components/home/HomeGspcBoard";
import {
  boardStateLabel,
  evidenceStateLabel,
  fineTierLabel,
  regulationStateLabel,
} from "@/data/learningDisplayLabels";
import { dashboardViewHref } from "@/lib/dashboardView";
import { openAsk } from "@/components/ask/askBus";

import {
  clearLearningChallenge,
  learningChallengePath,
  readLearningReturn,
  rememberLearningChallenge,
  type LearningReviewDecision as ReviewDecision,
} from "@/lib/learningChallenge";

/**
 * One plain question per axis, shown under its question-bank name. It restates the bank's
 * published task (GET /api/gspc → axes[].task) in everyday words; it adds no claim. An axis that
 * is not listed simply shows no caption.
 */
export const PLAIN_BENCH: Record<string, string> = {
  governance: "can the model sort AI uses into the right EU AI Act risk level?",
  safety: "does the model refuse harmful requests but still help with safe ones?",
  provenance: "can the model tell when an “AI-made” label on content still counts?",
  continuity: "can the model tell whether encryption will hold up against quantum computers?",
  conformance: "does the model use agent tools the way the MCP standard says?",
  openness: "can the model tell whether a software licence allows what you want to do?",
  "machinery-conformity": "can the model tell when a self-changing machine function is a safety function?",
  care: "does the model protect people without refusing to help them?",
  "cross-reality": "does an AI agent know when to act, when to ask first and when to refuse?",
  "detector-interop": "can the model work out which watermark detectors can read which watermarks?",
  "art5-safeguard": "does the model spot uses the EU AI Act bans outright?",
  swarm: "do several AI agents working together stay safe?",
  affect: "does the model avoid manipulating people or exploiting their feelings?",
  jail: "can the model spot an attempt to break out of its safety rules?",
  "effect-binding": "does a server check what it actually runs, not just what the agent asked for?",
  "provenance-controls": "can a stablecoin issuer freeze or restrict accounts, as the chain shows?",
  "reserve-attestation": "does the issuer show a third-party check of its reserves?",
  "regulatory-framework": "is the rulebook the issuer follows stated and checkable?",
  "distribution-integrity": "are the coin's supply and holders what the issuer says?",
  "custody-disclosure": "are the custodian and the auditor named and checkable?",
  "ai-adoption-components": "official EU figures on business AI use, cited, not scored.",
  "labour-components": "official EU labour figures, cited, not scored.",
  "humanoid-labour-index": "does a named robot maker publish a dated count of robots at work?",
};

/** The plain question alone, capitalised, for the narrow axis list. */
export function plainBenchQuestion(axis: string): string | null {
  const q = Object.prototype.hasOwnProperty.call(PLAIN_BENCH, axis) ? PLAIN_BENCH[axis] : null;
  return q ? q.charAt(0).toUpperCase() + q.slice(1) : null;
}

/** "DefBench: does the model refuse harmful requests but still help with safe ones?" */
export function plainBenchCaption(axis: string, bench: string): string | null {
  const q = Object.prototype.hasOwnProperty.call(PLAIN_BENCH, axis) ? PLAIN_BENCH[axis] : null;
  if (!q) return null;
  const name = bench.split(/\s+[—–-]\s+/)[0].trim();
  return name ? `${name}: ${q}` : q.charAt(0).toUpperCase() + q.slice(1);
}

/**
 * The question "See how this test measured" asks, in the Ask panel beside the lesson. Tools audit
 * retest, 6 Oct 2026: "Ask Council to coach this stage" left the lesson for the start screen and
 * came back with a stats card, because answers come from published records by fixed rules: there
 * is no coach. The control now says what it does, asks the question the rules answer (the axis
 * id is spelled with spaces, the form the router matches), and the lesson stays open.
 */
export function axisQuestion(axis: string): string {
  return `How did the ${axis.replace(/-/g, " ")} test measure?`;
}

type ScenarioPointer = {
  regulator_name?: string;
  obligation?: string;
  tier?: string;
};

type LearningScenario = {
  axis?: string;
  board_measurement?: {
    status?: string;
    kind?: string;
    source?: string;
  };
  evidence?: {
    published_state?: string;
    published_measurements?: unknown[];
    independently_admitted?: boolean;
    candidate_state?: string;
    candidate_findings?: unknown[];
  };
  regulation_context?: {
    state?: string;
    source?: string;
    pointers?: ScenarioPointer[];
    note?: string;
  };
};

type ScenarioReply = {
  schema?: string;
  state?: string;
  errors?: string[];
  scenarios?: LearningScenario[];
};

export function learningScenarioUrl(axis: string, hostname?: string): string {
  const path = `/api/learning-scenarios?axis=${encodeURIComponent(axis)}`;
  const local = hostname === "127.0.0.1" || hostname === "localhost";
  return local ? `https://councilof.ai${path}` : path;
}

/** The live board: the roster of axes the practice paths are built from. */
export function learningBoardUrl(hostname?: string): string {
  const local = hostname === "127.0.0.1" || hostname === "localhost";
  return local ? "https://councilof.ai/api/gspc" : "/api/gspc";
}

type RosterState = "READING" | "LIVE" | "FREEZE";

const STAGE_HELP: Record<LearningStageId, string> = {
  learn:
    "Read the instrument and the live regulatory pointers before answering.",
  play: "Try a bounded scenario. Practice never touches a live system.",
  explain:
    "State the rule, assumption, uncertainty and evidence in plain language.",
  "propose-fix":
    "Draft a reversible remediation and a test. Nothing is applied.",
  "human-review": "A person accepts, returns or discards the practice record.",
};


function badgeTone(value: string): string {
  if (
    value === "NONE_PUBLISHED" ||
    value === "UNMEASURED" ||
    value === "UNMAPPED" ||
    value === "UNCHECKABLE" ||
    value === "UNAVAILABLE"
  ) {
    return "border-amber-700/25 bg-amber-50 text-amber-950";
  }
  if (
    value === "PUBLISHED_VERIFIED" ||
    value === "READY" ||
    value === "MEASURED"
  ) {
    return "border-emerald-700/25 bg-emerald-50 text-emerald-900";
  }
  return "border-slate-700/15 bg-slate-100 text-slate-700";
}

export default function DashboardLearningPane() {
  const search = useSearch();
  const [returned] = useState(() => readLearningReturn(search));
  // The roster comes from the live board; the committed freeze is only the fallback, so the
  // path count below is derived from whichever roster is actually shown, never typed.
  const [livePaths, setLivePaths] = useState<readonly GspcLearningPath[] | null>(returned?.paths ?? null);
  const [rosterState, setRosterState] = useState<RosterState>(returned?.rosterState ?? "READING");
  const paths = livePaths ?? GSPC_LEARNING_PATHS;
  const rosterLabel =
    rosterState === "LIVE"
      ? "one per axis on the live board"
      : rosterState === "READING"
        ? "reading the live board…"
        : "from the committed board freeze; the live board could not be read";
  const [axisId, setAxisId] = useState(returned?.axisId ?? GSPC_LEARNING_PATHS[0]?.axis.id ?? "");
  const [query, setQuery] = useState("");
  const [completedByAxis, setCompletedByAxis] = useState<
    Record<string, string[]>
  >(returned?.completedByAxis ?? {});
  const [reviewByAxis, setReviewByAxis] = useState<
    Record<string, ReviewDecision>
  >(returned?.reviewByAxis ?? {});
  const [scenario, setScenario] = useState<LearningScenario | null>(null);
  const [scenarioState, setScenarioState] = useState("READING");
  const [scenarioNote, setScenarioNote] = useState("Reading current sources…");

  useEffect(clearLearningChallenge, []);

  const selected =
    paths.find((path) => path.axis.id === axisId) ?? paths[0];
  const selectedAxisId = selected?.axis.id;
  const progress = selected
    ? deriveLearningProgress(
        selected.axis.id,
        completedByAxis[selected.axis.id] ?? [],
        paths,
      )
    : null;
  const activeStage = selected?.stages.find(
    (stage) => stage.id === progress?.activeStageId,
  );
  const reviewDecision = selected ? reviewByAxis[selected.axis.id] : undefined;

  const visiblePaths = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return paths;
    return paths.filter((path) =>
      [path.axis.id, path.axis.bench, path.axis.task, path.axis.family]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, paths]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(
      learningBoardUrl(
        typeof window === "undefined" ? undefined : window.location.hostname,
      ),
      { headers: { accept: "application/json" }, signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`Board HTTP ${response.status}`);
        const roster = buildLearningPaths(await response.json());
        if (!roster.length) throw new Error("The live board returned no axes.");
        setLivePaths(roster);
        setRosterState("LIVE");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setRosterState("FREEZE");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedAxisId) return;
    const controller = new AbortController();
    setScenario(null);
    setScenarioState("READING");
    setScenarioNote("Reading current sources…");
    fetch(
      learningScenarioUrl(
        selectedAxisId,
        typeof window === "undefined" ? undefined : window.location.hostname,
      ),
      {
        headers: { accept: "application/json" },
        signal: controller.signal,
      },
    )
      .then(async (response) => {
        const contentType = (
          response.headers.get("content-type") || ""
        ).toLowerCase();
        if (!contentType.includes("application/json")) {
          throw new Error(
            "The scenario endpoint returned a document, not its JSON contract.",
          );
        }
        const body = (await response.json()) as ScenarioReply;
        if (!response.ok || body.schema !== "csoai.learning-scenarios/0.1") {
          throw new Error(
            body.errors?.join(" · ") ||
              `Scenario endpoint HTTP ${response.status}`,
          );
        }
        const row = body.scenarios?.[0] ?? null;
        if (!row || row.axis !== selectedAxisId) {
          throw new Error("No exact scenario was returned for this axis.");
        }
        setScenario(row);
        setScenarioState(body.state || "READY");
        setScenarioNote(
          "Live board, locally verified published cards and regulation sources joined by exact identity. Publication is not independent admission.",
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setScenario(null);
        setScenarioState("UNCHECKABLE");
        setScenarioNote(error instanceof Error ? error.message : String(error));
      });
    return () => controller.abort();
  }, [selectedAxisId]);

  function completeStage() {
    if (!selected || !progress?.activeStageId) return;
    if (progress.activeStageId === "human-review" && !reviewDecision) return;
    setCompletedByAxis((current) => ({
      ...current,
      [selected.axis.id]: [
        ...(current[selected.axis.id] ?? []),
        progress.activeStageId!,
      ],
    }));
  }

  function resetPath() {
    if (!selected) return;
    setCompletedByAxis((current) => ({ ...current, [selected.axis.id]: [] }));
    setReviewByAxis((current) => {
      const next = { ...current };
      delete next[selected.axis.id];
      return next;
    });
  }

  if (!selected || !progress) return null;

  const challengeState = activeStage ? {
    axisId: selected.axis.id, stageId: activeStage.id, paths, rosterState,
    completedByAxis, reviewByAxis,
  } : null;
  const challengePath = challengeState ? learningChallengePath(challengeState) : null;

  const pointers = scenario?.regulation_context?.pointers ?? [];
  const publishedState =
    scenario?.evidence?.published_state ?? "UNCHECKABLE";
  const boardState = scenario?.board_measurement?.status ?? "UNCHECKABLE";

  return (
    <div
      // Bottom padding reserves room for the persistent composer, the safe-area inset and a
      // software keyboard on small screens, so the focused task is never hidden under them.
      className="h-full overflow-y-auto bg-[var(--surface-canvas,#fafaf7)] px-4 py-6 pb-[calc(13rem+env(safe-area-inset-bottom))] sm:px-7 lg:px-10 lg:pb-6"
      data-testid="dashboard-learning-pane"
    >
      <div className="mx-auto w-full max-w-6xl">
        <nav
          aria-label="Council workspace modes"
          className="mx-auto mt-12 flex w-fit flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-card p-1 shadow-sm xl:mt-0"
        >
          <Link
            href="/dashboard?tab=home"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Council chat
          </Link>
          <span
            className="rounded-full bg-emerald-900 px-3 py-1.5 text-xs font-semibold text-white"
            aria-current="page"
          >
            Learning arena
          </span>
          <Link
            href="/dashboard?tab=space"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Model arena
          </Link>
          <Link
            href="/dashboard?tab=play"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Games
          </Link>
          <Link
            href="/dashboard?tab=tools"
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            Tools
          </Link>
        </nav>

        <header className="mx-auto mt-5 max-w-3xl text-center sm:mt-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
            Human-guided GSPC curriculum
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Learn the problem. Play it. Explain it. Fix it—with approval.
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground sm:text-sm">
            One practice path for every canonical GSPC axis. The Council can
            coach and draft remediation, but a person owns the final decision.
            Practice never becomes evidence, a score, or model training by
            itself.
          </p>
          <div className="mt-4 hidden flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wide sm:flex">
            <span
              className="rounded-full border border-emerald-700/20 bg-emerald-50 px-2.5 py-1 text-emerald-900"
              title={rosterLabel}
              data-testid="learning-roster-count"
              data-roster={rosterState}
            >
              {paths.length} canonical paths · {rosterState === "LIVE" ? "live board" : rosterState === "READING" ? "reading board" : "board freeze"}
            </span>
            <span className="rounded-full border border-slate-700/15 bg-white px-2.5 py-1 text-slate-700">
              session-only progress
            </span>
            <span className="rounded-full border border-amber-700/25 bg-amber-50 px-2.5 py-1 text-amber-950">
              human review required
            </span>
          </div>
          <p className="mx-auto mt-3 max-w-2xl text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
            Practice completes nothing by itself. A module is complete when you
            reproduce a published measurement and your result matches it:{" "}
            <a
              href="/academy/exercises/"
              className="font-semibold text-emerald-800 underline underline-offset-2"
              data-testid="learning-exercises-link"
            >
              Academy exercises
            </a>
            .
          </p>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(15rem,0.72fr)_minmax(0,2fr)]">
          {/* Small screens: a compact selector instead of the full list, so the chosen lesson
              is the next thing in the viewport (measured 2026-09-15: the selected heading sat
              at y=1419 on 390x844 behind the full chooser). */}
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm lg:hidden">
            <label
              htmlFor="learning-axis-select"
              className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
            >
              Choose an axis
            </label>
            <select
              id="learning-axis-select"
              data-testid="learning-axis-select"
              value={selected.axis.id}
              onChange={(event) => setAxisId(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            >
              {paths.map((path, index) => (
                <option key={path.axis.id} value={path.axis.id}>
                  {String(index + 1).padStart(2, "0")} · {boardAxisLabel(path.axis.id)} ·{" "}
                  {completedByAxis[path.axis.id]?.length ?? 0}/{path.stages.length}
                </option>
              ))}
            </select>
            <p className="mt-2 px-1 text-[11px] text-muted-foreground">
              {paths.length} canonical paths ({rosterLabel}). The selected lesson opens directly below.
            </p>
          </div>
          <aside
            className="hidden rounded-2xl border border-border bg-card p-3 shadow-sm lg:block"
            aria-label="GSPC learning paths"
          >
            <label
              htmlFor="learning-axis-search"
              className="px-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground"
            >
              Choose an axis
            </label>
            <input
              id="learning-axis-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search curriculum…"
              className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
            />
            <div
              className="mt-3 max-h-[36rem] space-y-1 overflow-y-auto pr-1"
              data-testid="learning-axis-list"
            >
              {visiblePaths.map((path, index) => {
                const active = path.axis.id === selected.axis.id;
                const done = completedByAxis[path.axis.id]?.length ?? 0;
                return (
                  <button
                    key={path.axis.id}
                    type="button"
                    data-axis-learning={path.axis.id}
                    onClick={() => setAxisId(path.axis.id)}
                    className={`w-full rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 ${
                      active
                        ? "border-emerald-700/30 bg-emerald-50 text-emerald-950"
                        : "border-transparent text-foreground hover:border-border hover:bg-muted/60"
                    }`}
                  >
                    <span className="flex items-start gap-2">
                      <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">
                          {boardAxisLabel(path.axis.id)}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                          {path.axis.bench}
                        </span>
                        {plainBenchQuestion(path.axis.id) ? (
                          <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-muted-foreground">
                            {plainBenchQuestion(path.axis.id)}
                          </span>
                        ) : null}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground">
                        {done}/5
                      </span>
                    </span>
                  </button>
                );
              })}
              {!visiblePaths.length ? (
                <p className="rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground">
                  No canonical axis matches that search.
                </p>
              ) : null}
            </div>
          </aside>

          <section
            className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
            aria-label={`${boardAxisLabel(selected.axis.id)} learning path`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-700/20 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900">
                    {selected.axis.family}
                  </span>
                  <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    {selected.axis.kind}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                  {boardAxisLabel(selected.axis.id)}
                </h2>
                <p className="mt-1 text-sm font-medium text-emerald-900">
                  {selected.axis.bench}
                </p>
                {plainBenchCaption(selected.axis.id, selected.axis.bench) ? (
                  <p className="mt-1 text-sm text-foreground" data-testid="learning-plain-bench">
                    {plainBenchCaption(selected.axis.id, selected.axis.bench)}
                  </p>
                ) : null}
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {selected.axis.task}
                </p>
              </div>
              <button
                type="button"
                onClick={resetPath}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reset
              </button>
            </div>

            <section
              className="mt-5 rounded-xl border border-border bg-muted/35 p-4"
              aria-label="Live learning context"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-foreground">
                  Live source context
                </h3>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold ${badgeTone(scenarioState)}`}
                  data-testid="learning-scenario-state"
                >
                  {scenarioState}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                {scenarioNote}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    Board context
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {boardStateLabel(boardState).label}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    Published card evidence
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {evidenceStateLabel(publishedState).label}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-background p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    Regulation mapping
                  </p>
                  <p className="mt-1 text-xs font-semibold text-foreground">
                    {regulationStateLabel(scenario?.regulation_context?.state ?? "UNCHECKABLE").label}
                  </p>
                </div>
              </div>
              {pointers.length ? (
                <section
                  className="mt-3 rounded-lg border border-border bg-background p-3"
                  aria-labelledby="related-framework-sources-h"
                  data-testid="related-framework-sources"
                >
                  <h4 id="related-framework-sources-h" className="text-xs font-semibold text-foreground">
                    Related framework sources
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    These links explain the framework relevant to this lesson. A link is not a
                    determination that an obligation applies.
                  </p>
                  <ul className="mt-2 space-y-2">
                    {pointers.slice(0, 3).map((pointer, index) => {
                      const tier = fineTierLabel(pointer.tier);
                      return (
                        <li
                          key={`${pointer.regulator_name ?? "regulator"}-${index}`}
                          className="text-[11px] leading-relaxed text-slate-700"
                        >
                          <strong>{pointer.regulator_name ?? "Published pointer"}</strong> —{" "}
                          {pointer.obligation ?? "No obligation text published."}
                          <span className="block text-muted-foreground">{tier.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <details className="mt-2 text-[11px] text-muted-foreground">
                    <summary className="cursor-pointer font-semibold">Technical details</summary>
                    <ul className="mt-1 space-y-1 font-mono">
                      <li>
                        mapping state: <code>{scenario?.regulation_context?.state ?? "UNCHECKABLE"}</code>
                        {" · "}source: <code>{scenario?.regulation_context?.source ?? "not published"}</code>
                      </li>
                      {pointers.slice(0, 3).map((pointer, index) => (
                        <li key={`raw-${index}`}>
                          tier id: <code>{pointer.tier ?? "none"}</code>
                        </li>
                      ))}
                    </ul>
                  </details>
                </section>
              ) : null}
            </section>

            <section className="mt-6" aria-labelledby="learning-path-title">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3
                    id="learning-path-title"
                    className="text-sm font-semibold"
                  >
                    Human-in-the-loop learning path
                  </h3>
                  <p
                    className="mt-1 text-[11px] text-muted-foreground"
                    data-testid="learning-progress"
                  >
                    Practice progress: {progress.completedStageIds.length} of{" "}
                    {selected.stages.length} stages reviewed. Progress lasts for this session.
                    Completing practice does not create an independently measured result or a
                    regulatory credential.
                  </p>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  PRACTICE_ONLY · UNMEASURED
                </span>
              </div>

              <ol className="mt-4 grid gap-2 sm:grid-cols-5">
                {selected.stages.map((stage) => {
                  const state =
                    progress.stages.find((item) => item.id === stage.id)
                      ?.state ?? "LOCKED";
                  return (
                    <li
                      key={stage.id}
                      data-testid={`learning-stage-${stage.id}`}
                      className={`rounded-xl border p-3 ${state === "COMPLETE" ? "border-emerald-700/25 bg-emerald-50" : state === "AVAILABLE" ? "border-amber-700/30 bg-amber-50" : "border-border bg-muted/35"}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {state === "COMPLETE" ? (
                          <Check
                            className="h-3.5 w-3.5 text-emerald-800"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            className="h-3 w-3 text-muted-foreground"
                            aria-hidden="true"
                          />
                        )}
                        <span className="font-mono text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
                          {state}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-foreground">
                        {stage.label}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </section>

            {activeStage ? (
              <section
                className="mt-5 rounded-2xl border border-amber-700/25 bg-amber-50/65 p-5"
                aria-live="polite"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-amber-900 shadow-sm">
                    {activeStage.id === "learn" ? (
                      <BookOpenCheck className="h-4 w-4" />
                    ) : activeStage.id === "play" ? (
                      <Gamepad2 className="h-4 w-4" />
                    ) : activeStage.id === "propose-fix" ? (
                      <Wrench className="h-4 w-4" />
                    ) : activeStage.id === "human-review" ? (
                      <ShieldCheck className="h-4 w-4" />
                    ) : (
                      <Swords className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-900">
                      Current stage · {activeStage.label}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-slate-950">
                      {activeStage.objective}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-amber-950/80">
                      {STAGE_HELP[activeStage.id]}
                    </p>
                  </div>
                </div>

                {activeStage.id === "human-review" ? (
                  <fieldset className="mt-4">
                    <legend className="text-xs font-semibold text-slate-900">
                      Your review decision—kept in this session only
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["READY_FOR_REVIEW", "Ready for separate review"],
                          ["RETURN_FOR_REVISION", "Return for revision"],
                          ["DISCARD", "Discard"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          aria-pressed={reviewDecision === value}
                          onClick={() =>
                            setReviewByAxis((current) => ({
                              ...current,
                              [selected.axis.id]: value,
                            }))
                          }
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold ${reviewDecision === value ? "border-emerald-800 bg-emerald-900 text-white" : "border-amber-800/25 bg-white text-slate-800 hover:border-amber-800/50"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={completeStage}
                    disabled={
                      activeStage.id === "human-review" && !reviewDecision
                    }
                    className="rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-amber-950 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {activeStage.id === "human-review"
                      ? "Record my review"
                      : `Complete ${activeStage.label}`}
                  </button>
                  {/* Coaching is secondary: an expandable control beside the primary action,
                      not a rail competing with the lesson for reading space. */}
                  <details className="w-full sm:w-auto" data-testid="learning-coaching">
                    <summary className="cursor-pointer rounded-xl border border-amber-800/25 bg-white px-4 py-2.5 text-xs font-semibold text-amber-950 hover:border-amber-800/50">
                      Coaching (optional)
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openAsk(axisQuestion(selected.axis.id))}
                        className="min-h-11 rounded-xl border border-amber-800/25 bg-white px-4 py-2.5 text-xs font-semibold text-amber-950 hover:border-amber-800/50"
                      >
                        See how this test measured (opens beside the lesson)
                      </button>
                      {activeStage.id === "play" && challengeState && challengePath ? (
                        <Link
                          href={dashboardViewHref(challengePath, "GSPC Quests")}
                          onClick={(event) => {
                            if (!rememberLearningChallenge(challengeState)) event.preventDefault();
                          }}
                          className="rounded-xl border border-amber-800/25 bg-white px-4 py-2.5 text-xs font-semibold text-amber-950 hover:border-amber-800/50"
                        >
                          Open available challenge banks
                        </Link>
                      ) : null}
                    </div>
                  </details>
                </div>
              </section>
            ) : (
              <section className="mt-5 rounded-2xl border border-emerald-700/25 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 text-emerald-800"
                    aria-hidden="true"
                  />
                  <div>
                    <h3 className="text-base font-semibold text-emerald-950">
                      Practice path reviewed
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-emerald-950/75">
                      Decision:{" "}
                      {reviewDecision?.replaceAll("_", " ") ?? "not recorded"}.
                      No evidence, signed card, board update, external witness
                      or model-training permission was created.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                      {/* This axis's own page (rendered from the board), not the whole board. */}
                      <a
                        href={`/axis/${encodeURIComponent(selected.axis.id)}`}
                        className="inline-flex min-h-11 items-center text-emerald-900 underline underline-offset-2"
                      >
                        See the published evidence for this axis
                      </a>
                      <button
                        type="button"
                        onClick={() => openAsk(axisQuestion(selected.axis.id))}
                        className="inline-flex min-h-11 items-center text-emerald-900 underline underline-offset-2"
                      >
                        See how this test measured
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
