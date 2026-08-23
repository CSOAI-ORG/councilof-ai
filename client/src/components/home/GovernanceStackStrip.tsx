import { Link } from "wouter";
import { Route, Shield, ChevronRight, Layers } from "lucide-react";
import { CTA_OUTLINE, CTA_PRIMARY, POSITIONING } from "@/lib/positioning";
import { openLobby } from "@/lib/lobbyLink";

/**
 * Two-pillar strip — governance router (Eunomia) + measurement harness (GSPC/arena).
 * Placed early on the homepage so positioning is explicit before feature grids.
 */
export default function GovernanceStackStrip() {
  return (
    <section
      id="governance-stack"
      className="bg-gradient-to-b from-emerald-950 via-[#041510] to-[#04070d] text-white py-16 px-6"
      aria-labelledby="governance-stack-heading"
    >
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-xs font-bold uppercase tracking-[0.25em] text-emerald-400/90">
          Where we are now
        </p>
        <h2 id="governance-stack-heading" className="mt-3 text-center text-3xl sm:text-4xl font-extrabold tracking-tight">
          {POSITIONING.headline}
        </h2>
        <p className="mt-4 mx-auto max-w-3xl text-center text-base sm:text-lg text-emerald-100/80 leading-relaxed">
          {POSITIONING.subhead}
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-emerald-500/20 bg-white/5 p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <Route className="h-4 w-4" aria-hidden />
              {POSITIONING.router.short}
            </div>
            <h3 className="mt-3 text-xl font-extrabold">{POSITIONING.router.name}</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{POSITIONING.router.blurb}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={POSITIONING.router.href} className={CTA_PRIMARY}>
                {POSITIONING.router.cta}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <button
                type="button"
                className={CTA_OUTLINE + " !border-emerald-400/30 !bg-transparent !text-emerald-100 hover:!bg-white/10"}
                onClick={() => openLobby({ pane: "routes", task: "eunomia-router" })}
              >
                Open in Council OS
              </button>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-500/20 bg-white/5 p-6 sm:p-8 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
              <Shield className="h-4 w-4" aria-hidden />
              {POSITIONING.harness.short}
            </div>
            <h3 className="mt-3 text-xl font-extrabold">{POSITIONING.harness.name}</h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{POSITIONING.harness.blurb}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/gspc-scoreboard" className={CTA_PRIMARY}>
                Open the board
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href={POSITIONING.harness.href}
                className={CTA_OUTLINE + " !border-emerald-400/30 !bg-transparent !text-emerald-100 hover:!bg-white/10"}
              >
                {POSITIONING.harness.cta}
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 rounded-xl border border-white/10 bg-black/20 px-6 py-4 text-sm text-slate-300">
          <Layers className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden />
          <span className="text-center sm:text-left">
            <strong className="text-white">{POSITIONING.os.name}</strong> — {POSITIONING.os.blurb}
          </span>
          <Link href={POSITIONING.os.href} className={CTA_PRIMARY + " shrink-0"}>
            {POSITIONING.os.cta}
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 max-w-2xl mx-auto">
          {POSITIONING.firewall} · {POSITIONING.not}
        </p>
      </div>
    </section>
  );
}
