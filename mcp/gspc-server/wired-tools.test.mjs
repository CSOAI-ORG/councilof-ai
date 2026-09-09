#!/usr/bin/env node
/**
 * Drive the shipped stdio server: tools/list must be exactly the names that
 * tools/call actually runs — the eight free tools and the four x402-metered ones.
 * A listed tool that does not run, or a running tool that is not listed, fails here.
 * Spawns index.mjs — not a reimplementation.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const FREE = [
  "board_totals",
  "get_axis",
  "verify_card",
  "list_cards",
  "get_root",
  "get_card",
  "verify_inclusion",
  "x402_trust",
];
const PAID = [
  "commission_card",
  "art50_marking_evidence",
  "rwa_evidence",
  "receipts_batch",
];
const ALL = [...FREE, ...PAID];

const routeReceipt = Buffer.from(
  JSON.stringify({
    extensions: {
      "offer-receipt": {
        info: { receipt: { format: "jws", signature: "eyJoIjoidCJ9.eyJwIjoidCJ9.c2ln" } },
      },
    },
  }),
).toString("base64url");
const receiptGap = Buffer.from(JSON.stringify({ settlement: { transaction: "test-only" } })).toString("base64url");

function answer(res, status, body, headers = {}) {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

// Keep the wired test deterministic and payment-free: it still spawns the shipped
// server, but all routes terminate at this local fixture rather than production.
const routeServer = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://fixture.invalid");
  const payment = req.headers["x-payment"];
  if (url.pathname === "/api/gspc") {
    return answer(res, 200, {
      measured_on: "2026-09-09",
      totals: { axes: 1, measured_axes: 1, unmeasured_axes: 0, public_count: "1 measured axis" },
      axes: [{ axis: "governance", family: "governance", status: "MEASURED", n: 1 }],
    });
  }
  if (url.pathname === "/signed/card_index.json") return answer(res, 200, { n_cards: 0, cards: [] });
  if (url.pathname === "/api/cards") return answer(res, 200, { cards: { count: 0, signed: 0 } });
  if (url.pathname === "/root.json") return answer(res, 200, { kind: "public-root", card_count: 0, merkle_root: "0".repeat(64) });
  if (url.pathname === "/interop/x402-trust/latest.json") {
    return answer(res, 200, { kind: "x402-trust", counts: { payable: 1 }, headline: "fixture measurement" });
  }
  if (url.pathname === "/api/request-attestation") {
    return answer(
      res,
      402,
      { accepts: [{ scheme: "exact", network: "eip155:8453", payTo: "0xpay" }] },
      { "payment-required": "test-only-challenge" },
    );
  }
  if (url.pathname === "/api/receipts/batch") {
    if (!payment) return answer(res, 200, { kind: "preview", rows: [] });
    const headers =
      payment === "test-no-receipt"
        ? {}
        : { "x-payment-response": payment === "test-receipt-gap" ? receiptGap : routeReceipt };
    return answer(res, 200, { kind: "deliverable", rows: [] }, headers);
  }
  if (url.pathname === "/api/rwa/evidence" && url.searchParams.get("asset") === "ERR") {
    return answer(res, 500, { error: "fixture route failure" });
  }
  if (url.pathname === "/api/rwa/evidence" && url.searchParams.get("asset") === "RESET") {
    req.socket.destroy();
    return;
  }
  return answer(res, 404, { error: "not_found" });
});
await new Promise((resolve) => routeServer.listen(0, "127.0.0.1", resolve));
const routeAddress = routeServer.address();
if (!routeAddress || typeof routeAddress === "string") throw new Error("fixture server did not bind TCP");
const fixtureOrigin = `http://127.0.0.1:${routeAddress.port}`;

const server = spawn(process.execPath, [fileURLToPath(new URL("./index.mjs", import.meta.url))], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, GSPC_ORIGIN: fixtureOrigin },
});
const pending = new Map();
createInterface({ input: server.stdout }).on("line", (l) => {
  if (!l.trim()) return;
  const msg = JSON.parse(l);
  const p = pending.get(msg.id);
  if (p) {
    pending.delete(msg.id);
    p(msg);
  }
});
let nextId = 1;
function rpc(method, params) {
  const id = nextId++;
  server.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) }) + "\n");
  return new Promise((res) => pending.set(id, res));
}

let failed = 0;
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failed += 1;
}

await rpc("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "wired-tools", version: "0" } });
const list = await rpc("tools/list");
const names = (list.result?.tools || []).map((t) => t.name);
check(`tools/list length ${ALL.length}`, names.length === ALL.length);
check("tools/list names", names.join(",") === ALL.join(","));

// Every advertised free tool must have a handler. Use deliberately small
// arguments; schema failures are valid tool results, JSON-RPC unknown-tool
// errors are not. This closes the gap where x402_trust was listed but absent
// from HANDLERS.
const freeCalls = {
  board_totals: {},
  get_axis: { axis: "governance" },
  verify_card: {},
  list_cards: { limit: 0 },
  get_root: {},
  get_card: { sha256: "bad" },
  verify_inclusion: { sha256: "bad" },
  x402_trust: {},
};
const freeResults = new Map();
for (const name of FREE) {
  const r = await rpc("tools/call", { name, arguments: freeCalls[name] });
  freeResults.set(name, r);
  check(`${name} has a callable handler`, !r.error && Boolean(r.result?.structuredContent));
}

const root = freeResults.get("get_root");
check("get_root VALID", root.result?.structuredContent?.state === "VALID");

const trust = freeResults.get("x402_trust")?.result?.structuredContent;
check(
  "x402_trust delegates to the canonical measured snapshot",
  trust?.state === "VALID" &&
    trust?.source === `${fixtureOrigin}/interop/x402-trust/latest.json` &&
    trust?.counts && typeof trust.counts === "object" &&
    typeof trust?.headline === "string" && trust.headline.length > 0 &&
    trust?.not_a_certification === true,
);

const unknown = await rpc("tools/call", { name: "not_a_tool", arguments: {} });
check("unknown tool still errors", Boolean(unknown.error));

// Every paid tool must be wired: reachable, argument-checked, and never a fabricated result.
for (const name of PAID) {
  const r = await rpc("tools/call", { name, arguments: {} });
  const status = r.result?.structuredContent?.status;
  check(
    `${name} wired (not unknown-tool)`,
    !r.error && ["BAD_ARGUMENTS", "PAYMENT_REQUIRED", "NOT_DEPLOYED", "UNREACHABLE", "DELIVERED"].includes(status),
    `status=${status}`,
  );
}

// The free preview path must cost nothing and still answer.
const preview = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", preview: true },
});
const ps = preview.result?.structuredContent?.status;
check("receipts_batch preview is free and answers", ["DELIVERED", "PAYMENT_REQUIRED", "UNREACHABLE"].includes(ps), `status=${ps}`);
check(
  "preview is delivered without implying settlement",
  preview.result?.structuredContent?.delivery_kind === "PREVIEW_OR_FREE" &&
    preview.result?.structuredContent?.settlement_state === "NOT_REQUESTED" &&
    preview.result?.structuredContent?.receipt_state === "NOT_REQUESTED",
);

// An unpaid call to a metered tool is a challenge, not a charge and not a result.
const challenge = await rpc("tools/call", { name: "commission_card", arguments: { subject: "gspc-contract-check" } });
const cs = challenge.result?.structuredContent;
check(
  "unpaid metered call returns a challenge, never a deliverable",
  cs?.status === "PAYMENT_REQUIRED" &&
    cs?.delivery_state === "NOT_DELIVERED" &&
    cs?.settlement_state === "NOT_REQUESTED" &&
    cs?.nothing_charged === true,
  `status=${cs?.status}`,
);

const repeatedToken = "test-repeat-authorization";
const repeated = await rpc("tools/call", {
  name: "commission_card",
  arguments: { subject: "gspc-contract-check", x_payment: repeatedToken },
});
const rs = repeated.result?.structuredContent;
check(
  "a repeated 402 leaves settlement unconfirmed and does not echo authorization",
  rs?.status === "PAYMENT_REQUIRED" &&
    rs?.payment_presented === true &&
    rs?.settlement_state === "UNCONFIRMED" &&
    rs?.nothing_charged === undefined &&
    !JSON.stringify(repeated).includes(repeatedToken),
);

const paid = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", x_payment: "test-route-receipt" },
});
const paidState = paid.result?.structuredContent;
check(
  "paid delivery reports a route receipt without claiming verification",
  paidState?.status === "DELIVERED" &&
    paidState?.delivery_kind === "DELIVERED_WITH_ROUTE_RECEIPT" &&
    paidState?.settlement_state === "REPORTED_BY_ROUTE" &&
    paidState?.receipt_state === "PRESENT_UNVERIFIED" &&
    paidState?.body?.kind === "deliverable" &&
    paidState?.deliverable?.kind === "deliverable",
);

const noReceipt = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", x_payment: "test-no-receipt" },
});
check(
  "delivery without a settlement header stays unconfirmed",
  noReceipt.result?.structuredContent?.delivery_kind === "DELIVERED_SETTLEMENT_UNCONFIRMED" &&
    noReceipt.result?.structuredContent?.settlement_state === "UNCONFIRMED" &&
    noReceipt.result?.structuredContent?.receipt_state === "ABSENT",
);

const gap = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", x_payment: "test-receipt-gap" },
});
check(
  "a settlement echo without a receipt is an explicit receipt gap",
  gap.result?.structuredContent?.delivery_kind === "DELIVERED_RECEIPT_GAP" &&
    gap.result?.structuredContent?.settlement_state === "REPORTED_BY_ROUTE" &&
    gap.result?.structuredContent?.receipt_state === "MISSING",
);

const missingRouteToken = "test-missing-route-authorization";
const missingRoute = await rpc("tools/call", {
  name: "rwa_evidence",
  arguments: { asset: "RLUSD", x_payment: missingRouteToken },
});
check(
  "404 after authorization never claims nothing was charged",
  missingRoute.result?.structuredContent?.status === "NOT_DEPLOYED" &&
    missingRoute.result?.structuredContent?.settlement_state === "UNCONFIRMED" &&
    missingRoute.result?.structuredContent?.nothing_charged === undefined &&
    !JSON.stringify(missingRoute).includes(missingRouteToken),
);

const errorToken = "test-error-authorization";
const routeError = await rpc("tools/call", {
  name: "rwa_evidence",
  arguments: { asset: "ERR", x_payment: errorToken },
});
check(
  "generic route error preserves unknown settlement and no authorization echo",
  routeError.result?.structuredContent?.status === "HTTP_500" &&
    routeError.result?.structuredContent?.delivery_state === "NOT_DELIVERED" &&
    routeError.result?.structuredContent?.settlement_state === "UNCONFIRMED" &&
    !JSON.stringify(routeError).includes(errorToken),
);

const transportToken = "test-transport-authorization";
const transportError = await rpc("tools/call", {
  name: "rwa_evidence",
  arguments: { asset: "RESET", x_payment: transportToken },
});
check(
  "post-authorization transport failure makes delivery unknown and settlement unconfirmed",
  transportError.result?.structuredContent?.status === "UNREACHABLE" &&
    transportError.result?.structuredContent?.delivery_state === "UNKNOWN" &&
    transportError.result?.structuredContent?.settlement_state === "UNCONFIRMED" &&
    !JSON.stringify(transportError).includes(transportToken),
);

const childClosed = new Promise((resolve) => server.once("close", resolve));
server.stdin.end();
await childClosed;
await new Promise((resolve, reject) => routeServer.close((error) => (error ? reject(error) : resolve())));
process.exitCode = failed ? 1 : 0;
