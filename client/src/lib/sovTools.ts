// sovTools - the real bridge from the front end to the live Sovereign brain.
// Talks JSON-RPC to os.meok.ai/api/mcp: lists the tools the brain executes
// server-side, and actually RUNS them (governed, care-floored, Ed25519-signable).
// This is what turns the catalogue from a directory into working tooling.

const GW: string =
  ((import.meta as any).env && (import.meta as any).env.VITE_KNOWLEDGE_BASE) ||
  "https://os.meok.ai/api";

export type SovTool = {
  name: string;
  description: string;
  inputSchema?: { type?: string; properties?: Record<string, any>; required?: string[] };
};

export type ToolResult = { ok: boolean; text: string; raw?: any };

async function rpc(method: string, params?: any): Promise<any> {
  const r = await fetch(GW + "/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params }),
  });
  return r.json();
}

// The live, server-executed governance tools (govern, sign, verify, talk, agent-card).
export async function listTools(): Promise<SovTool[]> {
  try {
    const d = await rpc("tools/list");
    return (d && d.result && d.result.tools) || [];
  } catch (e) {
    return [];
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
      if (sig || fp) return { ok: true, text: "SOV:" + fp.slice(0, 40) + "\nsig " + sig.slice(0, 56) + " · Ed25519 · Layer 0", raw: d };
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
