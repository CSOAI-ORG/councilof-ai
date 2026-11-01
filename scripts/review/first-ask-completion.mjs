import { createHash } from "node:crypto";

const LIMIT = 512 * 1024;
const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Qualify ONE finite local first-question fixture, never a public/live response.
 * The browser network verdict is retained independently of application completion.
 * Inputs come from the fulfilled route, its actual Request, passive native reads,
 * and the existing terminal live region. done:true alone is not completion proof.
 * One Node receipt sequence orders observations; raw clocks never decide acceptance.
 * @param {any} observation JSON-compatible observations from the shell test.
 */
export function qualifyLocalFirstAskCompletion(observation) {
  const reject = (reason) => ({ accepted: false, reason, browserNetworkState: "unqualified" });
  try {
    const o = observation;
    if (o?.localFixture !== true) return reject("local finite fixture required");
    if (o.orderingBasis !== "one-node-receipt-sequence") return reject("unqualified observation order");
    const origin = new URL(o.origin).origin;
    const fixture = o.fixture, request = o.request, native = o.nativeTransport;
    if (fixture?.count !== 1 || request?.count !== 1 || !Number.isInteger(request.id) || request.id < 1 ||
        fixture.requestId !== request.id) return reject("one exact fulfilled request required");
    const url = new URL(request.url);
    if (url.origin !== origin || url.pathname !== "/api/agui/run" || url.search || url.hash ||
        request.method !== "POST" || request.mainFrame !== true || fixture.url !== request.url || new URL(request.frameUrl).origin !== origin)
      return reject("request origin method path frame mismatch");
    if (request.bodyTruncated !== false || typeof request.body !== "string" || request.body.length > 4096 ||
        request.body !== fixture.requestBody) return reject("request body join missing");
    const sent = JSON.parse(request.body);
    if (!Array.isArray(sent.messages) || sent.messages.length !== 1 || sent.messages[0].role !== "user" ||
        sent.messages[0].content !== o.question || typeof o.question !== "string" || !o.question ||
        sent.forwardedProps?.confirm || sent.forwardedProps?.consent) return reject("first unconfirmed question mismatch");
    if (fixture.status !== 200 || !/^text\/event-stream(?:;|$)/i.test(fixture.contentType) ||
        typeof fixture.body !== "string") return reject("finite SSE fixture missing");
    const expectedBytes = Buffer.byteLength(fixture.body, "utf8");
    if (expectedBytes < 1 || expectedBytes > LIMIT) return reject("fixture outside byte bound");
    const blocks = fixture.body.replace(/\r\n/g, "\n").split("\n\n");
    if (blocks.at(-1) !== "") return reject("unterminated SSE fixture");
    const payloads = blocks.filter(Boolean).map((block) => {
      const data = block.split("\n").filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart()).join("\n");
      if (!data) throw new Error("fixture has no data");
      return JSON.parse(data);
    });
    const started = payloads.filter((event) => event.type === "RUN_STARTED");
    const finished = payloads.filter((event) => event.type === "RUN_FINISHED");
    if (started.length !== 1 || finished.length !== 1 || payloads[0] !== started[0] ||
        payloads.at(-1) !== finished[0] || typeof started[0].threadId !== "string" || !started[0].threadId ||
        typeof started[0].runId !== "string" || !started[0].runId ||
        finished[0].threadId !== started[0].threadId || finished[0].runId !== started[0].runId ||
        finished[0].result?.grounded !== true || finished[0].result?.awaiting_confirmation === true ||
        payloads.some((event) => event.type === "RUN_ERROR" ||
          (event.type === "CUSTOM" && ["confirm_required", "consent_required"].includes(event.name))) ||
        !payloads.some((event) => event.type === "TEXT_MESSAGE_END") ||
        !payloads.some((event) => event.type === "TEXT_MESSAGE_CONTENT" && typeof event.delta === "string" && event.delta))
      return reject("fixture semantic terminal mismatch");
    if (typeof o.expectedReadyText !== "string" || !o.expectedReadyText.startsWith("Answer ready. ") ||
        o.readyText !== o.expectedReadyText || o.answerFaceVisible !== true || o.fullAnswerRetained !== true)
      return reject("complete application answer missing");
    if (o.eventsTruncated !== false || !Array.isArray(o.networkEvents)) return reject("network evidence truncated");
    if (native?.schema !== "csoai.agui-native-transport-diagnostic/0.2" || native.byteLimit !== LIMIT ||
        native.eventsTruncated !== false || native.faultsTruncated !== false ||
        !Array.isArray(native.faults) || native.faults.length || !Array.isArray(native.requests) ||
        native.requests.length !== 1 || !Array.isArray(native.events)) return reject("native evidence incomplete");
    const run = native.requests[0];
    if (run.nativeFetchId !== 1 || !Number.isInteger(run.signalId) || run.signalId < 1 ||
        run.method !== "POST" || run.url !== request.url || run.requestBody !== request.body ||
        run.requestBodyTruncated !== false) return reject("native request identity mismatch");
    if (run.signalAbortedAtFetch !== false || run.signalAbortedAtEOF !== false ||
        run.signalReasonAtEOF !== null) return reject("signal state at completion unqualified");
    if (run.nativeEOFObserved !== true || run.nativeBytesTruncated !== false ||
        run.nativeDigestState !== "complete" || run.nativeBytesObserved !== expectedBytes ||
        run.nativeSHA256 !== sha256(fixture.body)) return reject("actual receiver bytes or completion mismatch");
    const events = native.events;
    if (!events.length || events.some((event) => event.nativeFetchId !== run.nativeFetchId || event.signalId !== run.signalId))
      return reject("native event identity mismatch");
    const cancelled = ["controller.abort.call", "signal.abort", "reader.cancel.call", "body.cancel.call",
      "body.nativeReadRejected", "fetch.rejected", "body.nativeDigestRejected"];
    if (events.some((event) => cancelled.includes(event.event))) return reject("application cancellation or read failure");
    const ofType = (type) => events.filter((event) => event.event === type);
    if (ofType("fetch").length !== 1 || ofType("fetch.resolved").length !== 1 ||
        ofType("fetch.resolved")[0].status !== 200 || ofType("fetch.resolved")[0].bodyPresent !== true ||
        ofType("fetch.resolved")[0].url !== request.url || ofType("fetch.resolved")[0].redirected !== false ||
        !/^text\/event-stream(?:;|$)/i.test(ofType("fetch.resolved")[0].contentType) ||
        ofType("body.getReader").length !== 1 || ofType("body.nativeEOF").length !== 1 ||
        ofType("body.nativeDigest").length !== 1) return reject("native lifecycle incomplete");
    const chunks = ofType("body.nativeChunk");
    if (!chunks.length || chunks.some((event) => !Number.isInteger(event.bytes) || event.bytes <= 0) ||
        chunks.reduce((sum, event) => sum + event.bytes, 0) !== expectedBytes ||
        run.nativeReadCalls !== chunks.length + 1) return reject("native read accounting mismatch");
    const eof = ofType("body.nativeEOF")[0];
    const digest = ofType("body.nativeDigest")[0];
    if (!(events.indexOf(ofType("fetch")[0]) < events.indexOf(ofType("fetch.resolved")[0]) &&
          events.indexOf(ofType("fetch.resolved")[0]) < events.indexOf(ofType("body.getReader")[0]) &&
          events.indexOf(ofType("body.getReader")[0]) < events.indexOf(chunks[0]) &&
          chunks.every((event) => events.indexOf(event) < events.indexOf(eof)) &&
          events.indexOf(eof) < events.indexOf(digest))) return reject("native lifecycle order mismatch");
    if (eof.aborted !== false || eof.reason !== null || digest.sha256 !== run.nativeSHA256 ||
        digest.bytes !== expectedBytes) return reject("read-done receipt incomplete");
    if (o.eofReceiptsTruncated !== false || !Array.isArray(o.eofReceipts) || o.eofReceipts.length !== 1)
      return reject("one native read-done receipt required");
    const receipt = o.eofReceipts[0];
    if (receipt.mainFrame !== true || receipt.samePage !== true || receipt.nativeFetchId !== run.nativeFetchId ||
        receipt.signalId !== run.signalId || receipt.url !== request.url || receipt.requestBody !== request.body ||
        receipt.aborted !== false || receipt.reason !== null || receipt.observedAt !== eof.observedAt ||
        !Number.isInteger(receipt.receiptSequence) || receipt.receiptSequence < 1)
      return reject("native read-done receipt identity mismatch");
    const network = o.networkEvents;
    if (network.some((event) => event.requestId !== request.id || event.method !== "POST" ||
        event.url !== request.url || event.mainFrame !== true || new URL(event.frameUrl).origin !== origin || event.body !== request.body ||
        event.bodyTruncated !== false)) return reject("browser request event identity mismatch");
    const starts = network.filter((event) => event.event === "request");
    const ends = network.filter((event) => event.event === "requestfinished" || event.event === "requestfailed");
    if (starts.length !== 1 || ends.length !== 1 || network.length !== 2) return reject("one browser terminal event required");
    if (network.some((event) => !Number.isInteger(event.receiptSequence) || event.receiptSequence < 1) ||
        starts[0].receiptSequence >= receipt.receiptSequence) return reject("request receipt order mismatch");
    const terminal = ends[0];
    if (terminal.receiptSequence <= starts[0].receiptSequence) return reject("browser terminal precedes request");
    if (terminal.event === "requestfinished" && terminal.failure === null)
      return { accepted: true, reason: "exact finite fixture consumed and application ready",
        browserNetworkState: "requestfinished", browserFailure: null,
        receiverBytes: expectedBytes, receiverSHA256: run.nativeSHA256 };
    if (terminal.event !== "requestfailed" || terminal.failure !== "net::ERR_ABORTED" ||
        terminal.receiptSequence <= receipt.receiptSequence)
      return reject("browser failure not strictly observed after qualified read-done");
    return { accepted: true, reason: "exact finite fixture consumed and application ready; later browser ERR_ABORTED retained",
      browserNetworkState: "requestfailed-after-complete-fixture", browserFailure: terminal.failure,
      receiverBytes: expectedBytes, receiverSHA256: run.nativeSHA256,
      orderingBoundary: "Node received native read-done before browser requestfailed; internal browser cause unresolved" };
  } catch {
    return reject("malformed completion evidence");
  }
}
