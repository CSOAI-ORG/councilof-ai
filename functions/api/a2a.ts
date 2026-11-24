/**
 * POST /api/a2a — the A2A v1.0 JSON-RPC binding that /.well-known/agent-card.json points at.
 *
 * WHY THIS EXISTS (2026-09-05, the a2aproject/A2A#2150 lane)
 * The agent card declared two `supportedInterfaces` — /api/assess as HTTP+JSON and /mcp as
 * JSONRPC — and neither spoke A2A: /mcp answered `message/send` with -32601 and /api/assess is
 * a screening helper with no A2A shape at all. A2A v1.0 §8.3.1 says each interface MUST
 * accurately declare its transport and URL. A card naming a door that is not there is a name
 * that promises what the code lacks. This file is the door, and the card now names only it.
 *
 * WHAT IT DOES
 *   SendMessage             -> a Message (never a Task). One explicit Part.data
 *                              {skill,input} selects one of the skills on the public card (SKILL_IDS;
 *                              the card is RENDERED from council-os/capabilities.json, so the two sets
 *                              are one). The count is never typed here: it named a smaller figure while SKILL_IDS
 *                              held one more, on a contract GET /api/a2a serves. Describe the defect, never
 *                              reproduce the stale token: a guard that reads this file would match it.
 *                              Each skill calls a fixed same-origin, free handler. The legacy
 *                              one-part text "board" request remains a narrow compatibility alias.
 *   SendMessage, per tool   -> Part.data {skill:<tool>,input}, where <tool> is a tool POST /mcp serves
 *                              and has its own card at /.well-known/agents/<tool>.json (2026-11-16).
 *                              The input is validated against that tool's inputSchema with the
 *                              validator /mcp uses, and the tool runs through functions/mcp/_dispatch.ts,
 *                              the dispatch POST /mcp tools/call runs. The metered (x402) tools answer
 *                              with their payment challenge and charge nothing until input.x_payment
 *                              carries a payment; the tool's route settles it (functions/api/_x402.ts),
 *                              fail closed. Until that date every per-tool card named this door and
 *                              the router answered every one of them "unknown skill".
 *   GetTask / CancelTask    -> TaskNotFoundError (-32001): this agent keeps no task store. An x402
 *                              payment Task (below, X402 TASK) is carried in its own id and is
 *                              answered only by SendMessage; it is not stored either.
 *   ListTasks               -> UnsupportedOperationError (-32004): nothing to list.
 *   SendStreamingMessage / SubscribeToTask -> UnsupportedOperationError (-32004), which §3.3.4
 *                              requires while capabilities.streaming is false.
 *   *PushNotificationConfig -> PushNotificationNotSupportedError (-32003).
 *   GetExtendedAgentCard    -> UnsupportedOperationError (-32004): extendedAgentCard is false.
 *   anything else           -> -32601.
 *   A2A-Version other than 1.0 -> VersionNotSupportedError (-32009), EXCEPT the 0.3 wire shape:
 *   a 0.3 method name (`message/send`, `tasks/get`, ...) with no A2A-Version header or a 0.x one
 *   is served through a compatibility shim (2026-09-29) — 0.3 parts ({kind:"text"|"data"}) are
 *   mapped onto the v1.0 handler and the answer comes back as a 0.3 Message ({kind:"message",
 *   role:"agent"}). Most A2A SDK clients in the wild still speak 0.3, and they were all refused.
 *
 * WHAT IT IS NOT
 *   Not a task runner, not streaming, not signed-receipts/v1: no receipt is attached until a
 *   server-side key exists to sign one, and the card does not declare that extension until it
 *   is actually emitted. Measurement, not certification: every reply carries the register text
 *   and nothing ranked. Numbers are derived at request time, never typed here.
 */

import { DOCTRINE, measurementIndex, serverEvidence, verifyCapsule } from "../_lib/measurementCapsule";
import { executePlan, routeIntent, type Plan } from "../_lib/talkRouter";
import { paidCallName, recordUsage } from "../_lib/usage";
import { shapeLabel } from "../_lib/askInput";
import { evidenceBundlePreview } from "../mcp/_evidence";
import { routeResult } from "../mcp/_route";
import { routeSummary } from "../_lib/route/route";
import { evidenceDeliveryMessage, validateEvidenceDeliveryInput } from "../_lib/evidenceDelivery";
import { axisSpecialistResult, validateAxisSpecialistInput } from "../_lib/axisSpecialist";
import { headFromGet } from "./_head";
import { dispatchTool, TOOL_DEFINITIONS, toolInputError } from "../mcp/_dispatch";
import { metaPaymentHeader, PAID_TOOL_NAMES, X402_META_PAYMENT, X402_META_PAYMENT_RESPONSE, type PaidCallerContext } from "../mcp/_paid";
import type { McpToolResult } from "../mcp/_handlers";

type Json = Record<string, unknown>;

export const A2A_PROTOCOL_VERSION = "1.0";
const CARD_PATH = "/.well-known/agent-card.json";
const BOARD_PATH = "/api/gspc";
const MAX_REQUEST_BYTES = 256 * 1024;
const REQUEST_READ_TIMEOUT_MS = 5_000;
const MAX_SOURCE_RESPONSE_BYTES = 1024 * 1024;
const SOURCE_TIMEOUT_MS = 8_000;
export const REGISTER =
  "Evidence of what was measured and when, by the issuer. Not a certification, endorsement, or conformity mark.";

const HEADERS: Record<string, string> = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, a2a-version, a2a-extensions, x-a2a-extensions",
  "access-control-expose-headers": "a2a-version, x-a2a-extensions",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "cache-control": "no-store",
  "a2a-version": A2A_PROTOCOL_VERSION,
};

// A2A v1.0 §5.4 error-code mappings (JSON-RPC column).
export const A2A_ERROR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
  TASK_NOT_FOUND: -32001,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  UNSUPPORTED_OPERATION: -32004,
  VERSION_NOT_SUPPORTED: -32009,
} as const;

// Every v1.0 method name and what this door does with it. Exposed on GET so a stranger
// can read the contract before sending anything.
export const METHODS: Record<string, string> = {
  SendMessage:
    "answered with a Message (one case is a Task: a metered skill's x402 challenge to a request that activates the " +
    "a2a-x402 extension; see tool_skills.payment), from one explicit {skill,input} selector, or from one plain-text Part that the shared " +
    "deterministic router (functions/_lib/talkRouter.ts, also behind POST /api/chat and POST /api/agui/run) places on a " +
    "POST /mcp tool, quoting that tool's output with a citation; text it cannot place is refused. Every card skill routes to a fixed, free, " +
    "same-origin handler. A per-tool skill - a tool name from /.well-known/agents/index.json - runs that tool through the " +
    "dispatch POST /mcp tools/call runs; the metered ones answer with their x402 challenge until input.x_payment or " +
    "message.metadata[\"x402.payment.payload\"] carries a payment. The set is the skills array on this response - read it rather than a number: this " +
    "string once named a smaller figure than SKILL_IDS actually held, and scripts/capability-registry.mjs --check " +
    "now fails on any skill count typed into this file.",
  SendStreamingMessage: "UnsupportedOperationError -32004 (streaming is false on the card)",
  GetTask: "TaskNotFoundError -32001 (no task store)",
  ListTasks: "UnsupportedOperationError -32004 (no task store)",
  CancelTask: "TaskNotFoundError -32001 (no task store)",
  SubscribeToTask: "UnsupportedOperationError -32004 (streaming is false on the card)",
  CreateTaskPushNotificationConfig: "PushNotificationNotSupportedError -32003",
  GetTaskPushNotificationConfig: "PushNotificationNotSupportedError -32003",
  ListTaskPushNotificationConfigs: "PushNotificationNotSupportedError -32003",
  DeleteTaskPushNotificationConfig: "PushNotificationNotSupportedError -32003",
  GetExtendedAgentCard: "UnsupportedOperationError -32004 (extendedAgentCard is false)",
};

/**
 * The A2A 0.3 method names and the v1.0 method each is served as. Used only when the request has
 * no A2A-Version header or a 0.x one (the 0.3 wire shape); a request that declares 1.0 must use
 * the 1.0 names.
 */
export const V03_METHODS: Record<string, string> = {
  "message/send": "SendMessage",
  "message/stream": "SendStreamingMessage",
  "tasks/get": "GetTask",
  "tasks/cancel": "CancelTask",
  "tasks/resubscribe": "SubscribeToTask",
  "tasks/pushNotificationConfig/set": "CreateTaskPushNotificationConfig",
  "tasks/pushNotificationConfig/get": "GetTaskPushNotificationConfig",
  "tasks/pushNotificationConfig/list": "ListTaskPushNotificationConfigs",
  "tasks/pushNotificationConfig/delete": "DeleteTaskPushNotificationConfig",
  "agent/getAuthenticatedExtendedCard": "GetExtendedAgentCard",
};
const isLegacyVersionHeader = (v: string): boolean => v === "" || /^0\.[23](\.\d+)*$/.test(v);

/**
 * The Major.Minor an A2A-Version header names. A2A v1.0 section 3.6: "Patch version numbers ...
 * MUST not be considered when clients and servers negotiate protocol versions." Until 2026-10-07
 * this door compared the raw header, so `A2A-Version: 1.0.0` (or 1.0.1) got -32009 although 1.0
 * is the version it serves. Anything that is not Major.Minor[.patch...] is returned trimmed, as sent.
 */
export function normalizeA2aVersion(raw: string | null): string {
  const v = (raw ?? "").trim();
  const m = v.match(/^(\d+)\.(\d+)(?:\.\d+)*$/);
  return m ? `${Number(m[1])}.${Number(m[2])}` : v;
}

/** MCP JSON-RPC method names: a client that sends one here has the wrong door, not the wrong version. */
const MCP_METHODS = new Set([
  "initialize", "ping", "tools/list", "tools/call", "resources/list", "resources/read",
  "resources/templates/list", "prompts/list", "prompts/get", "completion/complete", "logging/setLevel",
]);
/** A2A names from before 0.3 (0.1 / 0.2). */
const PRE_03_METHODS = new Set(["tasks/send", "tasks/sendSubscribe"]);

