import type { CompanyCaseClient, CompanyCase, CompanyCaseSource, ProposedCompanyRecord } from "../components/talk/companyCaseModel";
import { jsonMemberBytes, parseBoundedJson, sameJSONValue, verifiedBytes, verifiedJsonBytes } from "./companyCaseBytes";

const PREFIX = "/api/meok-library/cases";
const MAX_REPLY = 524288;
const OPERATION_MS = 35000;
const CASE_ID = /^case_[a-f0-9]{64}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{8,80}$/;
const SHA256 = /^[a-f0-9]{64}$/i;
const MCP_SOURCE = "https://councilof.ai/mcp/free";
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => Boolean(value && typeof value === "object" && !Array.isArray(value));
const boundedText = (value: unknown, length: number): value is string => typeof value === "string" && value.length > 0 && value.length <= length;
const identity = (value: unknown): value is string => boundedText(value, 200) && value.trim() === value && !/[\u0000-\u001f\u007f-\u009f]/.test(value);
const timestamp = (value: unknown): value is string => boundedText(value, 80) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,9})?Z$/.test(value) && Number.isFinite(Date.parse(value));
const digest = (value: unknown): value is string => typeof value === "string" && SHA256.test(value);

export type CompanyCaseClientOptions = {
  subject: string;
  getToken: () => string | null;
};

export class CompanyCaseClientError extends Error {
  code: string;
  caseId?: string;
  outcomeUnknown: boolean;
  constructor(code: string, caseId?: string, outcomeUnknown = false) {
    super("The company case operation could not be verified.");
    this.name = "CompanyCaseClientError";
    this.code = code;
    this.caseId = caseId;
    this.outcomeUnknown = outcomeUnknown;
  }
}

function wellFormed(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) return false;
  }
  return true;
}

async function sha256(raw: Uint8Array): Promise<string> {
  const value = await crypto.subtle.digest("SHA-256", new Uint8Array(raw).buffer);
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeToken(getToken: () => string | null): string {
  const token = getToken();
  if (typeof token !== "string" || !token || token.length > 8185 || !/^[\x21-\x7e]+$/.test(token)) throw new CompanyCaseClientError("unauthorized");
  return token;
}

function ensureSession(getToken: () => string | null, token: string, signal?: AbortSignal): void {
  if (signal?.aborted) throw new CompanyCaseClientError("aborted");
  if (getToken() !== token) throw new CompanyCaseClientError("session_changed");
}

async function boundedOperation<T>(external: AbortSignal, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
  if (external.aborted) throw new CompanyCaseClientError("aborted");
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let rejectAbort: ((error: unknown) => void) | undefined;
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const abort = () => { controller.abort(); rejectAbort?.(new CompanyCaseClientError("aborted")); };
  external.addEventListener("abort", abort, { once: true });
  timer = setTimeout(() => { controller.abort(); rejectAbort?.(new CompanyCaseClientError("deadline")); }, OPERATION_MS);
  try { return await Promise.race([work(controller.signal), aborted]); }
  finally {
    clearTimeout(timer);
    external.removeEventListener("abort", abort);
  }
}

async function responseBytes(response: Response, signal: AbortSignal): Promise<Uint8Array> {
  const kind = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (kind !== "application/json") throw new CompanyCaseClientError("invalid_response");
  const length = response.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_REPLY)) throw new CompanyCaseClientError("invalid_response");
  const reader = response.body?.getReader();
  if (!reader) throw new CompanyCaseClientError("invalid_response");
  const buffer = new Uint8Array(MAX_REPLY);
  let size = 0;
  const cancel = () => { try { void reader.cancel().catch(() => undefined); } catch { /* advisory only */ } };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    while (true) {
      if (signal.aborted) throw new CompanyCaseClientError("aborted");
      const { done, value } = await reader.read();
      if (done) break;
      if (value.byteLength > MAX_REPLY - size) throw new CompanyCaseClientError("invalid_response");
      buffer.set(value, size);
      size += value.byteLength;
    }
    return buffer.slice(0, size);
  } catch (error) {
    try { void reader.cancel().catch(() => undefined); } catch { /* advisory only */ }
    throw error;
  } finally { signal.removeEventListener("abort", cancel); try { reader.releaseLock(); } catch { /* a stalled read is not accepted */ } }
}

