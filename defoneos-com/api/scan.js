// DEFONEOS Gods-Eye · external self-scan (honest baseline). Fetches the caller's OWN domain server-side and
// inspects what a browser/serverless legitimately can: HTTPS/redirect, security headers, cookie flags, info
// disclosure, security.txt. NO intrusive scanning (no port-scan, no exploit) — that runs on the self-host
// appliance (nmap/nuclei/ZAP/…). Every finding is real; nothing is fabricated.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  let target = (body && body.url) || (req.query && req.query.url) || '';
  target = String(target).trim();
  if (!target) return res.status(200).json({ ok: false, error: 'pass {url:"example.com"}' });
  if (!/^https?:\/\//i.test(target)) target = 'https://' + target;
  let host; try { host = new URL(target).hostname; } catch { return res.status(200).json({ ok: false, error: 'invalid url' }); }

  const findings = [];
  const add = (sev, title, detail, fix) => findings.push({ sev, title, detail, fix });
  let httpsOk = false, resp = null, elapsed = 0;
  try {
    const t0 = Date.now();
    resp = await fetch(target, { redirect: 'follow', signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'DEFONEOS-GodsEye/1.0 (+security self-scan)' } });
    elapsed = Date.now() - t0;
    httpsOk = resp.url.startsWith('https://');
  } catch (e) {
    return res.status(200).json({ ok: false, host, error: 'could not reach ' + host + ' (' + String(e.message || e) + ')', findings: [] });
  }
  const h = (n) => resp.headers.get(n) || '';
  const finalHttps = resp.url.startsWith('https://');

  // ── TLS / transport ──
  if (!finalHttps) add('high', 'No HTTPS', 'The site served over plain HTTP after redirects (' + resp.url + ').', 'Force HTTPS and redirect all HTTP → HTTPS.');
  const hsts = h('strict-transport-security');
  if (finalHttps && !hsts) add('high', 'Missing HSTS', 'No Strict-Transport-Security header — downgrade/SSL-strip attacks possible.', 'Add: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
  else if (hsts && !/max-age=\d{7,}/.test(hsts)) add('low', 'Weak HSTS max-age', 'HSTS present but max-age is short: ' + hsts, 'Use max-age ≥ 31536000 (1 year).');

  // ── core security headers ──
  const csp = h('content-security-policy');
  if (!csp) add('high', 'No Content-Security-Policy', 'No CSP — the strongest defence against XSS/clickjacking/data-injection is absent.', "Add a Content-Security-Policy (start report-only, e.g. default-src 'self').");
  const xfo = h('x-frame-options'); const frameAnc = /frame-ancestors/i.test(csp);
  if (!xfo && !frameAnc) add('med', 'Clickjacking exposure', 'No X-Frame-Options and no CSP frame-ancestors — page can be framed.', "Add X-Frame-Options: DENY (or CSP frame-ancestors 'none').");
  if (!h('x-content-type-options')) add('med', 'MIME-sniffing enabled', 'Missing X-Content-Type-Options: nosniff.', 'Add X-Content-Type-Options: nosniff');
  if (!h('referrer-policy')) add('low', 'No Referrer-Policy', 'Referrer may leak to third parties.', 'Add Referrer-Policy: strict-origin-when-cross-origin');
  if (!h('permissions-policy')) add('low', 'No Permissions-Policy', 'Browser features (camera/mic/geolocation) not restricted.', 'Add a Permissions-Policy limiting unused features.');

  // ── info disclosure ──
  const server = h('server'), xpb = h('x-powered-by');
  if (xpb) add('low', 'Tech disclosure (X-Powered-By)', 'Header reveals stack: ' + xpb, 'Remove X-Powered-By.');
  if (/\d/.test(server) && server.length > 3) add('low', 'Server version disclosed', 'Server header reveals version: ' + server, 'Suppress version in the Server header.');

  // ── cookies ──
  const sc = resp.headers.get('set-cookie') || '';
  if (sc) {
    if (!/httponly/i.test(sc)) add('med', 'Cookie without HttpOnly', 'A Set-Cookie lacks HttpOnly (readable by JS → XSS token theft).', 'Add HttpOnly to session cookies.');
    if (!/secure/i.test(sc)) add('med', 'Cookie without Secure', 'A Set-Cookie lacks Secure (sent over HTTP).', 'Add Secure to all cookies.');
    if (!/samesite/i.test(sc)) add('low', 'Cookie without SameSite', 'No SameSite attribute (CSRF exposure).', 'Add SameSite=Lax or Strict.');
  }

  // ── security.txt ──
  let hasSecTxt = false;
  try { const st = await fetch('https://' + host + '/.well-known/security.txt', { signal: AbortSignal.timeout(6000) }); hasSecTxt = st.ok; } catch {}
  if (!hasSecTxt) add('low', 'No security.txt', 'No /.well-known/security.txt — researchers have no disclosure channel.', 'Publish /.well-known/security.txt (RFC 9116).');

  const weight = { high: 25, med: 10, low: 3 };
  const penalty = findings.reduce((s, f) => s + (weight[f.sev] || 0), 0);
  const score = Math.max(0, 100 - penalty);
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'F';

  return res.status(200).json({
    ok: true, host, finalUrl: resp.url, status: resp.status, latency_ms: elapsed,
    score, grade,
    counts: { high: findings.filter(f => f.sev === 'high').length, med: findings.filter(f => f.sev === 'med').length, low: findings.filter(f => f.sev === 'low').length },
    findings,
    scope: 'External non-intrusive baseline (headers · TLS · cookies · disclosure). Deep scans (ports, CVEs, DAST, SAST, SBOM, cloud, AI-red-team) run on the self-host Gods-Eye appliance.',
    ts: new Date().toISOString()
  });
}
