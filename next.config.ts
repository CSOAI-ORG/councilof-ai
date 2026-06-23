import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: true,
  poweredByHeader: false,
  
  webpack: (config: any, { isServer }: any) => {
    const webpack = require('webpack');
    config.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /p2p/ }));
    if (!isServer) {
      config.resolve.fallback = config.resolve.fallback || {};
      config.resolve.fallback['@libp2p/noise'] = false;
      config.resolve.fallback['@libp2p/mplex'] = false;
      config.resolve.fallback['@libp2p/webrtc'] = false;
      config.resolve.fallback['@libp2p/websockets'] = false;
      config.resolve.fallback['libp2p'] = false;
      config.resolve.fallback['it-length-prefixed'] = false;
      config.resolve.fallback['it-pipe'] = false;
      config.resolve.fallback['uint8arrays'] = false;
      config.resolve.fallback['worker_threads'] = false;
      config.resolve.fallback['child_process'] = false;
      config.resolve.fallback['tls'] = false;
      config.resolve.fallback['net'] = false;
      config.resolve.fallback['stream'] = false;
      config.resolve.fallback['crypto'] = false;
      config.resolve.fallback['os'] = false;
      config.resolve.fallback['path'] = false;
      config.resolve.fallback['fs'] = false;
      config.resolve.fallback['onnxruntime-node'] = false;
    }
    return config;
  },
  async redirects() {
    return [
      // Audit fixes: legacy/broken internal links → real pages
      { source: "/sectors/finance", destination: "/industries/finance", permanent: true },
      { source: "/docs", destination: "/api-docs", permanent: true },
      { source: "/docs/:path*", destination: "/api-docs", permanent: true },
      { source: "/integrations/:path*", destination: "/mcp", permanent: true },
      { source: "/tutorials/:path*", destination: "/guides", permanent: true },
      { source: "/whitepapers/:path*", destination: "/resources", permanent: true },
      { source: "/certification/:path*", destination: "/certification", permanent: true },
      // App-route duplicates that exist as static .html files
      { source: "/article-50-kit.html", destination: "/article-50-kit", permanent: true },
      { source: "/mcp-packs.html", destination: "/mcp-packs", permanent: true },
      { source: "/mcp-servers.html", destination: "/mcp-servers", permanent: true },
      { source: "/verify.html", destination: "/verify", permanent: true },
      { source: "/council.html", destination: "/council", permanent: true },
      { source: "/home.html", destination: "/", permanent: true },
      { source: "/about.html", destination: "/about", permanent: true },
      { source: "/blog.html", destination: "/blog", permanent: true },
      { source: "/status.html", destination: "/status", permanent: true },
      { source: "/glossary.html", destination: "/glossary", permanent: true },
      { source: "/article-50-explained.html", destination: "/article-50-explained", permanent: true },
      { source: "/framework-crosswalk.html", destination: "/framework-crosswalk", permanent: true },
      { source: "/high-risk-classifier.html", destination: "/high-risk-classifier", permanent: true },
      { source: "/api-docs.html", destination: "/api-docs", permanent: true },
      { source: "/cookies.html", destination: "/cookies", permanent: true },
      { source: "/certification.html", destination: "/certification", permanent: true },
      { source: "/enterprise.html", destination: "/enterprise", permanent: true },
      { source: "/eu-ai-act.html", destination: "/eu-ai-act", permanent: true },
      { source: "/advisory.html", destination: "/advisory", permanent: true },
      { source: "/audit.html", destination: "/audit", permanent: true },
      { source: "/auditor.html", destination: "/auditor", permanent: true },
      { source: "/charter.html", destination: "/charter", permanent: true },
      { source: "/comply.html", destination: "/certification", permanent: true },
      { source: "/countdown.html", destination: "/countdown", permanent: true },
      { source: "/comply", destination: "/certification", permanent: true },
      { source: "/finance.html", destination: "/finance", permanent: true },
      { source: "/legacy.html", destination: "/legacy", permanent: true },
      { source: "/governance.html", destination: "/governance", permanent: true },
      { source: "/mcp-infrastructure.html", destination: "/mcp-infrastructure", permanent: true },
      { source: "/mcp-distribution.html", destination: "/mcp-distribution", permanent: true },
      { source: "/layer0.html", destination: "/layer0", permanent: true },
      { source: "/index.html.bak", destination: "/", permanent: true },
      { source: "/faq.html", destination: "/faq", permanent: true },
      { source: "/guides.html", destination: "/guides", permanent: true },
      { source: "/trust.html", destination: "/trust", permanent: true },
      // Newly-rewritten standalone legacy pages
      { source: "/api.html", destination: "/api-docs", permanent: true },
      { source: "/api", destination: "/api-docs", permanent: true },
      { source: "/partner.html", destination: "/partner", permanent: true },
      { source: "/security.html", destination: "/security", permanent: true },
      { source: "/identity.html", destination: "/identity", permanent: true },
      { source: "/checkout.html", destination: "/checkout", permanent: true },
      // Guide pages
      { source: "/guide-eu-ai-act.html", destination: "/guide-eu-ai-act", permanent: true },
      { source: "/guide-casa-certification.html", destination: "/guide-casa-certification", permanent: true },
      { source: "/guide-cmmc-ai.html", destination: "/guide-cmmc-ai", permanent: true },
      { source: "/guide-framework-selection.html", destination: "/guide-framework-selection", permanent: true },
      { source: "/guide-risk-register.html", destination: "/guide-risk-register", permanent: true },
      { source: "/guide-safety-testing.html", destination: "/guide-safety-testing", permanent: true },
      { source: "/guide-audit-checklist.html", destination: "/guide-audit-checklist", permanent: true },
      { source: "/guides/eu-ai-act", destination: "/guide-eu-ai-act", permanent: true },
      // Pricing consolidation
      { source: "/certify", destination: "/pricing", permanent: true },
      { source: "/certify.html", destination: "/pricing", permanent: true },
      // Stale / superseded pages
      { source: "/crosswalk", destination: "/framework-crosswalk", permanent: true },
      { source: "/crosswalk.html", destination: "/framework-crosswalk", permanent: true },
      { source: "/crosswalks", destination: "/framework-crosswalk", permanent: true },
      { source: "/crosswalks.html", destination: "/framework-crosswalk", permanent: true },
      { source: "/dome", destination: "/council/dome", permanent: true },
      { source: "/dome.html", destination: "/council/dome", permanent: true },
      { source: "/ecosystem", destination: "/", permanent: true },
      { source: "/ecosystem.html", destination: "/", permanent: true },
      { source: "/map", destination: "/council/maps", permanent: true },
      { source: "/map.html", destination: "/council/maps", permanent: true },
      { source: "/training", destination: "/", permanent: true },
      { source: "/training.html", destination: "/", permanent: true },
      { source: "/dashboard", destination: "https://app.csoai.org", permanent: false },
      { source: "/dashboard.html", destination: "https://app.csoai.org", permanent: false },
      { source: "/open-source", destination: "https://github.com/CSOAI-ORG", permanent: false },
      { source: "/open-source.html", destination: "https://github.com/CSOAI-ORG", permanent: false },
      { source: "/packs", destination: "/mcp-packs", permanent: true },
      { source: "/packs.html", destination: "/mcp-packs", permanent: true },
      // Industries index cleanup
      { source: "/industries", destination: "/industries/home", permanent: true },
      { source: "/industries/", destination: "/industries/home", permanent: true },
      // Frameworks index cleanup
      { source: "/frameworks", destination: "/frameworks/home", permanent: true },
      { source: "/frameworks/", destination: "/frameworks/home", permanent: true },
      // Dynamic directory .html cleanups
      { source: "/industries/:slug.html", destination: "/industries/:slug", permanent: true },
      { source: "/sectors/:slug.html", destination: "/sectors/:slug", permanent: true },
      { source: "/frameworks/:slug.html", destination: "/frameworks/:slug", permanent: true },
      { source: "/blog-:slug.html", destination: "/blog/:slug", permanent: true },
      // A2A catalog cleanup
      { source: "/a2a/home.html", destination: "/a2a", permanent: true },
      { source: "/a2a/", destination: "/a2a", permanent: true },
      // Orphaned static HTML files that duplicate App Router routes
      { source: "/terms.html", destination: "/terms", permanent: true },
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/success.html", destination: "/checkout/success", permanent: true },
      { source: "/sigil", destination: "/verify", permanent: true },
      { source: "/sigil.html", destination: "/verify", permanent: true },
      { source: "/prosperity", destination: "/", permanent: true },
      { source: "/prosperity.html", destination: "/", permanent: true },
      { source: "/sov-town-3d", destination: "/town/3d", permanent: true },
      { source: "/sov-town-3d/index.html", destination: "/town/3d", permanent: true },
      // Orphaned /industry-* files that duplicate /industries/* routes
      { source: "/industry-healthcare.html", destination: "/industries/healthcare", permanent: true },
      { source: "/industry-mining.html", destination: "/industries/mining", permanent: true },
      { source: "/industry-cybersecurity.html", destination: "/industries/cybersecurity", permanent: true },
      { source: "/industry-education.html", destination: "/industries/education", permanent: true },
      { source: "/industry-telecoms.html", destination: "/industries/telecoms", permanent: true },
      { source: "/industry-government.html", destination: "/industries/government", permanent: true },
      { source: "/industry-energy.html", destination: "/industries/energy", permanent: true },
      { source: "/industry-logistics.html", destination: "/industries/logistics", permanent: true },
      // Orphaned /industry-* files without exact /industries/* match
      { source: "/industry-maritime.html", destination: "/industries/transportation", permanent: true },
      { source: "/industry-aviation.html", destination: "/industries/transportation", permanent: true },
      { source: "/industry-banking.html", destination: "/industries/finance", permanent: true },
      { source: "/industry-pharma.html", destination: "/industries/healthcare", permanent: true },
      // Other orphaned static files now converted or redirected
      { source: "/api/playground.html", destination: "/api-playground", permanent: true },
      { source: "/.well-known/casa-cert-dashboard.html", destination: "/casa-cert-dashboard", permanent: true },
      // Clean-URL (no .html) variants of the legacy static apex, for the csoai.org repoint
      { source: "/blog-:slug", destination: "/blog/:slug", permanent: true },
      { source: "/index", destination: "/", permanent: true },
      { source: "/success", destination: "/checkout/success", permanent: true },
    ];
  },
    async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com https://proofof-site.vercel.app https://meok-attestation-api.vercel.app https://api.csoai.org; frame-src https://js.stripe.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;