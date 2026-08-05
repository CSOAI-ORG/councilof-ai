// SPDX-License-Identifier: Apache-2.0
// /api/og — dynamic branded social card (1200×630 PNG). Pass ?title= &desc=.
//
// MIGRATED from api/og.tsx (Vercel @vercel/og Edge function) to a Cloudflare Pages Function.
// Vercel is billing-blocked (DEPLOYMENT_DISABLED / "Account is blocked") so the old handler
// never served — /api/og returned the SPA shell (200 text/html), a P0 the audit flagged.
// workers-og is the Workers-native port of @vercel/og: same satori engine, ImageResponse API,
// but runs on Cloudflare. Uses an HTML-string template (no JSX build config needed in Pages).
import { ImageResponse } from "workers-og";

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const rawTitle = (url.searchParams.get("title") || "CSOAI").slice(0, 90);
  const rawDesc = (url.searchParams.get("desc") ||
    "AI governance, cybersecurity & safety — measurement harnesses, signed to Layer 0").slice(0, 140);
  // escape for HTML-string template (workers-og parses HTML, so untrusted params must be escaped)
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const title = esc(rawTitle);
  const desc = esc(rawDesc);

  const html = `
    <div style="height:100%;width:100%;display:flex;flex-direction:column;justify-content:space-between;
                background:linear-gradient(135deg,#03110b 0%,#05261a 60%,#03110b 100%);padding:64px;font-family:sans-serif;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div style="width:44px;height:44px;border-radius:12px;background:#34d399;display:flex;align-items:center;
                    justify-content:center;color:#03110b;font-size:26px;font-weight:900;">◉</div>
        <div style="color:#8ff3c8;font-size:26px;font-weight:800;letter-spacing:2px;">CSOAI</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:18px;">
        <div style="color:#ecfdf5;font-size:62px;font-weight:900;line-height:1.05;max-width:1000px;display:flex;">${title}</div>
        <div style="color:#a7f3d0;font-size:30px;font-weight:500;max-width:980px;display:flex;">${desc}</div>
      </div>
      <div style="display:flex;align-items:center;gap:14px;color:#34d399;font-size:22px;font-weight:700;">
        <span>Ed25519 · Layer 0</span><span style="color:#065f46;">|</span>
        <span>measurement harnesses</span><span style="color:#065f46;">|</span><span>csoai.org</span>
      </div>
    </div>`;

  return new ImageResponse(html, { width: 1200, height: 630 });
};
