// admin1.ts — lazy admin-1 (states/provinces) boundary loader for OpenGridWorks
// Wave C drill-down. The country atlas (110m) has no sub-national detail, so when a
// user zooms deep into a large country we overlay Natural Earth admin-1 boundaries so
// you can "see into" the country.
//
// Source: Natural Earth 50m admin-1 states/provinces (raw GeoJSON, ~2.3 MB).
//   https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson
// The 50m file carries full sub-national geometry for the nine largest countries by
// area — USA, RUS, CHN, IND, BRA, IDN, AUS, CAN, ZAF (294 provinces total). Those are
// exactly the countries where admin-1 drill-down is visually meaningful; smaller nations
// read fine at country level. (The 110m file is US-only; the 10m global file is ~40 MB —
// too heavy for a lazy in-browser overlay.) Each feature exposes `adm0_a3` (ISO-3166-1
// alpha-3), which lines up with `isoFromNumeric()` so we can filter to the focused country.
//
// Strategy: loaded ONCE on first deep-zoom, cached as a module-level promise (so repeated
// zooms never refetch), and at render time we filter to only the focused country's
// provinces — so even though the file holds 294 paths, we draw at most ~85 at a time.
// On any failure we log + resolve to an empty set; the map keeps working exactly as before.

export const ADMIN1_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';

// ISO-3 codes for which the 50m dataset actually carries admin-1 geometry. Used to skip
// the fetch entirely (and skip drill-down UI) for countries we have no sub-detail for.
export const ADMIN1_COUNTRIES = new Set([
  'USA', 'RUS', 'CHN', 'IND', 'BRA', 'IDN', 'AUS', 'CAN', 'ZAF',
]);

export type Admin1Feature = {
  type: 'Feature';
  properties: { adm0_a3?: string; name?: string; iso_3166_2?: string };
  geometry: any;
};

let cache: Promise<Admin1Feature[]> | null = null;

/**
 * Fetch (once) and cache all admin-1 features. Resolves to [] on any failure so callers
 * can render nothing and carry on. Safe to call repeatedly — the promise is memoised.
 */
export function loadAdmin1(): Promise<Admin1Feature[]> {
  if (cache) return cache;
  cache = fetch(ADMIN1_URL)
    .then((r) => {
      if (!r.ok) throw new Error('admin1 ' + r.status);
      return r.json();
    })
    .then((fc: any) => (Array.isArray(fc?.features) ? (fc.features as Admin1Feature[]) : []))
    .catch((e) => {
      // graceful: log + degrade to no overlay (and let a later call retry)
      console.warn('[OpenGridWorks] admin-1 overlay unavailable, skipping drill-down:', e);
      cache = null;
      return [];
    });
  return cache;
}

/** True when we have sub-national geometry for this ISO-3 country (worth drilling into). */
export function hasAdmin1(iso3?: string): boolean {
  return !!iso3 && ADMIN1_COUNTRIES.has(iso3);
}
