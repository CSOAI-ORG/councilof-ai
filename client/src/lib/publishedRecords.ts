// publishedRecords — maps records the site already publishes onto globe stamps.
// Pure: no network, no clock, no randomness. The loader at the bottom takes an injected fetch.
//
// Layers (never mixed, carried in payload.layer_class):
//   "measured"          — a record Council of AI produced by probing a public source (watchdog intake).
//   "reported-by-other" — a figure another organisation published (Eurostat), read and re-published by us.
// Simulated / illustrative content (Watchdog layer, swarm demo) is NOT produced here.
//
// A source that failed is omitted and listed in `omitted`; it is never drawn as zero.
// Measurement, not certification: nothing here says safe, unsafe, compliant or certified.

export const SITE = "https://councilof.ai";
export const VERIFIER_URL = SITE + "/verify";
export const PUBLISHED_LAYER = "published-records";

export type FeedResult =
  | { ok: true; url: string; data: any }
  | { ok: false; url: string; reason: string };

export interface PublishedStamp {
  id: string;
  kind: "published-measured" | "published-reported";
  region: string;
  lng: number;
  lat: number;
  claim: string;
  ts: string;
  layer: typeof PUBLISHED_LAYER;
  payload: {
    layer: typeof PUBLISHED_LAYER;
    layer_class: "measured" | "reported-by-other";
    record_address: string;
    as_of: string;
    verifier: string;
    place: string;
    place_basis: string;
    review: string;
    detail: Record<string, unknown>;
  };
}

export interface Omission { source: string; reason: string }

export interface PublishedRecords {
  stamps: PublishedStamp[];
  omitted: Omission[];
  count: number;
  newest_as_of: string | null;
  by_class: { measured: number; reported_by_other: number };
}

export interface FeedInputs {
  gspc: FeedResult;
  intakeLatest: FeedResult;
  intakeIndex: FeedResult;
  adoption: FeedResult;
  labour: FeedResult;
}

