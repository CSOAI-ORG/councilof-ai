/**
 * statusFeeds — the /status rows for the fleet, funding, evidence records and timestamps.
 *
 * Pure functions from one live read to display rows, so the rules are testable without a
 * browser. The rules:
 *   · Every number shown is read, at render time, from the source the row names. Counts are
 *     computed from the list the source returned in this read — never typed, never carried over.
 *   · A source this page could not read is UNMEASURED and shows NO number. There is no cache
 *     here and no fallback value: a stale figure presented as current is the failure this page
 *     exists to prevent.
 *   · Funding is a colour (GREEN / AMBER / RED) or UNMEASURED. An amount in the source, if one
 *     ever appears, is not read by this module.
 *   · Evidence records are evidence linked from the board, never board totals.
 */

export type FeedState = "OK" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN" | "UNMEASURED";

export type FeedRow = {
  group: string;
  label: string;
  state: FeedState;
  /** Optional display word for the badge (e.g. the funding colour); defaults to state. */
  badge?: string;
  observation: string;
  observedAt: string | null;
  observedFrom: string;
  href: string;
};

export type Read<T> =
  | { ok: true; body: T; readAt: string; error?: undefined }
  | { ok: false; error: string; readAt: string; body?: undefined };

export const FLEET_STATUS_URL = "https://huggingface.co/datasets/csoai/fleet-status/resolve/main/fleet_status.public.json";
export const FLEET_STATUS_PAGE = "https://huggingface.co/datasets/csoai/fleet-status";
export const EVIDENCE_MANIFEST_URL = "/evidence/published-records.json";
export const SITE_OTS_MANIFEST_URL = "/interop/ots/manifest.json";

export const FEED_GROUPS = ["Fleet jobs", "Funding", "Evidence records", "Census as_of", "Timestamps"] as const;

export type FleetJob = { id: string; state: string; last_ok: string | null };
export type FleetStatusPublic = {
  schema?: string;
  published_at?: string | null;
  jobs?: FleetJob[];
  funding?: { state?: string; as_of?: string | null };
};

export type EvidenceVersion = {
  version: string;
  page: string;
  state: string;
  as_of: string;
  read_state: string | null;
  signature: { state: string; did: string; signed_at?: string | null };
  ots: { state: string; proof_url: string | null; upgraded_proof_url: string | null };
  record_url: string;
};
export type EvidenceManifest = {
  schema?: string;
  records?: Array<{ slug: string; dataset: string; title: string; page_index: string; versions: EvidenceVersion[] }>;
  refused?: Array<{ dataset: string; path?: string; state: string; reason: string }>;
};
export type SiteOtsManifest = { schema?: string; as_of?: string; counts?: Record<string, number> };

export function unmeasured(group: string, label: string, error: string, readAt: string, href: string): FeedRow {
  return {
    group,
    label,
    state: "UNMEASURED",
    observation: `This page could not read the source (${error}). No figure is shown: a cached or earlier value is never substituted.`,
    observedAt: null,
    observedFrom: `read attempted at ${readAt} (this browser's clock)`,
    href,
  };
}

const countBy = (xs: string[]) => xs.reduce<Record<string, number>>((m, x) => ((m[x] = (m[x] ?? 0) + 1), m), {});
const fmtCounts = (m: Record<string, number>) =>
  Object.entries(m)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, n]) => `${k} ${n}`)
    .join(" · ");

/** Fleet jobs: one summary row from the live list, plus the list itself for the table. */
export function fleetView(r: Read<FleetStatusPublic>): { rows: FeedRow[]; jobs: FleetJob[] } {
  const g = "Fleet jobs";
  const label = "csoai/fleet-status — every public scheduled job's state from the supervisor's last pass";
  if (!r.ok) return { rows: [unmeasured(g, label, r.error, r.readAt, FLEET_STATUS_PAGE)], jobs: [] };
  const b = r.body;
  if (b.schema !== "csoai.fleet-status-public/0.1" || !Array.isArray(b.jobs)) {
    return { rows: [unmeasured(g, label, "answered, but not csoai.fleet-status-public/0.1", r.readAt, FLEET_STATUS_PAGE)], jobs: [] };
  }
  const jobs = b.jobs.filter((j) => j && typeof j.id === "string" && typeof j.state === "string");
  const counts = countBy(jobs.map((j) => j.state));
  const bad = (counts.FAILED ?? 0) + (counts.STALE ?? 0) + (counts.MISSING ?? 0);
  return {
    rows: [
      {
        group: g,
        label,
        state: bad > 0 ? "DEGRADED" : "OK",
        observation: `${jobs.length} job(s) in this read: ${fmtCounts(counts)}. UNMEASURED means the supervisor could not read that job's signal, not that it failed.`,
        observedAt: typeof b.published_at === "string" ? b.published_at : null,
        observedFrom: typeof b.published_at === "string" ? "fleet_status.public.json → published_at (the supervisor pass)" : `read at ${r.readAt} (this browser's clock)`,
        href: FLEET_STATUS_PAGE,
      },
    ],
    jobs,
  };
}

const COLOURS = new Set(["GREEN", "AMBER", "RED"]);