function verifiedRecordEnvelope(record: ObjectValue) {
  const base64 = record.record_json_b64, bytes = record.record_bytes, sha256 = record.record_sha256;
  if (typeof base64 !== "string" || typeof bytes !== "number" || !Number.isSafeInteger(bytes) || bytes <= 0 || bytes > 210000 || !digest(sha256)) throw new CompanyCaseClientError("invalid_response");
  return verifiedJsonBytes({ base64, bytes, sha256 });
}

function shortJSON(value: unknown): string {
  const text = JSON.stringify(value, null, 2);
  return text.length <= 30000 ? text : `${text.slice(0, 30000)}\n[Display shortened; the full saved result is bound to its receipt.]`;
}

function rpcMessage(raw: Uint8Array, contentType: string, expectedId: string): ObjectValue {
  const kind = contentType.split(";", 1)[0].trim().toLowerCase();
  const messages: unknown[] = [];
  if (kind === "application/json") messages.push(parseBoundedJson(raw, 65536));
  else if (kind === "text/event-stream") {
    const source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw);
    if (/\r(?!\n)/.test(source)) throw new CompanyCaseClientError("invalid_response");
    let data: string[] = [], eventType: string | undefined;
    const fields = new Set<string>();
    let frames = 0;
    for (const line of [...source.replace(/\r\n/g, "\n").split("\n"), ""]) {
      if (line === "") {
        if (eventType !== undefined && eventType !== "message") throw new CompanyCaseClientError("invalid_response");
        if (data.length) {
          if (++frames > 32) throw new CompanyCaseClientError("invalid_response");
          messages.push(parseBoundedJson(new TextEncoder().encode(data.join("\n")), 65536));
        }
        data = []; eventType = undefined; fields.clear();
        continue;
      }
      if (line.startsWith(":")) continue;
      const separator = line.indexOf(":");
      const name = separator < 0 ? line : line.slice(0, separator);
      const rawValue = separator < 0 ? "" : line.slice(separator + 1);
      const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
      if (name === "data") data.push(value);
      else {
        if (fields.has(name)) throw new CompanyCaseClientError("invalid_response");
        fields.add(name);
        if (name === "event") eventType = value;
        else if (name === "id") { if (value.length > 200 || /[\u0000-\u001f\u007f-\u009f]/.test(value)) throw new CompanyCaseClientError("invalid_response"); }
        else if (name === "retry") { if (!/^\d{1,7}$/.test(value)) throw new CompanyCaseClientError("invalid_response"); }
        else throw new CompanyCaseClientError("invalid_response");
      }
    }
  } else throw new CompanyCaseClientError("invalid_response");
  let match: ObjectValue | undefined;
  for (const message of messages) {
    if (!object(message) || message.jsonrpc !== "2.0" || "error" in message ||
      (object(message.result) && message.result.isError === true)) throw new CompanyCaseClientError("invalid_response");
    if (message.id === expectedId) {
      if (match || !object(message.result) || "method" in message) throw new CompanyCaseClientError("invalid_response");
      match = message;
    } else if ("id" in message || "result" in message || typeof message.method !== "string" || !message.method.startsWith("notifications/")) {
      throw new CompanyCaseClientError("invalid_response");
    }
  }
  if (!match) throw new CompanyCaseClientError("invalid_response");
  return match;
}

async function verifyObservation(observation: ObjectValue, method: "tools/list" | "tools/call", expectedId: string): Promise<ObjectValue> {
  if (observation.source !== MCP_SOURCE || observation.method !== method || observation.http_method !== "POST" ||
    !boundedText(observation.content_type, 200) || !timestamp(observation.fetched_at) || observation.signed !== false ||
    observation.untrusted_tool_output !== true || typeof observation.raw_base64 !== "string" ||
    typeof observation.raw_bytes !== "number" || !Number.isSafeInteger(observation.raw_bytes) || observation.raw_bytes <= 0 ||
    observation.raw_bytes > 65536 || !digest(observation.raw_sha256) || !object(observation.response)) throw new CompanyCaseClientError("invalid_response");
  const raw = await verifiedBytes({ base64: observation.raw_base64, bytes: observation.raw_bytes, sha256: observation.raw_sha256 }, 65536);
  const parsed = rpcMessage(raw, observation.content_type, expectedId);
  if (!sameJSONValue(parsed, observation.response)) throw new CompanyCaseClientError("invalid_response");
  return parsed;
}

