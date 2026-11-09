import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  ExternalLink,
  RotateCcw,
  ShieldCheck,
  Swords,
} from "lucide-react";
import JSpaceTimeline from "@/components/JSpaceTimeline";
import MunderDuel from "@/components/MunderDuel";
import { generatePracticeRounds, simulatePracticeDecisions, scorePracticeDecisions, type PracticeDecision } from "@/lib/munderPractice";
import { decisionsToTimelineEvents } from "@/components/timeline/decisionToTimeline";
import { useLedger } from "@/hooks/useLedger";

export const ARENA_SCOREBOARD_ENDPOINT = "/api/arena/scoreboard";
export const ARENA_SCOREBOARD_FALLBACK = "/signed/arena_scoreboard.json";

/**
 * What the current estate can honestly offer in an arena-shaped workspace.
 * A selector over recorded measurements is real; a two-provider prompt fan-out is not.
 */
export const DASHBOARD_ARENA_CONTRACT = {
  replay: {
    state: "SIGNED",
    endpoint: ARENA_SCOREBOARD_ENDPOINT,
    scope: "HISTORICAL_REPLAY",
    taxonomy: "NONCANONICAL_15_AXIS",
    interaction:
      "select two recorded model subjects on one historical arena axis",
  },
  chat: {
    state: "RUNTIME_OBSERVED",
    endpoint: "/api/chat",
    interaction: "one grounded Council answer; no selectable-provider contract",
  },
  livePromptBattle: {
    state: "UNCHECKABLE",
    endpoint: null,
    reason:
      "No published POST contract accepts one prompt and two model identifiers.",
  },
  agui: {
    state: "RUNTIME_OBSERVED",
    endpoint: "/api/agui/gspc-state",
    interaction:
      "presentation stream over the living GSPC GET; not a model runner",
  },
  aguiWire: {
    state: "UNREACHABLE",
    endpoint: "/api/agui/health",
    interaction:
      "the optional upstream wire is not configured on the public deployment",
  },
  a2ui: {
    state: "UNCHECKABLE",
    endpoint: null,
    interaction: "no callable A2UI runtime contract found in this application",
  },
} as const;

export type ArenaModelScore = {
  pass: number;
  n: number;
  rate: number;
};

export type ArenaAxis = {
  nRounds: number;
  models: Record<string, ArenaModelScore>;
};

export type ArenaScoreboard = {
  schema: string;
  asOf: string | null;
  nRounds: number | null;
  source: string;
  axes: Record<string, ArenaAxis>;
  signature: {
    contentId: string;
    signature: string;
    keyId: string;
  } | null;
};

export { generatePracticeRounds, simulatePracticeDecisions, scorePracticeDecisions } from "@/lib/munderPractice";
export type { PracticeDecision, PracticeRound, PracticeScore } from "@/lib/munderPractice";

export type PracticeSnapshot = {
  seed: number;
  decisions: PracticeDecision[];
};

export const PRACTICE_SESSION_STORAGE_KEY = "csoai.boss-chair-practice/1";
const PRACTICE_SNAPSHOT_SCHEMA = "csoai.boss-chair-practice/1";

/** Private, tab-local practice only; cached scores or evidence flags are never accepted. */
export function decodePracticeSnapshot(raw: string | null): PracticeSnapshot | null {
  if (!raw || raw.length > 16384) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = parsed as Record<string, unknown>;
    const keys = Object.keys(value);
    if (keys.length !== 4 || keys.some((key) =>
      !["schema", "seed", "scenarioKey", "decisions"].includes(key))) return null;
    if (value.schema !== PRACTICE_SNAPSHOT_SCHEMA ||
      typeof value.seed !== "number" || !Number.isSafeInteger(value.seed) ||
      value.seed < 0 || value.seed > 0xffffffff) return null;
    const rounds = generatePracticeRounds(value.seed);
    if (value.scenarioKey !== JSON.stringify(rounds) ||
      !Array.isArray(value.decisions) || value.decisions.length > rounds.length ||
      !value.decisions.every((choice) => choice === "resolve" || choice === "escalate")) return null;
    return { seed: value.seed, decisions: [...value.decisions] as PracticeDecision[] };
  } catch {
    return null;
  }
}

