// Replays LIVE bytes recorded from https://councilof.ai on 2026-09-30 (see fixtures/live-2026-09-30/
// MANIFEST.json). Nothing here is written by hand: every body is a file curl saved. Two files are
// trimmed (entries/keys removed, none added or edited) and say so in the manifest. A request the
// recording does not cover throws, so no test can pass on an invented upstream.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FX = resolve(dirname(fileURLToPath(import.meta.url)), "fixtures/live-2026-09-30");
export const fx = (f) => readFileSync(resolve(FX, f), "utf8");
const lastData = (t) => JSON.parse(t.split(/\r?\n/).filter((l) => l.startsWith("data:")).pop().slice(5));

const SERVER_FX = {
  "https://councilof.ai/mcp": "own",
  "https://tandem.ac/mcp": "tandem",
  "https://env.agentlookups.ai/mcp": "agentlookups",
  "https://councilof.ai/mcp/free": "unmeasured",
};

const GET_FX = {
  "/api/gspc": "gspc.json",
  "/api/corrections": "corrections.trimmed.json",
  "/api/claims/register": "claims-register.json",
  "/api/state": "state.trimmed.json",
  "/interop/models-measured.json": "models-measured.json",
  "/signed/cards/94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1.json": "card-llama.json",
};

export function replayFetch({ overrides = {} } = {}) {
  const calls = [];
  const capsuleFx = {};
  for (const n of ["own", "tandem", "agentlookups"]) {
    const sc = lastData(fx(`se-${n}.sse`)).result.structuredContent;
    capsuleFx[sc.capsules[0].capsule_json] = `vcap-${n}.sse`;
  }
  const ok = (body, type = "application/json") => new Response(body, { status: 200, headers: { "content-type": type } });
  async function fetchFn(url, init = {}) {
    const u = new URL(url);
    const method = (init.method ?? "GET").toUpperCase();
    calls.push({ url: String(url), method });
    if (u.origin !== "https://councilof.ai") throw new Error(`replay: refused non-councilof.ai request ${url}`);
    const key = `${method} ${u.pathname}`;
    if (overrides[key]) return overrides[key](init);
    if (method === "POST" && u.pathname === "/mcp/free") {
      const { params } = JSON.parse(init.body);
      if (params.name === "server_evidence") {
        const n = SERVER_FX[params.arguments.endpoint_url];
        if (!n) throw new Error(`replay: no recording for server_evidence ${params.arguments.endpoint_url}`);
        return ok(fx(`se-${n}.sse`), "text/event-stream");
      }
      if (params.name === "verify_capsule") {
        const f = capsuleFx[params.arguments.capsule_json];
        if (!f) throw new Error("replay: no recording for this capsule");
        return ok(fx(f), "text/event-stream");
      }
      if (params.name === "verify_card" && params.arguments.card === "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1")
        return ok(fx("vc-card.sse"), "text/event-stream");
      throw new Error(`replay: no recording for tool ${params.name}`);
    }
    if (method === "POST" && u.pathname === "/api/agui/run") {
      const content = JSON.parse(init.body).messages[0].content;
      if (content === "https://tandem.ac/mcp") return ok(fx("agui-tandem.sse"), "text/event-stream");
      if (content.startsWith("94b88313")) return ok(fx("agui-card.sse"), "text/event-stream");
      const ASK = {
        "explain this evidence https://tandem.ac/mcp": "ask-explain-tandem.sse",
        "is this MCP server safe to use? https://tandem.ac/mcp": "ask-safe-tandem.sse",
        "what is the weather in Paris": "ask-unrouted.sse",
      };
      if (ASK[content]) return ok(fx(ASK[content]), "text/event-stream");
      throw new Error(`replay: no AG-UI recording for ${content}`);
    }
    if (method === "GET" && GET_FX[u.pathname]) return ok(fx(GET_FX[u.pathname]));
    throw new Error(`replay: no recording for ${key}`);
  }
  return { fetchFn, calls };
}
