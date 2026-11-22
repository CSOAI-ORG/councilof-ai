import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { SYSTEM_CARD_TITLE, didKeyHex, mcpToolCount, parseJsonRpc, verifyPublishedCards } from "./claims-e2e-contract.mjs";
import { verifyCard } from "../public/signed/verify-card.mjs";

const SITE = "https://site.invalid";
const reply = (body, status = 200, type = "application/json") =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status, headers: { "content-type": type },
  });
const sse = (...messages) => messages.map((m) => `event: message\ndata: ${JSON.stringify(m)}\n\n`).join("");

// A real published card (public bytes from /signed/cards/<id>.json) and the key the DID document
// publishes for it. The signature is the issuer's; nothing in these tests can mint one.
const CARD_KEY_HEX = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38";
const REAL_CARD = Object.freeze({
  alg: "Ed25519",
  body: {
    accuracy: 0.0968,
    axis: "care-refusal-protect",
    created: "2026-08-19T09:24:39.152331+00:00",
    issuer: "CSOAI Ltd (UK 16939677)",
    kind: "gspc.measurement-card",
    model: "clan-csoai-plain:latest",
    prev: "GSPC-CARD-FACTORY-GENESIS",
    public_framing: "13 measured of 14 quotable",
    verify: "https://councilof.ai/verify",
  },
  id: "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c",
  preimage_rule: "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')",
  pubkey: CARD_KEY_HEX,
  signature: "58b0c41457e440f6ca886a3e3465f736856b1680cba590869427f1774789f0486269d9748d631a7b86a1327dbe12535ee22390f0f0c4f168bb308963d7bb0204",
});
const jwk = (hex, crv = "Ed25519") => ({ kty: "OKP", crv, x: Buffer.from(hex, "hex").toString("base64url") });
const DID = {
  id: "did:web:csoai.org",
  verificationMethod: [
    { id: "did:web:csoai.org#board-attestation-1", type: "JsonWebKey2020", publicKeyJwk: jwk("9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170") },
    { id: "did:web:csoai.org#card-attestation-1", type: "JsonWebKey2020", publicKeyJwk: jwk(CARD_KEY_HEX) },
  ],
};
const clone = (value) => JSON.parse(JSON.stringify(value));
const indexOf = (cards) => ({ n_cards: cards.length, pubkey: CARD_KEY_HEX, cards: cards.map((c) => ({ card: c.id, card_url: `/signed/cards/${c.id}.json` })) });

/** A fake site: did.json, the card index and the cards, plus overrides by path. */
function siteFetch({ cards = [REAL_CARD], index = indexOf(cards), did = DID, overrides = {} } = {}) {
  const calls = [];
  const byId = new Map(cards.map((c) => [c.id, c]));
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET" });
    const path = new URL(url).pathname;
    if (path in overrides) return overrides[path]();
    if (path === "/.well-known/did.json") return reply(did);
    if (path === "/signed/card_index.json") return reply(index);
    const card = /^\/signed\/cards\/([0-9a-f]+)\.json$/.exec(path);
    if (card && byId.has(card[1])) return reply(byId.get(card[1]));
    return reply({ error: "not found" }, 404);
  };
  return { fetchImpl, calls };
}

test("parseJsonRpc reads a JSON body and the result event of an SSE stream", () => {
  assert.deepEqual(parseJsonRpc('{"jsonrpc":"2.0","id":1,"result":{"tools":[]}}', "application/json"), { jsonrpc: "2.0", id: 1, result: { tools: [] } });
  const stream = sse({ jsonrpc: "2.0", method: "notifications/progress", params: {} }, { jsonrpc: "2.0", id: 1, result: { tools: [{ name: "a" }] } });
  assert.deepEqual(parseJsonRpc(stream, "text/event-stream; charset=utf-8").result.tools, [{ name: "a" }]);
  // An event's data may span several data: lines; they join with a newline.
  assert.deepEqual(parseJsonRpc('event: message\ndata: {"id":1,\ndata: "result":{"tools":[]}}\n\n', "text/event-stream").result, { tools: [] });
  assert.throws(() => parseJsonRpc(sse({ jsonrpc: "2.0", method: "notifications/progress" }), "text/event-stream"), /no JSON-RPC result/);
  assert.throws(() => parseJsonRpc("<html>app</html>", "text/html"));
});

