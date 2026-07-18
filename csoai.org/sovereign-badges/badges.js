// SOV3 Sovereign Badges — inject onto every page. CC0 + MIT.
(function() {
  const badges = [
    '<span style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#10b981);color:#000;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">🐉 Sovereign</span>',
    '<span style="display:inline-block;background:#000;color:#fbbf24;border:1px solid #fbbf24;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">MIT</span>',
    '<span style="display:inline-block;background:#000;color:#fff;border:1px solid #fff;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">CC0</span>',
    '<span style="display:inline-block;background:#3F7E44;color:#fff;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">OSI</span>',
    '<span style="display:inline-block;background:#0066CC;color:#fff;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">🇪🇺 GDPR</span>',
    '<span style="display:inline-block;background:#fbbf24;color:#000;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">Article 50</span>',
    '<span style="display:inline-block;background:#000;color:#fbbf24;border:1px solid #fbbf24;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">BFT 12-around-1</span>',
    '<span style="display:inline-block;background:#000;color:#10b981;border:1px solid #10b981;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">SIGIL</span>',
    '<span style="display:inline-block;background:linear-gradient(135deg,#10b981,#3b82f6);color:#fff;padding:0.25rem 0.5rem;border-radius:4px;font-family:monospace;font-size:0.8rem;font-weight:bold;margin:0.2rem;">PQC</span>',
  ];
  if (document.body) {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;bottom:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.95);padding:0.5rem 1rem;border-radius:8px;z-index:999;border:1px solid #fbbf24;display:flex;flex-wrap:wrap;justify-content:center;';
    bar.innerHTML = badges.join('') + '<span style="color:#fbbf24;font-family:monospace;font-size:0.8rem;font-weight:bold;margin-left:1rem;">CSOAI Ltd (UK 16939677) · Sovereign Composite 7.305</span>';
    document.body.appendChild(bar);
  }
})();
