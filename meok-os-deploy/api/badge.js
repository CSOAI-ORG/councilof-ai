// Embeddable Sovereign authority badge — any website/front-end drops this in:
//   <a href="https://meok.ai/verify"><img src="https://os.meok.ai/api/badge?label=Sovereign&message=Governed&entity=acme.ai"></a>
// Branded, cacheable SVG (shields-style). Links to the verify page for the signed attestation.
// NOTE: full per-badge Ed25519 signing is gated on the sovereign key infra; v1 is a branded
// trust-mark + verify link. The verify page is where the signed SIGIL attestation is checked.

const PRESETS = {
  governed:  { label: 'Sovereign', message: 'Governed',  color: '#c9a84c', glyph: '🛡' },
  verified:  { label: 'MEOK',      message: 'Verified',  color: '#5aa89a', glyph: '✓' },
  signed:    { label: 'SIGIL',     message: 'Signed',    color: '#a855f7', glyph: '✦' },
  care:      { label: 'Care',      message: 'Aligned',   color: '#06b6d4', glyph: '♥' },
  member:    { label: 'CSOAI',     message: 'Member',    color: '#c9a84c', glyph: '◆' },
};

function esc(s){ return String(s||'').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c])); }
// rough text width @ 11px semibold
const tw = s => Math.ceil(String(s).length * 6.6) + 14;

export default function handler(req, res) {
  const q = req.query || {};
  const preset = PRESETS[(q.style||'').toLowerCase()] || PRESETS.governed;
  const label   = esc((q.label   != null ? q.label   : preset.label).toString().slice(0,32));
  const message = esc((q.message != null ? q.message : preset.message).toString().slice(0,40));
  const entity  = q.entity ? esc(q.entity.toString().slice(0,40)) : '';
  const color   = /^#?[0-9a-fA-F]{6}$/.test(q.color||'') ? ('#'+String(q.color).replace('#','')) : preset.color;
  const glyph   = esc((q.glyph != null ? q.glyph : preset.glyph).toString().slice(0,2));
  const msg = entity ? `${message} · ${entity}` : message;

  const lw = tw(label) + 18;            // left (dark) segment incl. glyph room
  const rw = tw(msg);                   // right (colour) segment
  const h = 28, r = 6, W = lw + rw;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" role="img" aria-label="${label}: ${msg}">
<defs><linearGradient id="g" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-opacity=".10"/></linearGradient>
<clipPath id="c"><rect width="${W}" height="${h}" rx="${r}"/></clipPath></defs>
<g clip-path="url(#c)" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<rect width="${lw}" height="${h}" fill="#1a1410"/>
<rect x="${lw}" width="${rw}" height="${h}" fill="${color}"/>
<rect width="${W}" height="${h}" fill="url(#g)"/>
<text x="13" y="18" fill="${color}" font-weight="700">${glyph}</text>
<text x="30" y="18" fill="#f5f0e6" font-weight="700">${label}</text>
<text x="${lw+10}" y="18" fill="#1a1410" font-weight="700">${msg}</text>
</g></svg>`;

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800');
  res.setHeader('Access-Control-Allow-Origin', '*');   // embeddable cross-origin on any site
  return res.status(200).send(svg);
}
