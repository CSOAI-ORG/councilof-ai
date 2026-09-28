/**
 * _momentum.ts — the reads behind GET /api/momentum (schema csoai.momentum/0.1).
 *
 * WHAT THIS IS. A small set of figures that show this organisation's work is real and still moving:
 * the board, the signed card index, the corrections ledger, the measurement capsules and their
 * Bitcoin anchor, what we publish on Hugging Face and PyPI, the tools and doors that answer, and the
 * third-party indexes that list us. Every figure is READ at request time from the source it names,
 * carries its own `as_of` and `source_url`, and links there.
 *
 * THE RULES THIS FILE IS WRITTEN TO (doctrine; the tests in momentum.test.ts hold them):
 *   · No typed numbers. Nothing below writes a count; every value comes out of a fetched payload.
 *   · A source that fails, times out, answers non-2xx, or answers with a shape we cannot read is
 *     OMITTED, with its reason in `omitted[]`. A failed figure is never 0, never a cached guess and
 *     never a placeholder. UNMEASURED is never rendered as a number.
 *   · A partial read is never presented as the population: where a sum is over what answered, the
 *     figure says "at least" and names how many answered.
 *   · Windows are never added: all-time, 30-day and 7-day stay separate fields.
 *   · Hugging Face downloads of the datasets our own services read and of the rest are two figures,
 *     never added; our own share inside the rest is UNMEASURED (SELF_READ_DATASETS below).
 *   · A third-party listing is shown only if its page or API names us on this request, and every
 *     listing travels with "A listing is not an endorsement."
 *   · No price, no score or rank of anyone, no conformity wording, no membership labels here (the
 *     participation record has its own manifest and its own page).
 *
 * SELF-CONTAINED ON PURPOSE. This module imports nothing, so the same code runs inside the Pages
 * Function and, at build time, under `node --experimental-strip-types` (scripts/momentum-snapshot.mjs)
 * to write the snapshot the prerender bakes into the HTML. One producer, two callers.
 */

export const SCHEMA = "csoai.momentum/0.1";
export const TTL_SECONDS = 3600;
export const FETCH_TIMEOUT_MS = 8000;
export const HF = "https://huggingface.co";
export const DSS = "https://datasets-server.huggingface.co";
export const HF_DATASETS_API = `${HF}/api/datasets?author=csoai&expand[]=downloads&expand[]=downloadsAllTime&expand[]=likes&expand[]=private&expand[]=tags&limit=1000`;
export const EVIDENCE_INDEX = "csoai/evidence-index";
export const PYPI_FOOTPRINT = `${HF}/datasets/csoai/distribution-footprint/resolve/main/latest.json`;
export const PYPI_FOOTPRINT_PAGE = `${HF}/datasets/csoai/distribution-footprint`;
/** A daily record older than this is stale and is omitted rather than shown as today's figure. */
export const PYPI_MAX_AGE_HOURS = 48;
export const ZENODO_BOARD_SNAPSHOT = "22811459";
export const ZENODO_PAPER = "22985467";
export const METHODOLOGY_URL = "/methodology/#how-momentum-is-measured";
export const LISTING_LINE = "A listing is not an endorsement.";

export type Group = "board" | "evidence" | "reach" | "tools" | "research";

export interface Trend {
  /** The size of the change, computed from dated rows in the same source. */
  delta: number;
  /** The window the delta covers, named. */
  window: string;
  /** How it reads on the page, e.g. "+6 this week". */
  text: string;
}

export interface Figure {
  id: string;
  group: Group;
  label: string;
  value: number;
  /** How the number is printed. Rounded figures round DOWN and say so with "+". */
  display: string;
  /** What a screen reader should say for `display` (e.g. "more than 2.4 million"). */
  display_sr: string;
  unit: string;
  as_of: string;
  /** "source" when the source dates its own figure; "read" when the figure is dated by our read. */
  as_of_basis: "source" | "read";
  source_url: string;
  source_label: string;
  detail?: string;
  detail_url?: string;
  trend?: Trend;
  lower_bound?: boolean;
  /** Parts of what this figure counts that are not measured. Each stays UNMEASURED with its reason and
   *  is never printed as a number. */
  unmeasured?: { field: string; state: "UNMEASURED"; reason: string }[];
}

export interface Listing {
  id: string;
  name: string;
  /** Our own entry on that index. */
  url: string;
  /** What was found on this request that names us. */
  evidence: string;
  verified_at: string;
}

export interface Anchor {
  id: string;
  label: string;
  value: string;
  url: string;
  detail?: string;
  as_of?: string;
  /** Several entries of one kind (e.g. Rekor log indexes), each its own link. */
  links?: { text: string; url: string }[];
}

export interface RecentItem {
  id: string;
  title: string;
  href: string;
  date: string;
  date_basis: string;
  note?: string;
}

export interface Omitted {
  id: string;
  reason: string;
}

export interface Payload {
  schema: string;
  generated_at: string;
  ttl_seconds: number;
  rules: string[];
  methodology_url: string;
  listing_line: string;
  figures: Figure[];
  listings: Listing[];
  anchors: Anchor[];
  recent: RecentItem[];
  omitted: Omitted[];
  /** The datasets whose Hugging Face downloads are reported as read by our own services, each with the
   *  files that read it, and the rule HF counts downloads by. */
  hf_self_read: { rule_url: string; datasets: readonly SelfReadDataset[] };
}

export interface Deps {
  fetch: typeof fetch;
  origin: string;
  now: () => Date;
  timeoutMs?: number;
}

type Got<T> = { ok: true; value: T } | { ok: false; reason: string };

const nf = new Intl.NumberFormat("en-GB");
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
const isPositive = (v: unknown): v is number => isCount(v) && v > 0;
const isIsoDate = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v));

