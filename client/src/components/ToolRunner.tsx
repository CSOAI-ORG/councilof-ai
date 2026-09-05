import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  LockKeyhole,
  Play,
  RefreshCw,
  Server,
} from "lucide-react";
import {
  TOOL_META,
  callTool,
  listTools,
  type SovTool,
  type ToolResult,
} from "../lib/sovTools";

export type JsonSchema = {
  type?:
    | "object"
    | "array"
    | "string"
    | "number"
    | "integer"
    | "boolean"
    | "null";
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  enum?: unknown[];
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  default?: unknown;
};

export type RunnerTool = Omit<SovTool, "inputSchema"> & {
  inputSchema?: JsonSchema;
  csoai?: {
    paid?: boolean;
    rail?: string;
    route?: string;
    sku?: string;
  };
};

export type RunnerToolResult = Omit<ToolResult, "state"> & {
  state: "runtime_observed" | "unreachable" | "unchecked";
  structuredContent?: unknown;
};

export type ToolResultSummary = {
  headline: string;
  detail: string;
  metrics: Array<{ label: string; value: string }>;
  source?: string;
};

// Keep this runner aligned with the current-master bridge, which calls /mcp.
const MCP_RPC_ENDPOINT = "/mcp";

function normalizeToolResult(result: ToolResult): RunnerToolResult {
  const richer = result as ToolResult &
    Partial<Pick<RunnerToolResult, "state" | "structuredContent">>;
  const raw =
    result.raw && typeof result.raw === "object" && !Array.isArray(result.raw)
      ? (result.raw as Record<string, unknown>)
      : null;
  const rawResult =
    raw?.result && typeof raw.result === "object" && !Array.isArray(raw.result)
      ? (raw.result as Record<string, unknown>)
      : null;
  const structuredContent =
    richer.structuredContent ?? rawResult?.structuredContent;
  const state =
    richer.state ||
    (result.ok
      ? "runtime_observed"
      : /(?:couldn.t reach|unreachable|connection|network|fetch)/i.test(
            result.text,
          )
        ? "unreachable"
        : "unchecked");
  return { ...result, state, structuredContent };
}

type FieldDraft = string | boolean;
type ToolDraft = Record<string, FieldDraft>;

export type ToolArgumentsResult =
  | { ok: true; args: Record<string, unknown> }
  | { ok: false; errors: Record<string, string> };

type FieldKind =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "json-or-string";

function schemaTypes(schema: JsonSchema): string[] {
  const choices = schema.anyOf || schema.oneOf || [];
  return [schema.type, ...choices.map((choice) => choice.type)].filter(
    (value): value is NonNullable<JsonSchema["type"]> => Boolean(value),
  );
}

export function fieldKind(schema: JsonSchema): FieldKind {
  const types = schemaTypes(schema);
  if (types.includes("object") && types.includes("string"))
    return "json-or-string";
  if (types.includes("boolean")) return "boolean";
  if (types.includes("integer")) return "integer";
  if (types.includes("number")) return "number";
  if (types.includes("object")) return "object";
  if (types.includes("array")) return "array";
  return "string";
}

export function initialToolDraft(tool: RunnerTool): ToolDraft {
  const draft: ToolDraft = {};
  for (const [name, schema] of Object.entries(
    tool.inputSchema?.properties || {},
  )) {
    const kind = fieldKind(schema);
    if (kind === "boolean") draft[name] = schema.default === true;
    else if (schema.default !== undefined) {
      draft[name] =
        typeof schema.default === "string"
          ? schema.default
          : JSON.stringify(schema.default, null, 2);
    } else draft[name] = "";
  }
  return draft;
}

/** Prefill only fields that the selected tool actually advertises. */
export function prefillToolDraft(
  tool: RunnerTool,
  initialArguments?: Record<string, string | boolean>,
): ToolDraft {
  const draft = initialToolDraft(tool);
  if (!initialArguments) return draft;
  for (const name of Object.keys(tool.inputSchema?.properties || {})) {
    const value = initialArguments[name];
    if (typeof value === "string" || typeof value === "boolean") {
      draft[name] = value;
    }
  }
  return draft;
}

