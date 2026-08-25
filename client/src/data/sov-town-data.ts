export interface SovTownStats {
  episodes: number;
  governedCrimes: number;
  ungovernedCrimes: number;
  modelsTrained: number;
  hives: number;
  passports: number;
  macUpdated: string;
  vmUpdated: string;
  /** Honesty bar: where did these numbers come from, and when. */
  source: "live" | "partial" | "last-known";
  fetchedAt: string;
}

function num(n?: number): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

export async function fetchSovTownStats(): Promise<SovTownStats> {
  const base = "https://proofof.ai/towns";
  // Last-known values shown ONLY when the live feed is unreachable — and the UI
  // must say so (source: "last-known"). Never silent fake-live.
  const fallback: SovTownStats = {
    episodes: 700_000_000,
    governedCrimes: 0,
    ungovernedCrimes: 60_000_000,
    modelsTrained: 50,
    hives: 28,
    passports: 29,
    macUpdated: "",
    vmUpdated: "",
    source: "last-known",
    fetchedAt: "",
  };

  try {
    const cacheOpt = { next: { revalidate: 300 } } as RequestInit;
    const [macRes, vmRes, registryRes] = await Promise.all([
      fetch(`${base}/fleet_status_mac.json`, cacheOpt),
      fetch(`${base}/fleet_status_vm.json`, cacheOpt),
      fetch(`${base}/registry.json`, cacheOpt),
    ]);

    const okCount = [macRes, vmRes, registryRes].filter(r => r.ok).length;
    if (okCount === 0) return fallback;

    const mac = macRes.ok ? await macRes.json() : {};
    const vm = vmRes.ok ? await vmRes.json() : {};
    const registry = registryRes.ok ? await registryRes.json() : {};

    return {
      episodes: num(mac.cum_episodes) + num(vm.cum_episodes),
      governedCrimes: num(mac.governed_crimes) + num(vm.governed_crimes),
      ungovernedCrimes: num(mac.ungoverned_crimes) + num(vm.ungoverned_crimes),
      modelsTrained: num(mac.models_trained) + num(vm.models_trained),
      hives: num(mac.hives) || fallback.hives,
      passports: num(registry.count) || fallback.passports,
      macUpdated: mac.updated || "",
      vmUpdated: vm.updated || "",
      source: okCount === 3 ? "live" : "partial",
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
