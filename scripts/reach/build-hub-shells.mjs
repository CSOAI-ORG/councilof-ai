#!/usr/bin/env node
/**
 * build-hub-shells.mjs — writes the four static hub shells (public/<hub>/index.html).
 *
 * Each shell is SMALL on purpose: it carries no entity data at all. In the browser it fetches the
 * hub's list (/<hub>/index.json, rendered by a Pages Function from the same loader the entity pages
 * and sitemaps use) and offers search and filter over it. Without JavaScript it links the sitemap
 * and the JSON list, so nothing is hidden. The order is alphabetical; nothing is scored or ranked.
 *
 *   node scripts/reach/build-hub-shells.mjs           # write
 *   node scripts/reach/build-hub-shells.mjs --check   # CI: committed shells equal what this writes
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = "https://councilof.ai";

export const HUBS = [
  {
    path: "mcp-servers", sitemap: "mcp-servers-1.xml",
    title: "MCP servers — contract parity, declared vs observed | Council of AI",
    description: "Every MCP host in Council of AI's signed contract-parity census: what registries and cards declare about each server, against what the live server answered. Search by host. Measurement only.",
    h1: "MCP servers: declared vs observed",
    lede: "One page per host in the signed MCP contract-parity census. Each shows what public surfaces declared (auth, payment, protocol, tools, version) against what the live server answered, with dates and sources.",
    facets: [{ key: "state", label: "Dimension state present", derive: "mcpState" }],
    line: "mcp",
  },
  {
    path: "agent-cards", sitemap: "agent-cards-1.xml",
    title: "A2A agent cards — listed vs served | Council of AI",
    description: "Every host in Council of AI's signed A2A agent-card census: where the listing says the card is, against what was served there and whether its signatures verify. Search by host. Measurement only.",
    h1: "A2A agent cards: listed vs served",
    lede: "One page per host in the signed A2A agent-card census: the declared card address and protocol version, against what the census fetched.",
    facets: [{ key: "state", label: "Card state" }, { key: "signatures", label: "Signature state" }],
    line: "cards",
  },
  {
    path: "x402", sitemap: "x402-1.xml",
    title: "x402 doors and hosts — declared vs observed | Council of AI",
    description: "Council of AI's own x402 doors, as our catalog declares them, and the third-party hosts with a published x402 settlement-census card. Search and filter. Measurement only; no prices.",
    h1: "x402: doors and census hosts",
    lede: "Two kinds of page: our own x402 doors (declared; observed is UNMEASURED by design, because a claimant is never its own evidence) and third-party hosts with a published settlement-census observation.",
    facets: [{ key: "kind", label: "Kind" }, { key: "observed", label: "Observed" }],
    line: "x402",
  },
  {
    path: "stablecoins/deployments", sitemap: "stablecoins-1.xml",
    title: "Tokenised-asset deployments — issuer list vs ledger | Council of AI",
    description: "Every stablecoin and tokenised-fund deployment in Council of AI's signed cross-ledger daily record: what the issuer's own page lists against what each ledger answered. Search by asset or chain. Not investment advice.",
    h1: "Tokenised-asset deployments: issuer list vs ledger",
    lede: "One page per asset and chain in the newest signed cross-ledger daily record. The value read is the ledger's own supply figure (totalSupply() or its equivalent) — not issued or outstanding supply, and never a ranking of issuers.",
    facets: [{ key: "asset", label: "Asset" }, { key: "chain", label: "Chain" }, { key: "parity", label: "Asset parity state" }],
    line: "xl",
  },
];

const CSS = `:root{color-scheme:light dark;--fg:#111418;--bg:#ffffff;--mut:#4a5058;--line:#d9dde3;--soft:#f4f6f8;--u:#8a4b00;--link:#0b4fa8}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--fg:#e8eaed;--bg:#0f1115;--mut:#aab0b8;--line:#2c313a;--soft:#171a20;--u:#f0b35a;--link:#8ab8ff}}
:root[data-theme="dark"]{--fg:#e8eaed;--bg:#0f1115;--mut:#aab0b8;--line:#2c313a;--soft:#171a20;--u:#f0b35a;--link:#8ab8ff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--link)}a:focus-visible,input:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid var(--link);outline-offset:2px}
.skip{position:absolute;left:-9999px}.skip:focus{left:16px;top:8px;background:var(--bg);padding:.4rem .6rem}
header.site,main,footer.site,nav.crumbs{max-width:62rem;margin:0 auto;padding:0 16px}
header.site{display:flex;flex-wrap:wrap;gap:.25rem 1rem;align-items:baseline;padding-top:1rem;padding-bottom:.5rem;border-bottom:1px solid var(--line)}
header.site .brand{font-weight:700;text-decoration:none;color:var(--fg)}header.site .tag{color:var(--mut);font-size:.9rem}
nav.crumbs ol{list-style:none;margin:.75rem 0 0;padding:0;display:flex;flex-wrap:wrap;gap:.25rem;font-size:.9rem;color:var(--mut)}nav.crumbs li+li:before{content:"/";margin-right:.25rem}
h1{font-size:1.6rem;line-height:1.25;margin:1rem 0 .5rem}h2{font-size:1.15rem;margin:2rem 0 .5rem;border-bottom:1px solid var(--line);padding-bottom:.25rem}
.lede,.mut{color:var(--mut)}.box{background:var(--soft);border:1px solid var(--line);border-radius:8px;padding:.75rem 1rem;margin:1rem 0}
form.f{display:flex;flex-wrap:wrap;gap:.75rem 1rem;align-items:flex-end;margin:1rem 0}form.f label{display:flex;flex-direction:column;font-size:.9rem;color:var(--mut);gap:.2rem;min-width:12rem;flex:1 1 12rem}
input,select,button{font:inherit;color:var(--fg);background:var(--bg);border:1px solid var(--mut);border-radius:6px;padding:.4rem .5rem;min-height:44px}
ul.list{list-style:none;padding:0;margin:0}ul.list li{border-bottom:1px solid var(--line);padding:.5rem 0;overflow-wrap:anywhere}ul.list .meta{display:block;color:var(--mut);font-size:.9rem}
footer.site{border-top:1px solid var(--line);margin-top:2rem;padding-top:1rem;padding-bottom:2rem;color:var(--mut);font-size:.9rem}`;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function shell(h) {
  const url = `${SITE}/${h.path}/`;
  const data = `/${h.path}/index.json`;
  const cfg = { data, facets: h.facets, line: h.line };
  const crumbs = h.path === "stablecoins/deployments"
    ? `<li><a href="/">Home</a></li><li><a href="/stablecoins/">Stablecoins</a></li><li aria-current="page">Deployments</li>`
    : `<li><a href="/">Home</a></li><li aria-current="page">${esc(h.h1.split(":")[0])}</li>`;
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: h.title.split(" | ")[0], description: h.description, url, isPartOf: { "@id": `${SITE}/#website`, "@type": "WebSite", name: "Council of AI", url: `${SITE}/` }, publisher: { "@id": `${SITE}/#org`, "@type": "Organization", name: "Council of AI" }, license: "https://creativecommons.org/licenses/by/4.0/" };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(h.title)}</title>
<meta name="description" content="${esc(h.description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" type="application/json" title="Machine-readable list" href="${SITE}${data}">
<link rel="alternate" type="application/atom+xml" title="Council of AI — new records (Atom)" href="${SITE}/feeds/records.xml">
<link rel="alternate" type="application/feed+json" title="Council of AI — new records (JSON Feed)" href="${SITE}/feeds/records.json">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(h.title)}"><meta property="og:description" content="${esc(h.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${SITE}/og-image.png">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>${CSS}</style>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site"><a class="brand" href="/">Council of AI</a><span class="tag">measurement, not certification</span></header>
<nav class="crumbs" aria-label="Breadcrumb"><ol>${crumbs}</ol></nav>
<main id="main">
<h1>${esc(h.h1)}</h1>
<p class="lede">${esc(h.lede)}</p>
<div class="box" role="note" aria-label="What these pages are"><p><strong>What these pages are.</strong> Measurements of what was declared against what was observed, each with its dates, evidence level and signed source. They say nothing about the security, quality or safety of anything listed. Not one of them is a certification, rating, ranking or endorsement. UNMEASURED and UNCHECKABLE are shown as such.</p></div>
<form class="f" role="search" aria-label="Search and filter" onsubmit="return false">
<label for="q">Search<input id="q" name="q" type="search" autocomplete="off" placeholder="host, asset or chain"></label>
<span id="facets"></span>
</form>
<p id="count" class="mut" role="status" aria-live="polite">Loading the list…</p>
<ul class="list" id="list"></ul>
<p><button id="more" type="button" hidden>Show more</button></p>
<noscript><p>This list needs JavaScript to search. Without it: every page is in the sitemap <a href="/sitemaps/${h.sitemap}">/sitemaps/${h.sitemap}</a>, and the list itself is at <a href="${data}">${data}</a>.</p></noscript>
<h2 id="object">Object, correct or add context</h2>
<p>If a row is wrong or out of date, or you want it re-checked or excluded, use the objection route at <a href="${SITE}/census/">${SITE}/census/</a> or write to <!--email_off--><a href="mailto:nicholas@csoai.org">nicholas@csoai.org</a><!--/email_off-->. The operator can add context there; what they send is recorded with the next census run. Opted-out entities and those whose robots.txt refuses the census crawler have no page. Corrections are dated in the <a href="/corrections/">corrections ledger</a>.</p>
<p class="mut">Sitemap: <a href="/sitemaps/${h.sitemap}">/sitemaps/${h.sitemap}</a> · all sitemaps: <a href="/sitemaps/index.xml">/sitemaps/index.xml</a> · new records: <a href="/feeds/records.xml">Atom</a>, <a href="/feeds/records.json">JSON Feed</a> · <a href="/notes/daily/">daily notes</a></p>
</main>
<footer class="site"><p>Council of AI is operated by CSOAI Ltd (England &amp; Wales, Companies House 16939677). We measure; we do not certify. Data: CC BY 4.0.</p></footer>
<script>
(function(){
var C=${JSON.stringify(cfg)};
var PAGE=200,shown=PAGE,items=[],q=document.getElementById("q"),list=document.getElementById("list"),count=document.getElementById("count"),more=document.getElementById("more"),fx=document.getElementById("facets"),sel={};
function t(s){return String(s==null?"":s)}
function has(i,k,v){if(C.line==="mcp"&&k==="state"){if(i.withheld)return false;return v==="INCONSISTENT"?i.INCONSISTENT>0:v==="CONSISTENT"?i.CONSISTENT>0:v==="UNCHECKABLE"?i.UNCHECKABLE>0:v==="SINGLE_SURFACE only"?(i.SINGLE_SURFACE>0&&!i.CONSISTENT&&!i.INCONSISTENT&&!i.UNCHECKABLE):true}return t(i[k])===v}
function meta(i){
if(C.line==="mcp"&&i.withheld)return i.endpoints+" endpoint"+(i.endpoints===1?"":"s")+" · findings withheld while a correction is pending"+(i.lastmod?" · last seen "+t(i.lastmod).slice(0,10):"");
if(C.line==="mcp")return i.endpoints+" endpoint"+(i.endpoints===1?"":"s")+" · dimension states: "+["CONSISTENT","INCONSISTENT","SINGLE_SURFACE","UNCHECKABLE"].map(function(s){return s+" "+i[s]}).join(", ")+(i.lastmod?" · last seen "+t(i.lastmod).slice(0,10):"")+(i.own_estate?" · our own server":"");
if(C.line==="cards")return "card "+t(i.state)+" · signatures "+t(i.signatures)+(i.lastmod?" · observed "+t(i.lastmod).slice(0,10):"");
if(C.line==="x402")return t(i.kind)+" · observed "+t(i.observed)+(i.series?" · series "+t(i.series):"")+(i.lastmod?" · "+t(i.lastmod).slice(0,10):"");
return (i.issuer?t(i.issuer)+" · ":"")+"asset parity "+t(i.parity)+(i.lastmod?" · read "+t(i.lastmod).slice(0,10):"")}
function render(){
var term=t(q.value).trim().toLowerCase(),out=items.filter(function(i){
if(term&&(t(i.label)+" "+t(i.key)).toLowerCase().indexOf(term)<0)return false;
for(var k in sel){if(sel[k]&&!has(i,k,sel[k]))return false}return true});
list.innerHTML="";
out.slice(0,shown).forEach(function(i){var li=document.createElement("li"),a=document.createElement("a");a.href=i.url.replace(/^https:\\/\\/councilof\\.ai/,"");a.textContent=i.label;var m=document.createElement("span");m.className="meta";m.textContent=meta(i);li.appendChild(a);li.appendChild(m);list.appendChild(li)});
count.textContent=out.length+" of "+items.length+" shown in alphabetical order"+(out.length>shown?" (first "+shown+" listed)":"")+". Not a ranking.";
more.hidden=out.length<=shown}
function facets(){
C.facets.forEach(function(f){var vals={};
if(C.line==="mcp"&&f.key==="state"){["INCONSISTENT","CONSISTENT","UNCHECKABLE","SINGLE_SURFACE only"].forEach(function(v){vals[v]=1})}else{items.forEach(function(i){if(i[f.key]!=null)vals[t(i[f.key])]=1})}
var lab=document.createElement("label"),s=document.createElement("select");s.id="f-"+f.key;lab.htmlFor=s.id;lab.appendChild(document.createTextNode(f.label));
var o=document.createElement("option");o.value="";o.textContent="Any";s.appendChild(o);
Object.keys(vals).sort().forEach(function(v){var o=document.createElement("option");o.value=v;o.textContent=v;s.appendChild(o)});
s.addEventListener("change",function(){sel[f.key]=s.value;shown=PAGE;render()});lab.appendChild(s);fx.appendChild(lab)})}
q.addEventListener("input",function(){shown=PAGE;render()});
more.addEventListener("click",function(){shown+=PAGE;render()});
try{var p=new URLSearchParams(location.search).get("q");if(p)q.value=p}catch(e){}
fetch(C.data,{headers:{accept:"application/json"}}).then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json()}).then(function(j){var c=j.columns||[],base=location.origin;items=(j.rows||[]).map(function(r){var o={};c.forEach(function(k,x){o[k]=r[x]});if(o.label==null)o.label=o.key;o.url=String(j.url_template||"").replace("{key}",o.key);return o});facets();render()}).catch(function(e){count.textContent="The list could not be loaded just now ("+e.message+"). Nothing is shown rather than a partial list; please retry shortly. The sitemap lists every page."});
})();
</script>
</body>
</html>
`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const check = process.argv.includes("--check");
  let bad = 0;
  for (const h of HUBS) {
    const p = join(ROOT, "public", h.path, "index.html");
    const want = shell(h);
    if (check) {
      if (!existsSync(p) || readFileSync(p, "utf8") !== want) { console.error(`[hub-shells] ${p} differs from what build-hub-shells.mjs writes`); bad++; }
    } else {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, want);
    }
  }
  if (bad) process.exit(1);
  console.log(`[hub-shells] ${check ? "check ok" : "wrote"}: ${HUBS.map((h) => `/${h.path}/`).join(" ")}`);
}
