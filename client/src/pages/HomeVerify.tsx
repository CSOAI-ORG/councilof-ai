/**
 * Home — OpenRouter desk (composer + GSPC list) plus the epic estate:
 * cinematic slides, nine product plates, image bands. Verify is free.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import HeroSlides from "@/components/HeroSlides";
import HomeBoard from "@/components/home/HomeBoard";
import HomeComposer from "@/components/home/HomeComposer";
import PluginBlock from "@/components/home/PluginBlock";
import ToolStack from "@/components/home/ToolStack";
import LivingStages from "@/components/home/LivingStages";
import HomeFilms from "@/components/home/HomeFilms";
import HomeDemoLoop from "@/components/home/HomeDemoLoop";
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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="os-h1">
            <h1 id="os-h1" className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Check an AI claim. Or measure your system.
            </h1>
            <p className="mt-3 text-slate-600">
              Empty means not measured. Not a certificate. Free, no account.
            </p>

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
              <a
                href="/compliance-training-world/catalog.html"
                data-testid="home-btn-train"
                className="inline-flex rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Compliance training
              </a>
            </div>

            <HomeComposer onAskAxis={setAxis} />
            <HomeDemoLoop />
            <PluginBlock />

            <p className="mt-3 text-[12px] text-slate-500">
              Paid arms (enquiry, never a bought rank):{" "}
              <a href="/products" className="text-emerald-800 hover:underline">
                Run / re-attest
              </a>
              {" · "}
              <a href="/products" className="text-emerald-800 hover:underline">
                Ledger
              </a>
              {" · "}
              <a href="/products" className="text-emerald-800 hover:underline">
                Data
              </a>
            </p>
          </section>

          <HomeBoard highlight={axis} />
        </div>
      </main>

      <HomeFilms />
      <ToolStack />
      <LivingStages />
    </div>
  );
}