/** One upstream read with its own timeout. Never throws. */
export async function read(deps: Deps, url: string, init?: RequestInit, as: "json" | "text" = "json"): Promise<Got<any>> {
  const ms = deps.timeoutMs ?? FETCH_TIMEOUT_MS;
  try {
    const r = await deps.fetch(url, {
      ...init,
      headers: { "user-agent": "councilof.ai momentum/0.1 (+https://councilof.ai/methodology/)", accept: as === "json" ? "application/json" : "*/*", ...(init?.headers || {}) },
      signal: AbortSignal.timeout(ms),
    });
    if (!r.ok) return { ok: false, reason: `HTTP ${r.status} from ${url}` };
    const text = await r.text();
    if (as === "text") return { ok: true, value: text };
    const t = text.trim();
    if (!t || t.startsWith("<")) return { ok: false, reason: `${url} returned HTML, not JSON` };
    return { ok: true, value: JSON.parse(t) };
  } catch (e) {
    const err = e as Error;
    return { ok: false, reason: err?.name === "TimeoutError" ? `timeout after ${ms}ms: ${url}` : `${err?.name || "Error"} reading ${url}` };
  }
}

const own = (deps: Deps, path: string) => new URL(path, deps.origin).toString();

/** Rounds DOWN to a short form and marks it "+": 2,495,523 → "2.4M+", 288,138 → "288K+". */
export function floorCompact(n: number): { display: string; sr: string } {
  if (n >= 1_000_000) {
    const m = Math.floor(n / 100_000) / 10;
    const s = m.toFixed(m >= 10 ? 0 : 1).replace(/\.0$/, "");
    return { display: `${s}M+`, sr: `more than ${s} million` };
  }
  if (n >= 100_000) {
    const k = Math.floor(n / 1000);
    return { display: `${k}K+`, sr: `more than ${nf.format(k)} thousand` };
  }
  return { display: nf.format(n), sr: nf.format(n) };
}

function exact(n: number): { display: string; sr: string } {
  return { display: nf.format(n), sr: nf.format(n) };
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ------------------------------------------------------------------------------------ figures

export async function boardFigure(deps: Deps): Promise<Got<Figure>> {
  const url = own(deps, "/api/gspc");
  const g = await read(deps, url);
  if (!g.ok) return g;
  const t = g.value?.totals;
  if (!isPositive(t?.axes) || !isCount(t?.measured_axes) || t.measured_axes > t.axes || t.measured_axes === 0) {
    return { ok: false, reason: "/api/gspc totals unreadable (axes / measured_axes)" };
  }
  const all = t.measured_axes === t.axes;
  return {
    ok: true,
    value: {
      id: "board",
      group: "board",
      label: all ? "board axes measured, every one" : "board axes measured",
      value: t.measured_axes,
      display: `${t.measured_axes} of ${t.axes}`,
      display_sr: `${t.measured_axes} of ${t.axes}`,
      unit: "axes",
      as_of: deps.now().toISOString(),
      as_of_basis: "read",
      source_url: url,
      source_label: "GET /api/gspc → totals",
      detail: all ? "each axis has a run behind it" : `${t.axes - t.measured_axes} not yet measured`,
    },
  };
}

export async function signedCardsFigure(deps: Deps): Promise<Got<Figure>> {
  const url = own(deps, "/api/state");
  const s = await read(deps, url);
  if (!s.ok) return s;
  const cc = s.value?.card_chain;
  const valid = cc?.bodies_verified_valid;
  const published = cc?.bodies_published;
  if (!isPositive(valid?.value) || valid?.kind !== "measured" || !isCount(published?.value)) {
    return { ok: false, reason: "/api/state card_chain.bodies_verified_valid unreadable or not kind=measured" };
  }
  // "every one verifies" is printed only when it is what the source says: verified == published.
  if (valid.value !== published.value) {
    return { ok: false, reason: `card_chain: ${valid.value} verify of ${published.value} published; the label would not be true` };
  }
  return {
    ok: true,
    value: {
      id: "signed_cards",
      group: "evidence",
      label: "signed cards, every one verifies",
      value: valid.value,
      ...(() => { const e = exact(valid.value); return { display: e.display, display_sr: e.sr }; })(),
      unit: "cards",
      as_of: isIsoDate(valid.as_of) ? valid.as_of : deps.now().toISOString(),
      as_of_basis: isIsoDate(valid.as_of) ? "source" : "read",
      source_url: url,
      source_label: "GET /api/state → card_chain.bodies_verified_valid (the signed card index)",
      detail: "Ed25519, checked by the verifier we publish",
      detail_url: "/signed/HOW-TO-VERIFY.md",
    },
  };
}

export async function correctionsFigure(deps: Deps): Promise<Got<{ fig: Figure; latest: { id: string; date: string } }>> {
  const url = own(deps, "/api/corrections");
  const c = await read(deps, url);
  if (!c.ok) return c;
  const rows = c.value?.corrections;
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, reason: "/api/corrections has no corrections[]" };
  const dated = rows.filter((r: any) => typeof r?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date));
  // "all dated" is printed only when every entry carries a date.
  if (dated.length !== rows.length) return { ok: false, reason: `${rows.length - dated.length} correction(s) carry no date; the label would not be true` };
  const latest = dated.reduce((a: any, b: any) => (b.date > a.date ? b : a));
  const today = deps.now();
  const weekStart = isoDay(new Date(today.getTime() - 6 * 86400_000));
  const thisWeek = dated.filter((r: any) => r.date >= weekStart && r.date <= isoDay(today)).length;
  const e = exact(rows.length);
  return {
    ok: true,
    value: {
      latest: { id: String(latest.id ?? ""), date: latest.date },
      fig: {
        id: "corrections",
        group: "evidence",
        label: "public corrections, all dated",
        value: rows.length,
        display: e.display,
        display_sr: e.sr,
        unit: "entries",
        as_of: latest.date,
        as_of_basis: "source",
        source_url: url,
        source_label: "GET /api/corrections",
        detail: c.value?.signature_state === "VALID" ? "signed ledger: what was wrong, and the fix" : "what was wrong, and the fix",
        detail_url: "/corrections/",
        ...(thisWeek > 0 ? { trend: { delta: thisWeek, window: `${weekStart}..${isoDay(today)}`, text: `+${thisWeek} this week` } } : {}),
      },
    },
  };
}

