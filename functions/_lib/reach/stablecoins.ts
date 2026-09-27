/**
 * /stablecoins/<asset>/<chain>/ — one tokenised asset on one ledger: what the issuer's own page
 * lists (declared) against what the ledger answered (observed), with the evidence kind of every read.
 *
 * SOURCE. The newest signed cross-ledger daily record on csoai/cross-ledger-supply
 * (xl-daily/<date>/[vN/]xl-daily-<date>.json; the highest re-derivation vN wins), verified against its
 * signed wrapper at request time.
 *
 * WORDING. The value read is the ledger's own supply figure — totalSupply() on EVM and Tron, the
 * ledger's equivalent elsewhere. It is NOT issued, outstanding or circulating supply, reserves, AUM or
 * redeemability (correction C-2026-0926-06), and nothing here ranks issuers.
 */
import { type Ctx, type Json, type Rendered, NotFound, SITE, SourceError, badge, dateOnly, datasetLd, esc, renderPage, STATE_MEANING } from "./core";
import { correctionLink, pendingForDeployment, type Correction } from "./corrections";
import { type SignedRecord, hfTree, signedRecord } from "./hf";

export const XL_DS = "csoai/cross-ledger-supply";
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

export interface Deployment {
  asset_key: string; product: string; ledger: string; deployment_id: string; evidence_kind: string; supply_decimal: string | null;
  height: number | null; two_operators_agree?: string | null; header_hash_recomputed?: boolean | null; second_operator_same_block?: boolean | null; consensus_check?: string | null;
}
export interface Finding { asset: string; ledger: string; deployment_id?: string; product?: string; state: string; kind?: string; meaning?: string; supply_decimal?: string | null; evidence_kind?: string; symbol?: string; endpoint?: string }
export interface AssetInfo { asset?: string; issuer?: string; issuer_list_state?: string; issuer_list_source?: string; issuer_list_fetched_at?: string; parity_state?: string; reconciliation_state?: string; listed_not_read?: string[]; deployments_listed?: number; deployments_read?: number }

export interface XlData { record: SignedRecord; date: string; version: string; deployments: Deployment[]; findings: Finding[]; uncheckable: { asset: string; deployment?: string; why: string }[]; assets: Record<string, AssetInfo>; legend: Record<string, string>; parityStates: Record<string, string>; changes: Json | null }

export async function xlDates(ctx: Ctx): Promise<string[]> {
  return (await hfTree(ctx, XL_DS, "xl-daily")).filter((x) => x.type === "directory").map((x) => x.path.split("/").pop()!).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
}

/** The newest signed xl-daily record, or the one for `onDate` (null when no record exists for that date). */
export async function loadXl(ctx: Ctx): Promise<XlData>;
export async function loadXl(ctx: Ctx, onDate: string): Promise<XlData | null>;
export async function loadXl(ctx: Ctx, onDate?: string): Promise<XlData | null> {
  const dates = await xlDates(ctx);
  if (onDate && !dates.includes(onDate)) return null;
  if (!dates.length) throw new SourceError(`${XL_DS} file listing`, "no xl-daily record");
  const date = onDate ?? dates[dates.length - 1];
  const inDay = await hfTree(ctx, XL_DS, `xl-daily/${date}`);
  const versions = inDay.filter((x) => x.type === "directory").map((x) => x.path.split("/").pop()!).filter((v) => /^v\d+$/.test(v)).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const version = versions.length ? versions[versions.length - 1] : "v1";
  const base = versions.length ? `xl-daily/${date}/${version}` : `xl-daily/${date}`;
  const record = await signedRecord(ctx, XL_DS, `${base}/xl-daily-${date}.json`, `${base}/xl-daily-${date}.signed.json`);
  const j = record.json as Json;
  const parity = (j.parity || {}) as Json;
  const findings = [
    ...((parity.findings_inconsistent as Finding[]) || []),
    ...((parity.not_a_supply_claim as Finding[]) || []),
  ];
  return {
    record, date, version,
    changes: (j.changes as Json) ?? null,
    deployments: ((j.deployments as Deployment[]) || []).filter((d) => d && d.asset_key && d.ledger),
    findings,
    uncheckable: (j.uncheckable as XlData["uncheckable"]) || [],
    assets: (j.assets as Record<string, AssetInfo>) || {},
    legend: (j.evidence_kind_legend as Record<string, string>) || {},
    parityStates: ((parity.asset_states as Record<string, string>) || {}),
  };
}

