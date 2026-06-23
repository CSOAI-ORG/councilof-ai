import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press — CSOAI",
  description: "Press releases, media kit and company announcements from CSOAI and MEOK AI Labs.",
  alternates: { canonical: "/press" },
};

const releases = [
  {
    date: "15 June 2026",
    title: "MEOK AI Labs ships first open-source EU Code-of-Practice-ready AI compliance suite",
    slug: "article-50-sprint",
    summary:
      "Three new MCP servers give developers Ed25519-signed, offline-verifiable compliance for the EU AI Act's 2 August transparency obligations.",
  },
];

export default function PressPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "CSOAI Press",
    url: "https://csoai.org/press",
    description: "Press releases and announcements from CSOAI.",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-emerald-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6">Press</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Press releases, media resources and company announcements from CSOAI and MEOK AI Labs.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-500 mb-8">
            Press releases
          </h2>
          <div className="space-y-6">
            {releases.map((r) => (
              <a
                key={r.slug}
                href={`/press/${r.slug}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.03] p-8 hover:border-emerald-500/30 transition"
              >
                <p className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3">
                  {r.date}
                </p>
                <h3 className="text-2xl font-bold mb-3">{r.title}</h3>
                <p className="text-slate-400">{r.summary}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/5 bg-slate-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-500 mb-6">
            Media contact
          </h2>
          <p className="text-slate-300 mb-4">
            For press enquiries, interview requests and speaker bookings:
          </p>
          <a
            href="mailto:press@meok.ai"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
          >
            press@meok.ai
          </a>
        </div>
      </section>
    </div>
  );
}
