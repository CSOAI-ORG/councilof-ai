#!/usr/bin/env node
/**
 * axis-doors probe — which live door serves a RESULT for each axis on the board, today.
 *
 *   node scripts/axis-doors-probe.mjs                # writes public/interop/axis-doors-<as_of date>.json
 *   node scripts/axis-doors-probe.mjs --out <path>   # elsewhere
 *
 * The axis list is GET /api/gspc → axes[] (never typed). For every row it probes, once each, with a
 * browser user-agent: the row door (/api/gspc?axis=), the per-axis page (/axis/<id>.html), the Hub
 * bank page and its raw README (does the card link this row?), the evidence artifact on the edge
 * and on the public mirror, and the MCP get_axis tool over POST /mcp. It reads the x402 manifest, the
 * A2A agent card + one gspc-board SendMessage, the live llms.txt and the door-demand (PayAI) record
 * once, and asks of each whether it names the axis. HTTP codes are recorded as returned; a door that
 * did not answer is UNREACHABLE, never 0 and never absent.
 *
 * Analyst judgement (buyer, hook, gap) is merged from scripts/axis-doors/market-map-<date>.json and
 * labelled as such; it is input, not measurement. signed:false — this is a probe record, not a card.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = process.env.CSOAI_SITE || "https://councilof.ai";
const MIRROR = "https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36 csoai-axis-doors-probe/0.1";
const args = process.argv.slice(2);
const argv = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const AS_OF = new Date().toISOString();
const DAY = AS_OF.slice(0, 10);
const OUT = argv("--out") || path.join(REPO, "public", "interop", `axis-doors-${DAY}.json`);
const MAP = argv("--map") || path.join(REPO, "scripts", "axis-doors", `market-map-${DAY}.json`);

async function probe(url, init = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: "manual", ...init, headers: { "user-agent": UA, accept: "application/json, text/html;q=0.9, */*;q=0.8", ...(init.headers || {}) } });
    const text = await r.text();
    return { url, http: r.status, ms: Date.now() - t0, content_type: r.headers.get("content-type"), location: r.headers.get("location"), text };
  } catch (e) {
    return { url, http: null, state: "UNREACHABLE", error: String(e?.message || e), ms: Date.now() - t0, text: "" };
  }
}
const strip = (p) => { const { text, ...rest } = p; return rest; };
const names = (text, id) => typeof text === "string" && text.includes(id);
const abs = (u) => (typeof u === "string" && u.startsWith("/") ? `${SITE}${u}` : u);

