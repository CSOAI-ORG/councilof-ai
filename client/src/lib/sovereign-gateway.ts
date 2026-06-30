// Bridge from the CSOAI OS to the MEOK sovereign MCP gateway.
// When VITE_SOV_GATEWAY is set, Sov Space runs REAL governance (council + audit
// + sigil) against the live 59-MCP substrate. When unset, callers fall back to
// the local simulation. No secrets here: the gateway URL is public; any auth is
// handled server-side at the gateway.

export type GovStep = { t: string; phase: number };
export type GovResult = { steps: GovStep[]; verdict: string; signed: boolean; sig?: string; ledger?: string };

const BASE: string = ((import.meta as any).env && (import.meta as any).env.VITE_SOV_GATEWAY) || "";

export function gatewayLive(): boolean {
  return typeof BASE === "string" && /^https?:\/\//.test(BASE);
}

function url(path: string): string {
  return BASE.replace(/\/$/, "") + path;
}

// Orchestrated governance run. The gateway is expected to fan this out across
// its MCPs (council BFT -> audit/EU AI Act -> sigil/Ed25519 -> ledger) and
// return the narration steps + signed verdict.
export async function runGovernance(scenario: string, region?: string): Promise<GovResult> {
  if (!gatewayLive()) throw new Error("gateway-not-configured");
  const res = await fetch(url("/govern"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario: scenario || "", region: region || "" }),
  });
  if (!res.ok) throw new Error("gateway-" + res.status);
  const data = await res.json();
  if (!data || !Array.isArray(data.steps)) throw new Error("gateway-bad-shape");
  return data as GovResult;
}

// UE5 bridge status (mirrors meok-sovereign-ue5-bridge-mcp ue5_engine_status).
export async function ue5Status(): Promise<any | null> {
  if (!gatewayLive()) return null;
  try { const r = await fetch(url("/ue5/status")); return r.ok ? await r.json() : null; } catch (e) { return null; }
}
