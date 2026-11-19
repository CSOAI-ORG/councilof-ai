/**
 * GET /api/footprint — the adoption funnel, one stage per row, nothing summed across stages.
 *
 *   registry_listings  → gross_distribution → qualified_distribution → observed_execution
 *                      → economic_use → repeat_payers → institutional_use
 *
 * A download is not a user, a user is not an execution, an execution is not a customer, and a
 * customer is not a recurring customer. Each stage is read from its own source and carries
 * source_url + as_of. Where no source exists the stage is UNMEASURED; where a source exists but
 * did not answer it is UNCHECKABLE, value null. There is no 0 anywhere in this file that was not
 * read from an upstream body.
 *
 * gross_distribution is NOT fanned out from here. Until 2026-09-22 it was: the request walked a
 * five-name PyPI list inside the Cloudflare request, four names answered `http 429`, and the
 * endpoint published `PARTIAL, 69307` — a lower bound over one package, offered as the estate's
 * distribution. The confirmed list is 397 PyPI + 324 npm + 111 Hugging Face rows (see
 * /interop/footprint-packages.json, enumerated from each registry's own ownership record). Seven
 * hundred paced fetches cannot happen inside one request, so the pod loop
 * scripts/distribution-measure.py measures them once a day into /interop/distribution-latest.json
 * and this endpoint reads that artifact out, with the artifact's own as_of and a STALE state when
 * it is older than the max age the artifact itself declares. No number here is typed.
 *
 * gross_distribution heads with CSOAI's own figures (19 Nov 2026). CSOAI Ltd and MEOK AI Labs
 * publish from one account, and the census labels every package with its entity. Until then this
 * row headed with the census's `totals`, which count every row of the account (MEOK AI Labs +
 * CSOAI + joint + unattributed), while the home page and /llms.txt headed with CSOAI's own
 * figures and the census's rule says the two entities' figures are never added. The row now
 * follows that rule too; grossDistribution says how.
 *
 * registry_listings also reads an off-edge, cursor-exhausted measurement instead of walking the
 * MCP Registry during a Cloudflare request. The dated census is labelled STALE after 48 hours;
 * it is never passed off as a fresh registry read. Every remaining upstream read has its own
 * try/catch and an 8 s timeout, so one slow source cannot take the others down or turn them
 * into zeros. The whole payload is cached in memory for
 * an hour and served with `cache-control: public, max-age=3600`; `as_of` is the moment the reads
 * were made, not the moment the cached copy was served.
 *
 * Third-party counters (PyPI, npm, Hugging Face) include mirror and automated traffic. They are
 * published as gross and labelled so; nothing here multiplies them by a sample ratio, and the
 * 30-day and cumulative windows are carried separately and never added.
 *
 * Doctrine: council-os/QUOTING-NUMBERS.md. We measure; we issue no marks.
 */

/// <reference types="@cloudflare/workers-types" />

import packages from "../../public/interop/footprint-packages.json";
import distribution from "../../public/interop/distribution-latest.json";
import registryLatest from "../../public/interop/mcp-registry-latest.json";
import { headFromGet } from "./_head";

export const SCHEMA = "csoai.footprint/0.1";
export const TTL_SECONDS = 3600;
export const FETCH_TIMEOUT_MS = 8000;
export const REGISTRY_CENSUS_PATH = "/interop/mcp-registry-latest.json";
/** Endpoint freshness policy: a dated registry measurement is still evidence after this age,
 *  but readers must see STALE first. It does not create a new measurement. */
export const REGISTRY_CENSUS_MAX_AGE_HOURS = 48;
export const REGISTRY_SEARCH =
  "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG&limit=100&version=latest";
export const REGISTRY_PREFIX = "io.github.CSOAI-ORG/";
export const HF_DATASETS = "https://huggingface.co/api/datasets?author=csoai&expand[]=downloads&limit=1000";
export const GITHUB_REPO = "https://api.github.com/repos/CSOAI-ORG/councilof-ai";
export const PACKAGES_PATH = "/interop/footprint-packages.json";
export const DISTRIBUTION_PATH = "/interop/distribution-latest.json";

