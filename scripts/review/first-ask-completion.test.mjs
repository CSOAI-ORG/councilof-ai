import { createServer, request as httpRequest } from "node:http";
import { createFirstAskHttpFixture } from "../../e2e/first-ask-http-fixture.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { qualifyLocalFirstAskCompletion, qualifyLocalFirstAskWithProtocol } from "./first-ask-completion.mjs";

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


/** Independent protocol evidence is a second channel; old receipt verdicts remain intact. */
function protocolEvidence(o, failed = true) {
  const requestSHA256 = createHash("sha256").update(o.request.body).digest("hex");
  const request = { id: "raw-request-1", frameId: "main-frame-1", loaderId: "main-loader-1", generation: 1,
    method: "POST", url: o.request.url, bodyBytes: Buffer.byteLength(o.request.body),
    bodySHA256: requestSHA256, bodyUnavailable: false, redirected: false, activeMainLoaderId: "main-loader-1" };
  const nonce = "11223344-5566-4788-9abc-001122334455";
  return { schema: "csoai.first-ask-passive-protocol/2", diagnosticOnly: true,
    orderingBasis: "one-owned-cdp-session-handler-entry-sequence", ready: true,
    marker: { nonce }, mainFrameId: "main-frame-1", matchingMarkers: 1, correlationAvailable: true,
    limits: { events: 96, requests: 8, contexts: 32, faults: 8, markerBytes: 2048, idChars: 256 },
    eventsTruncated: false, requestsTruncated: false, contextsTruncated: false, faultsTruncated: false,
    markerTruncated: false, identifierTruncated: false, faults: [],
    emitter: { enabled: true, emitted: 1, faults: 0, truncated: false },
    requests: [{ ...request }], joins: [],
    events: [
      { receiveSequence: 1, event: "main-frame-navigation", frameId: "main-frame-1", loaderId: "main-loader-1", generation: 1 },
      { receiveSequence: 2, event: "main-default-context-created", id: 7, uniqueId: "context-unique-1",
        frameId: "main-frame-1", loaderId: "main-loader-1", generation: 1, origin: o.origin, isDefault: true },
      { receiveSequence: 3, event: "request", ...request },
      { receiveSequence: 4, event: "native-eof-console", executionContextId: 7, contextUniqueId: "context-unique-1",
        contextLoaderId: "main-loader-1", contextMatched: true, frameId: "main-frame-1", generation: 1,
        nonce, eof: true, nativeFetchId: 1, signalId: 1, url: o.request.url, aborted: false },
      failed ? { receiveSequence: 5, event: "loading-failed", requestId: "raw-request-1",
        errorText: "net::ERR_ABORTED", canceled: true, blockedReason: null }
        : { receiveSequence: 5, event: "loading-finished", requestId: "raw-request-1", encodedDataLength: 1000 },
    ] };
}
const renumberProtocol = p => p.events.forEach((event, index) => { event.receiveSequence = index + 1; });

