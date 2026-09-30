/**
 * /x402/<door-or-host>/ — two kinds of x402 entity, told apart by the key:
 *
 *  - a DOOR (key = catalog id, e.g. free_door): one of Council of AI's own x402 resources, as the
 *    catalog at /api/x402 declares it. Observed is UNMEASURED on purpose: our own doors are excluded
 *    from the settlement census (paying ourselves is a self-settlement, never evidence), and a claimant
 *    never measures itself.
 *  - a HOST (key = DNS name): a third-party host in the x402 settlement census that has a published
 *    census card (/interop/x402-census-cards/). One paid request per round; the host's series stays
 *    UNMEASURED until the census ladder's n is reached, and the page says so.
 */
import { onRequestGet as x402Catalog } from "../../api/x402";
import { type Ctx, type Json, type Rendered, HOST_RE, NotFound, SITE, SourceError, badge, dateOnly, datasetLd, esc, fetchStaticJson, renderPage } from "./core";
import { TOPIC, correctionLink, pendingForHost, type Correction } from "./corrections";
import { excludedBy, loadExclusionsFromDoc } from "./optout";
import exclusionsDoc from "../../../scripts/census/probe-exclusions.json";

export const DOOR_RE = /^[a-z][a-z0-9_]{1,63}$/;

export interface Door { id: string; name?: string; resource?: string; free_preview?: string; free_preview_note?: string; deliverable?: string; never?: string[] }
export interface CensusCard { card: string; card_sha256: string; status: string | null; resource: string | null; asset: string | null; network: string | null; x402_version: number | null; observed_at: string | null; advertised_mime: string | null; delivered_content_type: string | null; delivered_bytes: number | null; settle_tx: string | null; settle_tx_state: string | null; n: number; unmeasured: string[] }
export interface CensusIndex { schema: string; as_of: string | null; source: { index: string; rounds: string[]; ladder: { n_required?: number; rule?: string; rounds_so_far?: number } | null }; doctrine: string; hosts: Record<string, CensusCard[]> }

export async function loadDoors(ctx: Ctx): Promise<{ doors: Door[]; catalog: Json }> {
  let catalog: Json;
  try {
    const r = await (x402Catalog as unknown as (c: unknown) => Promise<Response>)({ request: new Request(`${SITE}/api/x402`), env: ctx.env || {}, params: {}, waitUntil: () => undefined });
    catalog = (await r.json()) as Json;
  } catch (e) {
    throw new SourceError("x402 catalog", (e as Error).message.slice(0, 120));
  }
  const doors = ((catalog.resources as Door[]) || []).filter((d) => d && typeof d.id === "string" && DOOR_RE.test(d.id));
  return { doors, catalog };
}

export async function loadCensus(ctx: Ctx): Promise<CensusIndex> {
  const idx = await fetchStaticJson<CensusIndex>(ctx, "/reach/v1/x402-census.json", "x402 census index");
  if (!idx?.hosts || typeof idx.hosts !== "object") throw new SourceError("x402 census index", "no hosts map");
  const exclusions = loadExclusionsFromDoc(exclusionsDoc);
  for (const h of Object.keys(idx.hosts)) if (!HOST_RE.test(h) || excludedBy(`https://${h}/`, exclusions)) delete idx.hosts[h];
  return idx;
}

export type X402Entity =
  | { kind: "door"; key: string; door: Door; catalog: Json }
  | { kind: "host"; key: string; cards: CensusCard[]; census: CensusIndex; pending: Correction[] };

export async function loadX402(ctx: Ctx, rawKey: string): Promise<X402Entity> {
  const key = rawKey.toLowerCase();
  if (DOOR_RE.test(key)) {
    const { doors, catalog } = await loadDoors(ctx);
    const door = doors.find((d) => d.id === key);
    if (!door) throw new NotFound(key);
    return { kind: "door", key, door, catalog };
  }
  if (!HOST_RE.test(key)) throw new NotFound(rawKey);
  const census = await loadCensus(ctx);
  const cards = census.hosts[key];
  if (!cards?.length) throw new NotFound(key);
  return { kind: "host", key, cards, census, pending: pendingForHost(key, undefined, TOPIC.x402) };
}

const DOCTRINE = "Measurement of declared vs observed. Says nothing about security, quality or safety; not a certification, rating, ranking or endorsement.";

