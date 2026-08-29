/**
 * OpenRouter layout without becoming OpenRouter:
 * composer left (verify / measure / totals) + GSPC leaderboard right.
 * Chat is a box. No AG-UI. Verify is free. Three paid arms invoice.
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import HomeBoard from "@/components/home/HomeBoard";
import HomeComposer from "@/components/home/HomeComposer";
import PluginBlock from "@/components/home/PluginBlock";
import { setMetaDescription } from "@/lib/utils";

export default function HomeVerify() {
  const [axis, setAxis] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Check an AI claim | councilof.ai";
    setMetaDescription(
      "Paste a card or ask the board. Live GSPC leaderboard. Verify is free. Empty stays empty. Not a certificate. Not a ranking for sale.",
    );
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14" data-testid="home-verify">
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
          </div>

          <HomeComposer onAskAxis={setAxis} />
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
  );
}