async function mcp(method, params) {
  return probe(`${SITE}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}
const sseJson = (text) => {
  const m = text.match(/data: (\{[\s\S]*\})\s*$/m);
  try { return JSON.parse(m ? m[1] : text); } catch { return null; }
};

// ── once-per-run surfaces ───────────────────────────────────────────────────────────────────
const board = await probe(`${SITE}/api/gspc`);
if (board.http !== 200) throw new Error(`GET /api/gspc -> ${board.http ?? board.state}; nothing to derive an axis list from`);
const b = JSON.parse(board.text);
const axes = b.axes || [];
if (!axes.length) throw new Error("board carried no axes[]");

const x402 = await probe(`${SITE}/.well-known/x402.json`);
const x402Resources = x402.http === 200 ? (JSON.parse(x402.text).resources || []) : null;
const agent = await probe(`${SITE}/.well-known/agent.json`);
const agentSkills = agent.http === 200 ? (JSON.parse(agent.text).skills || []) : null;
const tools = await mcp("tools/list", {});
const toolList = tools.http === 200 ? (sseJson(tools.text)?.result?.tools || []) : null;
const getAxisTool = toolList?.find((t) => t.name === "get_axis") || null;
const llmsLive = await probe(`${SITE}/llms.txt`);
const llmsRepo = fs.existsSync(path.join(REPO, "public", "llms.txt")) ? fs.readFileSync(path.join(REPO, "public", "llms.txt"), "utf8") : "";
const a2a = await probe(`${SITE}/api/a2a`, {
  // SendMessage is the A2A 1.0 name, so the request declares 1.0. Without the header (= 0.3) the
  // door answers -32009 and the probe recorded that refusal as the A2A door's answer.
  method: "POST", headers: { "content-type": "application/json", "a2a-version": "1.0" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "SendMessage", params: { message: { messageId: `axis-doors-${Date.now()}`, role: "ROLE_USER", parts: [{ data: { skill: "gspc-board", input: {} } }] } } }),
});
// The latest door-demand record is what PayAI's bazaar reports about OUR doors; it lists doors, never axes.
const demandFiles = fs.readdirSync(path.join(REPO, "public", "interop")).filter((f) => /^door-demand-payai-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
const demandFile = demandFiles.at(-1) || null;
const demand = demandFile ? JSON.parse(fs.readFileSync(path.join(REPO, "public", "interop", demandFile), "utf8")) : null;
const demandText = demand ? JSON.stringify(demand) : "";
const map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, "utf8")) : { axes: {} };
for (const id of Object.keys(map.axes || {})) {
  if (!axes.some((a) => a.axis === id)) throw new Error(`market map names "${id}", which the live board does not carry`);
}

// ── per-axis probes ─────────────────────────────────────────────────────────────────────────
const rows = [];
for (const a of axes) {
  const id = a.axis;
  const row = await probe(`${SITE}/api/gspc?axis=${encodeURIComponent(id)}`);
  let rowAxes = null;
  try { rowAxes = row.http === 200 ? (JSON.parse(row.text).axes || []).map((r) => r.axis) : null; } catch { rowAxes = null; }
  // The builder writes /axis/<id>.html; the edge 308s that to the slashless path and serves it there.
  // Both are recorded: the redirect is the shape, the final answer is the door.
  const pageHtml = await probe(`${SITE}/axis/${id}.html`);
  const page = await probe(`${SITE}/axis/${id}`);
  const bank = a.dataset_url ? await probe(a.dataset_url) : null;
  const readme = a.dataset ? await probe(`https://huggingface.co/datasets/${a.dataset}/raw/main/README.md`) : null;
  const evidenceEdge = a.evidence_url ? await probe(abs(a.evidence_url)) : null;
  // Hub resolve answers with a redirect to its CDN; followed, because the bytes are the door.
  const evidenceMirror = a.evidence_url && evidenceEdge && evidenceEdge.http !== 200 ? await probe(`${MIRROR}/public${a.evidence_url}`, { redirect: "follow" }) : null;
  const call = await mcp("tools/call", { name: "get_axis", arguments: { axis: id } });
  const callJson = call.http === 200 ? sseJson(call.text) : null;
  const callState = callJson?.result?.structuredContent?.state ?? null;
  const m = map.axes?.[id] || null;

  const doors = {
    board_row: { ...strip(row), names_axis: rowAxes ? rowAxes.includes(id) : names(row.text, `"axis": "${id}"`), rows_returned: rowAxes ? rowAxes.length : null, kind: "free endpoint" },
    axis_page: { ...strip(page), names_axis: names(page.text, id), kind: "free page", html_alias: { url: pageHtml.url, http: pageHtml.http, location: pageHtml.location ?? null } },
    mcp_get_axis: { url: `${SITE}/mcp`, http: call.http, ms: call.ms, state: callState, names_axis: callJson ? names(JSON.stringify(callJson), `"axis": "${id}"`) || names(JSON.stringify(callJson), `"axis":"${id}"`) : false, kind: "free MCP tool" },
    hub_bank: bank ? { ...strip(bank), kind: "frozen bank (Hub)" } : { state: "NONE_ON_ROW", note: "the row carries no dataset; a server probe or fact run is not a bank" },
    hub_card_links_row: readme ? { url: readme.url, http: readme.http, links_board: names(readme.text, "councilof.ai/api/gspc"), links_this_row: names(readme.text, `api/gspc?axis=${id}`), names_axis: names(readme.text, id) } : null,
    evidence_edge: evidenceEdge ? { ...strip(evidenceEdge), kind: "run artifact (edge)" } : { state: "NONE_ON_ROW" },
    evidence_mirror: evidenceMirror ? { ...strip(evidenceMirror), kind: "run artifact (public mirror)" } : null,
  };
  const discoverable = {
    llms_txt_live_row_line: llmsLive.http === 200 ? names(llmsLive.text, `api/gspc?axis=${id}`) : "UNREACHABLE",
    llms_txt_branch_row_line: names(llmsRepo, `api/gspc?axis=${id}`),
    mcp_tool_description_covers_every_axis: getAxisTool ? /every axis the board carries/.test(getAxisTool.description || "") : "UNREACHABLE",
    a2a_skill_names_axis: a2a.http === 200 ? names(a2a.text, id) : `UNREACHABLE(${a2a.http ?? a2a.state})`,
    a2a_card_names_axis: agentSkills ? names(JSON.stringify(agentSkills), id) : "UNREACHABLE",
    x402_resource_names_axis: x402Resources ? x402Resources.some((r) => names(JSON.stringify(r), id)) : "UNREACHABLE",
    payai_demand_record_names_axis: demand ? names(demandText, id) : "NO_RECORD",
  };
  rows.push({
    axis: id, family: a.family ?? null, kind: a.kind ?? null, status: a.status ?? null, n: a.n ?? null, n_unit: a.n_unit ?? null,
    dataset: a.dataset ?? null, dataset_url: a.dataset_url ?? null, evidence_url: a.evidence_url ? abs(a.evidence_url) : null,
    run_attestation: a.run_attestation ?? null, public_leader_state: a.public_leader_state ?? null,
    doors, discoverable,
    market: m ? { source: `${path.relative(REPO, MAP)} (${map.kind})`, ...m } : { source: null, buyer: "none identified", hook: "none identified", x402_door: "none per-axis", gap: "no analyst row" },
  });
  process.stderr.write(`${id.padEnd(24)} row ${row.http} page ${page.http} bank ${bank?.http ?? "-"} card→row ${doors.hub_card_links_row?.links_this_row ?? "-"} evid ${evidenceEdge?.http ?? "-"}${evidenceMirror ? "/mirror " + evidenceMirror.http : ""} mcp ${call.http}/${callState}\n`);
}

const count = (f) => rows.filter(f).length;
const out = {
  schema: "csoai.axis-doors/0.1",
  as_of: AS_OF,
  signed: false,
  unsigned_reason: "a probe record of HTTP codes and analyst judgement; not a measurement card and not under the board key",
  producer: "scripts/axis-doors-probe.mjs",
  site: SITE,
  user_agent: UA,
  board: { url: `${SITE}/api/gspc`, http: board.http, measured_on: b.measured_on ?? null, public_count: b.totals?.public_count ?? null, axes_probed: rows.length },
  once_per_run: {
    x402_manifest: { ...strip(x402), resources: x402Resources ? x402Resources.length : null, axis_scoped_resources: x402Resources ? x402Resources.filter((r) => axes.some((a) => names(JSON.stringify(r), a.axis))).length : null },
    mcp_tools_list: { http: tools.http, tools: toolList ? toolList.length : null, get_axis_description: getAxisTool?.description ?? null },
    a2a_agent_card: { ...strip(agent), skills: agentSkills ? agentSkills.map((s) => s.id) : null },
    a2a_gspc_board_send_message: { ...strip(a2a), bytes: a2a.text.length },
    llms_txt_live: { ...strip(llmsLive), row_door_lines: llmsLive.http === 200 ? (llmsLive.text.match(/api\/gspc\?axis=/g) || []).length : null },
    llms_txt_branch: { path: "public/llms.txt", row_door_lines: (llmsRepo.match(/api\/gspc\?axis=/g) || []).length },
    payai_door_demand: demandFile ? { path: `public/interop/${demandFile}`, as_of: demand.as_of ?? null, doors: Array.isArray(demand.doors) ? demand.doors.map((d) => d.door) : null, note: "PayAI's bazaar records demand per DOOR; no door is axis-scoped, so no axis can appear here until one is" } : null,
  },
  totals: {
    axes: rows.length,
    board_row_200: count((r) => r.doors.board_row.http === 200 && r.doors.board_row.names_axis === true),
    axis_page_200: count((r) => r.doors.axis_page.http === 200),
    mcp_get_axis_live: count((r) => r.doors.mcp_get_axis.state === "LIVE"),
    hub_bank_on_row: count((r) => !!r.dataset),
    hub_card_links_this_row: count((r) => r.doors.hub_card_links_row?.links_this_row === true),
    evidence_on_row: count((r) => !!r.evidence_url),
    evidence_edge_200: count((r) => r.doors.evidence_edge.http === 200),
    evidence_mirror_200: count((r) => r.doors.evidence_mirror?.http === 200),
    llms_live_row_lines: count((r) => r.discoverable.llms_txt_live_row_line === true),
    llms_branch_row_lines: count((r) => r.discoverable.llms_txt_branch_row_line === true),
    x402_axis_scoped: count((r) => r.discoverable.x402_resource_names_axis === true),
    hook_identified: count((r) => r.market.hook && !/^none identified/.test(r.market.hook)),
    note: "Counts are over the rows above and derived here; they are not board totals. A door that returned no answer is UNREACHABLE on its row and is not counted as absent.",
  },
  axes: rows,
  doctrine: "Measurement, not certification. A door serves a recomputable result; a listing is distribution, not authority. No price appears here: x402 amounts live only inside a 402 challenge.",
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${path.relative(REPO, OUT)}  (${rows.length} axes; ${JSON.stringify(out.totals)})`);
