import { useEffect } from "react";
import { Link } from "wouter";
import {
  Umbrella,
  Landmark,
  HeartPulse,
  Shield,
  Server,
  Radar,
  Network,
  GitBranch,
  Boxes,
  Lock,
  Cog,
  PersonStanding,
  Glasses,
  Scale,
  Brain,
  ArrowRight,
  ArrowLeft,
  FileSignature,
  ChevronRight,
} from "lucide-react";
import ContentPage from "./ContentPage";
import AxisProof from "../components/AxisProof";
import { industriesdata } from "../data/industries-content";
import {
  getIndustry,
  industriesForGrid,
  ARTEFACT_CARD,
  type Industry,
} from "../data/industries";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Umbrella,
  Landmark,
  HeartPulse,
  Shield,
  Server,
  Radar,
  Network,
  GitBranch,
  Boxes,
  Lock,
  Cog,
  PersonStanding,
  Glasses,
  Scale,
  Brain,
};

function SectionHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
        {n}
      </span>
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

function IndustryPage({ industry }: { industry: Industry }) {
  const Icon = ICONS[industry.icon] ?? Shield;

  useEffect(() => {
    document.title = `${industry.name} — what we measure · CSOAI`;
  }, [industry.name]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-emerald-50/70 to-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/industries"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" /> All {industriesForGrid.length} industries
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 shadow-sm">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {industry.name}
                </h1>
                {industry.beachhead && (
                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                    Beachhead
                  </span>
                )}
              </div>
              <p className="mt-2 text-lg text-slate-600">{industry.short}</p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700">
                <span className="text-slate-400">Bench</span> {industry.bench}
              </div>
            </div>
          </div>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
              Who relies on the measurement
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{industry.reliesOn}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-14 px-4 py-14 sm:px-6 lg:px-8">
        {/* 1. Your law */}
        <section>
          <SectionHeading n={1} title="Your law" />
          <p className="mb-5 text-sm text-slate-600">
            The provisions that bind this sector, with dates. The wider clock runs Article 50
            transparency (now) → Machinery Regulation (14 Jan 2027) → high-risk Annex III (2027)
            → AI Act Annex I product-safety route (2 Aug 2028).
          </p>
          <ul className="space-y-3">
            {industry.law.map((l, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm text-slate-800">{l.provision}</p>
                  <span
                    className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      l.live
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {l.live ? "in force" : "scheduled"} · {l.date}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 2. What we measure */}
        <section>
          <SectionHeading n={2} title="What we measure" />
          <p className="mb-5 text-sm leading-relaxed text-slate-700">{industry.whatMeasure.summary}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {industry.whatMeasure.pillars.map((p, i) => (
              <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-emerald-700">{p.pillar}</div>
                <p className="mt-1 text-sm text-slate-700">{p.inSector}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Numbers today — read live, never typed */}
        <section>
          <SectionHeading n={3} title="Numbers today" />
          <p className="mb-5 text-sm text-slate-600">
            Every score is a deterministic grade of recorded model outputs on a frozen, published
            split. The rows below are fetched from <code>GET /api/gspc</code> when this page loads —
            no figure is written into the page, so this page cannot drift from the board. Where a
            slot carries no run, it reads <strong>unmeasured</strong>, never 0%.
          </p>
          {industry.gap && (
            <p className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-amber-900">The gap, stated first: </span>
              {industry.gap}
            </p>
          )}
          <AxisProof
            axes={industry.axes}
            why={`The board axes that bear on ${industry.name.toLowerCase()}. Bench, n, interval and separation verdict as the board serves them.`}
            tone="light"
          />
        </section>

        {/* 4. Artefact you leave with */}
        <section>
          <SectionHeading n={4} title="Artefact you leave with" />
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-3 inline-flex items-center gap-2 text-emerald-700">
              <FileSignature className="h-5 w-5" />
              <span className="font-semibold">Signed result card</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700">{ARTEFACT_CARD}</p>
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm leading-relaxed text-slate-700">
              <span className="font-semibold text-slate-900">For this sector it proves </span>
              {industry.artefactProves}
            </p>
          </div>
        </section>

        {/* 5. CTA */}
        <section>
          <SectionHeading n={5} title="Start measuring" />
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <p className="text-sm leading-relaxed text-slate-700">
              Run the free rail against your model on this bench. CSOAI is a measurement body — the
              card records what your model did, not an approval. We do not sell a grade.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Measure free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/?lobby=measured&task=enterprise-start"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
              >
                Enterprise lobby
              </Link>
            </div>
          </div>
        </section>

        {/* Cross-links to the rest of the atlas */}
        <section className="border-t border-slate-200 pt-8">
          <div className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">
            Other industries
          </div>
          <div className="flex flex-wrap gap-2">
            {industriesForGrid
              .filter((i) => i.slug !== industry.slug)
              .map((i) => (
                <Link
                  key={i.slug}
                  href={`/industries/${i.slug}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                >
                  {i.name}
                </Link>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// Route handler for /industries/:slug. Serves the 15 canonical industry pages
// from the data-driven template; falls back to the legacy content dataset for
// any older slug (cybersecurity, education, energy, finance, healthcare, etc.)
// so no existing URL 404s.
export default function IndustryTemplate({ slug }: { slug: string }) {
  const industry = getIndustry(slug);
  if (!industry) {
    return <ContentPage dataset={industriesdata} slug={slug} />;
  }
  return <IndustryPage industry={industry} />;
}
