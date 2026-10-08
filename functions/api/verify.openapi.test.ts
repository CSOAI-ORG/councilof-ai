/** The generated OpenAPI inputs and schemas must describe the real free verifier. */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet, onRequestPost } from "./verify";

const ORIGIN = "https://councilof.ai";
const PUBLIC = resolve(__dirname, "../../public");
const spec = JSON.parse(readFileSync(resolve(PUBLIC, "openapi.json"), "utf8"));
const manifest = JSON.parse(readFileSync(resolve(__dirname, "../../scripts/fixtures/x402scan/well_known_x402.json"), "utf8"));
const get = spec.paths["/api/verify"].get;
const post = spec.paths["/api/verify"].post;
const published = (path: string) => readFileSync(resolve(PUBLIC, `.${path}`), "utf8");

function sampleUrl(): string {
  const parameter = get.parameters?.find((p: { name: string }) => p.name === "record_url");
  expect(parameter, "GET record_url must be discoverable in the generated contract").toBeDefined();
  return parameter.example;
}

function serveRecord(recordUrl: string, text: string) {
  vi.stubGlobal("fetch", vi.fn(async (input: string) => {
    const url = String(input);
    if (url === recordUrl) return new Response(text, { headers: { "content-type": "application/json" } });
    if (url === `${ORIGIN}/.well-known/did.json`) return new Response(published("/.well-known/did.json"));
    throw new Error(`unexpected fetch: ${url}`);
  }));
}

const callGet = (recordUrl?: string) => (onRequestGet as any)({
  request: new Request(recordUrl === undefined ? `${ORIGIN}/api/verify`
    : `${ORIGIN}/api/verify?record_url=${encodeURIComponent(recordUrl)}`),
});
const callPost = (body: unknown) => (onRequestPost as any)({
  request: new Request(`${ORIGIN}/api/verify`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  }),
});

type SchemaCase = { schema: unknown; instance: unknown };
const schemaCases: (SchemaCase & { label: string; valid: boolean })[] = [];

/** Validate every collected generated contract in one independent interpreter, without repeated startup. */
afterAll(() => {
  const result = spawnSync("python3", ["-c", `import json,sys
from jsonschema import Draft202012Validator,FormatChecker
d=json.load(sys.stdin)
errors=[]
for s in d['components']['schemas'].values():
 Draft202012Validator.check_schema(s)
for c in d['cases']:
 s={**c['schema'],'components':d['components']}
 Draft202012Validator.check_schema(s)
 failures=[e.message for e in Draft202012Validator(s,format_checker=FormatChecker()).iter_errors(c['instance'])]
 if bool(failures)==c['valid']:
  errors.append(c['label']+': '+('; '.join(failures) if failures else 'schema accepted an invalid instance'))
print('\\n'.join(errors))
sys.exit(1 if errors else 0)`], {
    input: JSON.stringify({ cases: schemaCases, components: spec.components }), encoding: "utf8", timeout: 10_000,
  });
  expect(result.status, result.stdout + result.stderr + (result.error?.message ?? "")).toBe(0);
}, 15_000);

function matchesCases(cases: SchemaCase[], valid = true) {
  for (const c of cases) schemaCases.push({ ...c, valid, label: expect.getState().currentTestName ?? "generated verifier schema" });
}

const matches = (schema: unknown, instance: unknown) => matchesCases([{ schema, instance }]);

async function responseCase(method: "get" | "post", response: Response) {
  expect(response.headers.get("payment-required")).toBeNull();
  const body = await response.json();
  const schema = spec.paths["/api/verify"][method].responses[String(response.status)]?.content?.["application/json"]?.schema;
  expect(schema, `${method.toUpperCase()} ${response.status} needs a response schema`).toBeDefined();
  return { schema, instance: body };
}

async function matchesResponse(method: "get" | "post", response: Response) {
  const result = await responseCase(method, response);
  matchesCases([result]);
  return result.instance;
}

afterEach(() => vi.unstubAllGlobals());

