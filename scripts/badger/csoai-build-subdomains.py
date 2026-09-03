#!/usr/bin/env python3
"""csoai-build-subdomains.py — build the 7 subdomain landing pages.

Lane-doable: builds the static HTML landing page for each subdomain.
Each page is a single HTML file with:
  - Title (ranked for the persona)
  - The lid phrase
  - JSON-LD with the right schema.org type
  - A CTA to the main councilof.ai / csoai.org

Subdomains built:
  1. proofs.councilof.ai    — the proof portal
  2. issuance.councilof.ai  — the issuance portal (MetaMask)
  3. verifier.councilof.ai  — the verifier portal (offline WebCrypto)
  4. marketplace.councilof.ai — the packs marketplace
  5. blog.councilof.ai      — the long-form blog
  6. press.councilof.ai     — the press release portal
  7. dashboards.councilof.ai — the persona dashboards

Output: public/subdomains/<slug>/index.html — each can be deployed
to its own Cloudflare Pages project.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "public" / "subdomains"
DID = "did:web:csoai.org#card-attestation-1"

LID = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact."

# (slug, title, description, schema_type, cta_text, cta_url, body)
SUBDOMAINS = [
    (
        "proofs",
        "Proof Portal — CSOAI",
        "Every signed card, with inclusion proof. The bulk history of every measurement. Three live anchors made visible — HuggingFace, Sigstore Rekor and the public corrections ledger; Bitcoin OpenTimestamps is planned. Free, no API key.",
        "WebSite",
        "Open the Proof Portal →",
        "/proofs.html",
        """<h2>Three things you can do here</h2>
<ol style="color: var(--muted); line-height: 1.8;">
  <li><strong>Verify any card</strong> — paste a card-v0 attestation, get its signature, hash, and 4 anchors.</li>
  <li><strong>Bulk history</strong> — the full 50-card root + the bulk-signed stem. Read it offline.</li>
  <li><strong>Inclusion proof</strong> — for any card, get the merkle path from the leaf to the root, signed under did:web:csoai.org.</li>
</ol>
<h2>The 4 anchors</h2>
<p>Every measurement is bound to 4 independent anchors. Re-publishing from another vendor requires rebuilding all 4.</p>
<ol style="color: var(--muted); line-height: 1.8;">
  <li><strong>HuggingFace Hub</strong> — <a href="https://huggingface.co/csoai" style="color: var(--accent);">huggingface.co/csoai</a> — 60+ datasets, 42 Spaces, 3 models.</li>
  <li><strong>Sigstore Rekor</strong> — public witness receipt at <a href="/api/rekor" style="color: var(--accent);">/api/rekor</a>.</li>
  <li><strong>Corrections ledger</strong> — public witness at <a href="/api/corrections" style="color: var(--accent);">/api/corrections</a> (39 rows live).</li>
  <li><strong>Bitcoin OpenTimestamps</strong> — irrevocable timestamp at <a href="/api/state" style="color: var(--accent);">/api/state</a>.</li>
</ol>""",
    ),
    (
        "issuance",
        "Issuance Portal — CSOAI x402 (MetaMask)",
        "Pay with USDC on Base via MetaMask. Get a signed card back. 5 priced resources: $0.50 issuance, $1.00 evidence bundle, $2.00 data feed, $1.50 proof bundle, $10 custom audit. No Stripe. No accounts.",
        "Product",
        "Open the Issuance Portal →",
        "/pay.html",
        """<h2>5 priced resources</h2>
<div class="grid">
  <div class="card"><p class="card-name">Issuance</p><p class="price">$0.50 USDC</p><p class="card-desc">Pay for your model, agent, or asset to be measured.</p></div>
  <div class="card"><p class="card-name">Evidence bundle</p><p class="price">$1.00 USDC</p><p class="card-desc">A pack of cards for a specific obligation.</p></div>
  <div class="card"><p class="card-name">Data feed</p><p class="price">$2.00 USDC</p><p class="card-desc">Live deltas feed for compliance teams.</p></div>
  <div class="card"><p class="card-name">Proof bundle</p><p class="price">$1.50 USDC</p><p class="card-desc">Inclusion proof + bulk history for a card.</p></div>
  <div class="card"><p class="card-name">Custom audit</p><p class="price">$10.00 USDC</p><p class="card-desc">A scoped measurement run against a specific obligation.</p></div>
