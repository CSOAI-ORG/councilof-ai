"use client";

const scopedCss = `
  .api-playground-content * { box-sizing: border-box; margin: 0; padding: 0; }
  .api-playground-content { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.65; }
  .api-playground-content .container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }
  .api-playground-content h1 { font-size: 2rem; letter-spacing: -0.02em; margin-bottom: 0.5rem; color: #c9a84c; }
  .api-playground-content h2 { margin-top: 2.5rem; margin-bottom: 1rem; font-size: 1.3rem; color: #c9a84c; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; }
  .api-playground-content h3 { font-size: 1rem; margin-top: 1rem; margin-bottom: 0.5rem; color: #f8fafc; }
  .api-playground-content p { color: #cbd5e1; margin-bottom: 0.75rem; }
  .api-playground-content a { color: #c9a84c; text-decoration: none; }
  .api-playground-content a:hover { text-decoration: underline; }
  .api-playground-content .lead { color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem; }
  .api-playground-content pre { background: #020617; border: 1px solid #334155; padding: 1rem; border-radius: 0.4rem; overflow-x: auto; margin: 1rem 0; font-size: 0.85rem; line-height: 1.5; max-height: 400px; }
  .api-playground-content code { background: #020617; padding: 0.15rem 0.35rem; border-radius: 0.2rem; font-size: 0.88em; color: #fbbf24; border: 1px solid #334155; }
  .api-playground-content pre code { background: transparent; border: none; padding: 0; color: #e2e8f0; }
  .api-playground-content .endpoint-group { display: grid; grid-template-columns: 1fr 2fr; gap: 1rem; margin-bottom: 1rem; align-items: start; }
  .api-playground-content .endpoint-list { background: #020617; border: 1px solid #334155; border-radius: 0.5rem; padding: 1rem; }
  .api-playground-content .endpoint-list button { display: block; width: 100%; text-align: left; background: transparent; color: #cbd5e1; border: 1px solid #334155; padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; border-radius: 0.3rem; cursor: pointer; font-size: 0.85rem; }
  .api-playground-content .endpoint-list button:hover { background: #1e293b; color: #fbbf24; }
  .api-playground-content .endpoint-list button.active { background: #0a8a3f; color: white; border-color: #0a8a3f; }
  .api-playground-content .endpoint-list button .method { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 0.2rem; font-size: 0.7rem; margin-right: 0.5rem; font-weight: 600; }
  .api-playground-content .method-get { background: #10b981; color: #020617; }
  .api-playground-content .method-post { background: #3b82f6; color: #fff; }
  .api-playground-content .output { background: #020617; border: 1px solid #334155; border-radius: 0.5rem; padding: 1rem; min-height: 300px; }
  .api-playground-content .output .status { padding: 0.5rem; border-radius: 0.3rem; margin-bottom: 1rem; font-size: 0.85rem; }
  .api-playground-content .status-200 { background: #064e3b; color: #6ee7b7; border: 1px solid #10b981; }
  .api-playground-content .status-404 { background: #7c2d12; color: #fdba74; border: 1px solid #ea580c; }
  .api-playground-content .status-500 { background: #7f1d1d; color: #fca5a5; border: 1px solid #dc2626; }
  .api-playground-content .footer { margin-top: 3rem; color: #64748b; font-size: 0.85rem; border-top: 1px solid #334155; padding-top: 1.5rem; text-align: center; }
  @media (max-width: 768px) {
    .api-playground-content .endpoint-group { grid-template-columns: 1fr; }
  }
`;

