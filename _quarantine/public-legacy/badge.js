/**
 * CSOAI Certification Badge Embed v1.0
 *
 * Usage: place this on your site once your free CSOAI Certification is issued:
 *   <script src="https://csoai.org/badge.js" data-slug="your-company-slug" defer></script>
 *
 * Optional attributes:
 *   data-slug="your-slug"          (required — your registered cert slug)
 *   data-variant="full|compact"    (default: full)
 *   data-theme="light|dark"        (default: light)
 *   data-tier="free|pro|pro-plus|enterprise"  (default: free)
 *
 * The badge renders inline at the script's location and links to your public
 * verify URL at proofof.ai/verify/<slug>. Methodology cite at csoai.org/methodology.
 *
 * Operated by CSOAI LTD (UK Companies House 16939677). MIT-licensed.
 */
(function () {
  'use strict';

  // Find the current script tag (the one being executed)
  var scripts = document.getElementsByTagName('script');
  var self = null;
  for (var i = 0; i < scripts.length; i++) {
    var src = scripts[i].src || '';
    if (src.indexOf('csoai.org/badge.js') !== -1) {
      self = scripts[i];
    }
  }
  if (!self) {
    // Fallback for inline embeds — use the last script tag
    self = scripts[scripts.length - 1];
  }

  var slug = (self.getAttribute('data-slug') || '').trim();
  var variant = (self.getAttribute('data-variant') || 'full').trim();
  var theme = (self.getAttribute('data-theme') || 'light').trim();
  var tier = (self.getAttribute('data-tier') || 'free').trim();

  if (!slug) {
    console.warn('[CSOAI Badge] data-slug attribute is required.');
    return;
  }

  var sanitisedSlug = slug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!sanitisedSlug) {
    console.warn('[CSOAI Badge] data-slug must contain alphanumeric characters.');
    return;
  }

  var BRAND_GREEN = '#0a8a3f';
  var BRAND_GOLD = '#c9a84c';
  var BG_LIGHT = '#ffffff';
  var BG_DARK = '#0f172a';
  var TEXT_LIGHT = '#0f172a';
  var TEXT_DARK = '#f5f5f5';
  var BORDER_LIGHT = '#e6e8ec';
  var BORDER_DARK = '#334155';

  var bg = theme === 'dark' ? BG_DARK : BG_LIGHT;
  var text = theme === 'dark' ? TEXT_DARK : TEXT_LIGHT;
  var border = theme === 'dark' ? BORDER_DARK : BORDER_LIGHT;

  var tierLabels = {
    free: 'Free Certified',
    pro: 'Pro Certified',
    'pro-plus': 'Pro+ Compliance Certified',
    enterprise: 'Enterprise Certified'
  };
  var tierLabel = tierLabels[tier] || 'Certified';

  var verifyUrl = 'https://proofof.ai/verify/' + sanitisedSlug;
  var methodologyUrl = 'https://csoai.org/methodology';
  var registryUrl = 'https://csoai.org/certified/' + sanitisedSlug;

  var container = document.createElement('div');
  container.className = 'csoai-badge';
  container.setAttribute('role', 'group');
  container.setAttribute('aria-label', 'CSOAI Certification Badge');

  if (variant === 'compact') {
    container.innerHTML =
      '<a href="' + verifyUrl + '" target="_blank" rel="noopener" style="' +
        'display:inline-flex;align-items:center;gap:.4rem;' +
        'padding:.35rem .65rem;background:' + bg + ';color:' + text + ';' +
        'border:1px solid ' + border + ';border-radius:.35rem;' +
        'text-decoration:none;font:600 .75rem/1 system-ui,sans-serif;' +
        'box-shadow:0 1px 2px rgba(0,0,0,.04);">' +
      '<span aria-hidden="true" style="font-size:.85rem;color:' + BRAND_GREEN + ';">✓</span>' +
      '<span>CSOAI ' + tierLabel + '</span>' +
      '</a>';
  } else {
    container.innerHTML =
      '<a href="' + verifyUrl + '" target="_blank" rel="noopener" style="' +
        'display:inline-flex;align-items:center;gap:.65rem;' +
        'padding:.65rem 1rem;background:' + bg + ';color:' + text + ';' +
        'border:1px solid ' + border + ';border-left:4px solid ' + BRAND_GREEN + ';' +
        'border-radius:.45rem;text-decoration:none;' +
        'font:400 .82rem/1.3 system-ui,sans-serif;' +
        'box-shadow:0 1px 3px rgba(0,0,0,.06);max-width:340px;">' +
      '<span aria-hidden="true" style="font-size:1.4rem;color:' + BRAND_GREEN + ';">✓</span>' +
      '<span style="display:flex;flex-direction:column;gap:.1rem;">' +
        '<span style="font-weight:700;color:' + text + ';">CSOAI ' + tierLabel + '</span>' +
        '<span style="font-size:.7rem;color:#6b7280;letter-spacing:.04em;">Verified at proofof.ai · CSOAI LTD UK 16939677</span>' +
      '</span>' +
      '</a>' +
      '<div style="font-size:.65rem;color:#9ca3af;margin-top:.3rem;line-height:1.4;">' +
        '<a href="' + verifyUrl + '" target="_blank" rel="noopener" style="color:' + BRAND_GREEN + ';text-decoration:none;">Verify</a> · ' +
        '<a href="' + methodologyUrl + '" target="_blank" rel="noopener" style="color:' + BRAND_GREEN + ';text-decoration:none;">Methodology</a> · ' +
        '<a href="' + registryUrl + '" target="_blank" rel="noopener" style="color:' + BRAND_GREEN + ';text-decoration:none;">Registry</a>' +
      '</div>';
  }

  // Replace the script tag with the badge (drop-in placement)
  if (self.parentNode) {
    self.parentNode.insertBefore(container, self);
  } else {
    document.body.appendChild(container);
  }
})();