</div>
<h2>How it works</h2>
<p>An agent hits a priced endpoint. The server returns HTTP 402 with a USDC payment challenge (EIP-3009 transferWithAuthorization). MetaMask signs the authorization on Base. The open facilitator submits the transaction. Every receipt is signed under did:web:csoai.org#card-attestation-1.</p>""",
    ),
    (
        "verifier",
        "Verifier Portal — CSOAI (Offline WebCrypto)",
        "Paste any CSOAI signed card. Verify it offline in your browser. No server call. No tracking. No JS dependencies. The same canonical form + Ed25519 + WebCrypto the mill uses.",
        "WebSite",
        "Open the Verifier Portal →",
        "/gspc-verify",
        """<h2>What you can verify</h2>
<ul style="color: var(--muted); line-height: 1.8;">
  <li>The card body is in canonical form (sorted keys, no whitespace, ensure_ascii=False)</li>
  <li>The SHA-256 of the body matches the recorded sha256</li>
  <li>The Ed25519 signature verifies under did:web:csoai.org#card-attestation-1</li>
  <li>The card's claims match the GSPC schema (csoai.gspc-axes/0.5)</li>
  <li>If claimed, the OTS proof verifies against a Bitcoin block</li>
</ul>
<h2>The honest answer for any card</h2>
<p>The verifier returns one of three verdicts:</p>
<ul style="color: var(--muted); line-height: 1.8;">
  <li><strong>VERIFIED</strong> — all checks pass. The card is real.</li>
  <li><strong>TAMPERED</strong> — the body has been modified after signing.</li>
  <li><strong>UNCHECKABLE</strong> — we can't verify (e.g. unknown kid, malformed body, OTS upgrade pending).</li>
</ul>""",
    ),
    (
        "marketplace",
        "Marketplace — CSOAI packs",
        "Pre-built evidence packs for every compliance obligation. EU AI Act Article 5. EU AI Act Article 50. CRA readiness. Insurer evidence. NIST AI RMF crosswalk. Each pack is a signed card + a PDF + the underlying measurement trace.",
        "Product",
        "Open the Marketplace →",
        "/products",
        """<h2>Available packs</h2>
<div class="grid">
  <div class="card"><p class="card-name">EU AI Act Article 5</p><p class="price">$0.50 USDC</p><p class="card-desc">Prohibited practice evidence pack — 22 axes × EU AI Act Article 5 prohibited practices.</p></div>
  <div class="card"><p class="card-name">EU AI Act Article 50</p><p class="price">$0.50 USDC</p><p class="card-desc">Transparency marking evidence pack — C2PA detection + signed card.</p></div>
  <div class="card"><p class="card-name">CRA readiness</p><p class="price">$1.00 USDC</p><p class="card-desc">Cyber Resilience Act evidence pack — 22 axes × CRA essential requirements.</p></div>
  <div class="card"><p class="card-name">Insurer evidence</p><p class="price">$2.00 USDC</p><p class="card-desc">Lloyd's syndicate evidence pack — 22 axes × liability mapping.</p></div>
</div>""",
    ),
    (
        "blog",
        "Blog — CSOAI",
        "The long-form writing on measurement, governance, and the doctrine. 1 post per week. Cross-posted to arXiv, LessWrong, EA Forum, AI Alignment Forum. Every post is signed under did:web:csoai.org#card-attestation-1.",
        "Blog",
        "Read the blog →",
        "/blog",
        """<h2>Recent posts</h2>
<p>(Coming soon — first post: <em>Why measurement, not certification</em>)</p>
<h2>Why a blog</h2>
<p>The CSOAI doctrine is too important for a tweet thread. The blog is where we explain, in long form, what we mean by <em>anyone can re-check</em>, what we mean by <em>UNCHECKABLE is honest</em>, and what we mean by <em>measurement, not certification</em>.</p>
<h2>How to subscribe</h2>
<p>RSS: <a href="/blog.xml" style="color: var(--accent);">/blog.xml</a>. Atom: <a href="/blog.atom" style="color: var(--accent);">/blog.atom</a>. JSON Feed: <a href="/blog.json" style="color: var(--accent);">/blog.json</a>.</p>""",
    ),
    (
        "press",
        "Press Portal — CSOAI",
        "Press releases, the press kit (logos, screenshots, FAQ, contacts), and the media list. Every press release is signed under did:web:csoai.org#card-attestation-1 and stamped with OpenTimestamps; a stamp will anchor to Bitcoin once a calendar commits it.",
        "WebSite",
        "Open the Press Portal →",
        "/press.html",
        """<h2>Press kit</h2>
<ul style="color: var(--muted); line-height: 1.8;">
  <li><strong>Logos</strong> — SVG, PNG, favicon. Black, white, and the orange-of-truth.</li>
  <li><strong>Screenshots</strong> — the GSPC board, the corrections ledger, the Layer 0 ceremony.</li>
  <li><strong>FAQ</strong> — for journalists who don't want to read the whitepaper.</li>
  <li><strong>Contacts</strong> — press@csoai.org, nicholas@csoai.org.</li>
</ul>
<h2>Recent press releases</h2>
<p>(Coming soon — first release: <em>CSOAI ships the open MetaMask x402 facilitator</em>)</p>""",
    ),
    (
        "dashboards",
        "Dashboards — CSOAI (one per persona)",
        "The persona dashboard. The view that fits the role. EU AI Office. Vendor. Insurer. Journalist. Affected person. Each dashboard surfaces the same substrate through the lens the persona needs.",
        "WebSite",
        "Open the Dashboards →",
        "/dashboards/",
        """<h2>5 persona dashboards</h2>
<div class="grid">
  <div class="card"><p class="card-name">EU AI Office</p><p class="price">Article 5, 50, GPAI</p><p class="card-desc">The regulator's view of the 22 axes.</p></div>
  <div class="card"><p class="card-name">Vendor</p><p class="price">CTO, compliance</p><p class="card-desc">Get a signed card back for your model.</p></div>
  <div class="card"><p class="card-name">Insurer</p><p class="price">Lloyd's syndicate</p><p class="card-desc">Liability mapping across the 22 axes.</p></div>
  <div class="card"><p class="card-name">Journalist</p><p class="price">Tech, AI safety</p><p class="card-desc">Independent verification of vendor claims.</p></div>
  <div class="card"><p class="card-name">Affected person</p><p class="price">Anyone</p><p class="card-desc">Submit a correction in plain English.</p></div>
</div>""",
    ),
]


