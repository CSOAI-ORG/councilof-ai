/**
 * /mcp-servers/<host>/ — one MCP host: every endpoint the contract-parity census read on it, the five
 * parity dimensions (declared vs observed), the newest census observation, first and last seen, and
 * where its signed capsules are verified.
 *
 * SOURCE. /reach/v1/ (scripts/reach/build-reach-index.mjs): a sharded copy of three board-signed
 * records — MCP contract parity 0.1.2, the MCP remote census 0.2.1 population, and the newest daily
 * census — whose manifest names each record, its signature state and every file's sha256.
 */
import {
  type Ctx, type Json, type Rendered, NotFound, SITE, SourceError, badge, dateOnly, datasetLd, esc, fetchStaticJson, renderPage, STATE_MEANING, HOST_RE,
} from "./core";
import { TOPIC, correctionLink, pendingForHost, type Correction } from "./corrections";
import { excludedBy, loadExclusionsFromDoc } from "./optout";
import exclusionsDoc from "../../../scripts/census/probe-exclusions.json";

export const DIMS = ["AUTH", "PAYMENT", "PROTOCOL", "TOOLS", "VERSION"] as const;
export const DIM_QUESTION: Record<string, string> = {
  AUTH: "Do the public statements and the live discovery agree on whether credentials are required?",
  PAYMENT: "Do the payment statements (x402) name tools the live server actually lists?",
  PROTOCOL: "Does the MCP protocol version stated publicly match what the live server negotiated?",
  TOOLS: "Does the declared tool list match the tools/list the live server returned?",
  VERSION: "Does the server version stated in registries and cards match what the live server reports?",
};

export interface Dim { s: string; d?: string[]; dn?: number; o?: string; x?: string; r?: string }
export interface Endpoint {
  u: string; reg: string[]; inc: string | null; own: boolean;
  live: { s: string; at: string | null; http: number | null; pv: string | null; sv: string | null; nt: number | null; src: string | null } | null;
  dims: Record<string, Dim>;
  surf: Record<string, string>;
  cen: { s: string; at: string | null; why: string; pv: string | null; nt: number | null; tr: string | null; run: string | null } | null;
  seen: { first: string | null; last: string | null; n: number } | null;
  caps: number;
}
export interface Manifest {
  schema: string; built_at: string; shard_rule: string;
  sources: Record<string, { dataset?: string; record?: string; record_url?: string; signed_url?: string; record_sha256?: string; signature?: string; as_of?: string | null; files?: Record<string, string> }>;
  types: Record<string, Json>;
}

export const shardPath = async (host: string) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(host.toLowerCase()));
  return `/reach/v1/mcp/${(new Uint8Array(d)[0] >> 4).toString(16)}.json`;
};

export async function loadManifest(ctx: Ctx): Promise<Manifest> {
  const m = await fetchStaticJson<Manifest>(ctx, "/reach/v1/manifest.json", "reach index manifest");
  if (m?.schema !== "csoai.reach-index/0.1") throw new SourceError("reach index manifest", "unexpected schema");
  for (const s of ["contract_parity", "census_population", "census_daily"]) {
    if (m.sources?.[s]?.signature !== "VERIFIES") throw new SourceError("reach index manifest", `source ${s} is not signature-verified`);
  }
  return m;
}

/** A shard as scripts/reach/build-reach-index.mjs writes it: dimension texts interned in `t`. */
export interface ShardDoc { t?: string[]; hosts?: Record<string, Endpoint[]> }

/** Resolve ONE host's interned strings (never the whole shard — that is the CPU the interning saves). */
export function resolveHost(doc: ShardDoc, host: string): Endpoint[] {
  const t = doc.t || [];
  const r = (i: unknown) => (typeof i === "number" ? t[i] : (i as string | undefined));
  return (doc.hosts?.[host] || []).map((e) => ({
    ...e,
    dims: Object.fromEntries(Object.entries(e.dims || {}).map(([k, d]) => [k, {
      ...d,
      ...(d.d ? { d: (d.d as unknown[]).map(r) as string[] } : {}),
      ...(d.o != null ? { o: r(d.o) } : {}),
      ...(d.x != null ? { x: r(d.x) } : {}),
      ...(d.r != null ? { r: r(d.r) } : {}),
    }])),
    ...(e.cen ? { cen: { ...e.cen, why: r(e.cen.why) ?? "" } } : {}),
  }));
}

export interface McpHost { host: string; endpoints: Endpoint[]; manifest: Manifest; pending: Correction[] }

