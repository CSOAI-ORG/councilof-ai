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