test("mcpToolCount posts tools/list, accepts an SSE answer, and counts its tools", async () => {
  const calls = [];
  const n = await mcpToolCount(SITE + "/mcp", async (url, init) => {
    calls.push({ url, init });
    return reply(sse({ jsonrpc: "2.0", id: 1, result: { tools: Array.from({ length: 6 }, (_, i) => ({ name: `t${i}` })) } }), 200, "text/event-stream");
  });
  assert.equal(n, 6);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, SITE + "/mcp");
  assert.equal(calls[0].init.method, "POST");
  assert.match(calls[0].init.headers.accept, /text\/event-stream/);
  assert.equal(JSON.parse(calls[0].init.body).method, "tools/list");
});

test("mcpToolCount refuses an HTTP error, a JSON-RPC error and an answer without a tools array", async () => {
  await assert.rejects(mcpToolCount(SITE + "/mcp", async () => reply({ error: "gone" }, 404)), /answered HTTP 404/);
  await assert.rejects(mcpToolCount(SITE + "/mcp", async () => reply({ jsonrpc: "2.0", id: 1, error: { code: -32601, message: "Method not found" } })), /tools\/list error: Method not found/);
  await assert.rejects(mcpToolCount(SITE + "/mcp", async () => reply({ jsonrpc: "2.0", id: 1, result: {} })), /no tools array/);
  await assert.rejects(mcpToolCount(SITE + "/mcp", async () => reply("<html>app</html>", 200, "text/html")));
});

test("didKeyHex reads the named Ed25519 key from the DID document and nothing else", () => {
  assert.equal(didKeyHex(DID, "#card-attestation-1"), CARD_KEY_HEX);
  assert.equal(didKeyHex(DID, "#card-attestation-9"), null);
  assert.equal(didKeyHex({ verificationMethod: [{ id: "x#card-attestation-1", publicKeyJwk: jwk(CARD_KEY_HEX, "X25519") }] }, "#card-attestation-1"), null);
  for (const junk of [null, {}, { verificationMethod: "x" }, []]) assert.equal(didKeyHex(junk, "#card-attestation-1"), null);
});

test("the published verifier accepts the real card and rejects altered or self-keyed copies", async () => {
  assert.equal((await verifyCard(clone(REAL_CARD))).state, "VALID");
  const altered = clone(REAL_CARD);
  altered.body.accuracy = 0.9968;
  assert.match((await verifyCard(altered)).reason, /id mismatch/);
  const resigned = clone(REAL_CARD);
  resigned.signature = "00" + resigned.signature.slice(2);
  assert.match((await verifyCard(resigned)).reason, /signature does not verify/);
  const selfKeyed = { ...clone(REAL_CARD), pubkey: "11".repeat(32) };
  assert.match((await verifyCard(selfKeyed)).reason, /not the published card-attestation key/);
});

