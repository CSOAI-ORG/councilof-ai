// Self-hosted SVG authority badge — shields-style, on-brand, no external dependency.
// Embed anywhere: <img src="https://defoneos.com/api/badge?label=MCP&message=compatible&color=2a9df4">
// Default = the verifiable DEFONEOS-SEAL mark (link it to /verify.html).
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

export default function handler(req, res) {
  const q = req.query || {};
  const label = String(q.label || 'DEFONEOS').slice(0, 40);
  const message = String(q.message || 'SEAL · verifiable').slice(0, 48);
  const color = String(q.color || 'c9a84c').replace(/[^0-9a-fA-F]/g, '').slice(0, 8) || 'c9a84c';
  const dark = String(q.dark || '1a1d26').replace(/[^0-9a-fA-F]/g, '').slice(0, 8) || '1a1d26';
  // light text on dark label, dark text on the (gold/light) message chip
  const msgText = /^(c9a84c|d9b676|ffd23b|d4a853|00e07a)/i.test(color) ? '1d1505' : 'ffffff';
  const lw = Math.round(label.length * 6.7) + 18;
  const mw = Math.round(message.length * 6.7) + 20;
  const w = lw + mw;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(label)}: ${esc(message)}">
<linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset="1" stop-opacity=".12"/></linearGradient>
<rect rx="4" width="${w}" height="20" fill="#${dark}"/>
<rect rx="4" x="${lw}" width="${mw}" height="20" fill="#${color}"/>
<rect rx="4" width="${w}" height="20" fill="url(#g)"/>
<g font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11" text-anchor="middle">
<text x="${(lw / 2).toFixed(0)}" y="14" fill="#fff">${esc(label)}</text>
<text x="${(lw + mw / 2).toFixed(0)}" y="14" fill="#${msgText}">${esc(message)}</text>
</g></svg>`;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).send(svg);
}
