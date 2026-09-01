/**
 * Home — living board first, then the Hub record, then the estate.
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
import LiveLeaderboard from "@/components/board/LiveLeaderboard";
import HomeUnderstand from "@/components/home/HomeUnderstand";
import HfLivingRecord from "@/components/HfLivingRecord";
import XrplReaderRail from "@/components/gspc/XrplReaderRail";
import EstateDoors from "@/components/home/EstateDoors";
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
    document.title = "Council of AI — check an AI claim, read the GSPC board";
    setMetaDescription(
      "Paste a signed card or read the live GSPC leaderboard. Verify is free. Nine products. Empty cells stay empty. We measure; we do not sell a rank.",
    );
  }, []);

  return (
    <div data-testid="home-verify">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOME_LD) }} />
      <HeroSlides />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <section aria-labelledby="os-h1">
          <h1 id="os-h1" className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Check a claim. Measure a system.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            Empty means not measured. Not a certificate. Free, no account.
          </p>
          <HomeUnderstand
            className="mt-6 max-w-2xl"
            title="What this desk does"
            items={[
              "Click a row. The figure, n and status open underneath — living GET /api/gspc.",
              "Paste a signed card. Your browser checks the hash and the signature. Nothing is sent.",
              "Say what you use AI for. We route you to get measured — free, no account.",
              { kind: "usp", text: "Verification is free forever. A rank is never sold." },
            ]}
          />

          <p className="mt-4 max-w-2xl text-sm text-slate-600">
            We measure AI against frozen tests, sign the card, and leave empty cells empty.
            Live board is GET /api/gspc — not a remembered 15. Verify at /gspc-verify. Plugin at /plugin.
          </p>
          <table className="mt-4 text-left font-mono text-[11px] text-slate-600" data-testid="estate-doors">
            <caption className="sr-only">Estate doors</caption>
            <tbody>
              <tr><th className="pr-4 font-semibold">Board</th><td>GET /api/gspc (living)</td></tr>
              <tr><th className="pr-4 font-semibold">Root</th><td>/root.json — signed envelope, not a certificate</td></tr>
              <tr><th className="pr-4 font-semibold">Plugin</th><td>/plugin → /tools · 7 MCP tools</td></tr>
              <tr><th className="pr-4 font-semibold">COBOL</th><td>cobolbridge.ai 522 — infra</td></tr>
              <tr><th className="pr-4 font-semibold">SWIFT / XRPL / TRACE</th><td>tapes beside the board, not axes 23–27</td></tr>
            </tbody>
          </table>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/gspc-verify"
              data-testid="home-btn-verify"
              className="inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Verify a card
            </Link>
            <Link
              href="/assess"
              data-testid="home-btn-assess"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Get measured
            </Link>
            <Link
              href="/os"
              className="inline-flex rounded-xl border border-emerald-700 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100"
            >
              Open Council OS
            </Link>
          </div>
        </section>

        <div className="mt-20 sm:mt-24">
          <LiveLeaderboard
            heading="The living board"
            defaultExpanded
            showHumanPanel={false}
            highlight={axis}
            onSelect={setAxis}
          />
        </div>

        <HfLivingRecord />

        <div className="mt-16 grid items-start gap-6 lg:grid-cols-2">
          <XrplReaderRail />
          <EstateDoors />
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
      </main>

      <ToolStack />
      <HomeFilms />
      <LivingStages />
      <HomeCinematicWorlds />
    </div>
  );
}
