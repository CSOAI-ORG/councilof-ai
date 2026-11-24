/** Source-reported *simulation* counts. No live source independently verifies original episodes, signers or real-world effects. */
export interface SovTownStats {
  episodes: number | null;
  governedCrimes: number | null;
  ungovernedCrimes: number | null;
  modelsTrained: number | null;
  hives: number | null;
  passports: number | null;
  macUpdated: string;
  vmUpdated: string;
  source: "source-reported" | "partial" | "unavailable";
  fetchedAt: string;
}

export const UNKNOWN_SOV_TOWN: SovTownStats = {
  episodes: null,
  governedCrimes: null,
  ungovernedCrimes: null,
  modelsTrained: null,
  hives: null,
  passports: null,
  macUpdated: "",
  vmUpdated: "",
  source: "unavailable",
  fetchedAt: "",
};

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
function sumIfComplete(a: unknown, b: unknown): number | null {
  const left = count(a), right = count(b);
  if (left === null || right === null) return null;
  return count(left + right);
}
function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
function updated(value: unknown): string {
  return typeof value === "string" && value.length <= 80 ? value : "";
}

/** Read-only: no credential, write, payment, inference or signature verification.
 * "source-reported" describes an HTTP observation, NOT independently verified events. */
export async function fetchSovTownStats(): Promise<SovTownStats> {
  const base = "https://proofof.ai/towns";
  const endpoints = ["fleet_status_mac.json", "fleet_status_vm.json", "registry.json"];
  const responses = await Promise.allSettled(endpoints.map(async name => {
    const response = await fetch(`${base}/${name}`, { cache: "no-store" });
    if (!response.ok) return null;
    return record(await response.json());
  }));
  const [mac, vm, registry] = responses.map(r => r.status === "fulfilled" ? r.value : null);
  const validSources = [mac, vm, registry].filter(Boolean).length;
  if (validSources === 0) return { ...UNKNOWN_SOV_TOWN };
  return {
    episodes: sumIfComplete(mac?.cum_episodes, vm?.cum_episodes),
    governedCrimes: sumIfComplete(mac?.governed_crimes, vm?.governed_crimes),
    ungovernedCrimes: sumIfComplete(mac?.ungoverned_crimes, vm?.ungoverned_crimes),
    modelsTrained: sumIfComplete(mac?.models_trained, vm?.models_trained),
    hives: count(mac?.hives),
    passports: count(registry?.count),
    macUpdated: updated(mac?.updated),
    vmUpdated: updated(vm?.updated),
    source: validSources === 3 ? "source-reported" : "partial",
    fetchedAt: new Date().toISOString(),
  };
}

/** Unknown is not zero, and missing data must not display a numeric suffix. */
export function formatCount(n: number | null): string {
  if (n === null || !Number.isSafeInteger(n) || n < 0) return "Unknown";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
