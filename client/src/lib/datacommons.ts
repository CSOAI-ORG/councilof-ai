const KEY: string = ((import.meta as any).env && (import.meta as any).env.VITE_DATACOMMONS_KEY) || "";
export function dcLive(): boolean { return typeof KEY === "string" && KEY.length > 8; }
export async function fetchPlaceStats(place: string): Promise<string[]> {
  if (!dcLive()) return [];
  try {
    const r = await fetch("https://api.datacommons.org/v2/resolve?key=" + encodeURIComponent(KEY), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nodes: [place], property: "<-description{typeOf:Place}->dcid" }) });
    if (!r.ok) return [];
    const d = await r.json(); const ent = d && d.entities && d.entities[0];
    if (ent && ent.candidates && ent.candidates.length) return ["Resolved place: " + (ent.candidates[0].dcid || "")];
    return [];
  } catch (e) { return []; }
}
