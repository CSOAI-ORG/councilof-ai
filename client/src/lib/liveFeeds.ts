// liveFeeds.ts — CSOAI clean-room live data adapter for the Sovereign OS.
//
// Purpose: pull REAL, keyless, public data feeds and reframe them through an
// AI-governance + AI-economy lens. This is our own code and our own model —
// we studied the *idea* of a live global monitor and pivoted it to the thing
// nobody else does: correlate physical-world and news signals against the
// world's AI compute infrastructure and AI-governance topics, so every signal
// carries a "why this matters for AI governance" meaning, not just a dot on a map.
//
// All sources here are third-party public APIs (no keys, CORS-friendly):
//   - USGS earthquakes (GeoJSON)
//   - NASA EONET natural events (JSON)
//   - GDELT Doc 2.0 (JSON) filtered to AI-governance topics
// Feeds that need keys (ACLED, NASA FIRMS, ADS-B) are intentionally NOT here —
// they degrade to nothing until a key is supplied, by design.

export type SignalCategory =
  | "bias" | "safety" | "privacy" | "unlawful" | "agent" | "transparency" | "systemic";

export type LiveSignal = {
  source: string;          // e.g. "USGS", "NASA EONET", "GDELT"
  category: SignalCategory;
  note: string;            // human-readable, AI-governance-framed
  lat?: number;
  lng?: number;
  region?: string;         // coarse region hint when known
  severity: "info" | "watch" | "elevated" | "critical";
  url?: string;
  at: number;              // epoch ms
};