export const HONESTY =
  "Gross counts are published separately from mirror-adjusted and economically verified adoption, " +
  "because downloads are not users and users are not customers.";

const KIND_THIRD_PARTY = "third-party counter (includes mirror/automated traffic)";
const KIND_SELF_LISTING = "self-published listing";

/** READ: the source answered and the value is its number. PARTIAL: some of a fan-out answered
 *  and the value is a lower bound over what did. STALE: a measured artifact was read, but it is
 *  older than its declared or endpoint-specified max age — the number is real and out of date,
 *  and both facts travel together. UNCHECKABLE: a source exists and did not answer. UNMEASURED:
 *  no source exists. */
export type RowState = "READ" | "PARTIAL" | "STALE" | "UNCHECKABLE" | "UNMEASURED";

export interface Row {
  state: RowState;
  value: number | string | null;
  unit?: string;
  kind?: string;
  source_url?: string | string[];
  as_of: string | null;
  reason?: string;
  [extra: string]: unknown;
}

type Fetched =
  | { ok: true; status: number; body: unknown; reason?: never }
  | { ok: false; status: number | null; reason: string; body?: never };

export interface Deps {
  fetch: typeof fetch;
  /** ISO timestamp of "now" — injectable so a test can pin as_of. */
  now: () => string;
  /** Same-origin base for /api/revenue, /api/gspc, /api/state. */
  origin: string;
}