export async function loadMcpHost(ctx: Ctx, rawHost: string): Promise<McpHost> {
  const host = rawHost.toLowerCase();
  if (!HOST_RE.test(host)) throw new NotFound(rawHost);
  const exclusions = loadExclusionsFromDoc(exclusionsDoc);
  if (excludedBy(`https://${host}/`, exclusions)) throw new NotFound(host);
  const manifest = await loadManifest(ctx);
  const shard = await fetchStaticJson<ShardDoc>(ctx, await shardPath(host), "reach index shard");
  const eps = resolveHost(shard, host).filter((e) => !excludedBy(e.u, exclusions));
  if (!eps.length) throw new NotFound(host);
  return { host, endpoints: eps, manifest, pending: pendingForHost(host, undefined, TOPIC.mcp) };
}

const src = (m: Manifest, k: string) => m.sources?.[k] || {};

function isBasedOn(m: Manifest): string[] {
  return ["contract_parity", "census_population", "census_daily"].flatMap((k) => [src(m, k).record_url, src(m, k).signed_url]).filter((x): x is string => !!x);
}

const lastSeen = (eps: Endpoint[]) => eps.map((e) => e.seen?.last || e.live?.at || null).filter(Boolean).sort().at(-1) || null;
const firstSeen = (eps: Endpoint[]) => eps.map((e) => e.seen?.first || e.live?.at || null).filter(Boolean).sort()[0] || null;

/** The machine twin. A pending correction withholds every finding; the correction is carried instead. */
export function mcpJson(h: McpHost): Json {
  const m = h.manifest;
  const withheld = h.pending.length > 0;
  return {
    schema: "csoai.reach-entity/0.1",
    type: "mcp-server-host",
    url: `${SITE}/mcp-servers/${h.host}/`,
    subject: { host: h.host },
    doctrine: "Measurement of declared vs observed public statements. Says nothing about security, quality or safety; not a certification, rating, ranking or endorsement.",
    evidence_level: "Discovery boundary only (initialize + tools/list); tools were never called, and no credentials or payments were sent.",
    first_seen: firstSeen(h.endpoints),
    last_seen: lastSeen(h.endpoints),
    first_last_seen_basis: "earliest and latest observation of any endpoint on this host across the census records named in sources",
    pending_corrections: h.pending.map((c) => ({ id: c.id, status: c.status, what_was_wrong: c.what_was_wrong, url: `${SITE}${correctionLink(c.id)}` })),
    findings_state: withheld ? "WITHHELD_PENDING_CORRECTION" : "PUBLISHED",
    endpoints: h.endpoints.map((e) => ({
      endpoint: e.u,
      registry_ids: e.reg,
      own_estate: e.own,
      contract_parity: withheld ? "WITHHELD" : Object.fromEntries(DIMS.map((k) => [k, { state: e.dims[k]?.s ?? "UNMEASURED", declared: e.dims[k]?.d ?? [], declared_total: e.dims[k]?.dn ?? e.dims[k]?.d?.length ?? 0, observed: e.dims[k]?.o ?? null, detail: e.dims[k]?.x ?? null, reason: e.dims[k]?.r ?? null }])),
      parity_live_read: e.live,
      public_surfaces: e.surf,
      latest_census: e.cen,
      seen: e.seen,
      capsules: { n: e.caps, verify: `${SITE}/verify-server/?url=${encodeURIComponent(e.u)}` },
    })),
    sources: Object.fromEntries(["contract_parity", "census_population", "census_daily"].map((k) => [k, src(m, k)])),
    index: { manifest: `${SITE}/reach/v1/manifest.json`, built_at: m.built_at },
    how_to_verify: [
      "Each record named in sources is signed (csoai.signed-run/0.1) by did:web:csoai.org#board-attestation-1; the signed payload pins the record's sha256 and the record pins each data file's sha256.",
      `Per-endpoint measurement capsules: ${SITE}/verify-server/?url=<endpoint> recomputes each capsule id, its Merkle inclusion and the index signature in the browser.`,
    ],
    objections: `${SITE}/census/`,
    operator_context: "The operator can add context through the objection route; what they send is recorded with the next census run.",
    license: "CC-BY-4.0",
  };
}

function dimRow(k: string, d: Dim | undefined): string {
  const s = d?.s || "UNMEASURED";
  const declared = d?.d?.length
    ? `<ul>${d.d.map((x) => `<li><code>${esc(x)}</code></li>`).join("")}${d.dn && d.dn > d.d.length ? `<li class="mut">+${d.dn - d.d.length} more in the record</li>` : ""}</ul>`
    : `<span class="mut">no surface states this</span>`;
  const observed = d?.o ? `<code>${esc(d.o)}</code>` : `<span class="mut">not observed</span>`;
  const note = [d?.x, d?.r].filter(Boolean).map((x) => esc(x)).join(" · ");
  return `<tr><th scope="row">${esc(k)}<br><span class="mut">${esc(DIM_QUESTION[k] || "")}</span></th><td>${badge(s)}<br><span class="mut">${esc(STATE_MEANING[s] || "")}</span></td><td>${declared}</td><td>${observed}${note ? `<br><span class="mut">${note}</span>` : ""}</td></tr>`;
}