def build_html(slug: str, title: str, description: str, schema_type: str,
               cta_text: str, cta_url: str, body_html: str) -> str:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    canonical = f"https://{slug}.councilof.ai"
    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": schema_type,
        "name": title,
        "description": description,
        "url": canonical,
        "publisher": {"@type": "Organization", "name": "CSOAI Ltd", "url": "https://csoai.org"},
        "inLanguage": "en",
        "dateModified": now,
    }, indent=2)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="description" content="{description}" />
<link rel="canonical" href="{canonical}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="{canonical}" />
<meta property="og:image" content="https://councilof.ai/og-default.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">{jsonld}</script>
<style>
  :root {{ --accent: #2563eb; --bg: #0a0a0a; --fg: #fafafa; --muted: #a3a3a3; --card: #171717; --border: #262626; }}
  * {{ box-sizing: border-box; }}
  body {{ font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; background: var(--bg); color: var(--fg); }}
  header {{ padding: 64px 24px 32px; max-width: 960px; margin: 0 auto; }}
  .container {{ max-width: 960px; margin: 0 auto; padding: 0 24px 96px; }}
  h1 {{ font-size: 48px; line-height: 1.1; margin: 0 0 16px; font-weight: 900; letter-spacing: -0.02em; }}
  h2 {{ font-size: 28px; margin: 48px 0 16px; font-weight: 800; letter-spacing: -0.01em; }}
  p {{ font-size: 17px; line-height: 1.6; color: var(--muted); }}
  .lid {{ display: inline-block; background: var(--card); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; color: var(--accent); margin-bottom: 16px; }}
  .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 24px; }}
  .card {{ background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 20px; }}
  .card-name {{ font-size: 12px; font-weight: 600; color: var(--accent); margin: 0 0 6px; text-transform: uppercase; letter-spacing: 0.05em; }}
  .price {{ font-size: 18px; font-weight: 700; color: var(--fg); margin: 0; }}
  .card-desc {{ font-size: 13px; color: var(--muted); margin: 8px 0 0; line-height: 1.4; }}
  .cta {{ display: inline-block; background: var(--accent); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; margin-top: 24px; }}
  .cta:hover {{ background: #1d4ed8; }}
  footer {{ padding: 48px 24px; max-width: 960px; margin: 0 auto; border-top: 1px solid var(--border); color: var(--muted); font-size: 13px; }}
  footer a {{ color: var(--accent); text-decoration: none; }}
</style>
</head>
<body>

<header>
  <span class="lid">{LID}</span>
  <h1>{title.replace(' — CSOAI', '').replace('CSOAI ', '')}</h1>
  <p>{description}</p>
  <a href="https://councilof.ai{cta_url}" class="cta">{cta_text}</a>
</header>

<div class="container">
{body_html}
</div>

<footer>
<p>CSOAI Ltd · UK 16939677 · <a href="https://councilof.ai">councilof.ai</a> · <a href="https://csoai.org">csoai.org</a></p>
<p style="margin-top: 8px;">The lid phrase: 22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact. Measurement, not certification. Anyone can re-check.</p>
</footer>

</body>
</html>
"""


def main():
    ap = argparse.ArgumentParser(description="Build the 7 subdomain landing pages.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — BUILD THE 7 SUBDOMAIN LANDING PAGES")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)
    n_built = 0
    for slug, title, desc, schema_type, cta_text, cta_url, body_html in SUBDOMAINS:
        subdir = OUT / slug
        subdir.mkdir(parents=True, exist_ok=True)
        html = build_html(slug, title, desc, schema_type, cta_text, cta_url, body_html)
        path = subdir / "index.html"
        path.write_text(html)
        n_built += 1
        print(f"  ✓ {slug:<12} → /public/subdomains/{slug}/index.html ({len(html)}B)")

    print()
    print(f"  built {n_built} subdomain landing pages")
    print()
    print(f"  Next: deploy each to its own CF Pages project")
    print(f"        7 subdomains = 7 CF Pages projects")
    print(f"        Each gets its own deploy, its own dashboard, its own retry")
    print()
    print(f"  Subdomains: proofs. issuance. verifier. marketplace. blog. press. dashboards.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
