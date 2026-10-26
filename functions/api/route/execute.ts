/**
 * POST /api/route/execute: GSPC Route execution (functions/_lib/route/execute.ts). GET describes the door.
 *
 * Nothing here logs: no console call, no KV, no D1, no R2. The request body is read once, capped, and never
 * written anywhere; the answer goes back to the caller with a receipt signed under
 * did:web:csoai.org#route-attestation-1 (the Pages secret ROUTE_SIGN_KEY_PKCS8_B64). No secret => 503, nothing
 * called.
 */
import { routeExecute, MAX_BODY_BYTES } from "../../_lib/route/execute";
import { routeSigner, ROUTE_KID } from "../../_lib/route/sign";
import { fetchOriginJson } from "../../mcp/_board";
import { CENSUS_PATH } from "../../_lib/route/census";
import { headFromGet } from "../_head";

type Env = { ROUTE_SIGN_KEY_PKCS8_B64?: string };

const HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type",
  "x-content-type-options": "nosniff",
};

const json = (status: number, body: unknown) => new Response(JSON.stringify(body, null, 2), { status, headers: HEADERS });

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204, headers: HEADERS });

export const onRequestGet: PagesFunction = async () =>
  json(200, {
    door: "POST /api/route/execute",
    what:
      "GSPC Route execution: the route decision (the caller's policy over published measurements, with the GSPC floor) " +
      "and then one call to the chosen MCP tool, with a receipt signed under " + ROUTE_KID + ".",
    phases: {
      "1_read_only": "The edge calls a tool itself only when it is verified read-only: a first-party tool annotated readOnlyHint, or a third-party tool the signed effect-binding probe listed read-only. A tool whose probe observed DIVERGENT (extra argument silently accepted) is refused unless policy.allow_divergent_effect_binding is true.",
      "2_credentials": "Caller credentials are client-side only. A request carrying anything shaped like a credential is refused (CREDENTIALS_REFUSED) and the value is not echoed, logged or stored. A target that needs one comes back as a CLIENT_SIDE plan.",
      "3_paid": "First-party paid tools: the edge calls without payment and must observe the x402 challenge (the door's own amount). It forwards payment.x_payment only when payment.challenge_sha256 confirms that challenge and policy.caller_wallet is true. The edge holds no wallet.",
      "4_actions": "A first-party tool that is not read-only runs only with confirm_action: true. A third-party tool that is not verified read-only is never called by the edge: CLIENT_SIDE, per-call confirm.",
    },
    body: {
      task: "string (hashed, never stored) or task_sha256",
      candidates: "[{ id, kind: 'mcp_tool', provider, endpoint, tool, ... }] (route's candidate grammar plus `tool`)",
      policy: "route's caller policy (presets, forbid_providers, allow_kinds, confirm_destructive, caller_wallet, allow_divergent_effect_binding)",
      call: "{ arguments: {...} } for the chosen tool",
      payment: "{ x_payment, challenge_sha256 } (phase 3 only)",
      confirm_action: "true (phase 4, first-party non-read-only only)",
    },
    census: CENSUS_PATH,
    did: "https://csoai.org/.well-known/did.json",
    not: "Not a ranking, a grade or a certification. The receipt says who signed which bytes; nothing about the quality of the target's answer.",
  });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const len = Number(request.headers.get("content-length") ?? "0");
  if (len > MAX_BODY_BYTES) return json(413, { state: "BAD_ARGUMENTS", errors: [`body larger than ${MAX_BODY_BYTES} bytes`] });
  const buf = await request.arrayBuffer();
  if (buf.byteLength > MAX_BODY_BYTES) return json(413, { state: "BAD_ARGUMENTS", errors: [`body larger than ${MAX_BODY_BYTES} bytes`] });
  let args: unknown;
  try {
    args = JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return json(400, { state: "BAD_ARGUMENTS", errors: ["body is not JSON"] });
  }
  if (!args || typeof args !== "object" || Array.isArray(args)) return json(400, { state: "BAD_ARGUMENTS", errors: ["body must be a JSON object"] });
  const origin = new URL(request.url).origin;
  const r = await routeExecute(args as Record<string, unknown>, {
    fetchBoard: () => fetchOriginJson(origin, "/api/gspc"),
    fetchCensus: () => fetchOriginJson(origin, CENSUS_PATH),
    fetchTarget: (url, init) => fetch(url, init),
    signer: await routeSigner(env.ROUTE_SIGN_KEY_PKCS8_B64),
    origin,
  });
  return json(r.http_status, r.body);
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
