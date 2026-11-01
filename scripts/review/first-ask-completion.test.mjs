import { createServer, request as httpRequest } from "node:http";
import { createFirstAskHttpFixture } from "../../e2e/first-ask-http-fixture.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { qualifyLocalFirstAskCompletion } from "./first-ask-completion.mjs";

const fixtureBody = [
  { type: "RUN_STARTED", threadId: "fixture-thread", runId: "fixture-run" },
  { type: "TEXT_MESSAGE_CONTENT", delta: "Complete answer — € 測定" },
  { type: "TEXT_MESSAGE_END", messageId: "answer" },
  { type: "RUN_FINISHED", threadId: "fixture-thread", runId: "fixture-run", result: { grounded: true } },
].map((event) => "event: " + event.type + "\ndata: " + JSON.stringify(event) + "\n\n").join("");
const body = JSON.stringify({ threadId: "web-independent", runId: "run-independent",
  messages: [{ id: "m1", role: "user", content: "Question?" }] });
function evidence(failed = false) {
  const url = "http://127.0.0.1:4180/api/agui/run", frameUrl = "http://127.0.0.1:4180/dashboard";
  const bytes = Buffer.byteLength(fixtureBody), sha256 = createHash("sha256").update(fixtureBody).digest("hex");
  const event = (event, detail = {}) => ({ nativeFetchId: 1, signalId: 1, event, observedAt: "2026-10-14T21:00:00.010Z", ...detail });
  const net = (event, detail = {}) => ({ requestId: 1, method: "POST", url, frameUrl, mainFrame: true, body, bodyTruncated: false,
    event, receiptSequence: event === "request" ? 1 : 3, observedAt: "2026-10-14T21:00:00.011Z", failure: null, ...detail });
  return { localFixture: true, orderingBasis: "one-node-receipt-sequence", origin: new URL(frameUrl).origin, question: "Question?",
    fixture: { count: 1, requestId: 1, url, requestBody: body, body: fixtureBody, status: 200, contentType: "text/event-stream" },
    request: { count: 1, id: 1, method: "POST", url, frameUrl, mainFrame: true, body, bodyTruncated: false },
    expectedReadyText: "Answer ready. tool: NOT_MEASURED", readyText: "Answer ready. tool: NOT_MEASURED",
    answerFaceVisible: true, fullAnswerRetained: true, eventsTruncated: false, eofReceiptsTruncated: false,
    eofReceipts: [{ samePage: true, mainFrame: true, nativeFetchId: 1, signalId: 1, url, requestBody: body,
      receiptSequence: 2, observedAt: "2026-10-14T21:00:00.010Z", aborted: false, reason: null }],
    networkEvents: [net("request"), net(failed ? "requestfailed" : "requestfinished",
      failed ? { failure: "net::ERR_ABORTED" } : {})],
    nativeTransport: { schema: "csoai.agui-native-transport-diagnostic/0.2", byteLimit: 512 * 1024,
      eventsTruncated: false, faultsTruncated: false, faults: [],
      requests: [{ nativeFetchId: 1, signalId: 1, method: "POST", url, requestBody: body, requestBodyTruncated: false,
        signalAbortedAtFetch: false, signalAbortedAtEOF: false, signalReasonAtEOF: null,
        nativeReadCalls: 2, nativeBytesObserved: bytes, nativeEOFObserved: true, nativeBytesTruncated: false,
        nativeDigestState: "complete", nativeSHA256: sha256 }],
      events: [event("fetch"), event("fetch.resolved", { status: 200, bodyPresent: true, url, redirected: false, contentType: "text/event-stream" }), event("body.getReader"),
        event("body.nativeChunk", { bytes }), event("body.nativeEOF", { aborted: false, reason: null }),
        event("body.nativeDigest", { sha256, bytes })] } };
}
test("complete UTF-8 fixture and terminal UI qualify a finished browser request", () => {
  const result = qualifyLocalFirstAskCompletion(evidence());
  assert.equal(result.accepted, true); assert.equal(result.browserNetworkState, "requestfinished");
  assert.equal(result.receiverBytes, Buffer.byteLength(fixtureBody));
  assert.notEqual(result.receiverBytes, fixtureBody.length);
});
test("complete application evidence retains the later browser failure as a failure", () => {
  const result = qualifyLocalFirstAskCompletion(evidence(true));
  assert.equal(result.accepted, true);
  assert.equal(result.browserNetworkState, "requestfailed-after-complete-fixture");
  assert.equal(result.browserFailure, "net::ERR_ABORTED");
});
test("ordinary browser completion may be received before application read-done", () => {
  const o = evidence();
  o.networkEvents[1].receiptSequence = 2; o.eofReceipts[0].receiptSequence = 3;
  assert.equal(qualifyLocalFirstAskCompletion(o).accepted, true);
});
const negative = [
  ["live/public response cannot use local-fixture acceptance", (o) => { o.localFixture = false; }],
  ["unknown ordering basis", (o) => { o.orderingBasis = "unqualified"; }],
  ["missing native EOF receipt", (o) => { o.eofReceipts = []; }],
  ["duplicate native EOF receipts", (o) => { o.eofReceipts.push(structuredClone(o.eofReceipts[0])); }],
  ["foreign native EOF frame", (o) => { o.eofReceipts[0].mainFrame = false; }],
  ["wrong native EOF request", (o) => { o.eofReceipts[0].requestBody += " "; }],
  ["missing native EOF", (o) => { o.nativeTransport.requests[0].nativeEOFObserved = false; }],
  ["cancel-produced done even after all bytes", (o) => { o.nativeTransport.events.push({ nativeFetchId: 1, signalId: 1, event: "reader.cancel.call" }); }],
  ["body cancel", (o) => { o.nativeTransport.events.push({ nativeFetchId: 1, signalId: 1, event: "body.cancel.call" }); }],
  ["controller abort", (o) => { o.nativeTransport.events.push({ nativeFetchId: 1, signalId: 1, event: "controller.abort.call" }); }],
  ["native signal abort", (o) => { o.nativeTransport.events.push({ nativeFetchId: 1, signalId: 1, event: "signal.abort" }); }],
  ["already aborted signal", (o) => { o.nativeTransport.requests[0].signalAbortedAtFetch = true; }],
  ["aborted signal at read-done", (o) => { o.nativeTransport.requests[0].signalAbortedAtEOF = true; }],
  ["unknown signal at read-done", (o) => { o.nativeTransport.requests[0].signalAbortedAtEOF = null; }],
  ["read rejection", (o) => { o.nativeTransport.events.push({ nativeFetchId: 1, signalId: 1, event: "body.nativeReadRejected" }); }],
  ["partial byte count", (o) => { o.nativeTransport.requests[0].nativeBytesObserved -= 1; }],
  ["different same-length received bytes", (o) => { o.nativeTransport.requests[0].nativeSHA256 = "0".repeat(64); }],
  ["hash still pending", (o) => { o.nativeTransport.requests[0].nativeDigestState = "pending"; }],
  ["byte overflow", (o) => { o.nativeTransport.requests[0].nativeBytesTruncated = true; }],
  ["native faults", (o) => { o.nativeTransport.faults.push({ message: "capture failed" }); }],
  ["native event truncation", (o) => { o.nativeTransport.eventsTruncated = true; }],
  ["browser event truncation", (o) => { o.eventsTruncated = true; }],
  ["wrong fulfilled request object identity", (o) => { o.fixture.requestId = 2; }],
  ["second question POST", (o) => { o.request.count = 2; }],
  ["second fixture fulfillment", (o) => { o.fixture.count = 2; }],
  ["second native fetch", (o) => { o.nativeTransport.requests.push(structuredClone(o.nativeTransport.requests[0])); }],
  ["foreign native URL", (o) => { o.nativeTransport.requests[0].url = "https://other.invalid/api/agui/run"; }],
  ["foreign request frame", (o) => { o.request.frameUrl = "https://other.invalid/dashboard"; }],
  ["same-origin iframe request", (o) => { o.request.mainFrame = false; }],
  ["redirected native response", (o) => { o.nativeTransport.events[1].redirected = true; }],
  ["different native response URL", (o) => { o.nativeTransport.events[1].url += "?other"; }],
  ["wrong received content type", (o) => { o.nativeTransport.events[1].contentType = "text/html"; }],
  ["native EOF recorded before a chunk", (o) => { [o.nativeTransport.events[3], o.nativeTransport.events[4]] = [o.nativeTransport.events[4], o.nativeTransport.events[3]]; }],
  ["mismatched native request body", (o) => { o.nativeTransport.requests[0].requestBody += " "; }],
  ["wrong browser terminal request", (o) => { o.networkEvents[1].requestId = 2; }],
  ["additional foreign AGUI lifecycle must not be discarded", (o) => {
    o.networkEvents.push({ ...o.networkEvents[1], requestId: 2, url: "https://other.invalid/api/agui/run" });
  }],
  ["no browser terminal event yet", (o) => { o.networkEvents.pop(); }],
  ["two browser terminal events", (o) => { o.networkEvents.push(structuredClone(o.networkEvents[1])); }],
  ["browser error received before late native read-done binding", (o) => {
    o.networkEvents[1].receiptSequence = 2; o.eofReceipts[0].receiptSequence = 3;
  }],
  ["ambiguous same-sequence browser error", (o) => { o.networkEvents[1].receiptSequence = 2; }],
  ["other browser error", (o) => { o.networkEvents[1].failure = "net::ERR_CONNECTION_RESET"; }],
  ["missing visible answer face", (o) => { o.answerFaceVisible = false; }],
  ["missing full retained tool summary", (o) => { o.fullAnswerRetained = false; }],
  ["early-close announcement", (o) => { o.readyText = "The answer stream closed early."; }],
  ["different run announcement", (o) => { o.readyText = "Answer ready. other_tool: MEASURED"; }],
  ["missing fixture semantic terminal", (o) => { o.fixture.body = o.fixture.body.replace(/event: RUN_FINISHED[\s\S]*$/, ""); }],
  ["mismatched terminal fixture run", (o) => { o.fixture.body = o.fixture.body.replace(/"runId":"fixture-run","result"/, '"runId":"wrong","result"'); }],
];
for (const [label, mutate] of negative) test("rejects " + label, () => {
  const o = evidence(true); mutate(o);
  const result = qualifyLocalFirstAskCompletion(o);
  assert.equal(result.accepted, false, label);
});
test("malformed input fails closed", () => {
  assert.equal(qualifyLocalFirstAskCompletion(null).accepted, false);
});


