// SPDX-License-Identifier: Apache-2.0
/**
 * AG-UI in. councilof.ai's POST /api/agui/run streams AG-UI events as SSE:
 *   RUN_STARTED → (TOOL_CALL_START → TOOL_CALL_ARGS → TOOL_CALL_END → TOOL_CALL_RESULT)* →
 *   TEXT_MESSAGE_* → RUN_FINISHED, plus CUSTOM "a2ui" for verify_card and board_totals.
 * Each TOOL_CALL_RESULT.content is a JSON string {tool, args, label, summary, citation, output}.
 *
 * The panel reads the tool outputs out of that stream and builds the same model the direct path
 * builds, by replaying them as a sources object (so there is one code path, not two). Tool calls
 * the stream did not make are not invented: the panel's direct reads fill them, or the field
 * stays "not published".
 */
import { buildModel } from "./model.js";

/** SSE text -> [{event, data}] with data parsed as JSON where possible. */
export function parseSse(text) {
  const out = [];
  for (const block of String(text ?? "").split(/\r?\n\r?\n/)) {
    let event = null;
    const data = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
    }
    if (!data.length) continue;
    const raw = data.join("\n");
    let parsed = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {}
    out.push({ event: event ?? parsed?.type ?? "message", data: parsed });
  }
  return out;
}

/** Tool outputs carried by an AG-UI stream: {tool, args, output}[]. */
export function toolResults(events) {
  const res = [];
  for (const e of events) {
    const d = e.data;
    if (d?.type !== "TOOL_CALL_RESULT" || typeof d.content !== "string") continue;
    try {
      const c = JSON.parse(d.content);
      if (c && typeof c.tool === "string") res.push({ tool: c.tool, args: c.args ?? {}, output: c.output ?? null });
    } catch {}
  }
  return res;
}

/** The subject an AG-UI run was about: the first tool call's subject argument. */
export function subjectOf(results) {
  for (const r of results) {
    if (r.tool === "server_evidence" && r.args.endpoint_url) return r.args.endpoint_url;
    if (r.tool === "verify_card" && typeof r.args.card === "string") return r.args.card;
  }
  return null;
}

/**
 * Build the panel model from an AG-UI event stream. `sources` supplies whatever the stream did
 * not carry (card bodies for in-browser verification, the board, corrections).
 */
export async function modelFromAgui(sseText, { sources, verifyCard }) {
  const events = parseSse(sseText);
  const results = toolResults(events);
  const subject = subjectOf(results);
  const replay = { ...sources };
  replay.tool = async (name, args) => {
    const hit = results.find((r) => r.tool === name && JSON.stringify(r.args) === JSON.stringify(args));
    if (hit && hit.output) return hit.output;
    return sources.tool(name, args);
  };
  const m = await buildModel(subject ?? "", { sources: replay, verifyCard });
  m.sources = [...m.sources, `${sources.origin}/api/agui/run (AG-UI stream, ${results.length} tool result(s))`];
  return m;
}

/** POST an AG-UI run for a subject and return the SSE text. */
export async function runAgui(subject, { origin, fetchFn }) {
  const r = await fetchFn(`${origin}/api/agui/run`, {
    method: "POST",
    credentials: "omit",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify({ threadId: "gspc-panel", runId: `panel-${Date.now()}`, messages: [{ role: "user", content: subject }] }),
  });
  if (!r.ok) throw new Error(`/api/agui/run HTTP ${r.status}`);
  return r.text();
}
