/**
 * /notes/daily/<date>/ — the daily "what changed" note.
 *
 * GENERATED, NOT WRITTEN. The note is computed at request time from the signed daily
 * measurement-capsule index that capsule-daily (oracle-micro-2, 08:05Z) publishes to
 * csoai/evidence-index under measurement-index/<date>/, diffed against the previous day's index.
 * It states counts of changes by type and links to the entity pages. It carries no editorial
 * judgement: no "notable", no "concerning", no adjectives about anyone.
 *
 * PUBLISHED ONLY IF THE SIGNATURE VERIFIES. A day whose index does not verify under the pinned
 * board key (or whose signed payload does not pin its bytes) has no note: the page answers 404
 * with the reason, and the day is left out of the feeds and the sitemap. The note appears by
 * itself once the index is on the dataset — there is no second publishing step to forget.
 */
import { type Ctx, type Json, type Rendered, NotFound, RENDER_VERSION, SITE, SourceError, badge, dateOnly, datasetLd, esc, renderPage } from "./core";
import { type SignedRecord, hfTree, signedRecord } from "./hf";
import { type Harvest, harvest } from "./harvest";

export const EI_DS = "csoai/evidence-index";
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_DAYS = 60;

export const ADAPTER_PAGES: Record<string, { href: string; label: string }> = {
  contract_parity: { href: "/mcp-servers/", label: "MCP servers" },
  tool_drift: { href: "/mcp-servers/", label: "MCP servers" },
  self_parity: { href: "/mcp-servers/councilof.ai/", label: "our own MCP server" },
  a2a_card: { href: "/agent-cards/", label: "A2A agent cards" },
  cross_ledger: { href: "/stablecoins/deployments/", label: "tokenised-asset deployments" },
};
const pageFor = (adapter: string) => ADAPTER_PAGES[adapter] || { href: "/measurement-capsules/", label: "measurement capsules" };

export interface Batch { adapter: string; kind?: string; n_capsules?: number; states?: Record<string, number>; merkle_root?: string; record_sha256?: string; signature_state?: string; dir?: string; slug?: string; batch_slug?: string; signed_at?: string }

export async function indexDates(ctx: Ctx): Promise<string[]> {
  const items = await hfTree(ctx, EI_DS, "measurement-index");
  return items.filter((x) => x.type === "directory").map((x) => x.path.split("/").pop()!).filter((d) => DATE_RE.test(d)).sort();
}

export async function loadIndex(ctx: Ctx, date: string): Promise<SignedRecord> {
  if (!DATE_RE.test(date)) throw new NotFound(date);
  const base = `measurement-index/${date}/measurement-index-v0.2-${date}`;
  try {
    return await signedRecord(ctx, EI_DS, `${base}.json`, `${base}.signed.json`);
  } catch (e) {
    // A missing day is NotFound; a day whose signature FAILS is also not published (404 with the
    // reason), never shown. Only an unreachable source is a 503.
    if (e instanceof SourceError && /HTTP 404|signature (FAILS|ABSENT)|does not pin/.test(e.detail)) throw new NotFound(`daily note ${date} (${e.detail})`);
    throw e;
  }
}

const batchKey = (b: Batch) => String(b.batch_slug || b.slug || (b.dir ? b.dir.replace(/^.*measurement-capsules-v0\.2-\d{4}-\d{2}-\d{2}-/, "") : "") || b.adapter);

export interface BatchChange { key: string; adapter: string; change: "ADDED" | "DROPPED" | "CARRIED" | "REBUILT"; n_before: number | null; n_after: number | null; states_delta: Record<string, number> }
export interface DailyDiff { date: string; prev_date: string | null; baseline: boolean; changes: BatchChange[]; counts: Record<string, number>; n_capsules: number | null; n_capsules_prev: number | null; index_root: string | null }

