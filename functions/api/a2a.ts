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
 *                              {skill,input} selects one of the seven skills on the public card.
 *                              Each skill calls a fixed same-origin, free handler. The legacy
 *                              one-part text "board" request remains a narrow compatibility alias.
 *   GetTask / CancelTask    -> TaskNotFoundError (-32001): this agent keeps no task store.
 *   ListTasks               -> UnsupportedOperationError (-32004): nothing to list.
 *   SendStreamingMessage / SubscribeToTask -> UnsupportedOperationError (-32004), which §3.3.4
 *                              requires while capabilities.streaming is false.
 *   *PushNotificationConfig -> PushNotificationNotSupportedError (-32003).
 *   GetExtendedAgentCard    -> UnsupportedOperationError (-32004): extendedAgentCard is false.
 *   anything else           -> -32601.
 *   A2A-Version other than 1.0 -> VersionNotSupportedError (-32009). The 0.3 method names
 *   (`message/send`) get the same error with the fix named, not a bare -32601.
 *
 * WHAT IT IS NOT
 *   Not a task runner, not streaming, not signed-receipts/v1: no receipt is attached until a
 *   server-side key exists to sign one, and the card does not declare that extension until it
 *   is actually emitted. Measurement, not certification: every reply carries the register text
 *   and nothing ranked. Numbers are derived at request time, never typed here.
 */

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
  "access-control-allow-headers": "content-type, a2a-version, a2a-extensions",
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
  SendMessage: "answered with a Message from one explicit {skill,input} selector; seven card skills route to fixed free handlers",
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

const record = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export const SKILL_IDS = [
  "gspc-board",
  "east-west-crosswalk",
  "measured-badge",
  "benchmark-quality-register",
  "article50-detect",
  "eu-ai-act-screen",
  "x402-discovery",
] as const;
type SkillId = (typeof SKILL_IDS)[number];
const SKILL_ID_SET = new Set<string>(SKILL_IDS);

type SkillSelection = { skill: SkillId; input: Json };

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

function parseSkillSelection(message: Json): SkillSelection | string {
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
    if (str(part.text)?.trim().toLowerCase() === "board") return { skill: "gspc-board", input: {} };
    return "structured Part.data {skill,input} is required (legacy text compatibility is only the exact word `board`)";
  }
  if (semanticKeys[0] !== "data") {
    return `Part.${semanticKeys[0]} is not supported; use structured Part.data {skill,input}`;
  }
  const selector = record(part.data);
  if (!selector) return "Part.data must be an object containing {skill,input}";
  if (!exactKeys(selector, ["skill", "input"])) return "selector must contain exactly {skill,input}";
  const skill = str(selector.skill);
  if (!skill || !SKILL_ID_SET.has(skill)) return `unknown skill; choose one of: ${SKILL_IDS.join(", ")}`;
  const input = record(selector.input);
  if (!input) return "selector.input must be an object";
  return { skill: skill as SkillId, input };
}

function validateSkillInput(selection: SkillSelection): string | null {
  const { skill, input } = selection;
  if (["gspc-board", "east-west-crosswalk", "benchmark-quality-register", "x402-discovery"].includes(skill)) {
    return Object.keys(input).length === 0 ? null : `${skill} input must be an empty object`;
  }
  if (skill === "measured-badge") {
    if (!exactKeys(input, ["card", "subject"])) return "measured-badge input requires exactly card and subject";
    if (!/^[0-9a-f]{64}$/i.test(str(input.card) ?? "")) return "measured-badge card must be a 64-hex signed-card hash";
    if (!/^[^\s/@]+\/[^\s@]+@[0-9a-f]{40}(?:[0-9a-f]{24})?$/i.test(str(input.subject) ?? "")) {
      return "measured-badge subject must be owner/model@40-or-64-hex-immutable-revision";
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
    case "measured-badge": {
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

async function sendMessage(id: unknown, params: unknown, origin: string): Promise<Response> {
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
  const selection = parseSkillSelection(message);
  if (typeof selection === "string") {
    return rpcError(id, A2A_ERROR.INVALID_PARAMS, selection, "INVALID_SKILL_SELECTOR", {
      field: "params.message.parts",
    });
  }
  const invalidInput = validateSkillInput(selection);
  if (invalidInput) {
    return rpcError(id, A2A_ERROR.INVALID_PARAMS, invalidInput, "INVALID_SKILL_INPUT", {
      skill: selection.skill,
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
    version_rule:
      "Send `A2A-Version: 1.0`. An absent header is served as 1.0 for v1.0 method names; any other version, and the 0.3 method names such as message/send, get VersionNotSupportedError -32009.",
    tasks: "none kept — every SendMessage answers with a Message, so GetTask can only ever say TaskNotFound",
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

export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;
  const origin = new URL(request.url).origin;

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
  try {
    parsed = JSON.parse(text);
  } catch {
    return rpcError(null, A2A_ERROR.PARSE, "request body is not JSON", "PARSE_ERROR");
  }
  if (Array.isArray(parsed)) {
    return rpcError(null, A2A_ERROR.INVALID_REQUEST, "batch requests are not served here; send one request per POST", "INVALID_REQUEST");
  }
  const req = record(parsed);
  const id = req?.id;
  const method = str(req?.method);
  if (!req || req.jsonrpc !== "2.0" || !method) {
    return rpcError(id, A2A_ERROR.INVALID_REQUEST, 'a JSON-RPC 2.0 request needs jsonrpc:"2.0" and a method', "INVALID_REQUEST");
  }

  const requested = (request.headers.get("a2a-version") ?? "").trim();
  if (requested && !/^1\.0(\.\d+)?$/.test(requested)) {
    return rpcError(
      id,
      A2A_ERROR.VERSION_NOT_SUPPORTED,
      `A2A-Version ${requested} is not served; this interface speaks ${A2A_PROTOCOL_VERSION}`,
      "VERSION_NOT_SUPPORTED",
      { requested, supported: [A2A_PROTOCOL_VERSION] },
    );
  }
  if (method.includes("/")) {
    return rpcError(
      id,
      A2A_ERROR.VERSION_NOT_SUPPORTED,
      `${method} is a 0.3 method name; send A2A-Version: ${A2A_PROTOCOL_VERSION} and the v1.0 name (for example SendMessage)`,
      "VERSION_NOT_SUPPORTED",
      { method, supported: [A2A_PROTOCOL_VERSION] },
    );
  }

  switch (method) {
    case "SendMessage":
      return sendMessage(id, req.params, origin);
    case "GetTask":
    case "CancelTask": {
      const taskId = str(record(req.params)?.id) ?? null;
      return rpcError(id, A2A_ERROR.TASK_NOT_FOUND, "task not found: this agent keeps no task store; every SendMessage answers with a Message", "TASK_NOT_FOUND", { taskId });
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
};
