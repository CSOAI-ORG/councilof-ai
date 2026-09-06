/**
 * GET /feeds/receipts.xml — every settled receipt on this rail, as an Atom feed.
 *
 * WHY A FEED. A receipt is the only artefact here that proves money moved, and until now the only
 * way to see one was to read /api/revenue's counters — which are aggregates, and aggregates are
 * exactly where a number can be typed. This serves the RECORDS: one entry per settlement, each
 * carrying its transaction, so a reader checks the chain instead of trusting our arithmetic.
 *
 * DERIVED, NEVER TYPED. Entries come from the same REVENUE_KV `settled:tx:*` records /api/revenue
 * counts. Nothing is authored here. When the store is unbound the feed says so and serves zero
 * entries — an empty feed with a stated reason, never a fabricated one.
 *
 * A SELF-SETTLEMENT IS LABELLED AS ONE. Our own wallet paying our own door is a real receipt and a
 * real transaction, and it is not a buyer. Each entry says which it is, in the title, so a reader
 * skimming the feed cannot mistake our own money for demand.
 */
interface Env {
  REVENUE_KV?: KVNamespace;
}

type Rec = {
  payer?: string | null;
  self?: boolean;
  settled_at?: string;
  zero_value?: boolean;
  amount_atomic?: string | null;
  tx?: string | null;
  resource?: string | null;
};

const ORIGIN = "https://councilof.ai";
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function entry(name: string, r: Rec): string {
  const id = name.replace(/^settled:tx:/, "");
  const when = r.settled_at || "1970-01-01T00:00:00Z";
  const amount = r.amount_atomic && /^[1-9]\d*$/.test(r.amount_atomic)
    ? `${(Number(r.amount_atomic) / 1e6).toFixed(6)} USDC`
    : "0 (zero-value: recorded, never a purchase)";
  const kind = r.self ? "self-settlement — our own wallet, never revenue" : "settlement";
  const tx = r.tx || id;
  const link = `https://basescan.org/tx/${encodeURIComponent(tx)}`;
  const content = [
    `transaction ${tx}`,
    r.resource ? `resource ${r.resource}` : null,
    `payer ${r.payer ?? "unrecorded"}`,
    r.self
      ? "This is our own wallet paying our own door. It proves the rail settles; it is not a buyer and never counts as revenue."
      : "A wallet we do not control paid a non-zero amount.",
  ].filter(Boolean).join(" \u00b7 ");
  return [
    "  <entry>",
    `    <id>tag:councilof.ai,2026:receipt:${esc(id)}</id>`,
    `    <title>${esc(kind)} — ${esc(amount)}</title>`,
    `    <updated>${esc(when)}</updated>`,
    `    <link rel="alternate" href="${esc(link)}"/>`,
    `    <content type="text">${esc(content)}</content>`,
    "  </entry>",
  ].join("\n");
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const kv = ctx.env.REVENUE_KV;
  const now = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const head = [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    "  <title>Council of AI — settled receipts</title>",
    `  <id>tag:councilof.ai,2026:receipts</id>`,
    `  <updated>${now}</updated>`,
    `  <link rel="self" href="${ORIGIN}/feeds/receipts.xml"/>`,
    `  <link rel="alternate" href="${ORIGIN}/api/revenue"/>`,
    "  <subtitle>One entry per settled receipt, derived from the same records /api/revenue counts. " +
      "A self-settlement is labelled as one: our own wallet is not a buyer. Measurement, not certification.</subtitle>",
  ];

  if (!kv) {
    return new Response(
      [...head,
       "  <!-- REVENUE_KV is not bound on this deployment, so there are no records to serve. " +
       "This feed is empty for a stated reason, which is not the same as there being no receipts. -->",
       "</feed>"].join("\n"),
      { headers: { "content-type": "application/atom+xml; charset=utf-8", "cache-control": "public, max-age=300" } },
    );
  }

  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await kv.list({ prefix: "settled:tx:", cursor, limit: 1000 });
    for (const k of page.keys) keys.push(k.name);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && keys.length < 5000);

  const rows: Array<[string, Rec]> = [];
  for (const name of keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    try { rows.push([name, JSON.parse(raw) as Rec]); } catch { /* an unreadable record is not an entry */ }
  }
  rows.sort((a, b) => String(b[1].settled_at ?? "").localeCompare(String(a[1].settled_at ?? "")));

  const body = [...head, ...rows.slice(0, 200).map(([n, r]) => entry(n, r)), "</feed>"].join("\n");
  return new Response(body, {
    headers: {
      "content-type": "application/atom+xml; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-receipts-total": String(rows.length),
    },
  });
};