function verifyLibrary(library: ObjectValue, baseId: string): void {
  if (library.schema !== "meok.native-library-search/1" || library.base_id !== baseId || library.query !== "GSPC" ||
    !Array.isArray(library.entries) || library.entries.length > 20) throw new CompanyCaseClientError("invalid_response");
  const eligible = library.entries.filter((entry: unknown) => {
    if (!object(entry) || entry.title !== "GSPC" || entry.source_key !== "library:component:LIB-GSPC" ||
      !object(entry.body) || !object(entry.source_reference)) return false;
    const body = entry.body, provenance = entry.source_reference;
    return body.schema === "councilos.company-library-entity/1" && body.source_key === entry.source_key &&
      body.kind === "component" && body.entity_id === "LIB-GSPC" && body.source_state === "LOCAL_SOURCE_REFERENCE" &&
      body.task_authority === false && body.measurement_authority === false && body.publication_clearance === "NOT_GRANTED_BY_IMPORT" &&
      typeof body.version_sha256 === "string" && /^[a-f0-9]{64}$/.test(body.version_sha256) &&
      provenance.schema === "councilos.company-library-provenance/1" && provenance.signature_state === "UNSIGNED" &&
      provenance.runtime_qualified === false && provenance.rights_clearance_conferred === false &&
      provenance.source_version_sha256 === body.version_sha256 && identity(entry.native_record_id) && identity(entry.head_commit_id);
  });
  if (eligible.length !== 1) throw new CompanyCaseClientError("invalid_response");
}

async function verifyGspc(gspc: ObjectValue): Promise<void> {
  if (gspc.tool !== "board_totals" || !object(gspc.arguments) || Object.keys(gspc.arguments).length !== 1 || gspc.arguments.detail !== "summary" || !object(gspc.abi)) throw new CompanyCaseClientError("invalid_response");
  const board = await verifyObservation(gspc, "tools/call", "meok-library-board");
  if (!object(board.result) || !Array.isArray(board.result.content) || board.result.content.length < 1 || board.result.content.length > 32 ||
    board.result.content.some((block: unknown) => !object(block) || block.type !== "text" || typeof block.text !== "string" || !block.text.trim()) ||
    (board.result.structuredContent !== undefined && !object(board.result.structuredContent))) throw new CompanyCaseClientError("invalid_response");
  const abi = gspc.abi;
  const listed = await verifyObservation(abi, "tools/list", "meok-library-abi");
  if (!object(listed.result) || !Array.isArray(listed.result.tools) || listed.result.tools.length > 64) throw new CompanyCaseClientError("invalid_response");
  const matches = listed.result.tools.filter((tool: unknown) => object(tool) && tool.name === "board_totals");
  if (matches.length !== 1 || !object(matches[0])) throw new CompanyCaseClientError("invalid_response");
  const tool = matches[0];
  if (!object(tool.inputSchema) || tool.inputSchema.type !== "object" || !object(tool.inputSchema.properties) ||
    !object(tool.inputSchema.properties.detail) || tool.inputSchema.properties.detail.type !== "string" ||
    !Array.isArray(tool.inputSchema.properties.detail.enum) || !tool.inputSchema.properties.detail.enum.includes("summary") ||
    (tool.inputSchema.required !== undefined && (!Array.isArray(tool.inputSchema.required) || tool.inputSchema.required.some((key: unknown) => key !== "detail"))) ||
    typeof abi.tool_schema_json_b64 !== "string" || typeof abi.tool_schema_bytes !== "number" || abi.tool_schema_bytes > 65536 || !digest(abi.tool_schema_sha256)) throw new CompanyCaseClientError("invalid_response");
  const descriptor = await verifiedJsonBytes({ base64: abi.tool_schema_json_b64, bytes: abi.tool_schema_bytes, sha256: abi.tool_schema_sha256 });
  if (!sameJSONValue(descriptor.value, tool)) throw new CompanyCaseClientError("invalid_response");
}

