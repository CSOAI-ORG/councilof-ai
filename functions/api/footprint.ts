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
 * Every upstream read has its own try/catch and an 8 s timeout, so one slow registry cannot take
 * the others down or turn them into zeros. The whole payload is cached in memory for an hour and
 * served with `cache-control: public, max-age=3600`; `as_of` is the moment the reads were made,
 * not the moment the cached copy was served.
 *
 * Third-party counters (PyPI, npm, Hugging Face) include mirror and automated traffic. They are
 * published as gross and labelled so; nothing here multiplies them by a sample ratio.
 *
 * Doctrine: council-os/QUOTING-NUMBERS.md. We measure; we issue no marks.
 */

/// <reference types="@cloudflare/workers-types" />

import packages from "../../public/interop/footprint-packages.json";

export const SCHEMA = "csoai.footprint/0.1";
export const TTL_SECONDS = 3600;
export const FETCH_TIMEOUT_MS = 8000;
// The official MCP registry answered the first page in >8 s from Cloudflare's edge on 2026-09-22
// (row read UNCHECKABLE with "timeout after 8000ms"); it gets its own, longer budget. Everything
// else keeps the 8 s cap so one slow counter cannot hold the whole payload.
export const REGISTRY_TIMEOUT_MS = 20000;
export const REGISTRY_PAGE_CAP = 20;
export const REGISTRY_SEARCH =
  "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG&limit=100";
export const REGISTRY_PREFIX = "io.github.CSOAI-ORG/";
export const HF_DATASETS = "https://huggingface.co/api/datasets?author=csoai&expand[]=downloads&limit=1000";
export const GITHUB_REPO = "https://api.github.com/repos/CSOAI-ORG/councilof-ai";
export const PACKAGES_PATH = "/interop/footprint-packages.json";

export const HONESTY =
  "Gross counts are published separately from mirror-adjusted and economically verified adoption, " +
  "because downloads are not users and users are not customers.";

const KIND_THIRD_PARTY = "third-party counter (includes mirror/automated traffic)";
const KIND_SELF_LISTING = "self-published listing";

/** READ: the source answered and the value is its number. PARTIAL: some of a fan-out answered
 *  and the value is a lower bound over what did. UNCHECKABLE: a source exists and did not
 *  answer. UNMEASURED: no source exists. */