/** Funding: a colour or UNMEASURED. Reads funding.state and funding.as_of and nothing else. */
export function fundingRow(r: Read<FleetStatusPublic>): FeedRow {
  const g = "Funding";
  const label = "Compute funding (runway colour from the funding watchdog)";
  if (!r.ok) return unmeasured(g, label, r.error, r.readAt, FLEET_STATUS_PAGE);
  const s = r.body.funding?.state;
  const asOf = r.body.funding?.as_of ?? null;
  if (typeof s !== "string" || !COLOURS.has(s)) {
    return { ...unmeasured(g, label, `funding state is ${typeof s === "string" ? s : "absent"}`, r.readAt, FLEET_STATUS_PAGE), badge: "UNMEASURED" };
  }
  return {
    group: g,
    label,
    state: s === "GREEN" ? "OK" : s === "AMBER" ? "DEGRADED" : "UNAVAILABLE",
    badge: s,
    observation: "A colour, not an amount: GREEN / AMBER / RED from the watchdog's runway thresholds. No balance is published.",
    observedAt: typeof asOf === "string" ? asOf : null,
    observedFrom: typeof asOf === "string" ? "fleet_status.public.json → funding.as_of" : `read at ${r.readAt} (this browser's clock)`,
    href: FLEET_STATUS_PAGE,
  };
}

const hoursSince = (iso: string, nowMs: number): number | null => {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? Math.max(0, Math.round((nowMs - t) / 36e5)) : null;
};

