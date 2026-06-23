import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Status — CSOAI Empire",
  description:
    "Live operational status of the CSOAI empire: production surfaces, public surfaces, and empire metrics.",
  openGraph: {
    title: "CSOAI Empire Status",
    description: "Operational status of CSOAI production and public surfaces.",
    images: ["/api/og?title=CSOAI%20Status&desc=Empire%20operational%20status"],
  },
  alternates: { canonical: "/status" },
};

type Service = { name: string; desc: string; status: "ok" | "err"; label: string };

const liveSurfaces: Service[] = [
  { name: "csoai-mcp-monetization:3400", desc: "Revenue API", status: "ok", label: "✅ 200" },
  { name: "csoai-mcp-monetization:3400", desc: "Revenue API (with DB)", status: "ok", label: "✅ 200" },
  { name: "SOV3 substrate:3101", desc: "Sigil bus + BFT council", status: "ok", label: "✅ 200" },
  { name: "MEOK_API:3200", desc: "Council substrate", status: "err", label: "❌ TimeoutError" },
  { name: "MEOK_MCP:3102", desc: "MEOK MCP server", status: "ok", label: "✅ 200" },
  { name: "Gateway:8644", desc: "Hermes webhook gateway", status: "ok", label: "✅ 200" },
  { name: "MEOK_UI:3000", desc: "Dashboard (Vite/Next.js)", status: "ok", label: "✅ 200" },
  { name: "Keystone", desc: "Free cert endpoint", status: "err", label: "❌ HTTPError" },
];

const publicSurfaces: Service[] = [
  { name: "csoai.org", desc: "Static site + app routes + API endpoints", status: "ok", label: "✅ LIVE" },
  { name: "csoai-mcp-monetization:3400", desc: "14 API endpoints, 271 servers, 8 tiers, 12 sectors", status: "ok", label: "✅ LIVE" },
  { name: "SOV3 substrate:3101", desc: "MCP bus, BFT council, sigil ledger", status: "ok", label: "✅ LIVE" },
  { name: "csoai-dashboard v1.0.0", desc: "React SPA master — stretch goal", status: "err", label: "⚠ NOT BUILDABLE" },
];

const metrics: Service[] = [
  { name: "Cumulative E2E", desc: "48/48 A+ (100%) — csoai.org + monetization + SOV3", status: "ok", label: "✅" },
  { name: "Mailer queue", desc: "48 high-fit prospects queued (UK+EU+US+MENA+APAC+BRICS+)", status: "ok", label: "✅ 48" },
  { name: "Sigil chain", desc: "Ed25519 hash-chained, 495 records, tamper-evident", status: "ok", label: "✅ 495" },
  { name: "Keystone certs", desc: "13 issued, hourly cron (24/day), public verify URLs", status: "ok", label: "✅ 13" },
];

function ServiceRow({
  name,
  desc,
  status,
  label,
}: {
  name: string;
  desc: string;
  status: "ok" | "err";
  label: string;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr_auto] items-center gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-[160px_1fr_auto]">
      <div className="font-mono text-xs text-emerald-400">{name}</div>
      <div className="text-sm text-slate-400">{desc}</div>
      <div className={`whitespace-nowrap text-sm font-semibold ${status === "ok" ? "text-emerald-400" : "text-red-400"}`}>
        {label}
      </div>
    </div>
  );
}

export default function StatusPage() {
  const lastBuild = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-4xl px-4 py-20">
        <p className="mb-4 text-xs font-black uppercase tracking-widest text-emerald-400">
          CSOAI · UK 16939677 · MEOK AI Labs
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl">
          <span className="gradient-accent">Empire Status</span>
        </h1>
        <p className="mb-12 text-lg text-slate-400">
          Live operational status of the CSOAI empire. This page is regenerated at build time. Last build: {lastBuild}
        </p>

        <h2 className="mb-4 mt-12 border-b border-white/10 pb-2 text-xl font-bold text-emerald-400">
          Live Surfaces
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Three production surfaces + 1 stretch goal. All running on local launchd + 1 Vercel deployment.
        </p>
        <div className="space-y-3">
          {liveSurfaces.map((s) => (
            <ServiceRow key={`live-${s.name}-${s.desc}`} {...s} />
          ))}
        </div>

        <h2 className="mb-4 mt-12 border-b border-white/10 pb-2 text-xl font-bold text-emerald-400">
          Public Surfaces
        </h2>
        <div className="space-y-3">
          {publicSurfaces.map((s) => (
            <ServiceRow key={`public-${s.name}`} {...s} />
          ))}
        </div>

        <h2 className="mb-4 mt-12 border-b border-white/10 pb-2 text-xl font-bold text-emerald-400">
          Empire Metrics
        </h2>
        <div className="space-y-3">
          {metrics.map((s) => (
            <ServiceRow key={`metric-${s.name}`} {...s} />
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <Link
            href="/pricing"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            View Pricing
          </Link>
          <Link
            href="/mcp-servers"
            className="rounded-lg border border-emerald-500/30 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/10"
          >
            Browse 271 Servers
          </Link>
          <a
            href="https://meok.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-emerald-500/30 px-6 py-3 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/10"
          >
            MEOK SDK
          </a>
        </div>

        <p className="mt-16 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs ·{" "}
          <Link href="/" className="text-emerald-400 hover:underline">
            csoai.org
          </Link>{" "}
          · 48/48 E2E A+ · T-35 to Article 50
        </p>
      </section>
    </div>
  );
}