describe("OpenAPI free verifier contract against actual handler responses", () => {
  it("keeps GET optional, anonymous and tied to the manifest's authentic historical example", () => {
    const parameter = get.parameters?.find((p: { name: string }) => p.name === "record_url");
    const door = manifest.free_doors.find((d: { url: string }) => new URL(d.url).pathname === "/api/verify");
    expect(parameter).toMatchObject({ in: "query", required: false });
    expect(sampleUrl()).toBe(new URL(door.url).searchParams.get("record_url"));
    matches(parameter.schema, sampleUrl());
    for (const operation of [get, post]) {
      expect(operation.security).toEqual([]);
      expect(operation["x-payment-info"]).toBeUndefined();
      expect(operation.responses["402"]).toBeUndefined();
    }
  });

  it("bare GET is instructions, without inventing a verdict", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const result = await matchesResponse("get", await callGet());
    expect(result.state).toBeUndefined();
    expect(result.free).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
    // A verdict attached to an instructions envelope must not slip through GET's anyOf branch.
    matchesCases([{ schema: get.responses["200"].content["application/json"].schema, instance: { ...result, state: "VALID" } }], false);
  });

  it("the generated GET example returns VALID through the real pinned-key verifier", async () => {
    const url = sampleUrl();
    serveRecord(url, published(new URL(url).pathname));
    const result = await matchesResponse("get", await callGet(url));
    expect(result).toMatchObject({ state: "VALID", free: true, not_a_certification: true });
    expect(result.checks).toContainEqual(expect.objectContaining({ code: "live_anchor_agrees", ok: true }));
    // This must be rejected even though GET 200 also permits a state-less instructions envelope.
    matchesCases([{ schema: get.responses["200"].content["application/json"].schema, instance: { ...result, state: "PASS" } }], false);
  });

  it("a tampered example remains INVALID, matching the generated response schema", async () => {
    const url = sampleUrl();
    const card = JSON.parse(published(new URL(url).pathname));
    card.body.accuracy += 0.5;
    serveRecord(url, JSON.stringify(card));
    const result = await matchesResponse("get", await callGet(url));
    expect(result.state).toBe("INVALID");
    expect(result.reasons).toContain("preimage_mismatch");
  });

  it("unsupported records and non-JSON bytes stay UNCHECKABLE at HTTP 200", async () => {
    const url = `${ORIGIN}/signed/card_index.json`;
    serveRecord(url, published("/signed/card_index.json"));
    const unsupported = await callGet(url);
    expect(unsupported.status).toBe(200);
    expect(await matchesResponse("get", unsupported)).toMatchObject({ state: "UNCHECKABLE", reason: "unrecognised_family" });
    serveRecord(url, "not JSON");
    const unreadable = await callGet(url);
    expect(unreadable.status).toBe(200);
    const result = await matchesResponse("get", unreadable);
    expect(result).toMatchObject({ state: "UNCHECKABLE", reason: "the record is not JSON" });
    expect(result.reasons).toBeUndefined();
  });

  it("GET 400 refuses an unsafe URL before fetching, with fetched:null", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const response = await callGet("https://example.com/card.json");
    expect(response.status).toBe(400);
    expect(await matchesResponse("get", response)).toMatchObject({ state: "UNCHECKABLE", free: true, fetched: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("redirect refusal exposes status and final URL without invented bytes or hash", async () => {
    const response = new Response("not read");
    Object.defineProperty(response, "url", { value: "https://example.com/card.json" });
    vi.stubGlobal("fetch", vi.fn(async () => response));
    const refusal = await callGet(sampleUrl());
    expect(refusal.status).toBe(400);
    const result = await matchesResponse("get", refusal);
    expect(result.fetched).toEqual({ http_status: 200, final_url: "https://example.com/card.json" });
    expect(response.bodyUsed).toBe(false);
  });

  it("GET 502 declares the fetch failure as UNCHECKABLE", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const response = await callGet(sampleUrl());
    expect(response.status).toBe(502);
    expect(await matchesResponse("get", response)).toMatchObject({ state: "UNCHECKABLE", fetched: null, free: true });
  });

  it("the generated POST URL example is readable input and returns VALID", async () => {
    const input = post.requestBody?.content?.["application/json"];
    expect(input, "POST inputs must be discoverable in OpenAPI").toBeDefined();
    const body = input.examples.published_record_url.value;
    matches(input.schema, body);
    const url = sampleUrl();
    expect(body).toEqual({ card: url });
    serveRecord(url, published(new URL(url).pathname));
    expect(await matchesResponse("post", await callPost(body))).toMatchObject({ state: "VALID", free: true });
  });

  it("POST accepts direct record objects and JSON strings; its unreadable-input 400 omits free", async () => {
    const url = sampleUrl();
    const card = JSON.parse(published(new URL(url).pathname));
    serveRecord(url, JSON.stringify(card));
    const cases: SchemaCase[] = [];
    for (const input of [card, JSON.stringify(card), { record: card }, { json: card }, { url: url }, { input: card }]) {
      cases.push({ schema: post.requestBody.content["application/json"].schema, instance: input });
      const result = await responseCase("post", await callPost(input));
      expect(result.instance).toMatchObject({ state: "VALID" });
      cases.push(result);
    }
    const response = await callPost("not JSON or an allowed URL");
    expect(response.status).toBe(400);
    const result = await responseCase("post", response);
    expect(result.instance.state).toBe("UNCHECKABLE");
    expect(result.instance.free).toBeUndefined();
    cases.push(result);
    matchesCases(cases);
  });

  it.each([
    [{ path: 42, sha256: "not independently checked" }, { path: 42, sha256: "not independently checked" }],
    [["unvalidated metadata"], ["unvalidated metadata"]],
    ["not an object", null],
  ])("the POST signed-run result permits its actual artifact variant (%j)", async (artifact, echoed) => {
    const record = { schema: "csoai.signed-run/0.1", payload: { artifact } };
    matches(post.requestBody.content["application/json"].schema, record);
    const response = await callPost(record);
    expect(response.status).toBe(200);
    const result = await matchesResponse("post", response);
    expect(result).toMatchObject({ state: "UNCHECKABLE", family: "csoai.signed-run", reasons: ["key_not_pinned"], artifact: echoed });
    expect(result.id).toBeUndefined();
    expect(result.rule).toBeUndefined();
  });
});
