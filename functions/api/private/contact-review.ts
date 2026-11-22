/**
 * GET /api/private/contact-review — operator-only, read-only contact receipts.
 *
 * This is NOT a public lead feed or notification system. It fails closed unless
 * LEADS, Access issuer/AUD and a separate exact operator-email allowlist are
 * installed by the release owner. Returned personal data is never cached.
 */
import { authorizeContactOperator, type ContactReviewEnv } from "../_contact-operator";
import type { JWTVerifyGetKey } from "jose";

const headers = {
  "cache-control": "private, no-store, max-age=0",
  "pragma": "no-cache",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow, noarchive",
  "content-security-policy": "default-src 'none'",
  "vary": "Cf-Access-Jwt-Assertion",
};
const reply = (json: unknown, status = 200) => Response.json(json, { status, headers });

const KEY_PATTERN = /^contact:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIMIT = 15;

type StoredContact = {
  kind: "contact"; id: string; at: string; name: string;
  email: string; subject: string; message: string;
  notification_state: string; source: string;
};
function recordFromKV(value: string): StoredContact | null {
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const r = data as Record<string, unknown>;
    if (r.kind !== "contact") return null;
    for (const key of ["id", "at", "name", "email", "subject", "message", "notification_state", "source"]) {
      if (typeof r[key] !== "string") return null;
    }
    // Whitelist only defined fields — never echo arbitrary stored extras.
    return {
      kind: "contact", id: r.id as string, at: r.at as string,
      name: r.name as string, email: r.email as string,
      subject: r.subject as string, message: r.message as string,
      notification_state: r.notification_state as string, source: r.source as string,
    };
  } catch { return null; }
}

export async function readContactReview(
  request: Request,
  env: ContactReviewEnv,
  overrideKeySet?: JWTVerifyGetKey,
): Promise<Response> {
  const auth = await authorizeContactOperator(request, env, overrideKeySet);
  if (auth.ok === false) return reply({ state: "UNAVAILABLE_OR_UNAUTHORIZED" }, auth.status);
  const kv = env.LEADS;
  if (!kv) return reply({ state: "UNAVAILABLE_OR_UNAUTHORIZED" }, 503);

  const params = new URL(request.url).searchParams;
  if ([...params.keys()].some(k => k !== "key" && k !== "cursor") ||
      (params.has("key") && params.has("cursor")) ||
      params.getAll("key").length > 1 || params.getAll("cursor").length > 1)
    return reply({ state: "BAD_QUERY" }, 400);

  const key = params.get("key");
  try {
    if (key !== null) {
      if (!KEY_PATTERN.test(key)) return reply({ state: "BAD_KEY" }, 400);
      const raw = await kv.get(key);
      if (raw === null) return reply({ state: "NOT_FOUND" }, 404);
      const record = recordFromKV(raw);
      if (!record || key !== "contact:" + record.at + ":" + record.id)
        return reply({ state: "UNREADABLE_RECORD" }, 422);
      return reply({ state: "READ", key, record, retrieved: true });
    }
    const cursor = params.get("cursor") ?? undefined;
    if (cursor && (cursor.length > 1024 || !/^[A-Za-z0-9_+=/.-]+$/.test(cursor)))
      return reply({ state: "BAD_CURSOR" }, 400);
    const page = await kv.list({ prefix: "contact:", limit: LIMIT, ...(cursor ? { cursor } : {}) });
    // Names are opaque pointers for an authenticated operator; not proof the
    // associated records are readable. Do not turn missing keys into zero leads.
    const keys = page.keys.map(k => k.name).filter(k => KEY_PATTERN.test(k));
    return reply({
      state: "KEYS_ONLY", records_read: false, keys,
      cursor: !page.list_complete && "cursor" in page && typeof page.cursor === "string" ? page.cursor : null,
      count_this_page: keys.length,
    });
  } catch {
    return reply({ state: "STORAGE_UNCONFIRMED" }, 503);
  }
}
export const onRequestGet: PagesFunction<ContactReviewEnv> = async ({ request, env }) =>
  readContactReview(request, env);
