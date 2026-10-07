/**
 * askInput — find the question in whatever a stranger's client POSTs to a chat door.
 *
 * WHY THIS EXISTS (lane chat-door-20261007)
 * POST /api/chat read exactly three fields: `messages` (whose last entry had to carry a string
 * `content`), `prompt` and `message` (both strings). Every other body got HTTP 400
 * `{"error":"no message"}` with no hint, and /api/usage counted it as chat_state `error`. From
 * 30 Sep to 6 Oct 2026 that was 722 of 844 counted replies (GET /api/usage, read 6 Oct). A
 * reproduction against production on 7 Oct showed which shapes failed: `{"question"}`,
 * `{"query"}`, `{"input"}`, `{"text"}`, `{"q"}`, an A2A-style `{"message":{"parts":[...]}}`,
 * a text/plain body, a form body, and `curl -d 'question'` all got 400; an OpenAI
 * content-parts array (`content:[{type:"text",text}]`) was read as "[object Object]" and refused.
 *
 * WHAT IT DOES
 *   readAsk(request) reads the body once and returns the question text (or null when the body
 *   carries none), plus a SHAPE label: the content class and the top-level key NAMES, from a
 *   fixed allowlist (anything else is "other"). The shape is what /api/usage records for a
 *   request that carried no question, so the next diagnosis is a count, not a guess. No value,
 *   no text, no identifier is ever part of a shape.
 *
 * WHAT IT DOES NOT DO
 *   It never invents a question. A body with no readable text is null, and the door says so.
 */

type Json = Record<string, unknown>;

const rec = (v: unknown): Json | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : null;

/** Fields that may carry the question, in the order they are tried after `text` and `messages`. */
export const QUESTION_FIELDS = [
  "message",
  "prompt",
  "question",
  "query",
  "q",
  "input",
  "content",
  "parts",
  "ask",
  "params",
] as const;

const USER_ROLES = new Set(["user", "human", "ROLE_USER"]);
const SYSTEM_ROLES = new Set(["system", "developer"]);
const MAX_DEPTH = 4;
const MAX_ITEMS = 64;

/**
 * The question text in a parsed body, or null when it carries none.
 *   - a string is the question;
 *   - an array of role-tagged messages gives its last user turn (OpenAI / AG-UI / A2A roles);
 *   - an array of parts gives its text parts joined ({type:"text",text}, {kind:"text",text}, {text});
 *   - an object gives `text`, then `messages`, then the QUESTION_FIELDS in order.
 * "" means a question field was present and empty; null means there was none at all.
 */
export function questionOf(v: unknown, depth = 0): string | null {
  if (depth > MAX_DEPTH) return null;
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v)) {
    const items = v.slice(-MAX_ITEMS);
    const roled = items.filter((x) => typeof rec(x)?.role === "string");
    if (roled.length) {
      for (let i = roled.length - 1; i >= 0; i--) {
        if (!USER_ROLES.has(String(rec(roled[i])?.role))) continue;
        const t = questionOf(roled[i], depth + 1);
        if (t) return t;
      }
      // No user turn carries text: fall back to the last non-system message that does (the door
      // used to read the last message whatever its role). A system prompt is never the question.
      for (let i = roled.length - 1; i >= 0; i--) {
        if (SYSTEM_ROLES.has(String(rec(roled[i])?.role))) continue;
        const t = questionOf(roled[i], depth + 1);
        if (t) return t;
      }
      return "";
    }
    let found = false;
    const texts: string[] = [];
    for (const p of items) {
      const t = questionOf(p, depth + 1);
      if (t === null) continue;
      found = true;
      if (t) texts.push(t);
    }
    return found ? texts.join(" ").trim() : null;
  }
  const o = rec(v);
  if (!o) return null;
  if (typeof o.text === "string") return o.text.trim();
  let empty = false;
  if (Array.isArray(o.messages)) {
    const t = questionOf(o.messages, depth + 1);
    if (t) return t;
    if (t === "") empty = true;
  }
  for (const f of QUESTION_FIELDS) {
    if (!(f in o)) continue;
    const t = questionOf(o[f], depth + 1);
    if (t) return t;
    if (t === "") empty = true;
  }
  return empty ? "" : null;
}

