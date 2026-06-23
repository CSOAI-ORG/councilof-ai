import type { Metadata } from "next";
import Link from "next/link";
import CountdownClient from "./CountdownClient";

export const metadata: Metadata = {
  title: "Article 50 Countdown — CSOAI",
  description:
    "Live countdown to EU AI Act Article 50 enforcement: 2 August 2026. See hours, minutes, seconds until the deadline.",
  openGraph: {
    title: "Article 50 Countdown — CSOAI",
    description: "Live countdown to EU AI Act Article 50 enforcement on 2 August 2026.",
    images: ["/api/og?title=Article%2050%20Countdown&desc=EU%20AI%20Act%20enforcement"],
  },
  alternates: { canonical: "/countdown" },
};

const stats = [
  { value: "102+", label: "csoai.org Pages" },
  { value: "29", label: "API Endpoints" },
  { value: "348", label: "MCP Servers" },
  { value: "298", label: "Prospects" },
  { value: "20", label: "Verticals" },
  { value: "115+", label: "Organisations" },
  { value: "79/79", label: "E2E Tests" },
  { value: "614", label: "Sigils" },
];

const milestones = [
  { date: "1 Aug 2024", label: "AI Act enters into force" },
  { date: "2 Feb 2025", label: "Prohibited AI practices banned (Article 5)" },
  { date: "2 Aug 2025", label: "GPAI model obligations apply (Articles 51–55)" },
  { date: "2 Aug 2026", label: "⚠️ Article 50 transparency duties in force" },
  { date: "2 Dec 2027", label: "High-risk (Annex III) obligations — delayed by the Digital Omnibus" },
];

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "EU AI Act Article 50 Enforcement",
  startDate: "2026-08-02T00:00:00Z",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  description:
    "Article 50 transparency obligations come into force under the EU AI Act on 2 August 2026.",
  url: "https://csoai.org/countdown",
  organizer: {
    "@type": "Organization",
    name: "European Union",
  },
};

export default function CountdownPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-white">
        <section className="relative mx-auto flex max-w-4xl flex-col items-center justify-center px-4 py-32 text-center">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(239,68,68,0.08),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(212,168,67,0.08),transparent_50%)]" />

          <h1 className="relative mb-2 text-sm font-black uppercase tracking-[0.2em] text-red-400">
            🚨 EU AI Act · Article 50 · Enforcement
          </h1>
          <h2 className="relative mb-10 text-2xl font-bold text-amber-300">
            Time remaining to 2 August 2026
          </h2>

          <div className="relative w-full">
            <CountdownClient />
          </div>

          <div className="relative mt-12 grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/10 bg-slate-900/80 p-4 backdrop-blur"
              >
                <div className="text-xl font-black text-amber-300">{stat.value}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-10 w-full rounded-xl border border-white/10 bg-slate-900/80 p-6 text-left backdrop-blur">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-amber-300">
              Compliance timeline
            </h3>
            <div className="space-y-3">
              {milestones.map((milestone) => (
                <div
                  key={milestone.label}
                  className="flex items-start gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-[110px] text-sm font-bold text-amber-300">
                    {milestone.date}
                  </div>
                  <div className="text-sm text-slate-400">{milestone.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex rounded-lg bg-red-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-600"
            >
              Get Your Watchdog Cert →
            </Link>
            <Link
              href="/guides"
              className="inline-flex rounded-lg border border-amber-300 px-6 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-300/10"
            >
              10-step Onboarding
            </Link>
            <Link
              href="/status"
              className="inline-flex rounded-lg border border-amber-300 px-6 py-3 text-sm font-bold text-amber-300 transition hover:bg-amber-300/10"
            >
              OpenGrid Dashboard
            </Link>
          </div>

          <p className="relative mt-12 text-xs text-slate-500">
            CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs ·{" "}
            <Link href="/" className="text-emerald-400 hover:underline">
              csoai.org
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