/** Why a method is not served on the 0.3 wire, and what to send instead. */
export function unversionedMethodHint(method: string): string {
  if (Object.prototype.hasOwnProperty.call(METHODS, method)) {
    return `${method} is the A2A 1.0 name: send it with the header A2A-Version: ${A2A_PROTOCOL_VERSION}, or send the 0.3 name with no header`;
  }
  if (MCP_METHODS.has(method) || method.startsWith("notifications/")) {
    return `${method} is an MCP method; this is the A2A door. The MCP server is POST /mcp/free`;
  }
  if (PRE_03_METHODS.has(method)) {
    return `${method} is an A2A name from before 0.3; send message/send (0.3, no header) or SendMessage with A2A-Version: ${A2A_PROTOCOL_VERSION}`;
  }
  return `not an A2A method; the 0.3 names served here are ${Object.keys(V03_METHODS).join(", ")}, and the 1.0 names need A2A-Version: ${A2A_PROTOCOL_VERSION}`;
}

/** What a body that is not JSON-RPC should have been, for a stranger who meant to ask a question. */
const NOT_JSONRPC_HINT =
  'This is the A2A JSON-RPC door: send {"jsonrpc":"2.0","id":1,"method":"SendMessage","params":{"message":{"messageId":"m-1","role":"ROLE_USER","parts":[{"text":"<question>"}]}}} with A2A-Version: 1.0. To ask in plain words without JSON-RPC, POST {"message":"<question>"} to /api/chat.';

/** 0.3 Message -> v1.0 Message: parts {kind:"text",text} -> {text}, {kind:"data",data} -> {data}. */
export function v03MessageToV1(m: Json): Json {
  const parts = Array.isArray(m.parts)
    ? m.parts.map((raw) => {
        const p = record(raw);
        if (!p) return raw;
        const { kind, metadata: _metadata, ...rest } = p;
        if (kind === "text") return { text: rest.text };
        if (kind === "data") return { data: rest.data };
        if (kind === "file") {
          const f = record(rest.file);
          return str(f?.uri) ? { url: f?.uri } : { raw: f?.bytes ?? null };
        }
        return rest;
      })
    : m.parts;
  const { kind: _kind, role, ...rest } = m;
  return { ...rest, role: role === "user" ? "ROLE_USER" : role === "agent" ? "ROLE_AGENT" : role, parts };
}

/** v1.0 Message -> 0.3 Message, so a 0.3 client can read the answer it asked for. */
export function v1MessageTo03(m: Json): Json {
  const parts = Array.isArray(m.parts)
    ? m.parts.map((raw) => {
        const p = record(raw) ?? {};
        if ("text" in p) return { kind: "text", text: p.text };
        if ("data" in p) return { kind: "data", data: p.data };
        return { kind: "data", data: p };
      })
    : [];
  return {
    kind: "message",
    messageId: m.messageId,
    contextId: m.contextId,
    ...(typeof m.taskId === "string" ? { taskId: m.taskId } : {}),
    role: "agent",
    // The x402 A2A transport's status fields ride in message.metadata. Until 22 Nov 2026 this
    // mapping dropped metadata, so a 0.3 client never saw x402.payment.status or the challenge.
    ...(m.metadata && typeof m.metadata === "object" && !Array.isArray(m.metadata) ? { metadata: m.metadata } : {}),
    parts,
  };
}

const V03_TASK_STATES: Record<string, string> = {
  TASK_STATE_INPUT_REQUIRED: "input-required",
  TASK_STATE_COMPLETED: "completed",
  TASK_STATE_FAILED: "failed",
};

/** v1.0 Task -> 0.3 Task (kind "task", lower-case states, 0.3 parts), for the x402 payment Task. */
export function v1TaskTo03(t: Json): Json {
  const status = (t.status && typeof t.status === "object" ? t.status : {}) as Json;
  const message = status.message && typeof status.message === "object" ? v1MessageTo03(status.message as Json) : undefined;
  const artifacts = Array.isArray(t.artifacts)
    ? t.artifacts.map((raw) => {
        const a = (raw && typeof raw === "object" ? raw : {}) as Json;
        return { ...a, parts: v1MessageTo03({ parts: a.parts }).parts };
      })
    : undefined;
  return {
    kind: "task",
    id: t.id,
    contextId: t.contextId,
    status: {
      state: V03_TASK_STATES[String(status.state)] ?? status.state,
      timestamp: status.timestamp,
      ...(message ? { message } : {}),
    },
    ...(artifacts ? { artifacts } : {}),
  };
}

const record = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
// framework-readiness calls the SAME module the MCP tool framework_readiness calls, so the two
// doors cannot disagree about the checklist (the estate's no-second-implementation rule).
import { readinessResult, READINESS_FRAMEWORK_IDS } from "../mcp/_readiness";
const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export const SKILL_IDS = [
  "gspc-board",
  "east-west-crosswalk",
  "card-status-link",
  "benchmark-quality-register",
  "article50-detect",
  "eu-ai-act-screen",
  "x402-discovery",
  "estate-index",
  "measurement-capsules",
  "server-evidence",
  "evidence-bundle",
  "gspc-route",
  "evidence-delivery",
  "axis-specialist",
  "framework-readiness",
] as const;
type SkillId = (typeof SKILL_IDS)[number];
const SKILL_ID_SET = new Set<string>(SKILL_IDS);
/**
 * Former skill ids a caller may still send. Not on the card and not in SKILL_IDS (the card and the
 * router stay equal as sets); resolved to the current id before routing so an old integration keeps
 * working. 30 Sep 2026: "measured-badge" → "card-status-link" — the doctrine has no mark, badge or
 * grade, and the skill returns a card-bound state and a link, not a badge of approval.
 */
export const LEGACY_SKILL_IDS: Readonly<Record<string, SkillId>> = { "measured-badge": "card-status-link" };

/**
 * The per-tool skills (2026-11-16): the tools POST /mcp serves, each published as its own A2A card
 * at /.well-known/agents/<tool>.json and listed in /.well-known/agents/index.json. DERIVED from the
 * registry /mcp registers (functions/mcp/_dispatch.ts), never typed. They are not on the main card,
 * whose skills stay equal to SKILL_IDS (scripts/capability-registry.mjs holds that pair);
 * a2a.tool-skills.test.ts holds every per-tool card on disk equal to this set, both ways.
 */
export const TOOL_SKILL_IDS: readonly string[] = TOOL_DEFINITIONS.map((d) => d.name);
const TOOL_SKILL_SET = new Set<string>(TOOL_SKILL_IDS);
/** The metered subset: these answer with their x402 challenge until input.x_payment carries a payment. */
export const METERED_TOOL_SKILL_IDS: readonly string[] = TOOL_SKILL_IDS.filter((id) => PAID_TOOL_NAMES.has(id));
const TOOL_CARDS_PATH = "/.well-known/agents/index.json";

type SkillSelection = { skill: SkillId; input: Json };
type CapabilityHelp = { kind: "CAPABILITY_HELP" };
/** A plain-text question the shared router places on one of the /mcp tools (2026-09-29). */
type TalkSelection = { kind: "TALK"; text: string; plan: Plan };
/** A per-tool skill: a tool POST /mcp serves, selected by the name on its own card. */
type ToolSelection = { kind: "TOOL"; tool: string; input: Json };

class SourceError extends Error {
  constructor(
    message: string,
    readonly source: string,
    readonly kind: "FETCH_FAILED" | "HTTP_ERROR" | "INVALID_JSON" | "RESPONSE_TOO_LARGE",
  ) {
    super(message);
  }
}

class RequestBodyError extends Error {
  constructor(readonly kind: "REQUEST_TOO_LARGE" | "REQUEST_READ_TIMEOUT") {
    super(kind === "REQUEST_TOO_LARGE"
      ? `request exceeds ${MAX_REQUEST_BYTES} bytes`
      : `request body did not finish within ${REQUEST_READ_TIMEOUT_MS}ms`);
  }
}

function cancelReaderWithoutWaiting(reader: ReadableStreamDefaultReader<Uint8Array>, reason: string): void {
  try {
    // A hostile underlying source may return a cancel promise that never settles. Cancellation
    // must be initiated, but the public request deadline may not depend on that promise.
    void reader.cancel(reason).catch(() => undefined);
  } catch {
    // Some custom streams throw synchronously from cancel. The bounded error still wins.
  }
  try {
    reader.releaseLock();
  } catch {
    // A pending read can keep the lock briefly. cancel() settles it on conforming streams; a
    // hostile stream must not keep this handler open merely so we can release its reader lock.
  }
}

async function readBoundedRequestText(request: Request): Promise<string> {
  const rawLength = request.headers.get("content-length");
  const declared = rawLength === null ? null : Number(rawLength);
  if (declared !== null && Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
    throw new RequestBodyError("REQUEST_TOO_LARGE");
  }
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError("REQUEST_READ_TIMEOUT")), REQUEST_READ_TIMEOUT_MS);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_REQUEST_BYTES) {
        cancelReaderWithoutWaiting(reader, "request too large");
        throw new RequestBodyError("REQUEST_TOO_LARGE");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof RequestBodyError && error.kind === "REQUEST_READ_TIMEOUT") {
      cancelReaderWithoutWaiting(reader, "request read timeout");
    }
    throw error;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    try {
      reader.releaseLock();
    } catch {
      // Already released after cancellation, or a hostile pending read still owns the lock.
    }
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new SourceError(`response exceeds ${maxBytes} bytes`, response.url, "RESPONSE_TOO_LARGE");
  }
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      cancelReaderWithoutWaiting(reader, "response too large");
      throw new SourceError(`response exceeds ${maxBytes} bytes`, response.url, "RESPONSE_TOO_LARGE");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

