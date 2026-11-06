import { useEffect, useId, useMemo, useRef, useState } from "react";
import X402PayButton, {
  type X402ExecutionResult,
} from "@/components/X402PayButton";
import type { X402Challenge } from "@/lib/x402Wallet";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Search,
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
import { stateMeaning } from "@/lib/resultCard";
import { hashArgs, recordToolReceipt } from "@/lib/toolReceipts";

export type JsonSchema = {
  type?:
    "object" | "array" | "string" | "number" | "integer" | "boolean" | "null";
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

export type PaymentContext = Readonly<{
  toolName: string;
  args: Readonly<Record<string, unknown>>;
  draftVersion: number;
}>;

function cloneAndFreezeJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return Object.freeze(value.map(cloneAndFreezeJson));
  }
  if (value && typeof value === "object") {
    const cloned = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        cloneAndFreezeJson(item),
      ]),
    );
    return Object.freeze(cloned);
  }
  return value;
}

/** Bind a 402 challenge to the exact typed tool call that produced it. */
export function createPaymentContext(
  toolName: string,
  args: Record<string, unknown>,
  draftVersion: number,
): PaymentContext {
  return Object.freeze({
    toolName,
    args: cloneAndFreezeJson(args) as Readonly<Record<string, unknown>>,
    draftVersion,
  });
}

export function paymentContextMatches(
  context: PaymentContext,
  toolName: string | null,
  draftVersion: number,
): boolean {
  return context.toolName === toolName && context.draftVersion === draftVersion;
}

export function paymentCallForContext(
  context: PaymentContext,
  paymentHeader: string,
): { toolName: string; args: Record<string, unknown> } {
  return {
    toolName: context.toolName,
    args: { ...context.args, x_payment: paymentHeader },
  };
}

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

/**
 * Pull an x402 challenge out of a tool result. A door answers 402 with an
 * `accepts` array; we sign the FIRST entry only, and we return null rather
 * than guess when the fields a signature needs are not all present.
 */
function resourceUrl(value: unknown): string | null {
  if (typeof value === "string" && /^https?:\/\//.test(value)) return value;
  if (value && typeof value === "object") {
    const url = (value as { url?: unknown }).url;
    if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
  }
  return null;
}

export function challengeFromResult(
  result: RunnerToolResult,
): X402Challenge | null {
  const roots: unknown[] = [
    result.structuredContent,
    (result as { raw?: unknown }).raw,
  ];
  const raw = (result as { raw?: Record<string, unknown> }).raw;
  const rpcResult =
    raw && typeof raw.result === "object" && raw.result
      ? (raw.result as Record<string, unknown>)
      : null;
  if (rpcResult?.structuredContent) roots.push(rpcResult.structuredContent);
  for (const root of roots) {
    if (!root || typeof root !== "object") continue;
    const bag = root as Record<string, unknown>;
    const nested =
      bag.error && typeof bag.error === "object"
        ? (bag.error as Record<string, unknown>)
        : null;
    const paymentRequired =
      bag.payment_required && typeof bag.payment_required === "object"
        ? (bag.payment_required as Record<string, unknown>)
        : null;
    for (const holder of [bag, nested, paymentRequired]) {
      if (!holder) continue;
      const accepts = holder.accepts;
      if (!Array.isArray(accepts) || accepts.length === 0) continue;
      const a = accepts[0] as Record<string, unknown>;
      const payTo = typeof a.payTo === "string" ? a.payTo : null;
      const amount =
        typeof a.amount === "string"
          ? a.amount
          : typeof a.maxAmountRequired === "string"
            ? a.maxAmountRequired
            : null;
      const resource = resourceUrl(a.resource) || resourceUrl(holder.resource);
      if (!payTo || !amount || !resource) continue;
      const resourceInfo =
        holder.resource &&
        typeof holder.resource === "object" &&
        !Array.isArray(holder.resource)
          ? (holder.resource as { url: string; [key: string]: unknown })
          : { url: resource };
      return {
        x402Version:
          typeof holder.x402Version === "number"
            ? holder.x402Version
            : undefined,
        chainId:
          typeof holder.chainId === "number" ? holder.chainId : undefined,
        accepted: a,
        resourceInfo,
        extensions:
          holder.extensions &&
          typeof holder.extensions === "object" &&
          !Array.isArray(holder.extensions)
            ? (holder.extensions as Record<string, unknown>)
            : undefined,
        network: typeof a.network === "string" ? a.network : undefined,
        asset: typeof a.asset === "string" ? a.asset : undefined,
        payTo,
        amount,
        resource,
        nonce: typeof a.nonce === "string" ? a.nonce : null,
        maxTimeoutSeconds:
          typeof a.maxTimeoutSeconds === "number" ? a.maxTimeoutSeconds : null,
        extra:
          a.extra && typeof a.extra === "object"
            ? (a.extra as { name?: string; version?: string })
            : null,
      };
    }
  }
  return null;
}

/** Read the free reserve disclosure from the same 402 response as the payment terms. */
export function paidReservePreviewFromResult(result: RunnerToolResult): {
  signedCardsOnFile: number;
  corpusAsOf: string | null;
} | null {
  const raw = (result as { raw?: Record<string, unknown> }).raw;
  const rpcResult = raw?.result && typeof raw.result === "object"
    ? (raw.result as Record<string, unknown>) : null;
  for (const root of [result.structuredContent, rpcResult?.structuredContent]) {
    if (!root || typeof root !== "object") continue;
    const paymentRequired = (root as Record<string, unknown>).payment_required;
    if (!paymentRequired || typeof paymentRequired !== "object") continue;
    const csoai = (paymentRequired as Record<string, unknown>).csoai;
    if (!csoai || typeof csoai !== "object") continue;
    const detail = csoai as Record<string, unknown>;
    if (typeof detail.schema !== "string" ||
        !detail.schema.startsWith("csoai.request-attestation/")) continue;
    const preview = detail.preview;
    if (!preview || typeof preview !== "object") continue;
    const value = preview as Record<string, unknown>;
    const count = value.signed_cards_on_file;
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0) continue;
    return {
      signedCardsOnFile: count,
      corpusAsOf: typeof value.corpus_as_of === "string" ? value.corpus_as_of : null,
    };
  }
  return null;
}

