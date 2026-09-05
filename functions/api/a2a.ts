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
 *   SendMessage             -> a Message (never a Task). The text part carries the live board
 *                              lid VERBATIM from GET /api/gspc totals.lid; the data part carries
 *                              the derived axis rows. Fetch failure -> UNCHECKABLE, no number.
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
  TASK_NOT_FOUND: -32001,
  PUSH_NOTIFICATION_NOT_SUPPORTED: -32003,
  UNSUPPORTED_OPERATION: -32004,
  VERSION_NOT_SUPPORTED: -32009,
} as const;

// Every v1.0 method name and what this door does with it. Exposed on GET so a stranger
// can read the contract before sending anything.
export const METHODS: Record<string, string> = {
  SendMessage: "answered with a Message carrying the live board lid and derived axis rows",
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
  let res: Response;
  try {
    res = await fetch(source, { headers: { accept: "application/json" } });
  } catch (e) {
    return { ...base, reason: `fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!res.ok) return { ...base, reason: `HTTP ${res.status} from ${BOARD_PATH}` };
  let board: Json | null = null;
  try {
    board = record(await res.json());
  } catch {
    return { ...base, reason: `${BOARD_PATH} did not return a JSON object` };
  }
  const totals = record(board?.totals);
  const lid = str(totals?.lid);
  const axesRaw = Array.isArray(board?.axes) ? (board!.axes as unknown[]) : [];
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
  const board = await deriveBoard(origin);
  const contextId = str(message.contextId) ?? crypto.randomUUID();
  return reply(id, {
    result: {
      message: {
        messageId: crypto.randomUUID(),
        contextId,
        role: "ROLE_AGENT",
        parts: [
          { text: boardText(board), mediaType: "text/plain" },
          { data: board, mediaType: "application/json" },
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
      params: { message: { messageId: "m-1", role: "ROLE_USER", parts: [{ text: "board" }] } },
    },
  };
  return new Response(JSON.stringify(body, null, 2), { status: 200, headers: HEADERS });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;
  const origin = new URL(request.url).origin;

  let parsed: unknown;
  try {
    parsed = JSON.parse(await request.text());
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