function parseJsonField(raw: string, kind: "object" | "array"): unknown {
  const parsed = JSON.parse(raw);
  if (
    kind === "object" &&
    (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
  ) {
    throw new Error("Enter a JSON object, beginning with { and ending with }.");
  }
  if (kind === "array" && !Array.isArray(parsed)) {
    throw new Error("Enter a JSON array, beginning with [ and ending with ].");
  }
  return parsed;
}

/** Convert form drafts into the types advertised by the tool's JSON Schema. */
export function coerceToolArguments(
  tool: RunnerTool,
  draft: ToolDraft,
): ToolArgumentsResult {
  const properties = tool.inputSchema?.properties || {};
  const required = new Set(tool.inputSchema?.required || []);
  const errors: Record<string, string> = {};
  const args: Record<string, unknown> = {};

  for (const [name, schema] of Object.entries(properties)) {
    const kind = fieldKind(schema);
    const value = draft[name];

    if (kind === "boolean") {
      args[name] = value === true;
      continue;
    }

    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) {
      if (required.has(name)) errors[name] = "Required.";
      continue;
    }

    try {
      if (kind === "number" || kind === "integer") {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) throw new Error("Enter a valid number.");
        if (kind === "integer" && !Number.isInteger(parsed))
          throw new Error("Enter a whole number.");
        if (typeof schema.minimum === "number" && parsed < schema.minimum) {
          throw new Error(`Minimum ${schema.minimum}.`);
        }
        if (typeof schema.maximum === "number" && parsed > schema.maximum) {
          throw new Error(`Maximum ${schema.maximum}.`);
        }
        args[name] = parsed;
      } else if (kind === "object" || kind === "array") {
        args[name] = parseJsonField(raw, kind);
      } else if (kind === "json-or-string") {
        args[name] = raw.startsWith("{") ? parseJsonField(raw, "object") : raw;
      } else {
        if (schema.pattern) {
          let pattern: RegExp | null = null;
          try {
            pattern = new RegExp(schema.pattern);
          } catch {
            pattern = null;
          }
          if (pattern && !pattern.test(raw))
            throw new Error("Does not match the required format.");
        }
        args[name] = raw;
      }
    } catch (error) {
      errors[name] = error instanceof Error ? error.message : "Invalid value.";
    }
  }

  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, args };
}

export function isPaidTool(tool: RunnerTool): boolean {
  return tool.csoai?.paid === true;
}

