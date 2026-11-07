/** Limits structure independently of bytes: a large signed string is still one token. */
export const MCP_MAX_JSON_TOKENS = 25_000;
export const MCP_MAX_JSON_DEPTH = 64;
export const MCP_MAX_TOOL_INPUT_ELEMENTS = 10_000;

/**
 * Constant-space preflight BEFORE JSON.parse or SDK schema validation. Count value/key tokens
 * and container depth, ignoring punctuation inside escaped strings. This is not a JSON parser:
 * syntax and protocol errors remain the responsibility of JSON.parse and the SDK.
 */
export function withinJsonBudget(body: string): boolean {
  let tokens = 0;
  let depth = 0;
  let quoted = false;
  let escaped = false;
  let literal = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body.charCodeAt(i);
    if (quoted) {
      if (escaped) escaped = false;
      else if (ch === 92) escaped = true;
      else if (ch === 34) quoted = false;
      continue;
    }
    if (ch === 34) { quoted = true; literal = false; tokens++; }
    else if (ch === 123 || ch === 91) {
      literal = false;
      tokens++;
      if (++depth > MCP_MAX_JSON_DEPTH) return false;
    } else if (ch === 125 || ch === 93) { depth--; literal = false; }
    else if (ch === 44 || ch === 58 || ch === 32 || ch === 9 || ch === 10 || ch === 13) literal = false;
    else if (!literal) { literal = true; tokens++; }
    if (tokens > MCP_MAX_JSON_TOKENS) return false;
  }
  return true;
}
