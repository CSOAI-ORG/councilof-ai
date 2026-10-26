/**
 * One-use finite SSE fixture for the existing loopback shell server.
 * Test control is Node-side only; product/public endpoint code never imports this file.
 * The browser receives a real same-origin HTTP response, with unmodified native reads.
 */
export function createFirstAskHttpFixture() {
  const controlPath = "/__e2e/first-ask-fixture";
  const runPath = "/api/agui/run";
  const responseLimit = 512 * 1024;
  const requestLimit = 4096;
  let pending = null, active = false;

  const reply = (res, status, text) => {
    const body = Buffer.from(text);
    res.writeHead(status, { "content-type": "text/plain; charset=utf-8",
      "content-length": body.length, "cache-control": "no-store" });
    res.end(body);
  };
  const receive = (req, res, limit, complete) => {
    let size = 0, finished = false;
    const chunks = [];
    const finish = (body) => {
      if (finished) return;
      finished = true; chunks.length = 0;
      complete(body);
    };
    req.on("data", (chunk) => {
      if (finished) return;
      size += chunk.length;
      if (size > limit) {
        reply(res, 413, "Fixture body exceeds its byte bound.");
        finish(null);
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => { if (!finished) finish(Buffer.concat(chunks)); });
    req.on("aborted", () => finish(null));
    req.on("error", () => {
      if (!finished && !res.headersSent) reply(res, 400, "Fixture request failed.");
      finish(null);
    });
  };

  return (req, res) => {
    if (req.url === controlPath && req.method === "PUT") {
      if (active) { req.resume(); reply(res, 409, "A fixture request is still active."); return true; }
      pending = null; // Invalid setup cannot leave an earlier attempt armed.
      if (req.headers.origin !== undefined || req.headers["x-csoai-e2e-fixture"] !== "first-ask") {
        req.resume(); reply(res, 403, "Node-side shell fixture setup required."); return true;
      }
      if (req.headers["content-type"] !== "text/event-stream") {
        req.resume(); reply(res, 415, "Finite SSE bytes required."); return true;
      }
      active = true;
      receive(req, res, responseLimit, (body) => {
        active = false;
        if (body === null) return;
        if (!body.length) { reply(res, 400, "Empty fixture."); return; }
        pending = body;
        res.writeHead(204, { "cache-control": "no-store" });
        res.end();
      });
      return true;
    }
    if (req.url !== runPath || req.method !== "POST") return false;
    if (active) { req.resume(); reply(res, 409, "A fixture request is still active."); return true; }
    const body = pending;
    pending = null; // Reserve the sole response before reading the question body.
    if (!body) { req.resume(); reply(res, 409, "No one-use question fixture is armed."); return true; }
    active = true;
    receive(req, res, requestLimit, (question) => {
      active = false;
      if (question === null) return;
      res.writeHead(200, { "content-type": "text/event-stream",
        "content-length": body.length, "cache-control": "no-store" });
      res.end(body);
    });
    return true;
  };
}
