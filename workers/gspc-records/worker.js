// GSPC Layer 0 queue + read-only record API + MCP. No spend, no signing, read-only for the public.
const AXIS_LABEL = "UNMEASURED";
const BATCH = 200;
const now = () => new Date().toISOString();
const J = (o, s = 200) => new Response(JSON.stringify(o, null, 1), { status: s, headers: { "content-type": "application/json", "access-control-allow-origin": "*", "cache-control": "no-store" } });
const NOTE = "Measurement only. Every subject here is UNMEASURED unless a status says otherwise; no result is claimed.";

function pub(r) {
  if (!r) return null;
  return { key: r.subject_key || r.key, name: r.name, source: r.source, subject_class: r.subject_class,
    status: r.status || AXIS_LABEL, axes: JSON.parse(r.axes || "[]"), priority: r.priority,
    last_checked: r.last_checked || null, first_seen: r.first_seen || null, note: r.note || null };
}
async function searchRecords(env, q, limit = 20, status) {
  limit = Math.min(Math.max(+limit || 20, 1), 100);
  const like = `%${(q || "").slice(0, 100)}%`;
  const st = status ? " AND m.status=?3" : "";
  const args = status ? [like, limit, status] : [like, limit];
  const { results } = await env.DB.prepare(`SELECT m.*, t.name, t.first_seen FROM measurement_queue m JOIN tools t ON t.key=m.subject_key WHERE (t.name LIKE ?1 OR m.subject_key LIKE ?1)${st} ORDER BY m.priority LIMIT ?2`).bind(...args).all();
  return { count: results.length, records: results.map(pub), note: NOTE };
}
async function getRecord(env, key) {
  const r = await env.DB.prepare("SELECT m.*, t.name, t.first_seen FROM measurement_queue m JOIN tools t ON t.key=m.subject_key WHERE m.subject_key=?1").bind(key).first();
  return r ? { record: pub(r), note: NOTE } : { error: "not in records", key };
}
async function getReport(env, day) {
  const s = day ? await env.DB.prepare("SELECT * FROM daily_summary WHERE day=?1").bind(day).first()
               : await env.DB.prepare("SELECT * FROM daily_summary ORDER BY day DESC LIMIT 1").first();
  const by = (await env.DB.prepare("SELECT status, subject_class, count(*) n FROM measurement_queue GROUP BY 1,2").all()).results;
  return { summary: s || null, breakdown: by, note: NOTE };
}
const TOOLS = [
  { name: "search_records", description: "Search GSPC Layer 0 subject records (read-only). Unmeasured subjects are labelled UNMEASURED.", inputSchema: { type: "object", properties: { query: { type: "string" }, limit: { type: "integer" }, status: { type: "string" } }, required: ["query"] } },
  { name: "get_record", description: "Get one GSPC subject record by key (read-only).", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
  { name: "get_report", description: "Get the GSPC daily queue report (latest or a given YYYY-MM-DD).", inputSchema: { type: "object", properties: { day: { type: "string" } } } },
];
async function mcp(env, body) {
  const id = body.id ?? null, m = body.method;
  const ok = (result) => J({ jsonrpc: "2.0", id, result });
  if (m === "initialize") return ok({ protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "gspc-records", version: "0.1.0" } });
  if (m === "notifications/initialized") return new Response(null, { status: 202 });
  if (m === "tools/list") return ok({ tools: TOOLS });
  if (m === "tools/call") {
    const a = body.params?.arguments || {}, n = body.params?.name;
    let out;
    if (n === "search_records") out = await searchRecords(env, a.query, a.limit, a.status);
    else if (n === "get_record") out = await getRecord(env, a.key);
    else if (n === "get_report") out = await getReport(env, a.day);
    else return J({ jsonrpc: "2.0", id, error: { code: -32602, message: "unknown tool" } });
    return ok({ content: [{ type: "text", text: JSON.stringify(out) }] });
  }
  return J({ jsonrpc: "2.0", id, error: { code: -32601, message: "method not found" } });
}
// Advance: hand the next small batch to the existing measuring pipeline (HF mill pulls QUEUED_FOR_MILL).
// The Worker itself makes no paid calls; spend happens only in the mill under its own cap.
async function advance(env) {
  const cap = +(env.SPEND_CAP_USD || 91.6), floor = +(env.SPEND_STOP_LEFT_USD || 5);
  const spent = +((await env.DB.prepare("SELECT value FROM queue_kv WHERE key='spend_usd'").first())?.value || 0);
  if (env.MILL_HANDOFF !== "on") { await log(env, "advance", 0, "handoff off (MILL_HANDOFF!=on); no batch moved"); return; }
  if (cap - spent <= floor) { await log(env, "advance", 0, `stopped: $${(cap - spent).toFixed(2)} left <= $${floor}`); return; }
  const r = await env.DB.prepare(`UPDATE measurement_queue SET status='QUEUED_FOR_MILL', last_checked=?1, attempts=attempts+1 WHERE subject_key IN (SELECT subject_key FROM measurement_queue WHERE status='UNMEASURED' AND axes!='[]' ORDER BY priority, last_checked NULLS FIRST LIMIT ${BATCH})`).bind(now()).run();
  await log(env, "advance", r.meta.changes, "handed to mill");
}
async function log(env, kind, n, d) { await env.DB.prepare("INSERT INTO queue_runs(ts,kind,picked,detail) VALUES(?1,?2,?3,?4)").bind(now(), kind, n, d).run(); }
async function daily(env) {
  const day = now().slice(0, 10);
  const c = await env.DB.prepare(`SELECT count(*) t, sum(status='UNMEASURED') u, sum(status IN ('QUEUED_FOR_MILL','IN_PROGRESS')) p, sum(status='MEASURED') m FROM measurement_queue`).first();
  const adv = await env.DB.prepare("SELECT coalesce(sum(picked),0) n FROM queue_runs WHERE kind='advance' AND ts>=?1").bind(day).first();
  const sp = +((await env.DB.prepare("SELECT value FROM queue_kv WHERE key='spend_usd'").first())?.value || 0);
  await env.DB.prepare("INSERT OR REPLACE INTO daily_summary VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)").bind(day, now(), c.t, c.u, c.p, c.m, adv.n, sp, NOTE).run();
}
async function weeklyRefresh(env) {
  // Light source-count refresh: records upstream totals; full re-harvest stays in the Layer 0 loader.
  const out = {};
  try { const r = await fetch("https://registry.npmjs.org/-/v1/search?text=keywords:mcp&size=1"); out.npm_mcp_total = (await r.json()).total; } catch (e) { out.npm_err = String(e); }
  try { const r = await fetch("https://api.apis.guru/v2/metrics.json"); const m = await r.json(); out.apis_guru_numAPIs = m.numAPIs; } catch (e) { out.apis_err = String(e); }
  await log(env, "weekly_refresh", 0, JSON.stringify(out));
}
export default {
  async fetch(req, env) {
    const u = new URL(req.url), p = u.pathname;
    if (req.method === "POST" && p === "/mcp") return mcp(env, await req.json());
    if (p === "/" || p === "/health") return J({ service: "gspc-records", endpoints: ["/records/search?q=", "/records/:key", "/report", "/report/:day", "POST /mcp"], note: NOTE });
    if (p === "/records/search") return J(await searchRecords(env, u.searchParams.get("q"), u.searchParams.get("limit"), u.searchParams.get("status")));
    if (p.startsWith("/records/")) return J(await getRecord(env, decodeURIComponent(p.slice(9))));
    if (p === "/report") return J(await getReport(env));
    if (p.startsWith("/report/")) return J(await getReport(env, p.slice(8)));
    return J({ error: "not found" }, 404);
  },
  async scheduled(ev, env) {
    if (ev.cron === "*/15 * * * *") await advance(env);
    else if (ev.cron === "5 6 * * *") await daily(env);
    else if (ev.cron === "30 3 * * 1") await weeklyRefresh(env);
  },
};
