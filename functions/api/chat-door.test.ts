/**
 * POST /api/chat reads the question in the shapes strangers send (lane chat-door-20261007).
 *
 * The reproduction set below is the one run against production on 7 Oct 2026: four plain
 * questions a stranger would ask, sent in the body shapes a client library or a hand-written curl
 * produces. Before this lane every shape except {message}, {messages: [{content: string}]} and
 * {prompt} got HTTP 400 {"error":"no message"} (counted on /api/usage as chat_state "error"), and
 * an OpenAI content-parts array was read as "[object Object]" and refused as ungrounded.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequestPost as chatPost } from "./chat";
import { questionOf, readAsk, shapeLabel } from "../_lib/askInput";

const ORIGIN = "https://councilof.ai";

const BOARD = {
  totals: {
    axes: 23,
    measured_axes: 23,
    unmeasured_axes: 0,
    public_count: "23 axis · 23 measured",
    separation_public_count: "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED",
  },
  axes: [{ axis: "safety", family: "gspc", status: "MEASURED", n: 36, accuracy: 0.9444, kind: "model-comparison" }],
  measured_on: {},
};

function stubOrigin() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const req = input instanceof Request ? input : new Request(String(input), init);
      return new URL(req.url).pathname === "/api/gspc" ? Response.json(BOARD) : new Response("not found", { status: 404 });
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function ask(body: string | null, ctype: string | null = "application/json") {
  const headers: Record<string, string> = {};
  if (ctype) headers["content-type"] = ctype;
  const res = await chatPost({
    request: new Request(`${ORIGIN}/api/chat`, { method: "POST", headers, body: body ?? undefined }),
    env: {},
  } as never);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { status: res.status, json: (await res.json()) as any };
}

const QUESTIONS = ["how safe is qwen3:8b", "what does the board say", "open government", "is example.com/mcp safe"];

const SHAPES: Record<string, (q: string) => [string, string | null]> = {
  question: (q) => [JSON.stringify({ question: q }), "application/json"],
  query: (q) => [JSON.stringify({ query: q }), "application/json"],
  input: (q) => [JSON.stringify({ input: q }), "application/json"],
  text: (q) => [JSON.stringify({ text: q }), "application/json"],
  q: (q) => [JSON.stringify({ q }), "application/json"],
  "OpenAI content parts": (q) => [JSON.stringify({ messages: [{ role: "user", content: [{ type: "text", text: q }] }] }), "application/json"],
  "A2A message object": (q) => [JSON.stringify({ message: { role: "user", parts: [{ text: q }] } }), "application/json"],
  "A2A 0.3 parts": (q) => [JSON.stringify({ message: { kind: "message", role: "user", parts: [{ kind: "text", text: q }] } }), "application/json"],
  "a whole A2A JSON-RPC request": (q) => [
    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "message/send", params: { message: { role: "user", parts: [{ kind: "text", text: q }] } } }),
    "application/json",
  ],
  "LangServe input.question": (q) => [JSON.stringify({ input: { question: q } }), "application/json"],
  "text/plain body": (q) => [q, "text/plain"],
  "form message=": (q) => [`message=${encodeURIComponent(q)}`, "application/x-www-form-urlencoded"],
  "curl -d 'question' (form content type, no key)": (q) => [q, "application/x-www-form-urlencoded"],
  "curl -d '{json}' (form content type)": (q) => [JSON.stringify({ message: q }), "application/x-www-form-urlencoded"],
  "no content type": (q) => [q, null],
};

describe("POST /api/chat — every shape that carries a question gets the same answer as {message}", () => {
  for (const q of QUESTIONS) {
    for (const [name, mk] of Object.entries(SHAPES)) {
      it(`${name}: ${JSON.stringify(q)}`, async () => {
        stubOrigin();
        const reference = await ask(JSON.stringify({ message: q }));
        const [body, ctype] = mk(q);
        const got = await ask(body, ctype);
        expect(got.status).toBe(200);
        expect(got.json.error).toBeUndefined();
        expect(got.json.state).toBe(reference.json.state);
        expect(got.json.answered_by).toBe(reference.json.answered_by);
        // The tool output stamps its read time; everything else must be identical.
        const at = (s: string) => String(s).replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, "<read-time>");
        expect(at(got.json.answer)).toBe(at(reference.json.answer));
      });
    }
  }

  it("the reference shapes still answer, and the plain questions land where the live door lands them", async () => {
    stubOrigin();
    const board = await ask(JSON.stringify({ messages: [{ role: "user", content: "what does the board say" }] }));
    expect(board.status).toBe(200);
    expect(board.json.state).toBe("grounded");
    expect(board.json.answered_by).toBe("tool:board_totals");
    const server = await ask(JSON.stringify({ prompt: "is example.com/mcp safe" }));
    expect(server.json.answered_by).toBe("tool:server_evidence");
    const model = await ask(JSON.stringify({ message: "how safe is qwen3:8b" }));
    expect(model.status).toBe(200);
  });

  it("reads the LAST USER turn, never a system prompt, from a messages array", async () => {
    stubOrigin();
    const got = await ask(
      JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "what does the board say" },
          { role: "assistant", content: "..." },
        ],
      }),
    );
    expect(got.json.answered_by).toBe("tool:board_totals");
  });
});

describe("POST /api/chat — a request with no question is refused, and told what to send", () => {
  it.each([
    ["an empty JSON object", "{}", "application/json", "json.nokeys"],
    ["no body", null, null, "none"],
    ["an unknown field", JSON.stringify({ foo: "what does the board say" }), "application/json", "json.other"],
    ["truncated JSON", '{"message": "what does', "application/json", "unparsed"],
    ["a JSON array of numbers", "[1,2]", "application/json", "json.array"],
  ])("%s -> 400 with the accepted shapes and the body's shape", async (_name, body, ctype, shape) => {
    stubOrigin();
    const got = await ask(body, ctype);
    expect(got.status).toBe(400);
    expect(got.json.error).toBe("no message");
    expect(got.json.accepted.length).toBeGreaterThan(3);
    expect(got.json.example).toContain("/api/chat");
    expect(got.json.received.shape).toBe(shape);
    // The refusal never echoes the caller's text.
    expect(JSON.stringify(got.json)).not.toContain("what does the board say");
  });
});

describe("askInput — pure readers", () => {
  it("questionOf distinguishes no question (null) from an empty one ('')", () => {
    expect(questionOf({})).toBeNull();
    expect(questionOf({ foo: "x" })).toBeNull();
    expect(questionOf({ message: "" })).toBe("");
    expect(questionOf({ messages: [{ role: "user", content: "  hi  " }] })).toBe("hi");
    expect(questionOf({ messages: [{ role: "user", content: [{ type: "text", text: "a" }, { type: "image_url", image_url: { url: "x" } }, { type: "text", text: "b" }] }] })).toBe("a b");
    expect(questionOf({ params: { message: { parts: [{ data: { skill: "gspc-board", input: {} } }] } } })).toBeNull();
  });

  it("shapeLabel names keys from the allowlist only, never a value", () => {
    expect(shapeLabel("json", { query: "secret words", zzz_private: 1 })).toBe("json.query_other");
    expect(shapeLabel("json", { jsonrpc: "2.0", method: "x", id: 1, params: {} })).toBe("json.id_jsonrpc_method_params");
    expect(shapeLabel("json", "a string")).toBe("json.notobject");
    expect(shapeLabel("none")).toBe("none");
  });

  it("readAsk treats a JSON scalar sent as text/plain as prose", async () => {
    const r = await readAsk(new Request(`${ORIGIN}/api/chat`, { method: "POST", headers: { "content-type": "text/plain" }, body: "42" }));
    expect(r.question).toBe("42");
  });
});