export function resultOutcome(result: RunnerToolResult): string | null {
  const payload = result.structuredContent;
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return null;
  const status = (payload as { status?: unknown }).status;
  return typeof status === "string" && status.trim() ? status.trim() : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function countMetric(
  counts: unknown,
  name: string,
  label: string,
): { label: string; value: string } | null {
  if (!Array.isArray(counts)) return null;
  const row = counts
    .map(record)
    .find((candidate) => candidate?.name === name);
  const value = row?.value;
  return typeof value === "number" || typeof value === "string"
    ? { label, value: String(value) }
    : null;
}

/**
 * Turn known structured MCP payloads into a small human-readable result.
 * The raw reply remains available below this summary: presentation never
 * replaces evidence, changes its state, or claims more than the tool returned.
 */
export function summarizeToolResult(
  toolName: string,
  result: RunnerToolResult,
): ToolResultSummary | null {
  if (!result.ok) return null;
  const payload = record(result.structuredContent);
  if (!payload) return null;

  if (toolName === "board_totals" || payload.kind === "live-board-totals") {
    const publicCount =
      typeof payload.public_count === "string"
        ? payload.public_count
        : "Board totals returned";
    const state =
      typeof payload.state === "string" ? payload.state : "RUNTIME_OBSERVED";
    const metrics = [
      countMetric(payload.counts, "axis_slots", "Axis slots"),
      countMetric(payload.counts, "measured", "Measured"),
      countMetric(payload.counts, "unmeasured", "Unmeasured"),
    ].filter(
      (metric): metric is { label: string; value: string } => metric !== null,
    );
    return {
      headline: publicCount,
      detail: `${state} board read. Slots and measurements are different counts; this result is not a certification.`,
      metrics,
      source:
        typeof payload.source === "string" ? payload.source : undefined,
    };
  }

  const outcome = resultOutcome(result);
  if (!outcome) return null;
  return {
    headline: outcome,
    detail:
      "Endpoint outcome from this runtime call. Inspect the raw response for its evidence scope and limitations.",
    metrics: [],
  };
}

function fieldPlaceholder(name: string, kind: FieldKind): string {
  if (kind === "object") return '{\n  "key": "value"\n}';
  if (kind === "array") return '[\n  "value"\n]';
  if (kind === "json-or-string")
    return "Paste a card URL, JSON string, or JSON object";
  if (name === "x_payment") return "Paste the wallet-signed x402 payload";
  return name;
}

function StateBadge({
  state,
  count,
}: {
  state: "loading" | "catalogued" | "unreachable";
  count?: number;
}) {
  const styles =
    state === "catalogued"
      ? "border-emerald-700/20 bg-emerald-50 text-emerald-800"
      : state === "unreachable"
        ? "border-amber-700/25 bg-amber-50 text-amber-900"
        : "border-slate-900/10 bg-slate-100 text-slate-600";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${styles}`}
    >
      {state === "loading"
        ? "Reading tools/list"
        : state === "unreachable"
          ? "UNREACHABLE"
          : `CATALOGUED · ${count || 0}`}
    </span>
  );
}

export default function ToolRunner({
  initialToolName,
  initialArguments,
}: {
  initialToolName?: string;
  initialArguments?: Record<string, string | boolean>;
}) {
  const [tools, setTools] = useState<RunnerTool[]>([]);
  const [listState, setListState] = useState<
    "loading" | "catalogued" | "unreachable"
  >("loading");
  const [listReason, setListReason] = useState("");
  const [active, setActive] = useState<RunnerTool | null>(null);
  const [draft, setDraft] = useState<ToolDraft>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<{
    result: RunnerToolResult;
    observedAt: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"" | "copied" | "blocked">("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setListState("loading");
    setListReason("");
    listTools().then((reply) => {
      if (cancelled) return;
      if (reply.state !== "ok") {
        setListState("unreachable");
        setListReason(reply.reason);
        setTools([]);
        setActive(null);
        return;
      }
      setListState("catalogued");
      const advertisedTools = reply.tools as RunnerTool[];
      setTools(advertisedTools);
      const first =
        advertisedTools.find((tool) => tool.name === initialToolName) ||
        advertisedTools.find((tool) => tool.name === "board_totals") ||
        advertisedTools[0] ||
        null;
      setActive(first);
      setDraft(first ? prefillToolDraft(first, initialArguments) : {});
    });
    return () => {
      cancelled = true;
    };
  }, [initialArguments, initialToolName, reloadKey]);

  const groups = useMemo(
    () => [
      {
        label: "Free reads & verification",
        tools: tools.filter((tool) => !isPaidTool(tool)),
      },
      { label: "Metered evidence paths", tools: tools.filter(isPaidTool) },
    ],
    [tools],
  );

  const properties = active?.inputSchema?.properties || {};
  const required = new Set(active?.inputSchema?.required || []);
  const outputSummary = useMemo(
    () =>
      active && output
        ? summarizeToolResult(active.name, output.result)
        : null,
    [active, output],
  );

  function pick(tool: RunnerTool) {
    setActive(tool);
    setDraft(initialToolDraft(tool));
    setErrors({});
    setOutput(null);
    setCopied("");
  }

  function setField(name: string, value: FieldDraft) {
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function run() {
    if (!active || busy) return;
    const parsed = coerceToolArguments(active, draft);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }
    setErrors({});
    setOutput(null);
    setBusy(true);
    const result = normalizeToolResult(
      await callTool(active.name, parsed.args),
    );
    setOutput({ result, observedAt: new Date().toISOString() });
    setBusy(false);
  }

  function copyOutput() {
    if (!output) return;
    const done = (next: "copied" | "blocked") => {
      setCopied(next);
      window.setTimeout(() => setCopied(""), 1800);
    };
    try {
      const request = navigator.clipboard?.writeText(output.result.text);
      if (!request) done("blocked");
      else
        request.then(
          () => done("copied"),
          () => done("blocked"),
        );
    } catch {
      done("blocked");
    }
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-[0_18px_50px_-38px_rgba(4,18,12,.55)]"
      aria-labelledby="mcp-runner-title"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-900/10 bg-slate-50/80 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#04624a] text-white"
            aria-hidden="true"
          >
            <Server className="h-4 w-4" />
          </span>
          <div>
            <h2
              id="mcp-runner-title"
              className="text-sm font-semibold text-slate-950"
            >
              Public MCP tool runner
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
              JSON-RPC <code className="font-mono text-[11px]">tools/list</code>{" "}
              and <code className="font-mono text-[11px]">tools/call</code>{" "}
              against <code className="font-mono text-[11px]">POST /mcp</code>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StateBadge state={listState} count={tools.length} />
          {listState === "unreachable" ? (
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
            </button>
          ) : null}
        </div>
      </header>

      {listState === "unreachable" ? (
        <div
          className="m-5 rounded-xl border border-amber-700/25 bg-amber-50 p-4"
          role="status"
        >
          <div className="flex gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-800"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-amber-950">
                The callable catalogue could not be read.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900">
                UNREACHABLE · {listReason || "POST /mcp did not answer."} No
                cached tool is shown as live.
              </p>
            </div>
          </div>
        </div>
      ) : listState === "loading" ? (
        <div
          className="m-5 rounded-xl border border-slate-900/10 bg-slate-50 p-5 text-sm text-slate-600"
          role="status"
        >
          Reading the current catalogue from{" "}
          <code className="font-mono text-xs">{MCP_RPC_ENDPOINT}</code>…
        </div>
      ) : (
        <div className="grid min-h-[34rem] lg:grid-cols-[17rem_minmax(0,1fr)]">
          <nav
            className="border-b border-slate-900/10 bg-slate-50/55 p-3 lg:border-b-0 lg:border-r"
            aria-label="Callable MCP tools"
          >
            {groups.map((group) =>
              group.tools.length ? (
                <div key={group.label} className="mb-5 last:mb-0">
                  <p className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                    {group.label}
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {group.tools.map((tool) => {
                      const meta = TOOL_META[tool.name] || {
                        glyph: "›",
                        label: tool.name,
                      };
                      const selected = active?.name === tool.name;
                      return (
                        <button
                          key={tool.name}
                          type="button"
                          onClick={() => pick(tool)}
                          aria-current={selected ? "page" : undefined}
                          className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition ${selected ? "bg-[#04624a] text-white shadow-sm" : "text-slate-700 hover:bg-white hover:text-slate-950"}`}
                        >
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${selected ? "bg-white/12" : "bg-emerald-50 text-emerald-800"}`}
                          >
                            {meta.glyph}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold">
                              {meta.label}
                            </span>
                            <code
                              className={`block truncate text-[9px] ${selected ? "text-emerald-50/70" : "text-slate-500"}`}
                            >
                              {tool.name}
                            </code>
                          </span>
                          <ChevronRight
                            className={`h-3.5 w-3.5 shrink-0 ${selected ? "text-white/70" : "text-slate-400"}`}
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null,
            )}
          </nav>

          {active ? (
            <div className="min-w-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {TOOL_META[active.name]?.label || active.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isPaidTool(active) ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}
                    >
                      {isPaidTool(active) ? "x402 metered path" : "free"}
                    </span>
                  </div>
                  <code className="mt-1 block text-[11px] text-slate-500">
                    {active.name}
                  </code>
                </div>
                <span className="rounded-full border border-slate-900/10 bg-slate-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                  CATALOGUED
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-700">
                {active.description}
              </p>

              {isPaidTool(active) ? (
                <div className="mt-4 flex gap-2.5 rounded-xl border border-amber-700/20 bg-amber-50 px-3.5 py-3">
                  <LockKeyhole
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-800"
                    aria-hidden="true"
                  />
                  <p className="text-xs leading-relaxed text-amber-950">
                    Run without{" "}
                    <code className="font-mono text-[11px]">x_payment</code> to
                    receive the route’s 402 challenge and any published free
                    preview. Nothing is charged by that call. This page never
                    asks for a seed phrase or private key and does not sign
                    wallet payments.
                  </p>
                </div>
              ) : null}

              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run();
                }}
                noValidate
              >
                {Object.keys(properties).length ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {Object.entries(properties).map(([name, schema]) => {
                      const kind = fieldKind(schema);
                      const id = `mcp-${active.name}-${name}`;
                      const error = errors[name];
                      const fullWidth =
                        kind === "object" ||
                        kind === "array" ||
                        kind === "json-or-string" ||
                        name.endsWith("_b64") ||
                        name === "x_payment";

                      if (kind === "boolean")
                        return (
                          <label
                            key={name}
                            htmlFor={id}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${fullWidth ? "xl:col-span-2" : ""} ${draft[name] === true ? "border-emerald-700/30 bg-emerald-50" : "border-slate-900/10 bg-slate-50/70"}`}
                          >
                            <input
                              id={id}
                              type="checkbox"
                              checked={draft[name] === true}
                              onChange={(event) =>
                                setField(name, event.target.checked)
                              }
                              className="mt-0.5 h-4 w-4 accent-[#04624a]"
                            />
                            <span>
                              <span className="block text-xs font-semibold text-slate-950">
                                {name}
                              </span>
                              {schema.description ? (
                                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-600">
                                  {schema.description}
                                </span>
                              ) : null}
                            </span>
                          </label>
                        );

                      const textarea =
                        kind === "object" ||
                        kind === "array" ||
                        kind === "json-or-string" ||
                        name.endsWith("_b64");
                      const commonClass = `mt-1.5 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:ring-2 ${error ? "border-rose-500 focus:border-rose-600 focus:ring-rose-600/15" : "border-slate-900/15 focus:border-emerald-700 focus:ring-emerald-700/15"}`;
                      return (
                        <label
                          key={name}
                          htmlFor={id}
                          className={fullWidth ? "xl:col-span-2" : ""}
                        >
                          <span className="block text-xs font-semibold text-slate-950">
                            {name}
                            {required.has(name) ? (
                              <span className="text-rose-700"> *</span>
                            ) : (
                              <span className="font-normal text-slate-500">
                                {" "}
                                · optional
                              </span>
                            )}
                          </span>
                          {schema.description ? (
                            <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-600">
                              {schema.description}
                            </span>
                          ) : null}
                          {textarea ? (
                            <textarea
                              id={id}
                              rows={
                                kind === "object" || kind === "json-or-string"
                                  ? 5
                                  : 3
                              }
                              value={String(draft[name] || "")}
                              onChange={(event) =>
                                setField(name, event.target.value)
                              }
                              placeholder={fieldPlaceholder(name, kind)}
                              aria-invalid={Boolean(error)}
                              aria-describedby={
                                error ? `${id}-error` : undefined
                              }
                              className={`${commonClass} resize-y font-mono text-xs`}
                              spellCheck={false}
                            />
                          ) : schema.enum?.length ? (
                            <select
                              id={id}
                              value={String(draft[name] || "")}
                              onChange={(event) =>
                                setField(name, event.target.value)
                              }
                              aria-invalid={Boolean(error)}
                              className={commonClass}
                            >
                              {!required.has(name) ? (
                                <option value="">Not set</option>
                              ) : null}
                              {schema.enum.map((option) => (
                                <option
                                  key={String(option)}
                                  value={String(option)}
                                >
                                  {String(option)}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              id={id}
                              type={
                                name === "x_payment"
                                  ? "password"
                                  : kind === "number" || kind === "integer"
                                    ? "number"
                                    : "text"
                              }
                              step={
                                kind === "integer"
                                  ? 1
                                  : kind === "number"
                                    ? "any"
                                    : undefined
                              }
                              min={schema.minimum}
                              max={schema.maximum}
                              value={String(draft[name] || "")}
                              onChange={(event) =>
                                setField(name, event.target.value)
                              }
                              placeholder={fieldPlaceholder(name, kind)}
                              aria-invalid={Boolean(error)}
                              aria-describedby={
                                error ? `${id}-error` : undefined
                              }
                              className={commonClass}
                              autoComplete="off"
                            />
                          )}
                          {error ? (
                            <span
                              id={`${id}-error`}
                              className="mt-1 block text-[11px] font-semibold text-rose-700"
                              role="alert"
                            >
                              {error}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-900/10 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                    This tool takes no arguments.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#04624a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#03513e] disabled:cursor-wait disabled:opacity-60"
                >
                  {busy ? (
                    <RefreshCw
                      className="h-4 w-4 animate-spin motion-reduce:animate-none"
                      aria-hidden="true"
                    />
                  ) : (
                    <Play className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy
                    ? "Calling POST /mcp…"
                    : isPaidTool(active)
                      ? "Call metered path"
                      : "Run tool"}
                </button>
              </form>

              {output ? (
                <section
                  className={`mt-6 overflow-hidden rounded-xl border ${output.result.ok ? "border-emerald-700/25" : output.result.state === "unreachable" ? "border-amber-700/25" : "border-rose-700/20"}`}
                  aria-live="polite"
                >
                  <header
                    className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3 ${output.result.ok ? "bg-emerald-50" : output.result.state === "unreachable" ? "bg-amber-50" : "bg-rose-50"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {output.result.ok ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 text-emerald-800"
                          aria-hidden="true"
                        />
                      ) : (
                        <AlertTriangle
                          className="mt-0.5 h-4 w-4 text-amber-800"
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                          {output.result.ok
                            ? "RUNTIME_OBSERVED"
                            : output.result.state === "unreachable"
                              ? "UNREACHABLE"
                              : "UNCHECKABLE"}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-600">
                          {active.name} · {output.observedAt}
                          {resultOutcome(output.result)
                            ? ` · outcome ${resultOutcome(output.result)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {copied ? (
                        <span className="text-[10px] font-semibold text-slate-600">
                          {copied === "copied" ? "Copied" : "Clipboard blocked"}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={copyOutput}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
                      </button>
                    </div>
                  </header>
                  {outputSummary ? (
                    <div
                      className="border-t border-emerald-900/10 bg-white px-4 py-4"
                      aria-label="Tool result summary"
                    >
                      <p className="text-base font-semibold text-slate-950">
                        {outputSummary.headline}
                      </p>
                      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600">
                        {outputSummary.detail}
                      </p>
                      {outputSummary.metrics.length ? (
                        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                          {outputSummary.metrics.map((metric) => (
                            <div
                              key={metric.label}
                              className="rounded-lg border border-slate-900/10 bg-slate-50 px-3 py-2.5"
                            >
                              <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                                {metric.label}
                              </dt>
                              <dd className="mt-0.5 text-lg font-semibold text-slate-950">
                                {metric.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : null}
                      {outputSummary.source ? (
                        <p className="mt-3 break-all text-[10px] text-slate-500">
                          Payload source: {outputSummary.source}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  <details
                    className="group border-t border-slate-900/10 bg-[#04120c]"
                    open={
                      !outputSummary &&
                      output.result.text.length < 4000
                    }
                  >
                    <summary className="cursor-pointer list-none px-4 py-3 text-[11px] font-semibold text-emerald-50 marker:hidden hover:bg-white/5">
                      <span className="group-open:hidden">
                        Show complete raw MCP response
                      </span>
                      <span className="hidden group-open:inline">
                        Hide complete raw MCP response
                      </span>
                    </summary>
                    <pre className="max-h-[30rem] overflow-auto border-t border-white/10 p-4 font-mono text-[11.5px] leading-relaxed text-emerald-50">
                      <code>{output.result.text}</code>
                    </pre>
                  </details>
                  <footer className="border-t border-slate-900/10 bg-slate-50 px-4 py-2.5 text-[10px] leading-relaxed text-slate-600">
                    Source:{" "}
                    <code className="font-mono">POST {MCP_RPC_ENDPOINT}</code> ·
                    executor: public MCP endpoint · this state describes this
                    call only. A successful call does not make its payload
                    MEASURED, REPRODUCED or SIGNED unless the returned evidence
                    independently says so.
                  </footer>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="p-6" role="status">
              <div className="rounded-xl border border-dashed border-slate-900/15 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  tools/list returned an empty catalogue.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  CATALOGUED · 0. No fallback tools are invented in the browser.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