type CapsuleRead = { fig: Figure; anchors: Anchor[]; day: string; indexUrl: string };

export async function capsulesFigure(deps: Deps): Promise<Got<CapsuleRead>> {
  const tree = async (p: string) => read(deps, `${HF}/api/datasets/${EVIDENCE_INDEX}/tree/main/${p}`);
  const resolve = (p: string) => `${HF}/datasets/${EVIDENCE_INDEX}/resolve/main/${p}`;
  const blob = (p: string) => `${HF}/datasets/${EVIDENCE_INDEX}/blob/main/${p}`;
  const days = await tree("measurement-index");
  if (!days.ok) return days;
  const dirs = (Array.isArray(days.value) ? days.value : [])
    .filter((e: any) => e?.type === "directory" && /\/\d{4}-\d{2}-\d{2}$/.test(e?.path ?? ""))
    .map((e: any) => e.path as string)
    .sort()
    .reverse();
  if (!dirs.length) return { ok: false, reason: "evidence-index: no measurement-index/<day>/ directory" };
  const dir = dirs[0];
  const day = dir.split("/").pop() as string;
  const files = await tree(dir);
  if (!files.ok) return files;
  const names: string[] = (Array.isArray(files.value) ? files.value : []).map((e: any) => e?.path).filter((p: unknown) => typeof p === "string");
  const indexFile = names.find((f) => new RegExp(`measurement-index-v[\\d.]+-${day}\\.json$`).test(f));
  if (!indexFile) return { ok: false, reason: `evidence-index: no signed daily index file for ${day}` };
  const signed = names.includes(indexFile.replace(/\.json$/, ".signed.json"));
  const ots = names.includes(`${indexFile}.ots`);
  if (!signed) return { ok: false, reason: `evidence-index: ${indexFile} has no .signed.json beside it` };
  const idx = await read(deps, resolve(indexFile));
  if (!idx.ok) return idx;
  const n = idx.value?.n_capsules_total;
  if (!isPositive(n)) return { ok: false, reason: `${indexFile}: n_capsules_total unreadable` };
  const asOf = isIsoDate(idx.value?.as_of) ? idx.value.as_of : null;
  if (!asOf) return { ok: false, reason: `${indexFile}: as_of unreadable` };

  // The Bitcoin block that anchors the chain head (OpenTimestamps), and the Rekor log entries.
  const anchors: Anchor[] = [
    {
      id: "daily_index",
      label: "Latest signed daily index",
      value: day,
      url: blob(indexFile),
      detail: `${nf.format(n)} capsules · Ed25519-signed${ots ? " · OpenTimestamps proof beside it" : ""}`,
      as_of: asOf,
    },
  ];
  let height: number | null = null;
  const head = names.find((f) => /measurement-index-chain-head-\d{4}-\d{2}-\d{2}\.json$/.test(f));
  if (head) {
    const h = await read(deps, resolve(head));
    if (h.ok) {
      const hs = (Array.isArray(h.value?.bitcoin_attested_days) ? h.value.bitcoin_attested_days : [])
        .flatMap((d: any) => (Array.isArray(d?.heights) ? d.heights : []))
        .filter(isPositive);
      if (hs.length) {
        height = Math.max(...hs);
        anchors.push({
          id: "bitcoin_block",
          label: "Bitcoin block (OpenTimestamps)",
          value: String(height),
          url: `https://mempool.space/block/${height}`,
          detail: `anchors the chain head of ${h.value?.head_date ?? day}${h.value?.verification?.result ? ` · ${h.value.verification.result}` : ""}`,
          as_of: isIsoDate(h.value?.as_of) ? h.value.as_of : undefined,
        });
      }
    }
  }
  const receipts = names.filter((f) => f.endsWith(".rekor-receipt.json"));
  const rk = await Promise.all(receipts.map((f) => read(deps, resolve(f))));
  const seen = new Set<number>();
  rk.forEach((r) => {
    const li = r.ok ? r.value?.logIndex : null;
    if (isPositive(li)) seen.add(li);
  });
  const rekor = [...seen].sort((a, b) => a - b);
  if (rekor.length) {
    anchors.push({
      id: "rekor",
      label: rekor.length > 1 ? "Sigstore Rekor entries" : "Sigstore Rekor entry",
      value: String(rekor[0]),
      url: `https://search.sigstore.dev/?logIndex=${rekor[0]}`,
      links: rekor.map((li) => ({ text: String(li), url: `https://search.sigstore.dev/?logIndex=${li}` })),
      detail: `public transparency-log entries for the ${day} index and its chain head`,
    });
  }
  const e = exact(n);
  return {
    ok: true,
    value: {
      day,
      indexUrl: blob(indexFile),
      anchors,
      fig: {
        id: "capsules",
        group: "evidence",
        label: "measurement capsules under the signed daily index",
        value: n,
        display: e.display,
        display_sr: e.sr,
        unit: "capsules",
        as_of: asOf,
        as_of_basis: "source",
        source_url: blob(indexFile),
        source_label: `Hugging Face ${EVIDENCE_INDEX} · measurement-index ${day}`,
        detail: height ? `index of ${day} · in Bitcoin block ${height}` : `index of ${day}`,
        detail_url: height ? `https://mempool.space/block/${height}` : "/measurement-capsules/",
      },
    },
  };
}