async function verifiedView(
  body: unknown,
  expected: { subject: string; caseId: string; requestId?: string; request?: string },
  status: 200 | 202,
): Promise<CompanyCase> {
  const pendingReview = status === 202;
  if (!object(body) || body.schema !== "meok.library-case/1" || body.saved !== !pendingReview || body.owner_sub !== expected.subject ||
    !object(body.case) || !object(body.persistence)) throw new CompanyCaseClientError("invalid_response");
  const record = body.case;
  const persistence = body.persistence;
  if (record.schema !== "meok.library-case/1" || record.id !== expected.caseId || record.owner_sub !== expected.subject ||
    !boundedText(record.request_id, 80) || !REQUEST_ID.test(record.request_id) || !boundedText(record.request, 2000) || !record.request.trim() ||
    !wellFormed(record.request) || !record.request.toLowerCase().match(/[a-z0-9]+/g)?.includes("gspc") || !digest(record.request_sha256) || !timestamp(record.created_at) ||
    (expected.requestId !== undefined && record.request_id !== expected.requestId) ||
    (expected.request !== undefined && record.request !== expected.request) ||
    !object(record.result) || !object(record.receipt)) throw new CompanyCaseClientError("invalid_response");
  if (persistence.store !== "Busabase" || persistence.owner_sub !== expected.subject ||
    persistence.case_id !== expected.caseId || !identity(persistence.base_id) ||
    !identity(persistence.change_request_id) || persistence.request_sha256 !== record.request_sha256) {
    throw new CompanyCaseClientError("invalid_response");
  }
  let resultId: string;
  let receiptId: string;
  let nativeCaseHead: string | undefined;
  let proposedRecords: Record<"case" | "result" | "receipt", ProposedCompanyRecord> | undefined;
  if (pendingReview) {
    if (persistence.state !== "AWAITING_REVIEW" || persistence.readback_verified !== false ||
      persistence.proposal_readback_verified !== true || persistence.retry_post !== false ||
      !["in_review", "changes_requested", "approved"].includes(persistence.review_status as string) ||
      "native_records" in persistence || "native_commit_id" in persistence ||
      !object(persistence.proposed_records) ||
      Object.keys(persistence.proposed_records).sort().join(",") !== "case,receipt,result") {
      throw new CompanyCaseClientError("invalid_response");
    }
    const proposed = persistence.proposed_records;
    const references = {} as Record<"case" | "result" | "receipt", ProposedCompanyRecord>;
    for (const key of ["case", "result", "receipt"] as const) {
      const item = proposed[key];
      if (!object(item) || Object.keys(item).sort().join(",") !== "head_commit_id,operation_id,payload_sha256" ||
        !identity(item.operation_id) || !identity(item.head_commit_id) || !digest(item.payload_sha256)) {
        throw new CompanyCaseClientError("invalid_response");
      }
      // payload_sha256 covers server-owned native field maps, not public case bytes.
      // The browser validates reference bindings; the authenticated adapter reads those maps.
      references[key] = { operationId: item.operation_id, headCommitId: item.head_commit_id, payloadSha256: item.payload_sha256 };
    }
    if (new Set(Object.values(references).map((item) => item.operationId)).size !== 3 ||
      new Set(Object.values(references).map((item) => item.headCommitId)).size !== 3) {
      throw new CompanyCaseClientError("invalid_response");
    }
    proposedRecords = references;
    resultId = references.result.headCommitId;
    receiptId = references.receipt.headCommitId;
  } else {
    if (persistence.state !== "COMMITTED" || persistence.readback_verified !== true ||
      "proposed_records" in persistence || "proposal_readback_verified" in persistence ||
      !object(persistence.native_records) ||
      Object.keys(persistence.native_records).sort().join(",") !== "case,receipt,result") {
      throw new CompanyCaseClientError("invalid_response");
    }
    const native = persistence.native_records;
    for (const key of ["case", "result", "receipt"]) {
      const item = native[key];
      if (!object(item) || !identity(item.id) || !identity(item.head_commit_id)) throw new CompanyCaseClientError("invalid_response");
    }
    const nativeRecords = native as Record<"case" | "result" | "receipt", { id: string; head_commit_id: string }>;
    if (new Set([nativeRecords.case.id, nativeRecords.result.id, nativeRecords.receipt.id]).size !== 3) throw new CompanyCaseClientError("invalid_response");
    resultId = nativeRecords.result.id;
    receiptId = nativeRecords.receipt.id;
    nativeCaseHead = nativeRecords.case.head_commit_id;
  }
  const requestDigest = await sha256(new TextEncoder().encode(record.request));
  const expectedStable = "case_" + await sha256(new TextEncoder().encode(`meok.library-case/1\0${expected.subject}\0${record.request_id}`));
  if (requestDigest !== record.request_sha256.toLowerCase() || expectedStable !== expected.caseId) throw new CompanyCaseClientError("invalid_response");
  const wholeCase = await verifiedRecordEnvelope(persistence);
  if (!sameJSONValue(wholeCase.value, record)) throw new CompanyCaseClientError("invalid_response");
  const receipt = record.receipt;
  if (receipt.schema !== "meok.unsigned-integrity-receipt/1" || receipt.signed !== false || receipt.unsigned !== true || !timestamp(receipt.observed_at)) throw new CompanyCaseClientError("invalid_response");
  const core = { ...record };
  delete core.receipt;
  const boundCore = await verifiedRecordEnvelope(receipt);
  if (!sameJSONValue(boundCore.value, core)) throw new CompanyCaseClientError("invalid_response");
  // Exact original JSON token spans preserve Python float spellings and non-ASCII bytes.
  const resultRaw = jsonMemberBytes(wholeCase.raw, ["result"]);
  const receiptRaw = jsonMemberBytes(wholeCase.raw, ["receipt"]);
  const resultSha256 = await sha256(resultRaw);
  const receiptSha256 = await sha256(receiptRaw);
  const coreResultSha256 = await sha256(jsonMemberBytes(boundCore.raw, ["result"]));
  if (!sameJSONValue(parseBoundedJson(resultRaw), record.result) || !sameJSONValue(parseBoundedJson(receiptRaw), receipt) ||
    !object(boundCore.value) || !sameJSONValue(boundCore.value.result, record.result) || coreResultSha256 !== resultSha256) throw new CompanyCaseClientError("invalid_response");
  const result = record.result;
  if (!object(result.library) || !object(result.gspc)) throw new CompanyCaseClientError("invalid_response");
  verifyLibrary(result.library, persistence.base_id as string);
  const gspc = result.gspc;
  await verifyGspc(gspc);
  // verifyGspc checked these fields at runtime; retain exact tool-reported content as plain data.
  const response = gspc.response as ObjectValue;
  const abi = gspc.abi as ObjectValue;
  const sources: CompanyCaseSource[] = [
    { title: "Library lookup recorded with case", reference: `Busabase company-library Base ${persistence.base_id}`, recordedAt: record.created_at },
    { title: "Published GSPC board tool response", reference: `${MCP_SOURCE} · board_totals(detail=summary)`, fetchedAt: gspc.fetched_at as string, sha256: gspc.raw_sha256 as string },
    { title: "Published GSPC tool definition", reference: `${MCP_SOURCE} · tools/list`, fetchedAt: abi.fetched_at as string, sha256: abi.raw_sha256 as string },
  ];
  const view = {
    caseId: expected.caseId, requestId: record.request_id, ownerSubject: expected.subject, request: record.request,
    result: {
      id: resultId,
      text: `Company library lookup:\n${shortJSON(result.library)}\n\nPublished GSPC board tool response:\n${shortJSON(response.result)}`,
      fetchedAt: gspc.fetched_at as string,
      sha256: resultSha256, sources,
    },
    receipt: { id: receiptId, caseId: expected.caseId, resultId,
      resultSha256,
      sha256: receiptSha256, createdAt: receipt.observed_at, integrity: "unsigned" as const },
  };
  if (pendingReview && proposedRecords) {
    return {
      ...view,
      persistence: {
        merged: false, nativeReadbackVerified: false, proposalReadbackVerified: true,
        changeRequestId: persistence.change_request_id,
        reviewStatus: persistence.review_status as "in_review" | "changes_requested" | "approved",
        proposedRecords,
      },
      verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true, proposalReferencesVerified: true },
    };
  }
  return {
    ...view,
    persistence: { merged: true, nativeReadbackVerified: true, nativeCommitId: nativeCaseHead! },
    verification: { resultDigestVerified: true, receiptDigestVerified: true, receiptBindingVerified: true },
  };
}