// Publisher seats. The place is the address the publisher gives for itself on its own page; it
// says nothing about where an event happened. Each page named in `basis` was read on
// 24 Nov 2026 and the stamp carries it. Coordinates are city-level. A publisher that states no
// single address (foundations, registries) is deliberately absent and is listed as omitted.
// MITRE names two principal locations (Bedford MA and McLean VA) and is drawn at the one its
// own page labels "Main Campus". NIST's stated address is Gaithersburg MD, not Washington DC.
type Seat = { place: string; lng: number; lat: number; basis: string };
const CISA: Seat = { place: "Washington DC, US (CISA mailing address)", lng: -77.04, lat: 38.9, basis: "https://www.cisa.gov/about/contact-us" };
const NIST: Seat = { place: "Gaithersburg MD, US (NIST)", lng: -77.22, lat: 39.14, basis: "https://www.nist.gov/visit" };
const MITRE: Seat = { place: "McLean VA, US (MITRE main campus; Bedford MA is its other principal location)", lng: -77.2, lat: 38.92, basis: "https://www.mitre.org/locations" };
const GITHUB: Seat = { place: "San Francisco, US (GitHub)", lng: -122.39, lat: 37.78, basis: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" };
const GOOGLE: Seat = { place: "Mountain View, US (Google)", lng: -122.08, lat: 37.42, basis: "https://about.google/company-info/locations/" };
export const PUBLISHER_SEATS: Record<string, Seat> = {
  "cisa-kev": CISA,
  "nvd-cve-api": NIST,
  "mitre-cve": MITRE,
  "atlas-current": MITRE,
  "atlas-manifest": MITRE,
  "ghsa-api": GITHUB,
  "osv-query": GOOGLE,
  "go-vuln": GOOGLE,
  "depsdev": GOOGLE,
};

const EU_SEAT = { place: "EU27 aggregate, drawn at Brussels", lng: 4.35, lat: 50.85 };
const AUTOMATED = "automated, unreviewed (no named person reviewed this record)";

const abs = (p: string) => (/^https?:\/\//.test(p) ? p : SITE + (p.startsWith("/") ? p : "/" + p));
const isIso = (s: unknown): s is string => typeof s === "string" && !Number.isNaN(Date.parse(s));

function fail(f: FeedResult, name: string, omitted: Omission[]): f is { ok: false; url: string; reason: string } {
  if ("reason" in f) { omitted.push({ source: name + " (" + f.url + ")", reason: "source failed: " + f.reason }); return true; }
  return false;
}

export function mapPublishedRecords(input: FeedInputs): PublishedRecords {
  const omitted: Omission[] = [];
  const stamps: PublishedStamp[] = [];

  // --- watchdog intake: publisher's seat, layer "measured" ---
  const latestFailed = fail(input.intakeLatest, "watchdog-intake latest.json", omitted);
  const indexFailed = fail(input.intakeIndex, "watchdog-intake _index.json", omitted);
  if (!indexFailed && input.intakeIndex.ok) {
    const idx = input.intakeIndex.data || {};
    const asOf = idx.as_of;
    const runArtifact = (!latestFailed && input.intakeLatest.ok && input.intakeLatest.data?.run_artifact) || idx.run_artifact;
    const signals: any[] = Array.isArray(idx.signals) ? idx.signals : [];
    if (!isIso(asOf) || !runArtifact) {
      omitted.push({ source: "watchdog-intake _index.json", reason: "no as_of time or run address in the file" });
    } else {
      const perSeat: Record<string, number> = {};
      for (const s of signals) {
        const seat = PUBLISHER_SEATS[s.source_id];
        if (s.state !== "REACHABLE") { omitted.push({ source: "watchdog-intake " + s.source_id, reason: "source state " + s.state + "; not drawn" }); continue; }
        if (!seat) { omitted.push({ source: "watchdog-intake " + s.source_id, reason: "no single publisher seat; kept off the globe" }); continue; }
        const k = seat.place; const n = perSeat[k] = (perSeat[k] ?? -1) + 1;
        const lng = seat.lng + n * 0.7; // deterministic spread so sources at one seat do not overlap
        stamps.push({
          id: "pub:watchdog:" + s.source_id, kind: "published-measured", region: seat.place, lng, lat: seat.lat,
          claim: String(s.name || s.source_id), ts: asOf, layer: PUBLISHED_LAYER,
          payload: {
            layer: PUBLISHED_LAYER, layer_class: "measured", record_address: abs(runArtifact), as_of: asOf, verifier: VERIFIER_URL,
            place: seat.place, place_basis: "address the publisher gives for itself, read 24 Nov 2026 at " + seat.basis + (n ? "; pin moved east so pins at one address do not overlap" : ""), review: AUTOMATED,
            detail: {
              source_id: s.source_id, state: s.state, kind: s.kind, http_status: s.http_status,
              count: s.count, count_kind: s.count_kind,
              count_unit: s.count_kind === "count" ? "items as read from the source's own response" : undefined,
              body_sha256: s.body_sha256,
              measure: "public source reachability and parseability; not a score, not a determination",
            },
          },
        });
      }
    }
  }

  // --- the board itself, and the Eurostat-based axes: jurisdiction, layer "reported-by-other" ---
  if (!fail(input.gspc, "GET /api/gspc", omitted) && input.gspc.ok) {
    omitted.push({ source: "GET /api/gspc totals", reason: "board-wide record with no place; kept off the globe" });
    const axes: any[] = Array.isArray(input.gspc.data?.axes) ? input.gspc.data.axes : [];
    let euN = -1;
    for (const [axisId, feed] of [["ai-adoption-components", input.adoption], ["labour-components", input.labour]] as const) {
      const ax = axes.find((a) => a.axis === axisId);
      if (!ax) { omitted.push({ source: axisId, reason: "axis not in the live board" }); continue; }
      if (fail(feed, axisId + " run artifact", omitted) || !feed.ok) continue;
      const asOf = ax.facts_as_of;
      const series: any[] = Array.isArray(feed.data?.measured) ? feed.data.measured : [];
      const usable = series.filter((r) => r && r.status === "MEASURED" && typeof r.value === "number" && r.unit && /EU27/.test(String(r.series)));
      if (!isIso(asOf) || !usable.length) { omitted.push({ source: axisId, reason: "no as_of time or no EU27 measured series in the run artifact" }); continue; }
      stamps.push({
        id: "pub:eurostat:" + axisId, kind: "published-reported", region: "EU", lng: EU_SEAT.lng + 0.7 * (++euN), lat: EU_SEAT.lat,
        claim: "EU27 · Eurostat · " + axisId, ts: asOf, layer: PUBLISHED_LAYER,
        payload: {
          layer: PUBLISHED_LAYER, layer_class: "reported-by-other", record_address: abs(ax.evidence_url || feed.url), as_of: asOf, verifier: VERIFIER_URL,
          place: EU_SEAT.place, place_basis: "jurisdiction the series covers (EU27); not a country row", review: AUTOMATED,
          detail: {
            axis: axisId, publisher: "Eurostat (series read by Council of AI; not produced by it)",
            series: usable.map((r) => ({ series: r.series, value: r.value, unit: r.unit, year: r.year, source: r.source })),
            run_attestation: ax.run_attestation,
          },
        },
      });
    }
  }

  // Named omissions that are decisions, not failures (kept visible, never silently dropped).
  omitted.push({ source: "regulatory-framework, regulator-transparency", reason: "rows are named issuer accounts or named regulators with no country field; the transparency axis states no single row should be relied on" });
  omitted.push({ source: "x402 doors, MCP servers", reason: "no meaningful geography" });
  omitted.push({ source: "frameworks and deadlines", reason: "held in the site bundle, not at a public address; not fetched" });

  const times = stamps.map((s) => Date.parse(s.ts)).filter(Number.isFinite);
  const newest = times.length ? new Date(Math.max(...times)).toISOString().replace(/\.\d{3}Z$/, "Z") : null;
  return {
    stamps, omitted, count: stamps.length, newest_as_of: newest,
    by_class: {
      measured: stamps.filter((s) => s.payload.layer_class === "measured").length,
      reported_by_other: stamps.filter((s) => s.payload.layer_class === "reported-by-other").length,
    },
  };
}

export function legendLine(r: PublishedRecords): string {
  if (!r.count) return "Published records: none available now (" + r.omitted.length + " omissions listed)";
  return "Published records · " + r.count + " records · newest as_of " + r.newest_as_of + " · " + r.by_class.measured + " measured by us, " + r.by_class.reported_by_other + " reported by other organisations";
}

// --- loader (injected fetch, so it is testable and never throws) ---
async function get(f: typeof fetch, path: string, ms = 15000): Promise<FeedResult> {
  const url = abs(path);
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
  const t = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try {
    const r = await f(path, { cache: "no-store", signal: ctl?.signal });
    if (!r.ok) return { ok: false, url, reason: "HTTP " + r.status };
    return { ok: true, url, data: await r.json() };
  } catch (e: any) {
    return { ok: false, url, reason: String(e?.message || e) };
  } finally { if (t) clearTimeout(t); }
}

export async function loadPublishedRecords(f: typeof fetch = fetch): Promise<PublishedRecords> {
  const [gspc, intakeLatest, intakeIndex] = await Promise.all([
    get(f, "/api/gspc"), get(f, "/interop/watchdog-intake/latest.json"), get(f, "/interop/watchdog-intake/_index.json"),
  ]);
  const ev = (id: string) => (gspc.ok && Array.isArray(gspc.data?.axes) ? gspc.data.axes.find((a: any) => a.axis === id)?.evidence_url : undefined);
  const miss = (id: string): FeedResult => ({ ok: false, url: SITE + "/interop/financial-measure-run-" + id + ".json", reason: "address not given by the live board" });
  const [adoption, labour] = await Promise.all(["ai-adoption-components", "labour-components"].map((id) => (ev(id) ? get(f, ev(id)) : Promise.resolve(miss(id)))));
  return mapPublishedRecords({ gspc, intakeLatest, intakeIndex, adoption, labour });
}
