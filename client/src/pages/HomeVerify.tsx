/**
 * Home — explore measurements, see changes, verify evidence, then access feeds.
 * No demo video window in section one. No iframe of a Space.
 * Verify is free. We measure; we do not sell a rank.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import HeroSlides from "@/components/HeroSlides";
import HomeComposer from "@/components/home/HomeComposer";
import ToolStack from "@/components/home/ToolStack";
import LivingStages from "@/components/home/LivingStages";
import HomeFilms from "@/components/home/HomeFilms";
import HomeCinematicWorlds from "@/components/home/HomeCinematicWorlds";
import HomeGspcTable from "@/components/home/HomeGspcTable";
import HomeUnderstand from "@/components/home/HomeUnderstand";
import HomeEvidenceShowcase from "@/components/home/HomeEvidenceShowcase";
import HomeFirstResult from "@/components/home/HomeFirstResult";
import { gspcDatasetLd } from "@/lib/datasetSchema";
import { setMetaDescription } from "@/lib/utils";

// schema.org for the homepage (B5.3): the estate as a SoftwareApplication plus
// the board Dataset. The Dataset node is DERIVED from the axis registry
// (gspcDatasetLd) — no bank is asserted that is not in the single source of
// truth. No prices, no ratings, no "certified": measurement, not certification.
const HOME_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Council of AI — GSPC board and verify",
      url: "https://councilof.ai/",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description:
        "Read the live GSPC measurement board (GET /api/gspc) and verify signed measurement cards in the browser. Verification is free; a rank is never sold. Measurement, not certification.",
      publisher: {
        "@type": "Organization",
        name: "CSOAI Ltd",
        url: "https://councilof.ai",
        identifier: "UK Companies House 16939677",
      },
    },
    gspcDatasetLd(false),
  ],
};

export default function HomeVerify() {
  const [axis, setAxis] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Council of AI — explore measurements and verify evidence";
    setMetaDescription(
      "Explore the current GSPC measurements, see the published change record, verify signed evidence, and access the supported public feeds.",
    );
  }, []);

  return (
    <div data-testid="home-verify">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }} />
      {/* FIRST SCREEN — the proposition, one evidence action, the scope note and ONE
          inspectable result, before any atmosphere. Measured 2026-09-15 before this
          change: the first h1 began at y=773 (1440x900) / y=800 (390x844), below a
          rotating band. The band still ships, second. */}
      <section
        aria-labelledby="home-h1"
        data-testid="home-proposition"
        className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:pt-16"
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Independent measurement body</p>
        <h1 id="home-h1" className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Independent measurements. Evidence you can check.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
          Explore published results for AI systems, agents and digital assets. See the method, date
          and limits; verify signed records where available.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="#measurements" className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800" data-testid="home-cta-explore">
            Explore evidence
          </a>
          <Link href="/gspc-verify" className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50" data-testid="home-cta-verify">
            Verify a record
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-600">Measurement, not certification. Public verification is free.</p>
        <HomeFirstResult />
      </section>

      <HeroSlides />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24" style={{ paddingBottom: "calc(6rem + var(--cookie-banner-h, 0px))" }}>
        <section aria-labelledby="os-h1">
          <h2 id="os-h1" className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Explore measurements. See what changed.
          </h2>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Start with the live board, then follow the change record and verify the signed evidence.
            Empty means not measured. Not a certificate.
          </p>
          <nav aria-label="Start with published evidence" className="mt-6 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="supply-led-entry">
            <a className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800" href="#measurements">1 · Explore measurements</a>
            <Link className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50" href="/press">2 · See what changed</Link>
            <Link className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50" href="/gspc-verify" data-testid="home-btn-verify">3 · Verify evidence</Link>
            <Link className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50" href="/quickstart">4 · Access supported feeds</Link>
          </nav>
          <div className="mt-4 flex max-w-3xl flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            <Link href="/dashboard?tab=home" className="font-semibold text-emerald-800 underline underline-offset-4">Open Council OS</Link>
            <Link href="/assess" data-testid="home-btn-assess" className="font-semibold text-emerald-800 underline underline-offset-4">Request a scoped measurement</Link>
            <a className="font-semibold text-emerald-800 underline underline-offset-4" href="/route-receipts">Create a route receipt from an OpenTelemetry trace</a>
            <span>These commissioned outputs come after the public measurement and verification path.</span>
          </div>
          <HomeUnderstand
            className="mt-6 max-w-2xl"
            title="What this desk does"
            items={[
              "Click a row. Its bench, n, interval and note open underneath — living GET /api/gspc.",
              "Paste a signed card. Your browser checks the hash and the signature. Nothing is sent.",
              "Say what you use AI for. Measurement is metered; verify stays free.",
              { kind: "usp", text: "Verification is free forever. A rank is never sold." },
            ]}
          />

          {/* The doctrine restatement that used to sit here ("We measure AI against frozen
              tests…") repeated the proposition, the desk list and the ToolStack lede. One
              introduction per idea; the plugin door stays in the header and ToolStack. */}
        </section>

        {/* The board table: every row, every word, every number off GET /api/gspc at render
            time; the models block under it lists only the leaders the board publishes. */}
        <div id="measurements" className="mt-20 scroll-mt-24 sm:mt-24">
          <HomeGspcTable heading="The living board" highlight={axis} onSelect={setAxis} />
        </div>

        <section aria-labelledby="ask-h" className="mt-20 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_44px_-32px_rgba(4,18,12,.45)] sm:mt-24 sm:p-8">
          <h2 id="ask-h" className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Ask. Or paste a card.
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Name an axis to jump the board. Paste a signed card to verify it here. Nothing leaves this device.
          </p>
          <HomeComposer onAskAxis={setAxis} />
        </section>

        <HomeEvidenceShowcase />
      </section>

      <ToolStack />
      <HomeFilms />
      <LivingStages />
      <HomeCinematicWorlds />
    </div>
  );
}