/** One upstream read, its own try/catch, its own timeout. Never throws. */
export async function fetchJson(
  deps: Deps,
  url: string,
  headers: Record<string, string> = {},
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<Fetched> {
  try {
    const r = await deps.fetch(url, {
      headers: { accept: "application/json", "user-agent": "councilof.ai footprint (nicholas@csoai.org)", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!r.ok) return { ok: false, status: r.status, reason: `http ${r.status}` };
    const text = await r.text();
    try {
      return { ok: true, status: r.status, body: JSON.parse(text) };
    } catch {
      return { ok: false, status: r.status, reason: "not json" };
    }
  } catch (e) {
    const msg = (e as Error)?.name === "TimeoutError" ? `timeout after ${timeoutMs}ms` : (e as Error)?.message ?? "unknown";
    return { ok: false, status: null, reason: `fetch failed: ${msg}` };
  }
}

const uncheckable = (reason: string, extra: Record<string, unknown> = {}): Row => ({
  state: "UNCHECKABLE",
  value: null,
  as_of: null,
  reason,
  ...extra,
});

const unmeasured = (reason: string, extra: Record<string, unknown> = {}): Row => ({
  state: "UNMEASURED",
  value: null,
  as_of: null,
  reason,
  ...extra,
});

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

// ── registry_listings ─────────────────────────────────────────────────────────
/** The off-edge census walks the registry to cursor exhaustion and records both distinct names
 *  and version rows. The API reads a staged pointer whose source, digest and measured fields are
 *  checked against immutable source bytes before a guarded site build. It never turns a 25 s
 *  request budget into a misleading partial population. An old measurement remains STALE. */
export function registryListings(nowIso: string, art: unknown = registryLatest): Row {
  const base = {
    kind: KIND_SELF_LISTING,
    source_url: REGISTRY_CENSUS_PATH,
    latest_url: REGISTRY_CENSUS_PATH,
    upstream_url: REGISTRY_SEARCH,
    artifact: REGISTRY_CENSUS_PATH,
    max_age_hours: REGISTRY_CENSUS_MAX_AGE_HOURS,
    freshness_policy: "endpoint policy; the census artifact itself declares no max age",
  };
  if (!art || typeof art !== "object") return uncheckable("registry census is absent or malformed", base);
  const census = art as Record<string, unknown>;
  if (census.schema !== "csoai.mcp-registry-latest/0.1" ||
      census.registry !== "https://registry.modelcontextprotocol.io" ||
      census.namespace !== "io.github.CSOAI-ORG") {
    return uncheckable("registry pointer schema, registry or namespace does not match", base);
  }
  const source = census.source_artifact;
  const digest = census.source_sha256;
  if (typeof source !== "string" || !/^\/interop\/mcp-registry-(?:\d{4}-\d{2}-\d{2}\/census|census\/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z)\.json$/.test(source) ||
      typeof digest !== "string" || !/^[0-9a-f]{64}$/.test(digest) ||
      typeof census.source_bytes !== "number" || !Number.isSafeInteger(census.source_bytes) || census.source_bytes <= 0) {
    return uncheckable("registry pointer lacks a valid immutable source and checksum", base);
  }
  const count = census.servers;
  const completed = census.completed_utc;
  const measured = census.measured_utc;
  if (typeof count !== "number" || !Number.isSafeInteger(count) || count < 0 ||
      typeof completed !== "string" || typeof measured !== "string" ||
      !Number.isFinite(Date.parse(completed)) || !Number.isFinite(Date.parse(measured)) ||
      Date.parse(completed) < Date.parse(measured)) {
    return uncheckable("registry census count or measurement timestamps are invalid", base);
  }
  const age = ageHours(completed, nowIso);
  if (age === null || age < -1) return uncheckable("registry census age is invalid", base);
  const failures = census.version_read_failures;
  const versionsComplete = Array.isArray(failures) && failures.length === 0 &&
    typeof census.version_rows === "number" && Number.isSafeInteger(census.version_rows) && census.version_rows >= 0;
  const stale = age > REGISTRY_CENSUS_MAX_AGE_HOURS;
  return {
    state: stale ? "STALE" : "READ",
    value: count,
    unit: "distinct server names",
    versions: versionsComplete ? census.version_rows : null,
    versions_state: versionsComplete ? "READ" : "UNCHECKABLE",
    versions_unit: "distinct name@version listings",
    population: `servers named ${REGISTRY_PREFIX}* in the MCP Registry census`,
    as_of: completed,
    measured_from: measured,
    artifact_schema: census.schema,
    ...base,
    source_url: source,
    source_sha256: digest,
    age_hours: Math.round(age * 10) / 10,
    ...(stale ? { reason: `registry census measured ${age.toFixed(1)} h ago, past this endpoint's ${REGISTRY_CENSUS_MAX_AGE_HOURS} h freshness policy` } : {}),
    note: "A listing we published ourselves. It says a server is registered, not that anyone runs it.",
  };
}

// ── gross_distribution ────────────────────────────────────────────────────────
/** The shape scripts/distribution-measure.py writes. Only the fields this endpoint reads. */
interface ArtifactRow {
  state?: string;
  value?: number | null;
  unit?: string;
  window?: string;
  covered?: number;
  attempted?: number;
  as_of?: string | null;
  source_url?: unknown;
  reason?: string;
  [extra: string]: unknown;
}

interface DistributionArtifact {
  schema?: string;
  as_of?: string;
  max_age_hours?: number;
  generator?: string;
  package_list?: Record<string, unknown>;
  window_rule?: string;
  registries?: Record<string, { downloads_30d?: ArtifactRow; downloads_all_time?: ArtifactRow }>;
  totals?: { downloads_30d?: ArtifactRow; downloads_all_time?: ArtifactRow };
  by_entity?: Record<string, unknown>;
  packages?: unknown[];
  requests?: Record<string, unknown>;
}

const ARTIFACT_STATES = new Set(["READ", "PARTIAL", "UNCHECKABLE", "UNMEASURED"]);

export function ageHours(asOf: string | undefined, nowIso: string): number | null {
  if (!asOf) return null;
  const a = Date.parse(asOf);
  const n = Date.parse(nowIso);
  if (!Number.isFinite(a) || !Number.isFinite(n)) return null;
  return (n - a) / 3_600_000;
}

/** What every row read out of the artifact says about where it came from. */
function artifactBase(art: DistributionArtifact) {
  return {
    kind: KIND_THIRD_PARTY,
    measured_by: art.generator ?? "unknown generator",
    artifact: DISTRIBUTION_PATH,
    artifact_schema: art.schema ?? null,
    artifact_as_of: art.as_of ?? null,
    max_age_hours: isNum(art.max_age_hours) ? art.max_age_hours : null,
  };
}

/** One measured window out of the artifact. Never re-states a number the artifact did not carry. */
export function artifactRow(
  art: DistributionArtifact,
  pick: (a: DistributionArtifact) => ArtifactRow | undefined,
  label: string,
  nowIso: string,
): Row {
  const base = artifactBase(art);
  const r = pick(art);
  if (!r || typeof r !== "object") {
    return uncheckable(`${label}: ${DISTRIBUTION_PATH} carries no row for this window`, base);
  }
  const state = typeof r.state === "string" && ARTIFACT_STATES.has(r.state) ? r.state : null;
  if (!state) return uncheckable(`${label}: the artifact row carries no state this endpoint knows`, { ...base, artifact_state: r.state ?? null });
  if (state === "UNMEASURED") return unmeasured(r.reason ?? `${label}: the artifact says UNMEASURED`, { ...base, ...passThrough(r) });
  if (state === "UNCHECKABLE" || !isNum(r.value)) {
    return uncheckable(r.reason ?? `${label}: the artifact carries no number for this window`, { ...base, ...passThrough(r) });
  }
  const age = ageHours(art.as_of, nowIso);
  const max = isNum(art.max_age_hours) ? art.max_age_hours : null;
  const stale = age !== null && max !== null && age > max;
  const out: Row = {
    // STALE outranks PARTIAL: an out-of-date number is the first thing a reader must know.
    state: stale ? "STALE" : (state as RowState),
    value: r.value,
    // The artifact's as_of, not this request's. A cached measurement is not a fresh one.
    as_of: r.as_of ?? art.as_of ?? null,
    ...base,
    ...passThrough(r),
    age_hours: age === null ? null : Math.round(age * 10) / 10,
    ...(stale
      ? {
          reason:
            `measured ${age === null ? "?" : age.toFixed(1)} h ago, past the ${max} h the artifact declares; ` +
            `the number is what was measured then, not now` +
            (r.reason ? ` — and when it was taken: ${r.reason}` : ""),
          measured_state: state,
        }
      : r.reason
        ? { reason: r.reason }
        : {}),
  };
  return out;
}

function passThrough(r: ArtifactRow): Record<string, unknown> {
  const keep: Record<string, unknown> = {};
  for (const k of ["unit", "window", "covered", "attempted", "source_url", "method", "registries_covered", "registries_missing", "registries_partial", "packages_proven_to_cover_all_time", "proven_note"]) {
    if (r[k] !== undefined) keep[k] = r[k];
  }
  return keep;
}

// ── gross_distribution's headline: CSOAI's own pair ───────────────────────────
/** The entity whose figures head gross_distribution, and the scope the headline is stated under. */
export const HEADLINE_ENTITY = "csoai";
export const HEADLINE_SCOPE = "CSOAI packages";

const WINDOWS = ["downloads_30d", "downloads_all_time"] as const;
type WindowKey = (typeof WINDOWS)[number];
const WINDOW_LABEL: Record<WindowKey, string> = { downloads_30d: "30-day", downloads_all_time: "cumulative" };

export const ENTITY_RULE =
  "CSOAI Ltd and MEOK AI Labs are separate entities publishing from one account, and the census labels every package with its entity. " +
  "The headline, downloads_30d and downloads_all_time are CSOAI's own figures, read from by_entity.*.csoai, and they are published only " +
  "when both of CSOAI's windows are readable and dated like the census, the rule the home page and /llms.txt follow. " +
  "MEOK AI Labs' figures are in by_entity.*.meok under their own label and are never added to CSOAI's. " +
  "Packages labelled joint or unattributed are in neither figure. The census's totals count every row of the account, " +
  "so they are neither entity's figure and are not a headline here.";

export const BY_REGISTRY_SCOPE =
  "Each registry's pair counts every package row the account publishes on that registry: CSOAI, MEOK AI Labs, joint and " +
  "unattributed. It is neither entity's figure.";

/**
 * A by_entity count as the home page and /llms.txt read one (count() in HomeDistribution.tsx and in
 * scripts/llms-txt-distribution.mjs): a state that carries a number, a non-negative safe-integer
 * value, safe-integer coverage with covered <= attempted, and a parseable as_of. Null otherwise.
 * Those two also accept STALE. The census never writes it (its states are READ, PARTIAL,
 * UNCHECKABLE and UNMEASURED; STALE is this endpoint's verdict on age), so here, as everywhere in
 * this file, a row the artifact marks STALE carries a state this endpoint does not know.
 */
function entityCount(row: unknown): ArtifactRow | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const r = row as ArtifactRow;
  if (r.state !== "READ" && r.state !== "PARTIAL") return null;
  if (typeof r.value !== "number" || !Number.isSafeInteger(r.value) || r.value < 0) return null;
  const { covered, attempted } = r;
  if (typeof covered !== "number" || typeof attempted !== "number") return null;
  if (!Number.isSafeInteger(covered) || !Number.isSafeInteger(attempted) || covered < 0 || covered > attempted) return null;
  if (typeof r.as_of !== "string" || !Number.isFinite(Date.parse(r.as_of))) return null;
  return r;
}

/** The census's unit and window for one column. They describe what was counted over which span,
 *  not whose packages, so they hold for an entity's figure in that column too. */
function windowColumns(t: ArtifactRow | undefined): ArtifactRow {
  const out: ArtifactRow = {};
  if (t && typeof t === "object") {
    if (typeof t.unit === "string") out.unit = t.unit;
    if (typeof t.window === "string") out.window = t.window;
  }
  return out;
}

/**
 * One entity's two windows out of by_entity, published as a pair or not at all.
 *
 * The rule is the home page's (entityWindows in HomeDistribution.tsx) and /llms.txt's: an entity's
 * figures are printed only when BOTH windows are readable counts dated like the census (as_of equal
 * to the census's own). Then each window goes through artifactRow like every other row here, so
 * READ, PARTIAL and STALE mean what they mean everywhere in this file. Otherwise neither window is
 * published: one the census marks UNMEASURED or UNCHECKABLE keeps that state and its reason, every
 * other one is UNCHECKABLE with value null and says why, and the account total is never put in
 * its place. Every row names its scope, its entity and the by_entity field it was read from.
 */
export function entityWindows(
  art: DistributionArtifact,
  nowIso: string,
  entity: string = HEADLINE_ENTITY,
  scope: string = HEADLINE_SCOPE,
): Record<WindowKey, Row> {
  const by = art.by_entity;
  const raw = (w: WindowKey): unknown => {
    const block = by && typeof by === "object" ? (by as Record<string, unknown>)[w] : undefined;
    return block && typeof block === "object" ? (block as Record<string, unknown>)[entity] : undefined;
  };
  const fit = (w: WindowKey): ArtifactRow | null => {
    const r = entityCount(raw(w));
    return r && r.as_of === art.as_of ? r : null;
  };
  const ok: Record<WindowKey, ArtifactRow | null> = { downloads_30d: fit("downloads_30d"), downloads_all_time: fit("downloads_all_time") };
  const out = {} as Record<WindowKey, Row>;
  for (const w of WINDOWS) {
    const label = `${scope}, ${WINDOW_LABEL[w]}`;
    const tag = { scope, entity, source_field: `by_entity.${w}.${entity}` };
    const columns = windowColumns(art.totals?.[w]);
    const mine = ok[w];
    if (mine && ok[w === "downloads_30d" ? "downloads_all_time" : "downloads_30d"]) {
      out[w] = { ...artifactRow(art, () => ({ ...columns, ...mine }), label, nowIso), ...tag };
      continue;
    }
    const x = raw(w);
    const said = artifactRow(art, () => (x && typeof x === "object" && !Array.isArray(x) ? { ...columns, ...(x as ArtifactRow) } : undefined), label, nowIso);
    if (said.state === "UNMEASURED" || said.state === "UNCHECKABLE") {
      out[w] = { ...said, ...tag };
      continue;
    }
    out[w] = uncheckable(
      mine
        ? `${label}: the other window is not a readable count dated like the census, and the two windows are published together or not at all; nothing is put in their place`
        : `${label}: by_entity carries no readable count dated like the census (as_of ${art.as_of ?? "absent"}) for this window; nothing is put in its place`,
      { ...artifactBase(art), ...columns, ...tag },
    );
  }
  return out;
}

/**
 * gross_distribution: read out of the measured artifact, never fanned out from here.
 *
 * CSOAI'S OWN FIGURES HEAD IT (19 Nov 2026). The headline, `downloads_30d` and `downloads_all_time`
 * are the census's by_entity.*.csoai pair, stated under the scope "CSOAI packages", by the rule the
 * home page (client/src/components/home/HomeDistribution.tsx, #4455) and /llms.txt
 * (scripts/llms-txt-distribution.mjs, #4463) follow; see entityWindows. Live on 19 Nov 2026 this row
 * still headed with the census's `totals`, 771,433 over 30 days and 3,852,241 since first release,
 * which count every row of the account: MEOK AI Labs + CSOAI + joint + unattributed. MEOK AI Labs
 * keeps its own labelled figures in `by_entity`, the census's block as written, and nothing here
 * adds them to CSOAI's. The account total is no headline key; it stays in the census's `totals`, at
 * evidence_url.
 *
 * The headline `value` is the 30-day window, because that is the one every registry answers over
 * a comparable span. The cumulative figure is a DIFFERENT window and lives in its own row; the
 * two are never added. `by_registry` carries each registry's own pair, so a reader can see which
 * one is partial without the roll-up hiding it; each pair counts every row of the account on that
 * registry, and `by_registry_scope` says so.
 */
export function grossDistribution(nowIso: string, art: DistributionArtifact = distribution as DistributionArtifact): Row {
  const csoai = entityWindows(art, nowIso);
  const byRegistry: Record<string, { downloads_30d: Row; downloads_all_time: Row }> = {};
  for (const name of Object.keys(art.registries ?? {})) {
    byRegistry[name] = {
      downloads_30d: artifactRow(art, (a) => a.registries?.[name]?.downloads_30d, `${name} 30-day`, nowIso),
      downloads_all_time: artifactRow(art, (a) => a.registries?.[name]?.downloads_all_time, `${name} cumulative`, nowIso),
    };
  }
  return {
    ...csoai.downloads_30d,
    downloads_30d: csoai.downloads_30d,
    downloads_all_time: csoai.downloads_all_time,
    entity_rule: ENTITY_RULE,
    windows_rule:
      art.window_rule ??
      "30-day and cumulative are different windows over the same packages and are never added to each other.",
    by_registry: byRegistry,
    by_registry_scope: BY_REGISTRY_SCOPE,
    by_entity: art.by_entity ?? null,
    package_list: PACKAGES_PATH,
    package_list_totals: (art.package_list as { totals?: unknown } | undefined)?.totals ?? (packages as { totals?: unknown }).totals ?? null,
    evidence_url: DISTRIBUTION_PATH,
    measurement_requests: art.requests ?? null,
    note:
      "Gross. Mirrors, CI installs and crawlers are in this number. It is not a count of people. " +
      `It counts ${HEADLINE_SCOPE} only: MEOK AI Labs, a separate entity publishing from the same account, is in by_entity under its own label and is never added. ` +
      `Measured package by package on the pod and read out here; every package's own figure is in ${DISTRIBUTION_PATH}.`,
  };
}

// ── same-origin rows ──────────────────────────────────────────────────────────
export async function economicUse(deps: Deps, revenue?: Fetched): Promise<Row> {
  const url = new URL("/api/revenue", deps.origin).toString();
  const got = revenue ?? await fetchJson(deps, url);
  const base = {
    unit: "distinct non-self x402 payer wallets, all time",
    kind: "measured (settlement records)",
    source_url: url,
    definition: "one_number.all_time on /api/revenue — distinct payer wallets that are not ours and moved a non-zero amount",
  };
  if (!got.ok) return uncheckable(`/api/revenue: ${got.reason}`, base);
  const one = (got.body as { one_number?: Record<string, unknown> })?.one_number;
  if (!one) return uncheckable("/api/revenue carries no one_number", base);
  const v = one.all_time;
  if (!isNum(v)) {
    return uncheckable(`one_number is ${String(one.status ?? "absent")}: ${String(one.source ?? "no count")}`, base);
  }
  return {
    state: "READ",
    value: v,
    as_of: deps.now(),
    last_30d: isNum(one.last_30d) ? one.last_30d : null,
    ...base,
  };
}

export async function repeatPayers(deps: Deps, revenue?: Fetched): Promise<Row> {
  const url = new URL("/api/revenue", deps.origin).toString();
  const got = revenue ?? await fetchJson(deps, url);
  const base = {
    unit: "distinct non-self repeat payer wallets, all time",
    kind: "measured (settlement records)",
    source_url: url,
    source_field: "one_number.repeat_nonself_payers",
    last_30d: null,
  };
  if (!got.ok) return uncheckable(`/api/revenue: ${got.reason}`, base);
  const one = (got.body as { one_number?: Record<string, unknown> } | null)?.one_number;
  if (!one || typeof one !== "object" || Array.isArray(one) || one.status !== "MEASURED") {
    return uncheckable("/api/revenue carries no measured one_number repeat count", base);
  }
  const repeat = one.repeat_nonself_payers as Record<string, unknown> | undefined;
  const count = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
  if (!repeat || typeof repeat !== "object" || Array.isArray(repeat) ||
      !count(repeat.all_time) || !count(repeat.last_30d) || repeat.last_30d > repeat.all_time ||
      typeof repeat.definition !== "string" || !repeat.definition.trim()) {
    return uncheckable("/api/revenue carries malformed or unmeasured repeat_nonself_payers", base);
  }
  return {
    ...base,
    state: "READ",
    value: repeat.all_time,
    last_30d: repeat.last_30d,
    definition: repeat.definition,
    as_of: deps.now(),
    as_of_field: "read time (upstream carries no count measurement timestamp)",
  };
}

export async function board(deps: Deps): Promise<Row> {
  const url = new URL("/api/gspc", deps.origin).toString();
  const got = await fetchJson(deps, url);
  const base = { kind: "measured (board totals)", source_url: url };
  if (!got.ok) return uncheckable(`/api/gspc: ${got.reason}`, base);
  const b = got.body as Record<string, unknown>;
  const t = (b.totals ?? {}) as Record<string, unknown>;
  if (typeof t.public_count !== "string") return uncheckable("/api/gspc carries no totals.public_count", base);
  const asOfField = ["as_of", "generated_at", "generated", "built_at"].find((k) => typeof b[k] === "string") ?? null;
  return {
    state: "READ",
    value: t.public_count,
    axes: isNum(t.axes) ? t.axes : null,
    measured_axes: isNum(t.measured_axes) ? t.measured_axes : null,
    unmeasured_axes: isNum(t.unmeasured_axes) ? t.unmeasured_axes : null,
    as_of: asOfField ? (b[asOfField] as string) : deps.now(),
    as_of_field: asOfField ?? "read time (payload carries no as_of)",
    ...base,
  };
}

export async function signedCards(deps: Deps): Promise<Row> {
  const url = new URL("/api/state", deps.origin).toString();
  const got = await fetchJson(deps, url);
  const base = { unit: "signed card bodies that verify", kind: "measured (verifier run)", source_url: url };
  if (!got.ok) return uncheckable(`/api/state: ${got.reason}`, base);
  const fact = (got.body as { card_chain?: { bodies_verified_valid?: Record<string, unknown> } })?.card_chain?.bodies_verified_valid;
  if (!fact || !isNum(fact.value)) return uncheckable("/api/state carries no card_chain.bodies_verified_valid number", base);
  return {
    state: "READ",
    value: fact.value,
    as_of: typeof fact.as_of === "string" ? fact.as_of : deps.now(),
    as_of_field: typeof fact.as_of_field === "string" ? fact.as_of_field : "read time",
    ...base,
    kind: typeof fact.kind === "string" ? fact.kind : base.kind,
  };
}

export async function githubStars(deps: Deps): Promise<Row> {
  const got = await fetchJson(deps, GITHUB_REPO);
  const base = {
    population: "councilof-ai repository stars at T",
    unit: "stargazers",
    kind: KIND_THIRD_PARTY,
    source_url: GITHUB_REPO,
  };
  if (!got.ok) return uncheckable(`api.github.com: ${got.reason}`, { ...base, http_status: got.status });
  const v = (got.body as { stargazers_count?: unknown })?.stargazers_count;
  if (!isNum(v)) return uncheckable("api.github.com: stargazers_count absent", base);
  return { state: "READ", value: v, as_of: deps.now(), ...base };
}

// ── the funnel ────────────────────────────────────────────────────────────────
export const FUNNEL_ORDER = [
  "registry_listings",
  "gross_distribution",
  "qualified_distribution",
  "observed_execution",
  "economic_use",
  "repeat_payers",
  "institutional_use",
] as const;

export async function buildFootprint(deps: Deps) {
  const nowIso = deps.now();
  const registry_listings = registryListings(nowIso);
  // Both settlement rows use one read so they describe the same upstream snapshot.
  const revenue = fetchJson(deps, new URL("/api/revenue", deps.origin).toString());
  const [economic_use, repeat_payers, boardRow, signed_cards, github_stars] =
    await Promise.all([
      revenue.then((got) => economicUse(deps, got)),
      revenue.then((got) => repeatPayers(deps, got)),
      board(deps), signedCards(deps), githubStars(deps),
    ]);
  // No network: the 832 per-package counters were measured on the pod, once, into the artifact.
  const gross_distribution = grossDistribution(nowIso);

  const qualified_distribution = unmeasured(
    "No mirror-adjusted counter exists for the fleet. A sample is not a rate to multiply by.",
    {
      unit: "downloads not attributable to mirrors or automation",
      sampled_note:
        "a sample of the four largest PyPI packages on 22 Sep 2026 showed 30–38% non-mirror downloads; a sample, not the fleet",
    },
  );

  const observed_execution = unmeasured(
    "No counter exists behind a verify-page execution, a tool call or an install being run: " +
      "/api/counters publishes verify_page_executions as UNPUBLISHED because nothing instruments it. " +
      "A number here would be invented.",
    { unit: "executions", source_url: new URL("/api/counters", deps.origin).toString() },
  );

  const institutional_use = unmeasured(
    "No register of institutions using the estate exists, and a download or a payer wallet does not identify one.",
    { unit: "institutions" },
  );

  return {
    schema: SCHEMA,
    as_of: deps.now(),
    as_of_meaning: "when this payload was assembled; each row carries its own source measurement time, and a cached copy may be served for up to ttl_seconds after",
    ttl_seconds: TTL_SECONDS,
    honesty: HONESTY,
    funnel: {
      order: [...FUNNEL_ORDER],
      rule: "Each stage is a separate measurement of a separate thing. Never add stages together and never derive a later stage from an earlier one.",
    },
    registry_listings,
    gross_distribution,
    qualified_distribution,
    observed_execution,
    economic_use,
    repeat_payers,
    institutional_use,
    board: boardRow,
    signed_cards,
    github_stars,
    package_list: PACKAGES_PATH,
    state_rule:
      "READ: the source answered and the value is its number. PARTIAL: part of a fan-out answered and the value is a lower bound. " +
        "STALE: a measured artifact was read and is older than its declared or endpoint-specified freshness limit. " +
      "UNCHECKABLE: a source exists and did not answer; value null, never 0. UNMEASURED: no source exists.",
    note: "Aggregate-only. No telemetry, no per-user data. We measure; we issue no marks.",
  };
}

// ── cache + handler ───────────────────────────────────────────────────────────
type Payload = Awaited<ReturnType<typeof buildFootprint>>;
let cached: { origin: string; builtAtMs: number; payload: Payload } | null = null;

/** Test hook. */
export function _resetCache(): void {
  cached = null;
}

export async function getFootprint(deps: Deps, nowMs = Date.now()): Promise<{ payload: Payload; cache: "HIT" | "MISS" }> {
  if (cached && cached.origin === deps.origin && nowMs - cached.builtAtMs < TTL_SECONDS * 1000) {
    return { payload: cached.payload, cache: "HIT" };
  }
  const payload = await buildFootprint(deps);
  cached = { origin: deps.origin, builtAtMs: nowMs, payload };
  return { payload, cache: "MISS" };
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  const origin = new URL(request.url).origin;
  const deps: Deps = {
    fetch: globalThis.fetch.bind(globalThis),
    now: () => new Date().toISOString(),
    origin,
  };
  const { payload, cache } = await getFootprint(deps);
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": `public, max-age=${TTL_SECONDS}`,
      "access-control-allow-origin": "*",
      "x-footprint-cache": cache,
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
