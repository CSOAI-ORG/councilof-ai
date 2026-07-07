// hiveScore.ts — client-side Distribution Hive scorer for the PUBLIC ecosystem
// dataset (regulators + honest placeholders). Mirrors scripts/hive-recon.mjs (the
// CI gate + 2000-lead scorer). Public/display only — never scores internal leads.
//
// HONEST: CSOAI axis scores are sourced to the live product/register. An account's
// current-state is MODELED from public posture + vendor (flagged 'modeled' where the
// vendor is unknown). 'displace' is only ever returned for a KNOWN real vendor.
import type { Account } from "../data/ecosystem";

export type Axis = { key: string; label: string };
export const AXES: Axis[] = [
  { key: "frameworkCoverage", label: "Framework coverage" },
  { key: "agenticGovernance", label: "Agentic governance" },
  { key: "verifiableProof", label: "Verifiable proof" },
  { key: "liveTooling", label: "Live tooling" },
  { key: "enforcementTiming", label: "Enforcement timing" },
  { key: "sovereignty", label: "Sovereignty / data" },
  { key: "integrationEffort", label: "Integration effort" },
];

type Scores = Record<string, number>;
const CSOAI: Scores = { frameworkCoverage: 3, agenticGovernance: 3, verifiableProof: 3, liveTooling: 3, enforcementTiming: 3, sovereignty: 3, integrationEffort: 3 };

const VENDOR_PROFILE: Record<string, Scores> = {
  vanta:     { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 2, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  drata:     { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 2, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  "credo-ai":{ frameworkCoverage: 2, agenticGovernance: 2, verifiableProof: 1, liveTooling: 1, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  onetrust:  { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 1, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  internal:  { frameworkCoverage: 1, agenticGovernance: 1, verifiableProof: 1, liveTooling: 1, enforcementTiming: 1, sovereignty: 2, integrationEffort: 1 },
};
const KNOWN = new Set(Object.keys(VENDOR_PROFILE));
// Only commercial competitors are "displace". An internal stack → "integrate" (layer under).
const COMMERCIAL = new Set(["vanta", "drata", "credo-ai", "onetrust"]);
const POSTURE_BASE: Record<string, Scores> = {
  none:     { frameworkCoverage: 0, agenticGovernance: 0, verifiableProof: 0, liveTooling: 0, enforcementTiming: 0, sovereignty: 1, integrationEffort: 0 },
  emerging: { frameworkCoverage: 1, agenticGovernance: 0, verifiableProof: 0, liveTooling: 1, enforcementTiming: 1, sovereignty: 1, integrationEffort: 0 },
  mature:   { frameworkCoverage: 2, agenticGovernance: 1, verifiableProof: 1, liveTooling: 1, enforcementTiming: 2, sovereignty: 1, integrationEffort: 1 },
  unknown:  { frameworkCoverage: 1, agenticGovernance: 0, verifiableProof: 0, liveTooling: 1, enforcementTiming: 1, sovereignty: 1, integrationEffort: 0 },
};

export type AccountScore = {
  play: "align" | "absorb" | "integrate" | "displace";
  confidence: "verified" | "modeled" | "authority";
  totalGap: number;
  maxGap: number;
  perAxis: { key: string; label: string; csoai: number; current: number; gap: number }[];
  topUsps: string[];
};

export function scoreAccount(a: Account): AccountScore {
  const posture = a.posture || "unknown";
  const vendor = (a.currentVendor || "unknown").toLowerCase();
  const isAuthority = posture === "sets-rules" || a.type === "regulator" || a.type === "government";

  let current: Scores | null, confidence: AccountScore["confidence"], play: AccountScore["play"];
  if (isAuthority) { current = null; confidence = "authority"; play = "align"; }
  else if (KNOWN.has(vendor)) { current = VENDOR_PROFILE[vendor]; confidence = "verified"; play = COMMERCIAL.has(vendor) ? "displace" : "integrate"; }
  else { current = POSTURE_BASE[posture] || POSTURE_BASE.unknown; confidence = "modeled"; play = posture === "none" ? "absorb" : "integrate"; }

  const perAxis = AXES.map(({ key, label }) => {
    const csoai = CSOAI[key];
    const cur = current ? current[key] : csoai;
    return { key, label, csoai, current: cur, gap: Math.max(0, csoai - cur) };
  });
  const totalGap = perAxis.reduce((s, x) => s + x.gap, 0);
  const topUsps = [...perAxis].filter((x) => x.gap > 0).sort((x, y) => y.gap - x.gap).slice(0, 3).map((x) => x.label);
  return { play, confidence, totalGap, maxGap: AXES.length * 3, perAxis, topUsps };
}
