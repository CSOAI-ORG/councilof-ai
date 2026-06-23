import type { Metadata } from "next";
import Link from "next/link";
import { TRANSFER_SUPPORTED_PLATFORMS, COMPETITORS } from "@/lib/competitors";

export const metadata: Metadata = {
  title: "Transfer to CSOAI",
  description:
    "One-click migration from Vanta, Drata, ServiceNow, Credo AI, OneTrust, and 10 more platforms. Import evidence, map controls to AI systems, and activate Watchdog Certificates in minutes.",
  openGraph: {
    title: "Transfer to CSOAI",
    description: "Switch in minutes, not quarters. One-click migration from 15 GRC and AI governance platforms.",
    images: ["/api/og?title=Transfer%20to%20CSOAI&desc=Switch%20in%20minutes%2C%20not%20quarters.%20One-click%20migration%20from%2015%20GRC%20and%20AI%20governance%20platforms."],
  },
  alternates: { canonical: "/transfer" },
};

const steps = [
  { n: 1, title: "Authorize", desc: "Connect your current platform with read-only OAuth or API credentials." },
  { n: 2, title: "Map", desc: "CSOAI maps your evidence and controls to AI systems, frameworks, and risk registers." },
  { n: 3, title: "Activate", desc: "Issue Ed25519-signed Watchdog Certificates and switch your renewal spend to CSOAI." },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
        { "@type": "ListItem", position: 2, name: "Transfer", item: "https://csoai.org/transfer" },
      ],
    },
    {
      "@type": "WebPage",
      name: "Transfer to CSOAI",
      description: "One-click migration from Vanta, Drata, ServiceNow, and other platforms.",
    },
    {
      "@type": "HowTo",
      name: "Switch from another GRC platform to CSOAI",
      step: steps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.desc,
      })),
    },
  ],
};

export default function TransferPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-16 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Migration
          </div>
          <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Switch in minutes, not quarters</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400">
            One-click transfer from Vanta, Drata, ServiceNow, Credo AI, OneTrust, and 10 more platforms. We import your
            evidence, map it to AI systems, and issue signed Watchdog Certificates in one flow.
          </p>
        </div>

        <div className="mb-20 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 font-mono font-bold text-emerald-400">
                {s.n}
              </div>
              <h3 className="mb-2 text-xl font-bold">{s.title}</h3>
              <p className="text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>

        <section className="mb-20">
          <h2 className="mb-8 text-center text-2xl font-bold">Supported platforms</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {TRANSFER_SUPPORTED_PLATFORMS.map((p) => (
              <div
                key={p}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-medium text-slate-300"
              >
                {p}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 overflow-hidden rounded-2xl border border-white/10">
          <div className="border-b border-white/10 bg-white/[0.03] px-6 py-4">
            <h2 className="text-xl font-bold">Why teams leave the incumbents</h2>
          </div>
          <div className="grid md:grid-cols-2">
            {COMPETITORS.slice(0, 6).map((c, i) => (
              <div
                key={c.slug}
                className={`border-b border-white/10 p-6 ${i % 2 === 0 ? "md:border-r" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-white">{c.name}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{c.pricing}</span>
                </div>
                <p className="text-sm text-slate-400">{c.weakness}</p>
                <Link href={`/vs/${c.slug}`} className="mt-3 inline-block text-sm font-bold text-emerald-400 hover:underline">
                  See the head-to-head →
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Start your free transfer assessment</h2>
          <p className="mx-auto mb-6 max-w-xl text-slate-300">
            Send us your current platform and we will produce a migration map, cost estimate, and first Watchdog
            Certificate at no charge.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Request transfer assessment
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>
        </section>

        <p className="text-center text-xs text-slate-600">
          Competitive claims are based on public research, customer reports, and composite analysis. Individual
          experiences may vary.
        </p>
      </div>
    </div>
  );
}
