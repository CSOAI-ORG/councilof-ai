import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sandbox — CSOAI",
  description: "Try CSOAI Watchdog Certificates live in your browser. Free, no signup, just paste any text and get a signed attestation.",
  alternates: { canonical: "/sandbox" },
  openGraph: {
    title: "Sandbox — CSOAI",
    description: "Try CSOAI Watchdog Certificates live in your browser. Free, no signup, just paste any text and get a signed attestation.",
    type: "website",
    
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Sandbox — CSOAI", item: "https://csoai.org/sandbox" },
  ],
};

export default function SandboxPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <style>{`

    .legacy-content *{box-sizing:border-box;margin:0;padding:0}
    .legacy-content body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#e2e8f0;line-height:1.6}
    .legacy-content .container{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
    .legacy-content h1{font-size:2rem;letter-spacing:-.02em;margin-bottom:.5rem;color:#c9a84c}
    .legacy-content h2{margin-top:2.5rem;margin-bottom:1rem;font-size:1.3rem;color:#c9a84c;border-bottom:1px solid #334155;padding-bottom:.5rem}
    .legacy-content p{color:#cbd5e1;margin-bottom:.75rem}
    .legacy-content a{color:#c9a84c;text-decoration:none}
    .legacy-content a:hover{text-decoration:underline}
    .legacy-content .lead{color:#94a3b8;font-size:1.1rem;margin-bottom:2rem}
    .legacy-content .playground{background:#020617;border:2px solid #334155;border-radius:.5rem;padding:1.5rem;margin:2rem 0}
    .legacy-content .playground textarea{width:100%;min-height:120px;padding:1rem;background:#0f172a;border:1px solid #334155;border-radius:.4rem;color:#fff;font-family:ui-monospace,monospace;font-size:.9rem;line-height:1.6;resize:vertical}
    .legacy-content .playground input[type="text"]{width:100%;padding:.65rem 1rem;background:#0f172a;border:1px solid #334155;border-radius:.4rem;color:#fff;font-family:ui-monospace,monospace;font-size:.9rem;margin-bottom:.75rem}
    .legacy-content .playground label{display:block;color:#fbbf24;font-size:.85rem;font-weight:600;margin-bottom:.4rem}
    .legacy-content .playground button{background:#fbbf24;color:#020617;border:none;padding:.85rem 1.5rem;border-radius:.4rem;font-weight:700;cursor:pointer;font-size:1rem;margin-top:1rem;width:100%}
    .legacy-content .playground button:hover{background:#f59e0b}
    .legacy-content .playground button:disabled{background:#475569;cursor:not-allowed}
    .legacy-content .output{margin-top:1.5rem;padding:1.5rem;background:#020617;border:1px solid #334155;border-radius:.4rem;font-family:ui-monospace,monospace;font-size:.85rem;line-height:1.7;display:none;word-break:break-all;max-height:500px;overflow-y:auto}
    .legacy-content .output.show{display:block}
    .legacy-content .output .success{border-left:4px solid #10b981;padding-left:1rem}
    .legacy-content .output .error{border-left:4px solid #ef4444;padding-left:1rem;color:#fca5a5}
    .legacy-content .example{background:#020617;border:1px solid #334155;border-radius:.4rem;padding:1rem;margin:1rem 0;font-family:ui-monospace,monospace;font-size:.8rem;color:#94a3b8}
    .legacy-content .toc{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.5rem;margin:1.5rem 0 2rem;padding:1rem;background:#020617;border:1px solid #334155;border-radius:.4rem}
    .legacy-content .toc a{padding:.25rem .5rem;font-size:.85rem}
    .legacy-content .foot{margin-top:3rem;color:#64748b;font-size:.85rem;border-top:1px solid #334155;padding-top:1.5rem;text-align:center}
  
      `}</style>
      <div
        className="legacy-content"
        dangerouslySetInnerHTML={{ __html: `<div class="container">
    <p style="color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI · Sandbox</p>
    <h1>Try it. Free. No signup.</h1>
    <p class="lead">Type any text → get an Ed25519-signed Watchdog Certificate → public verify URL works in 30 seconds. Uses the live <code>meok-attestation-api.vercel.app</code> sovereign substrate.</p>

    <div class="toc">
      <a href="#sandbox">Sandbox</a>
      <a href="#verify">Verify</a>
      <a href="#api">API</a>
      <a href="#limits">Limits</a>
    </div>

    <h2 id="sandbox">Issue a free Watchdog Certificate</h2>

    <div class="playground">
      <label for="textInput">What do you want to certify?</label>
      <textarea id="textInput" placeholder="e.g. MEOK AI Labs CSOAI Dome v2.6.0-day11 — 88 pages, 29 API endpoints, 271 MCP servers, 200 council voters, 71/71 E2E A+."></textarea>

      <label for="authorInput" style="margin-top:1rem">Author (your name or org)</label>
      <input type="text" id="authorInput" placeholder="e.g. jeeves-cli / nick-templeman">

      <button onclick="issueCert()" id="issueBtn">Issue Certificate →</button>

      <div class="output" id="output"></div>
    </div>

    <div class="example">
      <strong>Example output (truncated):</strong><br>
      {<br>
      &nbsp;&nbsp;"id": "MEOK-MEOKSP-7D1E008FE28",<br>
      &nbsp;&nbsp;"ts": 1781669322.0,<br>
      &nbsp;&nbsp;"line": "C|jeeves-cli|nick-templeman|...",<br>
      &nbsp;&nbsp;"digest": "909c0295afb058e9",<br>
      &nbsp;&nbsp;"prev_sig": "a9dd344e8b54b2db...",<br>
      &nbsp;&nbsp;"signature": "abc123def456...",<br>
      &nbsp;&nbsp;"alg": "ed25519",<br>
      &nbsp;&nbsp;"verify_url": "https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-7D1E008FE28"<br>
      }
    </div>

    <h2 id="verify">Verify any certificate</h2>

    <div class="playground">
      <label for="verifyCertId">Certificate ID</label>
      <input type="text" id="verifyCertId" placeholder="e.g. MEOK-MEOKSP-7D1E008FE28">

      <button onclick="verifyCert()" id="verifyBtn">Verify →</button>

      <div class="output" id="verifyOutput"></div>
    </div>

    <h2 id="api">Use the sandbox via API</h2>
    <p>Programmatic access:</p>
    <pre><code># Issue a cert
curl -X POST https://meok-attestation-api.vercel.app/api/sign \\
  -H "Content-Type: application/json" \\
  -d '{"line": "C|jeeves-cli|nick-templeman|Hello world", "author": "demo"}'

# Verify a cert
curl https://meok-attestation-api.vercel.app/verify/MEOK-MEOKSP-7D1E008FE28

# Bulk: get the full chain manifest
curl https://meok-attestation-api.vercel.app/api/manifest | jq '.records[].id'</code></pre>

    <h2 id="limits">What this does</h2>
    <ul style="margin:1rem 0 1.5rem 1.5rem">
      <li>Issues an Ed25519-signed Watchdog Certificate</li>
      <li>Appends to the sovereign substrate's sigil bus</li>
      <li>Returns a public verify URL anyone can hit</li>
      <li>Counts toward your daily keystone cert quota (24/day from hourly cron)</li>
    </ul>

    <h2>What this doesn't do</h2>
    <ul style="margin:1rem 0 1.5rem 1.5rem">
      <li>Does NOT register your AI as EU AI Act compliant (only a notified body can do that)</li>
      <li>Does NOT store your text on the substrate (just the digest)</li>
      <li>Does NOT require any payment</li>
      <li>Does NOT require login or account creation</li>
    </ul>

    <p>For full Watchdog Cert coverage (legal evidence for AI Act + DORA + ISO 42001), upgrade to <a href="/pricing">Pro tier (£199/mo)</a> or <a href="/pricing">Enterprise (£1,499/mo)</a>.</p>

    

    <div class="foot">© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · <a href="/opengrid">/opengrid</a> · <a href="/api/playground">/api/playground</a></div>
  </div>` }}
      />
    </div>
  );
}