function endpointSection(e: Endpoint, withheld: boolean, i: number): string {
  const kv = (k: string, v: string) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
  const cen = e.cen
    ? `${badge(e.cen.s)} on ${esc(dateOnly(e.cen.at))}${e.cen.pv ? ` · protocol <code>${esc(e.cen.pv)}</code>` : ""}${e.cen.nt != null ? ` · ${esc(e.cen.nt)} tools listed` : ""}${e.cen.tr ? ` · ${esc(e.cen.tr)}` : ""}${e.cen.why ? `<br><span class="mut">${esc(e.cen.why)}</span>` : ""}`
    : badge("UNMEASURED");
  const live = e.live
    ? `${badge(e.live.s)} on ${esc(dateOnly(e.live.at))}${e.live.sv ? ` · server version <code>${esc(e.live.sv)}</code>` : ""}${e.live.pv ? ` · protocol <code>${esc(e.live.pv)}</code>` : ""}${e.live.nt != null ? ` · ${esc(e.live.nt)} tools` : ""}`
    : badge("UNMEASURED");
  const surfaces = Object.keys(e.surf || {}).length
    ? Object.entries(e.surf).map(([k, v]) => `<code>${esc(k)}</code>: ${esc(v || "not read")}`).join(" · ")
    : `<span class="mut">none read</span>`;
  const parity = withheld
    ? `<p>${badge("WITHHELD")} The contract-parity findings for this endpoint are withheld while the correction above is pending.</p>`
    : `<div class="tw"><table><caption>Contract parity for ${esc(e.u)}: what public surfaces declared, against what the live server answered</caption><thead><tr><th scope="col">Dimension</th><th scope="col">State</th><th scope="col">Declared</th><th scope="col">Observed</th></tr></thead><tbody>${DIMS.map((k) => dimRow(k, e.dims[k])).join("")}</tbody></table></div>`;
  return `<h3 id="ep-${i + 1}"><code>${esc(e.u)}</code></h3>
<dl class="kv">
${kv("Registry names", e.reg.length ? e.reg.map((r) => `<code>${esc(r)}</code>`).join(", ") : '<span class="mut">none recorded</span>')}
${kv("Newest census observation", cen)}
${kv("Live read used for parity", live)}
${kv("First and last seen", e.seen ? `${esc(dateOnly(e.seen.first))} → ${esc(dateOnly(e.seen.last))} <span class="mut">(${esc(e.seen.n)} observation${e.seen.n === 1 ? "" : "s"} across the records below)</span>` : '<span class="mut">not recorded</span>')}
${kv("Public surfaces read", surfaces)}
${kv("Signed capsules", e.caps ? `${esc(e.caps)} — <a href="/verify-server/?url=${esc(encodeURIComponent(e.u))}">see and verify them</a>` : `none for this endpoint (only CONSISTENT, INCONSISTENT and UNCHECKABLE dimensions become capsules) — <a href="/verify-server/?url=${esc(encodeURIComponent(e.u))}">look it up</a>`)}
${e.own ? kv("Note", "This endpoint is run by Council of AI itself. Its row is published first and measured by the same instrument.") : ""}
</dl>
${parity}`;
}