export function x402Json(e: X402Entity): Json {
  if (e.kind === "door") {
    return {
      schema: "csoai.reach-entity/0.1", type: "x402-door", url: `${SITE}/x402/${e.key}/`, subject: { door: e.key, operator: "Council of AI (our own door)" },
      doctrine: DOCTRINE,
      declared: { name: e.door.name ?? null, resource: e.door.resource ?? null, free_preview: e.door.free_preview ?? null, deliverable: e.door.deliverable ?? null, never: e.door.never ?? [] },
      observed: { state: "UNMEASURED", why: "Our own doors are excluded from the x402 settlement census: a payment from our own wallet is a self-settlement, never evidence, and a claimant does not measure itself." },
      sources: { catalog: `${SITE}/api/x402`, well_known: `${SITE}/.well-known/x402.json` },
      objections: `${SITE}/census/`, license: "CC-BY-4.0",
    };
  }
  const withheld = e.pending.length > 0;
  const ladder = e.census.source.ladder;
  return {
    schema: "csoai.reach-entity/0.1", type: "x402-census-host", url: `${SITE}/x402/${e.key}/`, subject: { host: e.key },
    doctrine: DOCTRINE,
    series_state: "UNMEASURED",
    series_rule: ladder?.rule ?? null,
    paid_observations: e.cards.reduce((a, c) => a + (c.n || 1), 0),
    n_required: ladder?.n_required ?? null,
    pending_corrections: e.pending.map((c) => ({ id: c.id, status: c.status, url: `${SITE}${correctionLink(c.id)}` })),
    findings_state: withheld ? "WITHHELD_PENDING_CORRECTION" : "PUBLISHED",
    observations: withheld ? "WITHHELD" : e.cards.map((c) => ({
      declared: { resource: c.resource, advertised_mime: c.advertised_mime, asset: c.asset, network: c.network, x402_version: c.x402_version },
      observed: { status: c.status, observed_at: c.observed_at, delivered_content_type: c.delivered_content_type, delivered_bytes: c.delivered_bytes, settle_tx: c.settle_tx, settle_tx_state: c.settle_tx_state },
      unmeasured: c.unmeasured, card: `${SITE}${c.card}`, card_sha256: c.card_sha256,
    })),
    sources: { census_index: `${SITE}${e.census.source.index}`, rounds: e.census.source.rounds },
    objections: `${SITE}/census/`, operator_context: "The operator can add context through the objection route; what they send is recorded with the next census run.", license: "CC-BY-4.0",
  };
}