async function fetchJsonSource(
  origin: string,
  path: string,
  init: { method?: "GET" | "POST"; body?: string } = {},
): Promise<{ source: string; payload: unknown }> {
  const source = new URL(path, origin).toString();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
  try {
    // Cloudflare Pages fetch implements only "follow" and "manual". "error" throws
    // TypeError before the request is sent, which made every skill UNCHECKABLE.
    // manual + refuse 3xx keeps the no-follow SSRF posture without using a mode the edge lacks.
    const response = await fetch(source, {
      method: init.method ?? "GET",
      headers: init.body
        ? { accept: "application/json", "content-type": "application/json" }
        : { accept: "application/json" },
      body: init.body,
      redirect: "manual",
      signal: controller.signal,
    });
    if (response.status >= 300 && response.status < 400) {
      throw new SourceError(`source redirected (${response.status}) — not followed`, source, "FETCH_FAILED");
    }
    const text = await readBoundedText(response, MAX_SOURCE_RESPONSE_BYTES);
    if (!response.ok) throw new SourceError(`HTTP ${response.status} from ${path}`, source, "HTTP_ERROR");
    try {
      return { source, payload: JSON.parse(text) as unknown };
    } catch {
      throw new SourceError(`${path} did not return JSON`, source, "INVALID_JSON");
    }
  } catch (error) {
    if (error instanceof SourceError) {
      if (controller.signal.aborted && error.kind !== "RESPONSE_TOO_LARGE") {
        throw new SourceError(`source timed out after ${SOURCE_TIMEOUT_MS}ms`, source, "FETCH_FAILED");
      }
      throw error;
    }
    const reason = controller.signal.aborted
      ? `source timed out after ${SOURCE_TIMEOUT_MS}ms`
      : `source fetch failed: ${error instanceof Error ? error.message : String(error)}`;
    throw new SourceError(reason, source, "FETCH_FAILED");
  } finally {
    clearTimeout(timer);
  }
}

const exactKeys = (input: Json, required: string[], optional: string[] = []): boolean => {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.prototype.hasOwnProperty.call(input, key))
    && Object.keys(input).every((key) => allowed.has(key));
};

/**
 * A greeting or capability question — the whole message, not a substring, so a sentence that
 * merely contains "hi" never selects anything. Punctuation and case are ignored.
 */