export const chainSlug = (s: string) => String(s || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");

/** Every (asset, chain) pair the record reads or finds something on. */
export function pairs(d: XlData): Map<string, { asset: string; chain: string; lastModified: string | null }> {
  const out = new Map<string, { asset: string; chain: string; lastModified: string | null }>();
  const add = (asset: string, ledger: string) => {
    const a = chainSlug(asset), c = chainSlug(ledger);
    if (SLUG_RE.test(a) && SLUG_RE.test(c)) out.set(`${a}/${c}`, { asset: a, chain: c, lastModified: d.record.as_of });
  };
  for (const x of d.deployments) add(x.asset_key, x.ledger);
  for (const f of d.findings) add(f.asset, f.ledger);
  return out;
}

export interface DeploymentPage { asset: string; chain: string; data: XlData; rows: Deployment[]; findings: Finding[]; uncheckable: XlData["uncheckable"]; info: AssetInfo; pending: Correction[] }

export async function loadDeployment(ctx: Ctx, rawAsset: string, rawChain: string): Promise<DeploymentPage> {
  const asset = rawAsset.toLowerCase(), chain = rawChain.toLowerCase();
  if (!SLUG_RE.test(asset) || !SLUG_RE.test(chain)) throw new NotFound(`${rawAsset}/${rawChain}`);
  const data = await loadXl(ctx);
  const rows = data.deployments.filter((d) => chainSlug(d.asset_key) === asset && chainSlug(d.ledger) === chain);
  const findings = data.findings.filter((f) => chainSlug(f.asset) === asset && chainSlug(f.ledger) === chain);
  if (!rows.length && !findings.length) throw new NotFound(`${asset} on ${chain}`);
  const info = data.assets[asset] || {};
  const uncheckable = data.uncheckable.filter((u) => chainSlug(u.asset) === asset && (!u.deployment || chainSlug(u.deployment.split(":")[0]) === chain));
  const symbols = [...new Set([info.asset, ...rows.map((r) => r.product), ...findings.map((f) => f.product || f.symbol)].filter((x): x is string => !!x))];
  return { asset, chain, data, rows, findings, uncheckable, info, pending: pendingForDeployment(symbols, chain) };
}

const label = (p: DeploymentPage) => `${p.info.asset || p.asset.toUpperCase()} on ${p.chain}`;

export function deploymentJson(p: DeploymentPage): Json {
  const withheld = p.pending.length > 0;
  return {
    schema: "csoai.reach-entity/0.1",
    type: "tokenised-asset-deployment",
    url: `${SITE}/stablecoins/${p.asset}/${p.chain}/`,
    subject: { asset: p.asset, symbol: p.info.asset ?? null, issuer: p.info.issuer ?? null, chain: p.chain },
    doctrine: "Measurement of declared vs observed. The value is the ledger's own supply figure (totalSupply() or its equivalent), not issued or outstanding supply, reserves, AUM or redeemability. Says nothing about security, quality or safety; not a certification, rating, ranking or endorsement, and not investment advice.",
    observed_on: p.data.record.as_of,
    record_version: p.data.version,
    pending_corrections: p.pending.map((c) => ({ id: c.id, status: c.status, what_was_wrong: c.what_was_wrong, url: `${SITE}${correctionLink(c.id)}` })),
    findings_state: withheld ? "WITHHELD_PENDING_CORRECTION" : "PUBLISHED",
    declared: { issuer_list_source: p.info.issuer_list_source ?? null, issuer_list_state: p.info.issuer_list_state ?? "UNMEASURED", issuer_list_fetched_at: p.info.issuer_list_fetched_at ?? null },
    observed: withheld ? "WITHHELD" : p.rows.map((r) => ({ product: r.product, deployment_id: r.deployment_id, ledger_supply_figure: r.supply_decimal, height: r.height, evidence_kind: r.evidence_kind, two_operators_agree: r.two_operators_agree ?? null, consensus_check: r.consensus_check ?? null })),
    findings: withheld ? "WITHHELD" : p.findings.map((f) => ({ state: f.state, kind: f.kind ?? null, product: f.product ?? f.symbol ?? null, deployment_id: f.deployment_id ?? null, meaning: f.meaning ?? null })),
    asset_parity_state: withheld ? "WITHHELD" : (p.data.parityStates[p.asset] ?? "UNMEASURED"),
    uncheckable: p.uncheckable,
    sources: { record: p.data.record.url, signed: p.data.record.signedUrl, record_sha256: p.data.record.sha256, signature: p.data.record.signature.state },
    objections: `${SITE}/census/`,
    operator_context: "The issuer can add context through the objection route; what they send is recorded with the next run.",
    license: "CC-BY-4.0",
  };
}

export function renderDeployment(p: DeploymentPage): Rendered {
  const withheld = p.pending.length > 0;
  const url = `${SITE}/stablecoins/${p.asset}/${p.chain}/`;
  const name = label(p);
  const title = `${name} — ledger supply read vs issuer list | Council of AI`;
  const description = `${name}${p.info.issuer ? ` (${p.info.issuer})` : ""}: what the issuer's own page lists against what the ${p.chain} ledger answered, ${withheld ? "finding withheld while a correction is pending" : `${p.rows.length} deployment read${p.rows.length === 1 ? "" : "s"}`}, as of ${dateOnly(p.data.record.as_of)}. Measurement only; not investment advice.`;
  const legend = (k: string) => (p.data.legend[k] ? `<br><span class="mut">${esc(String(p.data.legend[k]).slice(0, 240))}${String(p.data.legend[k]).length > 240 ? "…" : ""}</span>` : "");
  const readRows = p.rows.map((r) => `<tr><th scope="row"><code>${esc(r.product)}</code><br><code>${esc(r.deployment_id)}</code></th>
<td>${r.supply_decimal != null ? `<code>${esc(r.supply_decimal)}</code>` : badge("UNCHECKABLE")}${r.height != null ? `<br><span class="mut">at height ${esc(r.height)}</span>` : ""}</td>
<td>${badge(r.evidence_kind)}${legend(r.evidence_kind)}</td>
<td>${r.two_operators_agree != null ? `second operator agrees: ${esc(r.two_operators_agree)}` : '<span class="mut">no second operator</span>'}${r.consensus_check ? `<br><span class="mut">${esc(r.consensus_check)}</span>` : ""}</td></tr>`).join("");
  const findingRows = p.findings.map((f) => `<li>${badge(f.state)} <code>${esc(f.product || f.symbol || "")}</code> ${f.deployment_id ? `<code>${esc(f.deployment_id)}</code>` : ""} — ${esc(f.meaning || STATE_MEANING[f.state] || "")}</li>`).join("");
  const pendingHtml = withheld
    ? `<div class="box warn" role="alert"><h2 id="correction">A correction is pending</h2>${p.pending.map((c) => `<p><a href="${esc(correctionLink(c.id))}"><strong>${esc(c.id)}</strong></a> — ${esc(c.status || "")}</p><p>${esc(c.what_was_wrong || "")}</p>`).join("")}<p>Until it is published, the readings and findings on this page are withheld and this correction is shown instead.</p></div>`
    : "";
  const parity = p.data.parityStates[p.asset];
  const body = `${pendingHtml}
<h2 id="declared">Declared: the issuer's list</h2>
<dl class="kv">
<dt>Issuer</dt><dd>${esc(p.info.issuer || "not recorded")}</dd>
<dt>Issuer's list</dt><dd>${p.info.issuer_list_source ? `<a href="${esc(p.info.issuer_list_source)}" rel="nofollow">${esc(p.info.issuer_list_source)}</a>` : '<span class="mut">none read</span>'} ${badge(p.info.issuer_list_state || "UNMEASURED")}</dd>
<dt>List read on</dt><dd>${esc(dateOnly(p.info.issuer_list_fetched_at))}</dd>
<dt>Asset parity state</dt><dd>${withheld ? badge("WITHHELD") : `${badge(parity || "UNMEASURED")} <span class="mut">${esc(STATE_MEANING[parity || "UNMEASURED"] || "")}</span>`}</dd>
</dl>
<h2 id="observed">Observed: what the ledger answered</h2>
${withheld ? `<p>${badge("WITHHELD")} The ledger readings are withheld while the correction above is pending.</p>` : p.rows.length ? `<div class="tw"><table><caption>Ledger reads for ${esc(name)} on ${esc(dateOnly(p.data.record.as_of))} (the ledger's totalSupply() or its equivalent — not issued or outstanding supply)</caption><thead><tr><th scope="col">Deployment</th><th scope="col">Ledger supply figure</th><th scope="col">Evidence kind</th><th scope="col">Cross-check</th></tr></thead><tbody>${readRows}</tbody></table></div>` : `<p>${badge("UNMEASURED")} No deployment on this ledger was read in this record.</p>`}
${!withheld && p.findings.length ? `<h2 id="findings">Findings</h2><ul>${findingRows}</ul>` : ""}
${p.uncheckable.length ? `<h2 id="uncheckable">Not read</h2><ul>${p.uncheckable.map((u) => `<li>${badge("UNCHECKABLE")} ${u.deployment ? `<code>${esc(u.deployment)}</code> — ` : ""}${esc(u.why)}</li>`).join("")}</ul><p class="mut">Not read is not zero and not absent.</p>` : ""}
<h2 id="verify">How to verify</h2>
<ol>
<li>Download the record below and its signed wrapper; the wrapper pins the record's sha256 and is signed by <code>did:web:csoai.org#board-attestation-1</code>.</li>
<li>Re-read the deployment yourself at the height shown (for EVM ledgers, <code>totalSupply()</code> at that block). STATE_PROOF_VERIFIED rows carry a Merkle proof in the record's proof files.</li>
</ol>
<h2 id="sources">Source</h2>
<ul><li><a href="${esc(p.data.record.url)}">${esc(p.data.record.dataset)} · ${esc(p.data.record.path)}</a> — as of ${esc(dateOnly(p.data.record.as_of))} (${esc(p.data.version)}), signature ${badge(p.data.record.signature.state)} (<a href="${esc(p.data.record.signedUrl)}">signed wrapper</a>), sha256 <code>${esc(p.data.record.sha256.slice(0, 16))}…</code></li>
<li>All deployments of this asset: <a href="/stablecoins/deployments/?q=${esc(encodeURIComponent(p.asset))}">/stablecoins/deployments/</a> · asset overview: <a href="/stablecoins/">/stablecoins/</a></li></ul>
<p class="mut">Nothing here is investment advice or a trading signal, and issuers are never ranked.</p>`;
  return {
    status: 200,
    contentType: "text/html; charset=utf-8",
    lastModified: p.data.record.as_of,
    body: renderPage({
      title, description, canonical: url, twin: `${url}index.json`,
      crumbs: [{ href: "/", label: "Home" }, { href: "/stablecoins/deployments/", label: "Tokenised-asset deployments" }, { label: name }],
      h1: `${name}: issuer list vs ledger`,
      lede: `What ${esc(p.info.issuer || "the issuer")} lists for ${esc(p.info.asset || p.asset)} on ${esc(p.chain)}, against what the ledger answered.`,
      subjectLabel: `${name}${p.info.issuer ? ` or ${p.info.issuer}` : ""}`,
      evidence: "Each read is labelled on the evidence ladder (STATE_PROOF_VERIFIED, STATE_PROOF_RECORDED, OPERATOR_API or UNCHECKABLE). No block header was checked against validator signatures (no light client).",
      body,
      jsonld: datasetLd({
        name: `Cross-ledger supply read: ${name}`, description, url, isBasedOn: [p.data.record.url, p.data.record.signedUrl], dateModified: p.data.record.as_of,
        variableMeasured: ["ledger supply figure (totalSupply or equivalent)", "evidence kind", "issuer-list parity"],
      }),
    }),
  };
}