export function resultOutcome(result: RunnerToolResult): string | null {
  const payload = result.structuredContent;
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    return null;
  const fields = payload as Record<string, unknown>;
  for (const key of ["status", "state", "verdict"]) {
    const value = fields[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export type OutputHeader = {
  /** The state word printed at the top of the result. */
  word: string;
  tone: "ok" | "payment" | "unreachable" | "problem";
  /** One plain sentence under the word, when there is one. */
  meaning: string | null;
};

/**
 * The result header. A paid tool called without x_payment answers with its 402 challenge: that is
 * an answer (the terms), not a failure, and nothing has been charged. It was printed as
 * "UNCHECKABLE" in rose, which read as a broken tool (tools audit, 6 Oct 2026).
 */
export function outputHeader(result: RunnerToolResult): OutputHeader {
  if (resultOutcome(result) === "PAYMENT_REQUIRED")
    return {
      word: "PAYMENT REQUIRED: nothing has been charged",
      tone: "payment",
      meaning: stateMeaning("PAYMENT_REQUIRED"),
    };
  if (result.ok) return { word: "RUNTIME_OBSERVED", tone: "ok", meaning: null };
  if (result.state === "unreachable")
    return { word: "UNREACHABLE", tone: "unreachable", meaning: stateMeaning("UNREACHABLE") };
  return { word: "UNCHECKABLE", tone: "problem", meaning: null };
}

const HEADER_TONE: Record<OutputHeader["tone"], { border: string; bg: string }> = {
  ok: { border: "border-emerald-700/25", bg: "bg-emerald-50" },
  payment: { border: "border-amber-700/30", bg: "bg-amber-50" },
  unreachable: { border: "border-amber-700/25", bg: "bg-amber-50" },
  problem: { border: "border-rose-700/20", bg: "bg-rose-50" },
};

/** An explicit request must match the catalogue; defaults apply only without a requested name. */
function firstTool(tools: RunnerTool[], initialToolName?: string): RunnerTool | null {
  if (initialToolName) return tools.find((tool) => tool.name === initialToolName) ?? null;
  return (
    tools.find((tool) => tool.name === "board_totals") ||
    tools[0] ||
    null
  );
}

function fieldPlaceholder(name: string, kind: FieldKind): string {
  if (kind === "object") return '{\n  "key": "value"\n}';
  if (kind === "array") return '[\n  "value"\n]';
  if (kind === "json-or-string")
    return "Paste a card URL, JSON string, or JSON object";
  if (name === "x_payment")
    return "Filled in by Pay with wallet, or paste a signed x402 payload";
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

export type ToolAccessFilter = "all" | "free" | "metered";

/** Search only the catalogue the endpoint supplied; choosing a filter never executes a tool. */
export function filterTools(tools: RunnerTool[], query: string, access: ToolAccessFilter): RunnerTool[] {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return tools.filter((tool) => {
    if (access === "free" && isPaidTool(tool)) return false;
    if (access === "metered" && !isPaidTool(tool)) return false;
    const text = `${tool.name} ${TOOL_META[tool.name]?.label ?? ""} ${tool.description}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** Parsed response JSON, not a reconstruction of signed artifact bytes or request arguments. */
export function toolResponseJson(result: RunnerToolResult): string {
  try {
    return JSON.stringify(result.raw ?? result.structuredContent ?? { text: result.text }, null, 2);
  } catch {
    return JSON.stringify({ text: result.text }, null, 2);
  }
}

function ReadableToolResponse({ result }: { result: RunnerToolResult }) {
  const payload = result.structuredContent;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{result.text || "The endpoint returned no response text."}</p>;
  }
  const fields = Object.entries(payload as Record<string, unknown>);
  return (
    <div className="space-y-4">
      {fields.length ? <dl className="divide-y divide-slate-200">
        {fields.map(([key, value]) => <div key={key} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-4">
          <dt className="break-words text-xs font-semibold text-slate-600">{key.replace(/_/g, " ")}</dt>
          <dd className="min-w-0 break-words text-sm text-slate-900">
            {value !== null && typeof value === "object" ? (
              <details>
                <summary className="min-h-11 cursor-pointer py-2 text-xs font-semibold text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Inspect {Array.isArray(value) ? `${value.length} returned items` : "returned fields"}</summary>
                <pre tabIndex={0} className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100"><code>{JSON.stringify(value, null, 2)}</code></pre>
              </details>
            ) : value === null ? <span className="text-slate-500">null — no value supplied</span> : String(value)}
          </dd>
        </div>)}
      </dl> : <p className="text-sm text-slate-600">The endpoint returned an empty structured object.</p>}
      {result.text ? <details><summary className="min-h-11 cursor-pointer py-2 text-xs font-semibold text-slate-700">Response text</summary><pre tabIndex={0} className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs text-slate-700">{result.text}</pre></details> : null}
    </div>
  );
}

type RunnerExecution = {
  result: RunnerToolResult;
  observedAt: string;
  durationMs: number;
  toolName: string;
  contextVersion: number;
  paymentContext?: PaymentContext;
};

export default function ToolRunner({
  initialToolName,
  initialArguments,
  catalogue,
  onToolSelect,
}: {
  initialToolName?: string;
  initialArguments?: Record<string, string | boolean>;
  /** A tools/list result the host already holds (server rendering, tests). When given, the runner
   *  shows it instead of calling tools/list again. Nothing is invented: it is that list or none. */
  catalogue?: RunnerTool[];
  /** User-selected tool identity only. Draft arguments never cross this callback. */
  onToolSelect?: (toolName: string) => void;
}) {
  const [tools, setTools] = useState<RunnerTool[]>(catalogue ?? []);
  const [listState, setListState] = useState<
    "loading" | "catalogued" | "unreachable"
  >(catalogue ? "catalogued" : "loading");
  const [listReason, setListReason] = useState("");
  const [active, setActive] = useState<RunnerTool | null>(() =>
    catalogue ? firstTool(catalogue, initialToolName) : null,
  );
  const [draft, setDraft] = useState<ToolDraft>(() => {
    const first = catalogue ? firstTool(catalogue, initialToolName) : null;
    return first ? prefillToolDraft(first, initialArguments) : {};
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [storedOutput, setOutput] = useState<RunnerExecution | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"" | "copying" | "copied" | "blocked">("");
  const [outputView, setOutputView] = useState<"readable" | "json">("readable");
  const [downloadError, setDownloadError] = useState("");
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<ToolAccessFilter>("all");
  const runnerId = useId();
  const [reloadKey, setReloadKey] = useState(0);
  const mountedRef = useRef(true);
  const activeNameRef = useRef<string | null>(null);
  const draftVersionRef = useRef(0);
  const paymentContextRef = useRef<PaymentContext | null>(null);
  const paidRetryInFlightRef = useRef(false);
  const runInFlightRef = useRef(false);
  const handledReloadRef = useRef(0);
  const copyAttemptRef = useRef(0);
  const outputRef = useRef<RunnerExecution | null>(null);
  const intentRef = useRef({ initialToolName, initialArguments, catalogue });
  // Invalidate synchronously during navigation, before an old promise can settle.
  if (intentRef.current.initialToolName !== initialToolName ||
      intentRef.current.initialArguments !== initialArguments ||
      intentRef.current.catalogue !== catalogue) {
    intentRef.current = { initialToolName, initialArguments, catalogue };
    draftVersionRef.current += 1;
    paymentContextRef.current = null;
    copyAttemptRef.current += 1;
  }
  const output = storedOutput?.contextVersion === draftVersionRef.current ? storedOutput : null;
  outputRef.current = output;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      draftVersionRef.current += 1;
      paymentContextRef.current = null;
      copyAttemptRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (catalogue) {
      const first = firstTool(catalogue, initialToolName);
      activeNameRef.current = first?.name ?? null;
      draftVersionRef.current += 1;
      paymentContextRef.current = null;
      setListState("catalogued");
      setListReason("");
      setTools(catalogue);
      setActive(first);
      setDraft(first ? prefillToolDraft(first, initialArguments) : {});
      setOutput(null);
      setErrors({});
      return;
    }
    let cancelled = false;
    setListState("loading");
    setListReason("");
    const force = reloadKey !== handledReloadRef.current;
    handledReloadRef.current = reloadKey;
    const listing = force ? listTools("/mcp", { force: true }) : listTools();
    listing.then((reply) => {
      if (cancelled) return;
      if (reply.state !== "ok") {
        setListState("unreachable");
        setListReason(reply.reason);
        setTools([]);
        activeNameRef.current = null;
        draftVersionRef.current += 1;
        paymentContextRef.current = null;
        setActive(null);
        setOutput(null);
        return;
      }
      setListState("catalogued");
      const advertisedTools = reply.tools as RunnerTool[];
      setTools(advertisedTools);
      const first = firstTool(advertisedTools, initialToolName);
      activeNameRef.current = first?.name ?? null;
      draftVersionRef.current += 1;
      paymentContextRef.current = null;
      setActive(first);
      setDraft(first ? prefillToolDraft(first, initialArguments) : {});
      setOutput(null);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogue, initialArguments, initialToolName, reloadKey]);

  const filteredTools = useMemo(() => filterTools(tools, query, access), [tools, query, access]);
  const groups = useMemo(
    () => [
      {
        label: "Free reads & verification",
        tools: filteredTools.filter((tool) => !isPaidTool(tool)),
      },
      { label: "Metered evidence paths", tools: filteredTools.filter(isPaidTool) },
    ],
    [filteredTools],
  );

  const properties = active?.inputSchema?.properties || {};
  const required = new Set(active?.inputSchema?.required || []);

  function pick(tool: RunnerTool) {
    activeNameRef.current = tool.name;
    draftVersionRef.current += 1;
    paymentContextRef.current = null;
    setActive(tool);
    setDraft(initialToolDraft(tool));
    setErrors({});
    setOutput(null);
    setCopied("");
    copyAttemptRef.current += 1;
    setOutputView("readable");
    setDownloadError("");
    onToolSelect?.(tool.name);
  }

  function setField(name: string, value: FieldDraft) {
    copyAttemptRef.current += 1;
    setCopied("");
    draftVersionRef.current += 1;
    paymentContextRef.current = null;
    setOutput(null);
    setDraft((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  const paymentContext = output?.paymentContext ?? null;
  const payChallenge = useMemo(
    () =>
      output && paymentContext ? challengeFromResult(output.result) : null,
    [output, paymentContext],
  );
  const reservePreview = useMemo(
    () => output && paymentContext ? paidReservePreviewFromResult(output.result) : null,
    [output, paymentContext],
  );

  async function run() {
    if (!active || busy || runInFlightRef.current || paidRetryInFlightRef.current) return;
    const tool = active;
    const parsed = coerceToolArguments(tool, draft);
    if ("errors" in parsed) {
      setErrors(parsed.errors);
      return;
    }
    runInFlightRef.current = true;
    setErrors({});
    paymentContextRef.current = null;
    setOutput(null);
    setBusy(true);
    copyAttemptRef.current += 1;
    setCopied("");
    setOutputView("readable");
    setDownloadError("");
    const started = performance.now();
    const version = draftVersionRef.current;
    const paymentContext = createPaymentContext(
      tool.name,
      parsed.args,
      version,
    );
    try {
      const result = normalizeToolResult(
        await callTool(tool.name, parsed.args),
      );
      // Local receipt (plan item P5, 2026-11-02): tool, door, outcome and the hash of the
      // arguments — never the arguments. Recording must never affect the run, so it is
      // fire-and-forget with every failure swallowed inside the lib.
      void hashArgs(parsed.args).then((argsHash) =>
        recordToolReceipt({
          tool: tool.name,
          argsHash,
          outcome: resultOutcome(result) ?? (result.ok ? "OK" : "ERROR"),
        }),
      );
      if (
        mountedRef.current &&
        paymentContextMatches(
          paymentContext,
          activeNameRef.current,
          draftVersionRef.current,
        )
      ) {
        paymentContextRef.current = paymentContext;
        setOutput({
          result,
          observedAt: new Date().toISOString(),
          durationMs: Math.max(0, Math.round(performance.now() - started)),
          toolName: tool.name,
          contextVersion: version,
          paymentContext,
        });
      }
    } catch {
      if (mountedRef.current && paymentContextMatches(paymentContext, activeNameRef.current, draftVersionRef.current)) {
        setOutput({
          result: { ok: false, state: "unreachable", text: "The tool call did not complete. Its result is unknown." },
          observedAt: new Date().toISOString(), durationMs: Math.max(0, Math.round(performance.now() - started)), toolName: tool.name, contextVersion: version,
        });
      }
    } finally {
      runInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }

  function isPaymentContextCurrent(context: PaymentContext): boolean {
    return (
      mountedRef.current &&
      paymentContextRef.current === context &&
      paymentContextMatches(
        context,
        activeNameRef.current,
        draftVersionRef.current,
      )
    );
  }

  async function executePayment(
    context: PaymentContext,
    paymentHeader: string,
  ): Promise<X402ExecutionResult> {
    if (paidRetryInFlightRef.current || !isPaymentContextCurrent(context)) {
      return {
        status: "failed",
        detail:
          "The payment terms are stale or already being used. Run the job again before paying.",
      };
    }

    paidRetryInFlightRef.current = true;
    const started = performance.now();
    copyAttemptRef.current += 1;
    setCopied("");
    setOutputView("readable");
    setDownloadError("");
    // Consume this challenge before the await. Even two callbacks in the same
    // render cannot replay one approval twice.
    paymentContextRef.current = null;
    setErrors({});
    setBusy(true);
    try {
      // Retry the SAME MCP tool with its original typed arguments. The payment
      // payload is an argument only; ToolRunner never substitutes a response
      // body into x_payment and never reconstructs the route as a bare GET.
      const paidCall = paymentCallForContext(context, paymentHeader);
      const result = normalizeToolResult(
        await callTool(paidCall.toolName, paidCall.args),
      );
      // Same local receipt as the free run (P5): the paid call is recorded too, with its
      // outcome word; the receipt says nothing about settlement beyond that word.
      void hashArgs(paidCall.args).then((argsHash) =>
        recordToolReceipt({
          tool: paidCall.toolName,
          argsHash,
          outcome: resultOutcome(result) ?? (result.ok ? "OK" : "ERROR"),
        }),
      );
      if (
        mountedRef.current &&
        paymentContextMatches(
          context,
          activeNameRef.current,
          draftVersionRef.current,
        )
      ) {
        setOutput({ result, observedAt: new Date().toISOString(), durationMs: Math.max(0, Math.round(performance.now() - started)), toolName: context.toolName, contextVersion: context.draftVersion });
      }
      const outcome = resultOutcome(result);
      const structured =
        result.structuredContent &&
        typeof result.structuredContent === "object" &&
        !Array.isArray(result.structuredContent)
          ? (result.structuredContent as Record<string, unknown>)
          : null;
      const paymentResponse =
        typeof structured?.payment_response_header === "string"
          ? structured.payment_response_header
          : null;
      if (outcome === "DELIVERED") {
        return { status: "delivered", paymentResponse };
      }
      if (outcome === "PAYMENT_REQUIRED") {
        return {
          status: "reissued",
          detail:
            "The same MCP tool returned PAYMENT_REQUIRED again. The payment was not accepted.",
        };
      }
      return {
        status: "failed",
        detail: outcome
          ? `The paid retry returned ${outcome}, not DELIVERED.`
          : result.text || "The paid retry returned no delivery state.",
      };
    } catch {
      return { status: "failed", detail: "The paid request did not complete. Delivery and settlement are unknown; inspect the wallet, chain and facilitator before another payment." };
    } finally {
      paidRetryInFlightRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  }

  async function copyOutput() {
    const selected = output;
    if (!selected) return;
    const attempt = ++copyAttemptRef.current;
    setCopied("copying");
    const current = () => mountedRef.current && copyAttemptRef.current === attempt && outputRef.current === selected;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(toolResponseJson(selected.result));
      if (current()) setCopied("copied");
    } catch {
      if (current()) setCopied("blocked");
    }
  }

  function downloadOutput() {
    if (!output) return;
    setDownloadError("");
    let url: string | null = null;
    let link: HTMLAnchorElement | null = null;
    try {
      url = URL.createObjectURL(new Blob([toolResponseJson(output.result)], { type: "application/json" }));
      link = document.createElement("a");
      link.href = url;
      link.download = `csoai-${output.toolName.replace(/[^a-z0-9_-]/gi, "-")}-response.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      const release = url;
      window.setTimeout(() => URL.revokeObjectURL(release), 2000);
    } catch {
      link?.remove();
      try { if (url) URL.revokeObjectURL(url); } catch { /* No successful export is claimed. */ }
      setDownloadError("The download could not start. Open Response JSON and copy the visible response instead.");
    }
  }

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-[0_18px_50px_-38px_rgba(4,18,12,.55)]"
      aria-labelledby="mcp-runner-title"
    >
      <style>{`
        .csoai-tool-runner-choices { max-height: 14rem; overflow-y: auto; overscroll-behavior-y: contain; scrollbar-gutter: stable; }
        @media (min-width: 64rem) {
          .csoai-tool-runner-nav { display: flex; flex-direction: column; align-self: start; min-height: 0; max-height: 36rem; }
          .csoai-tool-runner-choices { flex: 1 1 auto; min-height: 0; max-height: none; }
        }
      `}</style>
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
          {!catalogue ? (
            <button
              type="button"
              disabled={listState === "loading" || busy}
              onClick={() => setReloadKey((value) => value + 1)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> {listState === "unreachable" ? "Retry catalogue" : "Refresh catalogue"}
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
            className="csoai-tool-runner-nav border-b border-slate-900/10 bg-slate-50/55 p-3 lg:border-b-0 lg:border-r"
            aria-label="Callable MCP tools"
          >
            <div className="mb-4 space-y-3">
              <label htmlFor={`${runnerId}-tool-search`} className="block text-xs font-semibold text-slate-800">Find a tool</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
                <input id={`${runnerId}-tool-search`} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or purpose" className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600" />
              </div>
              <label htmlFor={`${runnerId}-tool-access`} className="block text-xs font-semibold text-slate-800">Access</label>
              <select id={`${runnerId}-tool-access`} value={access} onChange={(event) => setAccess(event.target.value as ToolAccessFilter)} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900">
                <option value="all">All tools</option><option value="free">Free reads and verification</option><option value="metered">Metered paths</option>
              </select>
              <p role="status" className="text-xs text-slate-600">{filteredTools.length} of {tools.length} catalogued tools shown.</p>
              {!filteredTools.length ? <div className="rounded-lg border border-dashed border-slate-300 p-3"><p className="text-sm text-slate-700">No tools match these filters.</p><button type="button" onClick={() => { setQuery(""); setAccess("all"); }} className="mt-2 min-h-11 text-xs font-semibold text-emerald-900 underline">Clear filters</button></div> : null}
            </div>
            <div className="csoai-tool-runner-choices pr-1">
            {groups.map((group) =>
              group.tools.length ? (
                <div key={group.label} className="mb-5 last:mb-0">
                  <p className="px-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
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
                          className={`flex min-h-11 w-full items-center gap-2 rounded-xl px-2.5 py-2.5 text-left transition ${selected ? "bg-[#04624a] text-white shadow-sm" : "text-slate-700 hover:bg-white hover:text-slate-950"}`}
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
                              className={`block truncate text-xs ${selected ? "text-emerald-50/90" : "text-slate-500"}`}
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
            </div>
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

              <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3">
                <summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Input schema from tools/list</summary>
                {active.inputSchema ? <pre tabIndex={0} className="mb-3 max-h-72 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100"><code>{JSON.stringify(active.inputSchema, null, 2)}</code></pre> : <p className="pb-3 text-xs text-slate-600">This tool did not advertise an input schema.</p>}
              </details>

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
                    asks for a seed phrase or private key. Payment is signed in
                    your own wallet and only the signed payment payload is sent.
                  </p>
                </div>
              ) : null}

              {payChallenge && paymentContext ? (
                <X402PayButton
                  challenge={payChallenge}
                  reservePreview={reservePreview}
                  executePayment={(header) =>
                    executePayment(paymentContext, header)
                  }
                  isContextCurrent={() =>
                    isPaymentContextCurrent(paymentContext)
                  }
                  className="mt-5"
                />
              ) : null}

              <form
                className="mt-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void run();
                }}
                noValidate
                // Watch mode (functions/_lib/uiTools.ts) fills form[data-ui-form='request'] and
                // points at [data-ui-action='request-submit']; neither existed, so "Typing … as the
                // subject" typed nothing (tools audit, 6 Oct 2026).
                data-ui-form={active.name === "commission_card" ? "request" : active.name}
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
                              data-ui-field={name}
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
                              data-ui-field={name}
                              value={String(draft[name] || "")}
                              onChange={(event) =>
                                setField(name, event.target.value)
                              }
                              aria-invalid={Boolean(error)}
                              aria-describedby={
                                error ? `${id}-error` : undefined
                              }
                              className={commonClass}
                            >
                              {/* A required enum starts unchosen. Without this option the browser
                                  SHOWED the first value while the form held "", and Run answered
                                  "Required." beside a field that looked filled. */}
                              {!required.has(name) ? (
                                <option value="">Not set</option>
                              ) : (
                                <option value="" disabled>
                                  Choose…
                                </option>
                              )}
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
                              data-ui-field={name}
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
                  data-ui-action={isPaidTool(active) ? "request-submit" : "run-tool"}
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
                      ? typeof draft.x_payment === "string" && draft.x_payment.trim()
                        ? "Submit signed payment"
                        : "Check terms · no payment"
                      : "Run tool"}
                </button>
              </form>

              {output ? (() => {
                const head = outputHeader(output.result);
                return (
                <section
                  className={`mt-6 overflow-hidden rounded-xl border ${HEADER_TONE[head.tone].border}`}
                  aria-live="polite"
                  data-testid="tool-runner-output"
                  data-state={head.tone}
                >
                  <header
                    className={`flex flex-wrap items-start justify-between gap-3 px-4 py-3 ${HEADER_TONE[head.tone].bg}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {head.tone === "ok" ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 text-emerald-800"
                          aria-hidden="true"
                        />
                      ) : head.tone === "payment" ? (
                        <LockKeyhole
                          className="mt-0.5 h-4 w-4 text-amber-800"
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
                          {head.word}
                        </p>
                        {head.meaning ? (
                          <p className="mt-0.5 max-w-xl text-[11px] leading-relaxed text-slate-700">
                            {head.meaning}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-[10px] text-slate-600">
                          {output.toolName} · completed <time dateTime={output.observedAt}>{output.observedAt}</time> · {output.durationMs} ms
                          {resultOutcome(output.result)
                            ? ` · outcome ${resultOutcome(output.result)}`
                            : ""}
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold text-slate-900">Returned outcome: {resultOutcome(output.result) ?? "not declared by the tool"}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {copied ? (
                        <span role="status" className="max-w-xs text-xs font-semibold text-slate-600">
                          {copied === "copying" ? "Copying…" : copied === "copied" ? "Response JSON copied." : "Copy could not be confirmed. Open Response JSON, select its text and copy it manually."}
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={copyOutput}
                        disabled={copied === "copying"}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-900/10 bg-white px-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy JSON
                      </button>
                      <button type="button" onClick={downloadOutput} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"><Download className="h-4 w-4" aria-hidden="true" /> Download JSON</button>
                    </div>
                  </header>
                  <div role="tablist" aria-label="Tool response view" className="flex gap-1 border-y border-slate-200 bg-white px-3 py-2">
                    {(["readable", "json"] as const).map((view) => <button key={view} id={`${runnerId}-${view}-tab`} type="button" role="tab" aria-selected={outputView === view} aria-controls={`${runnerId}-response-panel`} tabIndex={outputView === view ? 0 : -1} data-output-view={view} onClick={() => setOutputView(view)} onKeyDown={(event) => {
                      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                      event.preventDefault();
                      const next = event.key === "Home" ? "readable" : event.key === "End" ? "json" : view === "readable" ? "json" : "readable";
                      setOutputView(next);
                      event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-output-view="${next}"]`)?.focus();
                    }} className={`min-h-11 rounded-lg px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${outputView === view ? "bg-emerald-50 text-emerald-950" : "text-slate-600 hover:bg-slate-50"}`}>{view === "readable" ? "Readable" : "Response JSON"}</button>)}
                  </div>
                  <div id={`${runnerId}-response-panel`} role="tabpanel" aria-labelledby={`${runnerId}-${outputView}-tab`} className="min-w-0 p-4">
                    {outputView === "readable" ? <ReadableToolResponse result={output.result} /> : <pre tabIndex={0} className="max-h-[30rem] overflow-auto rounded-lg bg-[#04120c] p-4 font-mono text-xs leading-relaxed text-emerald-50"><code>{toolResponseJson(output.result)}</code></pre>}
                  </div>
                  {downloadError ? <p role="status" className="px-4 pb-3 text-xs text-amber-900">{downloadError}</p> : null}
                  <footer className="border-t border-slate-900/10 bg-slate-50 px-4 py-2.5 text-[10px] leading-relaxed text-slate-600">
                    Source:{" "}
                    <code className="font-mono">POST {MCP_RPC_ENDPOINT}</code> ·
                    executor: public MCP endpoint · this state describes this
                    call only. A successful call does not make its payload
                    MEASURED, REPRODUCED or SIGNED unless the returned evidence
                    independently says so. Copy and download contain this call’s parsed response only; they do not confirm that a response was saved elsewhere. The local receipts log is separate.
                  </footer>
                </section>
                );
              })() : null}
            </div>
          ) : (
            <div className="p-6" role="status">
              <div className="rounded-xl border border-dashed border-slate-900/15 bg-slate-50 p-6 text-center">
                {initialToolName ? <>
                  <p className="text-sm font-semibold text-slate-900">Requested tool is not advertised.</p>
                  <p className="mt-2 break-words text-xs text-slate-700"><code>{initialToolName}</code> is unavailable in the current tools/list response from <code>{MCP_RPC_ENDPOINT}</code>.</p>
                  <p className="mt-2 text-xs text-slate-600">No other tool was selected or run. Browse the catalogue and choose a tool to continue.</p>
                </> : <>
                <p className="text-sm font-semibold text-slate-900">
                  tools/list returned an empty catalogue.
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  CATALOGUED · 0. No fallback tools are invented in the browser.
                </p>
                </>}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