type HfRead = { figs: Figure[]; dois: { id: string; doi: string }[]; censusIds: string[]; omitted: Omitted[] };

/**
 * DOWNLOADS OUR OWN SERVICES MAKE. Hugging Face counts a dataset download per IP address, repository
 * and 5-minute window, for GET or HEAD requests (HF_DOWNLOAD_RULE_URL), and its public API reports no
 * downloader identity. Some of our datasets are read by our own code, so part of their count is us.
 * They are named here, each with the files that read it, and their downloads are reported in their own
 * figure, never added to the rest. `momentum-selfread.test.ts` holds this list to the code:
 *   · every dataset a Pages function reads at request time (a /datasets/<id>/resolve/ or
 *     /api/datasets/<id>/tree/ URL, or a dataset passed to the functions/_lib/reach/hf.ts readers) must
 *     be listed with that file, and every "request" entry must be read by the files it names;
 *   · every "job" entry's named files must exist and read the dataset.
 * The list is a list, not a count (a count hides a swap). Our publish, grading and mirroring jobs read
 * other datasets now and then too; that share of "other" is not separable from the public API and is
 * reported as UNMEASURED, never estimated. Not listed: the census_rows reads, which ask datasets-server
 * for its row counts and do not download the datasets' files.
 */
export const HF_DOWNLOAD_RULE_URL = "https://huggingface.co/docs/hub/datasets-download-stats";

export interface SelfReadDataset {
  id: string;
  /** "request": a councilof.ai Pages function reads it while answering a request.
   *  "job": one of our scheduled or queued jobs reads it as its working state. */
  when: "request" | "job";
  /** The files in the councilof-ai repository that read it. */
  readers: string[];
}

export const SELF_READ_DATASETS: readonly SelfReadDataset[] = [
  { id: "csoai/gspc-hub-cards", when: "request", readers: ["functions/api/hub-cards.ts"] },
  { id: "csoai/x402-bazaar-conformance", when: "request", readers: ["functions/api/coverage.ts", "functions/api/x402/[name].ts"] },
  { id: "csoai/evidence-index", when: "request", readers: ["functions/api/_momentum.ts", "functions/_lib/reach/notes.ts"] },
  { id: "csoai/distribution-footprint", when: "request", readers: ["functions/api/_momentum.ts"] },
  { id: "csoai/cross-ledger-supply", when: "request", readers: ["functions/_lib/reach/stablecoins.ts"] },
  { id: "csoai/a2a-card-census", when: "request", readers: ["functions/_lib/reach/agentCards.ts"] },
  { id: "csoai/hub-queue", when: "job", readers: ["scripts/hf/hf_jobs_mill.py", "scripts/runpod_gspc_local_mill.py"] },
  { id: "csoai/fleet-status", when: "job", readers: ["fleet/publish_fleet_status.py", "scripts/pubbus/publish-fleet-status.py"] },
  { id: "csoai/gspc-boards", when: "job", readers: ["scripts/watch_public_root.py", "scripts/sync_hf_gspc.py"] },
];

export const SELF_SHARE_REASON =
  "Hugging Face's public API gives a download count per dataset and says nothing about who downloaded. " +
  "Our own publish, grading and mirroring jobs also read some of these datasets, and that share cannot be " +
  "separated from the count, so it is not estimated.";

export async function huggingFaceFigures(deps: Deps): Promise<Got<HfRead>> {
  const d = await read(deps, HF_DATASETS_API);
  if (!d.ok) return d;
  if (!Array.isArray(d.value)) return { ok: false, reason: "HF datasets API did not return a list" };
  const pub = d.value.filter((x: any) => x && x.private === false && typeof x.id === "string" && x.id.startsWith("csoai/"));
  if (!pub.length) return { ok: false, reason: "HF datasets API listed no public csoai/* dataset" };
  if (!pub.every((x: any) => isCount(x.downloads))) return { ok: false, reason: "HF datasets API: a downloads field is missing" };
  const likes = pub.reduce((a: number, x: any) => a + (isCount(x.likes) ? x.likes : 0), 0);
  const read_at = deps.now().toISOString();
  const omitted: Omitted[] = [];
  const figs: Figure[] = [];
  const ds = exact(pub.length);
  figs.push({
    id: "hf_datasets",
    group: "reach",
    label: "open datasets on Hugging Face",
    value: pub.length,
    display: ds.display,
    display_sr: ds.sr,
    unit: "datasets",
    as_of: read_at,
    as_of_basis: "read",
    source_url: `${HF}/csoai`,
    source_label: "Hugging Face API · datasets?author=csoai (public only)",
    detail: likes > 0 ? `${nf.format(likes)} likes` : undefined,
  });
  // Two download figures, never added: the datasets our own services read, and every other public one.
  const selfIds = new Set(SELF_READ_DATASETS.map((s) => s.id));
  const parts: { id: string; rows: any[]; label: string; source_label: string; detail: (n: number, all: number | null) => string; extra: Partial<Figure> }[] = [
    {
      id: "hf_downloads_30d_self_read",
      rows: pub.filter((x: any) => selfIds.has(x.id)),
      label: "downloads of the datasets our own services read, last 30 days",
      source_label: "Hugging Face API · downloads (HF's rolling 30 days), summed over the public datasets named in hf_self_read",
      detail: (n) => `${n} datasets our own code reads, named in hf_self_read; our own reads are inside this count`,
      extra: {},
    },
    {
      id: "hf_downloads_30d_other",
      rows: pub.filter((x: any) => !selfIds.has(x.id)),
      label: "downloads of our other public datasets (not the ones our own services read), last 30 days",
      source_label: "Hugging Face API · downloads (HF's rolling 30 days), summed over the public csoai/* datasets not named in hf_self_read",
      detail: (n, all) => `${n} datasets${all ? ` · ${floorCompact(all).display} all-time` : ""} · our own share inside is UNMEASURED`,
      extra: { unmeasured: [{ field: "self_share", state: "UNMEASURED", reason: SELF_SHARE_REASON }] },
    },
  ];
  for (const p of parts) {
    const n30 = p.rows.reduce((a: number, x: any) => a + x.downloads, 0);
    if (!p.rows.length || n30 === 0) {
      omitted.push({ id: p.id, reason: p.rows.length ? "Hugging Face reports no downloads for these datasets in its 30-day window" : "no public dataset in this group" });
      continue;
    }
    const all = p.rows.every((x: any) => isCount(x.downloadsAllTime)) ? p.rows.reduce((a: number, x: any) => a + x.downloadsAllTime, 0) : null;
    const f = n30 >= 100_000 ? floorCompact(n30) : exact(n30);
    figs.push({
      id: p.id,
      group: "reach",
      label: p.label,
      value: n30,
      display: f.display,
      display_sr: f.sr,
      unit: "downloads",
      as_of: read_at,
      as_of_basis: "read",
      source_url: `${HF}/csoai`,
      source_label: p.source_label,
      detail: p.detail(p.rows.length, all && all > n30 ? all : null),
      detail_url: HF_DOWNLOAD_RULE_URL,
      ...p.extra,
    });
  }
  const dois: { id: string; doi: string }[] = [];
  for (const x of pub) for (const t of Array.isArray(x.tags) ? x.tags : []) if (typeof t === "string" && t.startsWith("doi:10.")) dois.push({ id: x.id, doi: t.slice(4) });
  const censusIds = pub.map((x: any) => x.id as string).filter((id: string) => /census/i.test(id));
  return { ok: true, value: { figs, dois, censusIds, omitted } };
}

