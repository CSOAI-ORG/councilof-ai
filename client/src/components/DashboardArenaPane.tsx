import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Swords } from "lucide-react";

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
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-800">
            Council of AI · recorded legacy replay
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <Swords className="h-5 w-5 text-emerald-700" aria-hidden="true" />{" "}
            Compare two historical subjects
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Select two models and one recorded legacy axis. This replays a
            historical artefact; it does not choose who writes the dashboard
            chat reply or update the living GSPC board.
          </p>
        </div>
        <span className="w-fit rounded-full border border-emerald-700/25 bg-emerald-50 px-2.5 py-1 font-mono text-[10px] font-semibold text-emerald-900">
          {board?.signature
            ? "SIGNED HISTORICAL ARTEFACT"
            : state.phase === "loading"
              ? "LOADING"
              : state.phase === "unreachable"
                ? "UNREACHABLE"
                : "MEASURED · SIGNATURE UNCHECKABLE"}
        </span>
      </header>

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
          <aside className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
            <strong>Historical taxonomy boundary.</strong> The replay source
            uses a legacy, noncanonical 15-axis arena taxonomy. It is not the
            canonical 22-axis GSPC board, and replaying it creates no current
            ranking or measurement.
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
            <span className="text-muted-foreground">
              {formatStamp(board.asOf)}
              {board.nRounds !== null
                ? ` · ${board.nRounds.toLocaleString("en-GB")} recorded rounds`
                : ""}
            </span>
          </footer>
        </>
      )}
    </div>
  );
}
