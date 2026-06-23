import type { Metadata } from "next";
import Link from "next/link";
import { HIVES, getHiveEntries } from "@/lib/hive-catalog";

export const metadata: Metadata = {
  title: "Hive Starter Packs",
  description:
    "Curated open-data starter packs for every CSOAI hive. Security, Finance, Governance, Research, Operations, Creative — all $0 annual cost.",
  openGraph: {
    title: "CSOAI Hive Starter Packs",
    description: "Open-data starter packs for Security, Finance, Governance, Research, Operations, and Creative hives.",
    images: [
      "/api/og?title=Hive%20Starter%20Packs&desc=Open-data%20starter%20packs%20for%20every%20CSOAI%20hive.",
    ],
  },
  alternates: { canonical: "/hives" },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://csoai.org/" },
    { "@type": "ListItem", position: 2, name: "Hives", item: "https://csoai.org/hives" },
  ],
};

export default function HivesHubPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
          Data-powered
        </div>
        <h1 className="mb-6 text-4xl font-black tracking-tighter sm:text-6xl">Hive Starter Packs</h1>
        <p className="mb-12 max-w-3xl text-lg text-slate-400">
          Every CSOAI hive needs fuel. These starter packs map the free data catalog to the hives that
          consume it — Security, Finance, Governance, Research, Operations, and Creative.
        </p>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {HIVES.map((hive) => {
            const count = getHiveEntries(hive.slug).length;
            return (
              <Link
                key={hive.slug}
                href={`/hives/${hive.slug}`}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-emerald-500/30 hover:bg-white/[0.05]"
              >
                <div
                  className="mb-4 inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  style={{ borderColor: `${hive.color}40`, color: hive.color, backgroundColor: `${hive.color}15` }}
                >
                  {count} sources
                </div>
                <h3 className="mb-2 text-xl font-bold text-white group-hover:text-emerald-400">
                  {hive.name}
                </h3>
                <p className="mb-4 flex-1 text-sm text-slate-400">{hive.tagline}</p>
                <p className="text-xs text-slate-500">{hive.description.slice(0, 120)}...</p>
              </Link>
            );
          })}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </div>
  );
}