/** Real loopback HTTP controls for the test-only finite response transport. */
async function withFirstAskHttpFixture(run) {
  const fixture = createFirstAskHttpFixture();
  const server = createServer((req, res) => {
    if (fixture(req, res)) return;
    res.writeHead(404); res.end("Unrelated test route.");
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try { await run("http://127.0.0.1:" + server.address().port, server); }
  finally {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
      server.closeAllConnections();
    });
  }
}
function fixtureHttpRequest(base, pathname, method, data = "", headers = {}, holdUntil = null) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(base + pathname, { method,
      headers: { "content-length": Buffer.byteLength(data), ...headers } }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("error", reject);
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.setTimeout(3000, () => req.destroy(new Error("Fixture HTTP request timed out.")));
    if (holdUntil) { req.flushHeaders(); holdUntil.then(() => req.end(data), (error) => req.destroy(error)); }
    else req.end(data);
  });
}
const setupFixture = (base, data = fixtureBody, headers = {}) =>
  fixtureHttpRequest(base, "/__e2e/first-ask-fixture", "PUT", data,
    { "content-type": "text/event-stream", "x-csoai-e2e-fixture": "first-ask", ...headers });
const askFixture = (base, data = body) =>
  fixtureHttpRequest(base, "/api/agui/run", "POST", data);

