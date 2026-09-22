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
 * Every remaining upstream read has its own try/catch and an 8 s timeout, so one slow registry
 * cannot take the others down or turn them into zeros. The whole payload is cached in memory for
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

export const SCHEMA = "csoai.footprint/0.1";
export const TTL_SECONDS = 3600;
export const FETCH_TIMEOUT_MS = 8000;
// The official MCP registry answered the first page in >8 s from Cloudflare's edge on 2026-09-22
// (row read UNCHECKABLE with "timeout after 8000ms"); it gets its own, longer budget. Everything
// else keeps the 8 s cap so one slow counter cannot hold the whole payload.
export const REGISTRY_TIMEOUT_MS = 20000;
export const REGISTRY_PAGE_CAP = 20;
/** One page may fail transiently; the listing is only unread if a page fails every attempt. */
export const REGISTRY_PAGE_ATTEMPTS = 3;
export const REGISTRY_BACKOFF_MS = 400;
/** The whole registry walk, retries included. registry.modelcontextprotocol.io answered page 1 in
 *  64.6 s on 2026-09-22 (HTTP 200, 77,593 bytes, from the pod); the census that read all 14 pages
 *  ran off-edge. A walk that cannot finish inside this budget reports what it read as PARTIAL —
 *  it never holds the whole payload open, and it never turns the pages it did read into a null. */
export const REGISTRY_BUDGET_MS = 25000;
export const REGISTRY_SEARCH =
  "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG&limit=100";
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
 *  older than the max age it declares for itself — the number is real and out of date, and both
 *  facts travel together. UNCHECKABLE: a source exists and did not answer. UNMEASURED: no source
 *  exists. */
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
  /** Monotonic-ish milliseconds, for the registry walk's budget. Injectable so a test can pin it. */
  nowMs?: () => number;
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
/** A page, retried with backoff inside whatever is left of the walk's budget. One 20 s timeout on
 *  page 3 voided the whole count on 2026-09-22; a transient failure is not an unreadable registry,
 *  and neither is a budget that ran out. */
async function registryPage(deps: Deps, url: string, deadline: number, clock: () => number): Promise<{ got: Fetched; attempts: number }> {
  let got: Fetched = { ok: false, status: null, reason: "not attempted" };
  let attempts = 0;
  for (let attempt = 1; attempt <= REGISTRY_PAGE_ATTEMPTS; attempt++) {
    const left = deadline - clock();
    if (left <= 0) return { got, attempts };
    attempts = attempt;
    got = await fetchJson(deps, url, {}, Math.min(REGISTRY_TIMEOUT_MS, left));
    if (got.ok) return { got, attempts };
    const backoff = REGISTRY_BACKOFF_MS * 2 ** (attempt - 1);
    if (attempt < REGISTRY_PAGE_ATTEMPTS && deadline - clock() > backoff) {
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  return { got, attempts };
}

export async function registryListings(deps: Deps): Promise<Row> {
  const names = new Set<string>();
  const versions = new Set<string>();
  const clock = deps.nowMs ?? (() => Date.now());
  const deadline = clock() + REGISTRY_BUDGET_MS;
  let cursor: string | null = null;
  let pages = 0;
  let capHit = false;
  let budgetHit = false;
  let failure: { page: number; reason: string; attempts: number } | null = null;
  for (;;) {
    if (pages >= REGISTRY_PAGE_CAP) {
      capHit = true;
      break;
    }
    if (clock() >= deadline) {
      budgetHit = true;
      break;
    }
    const url = cursor ? `${REGISTRY_SEARCH}&cursor=${encodeURIComponent(cursor)}` : REGISTRY_SEARCH;
    const { got, attempts } = await registryPage(deps, url, deadline, clock);
    if (!got.ok) {
      // Every attempt at this page failed, or the budget ran out mid-page. What was read before it
      // is still read: report the partial count with the page it stopped on, never a null that
      // erases the pages that worked.
      failure = { page: pages + 1, reason: got.reason, attempts };
      break;
    }
    pages += 1;
    const body = got.body as { servers?: unknown[]; metadata?: Record<string, unknown> };
    for (const entry of Array.isArray(body.servers) ? body.servers : []) {
      const s = ((entry as { server?: Record<string, unknown> })?.server ?? entry) as Record<string, unknown>;
      const name = typeof s?.name === "string" ? s.name : "";
      if (!name.startsWith(REGISTRY_PREFIX)) continue;
      names.add(name);
      const version = typeof s.version === "string" ? s.version : "";
      versions.add(`${name}@${version}`);
    }
    const meta = body.metadata ?? {};
    const next = (meta.nextCursor ?? meta.next_cursor) as unknown;
    if (typeof next !== "string" || next === "" || next === cursor) break;
    cursor = next;
  }
  if (failure && pages === 0) {
    // Nothing was read at all: there is no lower bound to publish, only an unread source.
    return uncheckable(`registry page 1 failed ${failure.attempts} attempt(s): ${failure.reason}`, {
      kind: KIND_SELF_LISTING,
      source_url: REGISTRY_SEARCH,
      pages_read: 0,
      page_attempts: failure.attempts,
      page_attempt_cap: REGISTRY_PAGE_ATTEMPTS,
      budget_ms: REGISTRY_BUDGET_MS,
      distinct_names_before_failure: 0,
    });
  }
  const partial = capHit || budgetHit || failure !== null;
  return {
    state: partial ? "PARTIAL" : "READ",
    value: names.size,
    unit: "distinct server names",
    versions: versions.size,
    versions_unit: "distinct name@version listings",
    population: `servers named ${REGISTRY_PREFIX}* in the MCP Registry search result`,
    kind: KIND_SELF_LISTING,
    source_url: REGISTRY_SEARCH,
    as_of: deps.now(),
    pages_read: pages,
    page_cap: REGISTRY_PAGE_CAP,
    page_cap_hit: capHit,
    page_attempt_cap: REGISTRY_PAGE_ATTEMPTS,
    budget_ms: REGISTRY_BUDGET_MS,
    budget_exhausted: budgetHit || (failure?.attempts ?? 1) === 0,
    ...(partial ? { distinct_names_before_failure: names.size } : {}),
    ...(failure
      ? {
          failed_page: failure.page,
          reason:
            failure.attempts === 0
              ? `the ${REGISTRY_BUDGET_MS} ms budget ran out before page ${failure.page}; ` +
                `${names.size} names over ${pages} page(s) is a lower bound, not the listing`
              : `page ${failure.page} failed ${failure.attempts} attempt(s) (${failure.reason}); ` +
                `${names.size} names over ${pages} page(s) is a lower bound, not the listing`,
        }
      : budgetHit
        ? {
            reason: `the ${REGISTRY_BUDGET_MS} ms budget ran out after ${pages} page(s); ` +
              `${names.size} names is a lower bound, not the listing`,
          }
        : {}),
    ...(capHit ? { reason: `stopped at the ${REGISTRY_PAGE_CAP}-page cap; the count is a lower bound` } : {}),
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
  const [registry_listings, economic_use, repeat_payers, boardRow, signed_cards, github_stars] =
    await Promise.all([registryListings(deps), economicUse(deps), repeatPayers(deps), board(deps), signedCards(deps), githubStars(deps)]);
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
    as_of_meaning: "when the upstream reads for this payload were made; a cached copy may be served for up to ttl_seconds after",
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
        "STALE: a measured artifact was read and is older than the max age it declares for itself. " +
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
    nowMs: () => Date.now(),
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