export function encodePracticeSnapshot(snapshot: PracticeSnapshot): string | null {
  try {
    const raw = JSON.stringify({
      schema: PRACTICE_SNAPSHOT_SCHEMA,
      seed: snapshot.seed,
      scenarioKey: JSON.stringify(generatePracticeRounds(snapshot.seed)),
      decisions: snapshot.decisions,
    });
    return decodePracticeSnapshot(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** An answer belongs to the rendered seed and round; a stale callback cannot skip a case. */
export function advancePracticeSnapshot(
  snapshot: PracticeSnapshot,
  expectedSeed: number,
  expectedRound: number,
  decision: PracticeDecision,
): PracticeSnapshot {
  if (snapshot.seed !== expectedSeed || snapshot.decisions.length !== expectedRound ||
    !Number.isSafeInteger(expectedRound) || expectedRound < 0 ||
    expectedRound >= generatePracticeRounds(snapshot.seed).length ||
    (decision !== "resolve" && decision !== "escalate")) return snapshot;
  return { seed: snapshot.seed, decisions: [...snapshot.decisions, decision] };
}

type LoadState =
  | { phase: "loading" }
  | { phase: "ready"; board: ArenaScoreboard }
  | { phase: "unreachable"; reason: string };

const INTERNAL_MODEL_MARKER =
  /(?:^|[./:_-])(?:sov\d*|meok|owem|oowm)(?=$|[./:_-])/i;

export function isPublicArenaModelId(value: string): boolean {
  const id = value.trim();
  return Boolean(id) && !INTERNAL_MODEL_MARKER.test(id);
}

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Parse only the public, signed-arena shape. Bad rows are omitted, never coerced. */
export function parseArenaScoreboard(
  raw: unknown,
  source = ARENA_SCOREBOARD_ENDPOINT,
): ArenaScoreboard {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("arena payload is not an object");
  }
  const body = raw as Record<string, unknown>;
  const schema = typeof body.schema === "string" ? body.schema : "";
  if (!schema.startsWith("csoai.signed-arena-leaderboard/")) {
    throw new Error("arena payload has no supported signed-scoreboard schema");
  }
  const inputAxes = body.axis_pass_rates;
  if (!inputAxes || typeof inputAxes !== "object" || Array.isArray(inputAxes)) {
    throw new Error("arena payload carries no axis_pass_rates");
  }

  const axes: Record<string, ArenaAxis> = {};
  for (const [axisName, candidate] of Object.entries(
    inputAxes as Record<string, unknown>,
  )) {
    if (
      !axisName.trim() ||
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    )
      continue;
    const axis = candidate as Record<string, unknown>;
    const inputModels = axis.models;
    if (
      !inputModels ||
      typeof inputModels !== "object" ||
      Array.isArray(inputModels)
    )
      continue;
    const models: Record<string, ArenaModelScore> = {};
    for (const [modelId, candidateScore] of Object.entries(
      inputModels as Record<string, unknown>,
    )) {
      if (
        !isPublicArenaModelId(modelId) ||
        !candidateScore ||
        typeof candidateScore !== "object" ||
        Array.isArray(candidateScore)
      )
        continue;
      const score = candidateScore as Record<string, unknown>;
      const pass = finite(score.pass);
      const n = finite(score.n);
      const rate = finite(score.rate);
      if (
        pass === null ||
        n === null ||
        rate === null ||
        pass < 0 ||
        n < 0 ||
        rate < 0 ||
        rate > 1
      )
        continue;
      models[modelId] = { pass, n, rate };
    }
    const nRounds = finite(axis.n_rounds);
    if (nRounds !== null && nRounds >= 0 && Object.keys(models).length >= 2) {
      axes[axisName] = { nRounds, models };
    }
  }
  if (!Object.keys(axes).length)
    throw new Error("arena payload has no comparable public model rows");

  const sig =
    body.signature &&
    typeof body.signature === "object" &&
    !Array.isArray(body.signature)
      ? (body.signature as Record<string, unknown>)
      : null;
  const contentId = typeof sig?.content_id === "string" ? sig.content_id : "";
  const signature = typeof sig?.sig === "string" ? sig.sig : "";
  const keyId = typeof sig?.kid === "string" ? sig.kid : "";

  return {
    schema,
    asOf: typeof body.as_of === "string" ? body.as_of : null,
    nRounds: finite(body.n_rounds),
    source,
    axes,
    signature:
      contentId && signature && keyId ? { contentId, signature, keyId } : null,
  };
}

async function readJson(
  fetchImpl: typeof fetch,
  url: string,
  signal?: AbortSignal,
): Promise<unknown> {
  const response = await fetchImpl(url, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${url} answered HTTP ${response.status}`);
  const text = (await response.text()).replace(/^\uFEFF/, "").trim();
  if (!text || text.startsWith("<"))
    throw new Error(`${url} returned HTML, not JSON`);
  return JSON.parse(text);
}

/** Use the edge API in production and the same signed static artefact in local Vite. */
export async function fetchArenaScoreboard(
  fetchImpl: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<ArenaScoreboard> {
  try {
    return parseArenaScoreboard(
      await readJson(fetchImpl, ARENA_SCOREBOARD_ENDPOINT, signal),
      ARENA_SCOREBOARD_ENDPOINT,
    );
  } catch (primaryError) {
    if (signal?.aborted) throw primaryError;
    try {
      return parseArenaScoreboard(
        await readJson(fetchImpl, ARENA_SCOREBOARD_FALLBACK, signal),
        ARENA_SCOREBOARD_FALLBACK,
      );
    } catch (fallbackError) {
      const first =
        primaryError instanceof Error
          ? primaryError.message
          : String(primaryError);
      const second =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      throw new Error(`${first}; fallback failed: ${second}`);
    }
  }
}

export function arenaModelIds(axis: ArenaAxis): string[] {
  return Object.keys(axis.models).sort((a, b) => a.localeCompare(b));
}

/** Pick the axis with the largest observed rate spread; ordering is not significance. */
export function defaultArenaAxis(board: ArenaScoreboard): string {
  return Object.entries(board.axes)
    .map(([name, axis]) => {
      const rates = Object.values(axis.models).map((row) => row.rate);
      return {
        name,
        spread: Math.max(...rates) - Math.min(...rates),
        n: axis.nRounds,
      };
    })
    .sort(
      (a, b) =>
        b.spread - a.spread || b.n - a.n || a.name.localeCompare(b.name),
    )[0].name;
}

export function initialArenaPair(axis: ArenaAxis): [string, string] {
  const models = arenaModelIds(axis).sort(
    (a, b) => axis.models[b].n - axis.models[a].n || a.localeCompare(b),
  );
  return [models[0], models[1]];
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatStamp(value: string | null): string {
  if (!value) return "no as-of stamp";
  const stamp = new Date(value);
  return Number.isNaN(stamp.getTime())
    ? value
    : stamp.toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }) + " UTC";
}

function ModelReading({
  label,
  model,
  score,
}: {
  label: string;
  model: string;
  score: ArenaModelScore;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <h3 className="mt-2 break-all font-mono text-base font-semibold text-foreground">
        {model}
      </h3>
      <p className="mt-6 text-4xl font-semibold tabular-nums text-emerald-800">
        {pct(score.rate)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        observed pass rate · {score.pass} pass · n={score.n}
      </p>
    </article>
  );
}

export function PracticeArena() {
  const [practice, setPractice] = useState<PracticeSnapshot>({ seed: 42, decisions: [] });
  const { seed, decisions } = practice;
  const [practiceLoaded, setPracticeLoaded] = useState(false);
  const [saveRequested, setSaveRequested] = useState(false);
  const [saveNotice, setSaveNotice] = useState("Reading this tab's saved practice…");
  const rounds = useMemo(() => generatePracticeRounds(seed), [seed]);

  // Restore after mount so server-rendered markup and the first client render agree.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(PRACTICE_SESSION_STORAGE_KEY);
      const restored = decodePracticeSnapshot(raw);
      if (restored) {
        setPractice(restored);
        setSaveNotice("Practice restored for this tab. This is not verified evidence.");
      } else {
        setSaveNotice(raw
          ? "The saved attempt does not match the current cases. A new practice attempt is ready."
          : "Practice will be saved for this tab after your first choice.");
      }
    } catch {
      setSaveNotice("This browser cannot save practice. Leaving this pane will lose this attempt.");
    }
    setPracticeLoaded(true);
  }, []);

  // Do not overwrite an unread or rejected save merely by opening the pane.
  useEffect(() => {
    if (!practiceLoaded || !saveRequested) return;
    const raw = encodePracticeSnapshot(practice);
    if (!raw) {
      setSaveNotice("This attempt could not be saved. Leaving this pane will lose it.");
      return;
    }
    try {
      window.sessionStorage.setItem(PRACTICE_SESSION_STORAGE_KEY, raw);
      setSaveNotice("Practice saved for this tab. You can leave this pane and return.");
    } catch {
      setSaveNotice("This browser cannot save practice. Leaving this pane will lose this attempt.");
    }
  }, [practice, practiceLoaded, saveRequested]);
  const opponentDecisions = useMemo(
    () => simulatePracticeDecisions(rounds, 0.7, seed),
    [rounds, seed],
  );
  const currentRound = rounds[decisions.length] ?? null;
  const completed = decisions.length === rounds.length;
  const humanScore = completed
    ? scorePracticeDecisions(decisions, rounds)
    : null;
  const opponentScore = scorePracticeDecisions(opponentDecisions, rounds);
  const result = humanScore
    ? humanScore.f1 > opponentScore.f1
      ? "Human wins"
      : humanScore.f1 < opponentScore.f1
        ? "Simulated agent wins"
        : "Tie"
    : null;

  function choose(decision: PracticeDecision) {
    if (!practiceLoaded || !currentRound) return;
    setPractice((current) =>
      advancePracticeSnapshot(current, seed, decisions.length, decision),
    );
    setSaveRequested(true);
  }

  function reset(nextSeed = seed) {
    if (!practiceLoaded) return;
    setPractice({ seed: Math.trunc(nextSeed) >>> 0, decisions: [] });
    setSaveRequested(true);
  }

  return (
    <section
      aria-labelledby="boss-chair-title"
      className="mt-6 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-xl"
      data-testid="council-practice-arena"
    >
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-200">
              Private practice · simulated opponent
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              seed {seed} · round{" "}
              {Math.min(decisions.length + 1, rounds.length)}/{rounds.length}
            </span>
          </div>
          <h2
            id="boss-chair-title"
            className="mt-4 text-2xl font-semibold tracking-tight"
          >
            The Boss&apos;s Chair
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
            Decide what the Council may resolve and what must return to a
            person. You and a deterministic simulated agent face the same seeded
            cases.
          </p>
          <p role="status" aria-live="polite" className="mt-2 text-xs text-slate-300">
            {saveNotice}
          </p>

          {currentRound ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Incoming request · {currentRound.subject}
              </p>
              <p className="mt-3 text-lg leading-relaxed text-white">
                “{currentRound.body}”
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => choose("resolve")}
                  disabled={!practiceLoaded}
                  className="min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Resolve within scope
                </button>
                <button
                  type="button"
                  onClick={() => choose("escalate")}
                  disabled={!practiceLoaded}
                  className="min-h-12 rounded-xl bg-emerald-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Escalate to a person
                </button>
              </div>
            </div>
          ) : humanScore ? (
            <div className="mt-6 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">
                Scenario complete
              </p>
              <p className="mt-2 text-3xl font-semibold">{result}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-950/50 p-4">
                  <p className="text-xs text-slate-400">You · governance F1</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {pct(humanScore.f1)}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-950/50 p-4">
                  <p className="text-xs text-slate-400">
                    Simulation · governance F1
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {pct(opponentScore.f1)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => reset(seed + 1)}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200/30 px-4 text-sm font-semibold text-emerald-100 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" /> New seeded
                scenario
              </button>
            </div>
          ) : null}
        </div>

        <aside className="border-t border-white/10 bg-black/20 p-5 lg:border-l lg:border-t-0 sm:p-7">
          <Bot className="h-5 w-5 text-emerald-300" aria-hidden="true" />
          <h3 className="mt-4 text-sm font-semibold">
            What this run can become
          </h3>
          <ol className="mt-3 space-y-3 text-xs leading-relaxed text-slate-300">
            <li>
              <strong className="text-white">1. Practice:</strong> decisions
              remain in this browser.
            </li>
            <li>
              <strong className="text-white">2. Review:</strong> a person may
              inspect the case and method.
            </li>
            <li>
              <strong className="text-white">3. Candidate evidence:</strong>{" "}
              only explicit submission enters quarantine.
            </li>
            <li>
              <strong className="text-white">4. Admission:</strong> reproduction
              and the normal evidence gates are still required.
            </li>
          </ol>
          <div className="mt-5 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-[11px] leading-relaxed text-slate-300">
            <ShieldCheck
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"
              aria-hidden="true"
            />
            No model call, evidence admission, signing, or training reuse occurs
            in this practice run.
          </div>
        </aside>
      </div>
    </section>
  );
}

/**
 * The published decision ledger on the same log-scale timeline the legacy
 * CouncilSpace page used. Same honest contract: real records only, and an
 * explicit unreachable note when the upstream ledger cannot be read — never
 * simulated events.
 */
function LedgerTimelineSection() {
  const {
    data: ledger,
    error: ledgerError,
    fetchedAt,
  } = useLedger();
  const records = (ledger?.records || []).slice(0, 3);
  const hasEvents = records.length > 0;
  return (
    <section
      aria-label="Published decision ledger timeline"
      data-testid="arena-ledger-timeline"
      className="mt-6 rounded-2xl border border-emerald-300/60 bg-emerald-50/40 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-emerald-200 pb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            J-space · published timeline sample
          </p>
          <p className="mt-0.5 text-sm font-semibold text-emerald-950">
            Dated decisions, with their source state visible
          </p>
        </div>
        <div className="text-right text-xs text-emerald-900/80">
          {fetchedAt
            ? "current as of " +
              new Date(fetchedAt).toUTCString().replace("GMT", "UTC")
            : "loading…"}
          <a
            href="/live-ledger"
            className="ml-2 font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:underline"
          >
            Open the full ledger →
          </a>
        </div>
      </div>
      {ledgerError && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
          Upstream unavailable ({ledgerError}). The ledger is not visible right
          now — this is rendered honestly, not simulated.
        </p>
      )}
      {hasEvents && (
        <div className="mt-3 overflow-hidden rounded-lg">
          <JSpaceTimeline events={decisionsToTimelineEvents(records)} />
        </div>
      )}
    </section>
  );
}

export default function DashboardArenaPane({
  initialData,
  fetchImpl = fetch,
}: {
  initialData?: ArenaScoreboard;
  fetchImpl?: typeof fetch;
}) {
  const [state, setState] = useState<LoadState>(() =>
    initialData ? { phase: "ready", board: initialData } : { phase: "loading" },
  );
  const [axisName, setAxisName] = useState<string>(() =>
    initialData ? defaultArenaAxis(initialData) : "",
  );
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");

  useEffect(() => {
    if (initialData) return;
    const controller = new AbortController();
    let current = true;
    fetchArenaScoreboard(fetchImpl, controller.signal)
      .then((board) => {
        if (!current) return;
        setState({ phase: "ready", board });
        setAxisName(defaultArenaAxis(board));
      })
      .catch((error: unknown) => {
        if (!current || controller.signal.aborted) return;
        setState({
          phase: "unreachable",
          reason: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      current = false;
      controller.abort();
    };
  }, [fetchImpl, initialData]);

  const board = state.phase === "ready" ? state.board : null;
  const axis = board && axisName ? board.axes[axisName] : null;
  const models = useMemo(() => (axis ? arenaModelIds(axis) : []), [axis]);

  useEffect(() => {
    if (!axis) return;
    const [first, second] = initialArenaPair(axis);
    setLeft(first);
    setRight(second);
  }, [axisName, axis]);

  const effectivePair = axis
    ? initialArenaPair(axis)
    : (["", ""] as [string, string]);
  const leftId = left && axis?.models[left] ? left : effectivePair[0];
  const rightId =
    right && right !== leftId && axis?.models[right]
      ? right
      : effectivePair.find((id) => id !== leftId) || effectivePair[1];
  const leftScore = axis?.models[leftId];
  const rightScore = axis?.models[rightId];
  const delta =
    leftScore && rightScore
      ? Math.abs(leftScore.rate - rightScore.rate) * 100
      : null;

  return (
    <div
      className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8"
      data-testid="dashboard-arena-pane"
    >
      <header className="border-b border-border pb-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Council of AI · human-in-the-loop arena
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Swords className="h-5 w-5 text-emerald-700" aria-hidden="true" />{" "}
            Practice decisions, then inspect evidence
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The practice arena keeps a person in control. The historical replay
            below remains a separate read-only artefact and never updates the
            living GSPC board.
          </p>
          <a href="/world/observatory/" className="mt-3 inline-flex text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:underline">
            Explore the dated, source-linked simulation observatory →
          </a>
        </div>
      </header>

      <MunderDuel />
      <PracticeArena />

      <LedgerTimelineSection />

      {state.phase === "loading" && (
        <p
          role="status"
          className="mt-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground"
        >
          Reading the arena scoreboard…
        </p>
      )}
      {state.phase === "unreachable" && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <strong>UNREACHABLE.</strong> The signed scoreboard could not be read
          ({state.reason}). No substitute models or scores are shown.
        </div>
      )}

      {board && axis && leftScore && rightScore && (
        <>
          <aside className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950 sm:flex-row sm:items-start sm:justify-between">
            <p>
              <strong>Historical taxonomy boundary.</strong> The replay source
              uses a legacy, noncanonical 15-axis arena taxonomy. It is not the
              canonical GSPC board, and replaying it creates no current
              ranking or measurement. Most of its axes read 0.0 because of a
              keyword-grader defect: a 0.0 here is not a model score.
            </p>
            <span className="w-fit shrink-0 rounded-full border border-amber-700/20 bg-white/60 px-2.5 py-1 font-mono text-[10px] font-semibold text-amber-950">
              {board.signature
                ? "SIGNED HISTORICAL ARTEFACT"
                : "HISTORICAL · SIGNATURE UNCHECKABLE"}
            </span>
          </aside>
          <section
            aria-label="Arena replay controls"
            className="mt-6 grid gap-3 rounded-2xl border border-border bg-muted/35 p-4 md:grid-cols-3"
          >
            <label className="text-xs font-medium text-foreground">
              Historical arena axis
              <select
                value={axisName}
                onChange={(event) => setAxisName(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(board.axes)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([name, row]) => (
                    <option key={name} value={name}>
                      {name} · {row.nRounds} rounds
                    </option>
                  ))}
              </select>
            </label>
            <label className="text-xs font-medium text-foreground">
              Model A
              <select
                value={leftId}
                onChange={(event) => setLeft(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {models.map((model) => (
                  <option
                    key={model}
                    value={model}
                    disabled={model === rightId}
                  >
                    {model}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-foreground">
              Model B
              <select
                value={rightId}
                onChange={(event) => setRight(event.target.value)}
                className="mt-1.5 min-h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              >
                {models.map((model) => (
                  <option key={model} value={model} disabled={model === leftId}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section
            aria-label={`Recorded historical ${axisName} comparison`}
            className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch"
          >
            <ModelReading label="Model A" model={leftId} score={leftScore} />
            <div className="flex items-center justify-center px-2 py-1 text-center md:w-28">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {delta === 0
                  ? "Same observed rate"
                  : `${delta?.toFixed(1)} percentage-point difference`}
                <span className="mt-1 block font-medium text-foreground">
                  ordering only
                </span>
              </p>
            </div>
            <ModelReading label="Model B" model={rightId} score={rightScore} />
          </section>

          <p className="mt-3 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-muted-foreground">
            The selector reports the two historical recorded rates on{" "}
            <strong className="text-foreground">{axisName}</strong>. It does not
            claim statistical separation, overall superiority, present
            availability, or compliance. Different n values remain visible.
          </p>

          {/* Tools audit, 6 Oct 2026: an empty "Live prompt battle" box read as a broken tool. It is
              drawn only once a published endpoint exists; DASHBOARD_ARENA_CONTRACT still records the
              boundary (UNCHECKABLE, endpoint null) for anyone reading the contract. */}
          {DASHBOARD_ARENA_CONTRACT.livePromptBattle.endpoint !== null && (
          <section
            aria-labelledby="live-battle-boundary"
            className="mt-6 rounded-2xl border border-dashed border-amber-400 bg-amber-50/60 p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="live-battle-boundary"
                className="text-sm font-semibold text-amber-950"
              >
                Live prompt battle
              </h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-950">
                UNCHECKABLE
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-950/80">
              No published endpoint currently accepts one prompt plus two model
              identifiers. <code>/api/chat</code> is one grounded Council lane,
              and the AG-UI GSPC stream is presentation over the living board.
              The interface will not duplicate one answer into two columns and
              call it a battle.
            </p>
          </section>
          )}

          <footer className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            <a
              href={board.source}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:underline"
            >
              Read source{" "}
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <span className="text-muted-foreground">
              {formatStamp(board.asOf)}
              {board.nRounds !== null
                ? ` · ${board.nRounds.toLocaleString("en-GB")} recorded rounds`
                : ""}
            </span>
          </footer>
          <details className="mt-3 text-xs" data-testid="arena-raw-links">
            <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
              Raw data (for developers)
            </summary>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href="/api/arena/rounds"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-800 hover:underline"
              >
                Round feed
              </a>
              <a
                href="/api/arena/scoreboard?verify=1"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-800 hover:underline"
              >
                Recompute content id
              </a>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
