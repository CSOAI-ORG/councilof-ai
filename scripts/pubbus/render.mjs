/**
 * scripts/pubbus/render.mjs — static pages for signed evidence records.
 *
 * THE RULE THE PAGES ARE HELD TO: every number a reader sees is a number the record, its signed
 * document or its timestamp sidecar/receipt already published, copied verbatim. The template
 * itself carries no digits. pubbus.mjs re-reads each rendered page and refuses to write one whose
 * visible text contains a number not found in those sources (lib.foreignNumbers). Nothing here
 * computes a total, a percentage or an age.
 */
import { esc, OTS_MEANING, SITE, RawNum, rawStringify } from "./lib.mjs";

const HIDDEN_PAYLOAD_KEYS = new Set(["schema", "artifact", "signer", "not_a_grade", "published_files", "proof_files"]);
const LIMIT_KEY_RE =
  /^(?:not_evidence_of|what_this_does_not_(?:show|claim|prove|measure)|what_it_(?:never_proves|does_not_show)|what_this_is_not|not_a_grade|limits|limitations|caveats?|population_note|claim_boundary|honesty|what_we_do_not_say|sum_of_tool_counts_is_not_a_population_figure)$/;

const CSS = `
:root{color-scheme:dark;--bg:#020617;--card:#0f172a;--line:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--accent:#6ee7b7;--warn:#fcd34d}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,Segoe UI,sans-serif}
main{max-width:52rem;margin:0 auto;padding:2.5rem 1rem 4rem}a{color:var(--accent)}
h1{font-size:1.9rem;line-height:1.2;margin:.4rem 0 1rem}h2{font-size:1.15rem;margin:2.2rem 0 .6rem}
.eyebrow{font:600 .72rem/1 ui-monospace,monospace;letter-spacing:.2em;text-transform:uppercase;color:var(--accent)}
.card{background:var(--card);border:1px solid var(--line);border-radius:.8rem;padding:1rem 1.1rem;margin:.8rem 0}
.state-CURRENT{border-color:#065f46}.state-SUPERSEDED{border-color:#92400e;color:var(--warn)}
table{width:100%;border-collapse:collapse;font-size:.92rem}td,th{border-bottom:1px solid var(--line);padding:.35rem .5rem;text-align:left;vertical-align:top}
th{color:var(--muted);font-weight:600}code,pre{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.84rem}
pre{background:#000;border:1px solid var(--line);border-radius:.6rem;padding:.8rem;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
td code{word-break:break-all}.muted{color:var(--muted)}ul{padding-left:1.2rem}li{margin:.25rem 0}
footer{margin-top:3rem;font-size:.85rem;color:var(--muted)}
`;

function val(v) {
  if (v === null) return "null";
  if (typeof v === "string") return v;
  return rawStringify(v);
}
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v) && !(v instanceof RawNum);

/** The signed payload, one row per field; nested objects one level deep as dotted keys. */
function payloadRows(payload) {
  const rows = [];
  for (const [k, v] of Object.entries(payload ?? {})) {
    if (HIDDEN_PAYLOAD_KEYS.has(k)) continue;
    if (isObj(v)) {
      const entries = Object.entries(v);
      if (!entries.length) rows.push([k, "{}"]);
      for (const [k2, v2] of entries) rows.push([`${k}.${k2}`, val(v2)]);
    } else {
      rows.push([k, val(v)]);
    }
  }
  return rows;
}

/** Statements the record makes about its own limits, found by key name, quoted verbatim. */
export function limitStatements(record, payload) {
  const out = [];
  const take = (where, v) => {
    if (typeof v === "string") out.push([where, v]);
    else if (typeof v === "boolean" || v instanceof RawNum) out.push([where, val(v)]);
    else if (Array.isArray(v)) for (const x of v) out.push([where, val(x)]);
    else if (isObj(v)) for (const [k, x] of Object.entries(v)) out.push([`${where}.${k}`, val(x)]);
  };
  if (typeof payload?.not_a_grade === "string") out.push(["signed payload: not_a_grade", payload.not_a_grade]);
  for (const [k, v] of Object.entries(record ?? {})) {
    if (LIMIT_KEY_RE.test(k)) take(k, v);
    else if (isObj(v)) {
      for (const [k2, v2] of Object.entries(v)) if (LIMIT_KEY_RE.test(k2)) take(`${k}.${k2}`, v2);
    }
  }
  const rs = payload?.read_state ?? record?.read_state;
  const vocab = record?.read_state_vocabulary;
  if (typeof rs === "string" && vocab && typeof vocab[rs] === "string") out.push([`read_state ${rs} means`, vocab[rs]]);
  return out;
}