for (const sameSequence of [false, true]) test("independent raw EOF order can qualify a late legacy callback without rewriting it: " + sameSequence, () => {
  const o = evidence(true);
  o.networkEvents[1].receiptSequence = 2; o.eofReceipts[0].receiptSequence = sameSequence ? 2 : 3;
  const retained = structuredClone(o), p = protocolEvidence(o);
  assert.equal(qualifyLocalFirstAskCompletion(o).accepted, false);
  const result = qualifyLocalFirstAskWithProtocol(o, p);
  assert.equal(result.accepted, true);
  assert.equal(result.legacyQualification.accepted, false);
  assert.equal(result.browserNetworkState, "requestfailed");
  assert.equal(result.browserFailure, "net::ERR_ABORTED");
  assert.equal(result.protocolProof.nativeEOFSequence, 4);
  assert.equal(result.protocolProof.terminalSequence, 5);
  assert.deepEqual(o, retained, "Neither original counters nor raw failure are projected or reordered");
});
test("same-session ordinary HTTP finish may precede JS drain", () => {
  const o = evidence(), p = protocolEvidence(o, false);
  [p.events[3], p.events[4]] = [p.events[4], p.events[3]]; renumberProtocol(p);
  assert.equal(qualifyLocalFirstAskWithProtocol(o, p).accepted, true);
});
test("contradictory raw failure before EOF refuses even a legacy positive", () => {
  const o = evidence(true), p = protocolEvidence(o);
  assert.equal(qualifyLocalFirstAskCompletion(o).accepted, true);
  [p.events[3], p.events[4]] = [p.events[4], p.events[3]]; renumberProtocol(p);
  const result = qualifyLocalFirstAskWithProtocol(o, p);
  assert.equal(result.accepted, false);
  assert.equal(result.legacyQualification.accepted, true);
});
const protocolNegative = [
  ["missing protocol", (_o, p) => { delete p.schema; }],
  ["unqualified ordering channel", (_o, p) => { p.orderingBasis = "wall-clock"; }],
  ["unknown default context", (_o, p) => { p.events[1].isDefault = false; }],
  ["cross-origin context", (_o, p) => { p.events[1].origin = "https://other.invalid"; }],
  ["iframe context", (_o, p) => { p.events[1].frameId = "child-frame"; }],
  ["wrong execution context", (_o, p) => { p.events[3].executionContextId = 8; }],
  ["reused context identity", (_o, p) => { p.events[3].contextUniqueId = "other-unique-id"; }],
  ["stale context epoch", (_o, p) => { p.events[1].generation = 2; }],
  ["stale loader", (_o, p) => { p.events[2].loaderId = "previous-loader"; }],
  ["marker loader mismatch", (_o, p) => { p.events[3].contextLoaderId = "previous-loader"; }],
  ["wrong marker nonce", (_o, p) => { p.events[3].nonce = "other"; }],
  ["wrong native fetch", (_o, p) => { p.events[3].nativeFetchId = 2; }],
  ["wrong native signal", (_o, p) => { p.events[3].signalId = 2; }],
  ["aborted native EOF marker", (_o, p) => { p.events[3].aborted = true; }],
  ["missing raw body", (_o, p) => { p.events[2].bodyUnavailable = true; }],
  ["raw body digest mismatch", (_o, p) => { p.events[2].bodySHA256 = "0".repeat(64); }],
  ["raw body byte mismatch", (_o, p) => { p.events[2].bodyBytes++; }],
  ["redirected raw request", (_o, p) => { p.events[2].redirected = true; }],
  ["different raw request URL", (_o, p) => { p.events[2].url += "?other"; }],
  ["wrong terminal request", (_o, p) => { p.events[4].requestId = "other-request"; }],
  ["other raw failure", (_o, p) => { p.events[4].errorText = "net::ERR_CONNECTION_RESET"; }],
  ["unknown raw cancellation flag", (_o, p) => { delete p.events[4].canceled; }],
  ["raw failure before marker", (_o, p) => { [p.events[3], p.events[4]] = [p.events[4], p.events[3]]; renumberProtocol(p); }],
  ["same raw receipt sequence", (_o, p) => { p.events[4].receiveSequence = p.events[3].receiveSequence; }],
  ["reordered raw array", (_o, p) => { [p.events[2], p.events[3]] = [p.events[3], p.events[2]]; }],
  ["missing marker", (_o, p) => { p.events.splice(3, 1); }],
  ["duplicate marker", (_o, p) => { p.events.splice(4, 0, { ...p.events[3] }); renumberProtocol(p); }],
  ["second raw question", (_o, p) => { p.events.splice(3, 0, { ...p.events[2] }); renumberProtocol(p); }],
  ["context destroyed before marker", (_o, p) => { p.events.splice(3, 0, { event: "context-destroyed", executionContextId: 7 }); renumberProtocol(p); }],
  ["contexts cleared before terminal", (_o, p) => { p.events.splice(4, 0, { event: "contexts-cleared" }); renumberProtocol(p); }],
  ["native marker emitter failure", (_o, p) => { p.emitter.faults = 1; }],
  ["native marker emitter truncation", (_o, p) => { p.emitter.truncated = true; }],
  ["missing collector correlation", (_o, p) => { p.correlationAvailable = false; }],
  ["capture fault", (_o, p) => { p.faults.push({ stage: "capture" }); }],
  ["raised capture bound", (_o, p) => { p.limits.events++; }],
  ...["eventsTruncated", "requestsTruncated", "contextsTruncated", "faultsTruncated",
    "markerTruncated", "identifierTruncated"].map(key => [key, (_o, p) => { p[key] = true; }]),
];
for (const [label, mutate] of protocolNegative) test("same-session protocol refuses " + label, () => {
  const o = evidence(true), p = protocolEvidence(o);
  mutate(o, p);
  assert.equal(qualifyLocalFirstAskWithProtocol(o, p).accepted, false, label);
});
for (const [label, mutate] of negative) {
  // These two legacy callback-order refusals remain tested above against the old API.
  // Independent raw protocol proof is precisely the additional evidence for this case.
  if (["browser error received before late native read-done binding", "ambiguous same-sequence browser error"].includes(label)) continue;
  test("independent protocol proof cannot override legacy semantic refusal: " + label, () => {
    const o = evidence(true), p = protocolEvidence(o);
    mutate(o);
    assert.equal(qualifyLocalFirstAskWithProtocol(o, p).accepted, false, label);
  });
}
test("producer diagnostic reads do not consume the armed fixture and deny browser fetch metadata", { timeout: 5000 }, async () => {
  await withFirstAskHttpFixture(async base => {
    assert.equal((await setupFixture(base)).status, 204);
    const address = "/__e2e/first-ask-fixture-diagnostics", authorized = { "x-csoai-e2e-fixture": "first-ask" };
    for (const headers of [{}, { ...authorized, origin: base }, { ...authorized, "sec-fetch-mode": "cors" },
      { ...authorized, "sec-fetch-site": "same-origin" }, { ...authorized, "sec-fetch-dest": "empty" }]) {
      assert.equal((await fixtureHttpRequest(base, address, "GET", "", headers)).status, 403);
    }
    const before = await fixtureHttpRequest(base, address, "GET", "", authorized);
    assert.equal(before.status, 200);
    assert.equal(JSON.parse(before.body).requests.length, 0);
    assert.deepEqual((await askFixture(base)).body, Buffer.from(fixtureBody));
    const after = await fixtureHttpRequest(base, address, "GET", "", authorized), data = JSON.parse(after.body);
    assert.equal(after.status, 200);
    assert.equal(data.schema, "csoai.first-ask-producer-diagnostic/1");
    assert.equal(data.producerOnly, true);
    assert.equal(data.requests.length, 1);
    assert.equal(data.requests[0].requestSHA256, createHash("sha256").update(body).digest("hex"));
    assert.equal(data.requests[0].responseSHA256, createHash("sha256").update(fixtureBody).digest("hex"));
    assert.equal(data.requests[0].responseBytes, Buffer.byteLength(fixtureBody));
    assert.equal((await askFixture(base)).status, 409, "Diagnostic reads never re-arm a consumed fixture");
  });
});
