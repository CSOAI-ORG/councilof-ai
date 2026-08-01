/**
 * geolibre — the local knowledge shard for Sov Space (opt-in, GDPR-clean).
 *
 * Law: geo-location is OFF by default. Nothing resolves the visitor's IP until
 * they explicitly enable "local shard". With geo off, everything behaves as
 * GLOBAL. A manual region pick is always available and never touches the network.
 *
 * When enabled, ipapi.co resolves country → a REGIONS shard (EU/UK/US/…), whose
 * framework set pre-loads the arena filter, the GSPC tooling and the towns view.
 */

import { REGIONS, type RegionProfile } from "./locale";
import { useEffect, useState } from "react";

export type GeoSource = "off" | "ip" | "manual";

export type GeoState = {
  enabled: boolean;
  source: GeoSource;
  regionCode: string; // key into REGIONS ("GLOBAL" when off/unresolved)
  countryIso2: string; // "" unless ip-resolved
  resolving: boolean;
};

const STORAGE_KEY = "geolibre.v1";
const listeners = new Set<() => void>();

// ISO 3166-1 alpha-2 → REGIONS shard
const EU27_ISO2 = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU",
  "IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE",
]);
function iso2ToRegion(iso2: string): string {
  const c = iso2.toUpperCase();
  if (EU27_ISO2.has(c)) return "EU";
  if (c === "GB") return "UK";
  if (c === "US") return "US";
  if (c === "JP") return "JP";
  if (c === "KR") return "KR";
  if (c === "CN") return "CN";
  if (c === "SG") return "SG";
  if (c === "CA") return "CA";
  if (c === "IN") return "IN";
  return "GLOBAL";
}

function load(): GeoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        enabled: !!p.enabled,
        source: p.source === "ip" || p.source === "manual" ? p.source : "off",
        regionCode: typeof p.regionCode === "string" && REGIONS[p.regionCode] ? p.regionCode : "GLOBAL",
        countryIso2: typeof p.countryIso2 === "string" ? p.countryIso2 : "",
        resolving: false,
      };
    }
  } catch {}
  return { enabled: false, source: "off", regionCode: "GLOBAL", countryIso2: "", resolving: false };
}

let state: GeoState = typeof localStorage !== "undefined" ? load() : { enabled: false, source: "off", regionCode: "GLOBAL", countryIso2: "", resolving: false };

function save() {
  try {
    const { resolving: _r, ...persist } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persist));
  } catch {}
}

function setState(next: Partial<GeoState>) {
  state = { ...state, ...next };
  save();
  for (const fn of listeners) fn();
}

export function getGeo(): GeoState {
  return state;
}

export function geoRegion(): RegionProfile {
  return REGIONS[state.enabled ? state.regionCode : "GLOBAL"] ?? REGIONS.GLOBAL;
}

/** Explicit opt-in. Resolves IP → shard once; on failure keeps GLOBAL + source "ip". */
export async function enableGeo(): Promise<void> {
  setState({ enabled: true, resolving: true });
  try {
    const r = await fetch("https://ipapi.co/json/");
    if (!r.ok) throw new Error("HTTP " + r.status);
    const d = await r.json();
    const iso2 = String(d.country_code || d.country || "").toUpperCase();
    setState({ source: "ip", countryIso2: iso2, regionCode: iso2ToRegion(iso2), resolving: false });
  } catch {
    // Honest failure: stay enabled but GLOBAL — the user asked, the network said no.
    setState({ source: "ip", regionCode: "GLOBAL", resolving: false });
  }
}

export function disableGeo(): void {
  setState({ enabled: false, source: "off", regionCode: "GLOBAL", countryIso2: "" });
}

/** Manual shard pick — no network, no IP, fully GDPR-clean. */
export function pickRegion(regionCode: string): void {
  if (!REGIONS[regionCode]) return;
  setState({ enabled: true, source: "manual", regionCode });
}

/** React hook — components re-render when the shard changes. */
export function useGeolibre(): GeoState & {
  region: RegionProfile;
  enable: () => Promise<void>;
  disable: () => void;
  pick: (code: string) => void;
} {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((x) => x + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  return { ...state, region: geoRegion(), enable: enableGeo, disable: disableGeo, pick: pickRegion };
}

export const GEO_REGION_OPTIONS = Object.values(REGIONS).map((r) => ({ code: r.code, label: r.label }));
