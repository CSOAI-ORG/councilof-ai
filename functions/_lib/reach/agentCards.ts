/**
 * /agent-cards/<host>/ — one host's published A2A agent card: what the listing declared (where the
 * card lives, which protocol version) against what was fetched (was a card served, which version it
 * states, whether it carries signatures and whether they verify).
 *
 * SOURCE. The newest signed daily record of csoai/a2a-card-census (record.<date>.json), its signed
 * wrapper, and the cards file that record pins by sha256 — all read at request time.
 */
import { type Ctx, type Json, type Rendered, HOST_RE, NotFound, SITE, badge, dateOnly, datasetLd, esc, renderPage, STATE_MEANING } from "./core";
import { TOPIC, correctionLink, pendingForHost, type Correction } from "./corrections";
import { type SignedRecord, newestDaily, pinnedJsonl, signedRecord } from "./hf";
import { excludedBy, isRobotsRefusal, loadExclusionsFromDoc } from "./optout";
import exclusionsDoc from "../../../scripts/census/probe-exclusions.json";

export const A2A_DS = "csoai/a2a-card-census";

export interface CardRow {
  host: string; card_url: string; state: string; reason?: string; card_source?: string | null;
  listed_protocolVersion?: string | null; card_protocolVersion?: string | null; card_sha256?: string | null;
  sig_state?: string | null; n_signatures?: number | null; algs?: string[]; key_source_kinds?: string[]; verify_results?: string[];
}

export interface A2AData { record: SignedRecord; date: string; byHost: Map<string, CardRow[]>; excluded: { robots: number; operator: number } }

export async function loadA2A(ctx: Ctx): Promise<A2AData> {
  const date = await newestDaily(ctx, A2A_DS);
  const record = await signedRecord(ctx, A2A_DS, `record.${date}.json`, `record.${date}.signed.json`);
  const rows = (await pinnedJsonl(ctx, record, `data/cards.${date}.jsonl.gz`)) as unknown as CardRow[];
  const exclusions = loadExclusionsFromDoc(exclusionsDoc);
  const byHost = new Map<string, CardRow[]>();
  const excluded = { robots: 0, operator: 0 };
  for (const r of rows) {
    const host = String(r.host || "").toLowerCase();
    if (!HOST_RE.test(host)) continue;
    if (isRobotsRefusal(r.state, r.reason)) { excluded.robots++; continue; }
    if (excludedBy(r.card_url || `https://${host}/`, exclusions) || excludedBy(`https://${host}/`, exclusions)) { excluded.operator++; continue; }
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host)!.push({ ...r, host });
  }
  return { record, date, byHost, excluded };
}

export interface CardHost { host: string; rows: CardRow[]; record: SignedRecord; date: string; pending: Correction[] }

export async function loadCardHost(ctx: Ctx, rawHost: string): Promise<CardHost> {
  const host = rawHost.toLowerCase();
  if (!HOST_RE.test(host)) throw new NotFound(rawHost);
  const d = await loadA2A(ctx);
  const rows = d.byHost.get(host);
  if (!rows?.length) throw new NotFound(host);
  return { host, rows, record: d.record, date: d.date, pending: pendingForHost(host, undefined, TOPIC.a2a) };
}

const sigLine = (r: CardRow) =>
  r.sig_state
    ? `${badge(r.sig_state)} ${r.n_signatures ? `· ${esc(r.n_signatures)} signature${r.n_signatures === 1 ? "" : "s"}` : ""}${r.algs?.length ? ` · ${r.algs.map((a) => `<code>${esc(a)}</code>`).join(", ")}` : ""}${r.key_source_kinds?.length ? ` · key from ${esc(r.key_source_kinds.join(", "))}` : ""}`
    : badge("UNMEASURED");

export function cardJson(h: CardHost): Json {
  const withheld = h.pending.length > 0;
  return {
    schema: "csoai.reach-entity/0.1",
    type: "a2a-agent-card-host",
    url: `${SITE}/agent-cards/${h.host}/`,
    subject: { host: h.host },
    doctrine: "Measurement of declared vs observed. Says nothing about security, quality or safety; not a certification, rating, ranking or endorsement.",
    evidence_level: "One public GET of the card at the listed address (and the two well-known fallbacks). No agent was called. Signature checks run over the fetched bytes only.",
    observed_on: h.record.as_of,
    first_seen: "UNMEASURED: this page reads one daily record; history is in the dataset's earlier records",
    pending_corrections: h.pending.map((c) => ({ id: c.id, status: c.status, url: `${SITE}${correctionLink(c.id)}` })),
    findings_state: withheld ? "WITHHELD_PENDING_CORRECTION" : "PUBLISHED",
    cards: h.rows.map((r) => ({
      card_url: r.card_url,
      declared: { listed_at: r.card_url, listed_protocol_version: r.listed_protocolVersion ?? null },
      observed: withheld ? "WITHHELD" : {
        state: r.state, reason: r.reason ?? null, served_from: r.card_source ?? null, card_protocol_version: r.card_protocolVersion ?? null,
        card_sha256: r.card_sha256 ?? null, signature_state: r.sig_state ?? "UNMEASURED", n_signatures: r.n_signatures ?? null, algs: r.algs ?? [],
        key_source_kinds: r.key_source_kinds ?? [], verify_results: r.verify_results ?? [],
      },
      capsules: `${SITE}/verify-server/?url=${encodeURIComponent(r.card_url)}`,
    })),
    sources: { record: h.record.url, signed: h.record.signedUrl, record_sha256: h.record.sha256, signature: h.record.signature.state, cards_file: `data/cards.${h.date}.jsonl.gz` },
    objections: `${SITE}/census/`,
    operator_context: "The operator can add context through the objection route; what they send is recorded with the next census run.",
    license: "CC-BY-4.0",
  };
}

