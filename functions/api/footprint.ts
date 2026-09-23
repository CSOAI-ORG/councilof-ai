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
import registryCensus from "../../public/interop/mcp-registry-2026-09-23/census.json";

export const SCHEMA = "csoai.footprint/0.1";
export const TTL_SECONDS = 3600;
export const FETCH_TIMEOUT_MS = 8000;
export const REGISTRY_CENSUS_PATH = "/interop/mcp-registry-2026-09-23/census.json";
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
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number | null; reason: string };

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
 *  and version rows. The API reads its committed bytes; it never turns a 25 s request budget into
 *  a misleading partial population. An old measurement remains visible but explicitly STALE. */
export function registryListings(nowIso: string, art: unknown = registryCensus): Row {
  const base = {
    kind: KIND_SELF_LISTING,
    source_url: REGISTRY_CENSUS_PATH,
    upstream_url: REGISTRY_SEARCH,
    artifact: REGISTRY_CENSUS_PATH,
    max_age_hours: REGISTRY_CENSUS_MAX_AGE_HOURS,
    freshness_policy: "endpoint policy; the census artifact itself declares no max age",
  };
  if (!art || typeof art !== "object") return uncheckable("registry census is absent or malformed", base);
  const census = art as Record<string, unknown>;
  if (census.schema !== "csoai.mcp-registry-census/0.1" ||
      census.kind !== "measurement" ||
      census.registry !== "https://registry.modelcontextprotocol.io" ||
      census.namespace !== "io.github.CSOAI-ORG") {
    return uncheckable("registry census schema, kind, registry or namespace does not match", base);
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
    age_hours: Math.round(age * 10) / 10,
    ...base,
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

/** One measured window out of the artifact. Never re-states a number the artifact did not carry. */
export function artifactRow(
  art: DistributionArtifact,
  pick: (a: DistributionArtifact) => ArtifactRow | undefined,
  label: string,
  nowIso: string,
): Row {
  const base = {
    kind: KIND_THIRD_PARTY,
    measured_by: art.generator ?? "unknown generator",
    artifact: DISTRIBUTION_PATH,
    artifact_schema: art.schema ?? null,
    artifact_as_of: art.as_of ?? null,
    max_age_hours: isNum(art.max_age_hours) ? art.max_age_hours : null,
  };
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

/**
 * gross_distribution: read out of the measured artifact, never fanned out from here.
 *
 * The headline `value` is the 30-day window, because that is the one every registry answers over
 * a comparable span. The cumulative figure is a DIFFERENT window and lives in its own row; the
 * two are never added. `by_registry` carries each registry's own pair, so a reader can see which
 * one is partial without the roll-up hiding it.
 */
export function grossDistribution(nowIso: string, art: DistributionArtifact = distribution as DistributionArtifact): Row {
  const thirty = artifactRow(art, (a) => a.totals?.downloads_30d, "gross_distribution 30-day", nowIso);
  const allTime = artifactRow(art, (a) => a.totals?.downloads_all_time, "gross_distribution cumulative", nowIso);
  const byRegistry: Record<string, { downloads_30d: Row; downloads_all_time: Row }> = {};
  for (const name of Object.keys(art.registries ?? {})) {
    byRegistry[name] = {
      downloads_30d: artifactRow(art, (a) => a.registries?.[name]?.downloads_30d, `${name} 30-day`, nowIso),
      downloads_all_time: artifactRow(art, (a) => a.registries?.[name]?.downloads_all_time, `${name} cumulative`, nowIso),
    };
  }
  return {
    ...thirty,
    downloads_30d: thirty,
    downloads_all_time: allTime,
    windows_rule:
      art.window_rule ??
      "30-day and cumulative are different windows over the same packages and are never added to each other.",
    by_registry: byRegistry,
    by_entity: art.by_entity ?? null,
    package_list: PACKAGES_PATH,
    package_list_totals: (art.package_list as { totals?: unknown } | undefined)?.totals ?? (packages as { totals?: unknown }).totals ?? null,
    evidence_url: DISTRIBUTION_PATH,
    measurement_requests: art.requests ?? null,
    note:
      "Gross. Mirrors, CI installs and crawlers are in this number. It is not a count of people. " +
      `Measured package by package on the pod and read out here; every package's own figure is in ${DISTRIBUTION_PATH}.`,
  };
}

// ── same-origin rows ──────────────────────────────────────────────────────────
export async function economicUse(deps: Deps): Promise<Row> {
  const url = new URL("/api/revenue", deps.origin).toString();
  const got = await fetchJson(deps, url);
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

export async function repeatPayers(deps: Deps): Promise<Row> {
  const url = new URL("/api/revenue", deps.origin).toString();
  return unmeasured(
    "/api/revenue publishes distinct payers and settlement totals, not per-wallet settlement counts; " +
      "a repeat payer cannot be derived from what it exposes, and nothing else records one.",
    { unit: "wallets that paid more than once", source_url: url },
  );
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
  const [economic_use, repeat_payers, boardRow, signed_cards, github_stars] =
    await Promise.all([economicUse(deps), repeatPayers(deps), board(deps), signedCards(deps), githubStars(deps)]);
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