function stateBlock(v, slug) {
  if (v.state === "CURRENT") {
    return `<!--pubbus:state--><div class="card state-CURRENT" data-state="CURRENT"><strong>CURRENT.</strong> This is the newest signed record in this series. Every version stays published: <a href="/evidence/${esc(slug)}/">all versions</a>.</div><!--/pubbus:state-->`;
  }
  return `<!--pubbus:state--><div class="card state-SUPERSEDED" data-state="SUPERSEDED"><strong>SUPERSEDED</strong> by <a href="${esc(v.superseded_by_page)}">${esc(v.superseded_by)}</a>. ${esc(v.superseded_reason)} This record's bytes, signature and proof are unchanged and still verify; quote the current version for anything current.</div><!--/pubbus:state-->`;
}

export function renderStateBlock(v, slug) {
  return stateBlock(v, slug);
}

function shell({ title, description, canonical, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta name="generator" content="scripts/pubbus (publication bus)">
<style>${CSS}</style>
</head>
<body>
<main>
${body}
<footer>
<p>Evidence linked from the GSPC board, never counted into it: board totals are <a href="/api/gspc">GET /api/gspc</a>. Measurement, not certification. Naming a party that appears in a record is not an endorsement of it or by it. Machine list of every record page: <a href="/evidence/published-records.json">/evidence/published-records.json</a>. Service status: <a href="/status">/status</a>. Corrections: <a href="/api/corrections">/api/corrections</a>.</p>
</footer>
</main>
</body>
</html>
`;
}

export function renderVersionPage(v) {
  const { slug, dataset, record, payload, verify } = v;
  const rows = payloadRows(payload)
    .map(([k, x]) => `<tr><th><code>${esc(k)}</code></th><td>${esc(x)}</td></tr>`)
    .join("\n");
  const limits = limitStatements(record, payload);
  const limitsHtml = limits.length
    ? `<ul>${limits.map(([w, t]) => `<li><code>${esc(w)}</code> — ${esc(t)}</li>`).join("\n")}</ul>`
    : `<p class="muted">The record states no limits under a recognised key. Read the record itself before relying on it.</p>`;
  const files = Object.entries(payload.published_files ?? payload.proof_files ?? {});
  const filesHtml = files.length
    ? `<h2>Files the signature pins</h2><table>${files
        .map(([f, h]) => `<tr><td><code>${esc(f)}</code></td><td><code>${esc(val(h))}</code></td></tr>`)
        .join("\n")}</table>`
    : "";
  const whatItIs = typeof record.what_this_is === "string" ? `<p>${esc(record.what_this_is)}</p>` : "";
  const ots = v.ots;
  const receiptRows = (ots.receipt_bitcoin ?? [])
    .map((b) => `<li>receipt: block height ${esc(val(b.height))}, header check <code>${esc(val(b.result))}</code> (source ${esc(val(b.header_source))})</li>`)
    .join("\n");
  const recordVerify =
    isObj(record.verify)
      ? `<p>The record's own verification instructions, verbatim:</p><ul>${Object.entries(record.verify)
          .map(([k, t]) => `<li><code>${esc(k)}</code> — ${esc(val(t))}</li>`)
          .join("\n")}</ul>`
      : typeof record.verify === "string"
        ? `<p>The record's own verification instructions, verbatim: ${esc(record.verify)}</p>`
        : "";
  const artifactName = v.artifact_path.split("/").pop();
  const body = `<p class="eyebrow">Signed evidence record · csoai/${esc(dataset)}</p>
<h1>${esc(v.title)}</h1>
${stateBlock(v, slug)}
${whatItIs}
<h2>The signed numbers, verbatim</h2>
<p class="muted">Every field of the signed payload, copied as signed. Nothing on this page is computed, rounded or totalled.</p>
<table>
${rows}
</table>
<h2>Limits the record states about itself</h2>
${limitsHtml}
<h2>Identity</h2>
<table>
<tr><th>record</th><td><a href="${esc(v.record_url)}"><code>${esc(artifactName)}</code></a></td></tr>
<tr><th>record sha256</th><td><code>${esc(v.record_sha256)}</code> (recomputed from the bytes; equals the signed <code>artifact.sha256</code>)</td></tr>
<tr><th>record schema</th><td><code>${esc(payload.artifact?.schema ?? "not stated")}</code></td></tr>
<tr><th>as_of</th><td><code>${esc(v.as_of)}</code></td></tr>
<tr><th>signed document</th><td><a href="${esc(v.signed_url)}"><code>${esc(v.signed_path.split("/").pop())}</code></a> · sha256 <code>${esc(v.signed_sha256)}</code></td></tr>
<tr><th>signature</th><td><strong>${esc(verify.state)}</strong> under <code>${esc(verify.did)}</code>; payload sha256 <code>${esc(verify.payload_sha256)}</code>; signed_at <code>${esc(verify.signed_at ?? "not stated")}</code>; tamper control ${esc(verify.tamper_control)}</td></tr>
<tr><th>pinned at</th><td>Hugging Face dataset <a href="https://huggingface.co/datasets/csoai/${esc(dataset)}">csoai/${esc(dataset)}</a>, revision <code>${esc(v.revision)}</code></td></tr>
</table>
${filesHtml}
<h2>Timestamp (OpenTimestamps)</h2>
<p><strong>${esc(ots.state)}</strong>. ${esc(OTS_MEANING[ots.state] ?? "")}</p>
<ul>
${ots.proof_url ? `<li>proof: <a href="${esc(ots.proof_url)}"><code>${esc(ots.proof_url.split("/").pop())}</code></a> — <code>${esc(ots.proof_state)}</code></li>` : ""}
${ots.upgraded_proof_url ? `<li>upgraded proof: <a href="${esc(ots.upgraded_proof_url)}"><code>${esc(ots.upgraded_proof_url.split("/").slice(-3).join("/"))}</code></a> — <code>${esc(ots.upgraded_proof_state)}</code></li>` : ""}
${ots.receipt_url ? `<li>upgrade receipt: <a href="${esc(ots.receipt_url)}"><code>OTS-UPGRADE.json</code></a></li>` : ""}
${receiptRows}
</ul>
<h2>Verify it yourself</h2>
<p>Free, no account, no key. The first command asks the site's verifier door; the second checks that the record bytes are the ones the signature pins; the third checks the timestamp with the OpenTimestamps client.</p>
<pre>curl -sL '${esc(v.signed_url)}' -o signed.json
curl -s -X POST ${SITE}/api/verify -H 'content-type: application/json' --data-binary @signed.json
#   expect "state": "VALID" (Ed25519 over the canonical payload, pinned board key)

curl -sL '${esc(v.record_url)}' | sha256sum
#   must print ${esc(v.record_sha256)}
${ots.proof_url ? `\ncurl -sL '${esc(v.record_url)}' -o ${esc(artifactName)}\ncurl -sL '${esc(ots.upgraded_proof_url ?? ots.proof_url)}' -o ${esc(artifactName)}.ots\nots verify -f ${esc(artifactName)} ${esc(artifactName)}.ots` : ""}</pre>
${recordVerify}`;
  return shell({
    title: `${v.title} — signed evidence record | Council of AI`,
    description: `Signed evidence record from csoai/${dataset}: the record's own numbers verbatim, its stated limits, sha256, signature and timestamp state, and how to verify it yourself. Evidence, not a grade.`,
    canonical: `${SITE}${v.page}`,
    body,
  });
}