test("HTTP fixture delivers exact Unicode SSE bytes once with ordinary HTTP completion", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    assert.equal((await setupFixture(base)).status, 204);
    const answer = await askFixture(base);
    assert.equal(answer.status, 200);
    assert.equal(answer.headers["content-type"], "text/event-stream");
    assert.equal(Number(answer.headers["content-length"]), Buffer.byteLength(fixtureBody));
    assert.deepEqual(answer.body, Buffer.from(fixtureBody));
    assert.equal(createHash("sha256").update(answer.body).digest("hex"),
      createHash("sha256").update(fixtureBody).digest("hex"));
    assert.equal((await askFixture(base)).status, 409);
  });
});
test("HTTP fixture rejects empty or non-SSE setup and disarms the previous attempt", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    for (const [data, headers, status] of [["", {}, 400], [fixtureBody, { "content-type": "text/plain" }, 415]]) {
      assert.equal((await setupFixture(base)).status, 204);
      assert.equal((await setupFixture(base, data, headers)).status, status);
      assert.equal((await askFixture(base)).status, 409);
    }
  });
});
test("HTTP fixture control rejects browser Origin and missing control header", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    assert.equal((await setupFixture(base, fixtureBody, { origin: base })).status, 403);
    assert.equal((await fixtureHttpRequest(base, "/__e2e/first-ask-fixture", "PUT", fixtureBody,
      { "content-type": "text/event-stream" })).status, 403);
    assert.equal((await askFixture(base)).status, 409);
  });
});
test("HTTP fixture bounds response bytes before arming", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    assert.equal((await setupFixture(base, "x".repeat(512 * 1024 + 1))).status, 413);
    assert.equal((await askFixture(base)).status, 409);
  });
});
test("HTTP fixture bounds the question and does not reuse a rejected attempt", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    assert.equal((await setupFixture(base)).status, 204);
    assert.equal((await askFixture(base, "x".repeat(4097))).status, 413);
    assert.equal((await askFixture(base)).status, 409);
  });
});
test("HTTP fixture reserves one response across concurrent question requests", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    assert.equal((await setupFixture(base)).status, 204);
    const answers = await Promise.all([askFixture(base), askFixture(base)]);
    assert.deepEqual(answers.map((answer) => answer.status).sort(), [200, 409]);
    assert.deepEqual(answers.find((answer) => answer.status === 200).body, Buffer.from(fixtureBody));
  });
});
test("HTTP fixture leaves other paths and methods to static fallback without consuming the fixture", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base) => {
    assert.equal((await setupFixture(base)).status, 204);
    for (const pathname of ["/__e2e/first-ask-fixture", "/api/agui/run"]) {
      for (const method of ["GET", "HEAD", "OPTIONS"]) {
        assert.equal((await fixtureHttpRequest(base, pathname, method)).status, 404);
      }
    }
    assert.equal((await fixtureHttpRequest(base, "/unrelated", "GET")).status, 404);
    assert.equal((await fixtureHttpRequest(base, "/__e2e/first-ask-fixture?other", "PUT")).status, 404);
    assert.equal((await fixtureHttpRequest(base, "/api/agui/run?other", "POST")).status, 404);
    assert.deepEqual((await askFixture(base)).body, Buffer.from(fixtureBody));
    assert.equal((await askFixture(base)).status, 409);
  });
});
test("HTTP fixture rejects another setup while the original setup body is active", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base, server) => {
    let release;
    const hold = new Promise((resolve) => { release = resolve; });
    const arrived = new Promise((resolve) => server.once("request", resolve));
    const setup = fixtureHttpRequest(base, "/__e2e/first-ask-fixture", "PUT", fixtureBody,
      { "content-type": "text/event-stream", "x-csoai-e2e-fixture": "first-ask" }, hold);
    await arrived;
    assert.equal((await setupFixture(base, "newer bytes")).status, 409);
    release();
    assert.equal((await setup).status, 204);
    assert.deepEqual((await askFixture(base)).body, Buffer.from(fixtureBody));
  });
});
test("HTTP fixture reserves the response before a slow question can overlap another setup", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base, server) => {
    assert.equal((await setupFixture(base)).status, 204);
    let release;
    const hold = new Promise((resolve) => { release = resolve; });
    const arrived = new Promise((resolve) => server.once("request", resolve));
    const answer = fixtureHttpRequest(base, "/api/agui/run", "POST", body, {}, hold);
    await arrived;
    assert.equal((await setupFixture(base, "newer bytes")).status, 409);
    release();
    assert.deepEqual((await answer).body, Buffer.from(fixtureBody));
    assert.equal((await askFixture(base)).status, 409);
    assert.equal((await setupFixture(base, "next attempt")).status, 204);
    assert.deepEqual((await askFixture(base)).body, Buffer.from("next attempt"));
  });
});