/** Side-effect-free construction. Bearer values are sent only to fixed same-origin case routes. */
export function createCompanyCaseClient(options: CompanyCaseClientOptions): CompanyCaseClient {
  const { subject, getToken } = options;
  const subjectValid = typeof subject === "string" && subject.length > 0 && subject.length <= 254 && subject.trim() === subject &&
    !/[\u0000-\u0020\u007f-\u009f]/.test(subject) && wellFormed(subject) && !["demo@csoai.com", "demo", "default"].includes(subject.toLowerCase());
  function ready(): void {
    if (!subjectValid || typeof getToken !== "function") throw new CompanyCaseClientError("unauthorized");
  }
  async function caseIdForRequest(requestId: string): Promise<string> {
    ready();
    if (typeof requestId !== "string" || !REQUEST_ID.test(requestId)) throw new CompanyCaseClientError("invalid_request");
    const token = safeToken(getToken);
    return boundedOperation(new AbortController().signal, async (signal) => {
      const id = "case_" + await sha256(new TextEncoder().encode(`meok.library-case/1\0${subject}\0${requestId}`));
      ensureSession(getToken, token, signal);
      return id;
    });
  }
  async function operation(method: "GET" | "POST", caseId: string, signal: AbortSignal, body?: { request: string; request_id: string }): Promise<CompanyCase> {
    ready();
    const token = safeToken(getToken);
    let postAttempted = false;
    try {
      return await boundedOperation(signal, async (boundedSignal) => {
        ensureSession(getToken, token, boundedSignal);
        const path = method === "POST" ? PREFIX : `${PREFIX}/${encodeURIComponent(caseId)}`;
        postAttempted = method === "POST";
        const response = await fetch(path, { method, redirect: "error", credentials: "omit", cache: "no-store", signal: boundedSignal,
          headers: { authorization: `Bearer ${token}`, accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {}) });
        if (response.redirected || response.status < 200 || response.status >= 600) throw new CompanyCaseClientError("invalid_response");
        const parsed = parseBoundedJson(await responseBytes(response, boundedSignal), MAX_REPLY);
        ensureSession(getToken, token, boundedSignal);
        if (!response.ok) {
          if (![400, 401, 403, 404, 409, 413, 415, 429, 503].includes(response.status) || !object(parsed) || parsed.saved !== false ||
            typeof parsed.error !== "string" || !/^[a-z][a-z0-9_]{0,79}$/.test(parsed.error) ||
            (parsed.case_id !== undefined && parsed.case_id !== caseId) ||
            (parsed.outcome_unknown !== undefined && typeof parsed.outcome_unknown !== "boolean") ||
            (parsed.outcome_unknown === true && parsed.retry_post !== false)) throw new CompanyCaseClientError("invalid_response");
          const code = response.status === 401 ? "unauthorized" : response.status === 403 ? "forbidden" : response.status === 404 ? "not_found" : "unavailable";
          throw new CompanyCaseClientError(code, caseId, parsed.outcome_unknown === true || (postAttempted && code !== "unauthorized" && code !== "forbidden"));
        }
        if (response.status !== 200 && response.status !== 202) throw new CompanyCaseClientError("invalid_response");
        const value = await verifiedView(parsed, { subject, caseId, requestId: body?.request_id, request: body?.request }, response.status);
        ensureSession(getToken, token, boundedSignal);
        return value;
      });
    } catch (error) {
      if (error instanceof CompanyCaseClientError) throw new CompanyCaseClientError(error.code, caseId, error.outcomeUnknown || (postAttempted && !["unauthorized", "forbidden"].includes(error.code)));
      throw new CompanyCaseClientError("unavailable", caseId, postAttempted);
    }
  }
  return {
    caseIdForRequest,
    async submit(request, { requestId, signal }) {
      ready();
      if (!boundedText(request, 2000) || !request.trim() || !wellFormed(request) || !request.toLowerCase().match(/[a-z0-9]+/g)?.includes("gspc") || typeof requestId !== "string" || !REQUEST_ID.test(requestId) ||
        new TextEncoder().encode(JSON.stringify({ request, request_id: requestId })).byteLength > 8192) throw new CompanyCaseClientError("invalid_request");
      let caseId: string | undefined;
      let postStarted = false;
      try {
        return await boundedOperation(signal, async (boundedSignal) => {
          caseId = await caseIdForRequest(requestId);
          if (boundedSignal.aborted) throw new CompanyCaseClientError("aborted", caseId);
          postStarted = true;
          return operation("POST", caseId, boundedSignal, { request, request_id: requestId });
        });
      } catch (error) {
        const code = error instanceof CompanyCaseClientError ? error.code : "unavailable";
        throw new CompanyCaseClientError(code, caseId, (error instanceof CompanyCaseClientError && error.outcomeUnknown) || (postStarted && !["unauthorized", "forbidden"].includes(code)));
      }
    },
    async read(caseId, { signal }) {
      if (typeof caseId !== "string" || !CASE_ID.test(caseId)) throw new CompanyCaseClientError("invalid_request");
      return operation("GET", caseId, signal);
    },
  };
}
