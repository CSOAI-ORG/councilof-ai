import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API Documentation",
  description:
    "Developer documentation for the csoai-mcp-monetization API. 26 endpoints, OpenAPI 3.1.0 spec, all code examples in Python, TypeScript, and curl.",
  alternates: {
    canonical: "/api-docs",
  },
  openGraph: {
    title: "API Documentation — CSOAI",
    description:
      "Developer documentation for the csoai-mcp-monetization API. 26 endpoints, OpenAPI 3.1.0 spec.",
    url: "/api-docs",
    siteName: "CSOAI",
    type: "article",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": "https://csoai.org/api-docs#webpage",
      url: "https://csoai.org/api-docs",
      name: "API Documentation — CSOAI",
      isPartOf: { "@id": "https://csoai.org/#website" },
      description:
        "Developer documentation for the csoai-mcp-monetization API. 26 endpoints, OpenAPI 3.1.0 spec.",
    },
    {
      "@type": "TechArticle",
      "@id": "https://csoai.org/api-docs#article",
      headline: "csoai-mcp-monetization API Documentation",
      author: { "@id": "https://csoai.org/#org" },
      publisher: { "@id": "https://csoai.org/#org" },
      url: "https://csoai.org/api-docs",
      about: "API reference for the CSOAI monetization layer",
    },
  ],
};

const toc = [
  { id: "quickstart", label: "Quickstart" },
  { id: "endpoints", label: "Endpoints" },
  { id: "auth", label: "Auth" },
  { id: "errors", label: "Errors" },
  { id: "webhooks", label: "Webhooks" },
];

const endpoints: Array<{
  section: string;
  items: Array<{ method: "GET" | "POST"; path: string; desc: React.ReactNode }>;
}> = [
  {
    section: "Catalog",
    items: [
      { method: "GET", path: "/api", desc: "Service info (version, server/tier/pack/sector counts)" },
      { method: "GET", path: "/servers", desc: "List 271 published MCP servers. Params: limit, sector, tier, q" },
      { method: "GET", path: "/search", desc: "Full-text search across servers. Params: q, tier, sector, limit" },
      { method: "GET", path: "/packs", desc: "3 CSOAI packs (£499, £999, £1,499/yr)" },
      { method: "GET", path: "/tiers", desc: "8 canonical CSOAI tiers (£9 → £4,950)" },
      { method: "GET", path: "/sectors", desc: "12 industry sectors indexed" },
      { method: "GET", path: "/sectors/{name}", desc: "Per-sector server list. Names: finance, healthcare, government, legal, media, energy, education, manufacturing, retail, transportation, insurance, general" },
      { method: "GET", path: "/bundles", desc: "4 subscription bundles (£19, £49, £99, £299)" },
    ],
  },
  {
    section: "Purchasing",
    items: [
      { method: "POST", path: "/subscribe", desc: "Create a subscription. Body: {\"bundle_id\": \"professional\"}" },
      { method: "POST", path: "/purchase/pack", desc: "Buy a pack. Body: {\"pack_id\": \"pack_eu_ai_act\", \"customer_email\": \"you@yourco.com\"}" },
      { method: "POST", path: "/purchase/tier", desc: "Buy a tier. Body: {\"tier_id\": \"pro\", \"customer_email\": \"you@yourco.com\"}" },
      { method: "POST", path: "/purchase/tier (with coupon)", desc: "Add ?code=GRCWL30 for 30% off (white-label partners)" },
    ],
  },
  {
    section: "Webhooks (Stripe)",
    items: [
      { method: "POST", path: "/webhook/stripe", desc: "Stripe webhook receiver. Activates when STRIPE_WEBHOOK_SECRET env var is set. Listens for: checkout.session.completed, customer.subscription.created, invoice.paid, payment_intent.succeeded" },
      { method: "POST", path: "/webhook/test", desc: "Manual webhook simulator for Stripe dashboard testing. Params: event_type, customer_email, amount_gbp, kind, item_id" },
    ],
  },
  {
    section: "Reseller program",
    items: [
      { method: "GET", path: "/partner", desc: "List 3 white-label reseller partners (PARTNERLABS25, GRCWL30, EMPIRE20)" },
      { method: "GET", path: "/partner/{partner_id}", desc: "Get specific partner details" },
      { method: "GET", path: "/coupon", desc: "Validate a coupon code. Params: code, item_type, item_id. Returns discounted price." },
    ],
  },
  {
    section: "Discovery + recommendation",
    items: [
      { method: "GET", path: "/recommend", desc: "List 5 use cases for server recommendations" },
      { method: "GET", path: "/recommend?use_case=X", desc: "Get enriched server list for a specific use case" },
      { method: "GET", path: "/api/discover", desc: "A2A-compatible manifest for AI agent discovery" },
    ],
  },
  {
    section: "Customer + revenue",
    items: [
      { method: "GET", path: "/customer/{email}", desc: "Look up all purchases by email (SQLite-aware)" },
      { method: "GET", path: "/revenue", desc: "Live revenue dashboard with ARR potential + by-day buckets" },
      { method: "GET", path: "/analytics", desc: "Simpler analytics (subscriptions + packs + tiers)" },
    ],
  },
  {
    section: "Operations",
    items: [
      { method: "GET", path: "/healthz", desc: "Liveness probe (200 if process alive)" },
      { method: "GET", path: "/readyz", desc: "Readiness probe (DB check + catalog stats)" },
      { method: "GET", path: "/metrics", desc: "Prometheus metrics text format" },
      { method: "GET", path: "/admin", desc: "Full in-memory state dashboard. Optional ?token=... with ADMIN_TOKEN env var." },
    ],
  },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-slate-950 border border-white/10 rounded-xl p-4 overflow-x-auto my-4 text-sm leading-relaxed">
      <code className="font-mono text-slate-200 whitespace-pre">{children}</code>
    </pre>
  );
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono bg-white/[0.06] border border-white/10 rounded px-1.5 py-0.5 text-amber-300 text-[0.88em]">
      {children}
    </code>
  );
}