export type RowState = "READ" | "PARTIAL" | "UNCHECKABLE" | "UNMEASURED";

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
export async function registryListings(deps: Deps): Promise<Row> {
  const names = new Set<string>();
  const versions = new Set<string>();
  let cursor: string | null = null;
  let pages = 0;
  let capHit = false;
  const pageUrls: string[] = [];
  for (;;) {
    if (pages >= REGISTRY_PAGE_CAP) {
      capHit = true;
      break;
    }
    const url = cursor ? `${REGISTRY_SEARCH}&cursor=${encodeURIComponent(cursor)}` : REGISTRY_SEARCH;
    pageUrls.push(url);
    const got = await fetchJson(deps, url, {}, REGISTRY_TIMEOUT_MS);
    if (!got.ok) {
      // A listing that broke midway is not a smaller listing; it is an unread one.
      return uncheckable(`registry page ${pages + 1}: ${got.reason}`, {
        kind: KIND_SELF_LISTING,
        source_url: REGISTRY_SEARCH,
        pages_read: pages,
        distinct_names_before_failure: names.size,
      });
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
  return {
    state: capHit ? "PARTIAL" : "READ",
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
    ...(capHit ? { reason: `stopped at the ${REGISTRY_PAGE_CAP}-page cap; the count is a lower bound` } : {}),
    note: "A listing we published ourselves. It says a server is registered, not that anyone runs it.",
  };
}

// ── gross_distribution ────────────────────────────────────────────────────────
interface PackageRead {
  name: string;
  source_url: string;
  value: number | null;
  reason?: string;
}

function fanOut(label: string, unit: string, reads: PackageRead[], asOf: string, extra: Record<string, unknown> = {}): Row {
  const covered = reads.filter((r) => isNum(r.value));
  const attempted = reads.length;
  const sum = covered.reduce((a, r) => a + (r.value as number), 0);
  const failures = reads.filter((r) => !isNum(r.value)).map((r) => ({ name: r.name, reason: r.reason ?? "no number" }));
  const base = {
    unit,
    kind: KIND_THIRD_PARTY,
    covered: covered.length,
    attempted,
    source_url: reads.map((r) => r.source_url),
    packages: reads.map((r) => ({ name: r.name, value: r.value, ...(r.reason ? { reason: r.reason } : {}) })),
    ...(failures.length ? { failures } : {}),
    ...extra,
  };
  if (attempted === 0) return unmeasured(`${label}: no package names committed in ${PACKAGES_PATH}`, base);
  if (covered.length === 0) return uncheckable(`${label}: none of ${attempted} counters answered`, base);
  if (covered.length < attempted) {
    return {
      state: "PARTIAL",
      value: sum,
      as_of: asOf,
      reason: `${label}: ${covered.length} of ${attempted} counters answered; the value is a lower bound over those`,
      ...base,
    };
  }
  return { state: "READ", value: sum, as_of: asOf, ...base };
}

async function pypiDownloads(deps: Deps): Promise<Row> {
  const names = (packages.pypi as { name: string }[]).map((p) => p.name);
  const reads = await Promise.all(
    names.map(async (name): Promise<PackageRead> => {
      const source_url = `https://pypistats.org/api/packages/${name}/recent`;
      const got = await fetchJson(deps, source_url);
      if (!got.ok) return { name, source_url, value: null, reason: got.reason };
      const v = (got.body as { data?: { last_month?: unknown } })?.data?.last_month;
      return isNum(v) ? { name, source_url, value: v } : { name, source_url, value: null, reason: "data.last_month absent" };
    }),
  );
  return fanOut("pypi", "downloads, last 30 days (pypistats recent.last_month)", reads, deps.now(), {
    package_list: PACKAGES_PATH,
    registry: "pypi",
  });
}

async function npmDownloads(deps: Deps): Promise<Row> {
  const names = (packages.npm as { name: string }[]).map((p) => p.name);
  const reads = await Promise.all(
    names.map(async (name): Promise<PackageRead> => {
      const source_url = `https://api.npmjs.org/downloads/point/last-month/${name}`;
      const got = await fetchJson(deps, source_url);
      if (!got.ok) return { name, source_url, value: null, reason: got.reason };
      const v = (got.body as { downloads?: unknown })?.downloads;
      return isNum(v) ? { name, source_url, value: v } : { name, source_url, value: null, reason: "downloads absent" };
    }),
  );
  return fanOut("npm", "downloads, last month (api.npmjs.org point/last-month)", reads, deps.now(), {
    package_list: PACKAGES_PATH,
    registry: "npm",
  });
}

async function hfDatasets(deps: Deps): Promise<Row> {
  const got = await fetchJson(deps, HF_DATASETS);
  const base = { unit: "downloads, all time, summed over the org's dataset listing", kind: KIND_THIRD_PARTY, source_url: HF_DATASETS, registry: "huggingface" };
  if (!got.ok) return uncheckable(`huggingface: ${got.reason}`, base);
  if (!Array.isArray(got.body)) return uncheckable("huggingface: listing is not a json array", base);
  const rows = got.body as { id?: unknown; downloads?: unknown }[];
  const withCount = rows.filter((d) => isNum(d.downloads));
  const sum = withCount.reduce((a, d) => a + (d.downloads as number), 0);
  const partial = withCount.length < rows.length;
  return {
    state: partial ? "PARTIAL" : "READ",
    value: sum,
    as_of: deps.now(),
    datasets: rows.length,
    datasets_unit: "datasets listed under author csoai",
    covered: withCount.length,
    attempted: rows.length,
    ...(partial ? { reason: `huggingface: ${withCount.length} of ${rows.length} listings carried a downloads field; the value is a lower bound` } : {}),
    ...base,
  };
}

export async function grossDistribution(deps: Deps): Promise<Row & { sources: Record<string, Row>; sum: Row }> {
  const [pypi, npm, huggingface] = await Promise.all([pypiDownloads(deps), npmDownloads(deps), hfDatasets(deps)]);
  const sources = { pypi, npm, huggingface };
  const answered = Object.entries(sources).filter(([, r]) => isNum(r.value));
  const complete = answered.length === Object.keys(sources).length && answered.every(([, r]) => r.state === "READ");
  const total = answered.reduce((a, [, r]) => a + (r.value as number), 0);
  const missing = Object.entries(sources).filter(([, r]) => !isNum(r.value)).map(([k]) => k);
  const sum: Row =
    answered.length === 0
      ? uncheckable("no distribution counter answered", { unit: "downloads", kind: KIND_THIRD_PARTY, missing })
      : {
          state: complete ? "READ" : "PARTIAL",
          value: total,
          unit: "downloads (PyPI 30-day + npm last-month + HF dataset all-time), a mixed-window gross",
          kind: KIND_THIRD_PARTY,
          as_of: deps.now(),
          covered_sources: answered.map(([k]) => k),
          ...(missing.length ? { missing_sources: missing } : {}),
          ...(complete ? {} : { reason: "not every counter answered in full; the value is a lower bound over those that did" }),
        };
  return {
    ...sum,
    source_url: Object.values(sources).flatMap((r) => (Array.isArray(r.source_url) ? r.source_url : r.source_url ? [r.source_url] : [])),
    sources,
    sum,
    note: "Gross. Mirrors, CI installs and crawlers are in this number. It is not a count of people.",
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
  const [registry_listings, gross_distribution, economic_use, repeat_payers, boardRow, signed_cards, github_stars] =
    await Promise.all([registryListings(deps), grossDistribution(deps), economicUse(deps), repeatPayers(deps), board(deps), signedCards(deps), githubStars(deps)]);

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
  const deps: Deps = { fetch: globalThis.fetch.bind(globalThis), now: () => new Date().toISOString(), origin };
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