const GREETING_WORDS = ["hello", "hi", "hey", "greetings", "good morning", "good afternoon", "good evening", "help"];
const CAPABILITY_QUESTIONS = ["what can you do", "what do you do", "what are your skills", "what are your capabilities", "capabilities", "skills", "list skills"];
export const GREETING_EXAMPLES = "hello, hi, hey, help, what can you do?";
export function isCapabilityGreeting(text: string): boolean {
  const t = text.toLowerCase().replace(/[^a-z ]+/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return false;
  const tail = (rest: string) => rest === "" || rest === "there" || CAPABILITY_QUESTIONS.includes(rest);
  if (CAPABILITY_QUESTIONS.includes(t)) return true;
  for (const g of GREETING_WORDS) {
    if (t === g) return true;
    if (t.startsWith(`${g} `) && tail(t.slice(g.length + 1))) return true;
  }
  return false;
}

function parseSkillSelection(message: Json): SkillSelection | CapabilityHelp | TalkSelection | ToolSelection | string {
  const parts = Array.isArray(message.parts) ? message.parts : [];
  if (parts.length !== 1) {
    return "exactly one Part is required; additional semantic parts are not ignored";
  }
  const part = record(parts[0]);
  if (!part) return "the single Part must be an object";
  const semanticKeys = ["text", "data", "url", "raw"].filter((key) =>
    Object.prototype.hasOwnProperty.call(part, key));
  if (semanticKeys.length !== 1) {
    return "Part content is a oneof: supply exactly one of text, data, url, or raw";
  }
  if (semanticKeys[0] === "text") {
    const text = str(part.text)?.trim().replace(/\s+/g, " ").toLowerCase();
    if (text === "board") return { skill: "gspc-board", input: {} };
    // A2A directory task probes and first-contact agents send a greeting. Answer with the
    // declared capability contract, never with a measurement or a guessed skill.
    // Until 2026-09-26 only three exact strings qualified, so a bare "hello" got
    // INVALID_SKILL_SELECTOR while the error text itself said greetings were accepted.
    if (text !== undefined && isCapabilityGreeting(text)) return { kind: "CAPABILITY_HELP" };
    // ALL other text goes through the SAME deterministic router as POST /api/chat: a question that
    // names something a /mcp tool answers (the board, an axis, a card id, a server) is answered by
    // that tool in-process. Text it cannot place is answered with a result that says so and lists
    // what it can answer (state NO_TOOL_MATCHED) — never a guessed skill, never a measurement.
    // Until 2026-09-29 that case was a -32602 error, which a2aregistry.org recorded against this
    // agent as "Returning errors when contacted by users".
    const raw = str(part.text)?.trim() ?? "";
    return { kind: "TALK", text: raw, plan: routeIntent(raw) };
  }
  if (semanticKeys[0] !== "data") {
    return `Part.${semanticKeys[0]} is not supported; use structured Part.data {skill,input}`;
  }
  const selector = record(part.data);
  if (!selector) return "Part.data must be an object containing {skill,input}";
  if (!exactKeys(selector, ["skill", "input"])) return "selector must contain exactly {skill,input}";
  const asked = str(selector.skill);
  // A per-tool skill is the tool's own name, as its card at /.well-known/agents/<tool>.json gives it.
  if (asked && TOOL_SKILL_SET.has(asked)) {
    const toolInput = record(selector.input);
    if (!toolInput) return "selector.input must be an object";
    return { kind: "TOOL", tool: asked, input: toolInput };
  }
  const skill = asked && Object.prototype.hasOwnProperty.call(LEGACY_SKILL_IDS, asked) ? LEGACY_SKILL_IDS[asked] : asked;
  if (!skill || !SKILL_ID_SET.has(skill)) {
    return `unknown skill; choose one of: ${SKILL_IDS.join(", ")}; or a per-tool skill, by the tool names listed at ${TOOL_CARDS_PATH}`;
  }
  const input = record(selector.input);
  if (!input) return "selector.input must be an object";
  return { skill: skill as SkillId, input };
}

function validateSkillInput(selection: SkillSelection): string | null {
  const { skill, input } = selection;
  // A skill that takes no input belongs in this list. Forgetting it here means the router accepts
  // the skill name and then refuses it as "unsupported skill" — which is what happened to
  // estate-index on 2026-09-16, after it had already been added to the card and to SKILL_IDS.
  if (["gspc-board", "east-west-crosswalk", "benchmark-quality-register", "x402-discovery", "estate-index"].includes(skill)) {
    return Object.keys(input).length === 0 ? null : `${skill} input must be an empty object`;
  }
  if (skill === "card-status-link") {
    if (!exactKeys(input, ["card", "subject"])) return "card-status-link input requires exactly card and subject";
    if (!/^[0-9a-f]{64}$/i.test(str(input.card) ?? "")) return "card-status-link card must be a 64-hex signed-card hash";
    if (!/^[^\s/@]+\/[^\s@]+@[0-9a-f]{40}(?:[0-9a-f]{24})?$/i.test(str(input.subject) ?? "")) {
      return "card-status-link subject must be owner/model@40-or-64-hex-immutable-revision";
    }
    return null;
  }
  if (skill === "article50-detect") {
    if (!exactKeys(input, ["manifest"], ["asset_hash"]) || !record(input.manifest)) {
      return "article50-detect input requires manifest (object), with optional asset_hash";
    }
    if (input.asset_hash !== undefined && !/^[0-9a-f]{64}$/i.test(str(input.asset_hash) ?? "")) {
      return "article50-detect asset_hash must be 64 hex when supplied";
    }
    return null;
  }
  if (skill === "eu-ai-act-screen") {
    if (!exactKeys(input, ["system"])) return "eu-ai-act-screen input requires exactly system";
    const system = str(input.system);
    if (!system || system.trim().length < 8 || system.length > 4_000) {
      return "eu-ai-act-screen system must be 8 to 4000 characters";
    }
    return null;
  }
  // framework-readiness: the same contract the MCP tool's inputSchema declares — framework
  // required from the shared enum, sector and role optional free words.
  if (skill === "framework-readiness") {
    if (!exactKeys(input, ["framework"], ["sector", "role"])) {
      return 'framework-readiness input is {"framework":<one of ' + READINESS_FRAMEWORK_IDS.join("|") + ">} with optional sector and role";
    }
    const fw = str(input.framework);
    if (!fw || !READINESS_FRAMEWORK_IDS.includes(fw)) {
      return "framework-readiness framework must be one of: " + READINESS_FRAMEWORK_IDS.join(", ");
    }
    for (const opt of ["sector", "role"] as const) {
      const v = input[opt];
      if (v === undefined) continue;
      if (typeof v !== "string" || v.length > 64) {
        return `framework-readiness ${opt} must be a string of at most 64 characters`;
      }
    }
    return null;
  }
  // The measurement-capsule readers: the same module (functions/_lib/measurementCapsule.ts) as the
  // MCP tools measurement_index / verify_capsule / server_evidence, so the doors cannot disagree.
  if (skill === "measurement-capsules") {
    if (exactKeys(input, ["op"]) && input.op === "index") return null;
    if (exactKeys(input, ["op", "capsule_json"]) && input.op === "verify") {
      const c = input.capsule_json;
      if (typeof c === "string" ? c.length > 0 && c.length <= 262_144 : !!record(c)) return null;
      return "measurement-capsules capsule_json must be the capsule's JSON text (<= 256 KiB) or an object";
    }
    return 'measurement-capsules input is {"op":"index"} or {"op":"verify","capsule_json":<capsule JSON text or object>}';
  }
  if (skill === "server-evidence") {
    if (!exactKeys(input, ["endpoint_url"])) return "server-evidence input requires exactly endpoint_url";
    const u = str(input.endpoint_url);
    if (!u || u.length > 2_048) return "server-evidence endpoint_url must be a non-empty string of at most 2048 characters";
    return null;
  }
  // The free evidence-bundle preview: the same module (functions/mcp/_evidence.ts) as the MCP tool
  // evidence_bundle_preview, so the two doors cannot disagree about which cards are relevant.
  if (skill === "evidence-bundle") {
    if (!exactKeys(input, ["obligation"], ["subject"])) return "evidence-bundle input requires obligation, with optional subject";
    const ob = str(input.obligation);
    if (!ob || !["article-50", "article-53", "dora", "cra"].includes(ob)) return "evidence-bundle obligation must be article-50, article-53, dora or cra";
    if (input.subject !== undefined && (typeof input.subject !== "string" || input.subject.length > 120)) return "evidence-bundle subject must be a string of at most 120 characters";
    return null;
  }
  // GSPC Route, decide-only: the same core (functions/_lib/route) as the MCP tool route. The core
  // validates every field itself and answers BAD_ARGUMENTS; here only the envelope is checked.
  if (skill === "gspc-route") {
    const allowed = ["task", "task_sha256", "data_class", "needs_write", "candidates", "policy", "objective", "mode"];
    const extra = Object.keys(input).filter((k) => !allowed.includes(k));
    if (extra.length) return `gspc-route input accepts only ${allowed.join(", ")}`;
    if (input.task === undefined && input.task_sha256 === undefined) return "gspc-route input requires task or task_sha256";
    return null;
  }
  if (skill === "evidence-delivery") return validateEvidenceDeliveryInput(input);
  if (skill === "axis-specialist") return validateAxisSpecialistInput(input);
  return "unsupported skill";
}

function reply(id: unknown, body: Json): Response {
  const rpcId = typeof id === "string" || typeof id === "number" ? id : null;
  return new Response(JSON.stringify({ jsonrpc: "2.0", id: rpcId, ...body }, null, 2), {
    status: 200,
    headers: HEADERS,
  });
}

function rpcError(
  id: unknown,
  code: number,
  message: string,
  reason: string,
  metadata: Record<string, unknown> = {},
): Response {
  return reply(id, {
    error: {
      code,
      message,
      data: [
        {
          "@type": "type.googleapis.com/google.rpc.ErrorInfo",
          reason,
          domain: "a2a-protocol.org",
          metadata: { timestamp: new Date().toISOString(), ...metadata },
        },
      ],
    },
  });
}

export interface DerivedBoard {
  state: "DERIVED" | "UNCHECKABLE";
  source: string;
  as_of: string;
  register: string;
  verify: string;
  root: string;
  reason?: string;
  lid?: string;
  public_count?: string;
  axes?: Array<{
    axis: string | null;
    family: string | null;
    kind: string | null;
    status: string | null;
    n: number | null;
    separation: string | null;
    leader: string | null;
    public_leader_state: string | null;
    /** What the axis's score does not show, as the row states it (axes[].limit). Absent when the row states none. */
    limit?: string;
  }>;
}

/** Derive the board from GET /api/gspc at request time. Nothing here is typed. */
export async function deriveBoard(origin: string): Promise<DerivedBoard> {
  const source = new URL(BOARD_PATH, origin).toString();
  const base: DerivedBoard = {
    state: "UNCHECKABLE",
    source,
    as_of: new Date().toISOString(),
    register: REGISTER,
    verify: new URL("/gspc-verify", origin).toString(),
    root: new URL("/root.json", origin).toString(),
  };
  try {
    const result = await fetchJsonSource(origin, BOARD_PATH);
    const board = record(result.payload);
    if (!board) return { ...base, reason: `${BOARD_PATH} did not return a JSON object` };
    const totals = record(board.totals);
    const lid = str(totals?.lid);
    const axesRaw = Array.isArray(board.axes) ? (board.axes as unknown[]) : [];
    if (!lid || axesRaw.length === 0) {
      return { ...base, reason: `${BOARD_PATH} answered without totals.lid or an axis array` };
    }
    return {
      ...base,
      state: "DERIVED",
      lid,
      public_count: str(totals?.public_count) ?? undefined,
      axes: axesRaw.map((raw) => {
        const a = record(raw) ?? {};
        return {
          axis: str(a.axis),
          family: str(a.family),
          kind: str(a.kind),
          status: str(a.status),
          n: numOrNull(a.n),
          separation: str(a.separation),
          leader: str(a.leader),
          public_leader_state: str(a.public_leader_state),
          // Copied verbatim when the row states a limit (C-2026-1120-02); a row with none gets no limit key.
          ...(typeof a.limit === "string" ? { limit: a.limit } : {}),
        };
      }),
    };
  } catch (error) {
    return {
      ...base,
      reason: error instanceof SourceError ? error.message : `fetch failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function boardText(b: DerivedBoard): string {
  if (b.state !== "DERIVED") {
    return [
      `UNCHECKABLE — GET ${b.source} did not answer as a board (${b.reason}). No number is quoted.`,
      REGISTER,
    ].join("\n");
  }
  return [
    `Lid: ${b.lid}`,
    REGISTER,
    `Derived from GET ${b.source} at ${b.as_of}; counts come from the axis array, never typed. Verify a card free at ${b.verify}; the signed Merkle root is ${b.root}.`,
  ].join("\n");
}

const sourceText = (skill: SkillId, source: string): string => [
  `${skill}: delivered directly from GET/POST ${source}.`,
  "The A2A router attributes this payload to that source; it does not independently verify or promote the source result.",
  REGISTER,
].join("\n");

async function invokeSkill(selection: SkillSelection, origin: string): Promise<{
  text: string;
  data: unknown;
}> {
  const { skill, input } = selection;
  // framework-readiness is computed IN-PROCESS from the same module the MCP tool calls — the
  // deterministic checklist needs no fetch, so the answer cannot drift from the door's.
  if (skill === "framework-readiness") {
    const r = readinessResult(input as Record<string, unknown>);
    const source = "functions/mcp/_readiness.ts (the module the MCP tool framework_readiness calls)";
    return {
      text: [
        `${skill}: computed in-process from ${source}.`,
        "A checklist is preparation, never a determination: nothing here states or implies the caller's status under any framework. Not legal advice.",
        REGISTER,
      ].join("\n"),
      data: {
        state: "DELIVERED_SOURCE",
        skill,
        source,
        as_of: new Date().toISOString(),
        register: REGISTER,
        source_attribution:
          "Direct same-source output, computed in-process from the shared module; not independently verified or promoted.",
        payload: r.payload ?? { state: "BAD_ARGUMENTS", error: r.error, not_a_certification: true },
      },
    };
  }
  if (skill === "measurement-capsules" || skill === "server-evidence") {
    const payload =
      skill === "server-evidence"
        ? await serverEvidence(origin, input.endpoint_url)
        : input.op === "verify"
          ? await verifyCapsule(origin, input.capsule_json)
          : await measurementIndex(origin);
    return {
      text: [
        `${skill}: ${String(payload.state)} — re-derived by this router from the static measurement-capsule files on ${origin}/measurement-capsules/ (ids, Merkle inclusion and the index signature are recomputed, not relayed).`,
        `Doctrine: ${DOCTRINE}. States only; no verdict, score or ranking.`,
        REGISTER,
      ].join("\n"),
      data: { state: payload.state, skill, as_of: new Date().toISOString(), doctrine: DOCTRINE, register: REGISTER, payload },
    };
  }
  if (skill === "evidence-bundle") {
    const payload = await evidenceBundlePreview(origin, input);
    return {
      text: [
        `evidence-bundle: ${String(payload.state)} — ${String(payload.relevant_signed_cards ?? 0)} already-signed card(s) relevant-to ${String((payload.obligation as Json | undefined)?.id ?? input.obligation)}, read from ${origin}/api/evidence-bundle (the same module as the MCP tool evidence_bundle_preview).`,
        payload.review_note ? String(payload.review_note) : "Observations only; relevant-to is never a determination.",
        `Doctrine: ${DOCTRINE}. This skill never charges; the assembled bundle is the x402 tool evidence_bundle (POST /mcp, or the per-tool skill evidence_bundle on this door).`,
        REGISTER,
      ].join("\n"),
      data: { state: payload.state, skill, as_of: new Date().toISOString(), doctrine: DOCTRINE, register: REGISTER, payload },
    };
  }
  if (skill === "gspc-route") {
    const payload = await routeResult(input as Record<string, unknown>, origin);
    return {
      text: [
        `gspc-route: ${routeSummary(payload)}`,
        "Decide-only and unsigned: the caller's policy applied to published measurements (the same module as the MCP tool route). Routing is not ranking.",
        `Doctrine: ${DOCTRINE}.`,
        REGISTER,
      ].join("\n"),
      data: { state: payload.state, skill, as_of: new Date().toISOString(), doctrine: DOCTRINE, register: REGISTER, payload },
    };
  }
  if (skill === "axis-specialist") {
    const result = axisSpecialistResult(input);
    return {
      text: [result.text, "Every axis remains readable through its existing MCP axis tool. Proposals require MEOK H.I.M.-compatible human approval.", REGISTER].join("\n"),
      data: { state: result.state, skill, register: REGISTER, payload: result.payload },
    };
  }
  if (skill === "gspc-board") {
    const board = await deriveBoard(origin);
    return { text: boardText(board), data: { ...board, skill } };
  }

  let path: string;
  let method: "GET" | "POST" = "GET";
  let body: string | undefined;
  switch (skill) {
    case "east-west-crosswalk":
      path = "/api/cross";
      break;
    case "card-status-link": {
      const query = new URLSearchParams({
        format: "json",
        card: String(input.card),
        subject: String(input.subject),
      });
      path = `/api/badge?${query.toString()}`;
      break;
    }
    case "benchmark-quality-register":
      path = "/api/benchmark-quality";
      break;
    case "article50-detect":
      path = "/api/detect";
      method = "POST";
      body = JSON.stringify(input);
      break;
    case "eu-ai-act-screen":
      path = "/api/assess";
      method = "POST";
      body = JSON.stringify({ system: input.system });
      break;
    case "x402-discovery":
      path = "/api/x402";
      break;
    // The estate census. /api/state is the whole state surface, so the handler below returns the
    // source as-is; a caller wanting only the census reads .estate_index from it. The full index
    // is deliberately NOT served here: 7,940 rows do not belong in a message payload, and the
    // artefact URL plus its OpenTimestamps proof are named on the card.
    case "estate-index":
      path = "/api/state";
      break;
  }
  const result = await fetchJsonSource(origin, path, { method, body });
  return {
    text: sourceText(skill, result.source),
    data: {
      state: "DELIVERED_SOURCE",
      skill,
      source: result.source,
      as_of: new Date().toISOString(),
      register: REGISTER,
      source_attribution:
        "Direct same-origin source output. The A2A router did not independently verify or promote it.",
      payload: result.payload,
    },
  };
}

/** The x402 A2A transport's payment field (x402 specs/transports-v2/a2a.md, "Payment Payload Transmission"). */
export const A2A_PAYMENT_PAYLOAD_KEY = "x402.payment.payload";
const A2A_PAYMENT_FIELD = `message.metadata["${A2A_PAYMENT_PAYLOAD_KEY}"]`;

/** The PaymentPayload a message carries in its metadata, or undefined (a null field is no payment). */
function a2aMetaPayment(message: Json): unknown {
  const payload = record(message.metadata)?.[A2A_PAYMENT_PAYLOAD_KEY];
  return payload === null ? undefined : payload;
}

/**
 * The x402 A2A transport's status fields on the reply message: the challenge in
 * "x402.payment.required", or the settlement the route reported in "x402.payment.receipts". This
 * door answers SendMessage with a Message, not a Task, so only the metadata half of that transport
 * is carried here; the data part stays the full tool result.
 */
function a2aPaymentMetadata(result: McpToolResult): Json | null {
  const settlement = record(record(result._meta)?.[X402_META_PAYMENT_RESPONSE]);
  if (settlement)
    return {
      "x402.payment.status": settlement.success === false ? "payment-failed" : "payment-completed",
      "x402.payment.receipts": [settlement],
    };
  const structured = record(result.structuredContent);
  if (structured?.status !== "PAYMENT_REQUIRED") return null;
  return {
    "x402.payment.status": structured.payment_presented === true ? "payment-failed" : "payment-required",
    "x402.payment.required": structured.payment_required ?? null,
  };
}

/**
 * X402 TASK — the task half of the x402 A2A transport (lane a2a-x402-task-flow-20261122).
 *
 * x402 `specs/transports-v2/a2a.md` and the a2a-x402 extension (v0.1, v0.2) signal "payment
 * required" with a Task in state input-required, and the client pays by sending a Message that
 * names that task (taskId) with its PaymentPayload in metadata. This door answered every
 * SendMessage with a Message, so a client built to either spec never recognised the challenge.
 *
 * It is opt-in and stateless:
 *   - Only a request that activates the extension (X-A2A-Extensions, or A2A-Extensions, naming
 *     one of A2A_X402_EXTENSION_URIS) gets a Task, and only for a metered skill's unpaid
 *     challenge. Every other reply is the Message it was before.
 *   - No task store. The Task's id is "x402-" + base64url of {tool, input, contextId}: the client
 *     carries its own request back, and the context it belongs to, so a follow-up that names
 *     only the task stays in the conversation the challenge was issued in. Nothing is trusted from it that the first call did not also send -
 *     the input is validated against the tool's schema again, and the route verifies the payment
 *     against its own requirements for that input - so a forged id buys nothing a plain call
 *     would not. KV was not used: it is eventually consistent, and the paying message follows
 *     the challenge within seconds.
 *   - The follow-up runs the same dispatch with the PaymentPayload on the path #4517 built, and
 *     answers with the Task again: completed with x402.payment.receipts when the route reports a
 *     settlement, failed with x402.payment.error when the payment was refused. GetTask still
 *     answers -32001: the SendMessage reply is the only record of an x402 Task.
 */
export const A2A_X402_EXTENSION_URIS: readonly string[] = [
  "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2",
  "https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.1",
  "https://github.com/google-a2a/a2a-x402/v0.1",
];

/** The x402 extension URI this request activates, or null. Header names per A2A 0.3 and 1.0. */
export function a2aX402Extension(headers: Headers): string | null {
  const asked = [headers.get("x-a2a-extensions"), headers.get("a2a-extensions")]
    .filter((v): v is string => !!v)
    .join(",")
    .split(",")
    .map((v) => v.trim().replace(/\/+$/, ""));
  return A2A_X402_EXTENSION_URIS.find((uri) => asked.includes(uri)) ?? null;
}

export const X402_TASK_PREFIX = "x402-";
export const X402_TASK_ID_MAX = 2048;
// Arguments that select something other than "buy this": never part of a payment Task.
const X402_TASK_EXCLUDED_ARGS = ["x_payment", "preview", "purchase_action"];

/** The id of the payment Task for this call, or null when the input is too large to carry. */
export function x402TaskId(tool: string, input: Json, contextId?: string): string | null {
  // A blank x_payment and preview:false say nothing; anything else in that list is not a purchase.
  const carried: Json = { ...input };
  if (typeof carried.x_payment === "string" && carried.x_payment.trim() === "") delete carried.x_payment;
  if (carried.preview === false) delete carried.preview;
  if (X402_TASK_EXCLUDED_ARGS.some((key) => key in carried)) return null;
  const json = JSON.stringify({ t: tool, i: carried, ...(contextId ? { c: contextId } : {}) }).replace(
    /[\u0080-\uffff]/g,
    (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
  const id = X402_TASK_PREFIX + btoa(json).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return id.length <= X402_TASK_ID_MAX ? id : null;
}

/** What an x402 Task id carries, decoded; null when it is not base64url JSON of an object. */
function x402TaskBody(taskId: string): Json | null {
  if (!taskId.startsWith(X402_TASK_PREFIX) || taskId.length > X402_TASK_ID_MAX) return null;
  try {
    return record(JSON.parse(atob(taskId.slice(X402_TASK_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/"))));
  } catch {
    return null;
  }
}

/** The context an x402 Task was issued in, when its id carries one. */
export function x402TaskContextId(taskId: string): string | null {
  return str(x402TaskBody(taskId)?.c) ?? null;
}

/** The call an x402 Task id carries, or null when it is not one this door could have issued. */
export function x402TaskSelection(taskId: string): ToolSelection | null {
  try {
    const decoded = x402TaskBody(taskId);
    if (decoded && "c" in decoded && !str(decoded.c)) return null;
    const tool = str(decoded?.t);
    const input = record(decoded?.i);
    if (!tool || !input || !PAID_TOOL_NAMES.has(tool) || !TOOL_SKILL_SET.has(tool)) return null;
    if (X402_TASK_EXCLUDED_ARGS.some((key) => key in input)) return null;
    return { kind: "TOOL", tool, input };
  } catch {
    return null;
  }
}

/** The a2a-x402 section 9.1 code for a refusal, read from the reason the route gave. */
export function x402PaymentErrorCode(reason: string): string {
  const r = reason.toLowerCase();
  if (/insufficient|balance|funds/.test(r)) return "INSUFFICIENT_FUNDS";
  if (/signature/.test(r)) return "INVALID_SIGNATURE";
  if (/expired|valid_?before|valid_?after/.test(r)) return "EXPIRED_PAYMENT";
  if (/nonce/.test(r)) return "DUPLICATE_NONCE";
  if (/network|chain/.test(r)) return "NETWORK_MISMATCH";
  if (/amount|value/.test(r)) return "INVALID_AMOUNT";
  // Not SETTLEMENT_FAILED: that code says a transaction failed on-chain, and none was sent.
  return "VERIFICATION_FAILED";
}

type X402TaskMode = { extension: string | null; taskId?: string };

/** The x402 payment Task for a metered skill's result. Never invents a settlement. */
function x402TaskReply(
  id: unknown,
  args: {
    taskId: string;
    contextId: string;
    extension: string | null;
    result: McpToolResult;
    presented: boolean;
    textPart: Json;
    dataPart: Json;
    /** Set only for a state the tool result cannot express (the client's own rejection). */
    paymentStatus?: string;
  },
): Response {
  const { result } = args;
  const structured = record(result.structuredContent) ?? {};
  const challenge = record(structured.payment_required);
  let metadata: Json | null = args.paymentStatus
    ? { "x402.payment.status": args.paymentStatus }
    : a2aPaymentMetadata(result);
  // Delivery is what the paid wrapper says was delivered, never the absence of an error: a route
  // that is not deployed answers NOT_DEPLOYED / NOT_DELIVERED with isError false (a state, not a
  // fault), and nothing was verified or delivered there.
  const delivered = structured.status === "DELIVERED" && structured.delivery_state === "DELIVERED";
  if (!metadata) {
    metadata =
      args.presented && delivered
        ? // Delivered, and the route settles before it delivers, but it reported no settlement here.
          { "x402.payment.status": "payment-verified", "x402.payment.receipts": [] }
        : // A payload was received and its outcome is not established, or none was and none was taken.
          { "x402.payment.status": args.presented ? "payment-submitted" : "payment-required" };
  } else if (metadata["x402.payment.status"] === "payment-failed" && !("x402.payment.receipts" in metadata)) {
    const reason =
      str(record(challenge?.csoai)?.not_paid_reason) ?? str(challenge?.error) ?? "the payment was not accepted";
    const network = str(record(Array.isArray(challenge?.accepts) ? challenge.accepts[0] : null)?.network);
    metadata = {
      ...metadata,
      "x402.payment.error": x402PaymentErrorCode(reason),
      "x402.payment.receipts": [{ success: false, errorReason: reason, transaction: "", ...(network ? { network } : {}) }],
    };
  }
  const state =
    metadata["x402.payment.status"] === "payment-required" && structured.status === "PAYMENT_REQUIRED"
      ? "TASK_STATE_INPUT_REQUIRED"
      : delivered
        ? "TASK_STATE_COMPLETED"
        : "TASK_STATE_FAILED";
  const completed = state === "TASK_STATE_COMPLETED";
  const body = {
    result: {
      task: {
        id: args.taskId,
        contextId: args.contextId,
        status: {
          state,
          timestamp: new Date().toISOString(),
          message: {
            messageId: crypto.randomUUID(),
            contextId: args.contextId,
            taskId: args.taskId,
            role: "ROLE_AGENT",
            metadata,
            // The deliverable goes in the artifact once; a challenge or a refusal is read here.
            parts: completed ? [args.textPart] : [args.textPart, args.dataPart],
          },
        },
        ...(completed ? { artifacts: [{ artifactId: crypto.randomUUID(), name: str(record(args.dataPart.data)?.skill) ?? "result", parts: [args.dataPart] }] } : {}),
      },
    },
  };
  const res = reply(id, body);
  if (!args.extension) return res;
  const headers = new Headers(res.headers);
  headers.set("x-a2a-extensions", args.extension);
  return new Response(res.body, { status: res.status, headers });
}

/**
 * A per-tool skill. The input is validated against the tool's inputSchema first, so a refused
 * input calls no route and forwards no payment. The tool then runs through the dispatch POST /mcp
 * tools/call runs, and its result (content, structuredContent, isError) is quoted unchanged in
 * the data part: a client reads exactly what /mcp would have answered. Payment is read from
 * input.x_payment, as the MCP tool reads its x_payment argument, or from the x402 A2A transport's
 * PaymentPayload in message.metadata["x402.payment.payload"], which reaches the paid wrapper by
 * the same path as the MCP door's params._meta["x402/payment"] (caller.metaPayment). One channel
 * per call. Never from text, part metadata or an HTTP header.
 */
async function sendToolMessage(
  id: unknown,
  selection: ToolSelection,
  contextId: string | null,
  origin: string,
  caller?: PaidCallerContext,
  metaPayment?: unknown,
  x402Task?: X402TaskMode,
): Promise<Response> {
  const { tool, input } = selection;
  const invalid = await toolInputError(tool, input);
  if (invalid) {
    return rpcError(id, A2A_ERROR.INVALID_PARAMS, invalid, "INVALID_SKILL_INPUT", { skill: tool });
  }
  const metered = PAID_TOOL_NAMES.has(tool);
  // The x402 A2A transport's PaymentPayload goes to the paid wrapper only for a metered skill. It is
  // refused here, before any route is called, when it is not one PaymentPayload object or when
  // input.x_payment is also set; the wording names this door's field, not the MCP door's.
  if (metered && metaPayment !== undefined) {
    const twice = typeof input.x_payment === "string" && input.x_payment.trim() !== "";
    const encoded = twice ? null : metaPaymentHeader(metaPayment);
    const refusal = twice
      ? `payment was sent twice: use input.x_payment or ${A2A_PAYMENT_FIELD}, not both`
      : encoded && "error" in encoded
        ? encoded.error.replace(`_meta["${X402_META_PAYMENT}"]`, A2A_PAYMENT_FIELD)
        : null;
    if (refusal)
      return rpcError(id, A2A_ERROR.INVALID_PARAMS, `${refusal}. Nothing was forwarded; nothing was charged.`, "INVALID_SKILL_INPUT", {
        skill: tool,
        field: A2A_PAYMENT_FIELD,
      });
    caller = { ...caller, metaPayment };
  }
  // Which field this door read a payment from, said in the reply so a client and the usage row
  // (a2aPaidCallName) need not infer it. Both at once never reaches here: it was refused above.
  const paymentChannel = !metered
    ? undefined
    : metaPayment !== undefined
      ? A2A_PAYMENT_FIELD
      : typeof input.x_payment === "string" && input.x_payment.trim() !== ""
        ? "input.x_payment"
        : "none";
  let result: McpToolResult;
  try {
    result = await dispatchTool(tool, input, origin, { paid: true }, caller);
  } catch {
    return rpcError(
      id,
      A2A_ERROR.INTERNAL,
      metered
        ? `${tool} failed before it answered. Delivery and settlement are unconfirmed; inspect receipts before retrying paid work.`
        : `${tool} failed before it answered. Nothing was written.`,
      "SKILL_SOURCE_UNAVAILABLE",
      { skill: tool, source: "functions/mcp/_dispatch.ts", source_state: "FETCH_FAILED" },
    );
  }
  const structured = record(result.structuredContent);
  const state = str(structured?.status) ?? str(structured?.state) ?? (result.isError ? "TOOL_ERROR" : "ANSWERED");
  const texts = result.content.map((c) => c.text);
  // paidToolResult's 402 answer carries the machine JSON first and its human line second.
  const human = (texts.length > 1 && texts[0].trimStart().startsWith("{") ? texts[1] : texts[0]) ?? "";
  const summary = human.split("\n\n")[0].slice(0, 2_000);
  const paymentMetadata = metered ? a2aPaymentMetadata(result) : null;
  const textPart: Json = {
    text: [
      `${tool}: ${state} — run by the dispatch POST /mcp tools/call runs (functions/mcp/_dispatch.ts).`,
      summary,
      metered
        ? "Metered (x402): payment is read from input.x_payment, or from the x402 A2A transport's PaymentPayload in message.metadata[\"x402.payment.payload\"] (one channel per call), and the tool's route settles it, fail closed. With neither, nothing is charged."
        : "Free: no payment is read or asked for.",
      REGISTER,
    ].filter(Boolean).join("\n"),
    mediaType: "text/plain",
  };
  const dataPart: Json = {
    data: {
      kind: "TOOL_RESULT",
      skill: tool,
      tool,
      state,
      metered,
      ...(paymentChannel ? { payment_channel: paymentChannel } : {}),
      door: "POST /api/a2a",
      same_as: `POST /mcp tools/call ${tool}`,
      card: new URL(`/.well-known/agents/${tool}.json`, origin).toString(),
      register: REGISTER,
      result,
    },
    mediaType: "application/json",
  };
  // X402 TASK (above): a follow-up on a payment Task always answers with that Task; a first call
  // gets one only when the extension is activated and the answer is the unpaid challenge.
  if (metered && x402Task) {
    const taskContext = contextId ?? crypto.randomUUID();
    const taskId =
      x402Task.taskId ??
      (x402Task.extension && paymentChannel === "none" && structured?.status === "PAYMENT_REQUIRED"
        ? x402TaskId(tool, input, taskContext)
        : null);
    if (taskId) {
      return x402TaskReply(id, {
        taskId,
        contextId: taskContext,
        extension: x402Task.extension,
        result,
        presented: paymentChannel !== "none",
        textPart,
        dataPart,
      });
    }
  }
  return reply(id, {
    result: {
      message: {
        messageId: crypto.randomUUID(),
        contextId: contextId ?? crypto.randomUUID(),
        role: "ROLE_AGENT",
        ...(paymentMetadata ? { metadata: paymentMetadata } : {}),
        parts: [textPart, dataPart],
      },
    },
  });
}

async function sendMessage(id: unknown, params: unknown, origin: string, caller?: PaidCallerContext, x402Extension: string | null = null): Promise<Response> {
  const p = record(params);
  const message = record(p?.message);
  if (!message) {
    return rpcError(id, A2A_ERROR.INVALID_PARAMS, "params.message (Message) is required", "INVALID_PARAMS", {
      field: "params.message",
    });
  }
  if (str(p?.tenant)) {
    return rpcError(
      id,
      A2A_ERROR.INVALID_PARAMS,
      "this interface declares no tenant; omit params.tenant",
      "INVALID_PARAMS",
      { field: "params.tenant" },
    );
  }
  if (!str(message.messageId) || !Array.isArray(message.parts)) {
    return rpcError(
      id,
      A2A_ERROR.INVALID_PARAMS,
      "params.message needs messageId (string) and parts (array)",
      "INVALID_PARAMS",
      { field: "params.message" },
    );
  }
  // X402 TASK follow-up: a Message that names a payment Task this door issued. The call comes from
  // the task id, so the parts (the specs' examples send a line of text) are not read as a selector.
  const taskId = str(message.taskId);
  if (taskId && taskId.startsWith(X402_TASK_PREFIX)) {
    const paying = x402TaskSelection(taskId);
    if (!paying) {
      return rpcError(id, A2A_ERROR.TASK_NOT_FOUND, "task not found: this is not an x402 payment Task this door issues", "TASK_NOT_FOUND", { taskId: taskId.slice(0, 64) });
    }
    // A follow-up that names only the task stays in the task's context (A2A: the agent infers it
    // from the task). One that names a different context is refused before anything runs.
    const issuedIn = x402TaskContextId(taskId);
    const named = str(message.contextId);
    if (issuedIn && named && named !== issuedIn) {
      return rpcError(id, A2A_ERROR.INVALID_PARAMS, "message.contextId does not match the context this task was issued in; omit it or send the task's contextId. Nothing was forwarded; nothing was charged.", "INVALID_PARAMS", { field: "params.message.contextId" });
    }
    const contextId = issuedIn ?? named ?? crypto.randomUUID();
    if (record(message.metadata)?.["x402.payment.status"] === "payment-rejected") {
      // The client declined the terms. Nothing is run, forwarded or charged.
      return x402TaskReply(id, {
        taskId,
        contextId,
        extension: x402Extension,
        presented: false,
        paymentStatus: "payment-rejected",
        result: { content: [], structuredContent: { status: "PAYMENT_REJECTED_BY_CLIENT", nothing_charged: true }, isError: true },
        textPart: { text: `${paying.tool}: the client rejected the payment requirements. Nothing was run and nothing was charged.`, mediaType: "text/plain" },
        // Not a TOOL_RESULT: no tool was dispatched, so a2aPaidCallName writes no paid_call row.
        dataPart: { data: { kind: "X402_PAYMENT_REJECTED", skill: paying.tool, tool: paying.tool, state: "PAYMENT_REJECTED_BY_CLIENT", dispatched: false, door: "POST /api/a2a", register: REGISTER }, mediaType: "application/json" },
      });
    }
    return sendToolMessage(id, paying, contextId, origin, caller, a2aMetaPayment(message), { extension: x402Extension, taskId });
  }
  const selection = parseSkillSelection(message);
  if (typeof selection === "string") {
    return rpcError(id, A2A_ERROR.INVALID_PARAMS, selection, "INVALID_SKILL_SELECTOR", {
      field: "params.message.parts",
    });
  }
  if ("kind" in selection && selection.kind === "TALK") {
    const t = await executePlan(selection.plan, origin);
    return reply(id, {
      result: {
        message: {
          messageId: crypto.randomUUID(),
          contextId: str(message.contextId) ?? crypto.randomUUID(),
          role: "ROLE_AGENT",
          parts: [
            { text: t.answer, mediaType: "text/plain" },
            {
              data: {
                kind: t.grounded ? "GROUNDED_TOOL_ANSWER" : t.kind === "needs_input" ? "NEEDS_INPUT" : "NO_TOOL_MATCHED",
                state: t.grounded ? "grounded" : t.kind === "needs_input" ? "needs_input" : "unknown",
                intent: t.intent,
                label: t.label,
                answered_by: t.answered_by,
                citations: t.citations,
                tool_calls: t.tool_calls,
                register: REGISTER,
              },
              mediaType: "application/json",
            },
          ],
        },
      },
    });
  }
  if ("kind" in selection && selection.kind === "TOOL") {
    return sendToolMessage(id, selection, str(message.contextId), origin, caller, a2aMetaPayment(message), x402Extension ? { extension: x402Extension } : undefined);
  }
  if ("kind" in selection) {
    return reply(id, {
      result: {
        message: {
          messageId: crypto.randomUUID(),
          contextId: str(message.contextId) ?? crypto.randomUUID(),
          role: "ROLE_AGENT",
          parts: [
            {
              text: `I publish AI-governance measurements and evidence. For a result, send one Part.data {skill,input}; available skill IDs: ${SKILL_IDS.join(", ")}. Each tool POST /mcp serves is also a skill here, by its own name: ${new URL(TOOL_CARDS_PATH, origin).toString()} lists them. This capability description is not a measurement or certification.`,
              mediaType: "text/plain",
            },
            {
              data: {
                kind: "CAPABILITY_HELP",
                state: "DESCRIPTIVE_ONLY",
                protocolVersion: A2A_PROTOCOL_VERSION,
                skills: [...SKILL_IDS],
                tool_skills: new URL(TOOL_CARDS_PATH, origin).toString(),
                selector: { skill: "gspc-board", input: {} },
                register: REGISTER,
              },
              mediaType: "application/json",
            },
          ],
        },
      },
    });
  }
  const invalidInput = validateSkillInput(selection);
  if (invalidInput) {
    return rpcError(id, A2A_ERROR.INVALID_PARAMS, invalidInput, "INVALID_SKILL_INPUT", {
      skill: selection.skill,
    });
  }
  if (selection.skill === "evidence-delivery") {
    return reply(id, {
      result: evidenceDeliveryMessage(
        selection.input,
        crypto.randomUUID(),
        str(message.contextId) ?? crypto.randomUUID(),
      ),
    });
  }
  let outcome: { text: string; data: unknown };
  try {
    outcome = await invokeSkill(selection, origin);
  } catch (error) {
    const sourceError = error instanceof SourceError ? error : null;
    return rpcError(
      id,
      A2A_ERROR.INTERNAL,
      sourceError?.message ?? "skill source failed",
      "SKILL_SOURCE_UNAVAILABLE",
      {
        skill: selection.skill,
        source: sourceError?.source ?? "same-origin handler",
        source_state: sourceError?.kind ?? "FETCH_FAILED",
      },
    );
  }
  const contextId = str(message.contextId) ?? crypto.randomUUID();
  return reply(id, {
    result: {
      message: {
        messageId: crypto.randomUUID(),
        contextId,
        role: "ROLE_AGENT",
        parts: [
          { text: outcome.text, mediaType: "text/plain" },
          { data: outcome.data, mediaType: "application/json" },
        ],
      },
    },
  });
}

const PUSH_METHODS = new Set([
  "CreateTaskPushNotificationConfig",
  "GetTaskPushNotificationConfig",
  "ListTaskPushNotificationConfigs",
  "DeleteTaskPushNotificationConfig",
]);

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: HEADERS });

export const onRequestGet: PagesFunction = async (context) => {
  const origin = new URL(context.request.url).origin;
  const body = {
    binding: "JSONRPC",
    protocolVersion: A2A_PROTOCOL_VERSION,
    endpoint: new URL("/api/a2a", origin).toString(),
    agent_card: new URL(CARD_PATH, origin).toString(),
    methods: METHODS,
    // Derived, never typed: the skill ids this router accepts. A reader counts this array; no
    // sentence on this endpoint states how many there are.
    skills: [...SKILL_IDS],
    // The per-tool skills, derived the same way: one for each tool POST /mcp serves (2026-11-16).
    tool_skills: {
      cards: new URL(TOOL_CARDS_PATH, origin).toString(),
      ids: [...TOOL_SKILL_IDS],
      metered: [...METERED_TOOL_SKILL_IDS],
      selector: 'Part.data {"skill":"<tool>","input":{...}}: input is the MCP tool\'s arguments, validated against its inputSchema',
      payment:
        "A metered tool answers with its x402 challenge (result.structuredContent.accepts) and charges nothing. To pay, send the same selector again with input.x_payment set to the base64 payment payload, or with the PaymentPayload object in message.metadata[\"x402.payment.payload\"] (x402 A2A transport); the tool's route verifies and settles it, fail closed. A request that activates the a2a-x402 extension (X-A2A-Extensions) gets the challenge as a Task in state input-required instead, and pays by sending a Message with that taskId and the PaymentPayload in the same metadata field; the Task is not stored, so GetTask does not find it. Payment is never read from text, part metadata or HTTP headers. Verification stays free.",
    },
    version_rule:
      "Send `A2A-Version: 1.0`; a patch number (1.0.1) is ignored, as A2A v1.0 section 3.6 requires. Per A2A v1.0, an absent or empty header means 0.3. A v1.0 method name sent as 0.3 returns VersionNotSupportedError -32009; any other name that is not an A2A 0.3 method returns -32601. The 0.3 wire shape itself is served: a 0.3 method name (message/send, tasks/get, ...) with no header or a 0.x one is mapped onto the 1.0 handler and answered in the 0.3 shape (a Message, or a Task for an x402 payment challenge under the extension); a request that declares 1.0 must use the 1.0 names. A body that is not JSON-RPC returns -32600; to ask in plain words, POST {\"message\": \"...\"} to /api/chat.",
    compat_0_3: Object.keys(V03_METHODS),
    tasks:
      "none stored. A SendMessage answers with a Message, with one exception: a metered skill's x402 challenge to a request that activates the a2a-x402 extension is a Task in state input-required, whose id carries the request and its context. That Task is answered only by the SendMessage that names it with a payment or a rejection, so GetTask can only ever say TaskNotFound.",
    register: REGISTER,
    example: {
      jsonrpc: "2.0",
      id: 1,
      method: "SendMessage",
      params: {
        message: {
          messageId: "m-1",
          role: "ROLE_USER",
          parts: [{ data: { skill: "gspc-board", input: {} }, mediaType: "application/json" }],
        },
      },
    },
  };
  return new Response(JSON.stringify(body, null, 2), { status: 200, headers: HEADERS });
};

export async function handlePost(request: Request, env?: unknown): Promise<Response> {
  const origin = new URL(request.url).origin;
  // The caller context POST /mcp builds, built the same way: only a request that carries
  // Authorization has one, and only a paid tool's purchase actions and its route read it.
  const caller: PaidCallerContext | undefined = request.headers.has("authorization")
    ? { authorization: request.headers.get("authorization") || undefined, env: (env || {}) as PaidCallerContext["env"] }
    : undefined;

  let parsed: unknown;
  let text: string;
  try {
    text = await readBoundedRequestText(request);
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return rpcError(null, A2A_ERROR.INVALID_REQUEST, error.message, error.kind);
    }
    return rpcError(null, A2A_ERROR.INVALID_REQUEST, "request body could not be read", "REQUEST_READ_FAILED");
  }
  // `received` is the body's SHAPE (content class + allowlisted top-level key names, never a
  // value; functions/_lib/askInput.ts). onRequestPost records it as reject_shape on /api/usage.
  const ctype = (request.headers.get("content-type") ?? "").toLowerCase();
  try {
    parsed = JSON.parse(text);
  } catch {
    const received = text.trim() ? (ctype.includes("form") ? "form" : ctype.includes("json") ? "unparsed" : "text") : "none";
    return rpcError(null, A2A_ERROR.PARSE, `request body is not JSON. ${NOT_JSONRPC_HINT}`, "PARSE_ERROR", { received });
  }
  if (Array.isArray(parsed)) {
    return rpcError(null, A2A_ERROR.INVALID_REQUEST, "batch requests are not served here; send one request per POST", "INVALID_REQUEST", { received: "json.array" });
  }
  const req = record(parsed);
  const id = req?.id;
  const method = str(req?.method);
  if (!req || req.jsonrpc !== "2.0" || !method) {
    return rpcError(
      id,
      A2A_ERROR.INVALID_REQUEST,
      `a JSON-RPC 2.0 request needs jsonrpc:"2.0" and a method. ${NOT_JSONRPC_HINT}`,
      "INVALID_REQUEST",
      { received: shapeLabel("json", parsed) },
    );
  }

  const rawVersion = (request.headers.get("a2a-version") ?? "").trim();
  const requested = normalizeA2aVersion(rawVersion);
  // The 0.3 wire shape: a 0.3 method name with no version header (or a 0.x one).
  if (isLegacyVersionHeader(rawVersion) && Object.prototype.hasOwnProperty.call(V03_METHODS, method)) {
    return serveV03(id, method, req.params, origin, caller, a2aX402Extension(request.headers));
  }
  if (isLegacyVersionHeader(rawVersion)) {
    // An absent header means 0.3 (A2A v1.0 section 3.6.2), and the 0.3 names ARE served above.
    // Until 2026-10-07 the no-header case told every such caller "0.3, which this interface does
    // not serve" with -32009 - false since the 0.3 shim landed on 2026-09-29 - and gave the same
    // answer to MCP methods (initialize, tools/list) sent to the wrong door.
    const declared = rawVersion || "absent (0.3)";
    if (Object.prototype.hasOwnProperty.call(METHODS, method)) {
      return rpcError(
        id,
        A2A_ERROR.VERSION_NOT_SUPPORTED,
        rawVersion
          ? `A2A-Version ${rawVersion} is served only with the 0.3 method names; ${unversionedMethodHint(method)}`
          : `An absent A2A-Version means 0.3, and ${unversionedMethodHint(method)}`,
        "VERSION_NOT_SUPPORTED",
        {
          requested: rawVersion || "0.3",
          supported: [A2A_PROTOCOL_VERSION],
          served_0_3: Object.keys(V03_METHODS),
          ...(rawVersion ? {} : { missingVersionHeader: true }),
        },
      );
    }
    return rpcError(
      id,
      A2A_ERROR.METHOD_NOT_FOUND,
      `method not found: ${method}. A2A-Version ${declared}: ${unversionedMethodHint(method)}`,
      "METHOD_NOT_FOUND",
      { method, requested: rawVersion || "0.3", served_0_3: Object.keys(V03_METHODS), ...(rawVersion ? {} : { missingVersionHeader: true }) },
    );
  }
  if (requested !== A2A_PROTOCOL_VERSION) {
    return rpcError(
      id,
      A2A_ERROR.VERSION_NOT_SUPPORTED,
      `A2A-Version ${rawVersion} is not served; this interface speaks ${A2A_PROTOCOL_VERSION} (a patch number is ignored), and 0.3 with the 0.3 method names`,
      "VERSION_NOT_SUPPORTED",
      { requested: rawVersion, supported: [A2A_PROTOCOL_VERSION] },
    );
  }
  if (Object.prototype.hasOwnProperty.call(V03_METHODS, method)) {
    return rpcError(
      id,
      A2A_ERROR.VERSION_NOT_SUPPORTED,
      `${method} is a 0.3 method name; with A2A-Version: ${A2A_PROTOCOL_VERSION} send the 1.0 name ${V03_METHODS[method]}, or send ${method} with no A2A-Version header (0.3)`,
      "VERSION_NOT_SUPPORTED",
      { method, supported: [A2A_PROTOCOL_VERSION] },
    );
  }

  return dispatchV1(id, method, req.params, origin, caller, a2aX402Extension(request.headers));
}

async function dispatchV1(id: unknown, method: string, params: unknown, origin: string, caller?: PaidCallerContext, x402Extension: string | null = null): Promise<Response> {
  switch (method) {
    case "SendMessage":
      return sendMessage(id, params, origin, caller, x402Extension);
    case "GetTask":
    case "CancelTask": {
      const taskId = str(record(params)?.id) ?? null;
      return rpcError(
        id,
        A2A_ERROR.TASK_NOT_FOUND,
        taskId?.startsWith(X402_TASK_PREFIX)
          ? "task not found: an x402 payment Task is not stored; it is answered only by the SendMessage that names it with a payment or a rejection"
          : "task not found: this agent keeps no task store; a SendMessage answers with a Message, or with an x402 payment Task that is not stored",
        "TASK_NOT_FOUND",
        { taskId: taskId ? taskId.slice(0, 64) : null },
      );
    }
    case "ListTasks":
      return rpcError(id, A2A_ERROR.UNSUPPORTED_OPERATION, "ListTasks is not supported: this agent keeps no task store", "UNSUPPORTED_OPERATION", { method });
    case "SendStreamingMessage":
    case "SubscribeToTask":
      return rpcError(id, A2A_ERROR.UNSUPPORTED_OPERATION, `${method} is not supported: capabilities.streaming is false on ${CARD_PATH}`, "UNSUPPORTED_OPERATION", { method });
    case "GetExtendedAgentCard":
      return rpcError(id, A2A_ERROR.UNSUPPORTED_OPERATION, `GetExtendedAgentCard is not supported: capabilities.extendedAgentCard is false; the public card at ${CARD_PATH} is the whole card`, "UNSUPPORTED_OPERATION", { method });
    default:
      if (PUSH_METHODS.has(method)) {
        return rpcError(id, A2A_ERROR.PUSH_NOTIFICATION_NOT_SUPPORTED, `${method} is not supported: capabilities.pushNotifications is false on ${CARD_PATH}`, "PUSH_NOTIFICATION_NOT_SUPPORTED", { method });
      }
      return rpcError(id, A2A_ERROR.METHOD_NOT_FOUND, `method not found: ${method}`, "METHOD_NOT_FOUND", { method, known: Object.keys(METHODS) });
  }
}

/**
 * Serve a 0.3-shaped request through the v1.0 handler. The request message is mapped to v1.0,
 * the SAME dispatch answers it, and a Message result is mapped back to the 0.3 shape (the 0.3
 * `result` of message/send is the Message itself). Errors keep their JSON-RPC codes, which 0.3
 * and 1.0 share.
 */
async function serveV03(id: unknown, method: string, params: unknown, origin: string, caller?: PaidCallerContext, x402Extension: string | null = null): Promise<Response> {
  const p = record(params);
  let v1Params: unknown = params;
  if (method === "message/send" || method === "message/stream") {
    const m = record(p?.message);
    const normalized = m && !str(m.messageId) ? { ...m, messageId: crypto.randomUUID() } : m;
    v1Params = normalized ? { message: v03MessageToV1(normalized) } : {};
  }
  const res = await dispatchV1(id, V03_METHODS[method], v1Params, origin, caller, x402Extension);
  const body = record(await res.json()) ?? {};
  const result = record(body.result);
  const message = record(result?.message);
  const task = record(result?.task);
  // The 0.3 result of message/send is the Message itself, or the Task itself (kind "task").
  const out = message ? { ...body, result: v1MessageTo03(message) } : task ? { ...body, result: v1TaskTo03(task) } : body;
  const activated = res.headers.get("x-a2a-extensions");
  return new Response(JSON.stringify(out, null, 2), {
    status: res.status,
    headers: {
      ...HEADERS,
      "a2a-version": "0.3",
      "x-a2a-compat": "0.3 request served by the 1.0 handler",
      ...(activated ? { "x-a2a-extensions": activated } : {}),
    },
  });
}

/**
 * The usage prefix: the version the REQUEST declared, not the header on the response. Until
 * 2026-10-07 this read the response's a2a-version header, which is "1.0" on every reply the 0.3
 * shim did not serve - so a body that was not JSON-RPC at all, or a call with no A2A-Version
 * header, was counted as "v1.0_error-...". That is the label /api/usage showed for 717 x -32600
 * and 309 x -32009 in the 7 days to 6 Oct 2026.
 */
export function a2aUsageShape(rawVersionHeader: string | null, servedAs03: boolean): "v0.3" | "v1.0" | "unversioned" | "vother" {
  if (servedAs03) return "v0.3";
  const raw = (rawVersionHeader ?? "").trim();
  if (raw === "") return "unversioned";
  if (normalizeA2aVersion(raw) === A2A_PROTOCOL_VERSION) return "v1.0";
  // "v0.3" means SERVED by the 0.3 shim (handled above). A 0.x header on a request the shim did
  // not serve (A2A-Version: 0.2 with SendMessage) is "vother", as usage.ts documents; it used to
  // be labelled "v0.3", which named a version the request did not declare.
  return "vother";
}

/**
 * The paid_call label for a reply, or null. Read off the reply's own TOOL_RESULT part: a metered
 * per-tool skill that reached the dispatch, the field the door says it read a payment from
 * (payment_channel: input.x_payment is "arg", message.metadata["x402.payment.payload"] is "meta"),
 * and what the paid wrapper said about payment. A call refused before the dispatch (both fields at
 * once, an input the schema refuses) has no TOOL_RESULT and writes no row. Presence only.
 */
export function a2aPaidCallName(replyBody: unknown): string | null {
  const result = record(record(replyBody)?.result);
  // An x402 payment Task (1.0 wraps it as result.task; 0.3 is the Task itself, kind "task")
  // carries the TOOL_RESULT in its status message, or in its artifact once delivered.
  const task = record(result?.task) ?? (result?.kind === "task" ? result : null);
  const message = task ? record(record(task.status)?.message) : (record(result?.message) ?? result); // 1.0 wraps the Message; the 0.3 shim does not
  const parts = [
    ...(Array.isArray(message?.parts) ? message.parts : []),
    ...(Array.isArray(task?.artifacts) ? task.artifacts.flatMap((a) => { const ps = record(a)?.parts; return Array.isArray(ps) ? ps : []; }) : []),
  ];
  for (const part of parts) {
    const data = record(record(part)?.data);
    if (data?.kind !== "TOOL_RESULT" || data.metered !== true) continue;
    const tool = str(data.tool);
    if (!tool || !PAID_TOOL_NAMES.has(tool)) continue;
    const structured = record(record(data.result)?.structuredContent) ?? {};
    const status = str(structured.status) ?? "";
    const payment =
      data.payment_channel === A2A_PAYMENT_FIELD
        ? "meta"
        : structured.payment_presented === true || data.payment_channel === "input.x_payment"
          ? "arg"
        : status.startsWith("PURCHASE_") || status === "ORIGINAL_RECOVERED" || status.startsWith("BUYER_DECISION")
          ? "purchase"
          : structured.delivery_kind === "PREVIEW_OR_FREE"
            ? "preview"
            : "none";
    return paidCallName("a2a", tool, payment);
  }
  return null;
}

export const onRequestPost: PagesFunction = async (context) => {
  const res = await handlePost(context.request, (context as { env?: unknown }).env);
  // Aggregate usage (functions/_lib/usage.ts): declared version + ok / error code, and for a body
  // that was not a JSON-RPC request its shape (key names only). No text, no caller id.
  const ctx = context as unknown as { request: Request; env?: unknown; waitUntil?: (p: Promise<unknown>) => void };
  if (ctx.env && ctx.waitUntil) {
    const shape = a2aUsageShape(context.request.headers.get("a2a-version"), res.headers.get("a2a-version") === "0.3");
    ctx.waitUntil(
      res.clone().json()
        .then((j) => {
          const err = record(record(j)?.error) ?? {};
          const code = err.code;
          recordUsage(ctx, "a2a_outcome", `${shape}_${typeof code === "number" ? `error${code}` : "ok"}`);
          const paid = a2aPaidCallName(j);
          if (paid) recordUsage(ctx, "paid_call", paid);
          if (code === A2A_ERROR.INVALID_REQUEST || code === A2A_ERROR.PARSE) {
            const meta = record(record(Array.isArray(err.data) ? err.data[0] : null)?.metadata);
            const received = str(meta?.received);
            if (received) recordUsage(ctx, "reject_shape", `a2a.${code}.${received}`);
          }
        })
        .catch(() => undefined),
    );
  }
  return res;
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