export function renderMcp(h: McpHost): Rendered {
  const m = h.manifest;
  const withheld = h.pending.length > 0;
  const url = `${SITE}/mcp-servers/${h.host}/`;
  const n = h.endpoints.length;
  const counts: Record<string, number> = {};
  for (const e of h.endpoints) for (const k of DIMS) counts[e.dims[k]?.s || "UNMEASURED"] = (counts[e.dims[k]?.s || "UNMEASURED"] || 0) + 1;
  const summary = withheld
    ? "Findings withheld while a correction is pending."
    : Object.entries(counts).sort().map(([s, c]) => `${c} ${s}`).join(", ");
  const title = `${h.host} — MCP server contract parity | Council of AI`;
  const description = `Declared vs observed for the MCP server${n === 1 ? "" : "s"} at ${h.host}: ${n} endpoint${n === 1 ? "" : "s"}, five contract-parity dimensions (${summary}), last observed ${dateOnly(lastSeen(h.endpoints))}. Measurement only.`;
  const pendingHtml = withheld
    ? `<div class="box warn" role="alert"><h2 id="correction">A correction is pending</h2>${h.pending.map((c) => `<p><a href="${esc(correctionLink(c.id))}"><strong>${esc(c.id)}</strong></a> — ${esc(c.status || "")}</p><p>${esc(c.what_was_wrong || "")}</p>`).join("")}<p>Until it is published, the findings on this page are withheld and this correction is shown instead.</p></div>`
    : "";
  const sources = ["contract_parity", "census_population", "census_daily"].map((k) => {
    const s = src(m, k);
    return `<li><a href="${esc(s.record_url || "#")}">${esc(s.dataset)} · ${esc(s.record)}</a> — as of ${esc(dateOnly(s.as_of))}, signature ${badge(s.signature)} (<a href="${esc(s.signed_url || "#")}">signed wrapper</a>), record sha256 <code>${esc(String(s.record_sha256 || "").slice(0, 16))}…</code></li>`;
  }).join("");
  const body = `${pendingHtml}
<h2 id="summary">Summary</h2>
<dl class="kv">
<dt>Endpoints read on this host</dt><dd>${n}</dd>
<dt>Dimension states</dt><dd>${withheld ? badge("WITHHELD") : Object.entries(counts).sort().map(([s, c]) => `${badge(s)} ×${c}`).join(" ")}</dd>
<dt>First seen</dt><dd>${esc(dateOnly(firstSeen(h.endpoints)))}</dd>
<dt>Last seen</dt><dd>${esc(dateOnly(lastSeen(h.endpoints)))}</dd>
</dl>
<p class="mut">States are counted per endpoint and dimension. They are not added up into a score, and hosts are never ranked.</p>
<h2 id="endpoints">Endpoints</h2>
${h.endpoints.map((e, i) => endpointSection(e, withheld, i)).join("\n")}
<h2 id="verify">How to verify</h2>
<ol>
<li>Download a record below and its signed wrapper. The wrapper's payload pins the record's sha256, and is signed by <code>did:web:csoai.org#board-attestation-1</code> (<a href="https://csoai.org/.well-known/did.json">public key</a>).</li>
<li>The record pins the sha256 of each data file; this host's rows are in those files under the endpoint URLs above.</li>
<li>Per-endpoint capsules can be recomputed in your browser at <a href="/verify-server/">/verify-server/</a> (capsule id, Merkle inclusion, index signature).</li>
</ol>
<h2 id="sources">Sources</h2>
<ul>${sources}</ul>
<p class="mut">This page is rendered from <a href="/reach/v1/manifest.json">/reach/v1/manifest.json</a> (built ${esc(dateOnly(m.built_at))}), a sharded copy of the records above.</p>`;
  const lm = lastSeen(h.endpoints) || m.built_at;
  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    lastModified: lm,
    body: renderPage({
      title, description, canonical: url, twin: `${url}index.json`,
      crumbs: [{ href: "/", label: "Home" }, { href: "/mcp-servers/", label: "MCP servers" }, { label: h.host }],
      h1: `MCP server contract parity: ${h.host}`,
      lede: `What the public statements about ${n === 1 ? "this MCP endpoint" : `these ${n} MCP endpoints`} declared, against what the live server answered.`,
      subjectLabel: `the servers at ${h.host}`,
      evidence: "Discovery boundary only: <code>initialize</code> and <code>tools/list</code> were read; no tool was called, and no credentials or payments were sent. INCONSISTENT means two public statements disagree, not which one is true.",
      body,
      jsonld: datasetLd({
        name: `MCP contract parity: ${h.host}`,
        description,
        url,
        isBasedOn: isBasedOn(m),
        dateModified: lm,
        temporalCoverage: firstSeen(h.endpoints) && lastSeen(h.endpoints) ? `${firstSeen(h.endpoints)}/${lastSeen(h.endpoints)}` : null,
        variableMeasured: [...DIMS],
        about: { "@type": "SoftwareApplication", name: h.host, url: `https://${h.host}/`, applicationCategory: "Model Context Protocol server" },
      }),
    }),
  };
}

/** Hub + sitemap rows: [host, endpoints, CONSISTENT, INCONSISTENT, SINGLE_SURFACE, UNCHECKABLE, last_seen, own]. */
export async function loadMcpList(ctx: Ctx): Promise<{ rows: (string | number | null)[][]; manifest: Manifest }> {
  const manifest = await loadManifest(ctx);
  const list = await fetchStaticJson<{ rows?: (string | number | null)[][] }>(ctx, "/reach/v1/mcp/list.json", "reach index list");
  const exclusions = loadExclusionsFromDoc(exclusionsDoc);
  const rows = (list.rows || []).filter((r) => typeof r[0] === "string" && HOST_RE.test(r[0] as string) && !excludedBy(`https://${r[0]}/`, exclusions));
  return { rows, manifest };
}
