// SPDX-License-Identifier: Apache-2.0
/**
 * "Talk and watch it happen": AG-UI frontend tools that drive THIS PANEL's own views, visibly,
 * one step at a time, with Stop, Undo and Take over. They never reach outside the panel's shadow
 * root: no host DOM, no host navigation, no host API. A host console that wants its own assistant
 * to act on the console calls GSPC as a tool (MCP https://councilof.ai/mcp/free) from that assistant.
 *
 * Two sources of actions, both labelled in the activity log:
 *   "assistant": the run called one of FRONTEND_TOOLS (AG-UI: the client declares tools in
 *                RunAgentInput.tools; the agent emits TOOL_CALL_* naming one; the client runs it).
 *                councilof.ai's router does not call them yet; the panel declares them so it can.
 *   "panel":     the panel derives the same actions from the run's own tool results (open the
 *                subject the answer is about, highlight the evidence it cites, fill the watch form).
 * A watch request always stops at pause_at_confirm. Nothing is submitted without a click.
 */
export const FRONTEND_TOOLS = Object.freeze([
  { name: "open_subject", description: "Show the evidence panel for a subject (MCP server URL, agent card URL, model id, card id or claim id).", parameters: { type: "object", properties: { subject: { type: "string" } }, required: ["subject"] } },
  { name: "highlight_evidence", description: "Highlight one region of the evidence panel: state, figures, dvo, signature, recheck, corrections or citation.", parameters: { type: "object", properties: { region: { type: "string", enum: ["state", "figures", "dvo", "signature", "recheck", "corrections", "citation"] } }, required: ["region"] } },
  { name: "fill_watch_form", description: "Fill the monthly re-check request form for a subject. Does not submit.", parameters: { type: "object", properties: { subject: { type: "string" }, cadence: { type: "string", enum: ["monthly"] } }, required: ["subject"] } },
  { name: "pause_at_confirm", description: "Stop and wait for the person to confirm or cancel the pending action.", parameters: { type: "object", properties: { action: { type: "string" } } } },
]);
const NAMES = new Set(FRONTEND_TOOLS.map((t) => t.name));
const REGIONS = new Set(FRONTEND_TOOLS[1].parameters.properties.region.enum);

/** A fetch wrapper that declares FRONTEND_TOOLS in the AG-UI RunAgentInput (body.tools). */
export function withFrontendTools(fetchFn) {
  return (url, init = {}) => {
    if (init.method === "POST" && typeof init.body === "string" && /\/api\/agui\/run$/.test(String(url))) {
      try {
        const body = JSON.parse(init.body);
        body.tools = FRONTEND_TOOLS;
        init = { ...init, body: JSON.stringify(body) };
      } catch {}
    }
    return fetchFn(url, init);
  };
}

function valid(a) {
  if (!a || !NAMES.has(a.tool)) return false;
  if (a.tool === "highlight_evidence") return REGIONS.has(a.args?.region);
  if (a.tool === "open_subject" || a.tool === "fill_watch_form") return typeof a.args?.subject === "string" && a.args.subject.length <= 300;
  return true;
}

/** Actions for one finished run (aguiTalk TalkRun), in the order they will play. */
export function planActions(run, { intent, subject }) {
  const out = [];
  for (const t of run?.tools ?? []) {
    if (!NAMES.has(t.name)) continue;
    let args = {};
    try {
      args = JSON.parse(t.argsText || "{}");
    } catch {}
    out.push({ tool: t.name, args, source: "assistant" });
  }
  if (!out.length && run) {
    const ev = (run.tools ?? []).find((t) => t.status === "done" && (t.name === "server_evidence" || t.name === "verify_card"));
    if (ev) {
      let args = {};
      try {
        args = JSON.parse(ev.argsText || "{}");
      } catch {}
      const s = args.endpoint_url ?? (typeof args.card === "string" ? args.card : null);
      if (s && s !== subject) out.push({ tool: "open_subject", args: { subject: s }, source: "panel" });
      out.push({ tool: "highlight_evidence", args: { region: ev.name === "verify_card" ? "signature" : "dvo" }, source: "panel" });
    }
  }
  if (intent === "watch" && !out.some((a) => a.tool === "fill_watch_form"))
    out.push({ tool: "fill_watch_form", args: { subject, cadence: "monthly" }, source: "panel" }, { tool: "pause_at_confirm", args: { action: "watch-request" }, source: "panel" });
  return out.filter(valid);
}

/**
 * Plays actions one at a time, visibly. `apply(action)` performs one and returns its undo.
 * stop() halts the queue; undo() reverts the last applied action; takeOver() stops and hands
 * control to the person (nothing further plays until the next question).
 */
export class ActionRunner {
  constructor({ apply, onChange, stepMs = 450, sleep }) {
    this.apply = apply;
    this.onChange = onChange ?? (() => {});
    this.stepMs = stepMs;
    this.sleep = sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.log = [];
    this.undos = [];
    this.state = "idle"; // idle | playing | paused | stopped | taken_over
    this.token = 0;
  }
  entry(a, status) {
    const e = { at: new Date().toISOString(), tool: a.tool, args: a.args, source: a.source, status };
    this.log.push(e);
    return e;
  }
  async play(actions) {
    const token = ++this.token;
    this.state = "playing";
    this.onChange();
    for (const a of actions) {
      if (token !== this.token || this.state !== "playing") return;
      await this.sleep(this.stepMs);
      if (token !== this.token || this.state !== "playing") return;
      if (a.tool === "pause_at_confirm") {
        this.entry(a, "waiting for confirm");
        this.state = "paused";
        this.onChange();
        return;
      }
      const e = this.entry(a, "running");
      this.onChange();
      try {
        const undo = await this.apply(a);
        this.undos.push({ entry: e, undo });
        e.status = "done";
      } catch (err) {
        e.status = `failed: ${err?.message ?? err}`;
      }
      this.onChange();
    }
    if (token === this.token && this.state === "playing") this.state = "idle";
    this.onChange();
  }
  stop() {
    this.token++;
    if (this.state === "playing" || this.state === "paused") this.log.push({ at: new Date().toISOString(), tool: "stop", source: "person", status: "stopped" });
    this.state = "stopped";
    this.onChange();
  }
  takeOver() {
    this.token++;
    this.log.push({ at: new Date().toISOString(), tool: "take_over", source: "person", status: "you have control" });
    this.state = "taken_over";
    this.onChange();
  }
  async undo() {
    const last = this.undos.pop();
    if (!last) return false;
    this.token++;
    if (this.state === "playing") this.state = "stopped";
    await last.undo?.();
    last.entry.status = "undone";
    this.log.push({ at: new Date().toISOString(), tool: "undo", args: { of: last.entry.tool }, source: "person", status: "done" });
    this.onChange();
    return true;
  }
  record(tool, args, status) {
    this.log.push({ at: new Date().toISOString(), tool, args, source: "person", status });
    this.onChange();
  }
}
