/** Limits structure independently of bytes: a large signed string is still one token. */
export const MCP_MAX_JSON_TOKENS = 25_000;
export const MCP_MAX_JSON_DEPTH = 64;
export const MCP_MAX_TOOL_INPUT_ELEMENTS = 10_000;
export const MCP_MAX_REQUEST_BYTES = 28 * 1024 * 1024;

/**
 * Constant-space preflight BEFORE JSON.parse or SDK schema validation. Count value/key tokens
 * and container depth, ignoring punctuation inside escaped strings. This is not a JSON parser:
 * syntax and protocol errors remain the responsibility of JSON.parse and the SDK.
 */
export function withinJsonBudget(
  body: string,
  maxElements = Infinity,
): boolean {
  let tokens = 0;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let literal = false;
  let elements = 0;
  // Bounded by MCP_MAX_JSON_DEPTH. Track array value starts; colons count object keys.
  const arrayAtDepth: boolean[] = [false];
  const nextArrayValue: boolean[] = [false];
  for (let i = 0; i < body.length; i++) {
    const ch = body.charCodeAt(i);
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === 92) escaped = true;
      else if (ch === 34) quoted = false;
      continue;
    }
    const open = ch === 123 || ch === 91;
    const close = ch === 125 || ch === 93;
    const separator =
      ch === 44 || ch === 58 || ch === 32 || ch === 9 || ch === 10 || ch === 13;
    const startsValue = ch === 34 || open || (!close && !separator && !literal);
    if (startsValue && arrayAtDepth[depth] && nextArrayValue[depth]) {
      nextArrayValue[depth] = false;
      if (++elements > maxElements) return false;
    }
    if (ch === 58 && ++elements > maxElements) return false;
    if (ch === 44 && arrayAtDepth[depth]) nextArrayValue[depth] = true;
    if (ch === 34) {
      quoted = true;
      literal = false;
      tokens++;
    } else if (open) {
      literal = false;
      tokens++;
      if (++depth > MCP_MAX_JSON_DEPTH) return false;
      arrayAtDepth[depth] = ch === 91;
      nextArrayValue[depth] = true;
    } else if (close) {
      // Already-invalid syntax; let JSON.parse reject it without allocating structure.
      if (depth === 0) return true;
      depth--;
      literal = false;
    } else if (separator) literal = false;
    else if (!literal) {
      literal = true;
      tokens++;
    }
    if (tokens > MCP_MAX_JSON_TOKENS) return false;
  }
  return true;
}

/** Check a parsed/coerced card too; JSON strings can hide structure from the outer request. */
export function withinValueBudget(value: unknown): boolean {
  let elements = 0;
  const stack = [{ value, depth: 1 }];
  while (stack.length) {
    const item = stack.pop()!;
    if (item.value === null || typeof item.value !== "object") continue;
    if (item.depth > MCP_MAX_JSON_DEPTH) return false;
    for (const key in item.value) {
      if (!Object.prototype.hasOwnProperty.call(item.value, key)) continue;
      if (++elements > MCP_MAX_TOOL_INPUT_ELEMENTS) return false;
      const child = (item.value as Record<string, unknown>)[key];
      if (child !== null && typeof child === "object")
        stack.push({ value: child, depth: item.depth + 1 });
    }
  }
  return true;
}

/** Bounded UTF-8 read for caller requests and fetched card bodies. */
export async function readBoundedJsonText(
  request: Request | Response,
): Promise<string> {
  const length = request.headers.get("content-length");
  if (
    length !== null &&
    (!/^\d+$/.test(length) || Number(length) > MCP_MAX_REQUEST_BYTES)
  ) {
    if (request.body) void request.body.cancel().catch(() => {});
    throw new RangeError("body limit");
  }
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const parts: string[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("body timeout")), 10_000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MCP_MAX_REQUEST_BYTES) throw new RangeError("body limit");
      parts.push(decoder.decode(value, { stream: true }));
    }
    parts.push(decoder.decode());
    return parts.join("");
  } finally {
    clearTimeout(timer);
    // Hostile streams may never resolve cancellation; never await that promise.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