export async function censusRowsFigure(deps: Deps, ids: string[]): Promise<Got<Figure>> {
  if (!ids.length) return { ok: false, reason: "no public csoai/*census* dataset listed" };
  const sizes = await Promise.all(ids.map((id) => read(deps, `${DSS}/size?dataset=${encodeURIComponent(id)}`)));
  const rows: number[] = [];
  const failed: string[] = [];
  sizes.forEach((s, i) => {
    const n = s.ok ? s.value?.size?.dataset?.num_rows : null;
    if (isCount(n)) rows.push(n);
    else failed.push(ids[i]);
  });
  const total = rows.reduce((a, b) => a + b, 0);
  if (!rows.length || total === 0) return { ok: false, reason: "datasets-server /size answered for no census dataset" };
  const partial = failed.length > 0;
  const f = floorCompact(total);
  return {
    ok: true,
    value: {
      id: "census_rows",
      group: "research",
      label: partial ? `census rows published, at least (${rows.length} of ${ids.length} datasets answered)` : "census rows published as open data",
      value: total,
      display: total >= 100_000 ? f.display : exact(total).display,
      display_sr: total >= 100_000 ? f.sr : exact(total).sr,
      unit: "rows",
      as_of: deps.now().toISOString(),
      as_of_basis: "read",
      source_url: `${HF}/csoai`,
      source_label: `Hugging Face datasets-server /size, summed over ${ids.length} csoai/*census* datasets`,
      detail: `${ids.length} census datasets`,
      ...(partial ? { lower_bound: true } : {}),
    },
  };
}

export async function pypiFigure(deps: Deps): Promise<Got<Figure>> {
  const p = await read(deps, PYPI_FOOTPRINT);
  if (!p.ok) return p;
  const r = p.value;
  if (r?.schema !== "csoai.pypi-footprint/0.1") return { ok: false, reason: "distribution-footprint latest.json: unknown schema" };
  if (!isPositive(r.all_time_total) || !isPositive(r.n_counted) || !isPositive(r.n_packages) || r.n_counted > r.n_packages) {
    return { ok: false, reason: "distribution-footprint latest.json: totals unreadable" };
  }
  if (!isIsoDate(r.as_of)) return { ok: false, reason: "distribution-footprint latest.json: as_of unreadable" };
  const ageH = (deps.now().getTime() - Date.parse(r.as_of)) / 3600_000;
  if (ageH > PYPI_MAX_AGE_HOURS) return { ok: false, reason: `distribution-footprint record is ${Math.floor(ageH)} h old (> ${PYPI_MAX_AGE_HOURS} h); not shown as today's figure` };
  const partial = r.state !== "READ" || r.n_counted < r.n_packages;
  const f = floorCompact(r.all_time_total);
  const d30 = isPositive(r.last_30d) ? floorCompact(r.last_30d).display : null;
  const d7 = isPositive(r.last_7d) ? r.last_7d : null;
  return {
    ok: true,
    value: {
      id: "pypi_all_time",
      group: "reach",
      // The "+" on the rounded figure already says "at least"; a partial read also says how many answered.
      label: "PyPI downloads, all-time",
      value: r.all_time_total,
      display: f.display,
      display_sr: f.sr,
      unit: "downloads",
      as_of: r.as_of,
      as_of_basis: "source",
      source_url: PYPI_FOOTPRINT_PAGE,
      source_label: "pepy.tech per package, daily record on Hugging Face csoai/distribution-footprint",
      detail: `${d30 ? `${d30} in the last 30 days · ` : ""}${partial ? `${nf.format(r.n_counted)} of ${nf.format(r.n_packages)} packages answered` : `${nf.format(r.n_packages)} packages`} · CSOAI and MEOK AI Labs · counted by pepy.tech`,
      detail_url: "https://pepy.tech",
      ...(d7 ? { trend: { delta: d7, window: String(r.last_7d_window ?? "last 7 complete UTC days"), text: `+${floorCompact(d7).display} this week` } } : {}),
      ...(partial ? { lower_bound: true } : {}),
    },
  };
}

