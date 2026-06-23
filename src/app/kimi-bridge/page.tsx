import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kimi Bridge",
  description: "Connect Kimi agents to CSOAI. Query pages, competitors, market gaps, and simulation output via the csoai-kimi-bridge MCP server.",
  openGraph: {
    title: "CSOAI Kimi Bridge",
    description: "Let Kimi agents read and propose edits to the CSOAI website.",
    images: ["/api/og?title=CSOAI%20Kimi%20Bridge&desc=Let%20Kimi%20agents%20read%20and%20propose%20edits%20to%20the%20CSOAI%20website."],
  },
  alternates: { canonical: "/kimi-bridge" },
};

const tools = [
  { name: "list_pages", desc: "List every public page on csoai.org and its purpose." },
  { name: "get_page_brief", desc: "Get a one-paragraph brief for any page by path." },
  { name: "list_competitors", desc: "Return the EAT kill-sheet competitors." },
  { name: "list_market_gaps", desc: "Return high-priority market gaps." },
  { name: "get_simulation_summary", desc: "Return the latest SOV Town run summary." },
  { name: "propose_page_edit", desc: "Suggest an edit to a page. Returns guidance; does not apply changes." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Kimi Bridge", item: "https://csoai.org/kimi-bridge" },
      ],
    },
    {
      "@type": "SoftwareApplication",
      name: "CSOAI Kimi Bridge",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
    },
  ],
};

export default function KimiBridgePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Agent Integration
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">CSOAI Kimi Bridge</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            Connect Kimi agents to the CSOAI website. Query pages, competitors, market gaps, and simulation output, then
            propose edits safely.
          </p>
        </div>

        <div className="mb-16 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-4">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">MCP server config</span>
          </div>
          <pre className="overflow-x-auto p-6 text-sm leading-relaxed text-slate-300">
            <code>{`# Install globally
npm install -g csoai-kimi-bridge

# Then add to your MCP config
{
  "mcpServers": {
    "csoai-kimi-bridge": {
      "command": "csoai-kimi-bridge",
      "env": { "CSOAI_SITE_URL": "https://csoai.org" }
    }
  }
}`}</code>
          </pre>
        </div>

        <div className="mb-16 grid gap-4 md:grid-cols-2">
          {tools.map((t) => (
            <div key={t.name} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h3 className="mb-2 font-mono text-lg font-bold text-emerald-400">{t.name}</h3>
              <p className="text-sm text-slate-400">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center sm:flex-row">
          <a
            href="https://github.com/CSOAI-ORG/csoai-kimi-bridge"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            View bridge on GitHub ↗
          </a>
          <Link
            href="/simulation"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            See live simulation
          </Link>
        </div>
      </div>
    </div>
  );
}
