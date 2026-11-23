#!/usr/bin/env node
/**
 * Drive the shipped stdio server: tools/list must be exactly the names that
 * tools/call actually runs — every free tool and every x402-metered one.
 * A listed tool that does not run, or a running tool that is not listed, fails here.
 * Spawns index.mjs — not a reimplementation.
 *
 * THE EXPECTED LIST IS DERIVED, NOT TYPED. This file used to carry its own
 * hardcoded copy of the names (fourteen free and five metered, when the fleet
 * was nineteen). When the 33 named axis tools joined, the copy went stale and
 * the npm release failed at "Verify package and live contract" — a release gate
 * blocked on a list nobody maintained. The names now come from the two
 * manifests the server itself reads, in the same order index.mjs builds TOOLS
 * from. What still survives is the assertion worth having: the tools the server
 * serves are exactly the tools the published manifests declare, in the published
 * order. A tool declared and not served, or served and not declared, or served
 * twice, still fails here.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const here = fileURLToPath(new URL(".", import.meta.url));
const readManifest = (name) => {
  try {
    return JSON.parse(readFileSync(resolve(here, name), "utf8")).tools.map((t) => t.name);
  } catch {
    return null;
  }
};
const FREE = readManifest("gspc-tools.json");
const PAID = readManifest("paid-tools.json");
if (!FREE || !PAID) {
  console.log("FAIL  the tool manifests are not readable — cannot derive the canonical tool list");
  process.exit(1);
}
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
// Every request the fixture origin received: what a tool call did and did not send upstream.
const seen = [];
// The route reads X-PAYMENT with atob then JSON.parse and no UTF-8 step (functions/api/_x402.ts).
const routeDecodes = (header) => {
  try {
    const decoded = JSON.parse(Buffer.from(String(header), "base64").toString("latin1"));
    return decoded && typeof decoded === "object" ? decoded : null;
  } catch {
    return null;
  }
};

const routeServer = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://fixture.invalid");
  const header = req.headers["x-payment"];
  seen.push({ path: url.pathname, search: url.searchParams, header });
  // A PaymentPayload sent in _meta arrives as base64 JSON; its payload.test names the fixture case
  // the opaque x_payment tokens name directly.
  const payment = routeDecodes(header)?.payload?.test ?? header;
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
  if (url.pathname === "/interop/mcp-trust/latest.json") {
    return answer(res, 200, { kind: "mcp-trust", counts: { total: 13 }, headline: "fixture mcp measurement", not_a_certification: true });
  }
  if (url.pathname === "/mcp" && req.method === "POST") {
    // The measurement-capsule readers forward to the door; this fixture door answers like the real one.
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const m = JSON.parse(body);
      const name = m.params?.name;
      if (name === "route" && m.params?.arguments?.data_class === "secret") {
        // The SDK refuses arguments outside a tool's input schema with text only and isError.
        return answer(res, 200, {
          jsonrpc: "2.0",
          id: m.id,
          result: { content: [{ type: "text", text: "Input validation error: data_class must be one of the listed classes" }], isError: true },
        });
      }
      const sc =
        name === "server_evidence"
          ? { state: "NOT_MEASURED", doctrine: "measurement, not endorsement", capsules: [], n_capsules: 0 }
          : name === "verify_capsule"
            ? { state: "UNCHECKABLE", doctrine: "measurement, not endorsement", reason: "fixture" }
            : name === "framework_readiness"
              ? { state: "OK", framework: m.params?.arguments?.framework ?? null, header: "fixture — a readiness checklist; it does not certify compliance", not_a_certification: true, item_count: 6, items: [] }
              : { state: "PUBLISHED", doctrine: "measurement, not endorsement", n_batches: 0, batches: [] };
      answer(res, 200, { jsonrpc: "2.0", id: m.id, result: { content: [{ type: "text", text: "fixture" }], structuredContent: sc, isError: false } });
    });
    return;
  }
  if (url.pathname === "/api/request-attestation" && url.searchParams.get("subject") === "BAD") {
    return answer(res, 400, { schema: "csoai.request-attestation/0.1", error: "bad_request", reason: "subject: not a measurable subject" });
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
  if (url.pathname === "/api/rwa/evidence" && url.searchParams.get("asset") === "ZZZ") {
    // A deployed route's own 404 names its schema; it is "not found", not "not deployed".
    return answer(res, 404, { schema: "csoai.rwa-evidence/0.1", error: "not_found", reason: "asset ZZZ is not in the public reader" });
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
  mcp_trust: {},
  measurement_index: {},
  verify_capsule: { capsule_json: "{}" },
  server_evidence: { endpoint_url: "https://nobody.example/mcp" },
  // framework_readiness requires its framework; the smallest deterministic call
  framework_readiness: { framework: "cra" },
};
const freeResults = new Map();
for (const name of FREE) {
  // An axis tool takes no argument, and a free reader with no required argument
  // gets none here; {} is the honest empty argument object either way.
  const r = await rpc("tools/call", { name, arguments: freeCalls[name] ?? {} });
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

const mcpTrust = freeResults.get("mcp_trust")?.result?.structuredContent;
check(
  "mcp_trust delegates to the canonical measured snapshot",
  mcpTrust?.state === "VALID" &&
    mcpTrust?.source === `${fixtureOrigin}/interop/mcp-trust/latest.json` &&
    mcpTrust?.counts && typeof mcpTrust.counts === "object" &&
    typeof mcpTrust?.headline === "string" && mcpTrust.headline.length > 0 &&
    mcpTrust?.not_a_certification === true,
);

const evidence = freeResults.get("server_evidence")?.result?.structuredContent;
check(
  "server_evidence forwards to the door and keeps NOT_MEASURED (never 'clean')",
  evidence?.state === "NOT_MEASURED" && Array.isArray(evidence?.capsules) && evidence.capsules.length === 0 &&
    evidence?.answered_by === `${fixtureOrigin}/mcp`,
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
  arguments: { from: "2026-09-01T00:00:00Z", to: "2026-09-02T00:00:00Z", x_payment: "test-route-receipt" },
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
  arguments: { from: "2026-09-01T00:00:00Z", to: "2026-09-02T00:00:00Z", x_payment: "test-no-receipt" },
});
check(
  "delivery without a settlement header stays unconfirmed",
  noReceipt.result?.structuredContent?.delivery_kind === "DELIVERED_SETTLEMENT_UNCONFIRMED" &&
    noReceipt.result?.structuredContent?.settlement_state === "UNCONFIRMED" &&
    noReceipt.result?.structuredContent?.receipt_state === "ABSENT",
);

const gap = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", to: "2026-09-02T00:00:00Z", x_payment: "test-receipt-gap" },
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

// A call that delivered nothing is a failed call, as on the HTTP door; NOT_DEPLOYED stays a state there too.
check("a delivered paid result is not an error", paid.result?.isError === false);
check("a missing route (NOT_DEPLOYED) stays a state, not an error", missingRoute.result?.isError === false);
check("a 500 after authorization is an error", routeError.result?.isError === true);

const ownNotFound = await rpc("tools/call", { name: "rwa_evidence", arguments: { asset: "ZZZ", preview: true } });
const onf = ownNotFound.result?.structuredContent;
check(
  "a deployed route's own 404 is HTTP_404 with its reason, not NOT_DEPLOYED, and an error",
  onf?.status === "HTTP_404" && onf?.reason === "asset ZZZ is not in the public reader" && ownNotFound.result?.isError === true,
  `status=${onf?.status}`,
);

const refusedToken = "test-refused-authorization";
const refused = await rpc("tools/call", { name: "commission_card", arguments: { subject: "BAD", x_payment: refusedToken } });
check(
  "a 4xx refusal is an error that says the route reported no settlement",
  refused.result?.structuredContent?.status === "HTTP_400" &&
    refused.result?.isError === true &&
    /refused the request and reported no settlement/.test(refused.result?.structuredContent?.note || "") &&
    !JSON.stringify(refused).includes(refusedToken),
  `status=${refused.result?.structuredContent?.status}`,
);

const previewPaid = await rpc("tools/call", {
  name: "rwa_evidence",
  arguments: { asset: "RLUSD", preview: true, x_payment: "test-preview-authorization" },
});
check(
  "preview with x_payment is refused before any request",
  previewPaid.result?.structuredContent?.status === "BAD_ARGUMENTS" && previewPaid.result?.isError === true,
);

const noTo = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: "2026-09-01T00:00:00Z", x_payment: "test-route-receipt" },
});
check(
  "a paid receipts_batch without to is refused before any request",
  noTo.result?.structuredContent?.status === "BAD_ARGUMENTS" &&
    /to is required when paying/.test(noTo.result?.structuredContent?.reason || ""),
);

const purchase = await rpc("tools/call", { name: "commission_card", arguments: { purchase_action: "history" } });
check(
  "purchase actions on stdio say they need the signed-in HTTP door, not that a subject is missing",
  purchase.result?.structuredContent?.status === "BAD_ARGUMENTS" &&
    /signed-in buyer/.test(purchase.result?.structuredContent?.reason || ""),
);

const doorRefusal = await rpc("tools/call", { name: "route", arguments: { data_class: "secret" } });
check(
  "a door that refuses the arguments is a tool error in the door's words, not UNREACHABLE",
  doorRefusal.result?.isError === true &&
    /Input validation error/.test(doorRefusal.result?.content?.[0]?.text || "") &&
    !/UNREACHABLE/.test(JSON.stringify(doorRefusal)),
);

// The x402 MCP transport's own channel (specs/transports-v2/mcp.md): the PaymentPayload object in
// params._meta["x402/payment"], and the settlement in the result's _meta["x402/payment-response"].
// Until this change the server read only the x_payment argument, so a spec client that retried a
// challenged call was challenged again every time.
const WINDOW = { from: "2026-09-01T00:00:00Z", to: "2026-09-02T00:00:00Z" };
const metaPayload = (test, extra = {}) => ({
  x402Version: 2,
  resource: { url: `${fixtureOrigin}/api/receipts/batch?from=${encodeURIComponent(WINDOW.from)}&to=${encodeURIComponent(WINDOW.to)}`, description: "reçus — 測定" },
  payload: { test, signature: "0xmeta-signature-must-not-be-echoed" },
  ...extra,
});
const lastSeen = () => seen[seen.length - 1];

const metaPaid = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { ...WINDOW },
  _meta: { "x402/payment": metaPayload("test-route-receipt") },
});
check(
  "a _meta payment reaches the route as X-PAYMENT, byte for byte under the route's decoder",
  lastSeen().path === "/api/receipts/batch" &&
    /^[\x20-\x7e]+$/.test(Buffer.from(String(lastSeen().header), "base64").toString("latin1")) &&
    JSON.stringify(routeDecodes(lastSeen().header)) === JSON.stringify(metaPayload("test-route-receipt")),
);
check(
  "a _meta payment delivers, and the settlement the route reported is in the result's _meta",
  metaPaid.result?.isError === false &&
    metaPaid.result?.structuredContent?.status === "DELIVERED" &&
    metaPaid.result?.structuredContent?.payment_presented === true &&
    metaPaid.result?.structuredContent?.delivery_kind === "DELIVERED_WITH_ROUTE_RECEIPT" &&
    typeof metaPaid.result?._meta?.["x402/payment-response"]?.extensions?.["offer-receipt"] === "object" &&
    !JSON.stringify(metaPaid).includes("0xmeta-signature-must-not-be-echoed"),
);
check(
  "an x_payment delivery carries the same settlement in _meta, and an unpaid or unsettled one carries none",
  typeof paid.result?._meta?.["x402/payment-response"] === "object" &&
    noReceipt.result?._meta === undefined &&
    challenge.result?._meta === undefined,
);

const metaNoTo = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: WINDOW.from },
  _meta: { "x402/payment": metaPayload("test-route-receipt") },
});
check(
  "receipts_batch: a _meta payment without `to` buys the window its payload's resource names",
  metaNoTo.result?.structuredContent?.status === "DELIVERED" &&
    lastSeen().search.get("from") === WINDOW.from &&
    lastSeen().search.get("to") === WINDOW.to,
);

let before = seen.length;
const metaElsewhere = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { from: WINDOW.from },
  _meta: { "x402/payment": metaPayload("test-route-receipt", { resource: { url: `https://example.com/api/receipts/batch?from=${encodeURIComponent(WINDOW.from)}&to=${encodeURIComponent(WINDOW.to)}` } }) },
});
check(
  "receipts_batch: a payload naming another origin supplies no `to`, and nothing is requested",
  metaElsewhere.result?.isError === true &&
    metaElsewhere.result?.structuredContent?.status === "BAD_ARGUMENTS" &&
    seen.length === before,
);

before = seen.length;
const metaTwice = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { ...WINDOW, x_payment: "test-route-receipt" },
  _meta: { "x402/payment": metaPayload("test-route-receipt") },
});
const metaNotObject = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { ...WINDOW },
  _meta: { "x402/payment": "eyJ4NDAyVmVyc2lvbiI6Mn0=" },
});
const metaTooLarge = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { ...WINDOW },
  _meta: { "x402/payment": metaPayload("test-route-receipt", { padding: "x".repeat(17 * 1024) }) },
});
check(
  "payment in both channels, a non-object, or an oversized payload is refused before any request",
  [metaTwice, metaNotObject, metaTooLarge].every(
    (r) =>
      r.result?.isError === true &&
      r.result?.structuredContent?.status === "BAD_ARGUMENTS" &&
      r.result?.structuredContent?.payment_forwarded === false &&
      r.result?.structuredContent?.nothing_charged === true,
  ) &&
    /sent twice/.test(metaTwice.result?.structuredContent?.reason || "") &&
    /PaymentPayload object/.test(metaNotObject.result?.structuredContent?.reason || "") &&
    /exceeds/.test(metaTooLarge.result?.structuredContent?.reason || "") &&
    seen.length === before,
);

const metaRefused = await rpc("tools/call", {
  name: "commission_card",
  arguments: { subject: "gspc-contract-check" },
  _meta: { "x402/payment": metaPayload("test-refused") },
});
check(
  "a _meta payment the route answers 402 to is a challenge with settlement unconfirmed, and is not echoed",
  metaRefused.result?.isError === true &&
    metaRefused.result?.structuredContent?.status === "PAYMENT_REQUIRED" &&
    metaRefused.result?.structuredContent?.payment_presented === true &&
    metaRefused.result?.structuredContent?.settlement_state === "UNCONFIRMED" &&
    metaRefused.result?._meta === undefined &&
    typeof lastSeen().header === "string" &&
    !JSON.stringify(metaRefused).includes("0xmeta-signature-must-not-be-echoed"),
);

const metaNull = await rpc("tools/call", {
  name: "commission_card",
  arguments: { subject: "gspc-contract-check" },
  _meta: { "x402/payment": null },
});
check(
  "a null _meta payment is no payment: the challenge, nothing charged, no header sent",
  metaNull.result?.structuredContent?.status === "PAYMENT_REQUIRED" &&
    metaNull.result?.structuredContent?.payment_presented === false &&
    metaNull.result?.structuredContent?.nothing_charged === true &&
    lastSeen().header === undefined,
);

before = seen.length;
const freeWithMeta = await rpc("tools/call", {
  name: "board_totals",
  arguments: {},
  _meta: { "x402/payment": metaPayload("test-route-receipt") },
});
check(
  "a free tool never reads _meta payment: it answers as usual and sends no payment header",
  freeWithMeta.result?.isError !== true &&
    freeWithMeta.result?._meta === undefined &&
    seen.slice(before).every((r) => r.header === undefined),
);

const metaPreview = await rpc("tools/call", {
  name: "receipts_batch",
  arguments: { ...WINDOW, preview: true },
  _meta: { "x402/payment": metaPayload("test-route-receipt") },
});
check(
  "preview with a _meta payment is refused, as it is with x_payment",
  metaPreview.result?.isError === true && metaPreview.result?.structuredContent?.status === "BAD_ARGUMENTS",
);

const childClosed = new Promise((resolve) => server.once("close", resolve));
server.stdin.end();
await childClosed;
await new Promise((resolve, reject) => routeServer.close((error) => (error ? reject(error) : resolve())));
process.exitCode = failed ? 1 : 0;
