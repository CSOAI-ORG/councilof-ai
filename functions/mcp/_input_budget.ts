/**
 * Structure budgets for the MCP doors and the handlers they share with /api/a2a.
 *
 * WHY. MCP_MAX_REQUEST_BYTES (28 MiB, so a 20 MiB base64 argument fits) bounds bytes, not
 * structure. Measured 2026-11-20 on master 71a4bcf in a local Node harness, never in production:
 *   - 9.5 million empty objects in one 28 MB tools/call took the V8 heap to 1.1 GB, and an
 *     initialize carrying 100,000 capability keys in 1.3 MB took it to 437 MB and answered with a
 *     26 MB error. Both happen in this door's JSON.parse and the SDK's request schema, before any
 *     tool runs. The SDK's maxToolInputElements (2.3 and later) counts tool arguments only, after both.
 *   - A card or capsule sent as a JSON STRING is one token to any scan of the request, and its
 *     handler parses it again: 1.9 million card keys cost 5 s of CPU, and the capsule reader's
 *     parse grows with the square of one object's key count (40,000 keys in 600 KB: 4 to 7 s).
 * One long string is one token, so the 20 MiB base64 contract is unchanged.
 *
 * The largest published inputs sit far inside these limits: 31 tokens for a signed card
 * (public/signed/cards, 335 files) and 70 tokens, 37 elements and depth 3 for a capsule
 * (public/measurement-capsules, 9,801 capsules).
 */
export const MCP_MAX_JSON_TOKENS = 25_000;
export const MCP_MAX_JSON_DEPTH = 64;
/** Array elements plus object members: the measure the SDK's maxToolInputElements counts. */
export const MCP_MAX_TOOL_INPUT_ELEMENTS = 10_000;

/**
 * A scan of JSON TEXT before anything parses it. It counts tokens (strings, keys, literals and
 * containers), container depth and, when `maxElements` is given, array elements plus object
 * members. Punctuation inside strings is skipped, escapes included. Memory is bounded by the
 * depth limit. This is not a parser: it answers true for text JSON.parse will reject, so syntax
 * errors keep their own answer.
 */
export function withinJsonBudget(text: string, maxElements = Infinity): boolean {
  let tokens = 0;
  let elements = 0;
  let depth = 0;
  let inString = false;
  let escaped = false;
  let inLiteral = false;
  // For each open container: is it an array, and is its next value not yet counted?
  const isArray: boolean[] = [false];
  const awaitingValue: boolean[] = [false];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (inString) {
      if (escaped) escaped = false;
      else if (c === 0x5c) escaped = true; // backslash
      else if (c === 0x22) inString = false; // closing quote
      continue;
    }
    const open = c === 0x7b || c === 0x5b; // { [
    const close = c === 0x7d || c === 0x5d; // } ]
    const separator = c === 0x2c || c === 0x3a || c === 0x20 || c === 0x09 || c === 0x0a || c === 0x0d;
    const startsValue = c === 0x22 || open || (!close && !separator && !inLiteral);
    if (startsValue && isArray[depth] && awaitingValue[depth]) {
      awaitingValue[depth] = false;
      if (++elements > maxElements) return false;
    }
    if (c === 0x3a && ++elements > maxElements) return false; // each ':' is one object member
    if (c === 0x2c && isArray[depth]) awaitingValue[depth] = true;
    if (c === 0x22) {
      inString = true;
      inLiteral = false;
      tokens++;
    } else if (open) {
      inLiteral = false;
      tokens++;
      if (++depth > MCP_MAX_JSON_DEPTH) return false;
      isArray[depth] = c === 0x5b;
      awaitingValue[depth] = true;
    } else if (close) {
      // A closer with nothing open is a syntax error at this offset; JSON.parse stops there.
      if (depth === 0) return true;
      depth--;
      inLiteral = false;
    } else if (separator) inLiteral = false;
    else if (!inLiteral) {
      inLiteral = true;
      tokens++;
    }
    if (tokens > MCP_MAX_JSON_TOKENS) return false;
  }
  return true;
}

/** The same element and depth budget for a value that arrived already parsed. Iterative. */
export function withinValueBudget(value: unknown, maxElements = MCP_MAX_TOOL_INPUT_ELEMENTS): boolean {
  let elements = 0;
  const stack: Array<{ node: object; depth: number }> = [];
  if (value !== null && typeof value === "object") stack.push({ node: value, depth: 1 });
  while (stack.length) {
    const { node, depth } = stack.pop()!;
    if (depth > MCP_MAX_JSON_DEPTH) return false;
    for (const key in node) {
      if (!Object.prototype.hasOwnProperty.call(node, key)) continue;
      if (++elements > maxElements) return false;
      const child = (node as Record<string, unknown>)[key];
      if (child !== null && typeof child === "object") stack.push({ node: child, depth: depth + 1 });
    }
  }
  return true;
}

/** True when text would be parsed as a JSON object or array; other text keeps its own error. */
export function looksLikeJsonContainer(text: string): boolean {
  const s = text.trimStart();
  return s.startsWith("{") || s.startsWith("[");
}