/** The live tool list served at POST /mcp. The response may be JSON or one SSE `data:` frame. */
export async function mcpToolsFigure(deps: Deps): Promise<Got<Figure>> {
  const url = own(deps, "/mcp");
  const t = await read(
    deps,
    url,
    {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    },
    "text",
  );
  if (!t.ok) return t;
  let msg: any = null;
  const body = String(t.value);
  try {
    const frame = body.split("\n").find((l) => l.startsWith("data:"));
    msg = JSON.parse(frame ? frame.slice(5).trim() : body.trim());
  } catch {
    return { ok: false, reason: "POST /mcp tools/list: unparseable response" };
  }
  const tools = msg?.result?.tools;
  if (!Array.isArray(tools) || tools.length === 0) return { ok: false, reason: "POST /mcp tools/list: no tools[]" };
  const e = exact(tools.length);
  return {
    ok: true,
    value: {
      id: "mcp_tools",
      group: "tools",
      label: "MCP tools served live",
      value: tools.length,
      display: e.display,
      display_sr: e.sr,
      unit: "tools",
      as_of: deps.now().toISOString(),
      as_of_basis: "read",
      source_url: url,
      source_label: "POST /mcp → tools/list",
      detail: "read from the tool surface itself",
    },
  };
}

export async function x402DoorsFigure(deps: Deps): Promise<Got<Figure>> {
  const url = own(deps, "/api/x402-quotes");
  const q = await read(deps, url);
  if (!q.ok) return q;
  const rows = q.value?.quotes;
  if (!Array.isArray(rows)) return { ok: false, reason: "/api/x402-quotes has no quotes[]" };
  const answering = rows.filter((r: any) => r?.http === 402).length;
  if (answering === 0) return { ok: false, reason: "/api/x402-quotes: no door answered 402 on this read" };
  const e = exact(answering);
  return {
    ok: true,
    value: {
      id: "x402_doors",
      group: "tools",
      label: "x402 doors answering",
      value: answering,
      display: e.display,
      display_sr: e.sr,
      unit: "doors",
      as_of: isIsoDate(q.value?.as_of) ? q.value.as_of : deps.now().toISOString(),
      as_of_basis: isIsoDate(q.value?.as_of) ? "source" : "read",
      source_url: url,
      source_label: "GET /api/x402-quotes (each door's own answer)",
      detail: answering === rows.length ? "every listed door answered" : `${answering} of ${rows.length} listed doors answered`,
    },
  };
}

type ZenodoRecord = { title: string; date: string; doi: string; downloads: number | null; url: string };

export async function zenodo(deps: Deps, id: string): Promise<Got<ZenodoRecord>> {
  const z = await read(deps, `https://zenodo.org/api/records/${id}`);
  if (!z.ok) return z;
  const md = z.value?.metadata;
  if (typeof md?.title !== "string" || typeof md?.publication_date !== "string") return { ok: false, reason: `zenodo ${id}: metadata unreadable` };
  const dl = z.value?.stats?.unique_downloads;
  return {
    ok: true,
    value: {
      title: md.title,
      date: md.publication_date,
      doi: typeof z.value?.doi === "string" ? z.value.doi : `10.5281/zenodo.${id}`,
      downloads: isCount(dl) ? dl : null,
      url: `https://doi.org/${typeof z.value?.doi === "string" ? z.value.doi : `10.5281/zenodo.${id}`}`,
    },
  };
}

// ----------------------------------------------------------------------------------- listings

type ListingSpec = {
  id: string;
  name: string;
  url: string;
  probe: string;
  /** Returns the evidence sentence if the probe body names us, else null. */
  find: (body: string) => string | null;
  as?: "json" | "text";
};

