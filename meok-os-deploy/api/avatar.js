import council from './_data/council.json' with { type: 'json' };

// Public port of the backend _avatar_svg: translucent egg + golden core + glyph.
// Design mirrors meok-character-emergence.html (viewBox 200×300).
const ARCH_COLOR = { Sovereign: '#c9a84c', Guardian: '#5aa89a', Scout: '#3b82f6', Strategist: '#a855f7', Creator: '#d47a5a', Companion: '#06b6d4', Sage: '#d4c45a', Caretaker: '#06b6d4', Coordinator: '#c9a84c' };
const ARCH_EMOJI = { Sovereign: '👑', Guardian: '🛡️', Scout: '🧭', Strategist: '♟️', Creator: '✦', Companion: '💗', Sage: '🔮', Caretaker: '💗', Coordinator: '👑' };

function esc(s) { return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])); }

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');   // avatar rides on any sovereign surface (site/dock/overlay)
  const q = req.query || {};
  const qid = q.queen_id || q.queenId;
  let color, emoji, name = (q.name || '').toString().slice(0, 22);
  if (qid && council.queens && council.queens[qid]) {
    const Q = council.queens[qid];
    color = Q.color; emoji = Q.emoji; name = name || Q.name;
  } else {
    const arch = (q.archetype || 'Companion').toString();
    color = ARCH_COLOR[arch] || '#d4c45a';
    emoji = ARCH_EMOJI[arch] || '✨';
    name = name || arch;
  }
  const id = (qid || name || 'i').replace(/[^a-z0-9]/gi, '').slice(0, 16) || 'i';
  const size = Math.min(Math.max(parseInt(q.size, 10) || 256, 64), 1024);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" width="${size}" height="${Math.round(size * 1.5)}" role="img" aria-label="${esc(name)} sovereign avatar">
<defs>
<radialGradient id="halo-${id}" cx="50%" cy="55%" r="55%"><stop offset="0%" stop-color="#ffd700" stop-opacity="0.5"/><stop offset="60%" stop-color="#ffd700" stop-opacity="0.1"/><stop offset="100%" stop-color="#ffd700" stop-opacity="0"/></radialGradient>
<radialGradient id="shell-${id}" cx="40%" cy="35%" r="65%"><stop offset="0%" stop-color="${color}" stop-opacity="0.92"/><stop offset="55%" stop-color="${color}" stop-opacity="0.5"/><stop offset="100%" stop-color="${color}" stop-opacity="0.16"/></radialGradient>
<radialGradient id="core-${id}" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff7d6" stop-opacity="0.95"/><stop offset="45%" stop-color="#ffd700" stop-opacity="0.6"/><stop offset="100%" stop-color="#ffd700" stop-opacity="0"/></radialGradient>
<radialGradient id="hl-${id}" cx="35%" cy="28%" r="28%"><stop offset="0%" stop-color="#fff" stop-opacity="0.6"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<ellipse cx="100" cy="165" rx="95" ry="125" fill="url(#halo-${id})"/>
<ellipse cx="100" cy="165" rx="78" ry="110" fill="url(#shell-${id})" stroke="${color}" stroke-opacity="0.5" stroke-width="1.5"/>
<ellipse cx="100" cy="165" rx="46" ry="60" fill="url(#core-${id})"/>
<ellipse cx="100" cy="165" rx="78" ry="110" fill="url(#hl-${id})"/>
<text x="100" y="188" font-size="64" text-anchor="middle">${esc(emoji)}</text>
<text x="100" y="40" font-size="20" font-weight="700" fill="#c9a84c" text-anchor="middle" font-family="JetBrains Mono, monospace">M</text>
<text x="100" y="294" font-size="13" fill="#c9a84c" text-anchor="middle" font-family="Space Grotesk, sans-serif">${esc(name)}</text>
</svg>`;
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(svg);
}
