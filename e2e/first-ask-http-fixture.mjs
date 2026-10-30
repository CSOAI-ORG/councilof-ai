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
  let pending = null, active = false, release = null, activeResponse = null;

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
    // Node-only continuation of the same one-use fixture, never a product action.
    if (req.url === controlPath && req.method === "POST") {
      req.resume();
      if (req.headers.origin !== undefined || req.headers["x-csoai-e2e-fixture"] !== "first-ask") {
        reply(res, 403, "Node-side shell fixture release required."); return true;
      }
      if (!release) { reply(res, 409, "No paused fixture."); return true; }
      release();
      res.writeHead(204, { "cache-control": "no-store" }); res.end();
      return true;
    }
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
        const header = req.headers["x-csoai-e2e-pause-after"];
        const pauseAt = header === undefined ? 0 : /^[1-9]\d*$/.test(String(header)) ? Number(header) : NaN;
        if (!Number.isSafeInteger(pauseAt) || pauseAt < 0 || pauseAt >= body.length) { reply(res, 400, "Invalid fixture pause boundary."); return; }
        pending = { body, pauseAt };
        res.writeHead(204, { "cache-control": "no-store" });
        res.end();
      });
      return true;
    }
    if (req.url !== runPath || req.method !== "POST") return false;
    if (active) { req.resume(); reply(res, 409, "A fixture request is still active."); return true; }
    const fixture = pending;
    pending = null; // Reserve the sole response before reading the question body.
    if (!fixture) { req.resume(); reply(res, 409, "No one-use question fixture is armed."); return true; }
    const { body, pauseAt } = fixture;
    active = true;
    receive(req, res, requestLimit, (question) => {
      if (question === null) { active = false; return; }
      activeResponse = res;
      let timer;
      const finish = () => {
        if (activeResponse !== res) return;
        clearTimeout(timer); activeResponse = null; release = null; active = false;
        res.end(body.subarray(pauseAt));
      };
      res.once("close", () => {
        clearTimeout(timer);
        if (activeResponse === res) { activeResponse = null; release = null; active = false; }
      });
      res.writeHead(200, { "content-type": "text/event-stream",
        "content-length": body.length, "cache-control": "no-store" });
      if (pauseAt) {
        release = finish;
        res.write(body.subarray(0, pauseAt));
        timer = setTimeout(() => res.destroy(new Error("Local fixture continuation timed out.")), 30_000);
      } else finish();
    });
    return true;
  };
}
