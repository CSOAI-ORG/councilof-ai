/**
 * @openapi-unavailable
 * POST /api/booking-webhook — Paddle booking intake (SKELETON, disabled until Paddle KYC passes).
 *
 * Replaces nothing that issues anything: /api/paddle-webhook stays RETIRED. This door only
 *   1. verifies the Paddle-Signature header (ts=…;h1=HMAC-SHA256(secret, `${ts}:${rawBody}`)),
 *      rejecting stale timestamps, then
 *   2. proposes one record into the Busabase `bookings` base (autoMerge:false) for a human to
 *      act on. It never issues a certificate, entitlement or any credential.
 * Disabled (503 DOOR_CLOSED) unless BOOKING_WEBHOOK_ENABLED === "true" AND the webhook secret
 * AND BUSABASE_INTAKE_URL are all set. The operator flips it on only after KYC passes.
 */
import { intakeConfigured, proposeRecord, json, type IntakeEnv } from "../_lib/busabaseIntake";

interface Env extends IntakeEnv {
  BOOKING_WEBHOOK_ENABLED?: string;
  PADDLE_BOOKING_WEBHOOK_SECRET?: string;
}
const SCHEMA = "csoai.booking-intake/0.1";
const TOLERANCE_S = 300;
const ACCEPTED = new Set(["transaction.completed", "subscription.created"]);

const enabled = (env: Env) =>
  env.BOOKING_WEBHOOK_ENABLED === "true" && !!env.PADDLE_BOOKING_WEBHOOK_SECRET && intakeConfigured(env);

const closed = () =>
  json(503, { schema: SCHEMA, status: "UNAVAILABLE", code: "DOOR_CLOSED", endpoint: "/api/booking-webhook",
    message: "Booking intake is not enabled yet. Nothing was verified, stored or issued." });

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function verifyPaddleSignature(header: string | null, raw: string, secret: string, nowS: number): Promise<boolean> {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(";").map((p) => p.split("=", 2) as [string, string]));
  const ts = Number(parts.ts);
  const h1s = header.split(";").filter((p) => p.startsWith("h1=")).map((p) => p.slice(3).toLowerCase());
  if (!Number.isFinite(ts) || !h1s.length || Math.abs(nowS - ts) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${parts.ts}:${raw}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return h1s.some((h) => timingSafeEqualHex(h, hex));
}

export const onRequestGet: PagesFunction<Env> = async () => closed();

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!enabled(env)) return closed();
  const raw = await request.text();
  const ok = await verifyPaddleSignature(request.headers.get("paddle-signature"), raw, env.PADDLE_BOOKING_WEBHOOK_SECRET!, Math.floor(Date.now() / 1000));
  if (!ok) return json(401, { schema: SCHEMA, code: "BAD_SIGNATURE" });
  let ev: { event_id?: string; event_type?: string; data?: { id?: string; customer_id?: string; custom_data?: { product?: string } } };
  try { ev = JSON.parse(raw); } catch { return json(400, { schema: SCHEMA, code: "BAD_JSON" }); }
  if (!ev.event_type || !ACCEPTED.has(ev.event_type)) return json(200, { schema: SCHEMA, status: "IGNORED", event_type: ev.event_type ?? null });
  const id = ev.event_id || ev.data?.id || "";
  if (!id) return json(400, { schema: SCHEMA, code: "NO_EVENT_ID" });
  const r = await proposeRecord(env, "bookings", {
    paddle_event_id: id, paddle_event_type: ev.event_type, paddle_transaction_id: ev.data?.id ?? "",
    paddle_customer_id: ev.data?.customer_id ?? "", product: ev.data?.custom_data?.product ?? "ras-booking",
    state: "received", received_at: new Date().toISOString(),
  }, `booking-${id}`, `booking: ${ev.event_type}`);
  // Non-2xx makes Paddle retry, which is what we want if Busabase intake is briefly down.
  if (!r.ok) return json(502, { schema: SCHEMA, code: "INTAKE_UNAVAILABLE" });
  return json(200, { schema: SCHEMA, status: "RECORDED", event_id: id });
};