export function renderCard(h: CardHost): Rendered {
  const withheld = h.pending.length > 0;
  const url = `${SITE}/agent-cards/${h.host}/`;
  const first = h.rows[0];
  const title = `${h.host} — A2A agent card, declared vs observed | Council of AI`;
  const description = `The A2A agent card listed for ${h.host}: ${withheld ? "finding withheld while a correction is pending" : `${first.state}${first.sig_state ? `, signatures ${first.sig_state}` : ""}`}. Observed ${dateOnly(h.record.as_of)} by the Council of AI census. Measurement only.`;
  const rows = h.rows.map((r) => `<tr>
<th scope="row"><code>${esc(r.card_url)}</code></th>
<td>listed protocol ${r.listed_protocolVersion ? `<code>${esc(r.listed_protocolVersion)}</code>` : '<span class="mut">not stated</span>'}</td>
<td>${withheld ? badge("WITHHELD") : `${badge(r.state)} <span class="mut">${esc(STATE_MEANING[r.state] || "")}</span><br>card protocol ${r.card_protocolVersion ? `<code>${esc(r.card_protocolVersion)}</code>` : '<span class="mut">not stated in the card</span>'}${r.card_source ? `<br><span class="mut">served from ${esc(r.card_source)}</span>` : ""}${r.reason ? `<br><span class="mut">${esc(r.reason)}</span>` : ""}`}</td>
<td>${withheld ? badge("WITHHELD") : sigLine(r)}${!withheld && r.card_sha256 ? `<br><span class="mut">card sha256 <code>${esc(r.card_sha256.slice(0, 16))}…</code></span>` : ""}</td>
</tr>`).join("");
  const pendingHtml = withheld
    ? `<div class="box warn" role="alert"><h2 id="correction">A correction is pending</h2>${h.pending.map((c) => `<p><a href="${esc(correctionLink(c.id))}"><strong>${esc(c.id)}</strong></a> — ${esc(c.status || "")}</p><p>${esc(c.what_was_wrong || "")}</p>`).join("")}<p>Until it is published, the finding on this page is withheld and this correction is shown instead.</p></div>`
    : "";
  const body = `${pendingHtml}
<h2 id="cards">Declared vs observed</h2>
<div class="tw"><table><caption>A2A agent card${h.rows.length === 1 ? "" : "s"} for ${esc(h.host)}, observed ${esc(dateOnly(h.record.as_of))}</caption>
<thead><tr><th scope="col">Card address (declared by the listing)</th><th scope="col">Declared</th><th scope="col">Observed</th><th scope="col">Signatures</th></tr></thead><tbody>${rows}</tbody></table></div>
<dl class="kv"><dt>Observed on</dt><dd>${esc(dateOnly(h.record.as_of))}</dd><dt>First seen</dt><dd>${badge("UNMEASURED")} <span class="mut">this page reads one daily record; earlier records are in the dataset</span></dd></dl>
<p class="mut">A signature state is about the card's bytes, never about the agent behind it. NO_SIGNATURES is common and is not a fault.</p>
<h2 id="verify">How to verify</h2>
<ol>
<li>Fetch the card yourself from the address above and compare its sha256 with the one shown.</li>
<li>The census record below is signed by <code>did:web:csoai.org#board-attestation-1</code>; its signed wrapper pins the record's sha256, and the record pins the cards file this row is in.</li>
<li>Where a signed capsule exists for the card, <a href="/verify-server/?url=${esc(encodeURIComponent(first.card_url))}">/verify-server/</a> recomputes it in your browser.</li>
</ol>
<h2 id="sources">Source</h2>
<ul><li><a href="${esc(h.record.url)}">${esc(h.record.dataset)} · ${esc(h.record.path)}</a> — as of ${esc(dateOnly(h.record.as_of))}, signature ${badge(h.record.signature.state)} (<a href="${esc(h.record.signedUrl)}">signed wrapper</a>), sha256 <code>${esc(h.record.sha256.slice(0, 16))}…</code></li></ul>`;
  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    lastModified: h.record.as_of,
    body: renderPage({
      title, description, canonical: url, twin: `${url}index.json`,
      crumbs: [{ href: "/", label: "Home" }, { href: "/agent-cards/", label: "A2A agent cards" }, { label: h.host }],
      h1: `A2A agent card: ${h.host}`,
      lede: `Where the listing says ${h.host}'s agent card lives, against what the census fetched there.`,
      subjectLabel: `the agent at ${h.host}`,
      evidence: "One public GET per card address (plus the two well-known fallbacks); no agent was called, nothing was authenticated. Signatures are checked over the fetched bytes.",
      body,
      jsonld: datasetLd({
        name: `A2A agent card census: ${h.host}`, description, url, isBasedOn: [h.record.url, h.record.signedUrl], dateModified: h.record.as_of,
        variableMeasured: ["card served", "protocol version", "signature state"],
        about: { "@type": "SoftwareApplication", name: h.host, url: `https://${h.host}/` },
      }),
    }),
  };
}
