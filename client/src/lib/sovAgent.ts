// sovAgent — the shared "agentic" layer for the Council assistant.
// Turns a natural-language Sovereign turn into actuator commands so the Council assistant
// can DRIVE the surface (globe layers/region/threat, or launch a simulation) as it
// speaks — not just answer. Used by both WorldGlobe (the globe) and SovSpace (the sims),
// so ONE Sovereign is agentic across both. Pure + deterministic → unit-testable.

export type SovLayer = "fw" | "council" | "watchdog" | "ontology" | "hive";
export type SovAction =
  | { kind: "layer"; layer: SovLayer }
  | { kind: "threat" }
  | { kind: "region"; region: string; lng: number }
  | { kind: "simulate"; scenario: string };

// Longitudes for region fly-to (globe uses -lng rotation).
export const REGION_LNG: Record<string, number> = {
  EU: 4.35, UK: -0.12, US: -77, CANADA: -75.7, APAC: 116.4, JAPAN: 139.69,
  KOREA: 127, CHINA: 116.4, SINGAPORE: 103.8, INDIA: 77.2, AUSTRALIA: 151.2,
  UAE: 55.27, BRAZIL: -46.63, GLOBAL: 0,
};

const REGION_HINTS: [RegExp, string][] = [
  [/\beu\b|europe|brussels|eu ai act|gdpr|dora/i, "EU"],
  [/\buk\b|britain|london|united kingdom/i, "UK"],
  [/\bus\b|u\.s\.|usa|america|washington|nist|fedramp|colorado|texas|california/i, "US"],
  [/canada|ottawa|aida/i, "CANADA"],
  [/japan|tokyo|meti/i, "JAPAN"],
  [/korea|seoul/i, "KOREA"],
  [/china|beijing|pipl/i, "CHINA"],
  [/singapore/i, "SINGAPORE"],
  [/india|delhi|mumbai/i, "INDIA"],
  [/australia|sydney|canberra/i, "AUSTRALIA"],
  [/\buae\b|dubai|emirates|abu dhabi/i, "UAE"],
  [/brazil|s(a|ã)o paulo/i, "BRAZIL"],
];

// Ordered: most-specific overlay first; fw is default-on so it is the fallback.
const LAYER_HINTS: [RegExp, SovLayer][] = [
  [/watchdog|heat ?map|incident|report/i, "watchdog"],
  [/\bcouncil\b|bft|deliberat|vote|33[- ]agent/i, "council"],
  [/\bhive\b|coverage|account|distribution/i, "hive"],
  [/ontolog|relationship graph|how .*connect|crosswalk graph/i, "ontology"],
  [/framework|temple|regulation|which law|jurisdiction/i, "fw"],
];

const THREAT_RE = /\brogue\b|\bswarm\b|neutrali[sz]e (the |a )?(swarm|agent|humanoid)|halt (the |a )?(swarm|attack)/i;
const SIM_RE = /\b(simulate|run a sim|run the sim|scenario|what if|deliberate on|govern this|assess this system|put .* through the council)\b/i;

// Parse an utterance into zero-or-more actuator actions (order = suggested apply order).
export function sovActions(utterance: string): SovAction[] {
  const t = utterance || "";
  const acts: SovAction[] = [];
  if (SIM_RE.test(t)) acts.push({ kind: "simulate", scenario: utterance });
  if (THREAT_RE.test(t)) acts.push({ kind: "threat" });
  for (const [re, layer] of LAYER_HINTS) { if (re.test(t)) { acts.push({ kind: "layer", layer }); break; } }
  for (const [re, region] of REGION_HINTS) { if (re.test(t)) { acts.push({ kind: "region", region, lng: REGION_LNG[region] ?? 0 }); break; } }
  return acts;
}

// Human-readable summary of what the Council assistant is about to DO (for a status chip).
export function describeActions(acts: SovAction[]): string {
  if (!acts.length) return "";
  return acts.map((a) =>
    a.kind === "layer" ? "showing " + a.layer + " layer"
    : a.kind === "threat" ? "responding to the rogue swarm"
    : a.kind === "region" ? "flying to " + a.region
    : "running a simulation"
  ).join(" · ");
}
