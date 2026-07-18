/**
 * MEOK Trust Bar — drop-in monetization snippet
 *
 * Append to any HTML page:
 *   <script src="https://meok.ai/widgets/meok-trust-bar.js" defer></script>
 *
 * Renders a sticky bottom-of-page bar with:
 *   - "Built by MEOK AI Labs" trust signal
 *   - Sign up / Pro CTA → buy.stripe.com link
 *   - Cross-promo for governance MCP pack
 *
 * © 2026 MEOK AI Labs · MIT
 */

(function () {
  if (window.MEOK_TRUST_BAR_LOADED) return;
  window.MEOK_TRUST_BAR_LOADED = true;

  // Honor user dismissal via localStorage
  try {
    if (localStorage.getItem("meok-trust-bar-dismissed") === "1") return;
  } catch (e) {
    // localStorage might be blocked; continue
  }

  const css = `
    .meok-trust-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 2147483646;
      background: linear-gradient(90deg, #0D0B21 0%, #1A1145 100%);
      color: #E8E4F0;
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 -4px 20px rgba(0,0,0,.25);
      transform: translateY(100%);
      transition: transform .4s cubic-bezier(.16,1,.3,1);
      border-top: 1px solid rgba(212,168,67,.3);
    }
    .meok-trust-bar.show { transform: translateY(0); }
    .meok-trust-bar-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: space-between;
    }
    .meok-tb-text { flex: 1; min-width: 200px; line-height: 1.4; }
    .meok-tb-text strong { color: #D4A843; font-weight: 700; }
    .meok-tb-text a { color: #D4A843; text-decoration: none; }
    .meok-tb-text a:hover { text-decoration: underline; }
    .meok-tb-cta {
      display: inline-block;
      padding: 8px 16px;
      background: linear-gradient(135deg, #D4A843, #E8B76D);
      color: #0D0B21 !important;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 700;
      font-size: 13px;
      white-space: nowrap;
      transition: transform .15s;
    }
    .meok-tb-cta:hover { transform: scale(1.02); }
    .meok-tb-close {
      background: transparent;
      border: none;
      color: rgba(232,228,240,.6);
      font-size: 18px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
    }
    .meok-tb-close:hover { color: #fff; }
    @media (max-width: 600px) {
      .meok-trust-bar { padding: 10px 12px; font-size: 13px; }
      .meok-tb-text { font-size: 12px; }
      .meok-tb-cta { font-size: 12px; padding: 6px 12px; }
    }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const bar = document.createElement("div");
  bar.className = "meok-trust-bar";
  bar.setAttribute("role", "complementary");
  bar.setAttribute("aria-label", "MEOK AI Labs promotion");
  bar.innerHTML = `
    <div class="meok-trust-bar-inner">
      <div class="meok-tb-text">
        Built by <strong>MEOK AI Labs</strong> — 38 governance MCPs for EU AI Act, DORA, NIS2, CRA, GDPR. Free tier: 10 calls/day · <a href="https://meok.ai" target="_blank" rel="noopener">meok.ai</a>
      </div>
      <a class="meok-tb-cta" href="https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K" target="_blank" rel="noopener">Pro £79/mo →</a>
      <button class="meok-tb-close" aria-label="Dismiss bar" title="Dismiss">×</button>
    </div>
  `;
  document.body.appendChild(bar);

  // Animate in after 1.5s
  setTimeout(() => bar.classList.add("show"), 1500);

  // Dismiss handler
  bar.querySelector(".meok-tb-close").addEventListener("click", () => {
    bar.classList.remove("show");
    try {
      localStorage.setItem("meok-trust-bar-dismissed", "1");
    } catch (e) {}
    setTimeout(() => bar.remove(), 400);
  });
})();
