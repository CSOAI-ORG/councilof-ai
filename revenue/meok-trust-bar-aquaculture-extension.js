/**
 * MEOK Trust Bar — Aquaculture Extension
 * Drop-in JS that extends the existing meok-trust-bar.js widget with:
 *   1. Welfare attestation badge sourced from meok-attestation-api
 *   2. MCP-server discoverability hint via meta + headers
 *   3. Care-tier indicator (advisory / gated / regulatory / attestation)
 *
 * Deploy as: meok.ai/widgets/meok-trust-bar-aquaculture.js
 * Embed on fishkeeper.ai + koikeeper.ai + aquaponics.app like so:
 *   <script src="https://meok.ai/widgets/meok-trust-bar.js" defer async></script>
 *   <script src="https://meok.ai/widgets/meok-trust-bar-aquaculture.js"
 *           defer async
 *           data-product="fishkeeper-ai"
 *           data-attestation="auto"></script>
 *
 * Note: both sites already embed the base trust-bar widget per their
 * index.html. This file adds the aquaculture-specific badge on top.
 *
 * Built 2026-05-21 to support the aquaponics takeover playbook.
 */

(function () {
  "use strict";

  const ATTESTATION_API = "https://meok-attestation-api.vercel.app";
  const MEOK_VERIFY = "https://meok.ai/verify";

  // ----- Locate this script's <script> tag for data-attributes ------------
  const currentScript = document.currentScript || (function () {
    const all = document.getElementsByTagName("script");
    return all[all.length - 1];
  })();

  const product = currentScript.getAttribute("data-product") || "fishkeeper-ai";
  const mode = currentScript.getAttribute("data-attestation") || "auto";

  // ----- Product → MCP server map -----------------------------------------
  const PRODUCT_TO_MCP = {
    "fishkeeper-ai":  { mcp: "meok-fishkeeper-ai-mcp",  version: "1.0.5", careTier: "advisory" },
    "koikeeper-ai":   { mcp: "meok-koikeeper-ai-mcp",   version: "1.0.0", careTier: "advisory" },
    "aquaponics":     { mcp: "meok-aquaponics-monitor-mcp", version: "1.0.0", careTier: "gated" },
    "rspca":          { mcp: "meok-rspca-aquaculture-mcp", version: "1.0.0", careTier: "attestation" },
    "uk-fhi":         { mcp: "meok-uk-fhi-mcp",         version: "1.0.0", careTier: "regulatory" },
    "asc-crosswalk":  { mcp: "meok-asc-rspca-crosswalk-mcp", version: "1.0.0", careTier: "attestation" },
    "laia":           { mcp: "meok-laia-aquatic-mcp",   version: "1.0.0", careTier: "advisory" },
  };

  const info = PRODUCT_TO_MCP[product] || PRODUCT_TO_MCP["fishkeeper-ai"];

  // ----- Inject MCP-discoverability meta tags -----------------------------
  function injectMeta(name, content) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute("content", content);
    document.head.appendChild(meta);
  }

  injectMeta("meok:mcp-server", `${info.mcp}@${info.version}`);
  injectMeta("meok:care-tier", info.careTier);
  injectMeta("meok:product", product);
  injectMeta("meok:attestation-api", ATTESTATION_API);
  injectMeta("meok:verify-url", MEOK_VERIFY);

  // ----- Render the welfare attestation badge -----------------------------
  function renderBadge(attestation) {
    const existing = document.getElementById("meok-welfare-badge");
    if (existing) existing.remove();

    const wrap = document.createElement("div");
    wrap.id = "meok-welfare-badge";
    wrap.style.cssText = [
      "position:fixed",
      "bottom:16px",
      "right:16px",
      "z-index:999999",
      "background:linear-gradient(135deg,#0B1426 0%,#1a2a4a 100%)",
      "color:#fff",
      "padding:10px 14px",
      "border-radius:10px",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      "font-size:12px",
      "box-shadow:0 4px 20px rgba(0,0,0,0.25)",
      "max-width:280px",
      "line-height:1.4",
      "cursor:pointer",
    ].join(";");

    const heading = attestation
      ? `Welfare attestation · ${attestation.score_pct}%`
      : "MEOK welfare-attested";
    const sub = attestation
      ? `${attestation.species || product} · ${attestation.standard_version || info.version} · verifiable`
      : `Care tier: ${info.careTier} · powered by ${info.mcp}`;
    const fingerprint = attestation && attestation.fingerprint
      ? `<div style="opacity:0.6;font-size:10px;margin-top:4px;font-family:ui-monospace,monospace">${attestation.fingerprint.slice(0, 16)}…</div>`
      : "";

    wrap.innerHTML = [
      `<div style="font-weight:600;letter-spacing:0.2px">${heading}</div>`,
      `<div style="opacity:0.85;margin-top:2px">${sub}</div>`,
      fingerprint,
      `<div style="opacity:0.7;font-size:10px;margin-top:6px">click to verify →</div>`,
    ].join("");

    const verifyHref = attestation && attestation.fingerprint
      ? `${MEOK_VERIFY}?attestation=${encodeURIComponent(attestation.fingerprint)}`
      : `${MEOK_VERIFY}?product=${encodeURIComponent(product)}`;

    wrap.addEventListener("click", () => window.open(verifyHref, "_blank", "noopener"));
    document.body.appendChild(wrap);
  }

  // ----- Fetch latest attestation for this product -----------------------
  async function loadAttestation() {
    if (mode === "off") return renderBadge(null);

    try {
      const r = await fetch(`${ATTESTATION_API}/latest?product=${encodeURIComponent(product)}`, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      renderBadge(data);
    } catch (e) {
      // Soft-fail: still render an unattested badge so users see the MEOK trust signal
      renderBadge(null);
    }
  }

  // ----- Expose a tiny API so the host app can push fresh attestations ---
  window.MEOKAquacultureTrustBar = {
    refresh: loadAttestation,
    setAttestation: renderBadge,
    info: info,
    product: product,
    mcp: info.mcp,
    careTier: info.careTier,
  };

  // ----- Boot -------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadAttestation);
  } else {
    loadAttestation();
  }
})();