// ---- AI compute infrastructure map (curated, public knowledge) -------------
// The physical substrate of the AI economy. Governance relevance: where compute
// concentrates, AI capability — and AI risk — concentrates. We use this to turn
// generic disaster/outage data into AI-infrastructure risk intelligence.
export type ComputeHub = { name: string; region: string; lat: number; lng: number; kind: string };
export const AI_COMPUTE_HUBS: ComputeHub[] = [
  { name: "Northern Virginia", region: "United States", lat: 39.02, lng: -77.46, kind: "hyperscale cluster" },
  { name: "Oregon (Columbia R.)", region: "United States", lat: 45.63, lng: -121.18, kind: "hyperscale cluster" },
  { name: "Santa Clara / Bay Area", region: "United States", lat: 37.35, lng: -121.96, kind: "AI lab + cloud" },
  { name: "Phoenix / Arizona", region: "United States", lat: 33.45, lng: -112.07, kind: "fab + datacenter" },
  { name: "Dublin", region: "European Union", lat: 53.35, lng: -6.26, kind: "EU cloud region" },
  { name: "Frankfurt", region: "European Union", lat: 50.11, lng: 8.68, kind: "EU cloud region" },
  { name: "London", region: "United Kingdom", lat: 51.51, lng: -0.13, kind: "cloud + AI lab" },
  { name: "Paris", region: "European Union", lat: 48.86, lng: 2.35, kind: "AI lab + cloud" },
  { name: "Stockholm", region: "European Union", lat: 59.33, lng: 18.06, kind: "green compute" },
  { name: "Tel Aviv", region: "Israel", lat: 32.08, lng: 34.78, kind: "AI R&D" },
  { name: "Bengaluru", region: "India", lat: 12.97, lng: 77.59, kind: "cloud + AI services" },
  { name: "Mumbai", region: "India", lat: 19.08, lng: 72.88, kind: "cloud region" },
  { name: "Singapore", region: "Singapore", lat: 1.35, lng: 103.82, kind: "APAC cloud hub" },
  { name: "Tokyo", region: "Japan", lat: 35.68, lng: 139.69, kind: "cloud + robotics AI" },
  { name: "Seoul", region: "South Korea", lat: 37.57, lng: 126.98, kind: "chip + AI" },
  { name: "Beijing", region: "China", lat: 39.90, lng: 116.40, kind: "AI lab + cloud" },
  { name: "Shanghai", region: "China", lat: 31.23, lng: 121.47, kind: "AI + fab" },
  { name: "Sydney", region: "Australia", lat: -33.87, lng: 151.21, kind: "cloud region" },
  { name: "São Paulo", region: "Brazil", lat: -23.55, lng: -46.63, kind: "LatAm cloud hub" },
  { name: "Toronto", region: "Canada", lat: 43.65, lng: -79.38, kind: "AI research hub" },
];

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371, dLat = ((bLat - aLat) * Math.PI) / 180, dLng = ((bLng - aLng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
export function nearestComputeHub(lat: number, lng: number): { hub: ComputeHub; km: number } | null {
  let best: { hub: ComputeHub; km: number } | null = null;
  for (const h of AI_COMPUTE_HUBS) {
    const km = haversineKm(lat, lng, h.lat, h.lng);
    if (!best || km < best.km) best = { hub: h, km };
  }
  return best;
}

// ---- tiny TTL cache (localStorage) ----------------------------------------
function cacheGet<T>(key: string, ttlMs: number): T | null {
  try {
    const raw = localStorage.getItem("csoai_feed_" + key);
    if (!raw) return null;
    const { at, v } = JSON.parse(raw);
    if (Date.now() - at > ttlMs) return null;
    return v as T;
  } catch { return null; }
}
function cacheSet<T>(key: string, v: T) {
  try { localStorage.setItem("csoai_feed_" + key, JSON.stringify({ at: Date.now(), v })); } catch {}
}
async function getJSON(url: string, timeoutMs = 12000): Promise<any | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const r = await fetch(url, { signal: ctl.signal, headers: { accept: "application/json" } });
    clearTimeout(t);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ---- USGS earthquakes → AI infrastructure risk -----------------------------
// The pivot: a quake alone is a disaster feed. A quake NEAR an AI compute hub is
// a compute-continuity / model-availability risk — a governance-relevant signal.
export async function fetchComputeQuakeRisk(): Promise<LiveSignal[]> {
  const cached = cacheGet<LiveSignal[]>("usgs", 5 * 60 * 1000);
  if (cached) return cached;
  const d = await getJSON("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson");
  const out: LiveSignal[] = [];
  const feats = d && Array.isArray(d.features) ? d.features : [];
  for (const f of feats) {
    const c = f?.geometry?.coordinates; const p = f?.properties;
    if (!c || c.length < 2) continue;
    const lng = c[0], lat = c[1], mag = Number(p?.mag) || 0;
    const near = nearestComputeHub(lat, lng);
    if (!near || near.km > 600) continue; // only surface quakes that threaten compute
    const sev = mag >= 6.5 ? "critical" : mag >= 5.5 ? "elevated" : "watch";
    out.push({
      source: "USGS",
      category: "systemic",
      note: `M${mag.toFixed(1)} earthquake ~${Math.round(near.km)}km from ${near.hub.name} (${near.hub.kind}) — compute-continuity / model-availability risk to AI infrastructure.`,
      lat, lng, region: near.hub.region, severity: sev as any,
      url: p?.url, at: Number(p?.time) || Date.now(),
    });
  }
  cacheSet("usgs", out);
  return out;
}

// ---- NASA EONET → environmental risk to AI infrastructure -------------------
export async function fetchComputeEnvRisk(): Promise<LiveSignal[]> {
  const cached = cacheGet<LiveSignal[]>("eonet", 15 * 60 * 1000);
  if (cached) return cached;
  const d = await getJSON("https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=20");
  const out: LiveSignal[] = [];
  const events = d && Array.isArray(d.events) ? d.events : [];
  for (const e of events) {
    const g = Array.isArray(e.geometry) && e.geometry.length ? e.geometry[e.geometry.length - 1] : null;
    const coords = g?.coordinates;
    if (!coords || coords.length < 2) continue;
    const lng = coords[0], lat = coords[1];
    const near = nearestComputeHub(lat, lng);
    if (!near || near.km > 500) continue;
    const cat = (e.categories && e.categories[0] && e.categories[0].title) || "Event";
    out.push({
      source: "NASA EONET",
      category: "systemic",
      note: `${cat} ~${Math.round(near.km)}km from ${near.hub.name} — environmental risk to AI compute (power, cooling, connectivity).`,
      lat, lng, region: near.hub.region, severity: "watch",
      url: e.link, at: Date.parse(g?.date || "") || Date.now(),
    });
  }
  cacheSet("eonet", out);
  return out;
}

// ---- GDELT → live AI-governance events worldwide ---------------------------
// Real news events filtered to AI-governance & AI-economy topics, then
// classified into the Watchdog's own signal taxonomy.
const GDELT_QUERY =
  '("artificial intelligence" OR "AI regulation" OR "AI Act" OR deepfake OR "facial recognition" OR "algorithmic" OR "autonomous weapon" OR "AI safety" OR "AI governance" OR "large language model")';
function classifyGov(text: string): SignalCategory {
  const s = text.toLowerCase();
  if (/deepfake|impersonat|likeness|synthetic media|face swap/.test(s)) return "privacy";
  if (/bias|discriminat|fairness|unfair/.test(s)) return "bias";
  if (/privacy|surveillance|facial recognition|biometric|data protection|gdpr/.test(s)) return "privacy";
  if (/ban|unlawful|illegal|prohibit|lawsuit|sued|fined|penalt/.test(s)) return "unlawful";
  if (/agent|autonomous|self-driving|robot|humanoid|drone/.test(s)) return "agent";
  if (/transparen|disclos|label|watermark|explainab/.test(s)) return "transparency";
  if (/safety|harm|risk|catastroph|weapon|incident/.test(s)) return "safety";
  return "systemic";
}
export async function fetchAiGovNews(max = 24): Promise<LiveSignal[]> {
  const cached = cacheGet<LiveSignal[]>("gdelt", 10 * 60 * 1000);
  if (cached) return cached;
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(GDELT_QUERY) +
    "&mode=artlist&format=json&maxrecords=" + max + "&timespan=3d&sort=datedesc";
  const d = await getJSON(url);
  const arts = d && Array.isArray(d.articles) ? d.articles : [];
  const out: LiveSignal[] = arts.map((a: any) => {
    const title = String(a.title || "").slice(0, 200);
    return {
      source: "GDELT",
      category: classifyGov(title + " " + (a.domain || "")),
      note: title || "AI-governance event",
      region: a.sourcecountry || undefined,
      severity: "info" as const,
      url: a.url,
      at: a.seendate ? Date.parse(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z")) || Date.now() : Date.now(),
    };
  });
  cacheSet("gdelt", out);
  return out;
}

// ---- KEYED feeds (Phase 6) — light up when a key is supplied ---------------
// These stay dark (return []) until the relevant env key is set, by design.
// Set VITE_ACLED_KEY + VITE_ACLED_EMAIL and/or VITE_FIRMS_MAP_KEY at build time.
const ENV: any = (import.meta as any).env || {};

// ACLED — live armed-conflict + unrest events, framed as geopolitical risk to
// AI infrastructure when near a compute hub.
export async function fetchAcledConflict(): Promise<LiveSignal[]> {
  const key = ENV.VITE_ACLED_KEY, email = ENV.VITE_ACLED_EMAIL;
  if (!key || !email) return []; // dark until keyed
  const cached = cacheGet<LiveSignal[]>("acled", 30 * 60 * 1000);
  if (cached) return cached;
  const url = "https://api.acleddata.com/acled/read?key=" + encodeURIComponent(key) + "&email=" + encodeURIComponent(email) + "&limit=200&event_date=" + new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10) + "|" + new Date().toISOString().slice(0, 10) + "&event_date_where=BETWEEN";
  const d = await getJSON(url);
  const rows = d && Array.isArray(d.data) ? d.data : [];
  const out: LiveSignal[] = [];
  for (const r of rows) {
    const lat = parseFloat(r.latitude), lng = parseFloat(r.longitude);
    if (!isFinite(lat) || !isFinite(lng)) continue;
    const near = nearestComputeHub(lat, lng);
    if (!near || near.km > 400) continue; // only conflict threatening compute
    out.push({ source: "ACLED", category: "systemic", note: (r.event_type || "Conflict event") + " near " + near.hub.name + " — geopolitical risk to AI infrastructure. " + String(r.notes || "").slice(0, 140), lat, lng, region: r.country, severity: "elevated", at: Date.parse(r.event_date) || Date.now() });
  }
  cacheSet("acled", out);
  return out;
}

// NASA FIRMS — live fire/thermal detections; physical risk to compute when near a hub.
export async function fetchFirmsFires(): Promise<LiveSignal[]> {
  const key = ENV.VITE_FIRMS_MAP_KEY;
  if (!key) return []; // dark until keyed
  const cached = cacheGet<LiveSignal[]>("firms", 30 * 60 * 1000);
  if (cached) return cached;
  // CSV: lat,lon,bright,scan,track,acq_date,... — global VIIRS last 1 day
  try {
    const r = await fetch("https://firms.modaps.eosdis.nasa.gov/api/area/csv/" + encodeURIComponent(key) + "/VIIRS_SNPP_NRT/world/1");
    if (!r.ok) return [];
    const txt = await r.text();
    const lines = txt.trim().split("\n"); const head = (lines.shift() || "").split(",");
    const li = head.indexOf("latitude"), gi = head.indexOf("longitude");
    const out: LiveSignal[] = [];
    for (const ln of lines.slice(0, 3000)) {
      const c = ln.split(","); const lat = parseFloat(c[li]), lng = parseFloat(c[gi]);
      if (!isFinite(lat) || !isFinite(lng)) continue;
      const near = nearestComputeHub(lat, lng);
      if (!near || near.km > 120) continue; // only fires very close to a hub
      out.push({ source: "NASA FIRMS", category: "systemic", note: "Active fire detection ~" + Math.round(near.km) + "km from " + near.hub.name + " — physical risk to AI compute (power/cooling/connectivity).", lat, lng, region: near.hub.region, severity: "elevated", at: Date.now() });
    }
    const uniq = out.filter((s, i, a) => a.findIndex((x) => x.note === s.note) === i);
    cacheSet("firms", uniq);
    return uniq;
  } catch { return []; }
}

// ---- unified pull ----------------------------------------------------------
// One call the OS can lean on: real AI-governance + AI-infrastructure signals,
// deduped and sorted newest-first. Degrades gracefully — any dead feed just
// contributes nothing, never an error. Keyed feeds (ACLED/FIRMS) join in
// automatically once their env keys are set.
export async function fetchLiveGovSignals(): Promise<LiveSignal[]> {
  const results = await Promise.allSettled([
    fetchComputeQuakeRisk(),
    fetchComputeEnvRisk(),
    fetchAiGovNews(),
    fetchAcledConflict(),
    fetchFirmsFires(),
  ]);
  const all: LiveSignal[] = [];
  for (const r of results) if (r.status === "fulfilled") all.push(...r.value);
  // dedupe by note, newest first
  const seen = new Set<string>();
  return all
    .sort((a, b) => b.at - a.at)
    .filter((s) => { const k = s.note.slice(0, 80); if (seen.has(k)) return false; seen.add(k); return true; });
}
