export interface SovTownStats {
  episodes: number;
  governedCrimes: number;
  ungovernedCrimes: number;
  modelsTrained: number;
  hives: number;
  passports: number;
  macUpdated: string;
  vmUpdated: string;
}

function num(n?: number): number {
  return typeof n === "number" && !Number.isNaN(n) ? n : 0;
}

export async function fetchSovTownStats(): Promise<SovTownStats> {
  const base = "https://proofof-site.vercel.app/sovereign-town";
  const fallback: SovTownStats = {
    episodes: 700_000_000,
    governedCrimes: 0,
    ungovernedCrimes: 60_000_000,
    modelsTrained: 50,
    hives: 28,
    passports: 29,
    macUpdated: "",
    vmUpdated: "",
  };

  try {
    const [macRes, vmRes, registryRes] = await Promise.all([
      fetch(`${base}/fleet_status_mac.json`, { next: { revalidate: 300 } }),
      fetch(`${base}/fleet_status_vm.json`, { next: { revalidate: 300 } }),
      fetch(`${base}/registry.json`, { next: { revalidate: 300 } }),
    ]);

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