const contentHtml = `
  <div class="container">
    <p style="color:#94a3b8;text-transform:uppercase;letter-spacing:.15em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI · API Playground</p>
    <h1>Try the API live</h1>
    <p class="lead">Click any endpoint on the left. The response appears on the right. Uses the live <code>csoai-mcp-monetization</code> API at <code>https://csoai.org</code> (running on the CSOAI sovereign substrate).</p>

    <h2>Quick start</h2>
    <ol style="margin:1rem 0 1.5rem 1.5rem">
      <li>Click an endpoint on the left</li>
      <li>View the response on the right</li>
      <li>Click <code>POST /purchase/tier</code> to make a real (mock) purchase</li>
      <li>Click <code>POST /webhook/test</code> to simulate a Stripe event</li>
      <li>Click <code>GET /customer/{your-email}</code> to see your purchases (after the reset)</li>
    </ol>

    <div class="endpoint-group">
      <div class="endpoint-list">
        <h3>Catalog</h3>
        <button onclick="callEndpoint('GET', '/api')"><span class="method method-get">GET</span>/api</button>
        <button onclick="callEndpoint('GET', '/servers?limit=5')"><span class="method method-get">GET</span>/servers</button>
        <button onclick="callEndpoint('GET', '/search?q=healthcare')"><span class="method method-get">GET</span>/search?q=healthcare</button>
        <button onclick="callEndpoint('GET', '/packs')"><span class="method method-get">GET</span>/packs</button>
        <button onclick="callEndpoint('GET', '/tiers')"><span class="method method-get">GET</span>/tiers</button>
        <button onclick="callEndpoint('GET', '/sectors')"><span class="method method-get">GET</span>/sectors</button>
        <button onclick="callEndpoint('GET', '/sectors/healthcare')"><span class="method method-get">GET</span>/sectors/healthcare</button>
        <button onclick="callEndpoint('GET', '/bundles')"><span class="method method-get">GET</span>/bundles</button>

        <h3>Purchase</h3>
        <button onclick="callEndpoint('POST', '/purchase/tier', {tier_id: 'pro', customer_email: 'playground@meok.ai'})"><span class="method method-post">POST</span>/purchase/tier</button>
        <button onclick="callEndpoint('POST', '/purchase/pack', {pack_id: 'pack_eu_ai_act', customer_email: 'playground@meok.ai'})"><span class="method method-post">POST</span>/purchase/pack</button>
        <button onclick="callEndpoint('POST', '/webhook/test', {event_type: 'checkout.session.completed', customer_email: 'playground@meok.ai', amount_gbp: 199, kind: 'tier', item_id: 'pro'})"><span class="method method-post">POST</span>/webhook/test</button>

        <h3>Discovery</h3>
        <button onclick="callEndpoint('GET', '/recommend?use_case=eu-ai-act-high-risk-finance')"><span class="method method-get">GET</span>/recommend</button>
        <button onclick="callEndpoint('GET', '/api/discover')"><span class="method method-get">GET</span>/api/discover</button>
        <button onclick="callEndpoint('GET', '/partner')"><span class="method method-get">GET</span>/partner</button>
        <button onclick="callEndpoint('GET', '/coupon?code=GRCWL30&item_type=tier&item_id=pro')"><span class="method method-get">GET</span>/coupon</button>

        <h3>Ops</h3>
        <button onclick="callEndpoint('GET', '/customer/playground@meok.ai')"><span class="method method-get">GET</span>/customer/{email}</button>
        <button onclick="callEndpoint('GET', '/revenue')"><span class="method method-get">GET</span>/revenue</button>
        <button onclick="callEndpoint('GET', '/analytics')"><span class="method method-get">GET</span>/analytics</button>
        <button onclick="callEndpoint('GET', '/healthz')"><span class="method method-get">GET</span>/healthz</button>
        <button onclick="callEndpoint('GET', '/readyz')"><span class="method method-get">GET</span>/readyz</button>
        <button onclick="callEndpoint('GET', '/metrics')"><span class="method method-get">GET</span>/metrics</button>
        <button onclick="callEndpoint('GET', '/admin')"><span class="method method-get">GET</span>/admin</button>
      </div>
      <div class="output">
        <h3>Response</h3>
        <div id="status" class="status status-200">Ready. Click an endpoint on the left.</div>
        <pre id="response">{
  "hint": "Click an endpoint on the left to make a real API call.",
  "endpoints": 26,
  "server": "csoai-mcp-monetization:3400",
  "version": "2.6.0-day11",
  "tip": "POST endpoints accept JSON bodies. GET endpoints use query strings."
}</pre>
      </div>
    </div>

    <h2>Notes</h2>
    <ul style="margin:1rem 0 1.5rem 1.5rem">
      <li>All calls are real — they hit the live <code>csoai-mcp-monetization</code> API on the sovereign substrate</li>
      <li>POST <code>/purchase/tier</code> with <code>tier_id: pro</code> creates a £199/mo subscription in mock mode</li>
      <li>POST <code>/webhook/test</code> simulates a Stripe event (creates a tier purchase in the DB)</li>
      <li>GET <code>/customer/{email}</code> looks up all purchases for that email (SQLite-aware)</li>
      <li>The playground resets every 30 min (the sovereign substrate's sigil bus cycles)</li>
    </ul>

    <div class="footer">© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · <a href="/api-docs">/api-docs</a></div>
  </div>
`;

const playgroundScript = `
  const BASE = "https://csoai.org";
  async function callEndpoint(method, path, body) {
    const statusEl = document.getElementById("status");
    const responseEl = document.getElementById("response");
    statusEl.textContent = method + " " + path + " ...";
    statusEl.className = "status status-200";
    try {
      const opts = { method };
      if (body && method === "POST") {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = JSON.stringify(body);
      }
      const url = BASE + path;
      const res = await fetch(url, opts);
      const text = await res.text();
      let formatted;
      try { formatted = JSON.stringify(JSON.parse(text), null, 2); }
      catch { formatted = text; }
      statusEl.textContent = method + " " + path + " → " + res.status + " " + res.statusText;
      if (res.status >= 500) statusEl.className = "status status-500";
      else if (res.status >= 400) statusEl.className = "status status-404";
      else statusEl.className = "status status-200";
      responseEl.textContent = formatted;
    } catch (e) {
      statusEl.textContent = method + " " + path + " → ERROR";
      statusEl.className = "status status-500";
      responseEl.textContent = e.toString();
    }
  }
`;

export default function ApiPlaygroundClient() {
  return (
    <div className="api-playground-content">
      <style>{scopedCss}</style>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      <script dangerouslySetInnerHTML={{ __html: playgroundScript }} />
    </div>
  );
}