/** Top-level key names a shape label may show. Any other key is reported only as "other". */
const SHAPE_KEYS = new Set<string>([
  ...QUESTION_FIELDS,
  "text",
  "messages",
  "jsonrpc",
  "method",
  "id",
  "model",
  "stream",
  "role",
  "threadId",
  "runId",
  "forwardedProps",
  "tools",
  "data",
  "metadata",
]);

export type ContentClass = "none" | "json" | "form" | "text" | "unparsed";

/**
 * A key-safe label for a request body's shape: "<content class>.<keys>". Keys are sorted
 * allowlisted names joined by "_", at most four, then "other" if any non-allowlisted key was
 * present. "nokeys" is an empty object; "notobject" is JSON that is not an object (a string,
 * number, array or null). Never a value.
 */
export function shapeLabel(content: ContentClass, parsed?: unknown): string {
  if (content === "none" || content === "unparsed" || content === "text") return content;
  const o = rec(parsed);
  if (!o) return `${content}.${Array.isArray(parsed) ? "array" : "notobject"}`;
  const keys = Object.keys(o);
  if (!keys.length) return `${content}.nokeys`;
  const known = keys.filter((k) => SHAPE_KEYS.has(k)).sort().slice(0, 4);
  const other = keys.some((k) => !SHAPE_KEYS.has(k));
  return `${content}.${[...known, ...(other ? ["other"] : [])].join("_")}`;
}

export type AskRead = {
  /** The question, trimmed; "" when a question field was present but empty; null when none. */
  question: string | null;
  /** The parsed body when it was a JSON or form object, else null. */
  body: Json | null;
  content: ContentClass;
  shape: string;
};

/**
 * Read a POST body once and find the question in it.
 *   JSON (any content type)         -> questionOf(parsed)
 *   application/x-www-form-urlencoded -> the form fields; `curl -d 'a question'` (one key, no
 *                                      value) is the question itself
 *   text/plain, or no content type   -> the raw text is the question
 *   a JSON content type that does not parse -> no question ("unparsed"); a truncated JSON body
 *                                      is never answered as if it were prose
 */
export async function readAsk(request: Request): Promise<AskRead> {
  let raw = "";
  try {
    raw = await request.text();
  } catch {
    raw = "";
  }
  if (!raw.trim()) return { question: null, body: null, content: "none", shape: "none" };
  const ctype = (request.headers.get("content-type") ?? "").toLowerCase();

  if (ctype.includes("application/x-www-form-urlencoded")) {
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      parsedJson = undefined;
    }
    // curl -d '{"message":"..."}' sends JSON under the form content type.
    if (parsedJson !== undefined) {
      return { question: questionOf(parsedJson), body: rec(parsedJson), content: "json", shape: shapeLabel("json", parsedJson) };
    }
    const form = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;
    const keys = Object.keys(form);
    if (keys.length === 1 && form[keys[0]] === "" && !SHAPE_KEYS.has(keys[0])) {
      // `curl -d 'what does the board say'`: the whole body is one key with no value.
      return { question: keys[0].trim(), body: null, content: "text", shape: "text" };
    }
    return { question: questionOf(form), body: form, content: "form", shape: shapeLabel("form", form) };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    // A plain-text body that happens to parse as a JSON scalar ("42", "true") is still prose.
    const scalar = parsed === null || typeof parsed === "number" || typeof parsed === "boolean";
    if (!(scalar && !ctype.includes("json"))) {
      return { question: questionOf(parsed), body: rec(parsed), content: "json", shape: shapeLabel("json", parsed) };
    }
  } catch {
    /* not JSON */
  }
  if (ctype.includes("json") || ctype.startsWith("multipart/")) {
    return { question: null, body: null, content: "unparsed", shape: "unparsed" };
  }
  return { question: raw.trim(), body: null, content: "text", shape: "text" };
}

/** The request shapes the chat door reads, for a refusal that tells the caller what to send. */
export const ACCEPTED_SHAPES = [
  '{"message": "<question>"}',
  '{"messages": [{"role": "user", "content": "<question>"}]} (content may also be [{"type": "text", "text": "<question>"}])',
  '{"prompt" | "question" | "query" | "q" | "input" | "text": "<question>"}',
  '{"message": {"role": "user", "parts": [{"text": "<question>"}]}} (an A2A message)',
  "a text/plain body that is the question",
] as const;
