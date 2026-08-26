// sovTools — the bridge from the front end to the published MCP server.
//
// WHAT WAS WRONG (found by operating it, 2026-08-26): every call went to POST /api/mcp,
// which exposes only onRequestGet (the registry artifact) and answers
//   404 {"error":"not_found","path":"/api/mcp"}
// to a POST. listTools() swallowed that in its catch and returned [], so ToolRunner sat on
// the badge "connecting…" forever, on /tools and in the Council OS tools pane. A control
// that is permanently mid-connection is telling the reader a process is under way when
// nothing is. The JSON-RPC endpoint is /mcp (functions/mcp/[[path]].ts, proxied to the
// GSPC MCP worker); /api/mcp is the read-only registry and is not an RPC target.
//
// listTools() now distinguishes "no tools" from "could not ask", so the caller can say which.

const GW: string =
  ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) ||
  "/api";

export type SovTool = {
  name: string;
  description: string;
  inputSchema?: { type?: string; properties?: Record<string, any>; required?: string[] };
};

export type ToolResult = { ok: boolean; text: string; raw?: any };

/** The JSON-RPC endpoint. NOT `${GW}/mcp` — that is the registry artifact, GET-only. */
const RPC = "/mcp";

async function rpc(method: string, params?: any): Promise<any> {
  const r = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  return r.json();
}

// The live, server-executed governance tools (govern, sign, verify, talk, agent-card).
export type ToolListing =
  | { state: "ok"; tools: SovTool[] }
  | { state: "unreachable"; reason: string };

export async function listTools(): Promise<ToolListing> {
  try {
    const d = await rpc("tools/list");
    if (d && d.error) return { state: "unreachable", reason: String(d.error.message || "the server returned an error") };
    const tools = d && d.result && d.result.tools;
    if (!Array.isArray(tools)) return { state: "unreachable", reason: "the reply carried no tools list" };
    return { state: "ok", tools };
  } catch (e) {
    return { state: "unreachable", reason: e instanceof Error ? e.message : "the request failed" };
  }
}

// Actually run a tool and get a real, governed result back.
export async function callTool(name: string, args: Record<string, any>): Promise<ToolResult> {
  try {
    const d = await rpc("tools/call", { name, arguments: args });
    if (d && d.error) return { ok: false, text: "The brain declined: " + (d.error.message || "unknown"), raw: d };
    const content = (d && d.result && d.result.content) || [];
    const text = content.map((c: any) => c && c.text).filter(Boolean).join("\n") || JSON.stringify(d && d.result ? d.result : d);
    return { ok: true, text, raw: d };
  } catch (e) {
    return { ok: false, text: "Couldn't reach the Council engine — check your connection and try again." };
  }
}

// Seal any text to Layer 0 (Ed25519) → SOV: fingerprint. Real cryptographic proof.
// Uses the /sign endpoint (the one that actually returns a signature); falls back
// to a real in-browser SHA-256 content hash if the brain is unreachable — never faked.
export async function sealArtifact(artifact: string): Promise<ToolResult> {
  try {
    const r = await fetch(GW + "/sign", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: artifact }) });
    if (r.ok) {
      const d = await r.json();
      const sig = String((d && (d.signature || d.sig)) || "");
      const fp = String((d && (d.fingerprint || d.publicKey || d.key)) || "");
      if (sig || fp) return { ok: true, text: "COAI:" + fp.slice(0, 40) + "\nsig " + sig.slice(0, 56) + " · Ed25519 · Layer 0", raw: d };
    }
  } catch (e) {}
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(artifact));
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return { ok: true, text: "sha256:" + hex.slice(0, 48) + " · content hash (offline, brain unreachable)" };
  } catch (e) {}
  return { ok: false, text: "Seal unavailable." };
}

// Friendly labels for the known live tools.
export const TOOL_META: Record<string, { glyph: string; label: string }> = {
  meok_govern: { glyph: "⚖", label: "What governs this?" },
  meok_sign: { glyph: "✶", label: "Seal to Layer 0" },
  meok_verify: { glyph: "✓", label: "Verify a seal" },
  meok_talk: { glyph: "◉", label: "Ask the Council" },
  meok_agent_card: { glyph: "🪪", label: "Agent card" },
};