export function diffIndexes(date: string, cur: Json, prev: Json | null, prevDate: string | null): DailyDiff {
  const cb = ((cur.batches as Batch[]) || []).filter((b) => b && b.adapter);
  const pb = ((prev?.batches as Batch[]) || []).filter((b) => b && b.adapter);
  const pm = new Map(pb.map((b) => [batchKey(b), b]));
  const cm = new Map(cb.map((b) => [batchKey(b), b]));
  const changes: BatchChange[] = [];
  for (const [k, b] of cm) {
    const p = pm.get(k);
    const delta: Record<string, number> = {};
    const states = new Set([...Object.keys(b.states || {}), ...Object.keys(p?.states || {})]);
    for (const s of states) {
      const d = (b.states?.[s] || 0) - (p?.states?.[s] || 0);
      if (d) delta[s] = d;
    }
    changes.push({
      key: k, adapter: b.adapter,
      change: !prev ? "ADDED" : !p ? "ADDED" : p.merkle_root === b.merkle_root ? "CARRIED" : "REBUILT",
      n_before: p?.n_capsules ?? null, n_after: b.n_capsules ?? null, states_delta: prev ? delta : {},
    });
  }
  if (prev) for (const [k, p] of pm) if (!cm.has(k)) changes.push({ key: k, adapter: p.adapter, change: "DROPPED", n_before: p.n_capsules ?? null, n_after: null, states_delta: {} });
  changes.sort((a, b) => a.key.localeCompare(b.key));
  const counts: Record<string, number> = { ADDED: 0, DROPPED: 0, CARRIED: 0, REBUILT: 0 };
  for (const c of changes) counts[c.change]++;
  return {
    date, prev_date: prevDate, baseline: !prev, changes, counts,
    n_capsules: typeof cur.n_capsules_total === "number" ? cur.n_capsules_total : null,
    n_capsules_prev: typeof prev?.n_capsules_total === "number" ? (prev.n_capsules_total as number) : null,
    index_root: typeof cur.index_root === "string" ? cur.index_root : null,
  };
}

export interface DailyNote { date: string; index: SignedRecord; prev: SignedRecord | null; diff: DailyDiff; harvest: Harvest }

