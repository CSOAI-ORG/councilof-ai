/**
 * Home — living board first, then the estate.
 * The desk is the instrument: expanded GSPC table, click a row, ask below.
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
import { setMetaDescription } from "@/lib/utils";

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
      <HeroSlides />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <section aria-labelledby="os-h1">
          <h1 id="os-h1" className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Check an AI claim. Or measure your system.
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Empty means not measured. Not a certificate. Free, no account.
          </p>
          <HomeUnderstand
            className="mt-5 max-w-2xl"
            title="What you can do in this box"
            items={[
              "Click a row. The figure, n and status open underneath — living GET /api/gspc.",
              "Paste a signed card. Your browser checks the hash and the signature. Nothing is sent.",
              "Say what you use AI for. We route you to get measured — free, no account.",
              { kind: "usp", text: "Verification is free forever. A rank is never sold." },
            ]}
          />

          <div className="mt-6 flex flex-wrap gap-3">
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

        <div className="mt-12">
          <LiveLeaderboard
            heading="The live board"
            defaultExpanded
            showHumanPanel={false}
            highlight={axis}
            onSelect={setAxis}
          />
        </div>

        <section aria-labelledby="ask-h" className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_44px_-32px_rgba(4,18,12,.45)] sm:p-7">
          <h2 id="ask-h" className="text-xl font-bold text-slate-900">
            Ask, or paste a card
          </h2>
          <p className="mt-2 text-sm text-slate-600">
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