async function abortPartialFixtureRequest(base, pathname, method, data, headers, server) {
  let observeAborted;
  const aborted = new Promise((resolve) => { observeAborted = resolve; });
  const partial = new Promise((resolve) => {
    server.once("request", (req) => {
      req.once("aborted", observeAborted);
      req.once("data", (chunk) => resolve(chunk.length));
    });
  });
  const bytes = Buffer.from(data);
  const client = httpRequest(base + pathname, { method,
    headers: { "content-length": bytes.length, ...headers } }, (res) => res.resume());
  const clientError = new Promise((resolve) => client.once("error", resolve));
  client.write(bytes.subarray(0, 16));
  const partialBytes = await partial;
  assert.ok(partialBytes > 0 && partialBytes < bytes.length);
  client.destroy(new Error("Intentional partial fixture request cancellation."));
  await Promise.all([aborted, clientError]);
}
test("HTTP fixture does not arm partial bytes after an interrupted setup and can recover", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base, server) => {
    await abortPartialFixtureRequest(base, "/__e2e/first-ask-fixture", "PUT", fixtureBody,
      { "content-type": "text/event-stream", "x-csoai-e2e-fixture": "first-ask" }, server);
    assert.equal((await askFixture(base)).status, 409);
    assert.equal((await setupFixture(base)).status, 204);
    assert.deepEqual((await askFixture(base)).body, Buffer.from(fixtureBody));
  });
});
test("HTTP fixture consumes only its interrupted question reservation and can recover", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async (base, server) => {
    assert.equal((await setupFixture(base)).status, 204);
    await abortPartialFixtureRequest(base, "/api/agui/run", "POST", body, {}, server);
    assert.equal((await askFixture(base)).status, 409);
    assert.equal((await setupFixture(base, "fresh attempt")).status, 204);
    assert.deepEqual((await askFixture(base)).body, Buffer.from("fresh attempt"));
  });
});

