import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "openmoe.ai — Diamonds & Breakthroughs | CSOAI",
  description: "Fact-checked intelligence dossier on the open-source AI governance stack. 478 CSOAI-ORG repos, 9 verified PyPI packages, 16-module BFT engine. Verified against live sources on 12 June 2026.",
  alternates: { canonical: "/openmoe" },
  openGraph: {
    title: "openmoe.ai — Diamonds & Breakthroughs",
    description: "The fact-checked intelligence dossier on the open-source AI governance stack. 478 CSOAI-ORG repos. 30 servers on the official MCP Registry. 13-framework crosswalk. 16-module BFT engine.",
    type: "website",
    images: ["https://proofof.ai/openmoe/csoai_ecosystem.png"],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "openmoe.ai — Diamonds & Breakthroughs", item: "https://csoai.org/openmoe/" },
  ],
};

export default function OpenmoePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style>{`

.legacy-content :root{--bg:#0a0a0f;--surface:#111118;--surface-2:#1a1a25;--border:#1e1e2e;--border-2:#2a2a3a;--text:#e2e8f0;--text-2:#94a3b8;--text-3:#64748b;--accent:#D4A843;--accent-2:#E8B76D;--accent-3:#7c3aed;--good:#22c55e;--warn:#f59e0b;--bad:#ef4444;--info:#3b82f6}
.legacy-content *{box-sizing:border-box;margin:0;padding:0}
.legacy-content html{scroll-behavior:smooth}
.legacy-content body{font-family:'Inter',-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.65;-webkit-font-smoothing:antialiased;font-feature-settings:"cv11","ss01"}
.legacy-content .wrap{max-width:1180px;margin:0 auto;padding:0 24px}
.legacy-content header.site{padding:18px 0;border-bottom:1px solid var(--border);background:rgba(10,10,15,.85);backdrop-filter:blur(12px);position:sticky;top:0;z-index:50}
.legacy-content .brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit}
.legacy-content .brand-mark{width:36px;height:36px;border-radius:8px;background:#0F172A;display:grid;place-items:center;font-weight:800;color:#D4A843;font-family:'Space Grotesk',sans-serif;font-size:18px}
.legacy-content .brand-name{font-family:'Space Grotesk',sans-serif;font-size:1.3rem;font-weight:700;background:linear-gradient(135deg,#D4A843,#E8B76D);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.legacy-content .brand-sub{font-size:.75rem;color:var(--text-3);font-family:'JetBrains Mono',monospace;margin-left:8px}
.legacy-content nav.top{display:flex;gap:8px;margin-left:auto}
.legacy-content nav.top a{color:var(--text-2);text-decoration:none;font-size:.9rem;padding:6px 12px;border-radius:6px;transition:.2s}
.legacy-content nav.top a:hover{color:var(--accent);background:var(--surface)}
.legacy-content .hero{padding:80px 0 60px;background:radial-gradient(ellipse at 50% 0%,rgba(124,58,237,.12),transparent 60%)}
.legacy-content .hero h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(2.4rem,5vw,4.2rem);line-height:1.1;letter-spacing:-.02em;margin-bottom:18px;font-weight:800}
.legacy-content .hero h1 .grad{background:linear-gradient(135deg,#D4A843 0%,#E8B76D 50%,#7c3aed 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.legacy-content .hero p.lede{font-size:1.15rem;color:var(--text-2);max-width:780px;margin-bottom:32px}
.legacy-content .cta-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:32px}
.legacy-content .btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:8px;font-weight:600;text-decoration:none;font-size:.95rem;transition:.2s;border:1px solid var(--border);color:var(--text);background:var(--surface)}
.legacy-content .btn:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
.legacy-content .btn.primary{background:linear-gradient(135deg,#D4A843,#E8B76D);color:#0F172A;border:0}
.legacy-content .btn.primary:hover{box-shadow:0 8px 24px rgba(212,168,67,.3)}
.legacy-content .meta-row{display:flex;gap:18px;flex-wrap:wrap;font-family:'JetBrains Mono',monospace;font-size:.78rem;color:var(--text-3)}
.legacy-content .meta-row b{color:var(--text);font-weight:600}
.legacy-content .corrections{background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(245,158,11,.06));border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:20px 24px;margin:32px 0}
.legacy-content .corrections h3{color:#fca5a5;font-size:.95rem;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:12px;font-weight:700;display:flex;align-items:center;gap:8px}
.legacy-content .corrections table{width:100%;border-collapse:collapse;font-size:.85rem;margin-top:8px}
.legacy-content .corrections th,.legacy-content .corrections td{padding:8px 10px;text-align:left;border-bottom:1px solid rgba(239,68,68,.15)}
.legacy-content .corrections th{color:#fcd34d;font-weight:600;font-size:.78rem;text-transform:uppercase;letter-spacing:1px}
.legacy-content .corrections td.bad{color:#fca5a5;text-decoration:line-through;text-decoration-color:rgba(252,165,165,.4)}
.legacy-content .corrections td.good{color:#86efac;font-weight:600}
.legacy-content section{padding:64px 0;border-top:1px solid var(--border)}
.legacy-content section h2{font-family:'Space Grotesk',sans-serif;font-size:2rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:14px}
.legacy-content section h2 .num{font-family:'JetBrains Mono',monospace;font-size:1.1rem;color:var(--accent);background:var(--surface-2);padding:4px 10px;border-radius:6px;border:1px solid var(--border-2)}
.legacy-content section h2+p.subtitle{color:var(--text-2);font-size:1.05rem;margin-bottom:32px;max-width:780px}
.legacy-content .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;margin-top:24px}
.legacy-content .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:22px;transition:.2s}
.legacy-content .card:hover{border-color:var(--border-2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.legacy-content .card h4{color:var(--accent);font-family:'Space Grotesk',sans-serif;font-size:1rem;margin-bottom:10px;font-weight:600}
.legacy-content .card .num{font-family:'JetBrains Mono',monospace;font-size:2.2rem;font-weight:800;color:var(--text);display:block;margin-bottom:6px}
.legacy-content .card p{color:var(--text-2);font-size:.88rem;line-height:1.6}
.legacy-content .card .meta{color:var(--text-3);font-size:.75rem;font-family:'JetBrains Mono',monospace;margin-top:8px;display:block}
.legacy-content .diamond{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:14px;margin-top:24px}
.legacy-content .diamond .d{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px;display:flex;align-items:center;gap:14px}
.legacy-content .diamond .d .icon{width:44px;height:44px;border-radius:10px;background:var(--surface-2);display:grid;place-items:center;font-size:1.4rem;flex-shrink:0}
.legacy-content .diamond .d h5{margin:0 0 4px;font-size:.95rem;color:var(--text);font-weight:600}
.legacy-content .diamond .d p{margin:0;font-size:.8rem;color:var(--text-3);font-family:'JetBrains Mono',monospace}
.legacy-content .diamond .d .stars{color:var(--accent);font-size:.75rem;font-family:'JetBrains Mono',monospace;margin-top:2px}
.legacy-content .diag{margin:32px 0;background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:24px;text-align:center}
.legacy-content .diag img{max-width:100%;height:auto;border-radius:8px}
.legacy-content .diag .cap{color:var(--text-3);font-size:.82rem;margin-top:12px;font-family:'JetBrains Mono',monospace}
.legacy-content .timeline{position:relative;padding:24px 0 24px 24px;border-left:2px solid var(--border-2);margin-top:24px}
.legacy-content .timeline .item{position:relative;padding:0 0 24px 24px}
.legacy-content .timeline .item:before{content:"";position:absolute;left:-32px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--accent);border:3px solid var(--bg)}
.legacy-content .timeline .item h5{margin:0 0 4px;font-size:1rem;color:var(--text);font-weight:600}
.legacy-content .timeline .item p{margin:0;font-size:.85rem;color:var(--text-2)}
.legacy-content .timeline .item .when{color:var(--accent);font-size:.75rem;font-family:'JetBrains Mono',monospace;margin-bottom:2px;display:block}
.legacy-content .recommend{counter-reset:rec;list-style:none;padding:0}
.legacy-content .recommend li{counter-increment:rec;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 22px;margin-bottom:10px;display:flex;align-items:flex-start;gap:18px;transition:.2s}
.legacy-content .recommend li:hover{border-color:var(--accent)}
.legacy-content .recommend li:before{content:counter(rec);font-family:'Space Grotesk',sans-serif;font-size:1.4rem;font-weight:800;color:var(--accent);min-width:36px;text-align:center}
.legacy-content .recommend li b{color:var(--text);font-weight:600;display:block;margin-bottom:4px}
.legacy-content .recommend li p{margin:0;color:var(--text-2);font-size:.88rem;line-height:1.6}
.legacy-content .bft{background:var(--surface);border:1px solid var(--accent);border-radius:10px;padding:18px;margin-top:24px;font-family:'JetBrains Mono',monospace;font-size:.85rem;line-height:1.6;color:var(--text-2)}
.legacy-content .bft .h{color:var(--accent);margin-bottom:8px;font-weight:600;font-size:.78rem;letter-spacing:1.5px;text-transform:uppercase}
.legacy-content .bft pre{background:#000;color:#86efac;padding:14px 18px;border-radius:8px;overflow-x:auto;font-size:.78rem;line-height:1.5}
.legacy-content .cta-strip{background:linear-gradient(135deg,rgba(124,58,237,.15),rgba(212,168,67,.1));border:1px solid var(--border-2);border-radius:14px;padding:32px 28px;text-align:center;margin:32px 0}
.legacy-content .cta-strip h3{font-family:'Space Grotesk',sans-serif;font-size:1.5rem;margin-bottom:8px}
.legacy-content .cta-strip p{color:var(--text-2);margin-bottom:18px;max-width:680px;margin-left:auto;margin-right:auto}
.legacy-content footer.site{border-top:1px solid var(--border);padding:48px 0 24px;background:var(--surface)}
.legacy-content footer .row{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;margin-bottom:32px}
.legacy-content footer h6{color:var(--accent);font-size:.75rem;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:14px;font-weight:700}
.legacy-content footer a{color:var(--text-2);text-decoration:none;display:block;font-size:.85rem;padding:5px 0;transition:.2s}
.legacy-content footer a:hover{color:var(--accent)}
.legacy-content footer .legal{border-top:1px solid var(--border);padding-top:18px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;color:var(--text-3);font-size:.78rem}
@media(max-width:768px){.legacy-content .hero h1{font-size:2.2rem}.legacy-content .corrections table{font-size:.78rem}.legacy-content footer .row{grid-template-columns:1fr 1fr}}
.legacy-content .badges{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}
.legacy-content .badge{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:99px;font-size:.72rem;font-weight:600;background:var(--surface-2);color:var(--text-2);border:1px solid var(--border-2);font-family:'JetBrains Mono',monospace}
.legacy-content .badge.live{color:var(--good);border-color:rgba(34,197,94,.3);background:rgba(34,197,94,.08)}
.legacy-content .badge.verified{color:var(--accent);border-color:rgba(212,168,67,.3);background:rgba(212,168,67,.08)}
.legacy-content .badge.mit{color:#c084fc;border-color:rgba(192,132,252,.3);background:rgba(192,132,252,.08)}

      `}</style>
      <div
        className="legacy-content"
        dangerouslySetInnerHTML={{ __html: `<section class="hero">
<div class="wrap">
<div class="badges">
<span class="badge live">● LIVE</span>
<span class="badge verified">✓ FACT-CHECKED</span>
<span class="badge mit">MIT</span>
<span class="badge verified">491 lines · 6 sources verified</span>
</div>
<h1>The <span class="grad">Diamonds, Breakthroughs</span> &amp; <span class="grad">Open-Source Arsenal</span><br>behind sovereign AI.</h1>
<p class="lede">A fact-checked intelligence report on the open-source AI governance stack. <b>478 CSOAI-ORG repos</b>. <b>30 servers on the official MCP Registry</b>. <b>13-framework crosswalk</b>. <b>16-module BFT engine</b>. Every number verified against live sources on <b>12 June 2026</b>.</p>
<div class="cta-row">
<a class="btn primary" href="https://proofof.ai/openmoe/" rel="noopener">Read the full dossier →</a>
<a class="btn" href="https://github.com/CSOAI-ORG/openmoe.ai" rel="noopener">View source on GitHub</a>
<a class="btn" href="https://github.com/CSOAI-ORG/openmoe.ai/blob/main/FACTCHECKED.md" rel="noopener">Download FACTCHECKED.md</a>
</div>
<div class="meta-row">
<span><b>Author</b> Nicholas Templeman · MEOK AI Labs / CSOAI</span>
<span><b>Verified by</b> Mavis (12 Jun 2026)</span>
<span><b>License</b> MIT</span>
<span><b>Stars eligible</b> ⭐ if useful</span>
</div>
</div>
</section>

<section>
<div class="wrap">
<div class="corrections">
<h3>⚠ 4 Critical Corrections from the First Edition</h3>
<p style="color:#fcd34d;font-size:.88rem;margin-bottom:14px">The first edition (preserved for diff) inflated four headline numbers. This is the corrected version. <a href="original-first-edition.md" style="color:#fcd34d;text-decoration:underline">See diff here</a>.</p>
<table>
<tr><th>Claim</th><th>First edition</th><th>Verified (live, 12 Jun 2026)</th><th>Verdict</th></tr>
<tr><td>CSOAI servers on official MCP Registry</td><td>294</td><td class="bad">294</td><td class="good">30</td><td><b>10x inflated</b></td></tr>
<tr><td>Crosswalk framework count</td><td>30</td><td class="bad">30</td><td class="good">13</td><td><b>2.3x inflated</b></td></tr>
<tr><td>MEOK consumer Pro pricing</td><td>£199/mo</td><td class="bad">£199/mo</td><td class="good">£19/mo</td><td><b>10x inflated</b></td></tr>
<tr><td>DeepSeek V4-Pro input cost (cache miss)</td><td>\$1.74/M</td><td class="bad">\$1.74/M</td><td class="good">\$0.435/M</td><td><b>4x inflated</b></td></tr>
</table>
</div>
</div>
</section>

<section>
<div class="wrap">
<h2><span class="num">01</span> The verified stack at a glance</h2>
<p class="subtitle">Six layers. 478+30 repos. One open-source fabric powering sovereign AI.</p>
<div class="cards">
<div class="card">
<span class="num">478</span>
<h4>CSOAI-ORG public repos</h4>
<p>Verified via <code style="background:#000;padding:1px 6px;border-radius:3px;font-size:.8em">GET /users/CSOAI-ORG</code>. The governance fabric at the heart of the stack.</p>
<span class="meta">github.com/CSOAI-ORG</span>
</div>
<div class="card">
<span class="num">30</span>
<h4>Servers on official MCP Registry</h4>
<p>Verified against <code style="background:#000;padding:1px 6px;border-radius:3px;font-size:.8em">registry.modelcontextprotocol.io/v0.1/servers?search=CSOAI</code>. The 294 figure was an internal-org count.</p>
<span class="meta">modelcontextprotocol.io</span>
</div>
<div class="card">
<span class="num">9</span>
<h4>Verified PyPI compliance packages</h4>
<p>181+ releases between them, all MIT. EU AI Act · DORA · NIS2 · CRA · GDPR · CSRD · NIST RMF · ISO 42001 · Governance Crosswalk.</p>
<span class="meta">pypi.org</span>
</div>
<div class="card">
<span class="num">16</span>
<h4>OPENMOE BFT modules</h4>
<p>Verified verbatim from <code style="background:#000;padding:1px 6px;border-radius:3px;font-size:.8em">openmoe_bft/bft.py</code>. stdlib-only, zero-dep, Apache 2.0. The 2f+1 quorum is real.</p>
<span class="meta">github.com/CSOAI-ORG/OPENMOE</span>
</div>
<div class="card">
<span class="num">13</span>
<h4>Framework crosswalk</h4>
<p>EU AI Act, ISO 42001, NIST AI RMF, GDPR, SOC 2, HIPAA, FedRAMP, CCPA, PIPEDA, DPDPA, LGPD, CSA, OWASP — one query, 13 frameworks.</p>
<span class="meta">csoai-governance-crosswalk-mcp</span>
</div>
<div class="card">
<span class="num">10,523</span>
<h4>The Hives (aden-hive/hive) stars</h4>
<p>208 contributors, 5,659 forks, Apache 2.0. Self-healing agent graphs in production. <a href="https://github.com/aden-hive/hive" style="color:var(--accent)">→</a></p>
<span class="meta">github.com/aden-hive/hive</span>
</div>
</div>
</div>
</section>

<section>
<div class="wrap">
<h2><span class="num">02</span> Verified open-source diamonds</h2>
<p class="subtitle">Every number below is a live API call. Click through to verify yourself.</p>
<div class="diamond">
<div class="d"><div class="icon">⚡</div><div><h5>vLLM</h5><p class="stars">82,624 ★ · Apache 2.0</p></div></div>
<div class="d"><div class="icon">🚀</div><div><h5>SGLang</h5><p class="stars">28,919 ★ · 400,000+ GPUs in prod</p></div></div>
<div class="d"><div class="icon">📚</div><div><h5>RAGFlow</h5><p class="stars">82,512 ★ · Apache 2.0</p></div></div>
<div class="d"><div class="icon">🔀</div><div><h5>LiteLLM</h5><p class="stars">50,113 ★ · 100+ providers</p></div></div>
<div class="d"><div class="icon">🐝</div><div><h5>The Hives</h5><p class="stars">10,523 ★ · 208 contributors</p></div></div>
<div class="d"><div class="icon">🐍</div><div><h5>Mamba SSM</h5><p class="stars">18,429 ★ · O(N) scaling</p></div></div>
<div class="d"><div class="icon">🤖</div><div><h5>nanochat</h5><p class="stars">54,919 ★ · \$48 / 1.65h</p></div></div>
<div class="d"><div class="icon">🧠</div><div><h5>DeepSeek V4-Pro</h5><p class="stars">1.6T / 49B active · 1M ctx · \$0.435/M</p></div></div>
<div class="d"><div class="icon">⚙️</div><div><h5>DeepSeek V4-Flash</h5><p class="stars">284B / 13B active · 1M ctx · \$0.14/M</p></div></div>
<div class="d"><div class="icon">💻</div><div><h5>Qwen3-Coder-Next</h5><p class="stars">80B / 3B · 256K · Apache 2.0</p></div></div>
</div>
</div>
</section>

<section>
<div class="wrap">
<h2><span class="num">03</span> OPENMOE — BFT math verified at source-code level</h2>
<p class="subtitle">Read directly from <code style="background:#000;padding:1px 6px;border-radius:3px">CSOAI-ORG/OPENMOE/openmoe_bft/bft.py</code>.</p>
<div class="bft">
<div class="h">// The 2f+1 Byzantine consensus formula</div>
<pre>def tolerated_faults(total_nodes: int) -> int:
    """f = floor((n - 1) / 3): the number of Byzantine faults tolerated."""
    if total_nodes &lt; 1:
        raise ValueError("total_nodes must be >= 1")
    return (total_nodes - 1) // 3

def quorum_size(total_nodes: int) -> int:
    """2f + 1: the number of agreeing votes required for consensus."""
    return 2 * tolerated_faults(total_nodes) + 1</pre>
</div>
<p style="color:var(--text-2);margin-top:18px"><b>16 modules</b> in <code style="background:#000;padding:1px 6px;border-radius:3px">openmoe_bft/</code>: <code>__init__</code> · <code>a2a</code> · <code>aggregators</code> · <code>bazaar</code> · <code>bft</code> · <code>cli</code> · <code>covenants</code> · <code>debate</code> · <code>eu_ai_act</code> · <code>experts</code> · <code>memory</code> · <code>moe</code> · <code>receipts</code> · <code>red_team</code> · <code>reputation</code> · <code>routing</code>. Stdlib-only, zero-dep, Apache 2.0.</p>
</div>
</section>

<section>
<div class="wrap">
<h2><span class="num">04</span> Architecture diagrams</h2>
<div class="diag">
<img src="https://proofof.ai/openmoe/csoai_ecosystem.png" alt="CSOAI Ecosystem Architecture — Governance, Sovereign OS, Agent Runtime, MCP Servers, BFT/MoE" loading="lazy">
<div class="cap">Fig. 1 — CSOAI ecosystem: CSOAI.org → MEOK.ai (Sovereign OS) → The Hives (Multi-Agent Runtime) → 30 MCP servers on the official Registry + 9 verified PyPI compliance packages + OPENMOE BFT/MoE layer</div>
</div>
<div class="diag">
<img src="https://proofof.ai/openmoe/model_comparison.png" alt="Model architecture comparison — context window + total/active params for DeepSeek V4-Pro, Kimi K2.6, GLM-5.1, Qwen3-Coder-Next, Llama 4 Scout, Mamba-3" loading="lazy">
<div class="cap">Fig. 2 — Frontier open-weight models: context window and total/active param split</div>
</div>
</div>
</section>

<section>
<div class="wrap">
<h2><span class="num">05</span> The compliance cliff — revised date</h2>
<p class="subtitle">The 2 August 2026 deadline in the first edition is <b style="color:#fca5a5">stale</b>. The canonical source (the watermarking MCP's own PyPI summary) says:</p>
<div class="timeline">
<div class="item">
<span class="when">2 Aug 2026</span>
<h5>Marketing copy (meok.ai homepage)</h5>
<p>"EU AI Act Article 50 deadline — 50 days remaining" countdown. Aspirational.</p>
</div>
<div class="item">
<span class="when">2 Nov 2026 (live)</span>
<h5>Canonical (meok-watermark-attest-mcp PyPI summary)</h5>
<p>"Built for the 2 November 2026 cliff — the new nearest EU AI Act deadline after the Digital Omnibus pushed high-risk to Dec 2027."</p>
</div>
<div class="item">
<span class="when">2 Dec 2027</span>
<h5>Annex III high-risk obligations</h5>
<p>Pushed to December 2027 by the Digital Omnibus simplification. The 50-day urgency in the first edition was the wrong date.</p>
</div>
</div>
<p style="color:var(--accent);font-size:.9rem;margin-top:18px">⚠ Worth verifying with the legal team before quoting any specific date externally.</p>
</div>
</section>

<section>
<div class="wrap">
<h2><span class="num">06</span> 10 actionable recommendations</h2>
<ol class="recommend">
<li><div><b>Deploy the CSOAI MCP fleet.</b> All 9 verified PyPI packages are MIT, installable via <code style="background:#000;padding:1px 6px;border-radius:3px">pip install &lt;name&gt;</code>. Start with <code style="background:#000;padding:1px 6px;border-radius:3px">eu-ai-act-compliance-mcp</code>, <code style="background:#000;padding:1px 6px;border-radius:3px">meok-watermark-attest-mcp</code>, and <code style="background:#000;padding:1px 6px;border-radius:3px">csoai-governance-crosswalk-mcp</code> for the critical compliance path.</div></li>
<li><div><b>Integrate The Hives</b> as your agent runtime. Real 10,523-star production harness, Apache 2.0, real self-healing.</div></li>
<li><div><b>Evaluate SGLang</b> for inference serving. 28,919 stars, 400K+ GPUs in production, Apache 2.0, LMSYS-hosted.</div></li>
<li><div><b>Implement OPENMOE</b> for MoE governance. 16-module BFT package, stdlib-only, Apache 2.0.</div></li>
<li><div><b>Build on RAGFlow</b> for regulatory knowledge. 82,512 stars, deep document understanding, MCP integration.</div></li>
<li><div><b>Use LiteLLM</b> for model routing. 50,113 stars, 100+ providers, built-in cost tracking.</div></li>
<li><div><b>Consider Mamba-3</b> for long-context compliance analysis. Mamba SSM repo verified 18,429 stars, last push 2026-06-09.</div></li>
<li><div><b>Verify the "183 tests" claim</b> in OPENMOE by running <code style="background:#000;padding:1px 6px;border-radius:3px">cd OPENMOE &amp;&amp; pytest tests/ -q</code>.</div></li>
<li><div><b>Verify the Article 50 deadline</b> with the legal team before any external publication.</div></li>
<li><div><b>SOV3 should be added to the openmoe.ai stack as the sovereign model layer.</b> Public surface: <code style="background:#000;padding:1px 6px;border-radius:3px">consciousness-engine-mcp</code> (CSOAI-ORG, last push 2026-06-12).</div></li>
</ol>
</div>
</section>

<section>
<div class="wrap">
<div class="cta-strip">
<h3>Ready to dig deeper?</h3>
<p>The full 491-line fact-checked report covers model architectures, inference engines, fine-tuning frameworks, vector databases, safety guardrails, MCP/A2A/ACP protocols, training-from-scratch with Karpathy's nanochat, and the openmore.ai integration architecture.</p>
<div class="cta-row" style="justify-content:center">
<a class="btn primary" href="https://proofof.ai/openmoe/" rel="noopener">Read full dossier at proofof.ai</a>
<a class="btn" href="https://github.com/CSOAI-ORG/openmoe.ai" rel="noopener">Source on GitHub</a>
</div>
</div>
</div>
</section>` }}
      />
    </div>
  );
}
