/** GET /rwa-cert/<slug> — the report the staged EAS attestation points at. See ./_report.ts. */
import { report } from "./_report";

const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const onRequestGet: PagesFunction = async (ctx) => {
  const slug = String((ctx.params as { asset?: string }).asset || "").toLowerCase().replace(/\.json$/, "");
  const r = report(slug);
  if (!r) return new Response(JSON.stringify({ error: "no staged attestation names this path", slug }, null, 2),
    { status: 404, headers: { "content-type": "application/json; charset=utf-8" } });

  const wantsJson = new URL(ctx.request.url).pathname.endsWith(".json") ||
    (ctx.request.headers.get("accept") || "").includes("application/json");
  if (wantsJson) return new Response(JSON.stringify(r, null, 2),
    { headers: { "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300", "access-control-allow-origin": "*" } });

  const cf = r.control_facts as { status?: string; as_of?: string; rubric?: string; facts?: Record<string, unknown>; decoded_name?: string; decimals?: number; n_facts?: number } | null;
  const factRows = cf?.facts ? Object.entries(cf.facts).map(([k, v]) => `<tr><td>${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("") : "";

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(r.asset)} — on-chain control facts | Council of AI</title>
<meta name="description" content="Deterministic on-chain control facts for ${esc(r.asset)}. Not a certificate, not a rating, not advice. Risk tier: ${esc(r.risk_tier)}.">
<link rel="canonical" href="https://councilof.ai/rwa-cert/${esc(slug)}">
<style>
:root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e5e5e5;--pre:#f6f6f6;--warn:#b45309}
@media(prefers-color-scheme:dark){:root{--fg:#e9e9e9;--bg:#0f1115;--mut:#a2a2a2;--line:#262a31;--pre:#171a20;--warn:#f59e0b}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:50rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:1.6rem;line-height:1.25;margin:0 0 .3rem}h2{margin:2rem 0 .5rem;font-size:1.05rem;border-bottom:1px solid var(--line);padding-bottom:.3rem}
.mut{color:var(--mut)}.warn{color:var(--warn);font-weight:600}
table{border-collapse:collapse;width:100%;margin:.5rem 0}td{padding:.35rem .5rem;border-bottom:1px solid var(--line)}
pre{background:var(--pre);border:1px solid var(--line);border-radius:6px;padding:.6rem .7rem;overflow-x:auto;font-size:.82rem}
.box{border-left:3px solid var(--warn);padding:.6rem 0 .6rem .9rem;margin:1rem 0}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
</style></head><body><main>
<h1>${esc(r.asset)}</h1>
<p class="mut">Contract <code>${esc(r.contract)}</code></p>

<div class="box"><p class="warn">This is not a certificate, a rating, an endorsement, or investment advice.</p>
<p>${esc(r.not_a_certificate)}</p></div>

<h2>Risk tier: ${esc(r.risk_tier)}</h2>
<p>${esc(r.risk_tier_note)}</p>

<h2>What was actually measured</h2>
${cf ? `<p class="mut">${esc(cf.rubric)} — status <b>${esc(cf.status)}</b>, as_of ${esc(cf.as_of)}, ${esc(cf.n_facts)} facts.</p>
<table>${factRows}</table>
<p class="mut">${esc(r.control_facts_note)}</p>` : `<p class="mut">${esc(r.control_facts_note)}</p>`}

<h2>The number this report cannot support</h2>
<p>The staged attestation carries <code>verdict_sha256 = ${esc(r.verdict_sha256)}</code>.</p>
<p class="warn">${esc(r.verdict_note)}</p>

<h2>Consent</h2>
<p>${esc(r.consent)}</p>

<h2>Check it yourself</h2>
<pre><code>${(r.verify_yourself as string[]).map(esc).join("\n")}</code></pre>

<p class="mut">Machine-readable: <a href="/rwa-cert/${esc(slug)}.json">/rwa-cert/${esc(slug)}.json</a> — this page renders that object.<br>
Sources: <a href="/interop/evm-control-facts.json">control facts</a> · <a href="/interop/eas-attestation-batch.json">staged attestation</a> · <a href="/api/corrections">corrections ledger</a><br>
${esc(r.publisher)}. ${esc(r.license)}. Verification is free and needs no account.</p>
</main></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};