export const LISTINGS: ListingSpec[] = [
  {
    id: "mcp-registry",
    name: "Official MCP Registry",
    url: "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG/gspc&version=latest",
    probe: "https://registry.modelcontextprotocol.io/v0/servers?search=io.github.CSOAI-ORG/gspc&version=latest",
    find: (b) => {
      try {
        const s = (JSON.parse(b)?.servers ?? []).find((x: any) => x?.server?.name === "io.github.CSOAI-ORG/gspc");
        return s ? `io.github.CSOAI-ORG/gspc ${s.server.version ?? ""} is listed`.trim() : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "ethicalml-awesome-ai-regulation",
    name: "EthicalML awesome AI regulation list",
    url: "https://github.com/EthicalML/awesome-artificial-intelligence-regulation",
    probe: "https://raw.githubusercontent.com/EthicalML/awesome-artificial-intelligence-regulation/master/README.md",
    find: (b) => {
      const i = b.split("\n").findIndex((l) => /councilof\.ai/i.test(l));
      return i >= 0 ? `README line ${i + 1} names councilof.ai` : null;
    },
  },
  {
    id: "awesome-public-datasets",
    name: "awesome-public-datasets",
    url: "https://github.com/awesomedata/awesome-public-datasets",
    probe: "https://raw.githubusercontent.com/awesomedata/awesome-public-datasets/master/README.rst",
    find: (b) => {
      const i = b.split("\n").findIndex((l) => /huggingface\.co\/datasets\/csoai\//i.test(l));
      return i >= 0 ? `README line ${i + 1} lists a csoai dataset` : null;
    },
  },
  {
    id: "glama",
    name: "Glama MCP directory",
    url: "https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc",
    probe: "https://glama.ai/mcp/connectors/io.github.CSOAI-ORG/gspc",
    find: (b) => (b.includes("io.github.CSOAI-ORG/gspc") ? "the connector page names io.github.CSOAI-ORG/gspc" : null),
  },
  {
    id: "smithery",
    name: "Smithery",
    url: "https://smithery.ai/servers/csoai/gspc",
    probe: "https://smithery.ai/servers/csoai/gspc",
    find: (b) => (/councilof\.ai/i.test(b) && /gspc/i.test(b) ? "the server page links councilof.ai" : null),
  },
  {
    id: "402index",
    name: "402 Index",
    url: "https://402index.io/api/v1/services?q=councilof.ai&limit=100",
    probe: "https://402index.io/api/v1/services?q=councilof.ai&limit=100",
    find: (b) => {
      try {
        const d = JSON.parse(b);
        const rows = Array.isArray(d?.services) ? d.services : Array.isArray(d?.data) ? d.data : [];
        const ours = rows.filter((s: any) => /https:\/\/councilof\.ai\//.test(String(s?.url ?? s?.resource ?? s?.endpoint ?? JSON.stringify(s))));
        return ours.length ? "its search lists councilof.ai x402 endpoints" : null;
      } catch {
        return null;
      }
    },
  },
  {
    id: "api-evangelist",
    name: "API Evangelist profile",
    url: "https://github.com/api-evangelist/councilof-ai",
    probe: "https://raw.githubusercontent.com/api-evangelist/councilof-ai/main/README.md",
    find: (b) => (/councilof\.ai/i.test(b) ? "an independent API profile of councilof.ai" : null),
  },
];

export async function listings(deps: Deps, specs: ListingSpec[] = LISTINGS): Promise<{ ok: Listing[]; omitted: Omitted[] }> {
  const res = await Promise.all(specs.map((s) => read(deps, s.probe, { headers: { accept: "*/*" } }, "text")));
  const ok: Listing[] = [];
  const omitted: Omitted[] = [];
  res.forEach((r, i) => {
    const s = specs[i];
    if (!r.ok) return void omitted.push({ id: `listing:${s.id}`, reason: r.reason });
    const ev = s.find(String(r.value));
    if (!ev) return void omitted.push({ id: `listing:${s.id}`, reason: `${s.probe} answered but does not name us on this read` });
    ok.push({ id: s.id, name: s.name, url: s.url, evidence: ev, verified_at: deps.now().toISOString() });
  });
  return { ok, omitted };
}

// ---------------------------------------------------------------------------------------- build

/**
 * Dated public work whose date is read live from the record it points at (never typed here). Each
 * href is a route the site serves; momentum.test.ts checks every one against the committed sitemap.
 */
export const RECENT_SOURCES: { id: string; title: string; href: string; date_url: string; date_field: string }[] = [
  {
    id: "state-2026-09",
    title: "State of the Agent Internet, September 2026",
    href: "/state/2026-09/",
    date_url: "/state/2026-09/numbers.json",
    date_field: "as_of",
  },
  {
    id: "x402-activity",
    title: "Wash-adjusted x402 activity, signed daily record",
    href: "/measurements/x402-activity/",
    date_url: "/measurements/x402-activity/2026-09-25/x402-activity-2026-09-25.json",
    date_field: "day",
  },
];

async function recentFromSources(deps: Deps): Promise<{ items: RecentItem[]; omitted: Omitted[] }> {
  const items: RecentItem[] = [];
  const omitted: Omitted[] = [];
  const got = await Promise.all(RECENT_SOURCES.map((s) => read(deps, own(deps, s.date_url))));
  got.forEach((g, i) => {
    const s = RECENT_SOURCES[i];
    const v = g.ok ? g.value?.[s.date_field] : null;
    if (typeof v === "string" && isIsoDate(v)) items.push({ id: s.id, title: s.title, href: s.href, date: v.slice(0, 10), date_basis: `${s.date_url} → ${s.date_field}, read live` });
    else omitted.push({ id: `recent:${s.id}`, reason: g.ok ? `${s.date_url}: ${s.date_field} unreadable` : g.reason });
  });
  // The NIST AI 200-2 public comment, dated by the participation manifest (a submission we made).
  const m = await read(deps, own(deps, "/interop/memberships.json"));
  const row = m.ok && Array.isArray(m.value?.rows) ? m.value.rows.find((r: any) => r?.id === "nist-ai-200-2") : null;
  if (row && typeof row.since === "string" && isIsoDate(row.since)) {
    items.push({
      id: "nist-ai-200-2",
      title: "Public comment submitted to NIST on AI 200-2",
      href: "/memberships/#nist-ai-200-2",
      date: row.since,
      date_basis: "/interop/memberships.json → nist-ai-200-2.since, read live",
      note: "a submission we made; it implies nothing about NIST's view of us",
    });
  } else omitted.push({ id: "recent:nist-ai-200-2", reason: m.ok ? "memberships manifest has no dated nist-ai-200-2 row" : m.reason });
  return { items, omitted };
}

export const RULES = [
  "Every figure is read at request time from the source it names and carries its own as_of and source_url.",
  "A source that fails is omitted, never shown as 0 or as a stale guess; the omission is listed with its reason.",
  "Rounded figures round down and carry '+'. A partial read says 'at least' and names what answered.",
  "All-time, 30-day and 7-day windows are separate fields and are never added.",
  "Download counts include mirrors and automated traffic; they are not people, users or customers.",
  "Hugging Face downloads are two figures that are never added: the datasets our own services read (named in hf_self_read) and our other public datasets. Our own share inside the second is UNMEASURED.",
  "A third-party listing is shown only if it names us on this read. A listing is not an endorsement.",
];

export async function buildMomentum(deps: Deps): Promise<Payload> {
  const omitted: Omitted[] = [];
  const [board, cards, corr, caps, hf, pypi, tools, doors, paper, snap, lst, rec] = await Promise.all([
    boardFigure(deps),
    signedCardsFigure(deps),
    correctionsFigure(deps),
    capsulesFigure(deps),
    huggingFaceFigures(deps),
    pypiFigure(deps),
    mcpToolsFigure(deps),
    x402DoorsFigure(deps),
    zenodo(deps, ZENODO_PAPER),
    zenodo(deps, ZENODO_BOARD_SNAPSHOT),
    listings(deps),
    recentFromSources(deps),
  ]);
  const census = hf.ok ? await censusRowsFigure(deps, hf.value.censusIds) : ({ ok: false, reason: "HF dataset list unavailable" } as Got<Figure>);

  const figures: Figure[] = [];
  const take = (id: string, g: Got<Figure>) => (g.ok ? figures.push(g.value) : omitted.push({ id, reason: g.reason }));
  take("board", board);
  take("signed_cards", cards);
  if (corr.ok) figures.push(corr.value.fig);
  else omitted.push({ id: "corrections", reason: corr.reason });
  if (caps.ok) figures.push(caps.value.fig);
  else omitted.push({ id: "capsules", reason: caps.reason });
  take("pypi_all_time", pypi);
  if (hf.ok) {
    figures.push(...hf.value.figs);
    omitted.push(...hf.value.omitted);
  } else omitted.push({ id: "hf_datasets", reason: hf.reason });
  take("census_rows", census);
  take("mcp_tools", tools);
  take("x402_doors", doors);
  if (snap.ok && isPositive(snap.value.downloads)) {
    const e = exact(snap.value.downloads);
    figures.push({
      id: "zenodo_board_snapshot",
      group: "research",
      label: "downloads of the board snapshot on Zenodo",
      value: snap.value.downloads,
      display: e.display,
      display_sr: e.sr,
      unit: "unique downloads",
      as_of: deps.now().toISOString(),
      as_of_basis: "read",
      source_url: snap.value.url,
      source_label: `Zenodo API · record ${ZENODO_BOARD_SNAPSHOT} stats.unique_downloads`,
      detail: `DOI ${snap.value.doi}`,
    });
  } else omitted.push({ id: "zenodo_board_snapshot", reason: snap.ok ? "Zenodo reports no downloads yet" : snap.reason });
  omitted.push(...lst.omitted);

  // Anchors a stranger can check without trusting us.
  const anchors: Anchor[] = caps.ok ? [...caps.value.anchors] : [];
  anchors.push({
    id: "signing_key",
    label: "Signing keys",
    value: "did:web:csoai.org",
    url: "https://csoai.org/.well-known/did.json",
    detail: "every signature above checks against these public keys",
  });
  anchors.push({
    id: "companies_house",
    label: "Companies House",
    value: "CSOAI Ltd · 16939677",
    url: "https://find-and-update.company-information.service.gov.uk/company/16939677",
    detail: "the accountable company, on the public register",
  });
  if (paper.ok) {
    anchors.push({ id: "paper_doi", label: "Preprint DOI", value: paper.value.doi, url: paper.value.url, detail: paper.value.title, as_of: paper.value.date });
  } else omitted.push({ id: "paper_doi", reason: paper.reason });
  if (hf.ok && hf.value.dois.length) {
    const main = hf.value.dois.find((d) => d.id === "csoai/gspc-board") ?? hf.value.dois[0];
    anchors.push({
      id: "hf_dois",
      label: "Dataset DOIs on Hugging Face",
      value: main.doi,
      url: `https://doi.org/${main.doi}`,
      detail: `${main.id}${hf.value.dois.length > 1 ? ` and ${hf.value.dois.length - 1} more csoai datasets carry a DOI` : ""}`,
    });
  }

  // Recent, dated public work: live-dated where a source dates it, plus the dated editions.
  const recent: RecentItem[] = [];
  if (caps.ok)
    recent.push({ id: "capsules", title: "Measurement capsules: the signed daily index", href: "/measurement-capsules/", date: caps.value.fig.as_of.slice(0, 10), date_basis: "index as_of, read live" });
  if (paper.ok)
    recent.push({ id: "paper", title: "Preprint: cross-hardware reproducibility of LLM evaluation results", href: "/research/cross-hardware-reproducibility/", date: paper.value.date, date_basis: "Zenodo publication_date, read live", note: `DOI ${paper.value.doi}` });
  if (corr.ok)
    recent.push({ id: "corrections", title: `Corrections ledger, latest entry ${corr.value.latest.id}`.trim(), href: "/corrections/", date: corr.value.latest.date, date_basis: "latest entry date, read live" });
  if (snap.ok)
    recent.push({ id: "board-snapshot", title: "Board snapshot, archived on Zenodo", href: snap.value.url, date: snap.value.date, date_basis: "Zenodo publication_date, read live", note: `DOI ${snap.value.doi}` });
  recent.push(...rec.items);
  omitted.push(...rec.omitted);
  recent.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    schema: SCHEMA,
    generated_at: deps.now().toISOString(),
    ttl_seconds: TTL_SECONDS,
    rules: RULES,
    methodology_url: METHODOLOGY_URL,
    listing_line: LISTING_LINE,
    figures,
    listings: lst.ok,
    anchors,
    recent: recent.slice(0, 6),
    omitted,
    hf_self_read: { rule_url: HF_DOWNLOAD_RULE_URL, datasets: SELF_READ_DATASETS },
  };
}