test("verifyPublishedCards passes only when every listed card verifies under the DID key", async () => {
  const { fetchImpl, calls } = siteFetch();
  const result = await verifyPublishedCards(SITE, fetchImpl, verifyCard);
  assert.equal(result.state, "VALID");
  assert.match(result.detail, /VALID 1 · INVALID 0 · UNCHECKABLE 0 of 1 cards in \/signed\/card_index\.json under did:web:csoai\.org#card-attestation-1 \(d4cb0eaa…\)/);
  assert.equal(calls.every((c) => c.method === "GET" && /^https:\/\/site\.invalid\/(\.well-known|signed)\//.test(c.url)), true);
});

test("a forged, missing or mismatched card refutes the signing claim", async () => {
  const forged = clone(REAL_CARD);
  forged.signature = "ff" + forged.signature.slice(2);
  const forgedRun = await verifyPublishedCards(SITE, siteFetch({ cards: [forged] }).fetchImpl, verifyCard);
  assert.equal(forgedRun.state, "INVALID");
  assert.match(forgedRun.detail, /signature does not verify/);

  // The key comes from the DID document: a card carrying any other key fails before the verifier runs.
  const otherKey = { ...clone(REAL_CARD), pubkey: "22".repeat(32) };
  const always = async () => ({ state: "VALID" });
  assert.match((await verifyPublishedCards(SITE, siteFetch({ cards: [otherKey] }).fetchImpl, always)).detail, /carries a key other than #card-attestation-1/);

  // An index row that points at another card's bytes is not that card.
  const index = { n_cards: 1, cards: [{ card: "ab".repeat(32), card_url: `/signed/cards/${REAL_CARD.id}.json` }] };
  assert.match((await verifyPublishedCards(SITE, siteFetch({ index }).fetchImpl, always)).detail, /holds card 82994353b8f9/);

  for (const [name, options, reason] of [
    ["no key in the DID document", { did: { verificationMethod: [] } }, /publishes no Ed25519 key #card-attestation-1/],
    ["an empty index", { index: { n_cards: 0, cards: [] } }, /lists no cards/],
    ["a declared count the list does not hold", { index: { ...indexOf([REAL_CARD]), n_cards: 2 } }, /declares 2 cards and lists 1/],
  ]) {
    const run = await verifyPublishedCards(SITE, siteFetch(options).fetchImpl, always);
    assert.equal(run.state, "INVALID", name);
    assert.match(run.detail, reason, name);
  }
});

test("what could not be read is UNCHECKABLE, never VALID and never INVALID", async () => {
  const always = async () => ({ state: "VALID" });
  for (const [name, options, reason] of [
    ["DID document down", { overrides: { "/.well-known/did.json": () => reply("err", 503, "text/plain") } }, /did\.json answered HTTP 503/],
    ["index down", { overrides: { "/signed/card_index.json": () => reply("err", 500, "text/plain") } }, /card_index\.json answered HTTP 500/],
    ["a listed card missing", { index: { n_cards: 2, cards: [{ card: REAL_CARD.id }, { card: "cd".repeat(32) }] } }, /UNCHECKABLE 1 of 2.*answered HTTP 404/],
  ]) {
    const run = await verifyPublishedCards(SITE, siteFetch(options).fetchImpl, always);
    assert.equal(run.state, "UNCHECKABLE", name);
    assert.match(run.detail, reason, name);
  }
  const verifierCouldNotFinish = async () => ({ state: "UNCHECKABLE", reason: "this runtime has no Ed25519 (needs Node 19+)" });
  assert.equal((await verifyPublishedCards(SITE, siteFetch().fetchImpl, verifierCouldNotFinish)).state, "UNCHECKABLE");
  const verifierThrew = async () => { throw new Error("boom"); };
  assert.match((await verifyPublishedCards(SITE, siteFetch().fetchImpl, verifierThrew)).detail, /UNCHECKABLE 1 of 1.*boom/);
  // A card_url outside /signed/ is not followed; the checker reads the card from its own path.
  const { fetchImpl, calls } = siteFetch({ index: { n_cards: 1, cards: [{ card: REAL_CARD.id, card_url: "https://elsewhere.invalid/x.json" }] } });
  assert.equal((await verifyPublishedCards(SITE, fetchImpl, verifyCard)).state, "VALID");
  assert.equal(calls.some((c) => c.url.includes("elsewhere")), false);
});

test("the canonical system-card title passes while generic and other-page titles fail", () => {
  assert.equal(SYSTEM_CARD_TITLE.test("Council system card | Council of AI"), true);
  for (const title of ["Council of AI", "Council model card | Council of AI", "System Safety Card", "Council system card | Other site"]) {
    assert.equal(SYSTEM_CARD_TITLE.test(title), false, title);
  }
});

// Execute the actual API/report functions without importing the browser launcher.
// Every network dependency is replaced by a fixture; no live tool call or signing request runs.
const runner = readFileSync(new URL("./claims-e2e.mjs", import.meta.url), "utf8");
const reportAndApi = runner.slice(runner.indexOf("const R = [];"), runner.indexOf("async function open("));
const runApi = new Function("fetch", "SITE", "mcpToolCount", "verifyPublishedCards", "verifyCard",
  reportAndApi + "\nreturn apiTruth().then(() => R);");
function exitCode(rows) {
  let exit;
  new Function("R", "console", "process", "SITE", runner.slice(runner.indexOf("const passes =")))(
    rows, { log() {} }, { exit(code) { exit = code; } }, SITE);
  return exit;
}
async function apiFixture({ toolCount = 6, mcp, cards = [REAL_CARD], overrides = {} } = {}) {
  const site = siteFetch({ cards, overrides });
  const calls = site.calls;
  const fakeFetch = async (url, options = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === "/api/tools") {
      calls.push({ url: String(url), method: options.method || "GET" });
      const q = parsed.searchParams.get("q");
      const tools = !q || q === "measure" ? [{ name: "measure" }] : [];
      return reply({ total: tools.length, tools, catalogue_total: 1, server_count: 1 });
    }
    if (parsed.pathname === "/api/og") { calls.push({ url: String(url), method: "GET" }); return reply("png fixture", 200, "image/png"); }
    if (parsed.pathname === "/mcp") {
      calls.push({ url: String(url), method: options.method || "GET" });
      return mcp ? mcp() : reply(sse({ jsonrpc: "2.0", id: 1, result: { tools: Array.from({ length: toolCount }, (_, i) => ({ name: `t${i}` })) } }), 200, "text/event-stream");
    }
    return site.fetchImpl(url, options);
  };
  const rows = await runApi(fakeFetch, SITE, mcpToolCount, verifyPublishedCards, verifyCard);
  return { rows, calls };
}

test("the live-claim rows pass on the site's own MCP door and its signed cards, and the run exits 0", async () => {
  const { rows, calls } = await apiFixture();
  assert.ok(rows.some((row) => row.startsWith("✅ Live MCP tools — https://site.invalid/mcp tools/list count=6")), rows.join("\n"));
  assert.ok(rows.some((row) => row.startsWith('✅ CLAIM "Ed25519 signing" — VALID 1 · INVALID 0 · UNCHECKABLE 0 of 1')), rows.join("\n"));
  assert.equal(rows.some((row) => row.startsWith("⚠️") || row.startsWith("❌")), false, rows.join("\n"));
  assert.equal(exitCode(rows), 0);
  // Nothing goes to the retired brain host, and the only POST is the tools/list call.
  assert.equal(calls.some((call) => !call.url.startsWith(SITE + "/")), false);
  assert.deepEqual(calls.filter((call) => call.method === "POST").map((call) => call.url), [SITE + "/mcp"]);
});

test("an unreadable key or index stays UNCHECKABLE and still fails the run", async () => {
  const { rows } = await apiFixture({ overrides: { "/.well-known/did.json": () => reply("err", 503, "text/plain") } });
  assert.match(rows.find((row) => row.includes("Ed25519 signing")), /^⚠️ {2}CLAIM "Ed25519 signing" — UNCHECKABLE: could not read the key or the index/);
  assert.equal(exitCode(rows), 1);
});

test("a forged card, a dead MCP door or a short tool list fails the run", async () => {
  const forged = clone(REAL_CARD);
  forged.body.model = "someone-else:latest";
  for (const [name, options, claim] of [
    ["forged card", { cards: [forged] }, '❌ CLAIM "Ed25519 signing"'],
    ["MCP door down", { mcp: () => reply("err", 502, "text/plain") }, "❌ Live MCP tools — https://site.invalid/mcp answered HTTP 502"],
    ["four tools", { toolCount: 4 }, "❌ Live MCP tools — https://site.invalid/mcp tools/list count=4, expected at least 5"],
  ]) {
    const { rows } = await apiFixture(options);
    assert.ok(rows.some((row) => row.startsWith(claim)), `${name}\n${rows.join("\n")}`);
    assert.equal(exitCode(rows), 1, name);
  }
});

test("the exit rule: any FAIL or UNCHECKABLE row is exit 1; only all-pass is exit 0", () => {
  assert.equal(exitCode(["✅ a — ok", "✅ b — ok"]), 0);
  assert.equal(exitCode(["✅ a — ok", "⚠️  b — UNCHECKABLE: not measured"]), 1);
  assert.equal(exitCode(["✅ a — ok", "❌ b — refuted"]), 1);
});

test("the actual page check accepts its canonical title and still rejects missing body evidence", async () => {
  const pageFunction = runner.slice(runner.indexOf("async function sov3Pages("), runner.indexOf("async function interactive("));
  for (const body of ["Containment", "generic application shell"]) {
    const rows = [];
    const page = { waitForTimeout: async () => {}, title: async () => "Council system card | Council of AI",
      innerText: async () => body, close: async () => {} };
    await new Function("open", "SYSTEM_CARD_TITLE", "pass", "fail", pageFunction + "\nreturn sov3Pages({});")(
      async () => page, SYSTEM_CARD_TITLE,
      (claim, detail) => rows.push({ pass: true, claim, detail }),
      (claim, detail) => rows.push({ pass: false, claim, detail }));
    const systemRow = rows.find((row) => row.claim.includes("/sov3-system-card"));
    assert.equal(systemRow.pass, body === "Containment");
    if (body !== "Containment") assert.match(systemRow.detail, /bodyMatch=false/);
  }
});
