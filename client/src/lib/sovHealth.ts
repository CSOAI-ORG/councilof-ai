// sovHealth - live connection to the shared SOV3 Sovereign brain (the measurement API).
// The same backend surfaces meok + csoai + defoneos; /health exposes the Layer 0
// protocol surface, and /tools the governed tool fleet count.

export const SOV_GW: string = (((import.meta as any).env?.VITE_SOV_GATEWAY as string) || "/api").replace(/\/$/, "");

export type SovHealth = {
  ok?: boolean;
  service?: string;
  version?: string;
  surface_of?: string[];
  brain?: { openai_compat?: string; orchestrator?: string; groq?: boolean; anthropic?: boolean };
  tools?: string[];
  governance?: { care_floor?: number; sigil?: string; sigil_seeded?: boolean };
  kit?: string;
};

export async function fetchHealth(): Promise<SovHealth | null> {
  try { const r = await fetch(SOV_GW + "/health", { cache: "no-store" }); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

export async function fetchToolCount(): Promise<number | null> {
  try { const r = await fetch(SOV_GW + "/tools", { cache: "no-store" }); if (r.ok) { const d = await r.json(); return typeof d.total === "number" ? d.total : null; } } catch (e) {}
  return null;
}