function Endpoint({ method, path, desc }: { method: "GET" | "POST"; path: string; desc: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 grid grid-cols-[auto_1fr] gap-4 items-start">
      <span
        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
          method === "GET"
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
        }`}
      >
        {method}
      </span>
      <div className="min-w-0">
        <code className="font-mono text-amber-300 text-sm break-all">{path}</code>
        <p className="text-slate-400 text-sm mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <p className="text-slate-400 text-xs font-bold tracking-[0.15em] uppercase mb-4">
          CSOAI · API Documentation
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
          csoai-mcp-monetization API
        </h1>
        <p className="text-slate-400 text-lg mb-8">
          26 endpoints · OpenAPI 3.1.0 · Python + TypeScript + curl examples · Live at{" "}
          <InlineCode>https://csoai.org</InlineCode>
        </p>

        <nav
          aria-label="Table of contents"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-12"
        >
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <section id="quickstart" className="scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 border-b border-white/10 pb-3 mb-5 mt-12">
            Quickstart (60 seconds)
          </h2>
          <p className="text-slate-300 mb-4">Three steps to your first Watchdog Certificate:</p>
          <CodeBlock>{`# 1. Verify the API is alive
curl -s https://csoai.org/healthz

# 2. See the catalog
curl -s https://csoai.org/api

# 3. Buy a tier
curl -s -X POST https://csoai.org/purchase/tier \\
  -H "Content-Type: application/json" \\
  -d '{"tier_id": "pro", "customer_email": "you@yourco.com"}'`}</CodeBlock>
        </section>

        <section id="auth" className="scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 border-b border-white/10 pb-3 mb-5 mt-12">
            Auth (Day 1+)
          </h2>
          <p className="text-slate-300 mb-4">
            Currently the API is open. In production (Day 7+, after first £199/mo charge), all POSTs
            will require an <InlineCode>X-API-Key</InlineCode> header.
          </p>
          <CodeBlock>{`curl -s https://csoai.org/api/whoami \\
  -H "X-API-Key: sk_live_..."`}</CodeBlock>
        </section>

        <section id="endpoints" className="scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 border-b border-white/10 pb-3 mb-5 mt-12">
            All 26 endpoints
          </h2>
          <div className="space-y-8">
            {endpoints.map((group) => (
              <div key={group.section}>
                <h3 className="text-lg font-semibold text-white mb-3">{group.section}</h3>
                <div className="space-y-3">
                  {group.items.map((ep) => (
                    <Endpoint
                      key={`${group.section}-${ep.path}`}
                      method={ep.method}
                      path={ep.path}
                      desc={ep.desc}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="errors" className="scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 border-b border-white/10 pb-3 mb-5 mt-12">
            Error codes
          </h2>
          <CodeBlock>{`200 OK          # Success
400 Bad Request # Invalid params (e.g. unknown tier_id)
404 Not Found   # Resource not found (e.g. unknown sector_name)
422 Unprocessable # Validation error
500 Server Error # Bug on our side`}</CodeBlock>
        </section>

        <section id="webhooks" className="scroll-mt-24">
          <h2 className="text-xl sm:text-2xl font-bold text-emerald-400 border-b border-white/10 pb-3 mb-5 mt-12">
            Stripe webhook setup
          </h2>
          <p className="text-slate-300 mb-4">To enable real Stripe payments:</p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 mb-6 marker:text-emerald-400">
            <li>
              Set <InlineCode>STRIPE_SECRET_KEY</InlineCode> +{" "}
              <InlineCode>STRIPE_WEBHOOK_SECRET</InlineCode> in{" "}
              <InlineCode>csoai-mcp-monetization/.env</InlineCode>
            </li>
            <li>
              In Stripe dashboard, add webhook endpoint:{" "}
              <InlineCode>https://your-host/webhook/stripe</InlineCode>
            </li>
            <li>
              Subscribe to events:{" "}
              <InlineCode>checkout.session.completed</InlineCode>,{" "}
              <InlineCode>customer.subscription.created</InlineCode>,{" "}
              <InlineCode>invoice.paid</InlineCode>,{" "}
              <InlineCode>payment_intent.succeeded</InlineCode>
            </li>
            <li>
              Use <InlineCode>POST /webhook/test</InlineCode> for testing without a real payment
            </li>
          </ol>
        </section>

        <footer className="mt-16 pt-8 border-t border-white/10 text-center text-slate-500 text-sm">
          © 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs ·{" "}
          <Link href="/" className="text-emerald-400 hover:text-emerald-300 hover:underline">
            csoai.org
          </Link>{" "}
          ·{" "}
          <Link href="/api/playground" className="text-emerald-400 hover:text-emerald-300 hover:underline">
            /api/playground
          </Link>
        </footer>
      </div>
    </div>
  );
}
