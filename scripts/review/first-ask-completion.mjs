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


/**
 * Add independent same-session protocol proof without changing any legacy verdict.
 * Local fixtures only. No wall clocks, re-sorted events or projected legacy counters.
 */
export function qualifyLocalFirstAskWithProtocol(observation, protocol) {
  const legacyQualification = qualifyLocalFirstAskCompletion(observation);
  const reject = reason => ({ accepted: false, reason, legacyQualification,
    browserNetworkState: "unqualified", proofBasis: "same-session-protocol" });
  const require = (condition, reason) => { if (!condition) throw new Error(reason); };
  const boundedId = value => typeof value === "string" && value.length > 0 && value.length <= 256;
  try {
    const o = observation, p = protocol;
    require(o?.localFixture === true, "local finite fixture required");
    require(legacyQualification.accepted === true ||
      legacyQualification.reason === "browser failure not strictly observed after qualified read-done",
      "legacy completion prerequisites refused");
    require(p?.schema === "csoai.first-ask-passive-protocol/2" &&
      p.orderingBasis === "one-owned-cdp-session-handler-entry-sequence" &&
      p.ready === true && p.diagnosticOnly === true, "protocol capture unavailable");
    const expectedLimits = { events: 96, requests: 8, contexts: 32, faults: 8, markerBytes: 2048, idChars: 256 };
    require(Object.entries(expectedLimits).every(([key, value]) => p.limits?.[key] === value), "unqualified capture bounds");
    for (const key of ["eventsTruncated", "requestsTruncated", "contextsTruncated", "faultsTruncated",
      "markerTruncated", "identifierTruncated"]) require(p[key] === false, "protocol capture truncated or unknown");
    require(Array.isArray(p.faults) && p.faults.length === 0, "protocol capture fault");
    require(p.emitter?.enabled === true && p.emitter.emitted === 1 && p.emitter.faults === 0 &&
      p.emitter.truncated === false, "native marker emitter unavailable");
    require(typeof p.marker?.nonce === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.marker.nonce),
      "native marker nonce unavailable");
    require(Array.isArray(p.events) && p.events.length > 0 && p.events.length <= expectedLimits.events &&
      p.matchingMarkers === 1 && p.correlationAvailable === true && boundedId(p.mainFrameId),
      "protocol event coverage incomplete");
    const origin = new URL(o.origin).origin, target = o.request.url;
    const requestBytes = Buffer.byteLength(o.request.body, "utf8"), requestSHA256 = sha256(o.request.body);
    const native = o.nativeTransport.requests[0], contexts = new Map();
    let frame = null, request = null, marker = null, terminal = null, previousSequence = 0;
    for (const event of p.events) {
      require(event && Number.isSafeInteger(event.receiveSequence) && event.receiveSequence > previousSequence,
        "protocol sequence missing duplicated or reordered");
      previousSequence = event.receiveSequence;
      switch (event.event) {
        case "main-frame-navigation":
          require(!request || terminal, "main frame changed during request");
          require(boundedId(event.frameId) && typeof event.loaderId === "string" && event.loaderId.length <= 256 &&
            Number.isSafeInteger(event.generation) && event.generation > 0 &&
            (!frame || event.generation === frame.generation + 1), "unqualified frame epoch");
          frame = event; contexts.clear(); break;
        case "main-default-context-created":
          require(frame && event.frameId === frame.frameId && event.origin === origin && event.isDefault === true &&
            event.generation === frame.generation && boundedId(event.loaderId) && event.loaderId === frame.loaderId &&
            Number.isSafeInteger(event.id) && event.id > 0 && boundedId(event.uniqueId) &&
            !contexts.has(event.id) && contexts.size < expectedLimits.contexts, "foreign or ambiguous execution context");
          contexts.set(event.id, event); break;
        case "context-destroyed":
          require(!request || terminal || event.executionContextId !== request.context.id,
            "request execution context destroyed before terminal");
          contexts.delete(event.executionContextId); break;
        case "contexts-cleared":
          require(!request || terminal, "request execution contexts cleared before terminal");
          contexts.clear(); break;
        case "request": {
          require(!request && frame && frame.frameId === p.mainFrameId && event.frameId === frame.frameId &&
            event.loaderId === frame.loaderId && boundedId(event.loaderId) &&
            event.activeMainLoaderId === frame.loaderId && event.generation === frame.generation &&
            boundedId(event.id) && event.method === "POST" && event.url === target &&
            event.bodyUnavailable === false && event.redirected === false &&
            event.bodyBytes === requestBytes && event.bodySHA256 === requestSHA256,
            "raw request identity or body mismatch");
          const active = [...contexts.values()].filter(value => value.frameId === frame.frameId &&
            value.generation === frame.generation && value.loaderId === frame.loaderId);
          require(active.length === 1, "request default context unavailable");
          request = { ...event, context: active[0] }; break;
        }
        case "native-eof-console": {
          require(request && !marker && event.eof === true && event.nonce === p.marker.nonce &&
            event.contextMatched === true && event.executionContextId === request.context.id &&
            contexts.get(event.executionContextId)?.uniqueId === request.context.uniqueId &&
            event.contextUniqueId === request.context.uniqueId && event.contextLoaderId === request.loaderId &&
            event.frameId === request.frameId && event.generation === request.generation &&
            event.nativeFetchId === native.nativeFetchId && event.signalId === native.signalId &&
            event.url === target && event.aborted === false, "native marker identity context or signal mismatch");
          marker = event; break;
        }
        case "loading-finished":
        case "loading-failed":
          require(request && !terminal && event.requestId === request.id, "raw terminal identity mismatch");
          terminal = event; break;
        default: throw new Error("unknown protocol event");
      }
    }
    require(frame && request && marker && terminal && frame.frameId === p.mainFrameId &&
      request.receiveSequence < marker.receiveSequence && request.receiveSequence < terminal.receiveSequence,
      "one complete protocol request marker and terminal required");
    const legacyTerminal = o.networkEvents.find(event => event.event !== "request");
    if (legacyTerminal.event === "requestfinished") {
      require(legacyQualification.accepted === true && legacyTerminal.failure === null &&
        terminal.event === "loading-finished", "contradictory finished browser terminal");
    } else {
      require(legacyTerminal.event === "requestfailed" && legacyTerminal.failure === "net::ERR_ABORTED" &&
        terminal.event === "loading-failed" && terminal.errorText === "net::ERR_ABORTED" &&
        terminal.canceled === true && terminal.blockedReason === null,
        "unqualified raw browser failure");
      require(marker.receiveSequence < terminal.receiveSequence, "raw failure not strictly after native EOF marker");
    }
    return { accepted: true, reason: "exact finite fixture consumed with independent same-session protocol proof",
      legacyQualification, proofBasis: "same-session-protocol",
      browserNetworkState: legacyTerminal.event, browserFailure: legacyTerminal.failure,
      receiverBytes: Buffer.byteLength(o.fixture.body, "utf8"), receiverSHA256: native.nativeSHA256,
      protocolProof: { requestId: request.id, frameId: request.frameId, loaderId: request.loaderId,
        generation: request.generation, executionContextId: request.context.id,
        contextUniqueId: request.context.uniqueId, nativeFetchId: native.nativeFetchId, signalId: native.signalId,
        requestBodySHA256: requestSHA256, requestSequence: request.receiveSequence,
        nativeEOFSequence: marker.receiveSequence, terminalSequence: terminal.receiveSequence },
      orderingBoundary: "One owned CDP session received the native EOF marker and raw Network terminal; internal browser cause unresolved" };
  } catch (error) { return reject(error instanceof Error ? error.message : "malformed protocol completion evidence"); }
}
