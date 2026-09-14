/**
 * GET /api/commissions — the open commission queue, read from the same store that holds the
 * settlements (REVENUE_KV, `ras:<receipt sha>` records written by /api/request-attestation).
 *
 * This is the bridge between a paid request and the mill: the hub-queue mill reads this list
 * at the start of every run and grades commissioned subjects first. Nothing here is a score.
 * A commission names a subject; whether that subject can be measured depends on whether any
 * provider serves it — the mill records the skip reason when it cannot.
 *
 * Aggregate, public facts only: subject, optional axis, the settlement tx (already public on
 * chain), the receipt sha, when. No payer address, no amounts. `null` when no store is bound —
 * never an empty list pretending to be a measured zero.
 */
type Env = { REVENUE_KV?: KVNamespace };

type Commission = { subject: string; axis: string | null; tx: string | null; as_of: string | null; receipt_sha: string };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=60", "access-control-allow-origin": "*" },
  });

export async function listCommissions(kv: KVNamespace): Promise<{ commissions: Commission[]; unreadable: number }> {
  const out: Commission[] = [];
  let unreadable = 0;
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "ras:", cursor, limit: 1000 });
    for (const k of page.keys) {
      const raw = await kv.get(k.name);
      if (!raw) { unreadable++; continue; }
      try {
        const r = JSON.parse(raw) as { subject?: unknown; axis?: unknown; tx?: unknown; as_of?: unknown };
        const subject = typeof r.subject === "string" ? r.subject.trim() : "";
        if (!subject) { unreadable++; continue; }
        out.push({
          subject,
          axis: typeof r.axis === "string" && r.axis ? r.axis : null,
          tx: typeof r.tx === "string" && r.tx ? r.tx : null,
          as_of: typeof r.as_of === "string" ? r.as_of : null,
          receipt_sha: k.name.slice("ras:".length),
        });
      } catch { unreadable++; }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  out.sort((a, b) => String(a.as_of ?? "").localeCompare(String(b.as_of ?? "")));
  return { commissions: out, unreadable };
}

export async function buildCommissions(env: Env) {
  const base = {
    schema: "csoai.commissions/0.1",
    endpoint: "/api/commissions",
    what: "Subjects that a paid request-attestation commissioned. The hub-queue mill grades them first. A commission is a request, never a result.",
    source: "REVENUE_KV ras:* records (written by /api/request-attestation on a facilitator-settled request)",
  };
  if (!env.REVENUE_KV) {
    return { ...base, status: "UNMEASURED", commissions: null, subjects: null, note: "no store bound — the list is null, not empty" };
  }
  try {
    const { commissions, unreadable } = await listCommissions(env.REVENUE_KV);
    const subjects = [...new Set(commissions.map((c) => c.subject))];
    return { ...base, status: "MEASURED", as_of: new Date().toISOString(), count: commissions.length, subjects, commissions, records_unreadable: unreadable };
  } catch (e) {
    return { ...base, status: "UNMEASURED", commissions: null, subjects: null, note: `REVENUE_KV read failed (${(e as Error).message}) — null, never substituted` };
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json(await buildCommissions(env));