export function renderX402(e: X402Entity): Rendered {
  const url = `${SITE}/x402/${e.key}/`;
  if (e.kind === "door") {
    const d = e.door;
    const title = `${d.name || e.key} — Council of AI x402 door | Council of AI`;
    const description = `What Council of AI's own x402 door "${d.name || e.key}" declares it delivers, and why its observed state is UNMEASURED. Verification stays free; no price is published here.`;
    const body = `<h2 id="declared">Declared (our catalog)</h2>
<dl class="kv">
<dt>Door id</dt><dd><code>${esc(e.key)}</code></dd>
<dt>Resource</dt><dd>${d.resource ? `<code>${esc(d.resource)}</code>` : '<span class="mut">not stated</span>'}</dd>
<dt>Free preview</dt><dd>${d.free_preview ? `<code>${esc(d.free_preview)}</code>` : '<span class="mut">none</span>'}${d.free_preview_note ? `<br><span class="mut">${esc(d.free_preview_note)}</span>` : ""}</dd>
<dt>Delivers</dt><dd>${esc(d.deliverable || "not stated")}</dd>
<dt>Never delivers</dt><dd>${(d.never || []).map((x) => esc(x)).join(" · ") || '<span class="mut">not stated</span>'}</dd>
</dl>
<h2 id="observed">Observed</h2>
<p>${badge("UNMEASURED")} This is Council of AI's own door. Our doors are excluded from the x402 settlement census — paying ourselves is a self-settlement and never evidence — and we do not measure our own claims. An independent buyer's observation would be the evidence.</p>
<p class="mut">Amounts appear only inside each resource's live 402 challenge, never on this page.</p>
<h2 id="verify">How to check it yourself</h2>
<ol><li>Request the resource without payment: the 402 challenge states what it asks and where it pays.</li><li>The catalog this page reads is <a href="/api/x402">/api/x402</a>; the well-known descriptor is <a href="/.well-known/x402.json">/.well-known/x402.json</a>.</li></ol>`;
    return {
      status: 200, contentType: "text/html; charset=utf-8", lastModified: null,
      body: renderPage({
        title, description, canonical: url, twin: `${url}index.json`,
        crumbs: [{ href: "/", label: "Home" }, { href: "/x402/", label: "x402" }, { label: d.name || e.key }],
        h1: `x402 door: ${d.name || e.key}`, lede: "One of Council of AI's own x402 resources, as our catalog declares it.",
        subjectLabel: "this door", evidence: "Declared only. Observed is UNMEASURED by design: a claimant is never its own evidence.", body,
        jsonld: datasetLd({ name: `x402 door: ${d.name || e.key}`, description, url, isBasedOn: [`${SITE}/api/x402`, `${SITE}/.well-known/x402.json`] }),
      }),
    };
  }
  const withheld = e.pending.length > 0;
  const ladder = e.census.source.ladder;
  const nObs = e.cards.reduce((a, c) => a + (c.n || 1), 0);
  const last = e.cards.map((c) => c.observed_at).filter(Boolean).sort().at(-1) || e.census.as_of;
  const title = `${e.key} — x402 settlement census observation | Council of AI`;
  const description = `${e.key} in the Council of AI x402 settlement census: ${nObs} paid observation${nObs === 1 ? "" : "s"}, last ${dateOnly(last)}. Its series is UNMEASURED until ${ladder?.n_required ?? "the required number of"} observations. Measurement only.`;
  const rows = e.cards.map((c) => `<tr><th scope="row"><code>${esc(c.resource || "")}</code></th>
<td>${c.advertised_mime ? `advertised <code>${esc(c.advertised_mime)}</code>` : '<span class="mut">no type advertised</span>'}<br><span class="mut">${esc(c.asset || "")} on ${esc(c.network || "")} · x402 v${esc(c.x402_version ?? "?")}</span></td>
<td>${withheld ? badge("WITHHELD") : `${badge(c.status)} on ${esc(dateOnly(c.observed_at))}${c.delivered_content_type ? `<br>delivered <code>${esc(c.delivered_content_type)}</code>${c.delivered_bytes != null ? `, ${esc(c.delivered_bytes)} bytes` : ""}` : ""}${c.settle_tx_state ? `<br><span class="mut">${esc(c.settle_tx_state)}</span>` : c.settle_tx ? `<br><span class="mut">settlement <code>${esc(c.settle_tx)}</code></span>` : ""}`}</td>
<td><a href="${esc(c.card)}">card</a><br><span class="mut"><code>${esc(c.card_sha256.slice(0, 12))}…</code></span></td></tr>`).join("");
  const unmeasured = [...new Set(e.cards.flatMap((c) => c.unmeasured))];
  const pendingHtml = withheld
    ? `<div class="box warn" role="alert"><h2 id="correction">A correction is pending</h2>${e.pending.map((c) => `<p><a href="${esc(correctionLink(c.id))}"><strong>${esc(c.id)}</strong></a> — ${esc(c.status || "")}</p><p>${esc(c.what_was_wrong || "")}</p>`).join("")}<p>Until it is published, the observations on this page are withheld.</p></div>`
    : "";
  const body = `${pendingHtml}
<h2 id="series">Series state</h2>
<p>${badge("UNMEASURED")} ${nObs} paid observation${nObs === 1 ? "" : "s"} so far. ${esc(ladder?.rule || "A host's series stays UNMEASURED until the census ladder's number of paid observations is reached.")}</p>
<h2 id="observations">Declared vs observed, per paid request</h2>
<div class="tw"><table><caption>Paid requests to ${esc(e.key)} in the x402 settlement census</caption><thead><tr><th scope="col">Resource</th><th scope="col">Declared (402 challenge)</th><th scope="col">Observed</th><th scope="col">Evidence</th></tr></thead><tbody>${rows}</tbody></table></div>
${unmeasured.length ? `<h2 id="unmeasured">Not measured by these observations</h2><ul>${unmeasured.map((u) => `<li>${esc(u)}</li>`).join("")}</ul>` : ""}
<h2 id="verify">How to verify</h2>
<ol><li>Each census card is a published file whose sha256 is shown; the settlement, where reported, is on the named network.</li><li>The round summary is at <a href="${esc(e.census.source.index)}">${esc(e.census.source.index)}</a> and the rounds are diffed at <a href="/interop/x402-census/">/interop/x402-census/</a>.</li></ol>`;
  return {
    status: 200, contentType: "text/html; charset=utf-8", lastModified: last,
    body: renderPage({
      title, description, canonical: url, twin: `${url}index.json`,
      crumbs: [{ href: "/", label: "Home" }, { href: "/x402/", label: "x402" }, { label: e.key }],
      h1: `x402 settlement census: ${e.key}`, lede: `What ${esc(e.key)}'s x402 challenge declared, against what one paid request received.`,
      subjectLabel: `the service at ${e.key}`,
      evidence: "One paid request per host per round, from a wallet Council of AI controls, as an ordinary buyer. One observation is not a pattern; a refusal is not proof of bad faith.",
      body,
      jsonld: datasetLd({ name: `x402 settlement census: ${e.key}`, description, url, isBasedOn: [`${SITE}${e.census.source.index}`, ...e.cards.map((c) => `${SITE}${c.card}`)], dateModified: last,
        about: { "@type": "WebAPI", name: e.key, url: `https://${e.key}/` } }),
    }),
  };
}