test("HTTP progress fixture exposes native bytes before EOF and requires Node-side release", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async base => {
    const pauseAt = Buffer.byteLength(fixtureBody.slice(0, fixtureBody.indexOf("\n\n") + 2));
    assert.equal((await setupFixture(base, fixtureBody, { "x-csoai-e2e-pause-after": String(pauseAt) })).status, 204);
    let first, ended = false;
    const visible = new Promise(resolve => { first = resolve; });
    const answer = new Promise((resolve, reject) => {
      const request = httpRequest(base + "/api/agui/run", { method: "POST", headers: { "content-length": Buffer.byteLength(body) } }, response => {
        const chunks = [];
        response.on("data", chunk => { chunks.push(chunk); first(); });
        response.on("end", () => { ended = true; resolve(Buffer.concat(chunks)); });
        response.on("error", reject);
      });
      request.on("error", reject); request.end(body);
    });
    try {
      await visible;
      assert.equal(ended, false, "The first native HTTP chunk must precede EOF.");
      assert.equal((await setupFixture(base)).status, 409);
      assert.equal((await fixtureHttpRequest(base, "/__e2e/first-ask-fixture", "POST", "", { origin: base, "x-csoai-e2e-fixture": "first-ask" })).status, 403);
      assert.equal(ended, false);
    } finally {
      assert.equal((await fixtureHttpRequest(base, "/__e2e/first-ask-fixture", "POST", "", { "x-csoai-e2e-fixture": "first-ask" })).status, 204);
    }
    assert.deepEqual(await answer, Buffer.from(fixtureBody));
    assert.equal((await askFixture(base)).status, 409);
  });
});
test("HTTP progress fixture rejects invalid pause boundaries without leaving old bytes armed", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async base => {
    for (const value of ["-1", "0", "1e2", String(Buffer.byteLength(fixtureBody) + 1)]) {
      assert.equal((await setupFixture(base, fixtureBody, { "x-csoai-e2e-pause-after": value })).status, 400);
      assert.equal((await askFixture(base)).status, 409);
    }
  });
});
