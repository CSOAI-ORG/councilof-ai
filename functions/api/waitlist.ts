/**
 * @openapi-unavailable
 * POST /api/waitlist — join the waitlist for a product that is not on sale yet (RAS booking
 * desk first). The entry is proposed into the Busabase `waitlist` base for review; nothing is
 * sold, priced, charged or issued, and no price is shown. GET describes the door.
 *
 * Body: { "email": "...", "product": "ras-booking", "note"?: "..." }
 * DOOR_CLOSED (503) until the operator sets BUSABASE_INTAKE_URL.
 */
import { intakeConfigured, proposeRecord, sha256Hex, json, type IntakeEnv } from "../_lib/busabaseIntake";

const SCHEMA = "csoai.waitlist/0.1";
const PRODUCTS = new Set(["ras-booking", "claimguard", "meok"]);
const EMAIL = /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,24}$/i;

const closed = () =>
  json(503, {
    schema: SCHEMA, status: "UNAVAILABLE", code: "DOOR_CLOSED", endpoint: "/api/waitlist",
    message: "The waitlist is not open yet. Nothing was stored.",
  });

export const onRequestGet: PagesFunction<IntakeEnv> = async ({ env }) =>
  intakeConfigured(env)
    ? json(200, { schema: SCHEMA, endpoint: "/api/waitlist", method: "POST", products: [...PRODUCTS],
        body: { email: "string", product: "string", note: "string (optional)" },
        note: "Joining the waitlist is free and commits you to nothing. No price is shown here." })
    : closed();

export const onRequestPost: PagesFunction<IntakeEnv> = async ({ env, request }) => {
  if (!intakeConfigured(env)) return closed();
  let b: { email?: unknown; product?: unknown; note?: unknown };
  try { b = await request.json(); } catch { return json(400, { schema: SCHEMA, code: "BAD_JSON" }); }
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const product = typeof b.product === "string" ? b.product : "ras-booking";
  if (!EMAIL.test(email)) return json(400, { schema: SCHEMA, code: "BAD_EMAIL" });
  if (!PRODUCTS.has(product)) return json(400, { schema: SCHEMA, code: "UNKNOWN_PRODUCT", products: [...PRODUCTS] });
  const note = typeof b.note === "string" ? b.note.slice(0, 500) : "";
  const key = "waitlist-" + (await sha256Hex(`${product}:${email}`)).slice(0, 24);
  const r = await proposeRecord(env, "waitlist",
    { email, product, note, joined_at: new Date().toISOString(), source: "councilof.ai/api/waitlist" },
    key, `waitlist: ${product}`);
  if (!r.ok) return json(502, { schema: SCHEMA, code: "INTAKE_UNAVAILABLE", message: "Not stored; please try again later." });
  return json(202, { schema: SCHEMA, status: "RECEIVED", product, message: "You're on the waitlist. We'll email you when it opens." });
};
