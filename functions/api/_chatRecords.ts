// functions/api/_chatRecords.ts - MEOK/chat answerer wiring to the gspc-records MCP
// (search_records, get_record, get_report). Read-only; answers only from verified D1 rows and
// labels anything unmeasured as UNMEASURED. Measurement only.
export const RECORDS_MCP = "https://gspc-records.nicholastempleman.workers.dev/mcp";

export const RECORDS_INTENT =
  /\b(gspc|layer ?0)\b.*\b(records?|report|queue)\b|\b(show|find|search|get)\b.*\b(gspc )?records?\b|\bqueue report\b/i;

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export async function callRecordsTool(name: "search_records" | "get_record" | "get_report",
  args: Record<string, unknown>, f: Fetcher = fetch): Promise<any | null> {
  try {
    const r = await f(RECORDS_MCP, { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }) });
    if (!r.ok) return null;
    const j: any = await r.json();
    const text = j?.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
  } catch { return null; }
}

const status = (s?: string) => (s && s !== "UNMEASURED" ? s : "UNMEASURED");

export async function recordsAnswer(q: string, f: Fetcher = fetch): Promise<string | null> {
  if (!RECORDS_INTENT.test(q)) return null;
  const tail = "\n\n_From the GSPC records API (read-only). UNMEASURED means no measurement has been run; it is measurement only._";
  const keyM = q.match(/\b([a-z0-9-]+\|[^\s]+)/i);
  if (keyM) {
    const out = await callRecordsTool("get_record", { key: keyM[1] }, f);
    if (!out?.record) return `No record with key \`${keyM[1]}\` is in the GSPC records.` + tail;
    const r = out.record;
    return `**${r.name}** (\`${r.key}\`, ${r.subject_class}, source ${r.source}): status **${status(r.status)}**; applicable axes: ${r.axes.length ? r.axes.join(", ") : "none yet"};${r.census ? ` census: ${r.census} (discovery only, not an axis result);` : ""} last checked: ${r.last_checked ?? "never"}.` + tail;
  }
  if (/\breport\b/i.test(q)) {
    const out = await callRecordsTool("get_report", {}, f);
    if (!out) return null;
    const s = out.summary;
    const lines = (out.breakdown || []).map((b: any) => `- ${b.subject_class}: ${b.n} ${status(b.status)}`).join("\n");
    return `GSPC queue report${s ? ` for ${s.day}: ${s.queue_total} subjects, ${s.unmeasured} UNMEASURED, ${s.census_done} with a census label` : ""}.\n\n${lines}` + tail;
  }
  const term = q.replace(RECORDS_INTENT, " ").replace(/\b(for|about|on|the|show|find|search|get|me|records?)\b/gi, " ").trim().split(/\s+/).slice(-3).join(" ");
  const out = await callRecordsTool("search_records", { query: term || "", limit: 5 }, f);
  if (!out) return null;
  if (!out.records?.length) return `No GSPC records match "${term}".` + tail;
  return `GSPC records matching "${term}":\n` + out.records.map((r: any) =>
    `- **${r.name}** (\`${r.key}\`): ${status(r.status)}; axes ${r.axes.join(", ") || "none yet"}`).join("\n") + tail;
}