export async function loadDailyNote(ctx: Ctx, date: string): Promise<DailyNote> {
  if (!DATE_RE.test(date)) throw new NotFound(date);
  const index = await loadIndex(ctx, date);
  const j = index.json;
  let prevDate: string | null = typeof j.prev_date === "string" && DATE_RE.test(j.prev_date) ? j.prev_date : null;
  if (!prevDate && !("prev_date" in j)) {
    // Schema 0.2 (the 26 Sep genesis) has no prev link: take the newest listed day before it, if any.
    const dates = await indexDates(ctx);
    prevDate = dates.filter((d) => d < date).at(-1) || null;
  }
  let prev: SignedRecord | null = null;
  if (prevDate) {
    try {
      prev = await loadIndex(ctx, prevDate);
      if (typeof j.prev_index_sha256 === "string" && j.prev_index_sha256 !== prev.sha256) prev = null; // the chain names other bytes: no diff is claimed
    } catch (e) {
      if (!(e instanceof NotFound)) throw e;
    }
  }
  const h = await harvest(ctx, date, index, (d) => loadIndex(ctx, d));
  return { date, index, prev, diff: diffIndexes(date, j, prev?.json ?? null, prev ? prevDate : null), harvest: h };
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function noteJson(n: DailyNote): Json {
  return {
    schema: "csoai.daily-note/0.1",
    url: `${SITE}/notes/daily/${n.date}/`,
    date: n.date,
    what_this_is: "A generated count of what changed between two signed daily measurement-capsule indexes. No editorial judgement.",
    index: { url: n.index.url, signed: n.index.signedUrl, sha256: n.index.sha256, signature: n.index.signature.state, as_of: n.index.as_of, index_root: n.diff.index_root },
    previous: n.prev ? { date: n.diff.prev_date, url: n.prev.url, sha256: n.prev.sha256, signature: n.prev.signature.state } : null,
    baseline: n.diff.baseline,
    counts_by_change: n.diff.counts,
    capsules_total: n.diff.n_capsules,
    capsules_total_previous: n.diff.n_capsules_prev,
    batches: n.diff.changes.map((c) => ({ ...c, entity_pages: `${SITE}${pageFor(c.adapter).href}` })),
    harvest: n.harvest,
    license: "CC-BY-4.0",
  };
}

function harvestHtml(h: Harvest): string {
  const d = h.divergences;
  const divs = d.state === "NO_RECORD"
    ? `<p>${badge("UNMEASURED")} No signed cross-ledger record is dated ${esc(h.date)}.</p>`
    : `<p class="mut">From <a href="${esc(d.record!.url)}">the ${esc(h.date)} cross-ledger record</a> (${esc(d.record!.version)}, <a href="${esc(d.record!.signed)}">signed wrapper</a>, sha256 <code>${esc(d.record!.sha256.slice(0, 16))}…</code>)${d.previous ? `, compared with the ${esc(d.previous.date)} record it names by sha256 <code>${esc(d.previous.sha256.slice(0, 16))}…</code>` : ": no earlier record to compare, so every divergence is listed as NEW (baseline)"}.</p>
${d.items.length ? `<ul>${d.items.map((x) => `<li>${esc(x.change)} ${badge(x.state === "INCONSISTENT" ? "INCONSISTENT" : "RESOLVED")} <a href="${esc(x.page.replace(SITE, ""))}">${esc(x.product || x.asset)} on ${esc(x.ledger)}</a>${x.kind ? ` <span class="mut">${esc(x.kind)}</span>` : ""}${x.was && x.change !== "NEW" ? ` <span class="mut">(was ${esc(x.was)})</span>` : ""}</li>`).join("")}</ul>` : "<p>No divergence is new, changed or resolved.</p>"}
${d.record_reported_changes && Object.keys(d.record_reported_changes).length ? `<p class="mut">The record's own change section also lists: ${Object.entries(d.record_reported_changes).map(([k, v]) => `${esc(k)} ${v}`).join(" · ")}. These are read changes, not divergences.</p>` : ""}`;
  const cor = h.corrections.items.length
    ? `<ul>${h.corrections.items.map((c) => `<li><a href="${esc(c.url.replace(SITE, ""))}">${esc(c.id)}</a> — ${esc(c.status)}</li>`).join("")}</ul>`
    : `<p>No correction is dated ${esc(h.date)} in the <a href="/api/corrections">signed ledger</a>.</p>`;
  const pay = h.payers.state === "UNMEASURED"
    ? `<p>${badge("UNMEASURED")} ${esc(h.payers.why || "")}</p>`
    : h.payers.items.length
      ? `<ul>${h.payers.items.map((x) => `<li>a wallet not ours, first paid on ${esc(dateOnly(x.settled_at))}: <a href="${esc(x.tx_url)}" rel="nofollow">settlement transaction</a>${x.resource ? ` <span class="mut">for ${esc(x.resource)}</span>` : ""}</li>`).join("")}</ul>`
      : `<p>No outside payer paid for the first time on ${esc(h.date)}. Self-settlements and zero-value settlements are never counted.</p>`;
  const ch = h.chain;
  return `<h2 id="harvest">Harvest for ${esc(h.date)}</h2>
<h3 id="divergences">Cross-ledger divergences</h3>
${divs}
<h3 id="corrections">New corrections</h3>
${cor}
<h3 id="payers">New outside payers</h3>
${pay}
<h3 id="reproductions">Outside reproductions or implementations</h3>
<p>${badge("UNMEASURED")} ${esc(h.reproductions.why)}.</p>
<h3 id="chain">Capsule chain</h3>
<p><strong>${ch.days_unbroken}</strong> day${ch.days_unbroken === 1 ? "" : "s"} unbroken, since ${esc(ch.since)}: each daily index names the previous day's bytes with no gap day between them, and every one verifies. <span class="mut">Walk stopped because ${esc(ch.stop)}.</span></p>`;
}

export function renderNote(n: DailyNote): Rendered {
  const url = `${SITE}/notes/daily/${n.date}/`;
  const d = n.diff;
  const title = `What changed on ${n.date} — daily harvest note | Council of AI`;
  const hv = n.harvest;
  const description = `Generated from the signed daily measurement-capsule index for ${n.date}${d.prev_date ? `, compared with ${d.prev_date}` : " (first index: baseline)"}: ${d.counts.REBUILT} batch${d.counts.REBUILT === 1 ? "" : "es"} rebuilt, ${d.counts.CARRIED} carried, ${d.counts.ADDED} added, ${d.counts.DROPPED} dropped; ${hv.divergences.items.length} divergence change${hv.divergences.items.length === 1 ? "" : "s"}, ${hv.corrections.items.length} correction${hv.corrections.items.length === 1 ? "" : "s"}, capsule chain unbroken ${hv.chain.days_unbroken} day${hv.chain.days_unbroken === 1 ? "" : "s"}.`;
  const rows = d.changes.map((c) => {
    const p = pageFor(c.adapter);
    const deltas = Object.entries(c.states_delta).map(([s, v]) => `${badge(s)} ${esc(signed(v))}`).join(" ");
    return `<tr><th scope="row"><code>${esc(c.key)}</code></th><td>${esc(c.change)}</td><td>${c.n_before ?? "—"} → ${c.n_after ?? "—"}</td><td>${deltas || '<span class="mut">no state change</span>'}</td><td><a href="${esc(p.href)}">${esc(p.label)}</a></td></tr>`;
  }).join("");
  const body = `${harvestHtml(hv)}
<h2 id="counts">Capsule index counts</h2>
<dl class="kv">
<dt>Index</dt><dd><a href="${esc(n.index.url)}">${esc(n.index.path)}</a> — signature ${badge(n.index.signature.state)} (<a href="${esc(n.index.signedUrl)}">signed wrapper</a>), sha256 <code>${esc(n.index.sha256.slice(0, 16))}…</code></dd>
<dt>Compared with</dt><dd>${n.prev ? `<a href="/notes/daily/${esc(d.prev_date)}/">${esc(d.prev_date)}</a> (<a href="${esc(n.prev.url)}">index</a>)` : `${badge("UNMEASURED")} no earlier signed index to compare: this day is the baseline`}</dd>
<dt>Batches</dt><dd>${Object.entries(d.counts).map(([k, v]) => `${esc(k)} ${v}`).join(" · ")}</dd>
<dt>Capsules in the index</dt><dd>${d.n_capsules ?? "not stated"}${d.n_capsules_prev != null && d.n_capsules != null ? ` (${esc(signed(d.n_capsules - d.n_capsules_prev))} against ${esc(d.prev_date)})` : ""}</dd>
</dl>
<h2 id="batches">By batch</h2>
<div class="tw"><table><caption>Measurement-capsule batches in the ${esc(n.date)} index</caption><thead><tr><th scope="col">Batch</th><th scope="col">Change</th><th scope="col">Capsules</th><th scope="col">State counts</th><th scope="col">Entity pages</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="mut">CARRIED means the batch is byte-identical to the previous day's (same Merkle root). REBUILT means a new signed batch replaced it. State counts are capsule states, not scores.</p>
<h2 id="verify">How to verify</h2>
<ol><li>Download the index and its signed wrapper; the wrapper pins the index's sha256 and is signed by <code>did:web:csoai.org#board-attestation-1</code>.</li><li>From 27 Sep 2026 each index names the previous day's bytes (<code>prev_index_sha256</code>), so the days form a hash chain; the dataset README walks it back to genesis.</li></ol>
<p class="mut">Other days: <a href="/notes/daily/">all daily notes</a> · feeds: <a href="/feeds/records.xml">Atom</a>, <a href="/feeds/records.json">JSON Feed</a>.</p>`;
  return {
    status: 200, contentType: "text/html; charset=utf-8", lastModified: n.index.as_of,
    body: renderPage({
      title, description, canonical: url, twin: `${url}index.json`,
      crumbs: [{ href: "/", label: "Home" }, { href: "/notes/daily/", label: "Daily notes" }, { label: n.date }],
      h1: `What changed on ${n.date}`,
      lede: "The day's harvest, generated only from the signed outputs dated this day: divergences, corrections, outside payers, outside reproductions, and the capsule chain. Each item links to its signed record.",
      subjectLabel: "anything measured in these batches",
      evidence: "Counts are read from two board-signed daily indexes; nothing is re-measured and nothing is judged.",
      body,
      jsonld: datasetLd({ name: `Daily measurement note ${n.date}`, description, url, isBasedOn: [n.index.url, n.index.signedUrl, ...(n.prev ? [n.prev.url] : [])], dateModified: n.index.as_of }),
    }),
  };
}

/** Past daily indexes never change (the chain forbids rewriting), so a day's verification result is
 *  memoised in the Cache API for a week; a day that did not verify is re-checked after an hour. At most
 *  VERIFY_BUDGET uncached days are verified per request, keeping a cold list inside the CPU budget; a
 *  day over budget is left out of THIS response (never guessed) and is listed once it has been checked. */
export const VERIFY_BUDGET = 12;
const dayKey = (d: string) => new Request(`${SITE}/__reach/day-verified/${d}?v=${RENDER_VERSION}`, { method: "GET" });

export async function verifiedDays(ctx: Ctx): Promise<{ date: string; as_of: string | null }[]> {
  const dates = (await indexDates(ctx)).slice(-MAX_DAYS).reverse();
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default ?? null;
  let budget = VERIFY_BUDGET;
  const out: { date: string; as_of: string | null }[] = [];
  for (const d of dates) {
    if (cache) {
      try {
        const hit = await cache.match(dayKey(d));
        if (hit) {
          const j = (await hit.json()) as { ok: boolean; as_of: string | null };
          if (j.ok) out.push({ date: d, as_of: j.as_of });
          continue;
        }
      } catch {
        /* miss */
      }
    }
    if (budget-- <= 0) continue;
    let ok = false;
    let as_of: string | null = null;
    try {
      const r = await loadIndex(ctx, d);
      ok = true;
      as_of = r.as_of;
      out.push({ date: d, as_of });
    } catch (e) {
      if (!(e instanceof NotFound)) throw e;
    }
    if (cache) {
      const put = cache.put(dayKey(d), new Response(JSON.stringify({ ok, as_of }), { headers: { "content-type": "application/json", "cache-control": `public, max-age=${ok ? 604800 : 3600}` } })).catch(() => undefined);
      if (ctx.waitUntil) ctx.waitUntil(put);
    }
  }
  return out;
}

export function renderNotesHub(days: { date: string; as_of: string | null }[]): Rendered {
  const url = `${SITE}/notes/daily/`;
  const body = `<h2 id="days">Days</h2>
${days.length ? `<ul>${days.map((d) => `<li><a href="/notes/daily/${esc(d.date)}/">${esc(d.date)}</a> <span class="mut">index as of ${esc(dateOnly(d.as_of))}</span></li>`).join("")}</ul>` : `<p>${badge("UNMEASURED")} No signed daily index verifies yet.</p>`}
<p class="mut">One note per day, generated after the daily index is published (capsule-daily, 08:05 UTC). A day whose signature does not verify has no note. Feeds: <a href="/feeds/records.xml">Atom</a> · <a href="/feeds/records.json">JSON Feed</a>.</p>`;
  return {
    status: 200, contentType: "text/html; charset=utf-8", lastModified: days[0]?.as_of ?? null,
    body: renderPage({
      title: "Daily measurement notes — what changed each day | Council of AI",
      description: "One generated note per day: what changed in Council of AI's signed daily measurement-capsule index, with counts by type and links to the entity pages.",
      canonical: url, crumbs: [{ href: "/", label: "Home" }, { label: "Daily notes" }],
      h1: "Daily measurement notes", lede: "What changed each day in the signed measurement index. Generated, dated, and published only when the index signature verifies.",
      subjectLabel: "anything measured", body,
    }),
  };
}