/** Evidence records: one row per series (its CURRENT version), plus published refusals. */
export function evidenceRows(r: Read<EvidenceManifest>, nowMs: number): FeedRow[] {
  const g = "Evidence records";
  const label = "Signed evidence record pages (/evidence/published-records.json)";
  if (!r.ok) return [unmeasured(g, label, r.error, r.readAt, EVIDENCE_MANIFEST_URL)];
  if (r.body.schema !== "csoai.pubbus-manifest/0.1" || !Array.isArray(r.body.records)) {
    return [unmeasured(g, label, "answered, but not csoai.pubbus-manifest/0.1", r.readAt, EVIDENCE_MANIFEST_URL)];
  }
  const rows: FeedRow[] = [];
  for (const rec of r.body.records) {
    const cur = rec.versions?.find((v) => v.state === "CURRENT");
    if (!cur) continue;
    const age = hoursSince(cur.as_of, nowMs);
    rows.push({
      group: g,
      label: rec.title,
      state: cur.signature?.state === "VERIFIED" ? "OK" : "DEGRADED",
      observation: `record as_of ${cur.as_of}${age === null ? "" : ` (${age} h before this read, by this browser's clock)`} · read_state ${cur.read_state ?? "not stated"} · signature ${cur.signature?.state ?? "not stated"} · timestamp ${cur.ots?.state ?? "not stated"} · ${rec.versions.length} version(s) published.`,
      observedAt: cur.as_of,
      observedFrom: "the record's own as_of",
      href: cur.page,
    });
  }
  for (const x of r.body.refused ?? []) {
    rows.push({
      group: g,
      label: `csoai/${x.dataset}${x.path ? ` — ${x.path}` : ""}`,
      state: x.state === "UNMEASURED" ? "UNMEASURED" : "UNAVAILABLE",
      badge: x.state,
      observation: `Not published: ${x.reason}`,
      observedAt: null,
      observedFrom: "publication bus refusal, as recorded in the manifest",
      href: `https://huggingface.co/datasets/csoai/${x.dataset}`,
    });
  }
  if (!rows.length) rows.push({ group: g, label, state: "UNAVAILABLE", observation: "The manifest lists no record yet.", observedAt: null, observedFrom: `read at ${r.readAt} (this browser's clock)`, href: EVIDENCE_MANIFEST_URL });
  return rows;
}

/** Census as_of: the census series among the evidence records, each with its own as_of. */
export function censusRows(r: Read<EvidenceManifest>): FeedRow[] {
  const g = "Census as_of";
  const label = "Census records";
  if (!r.ok) return [unmeasured(g, label, r.error, r.readAt, EVIDENCE_MANIFEST_URL)];
  const out: FeedRow[] = [];
  for (const rec of r.body.records ?? []) {
    if (!/census/.test(rec.dataset)) continue;
    const cur = rec.versions?.find((v) => v.state === "CURRENT");
    if (!cur) continue;
    out.push({
      group: g,
      label: `csoai/${rec.dataset}`,
      state: "OK",
      observation: `as_of ${cur.as_of} · read_state ${cur.read_state ?? "not stated"}. A PARTIAL read is never a population total.`,
      observedAt: cur.as_of,
      observedFrom: "the record's own as_of",
      href: cur.page,
    });
  }
  if (!out.length) out.push({ group: g, label, state: "UNAVAILABLE", observation: "No census record is published in the manifest.", observedAt: null, observedFrom: `read at ${r.readAt} (this browser's clock)`, href: EVIDENCE_MANIFEST_URL });
  return out;
}

// OpenTimestamps tags (python-opentimestamps core/notary.py); a proof is classified from its bytes.
const OTS_MAGIC = [0x00, 0x4f, 0x70, 0x65, 0x6e, 0x54, 0x69, 0x6d, 0x65, 0x73, 0x74, 0x61, 0x6d, 0x70, 0x73, 0x00, 0x00, 0x50, 0x72, 0x6f, 0x6f, 0x66, 0x00, 0xbf, 0x89, 0xe2, 0xe8, 0x84, 0xe8, 0x92, 0x94];
const TAG_BITCOIN = [0x05, 0x88, 0x96, 0x0d, 0x73, 0xd7, 0x19, 0x01];
const TAG_PENDING = [0x83, 0xdf, 0xe3, 0x0d, 0x2e, 0xf9, 0x0c, 0x8e];

function indexOf(hay: Uint8Array, needle: number[]): number {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

export type OtsState = "BITCOIN_ATTESTATION_IN_PROOF" | "PENDING_CALENDAR_COMMITMENT" | "NO_ATTESTATION_IN_PROOF" | "NOT_AN_OTS_PROOF";

export function otsStateOfBytes(b: Uint8Array): OtsState {
  if (b.length < OTS_MAGIC.length || OTS_MAGIC.some((x, i) => b[i] !== x)) return "NOT_AN_OTS_PROOF";
  if (indexOf(b, TAG_BITCOIN) !== -1) return "BITCOIN_ATTESTATION_IN_PROOF";
  if (indexOf(b, TAG_PENDING) !== -1) return "PENDING_CALENDAR_COMMITMENT";
  return "NO_ATTESTATION_IN_PROOF";
}

/** The proof URL to read for a record: the upgraded proof when one is published, else the original. */
export function proofUrlsFrom(r: Read<EvidenceManifest>): string[] {
  if (!r.ok) return [];
  const urls: string[] = [];
  for (const rec of r.body.records ?? []) {
    const cur = rec.versions?.find((v) => v.state === "CURRENT");
    const u = cur?.ots?.upgraded_proof_url ?? cur?.ots?.proof_url;
    if (typeof u === "string") urls.push(u);
  }
  return urls;
}

/** Timestamps: the site's own proof manifest, and the evidence records' proofs read as bytes now. */
export function timestampRows(site: Read<SiteOtsManifest>, proofs: Array<Read<Uint8Array>>, manifest: Read<EvidenceManifest>): FeedRow[] {
  const g = "Timestamps";
  const rows: FeedRow[] = [];
  const siteLabel = "Site timestamp proofs (/interop/ots/manifest.json)";
  if (!site.ok) rows.push(unmeasured(g, siteLabel, site.error, site.readAt, SITE_OTS_MANIFEST_URL));
  else {
    const c = site.body.counts ?? {};
    const has = typeof c.bitcoin_attested === "number" && typeof c.calendar_pending === "number" && typeof c.proofs === "number";
    rows.push(
      has
        ? {
            group: g,
            label: siteLabel,
            state: "OK",
            observation: `${c.proofs} proof(s) that parse: ${c.bitcoin_attested} Bitcoin-attested, ${c.calendar_pending} calendar-pending. Pending is a submitted request, not an anchor.`,
            observedAt: typeof site.body.as_of === "string" ? site.body.as_of : null,
            observedFrom: typeof site.body.as_of === "string" ? "/interop/ots/manifest.json → as_of" : `read at ${site.readAt} (this browser's clock)`,
            href: SITE_OTS_MANIFEST_URL,
          }
        : unmeasured(g, siteLabel, "answered, but counts.proofs / bitcoin_attested / calendar_pending are missing", site.readAt, SITE_OTS_MANIFEST_URL),
    );
  }
  const evLabel = "Evidence record proofs (each proof's bytes read by this browser now)";
  if (!manifest.ok) {
    rows.push(unmeasured(g, evLabel, manifest.error, manifest.readAt, EVIDENCE_MANIFEST_URL));
    return rows;
  }
  if (!proofs.length) {
    rows.push({ group: g, label: evLabel, state: "UNAVAILABLE", observation: "No evidence record publishes a proof.", observedAt: null, observedFrom: `read at ${manifest.readAt} (this browser's clock)`, href: EVIDENCE_MANIFEST_URL });
    return rows;
  }
  const read = proofs.filter((p): p is Extract<Read<Uint8Array>, { ok: true }> => p.ok);
  if (!read.length) {
    rows.push(unmeasured(g, evLabel, "none of the proofs could be read", manifest.readAt, EVIDENCE_MANIFEST_URL));
    return rows;
  }
  const counts = countBy(read.map((p) => otsStateOfBytes(p.body)));
  const partial = read.length < proofs.length;
  rows.push({
    group: g,
    label: evLabel,
    state: partial ? "DEGRADED" : "OK",
    observation: `${read.length} of ${proofs.length} proof(s) read: ${fmtCounts(counts)}.${partial ? " The rest could not be read and are not counted either way." : ""} A Bitcoin tag in the bytes is not a block-header check.`,
    observedAt: null,
    observedFrom: `read at ${read[0].readAt} (this browser's clock)`,
    href: EVIDENCE_MANIFEST_URL,
  });
  return rows;
}
