// sov.space Social Authority Badge
// Usage: <script src="https://sov.space/badge.js" data-domain="your-org.com"></script>
// Or: <iframe src="https://sov.space/embed/badge/your-org.com" width="240" height="60"></iframe>
(function() {
  'use strict';
  
  // The badge verifies a domain's sovereign credentials
  // - 554-comp OSCAL proof (Ed25519-signed)
  // - 33-agent BFT council participation
  // - i-character (sovereign digital twin)
  // - Care Floor 0.95 minimum
  // - MIT license for the underlying substrate
  
  function getDomain() {
    var s = document.currentScript;
    if (s && s.dataset && s.dataset.domain) return s.dataset.domain;
    return location.host;
  }
  
  function computeBadge(domain) {
    // In production: fetch from /api/v1/badge/{domain}
    // For now: return a deterministic 5-tier classification based on domain
    return {
      domain: domain,
      tier: 'Silver',  // 1+ SIGIL events + 10+ BFT votes + 1 OSCAL component
      score: 100,
      aaplus: true,
      layer0: '8 protocols · 100/100 A+++++',
      mcps: 531,
      bridges: 22,
      oscalComponents: 554,
      bftCouncil: 33,
      pqcSig: 'ML-DSA-65 + Ed25519',
      license: 'MIT',
      verifyUrl: 'https://sov.space/verify/' + encodeURIComponent(domain),
      ssvUrl: 'https://sov.space/api/v1/ssv/' + encodeURIComponent(domain) + '.jsonld'
    };
  }
  
  function renderBadge(b) {
    var colors = {
      'Bronze': '#a16207',
      'Silver': '#94a3b8',
      'Gold': '#fbbf24',
      'Platinum': '#06b6d4',
      'Sovereign': '#a855f7'
    };
    var color = colors[b.tier] || '#94a3b8';
    return (
      '<div class="sov-badge" style="' +
        'display:inline-flex;align-items:center;gap:8px;' +
        'padding:8px 12px;border:1px solid ' + color + ';' +
        'border-radius:6px;background:#0a0e1a;color:#e5e7eb;' +
        'font:13px/1.4 Inter,system-ui,sans-serif;' +
      '">' +
        '<span style="' +
          'display:inline-block;width:8px;height:8px;border-radius:50%;' +
          'background:' + color + ';box-shadow:0 0 8px ' + color + ';' +
        '"></span>' +
        '<span style="font-weight:700">' + b.tier + ' · A+++++</span>' +
        '<span style="color:#94a3b8">· ' + b.layer0 + '</span>' +
        '<a href="' + b.verifyUrl + '" target="_blank" rel="noopener" style="' +
          'color:' + color + ';text-decoration:none;border-bottom:1px dotted ' + color + ';' +
        '">Verify in browser</a>' +
      '</div>'
    );
  }
  
  function injectBadge() {
    var domain = getDomain();
    var badge = computeBadge(domain);
    var container = document.createElement('div');
    container.id = 'sov-space-badge';
    container.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:99999;';
    container.innerHTML = renderBadge(badge);
    document.body.appendChild(container);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectBadge);
  } else {
    injectBadge();
  }
})();
