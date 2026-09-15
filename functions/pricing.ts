/**
 * GET /pricing — real pricing page.
 *
 * Three printed tiers: Free, Feed Pro, Commission.
 * Measurement, not certification. Verification is free and needs no account.
 * Company: CSOAI Ltd, UK 16939677. Founder: Nicholas Templeman.
 * One contact email: enterprise@councilof.ai
 */
export function onRequest() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pricing — Council of AI</title>
<meta name="description" content="Pricing for the Council of AI measurement registry. Free verification, x402 machine-readable feeds, and bespoke commission work. Measurement, not certification.">
<link rel="canonical" href="https://councilof.ai/pricing/">
<style>
:root{color-scheme:light dark;--fg:#111;--bg:#fff;--mut:#555;--line:#e5e5e5;--pre:#f6f6f6}
@media(prefers-color-scheme:dark){:root{--fg:#e9e9e9;--bg:#0f1115;--mut:#a2a2a2;--line:#262a31;--pre:#171a20}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:52rem;margin:0 auto;padding:2.5rem 1.25rem 4rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .4rem}
h2{margin:2.4rem 0 .6rem;font-size:1.2rem;border-bottom:1px solid var(--line);padding-bottom:.35rem}
h3{margin:1.4rem 0 .3rem;font-size:1rem}
.lede{color:var(--mut);margin:0 0 1.4rem}
.tier{border:1px solid var(--line);border-radius:8px;padding:1.4rem 1.2rem;margin:1rem 0}
.tier h3{margin-top:0;font-size:1.15rem}
.price{font-size:1.5rem;font-weight:700;margin:.4rem 0}
.price span{font-weight:400;font-size:.9rem;color:var(--mut)}
ul{padding-left:1.4rem;margin:.6rem 0}
li{margin:.3rem 0}
.n{color:var(--mut)}
.warn{color:#b45309}
footer{margin-top:3rem;color:var(--mut);font-size:.85rem;border-top:1px solid var(--line);padding-top:1rem}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
pre{background:var(--pre);border:1px solid var(--line);border-radius:6px;padding:.6rem .7rem;overflow-x:auto;font-size:.82rem;margin:.5rem 0}
a{color:inherit}
.human{border-left:3px solid #b45309;padding-left:1rem;margin:1.2rem 0}
.never{border-left:3px solid #16a34a;padding-left:1rem;margin:1.2rem 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr));gap:1rem;margin:1rem 0}
</style>
</head><body><main>
<h1>Pricing</h1>
<p class="lede">Measurement, not certification. Verification is free and needs no account.</p>

<div class="grid">

<div class="tier">
<h3>Free</h3>
<div class="price">£0 <span>— always</span></div>
<ul>
<li>Public board reads: axis totals, model placements</li>
<li>Card verification: confirm any signed measurement card</li>
<li>Inclusion proofs: check a sha256 against the live merkle root</li>
<li>Public-root downloads: the full merkle tree, verifiable offline</li>
</ul>
<p class="n">No account required. No rate limit on reads. Every public endpoint is listed in the <a href="/mcp/">MCP catalog</a>.</p>
</div>

<div class="tier">
<h3>Feed Pro</h3>
<div class="price">$199 <span>/ month</span></div>
<ul>
<li>Machine-readable measurement cards in bulk (JSON, streaming)</li>
<li>x402 API access: pay-per-call at $0.01–$1.00 per request</li>
<li>Automated measurement pipelines with signed receipts</li>
<li>Priority feed updates (card additions, root rotations)</li>
</ul>
<p class="n">No contract. Cancel anytime. x402 per-call pricing means you only pay for what you read.</p>
</div>

<div class="tier">
<h3>Commission</h3>
<div class="price">£3,000 – £15,000 <span>per engagement</span></div>
<ul>
<li>Custom measurement: bespoke axis, model, or regulator-specific scoring</li>
<li>Published rate card before work begins</li>
<li>Full provenance: every figure traceable to its source artifact</li>
<li>Delivery as signed measurement cards, integrated into the public board</li>
</ul>
<p class="n">Engagements are scoped in writing before any payment is taken. Rate card available on request.</p>
</div>

</div>

<h2>Human offers for compliance officers</h2>
<div class="human">
<p><strong>Issuer attestation-lag monitoring</strong> — £499/month, invoice available.</p>
<p class="n">Tracks how long each issuer takes to update attestations after a material event. Delivered as a monthly signed measurement card with the latency distribution.</p>
<p class="n">Contact: <a href="mailto:enterprise@councilof.ai">enterprise@councilof.ai</a></p>
</div>

<h2>Example: the machine path</h2>
<p class="n">A feed subscriber's first API call — note the <code>402</code> response and the <code>x402-price</code> header:</p>
<pre><code>$ curl -s https://councilof.ai/api/gspc/list-cards | head -1
{
  "status": 402,
  "message": "Payment required. Use x402 header or subscribe to Feed Pro.",
  "x402-price": "$0.01",
  "x402-resource": "/api/gspc/list-cards",
  "subscribe": "https://councilof.ai/pricing/"
}

# After paying via x402:
$ curl -s -H "x402-payment: &lt;receipt&gt;" https://councilof.ai/api/gspc/list-cards | jq '.cards | length'
142</code></pre>

<h2>What payment never buys</h2>
<div class="never">
<ul>
<li><strong>Grades are never sold.</strong> A model's placement on the board is derived from public artifacts and the measurement methodology. No payment changes a score.</li>
<li><strong>Verification stays free.</strong> Every signed card can be verified without an account, a subscription, or a key. The command is published on every card.</li>
<li><strong>Inclusion proofs stay free.</strong> Anyone can check whether a card is in the merkle root. The root is published with every rotation.</li>
<li><strong>No pay-to-play.</strong> Payment buys access to machine-readable feeds and bespoke work — never a different place on the board.</li>
</ul>
</div>

<h2>Contact</h2>
<p>Enterprise enquiries: <a href="mailto:enterprise@councilof.ai">enterprise@councilof.ai</a></p>
<p class="n">CSOAI Ltd, UK company 16939677. Founder: Nicholas Templeman.</p>

<footer>
<p>Measurement, not certification. Verification is free and needs no account.</p>
<p>Revenue to date from external payers: 0.02 USDC. We publish this so the number is never overstated.</p>
<p><a href="/press/">Press</a> · <a href="/mcp/">MCP catalog</a> · <a href="/">Home</a></p>
</footer>
</main></body></html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
