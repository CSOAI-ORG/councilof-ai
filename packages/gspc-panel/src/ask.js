// SPDX-License-Identifier: Apache-2.0
/**
 * "Ask GSPC" inside the panel. One grounded assistant, not a second one: questions go to
 * councilof.ai's POST /api/agui/run (functions/_lib/aguiRun.ts -> talkRouter, the same router
 * /api/chat, Council OS and the A2A text path use), read with the Council OS client
 * (client/src/lib/aguiTalk.ts: streamRun + reduceRun), imported here rather than copied.
 *
 * Rules the panel adds on top:
 *   - An answer is shown as an answer only when a tool result behind it carries a citation.
 *     Otherwise the panel says no signed record answered, and shows the router's text as guidance.
 *   - "Is it safe?" gets no verdict: the reply opens by saying GSPC does not rate safety, then shows
 *     what was measured.
 *   - Paid tools are never run from the panel: a run that asks for a paid tool is reported and
 *     stops there. No forwardedProps.confirm is ever sent.
 *   - "Connect GSPC to my project" is answered from the published install constants.
 *   - "Watch it monthly" is an ACTION: it needs a confirm click, then POSTs a watch request for
 *     review to /api/claims/watch-request, and every action is written to the panel's action log.
 */
import { newRun, reduceRun, streamRun } from "../../../client/src/lib/aguiTalk.ts";
// The three install constants of client/src/data/gspcInstall.ts (the /connect-gspc source of truth).
// Copied, not imported, because importing that module pulls its whole platform matrix (about 11 KB
// gzipped) into the panel bundle; test/ask.test.js fails if these ever differ from it.
export const MCP_FREE_URL = "https://councilof.ai/mcp/free";
export const STDIO_CMD = "npx -y csoai-gspc-mcp";
export const OPENAPI_URL = "https://councilof.ai/openapi/gspc.json";

export function askIntent(q) {
  const t = String(q ?? "").toLowerCase();
  if (/\b(watch|monitor|re-?check|track)\b.*\b(month|monthly|every|regular|schedule)|\bmonthly\b/.test(t)) return "watch";
  if (/\b(connect|install|set ?up|add|integrate|wire)\b.*\b(gspc|project|app|cluster|mcp|agent|pipeline)\b|\bhow do i (use|get) gspc\b/.test(t)) return "connect";
  if (/\b(safe|safety|trust(worthy)?|secure|risky|dangerous|ok to use|good to use)\b/.test(t)) return "safety";
  return "ask";
}

/** The question the router sees: the subject is added when the question does not name one. */
export function routedQuestion(q, subject) {
  const t = String(q ?? "").trim();
  if (!subject || /https?:\/\/|\b[0-9a-f]{64}\b/i.test(t) || t.includes(subject)) return t;
  return `${t} ${subject}`.trim();
}

export function connectAnswer(subject) {
  return {
    kind: "connect",
    grounded: true,
    preface: null,
    text: "Three ways in. Each is free to read; nothing here signs you up for anything.",
    steps: [
      { label: "MCP (any MCP client), streamable HTTP, no auth", code: MCP_FREE_URL },
      { label: "MCP over stdio", code: STDIO_CMD },
      { label: "REST (OpenAPI 3.1)", code: OPENAPI_URL },
      { label: "This panel in your own page", code: '<script type="module" src="https://councilof.ai/panel/gspc-panel.js"></script>\n<gspc-evidence-panel subject="' + (subject || "https://example.com/mcp") + '"></gspc-evidence-panel>' },
      { label: "OpenShift (namespace only, from the councilof-ai source tree)", code: "helm upgrade -i gspc-evidence integrations/openshift-console-plugin/charts/gspc-evidence-plugin -f integrations/openshift-console-plugin/charts/gspc-evidence-plugin/values-sandbox.yaml -n <your-namespace>" },
      { label: "Llama Stack eval provider remote::csoai (PyPI, Python >= 3.12)", code: "pip install llama-stack-provider-csoai" },
    ],
    citations: [{ tool: "install", url: "https://councilof.ai/connect-gspc" }],
  };
}

function citationsOf(run) {
  return run.tools
    .filter((t) => t.status === "done" && t.citation && (t.citation.url || t.citation.record_id))
    .map((t) => ({ tool: t.name, label: t.label ?? null, url: t.citation.url, record_id: t.citation.record_id }));
}

/** Ask the grounded assistant. Resolves to an answer object the view renders. */
export async function askGspc(q, { subject, origin, fetchFn, onUpdate }) {
  const intent = askIntent(q);
  if (intent === "connect") return connectAnswer(subject);
  if (intent === "watch")
    return {
      kind: "confirm",
      action: "watch-request",
      subject,
      intent,
      run: null,
      text: `Request a monthly re-check of ${subject || "this subject"}? This sends a request for review. Nothing is scheduled, measured, charged or published until a person accepts it.`,
    };
  let run = newRun(q, `panel-${Date.now()}`);
  await streamRun({
    question: routedQuestion(q, subject),
    endpoint: `${origin}/api/agui/run`,
    fetchImpl: fetchFn,
    onEvent: (ev) => {
      run = reduceRun(run, ev);
      onUpdate?.(run);
    },
  });
  const citations = citationsOf(run);
  const paid = run.confirm?.tools?.map((t) => t.tool) ?? [];
  return {
    kind: "answer",
    grounded: citations.length > 0 && run.status === "done",
    preface: intent === "safety" ? "GSPC does not say whether anything is safe to use. It shows what was measured, how, and whether the record verifies." : null,
    text: run.text.trim(),
    citations,
    paid_refused: paid.length ? `This question needs a paid tool (${paid.join(", ")}). The panel never runs paid tools; nothing was called or charged.` : null,
    error: run.status === "error" ? run.error ?? "the run failed" : null,
    intent,
    run,
  };
}

/** The confirmed action: POST a monthly watch request for review. */
export async function requestWatch(subject, { origin, fetchFn }) {
  const r = await fetchFn(`${origin}/api/claims/watch-request`, {
    method: "POST",
    credentials: "omit",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ schema: "csoai.watch-request/0.1", subject, cadence: "monthly", confirmed: true, requested_via: "gspc-panel" }),
  });
  let body = {};
  try {
    body = await r.json();
  } catch {}
  return { ok: r.ok, status: r.status, state: body.state ?? (r.ok ? "RECEIVED_FOR_REVIEW" : "NOT_RECORDED"), request_id: body.request_id ?? null, note: body.note ?? null };
}