export function renderSlugIndex(entry) {
  const rows = entry.versions
    .slice()
    .reverse()
    .map(
      (v) =>
        `<tr><td><a href="${esc(v.page)}"><code>${esc(v.version)}</code></a></td><td><code>${esc(v.as_of)}</code></td><td><strong>${esc(v.state)}</strong>${v.state === "SUPERSEDED" ? ` by <code>${esc(v.superseded_by)}</code>` : ""}</td><td>${esc(v.signature.state)}</td><td>${esc(v.ots.state)}</td></tr>`,
    )
    .join("\n");
  const cur = entry.versions.find((v) => v.state === "CURRENT");
  const body = `<p class="eyebrow">Signed evidence record series · csoai/${esc(entry.dataset)}</p>
<h1>${esc(entry.title)}</h1>
<div class="card state-CURRENT">Current version: <a href="${esc(cur.page)}"><code>${esc(cur.version)}</code></a> (as_of <code>${esc(cur.as_of)}</code>). Superseded versions stay published and say so.</div>
<table>
<tr><th>version</th><th>as_of</th><th>state</th><th>signature</th><th>timestamp</th></tr>
${rows}
</table>`;
  return shell({
    title: `${entry.title} — signed evidence records | Council of AI`,
    description: `Every published version of the signed evidence record series from csoai/${entry.dataset}, current and superseded. Evidence, not a grade.`,
    canonical: `${SITE}/evidence/${entry.slug}/`,
    body,
  });
}
