import { Link } from "wouter";

/** A working practice entry point; networked battle concepts are not joinable matches. */
export default function HomeColiseum() {
  return (
    <section
      id="coliseum"
      aria-labelledby="home-coliseum-h"
      className="mt-20 scroll-mt-24 sm:mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-800">
            The Coliseum
          </p>
          <h2
            id="home-coliseum-h"
            className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl"
          >
            Put humans back in charge.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            AI can help. You decide what happens next. Practise the decisions
            that keep people in control, right here in Council OS.
          </p>
        </div>
        <Link
          href="/dashboard?tab=play"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Explore all games <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <article
        aria-labelledby="home-boss-chair-h"
        className="mt-7 grid overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2"
      >
        <div className="relative bg-slate-100">
          <img
            src="/images/coliseum_logic_duel.jpg"
            alt="Clay human and AI figures across a chessboard — illustrative arena artwork"
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover md:min-h-80"
          />
          <span className="absolute left-4 top-4 rounded-full border border-white/80 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-900">
            Playable · browser practice
          </span>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
            8 decisions. You’re in charge.
          </p>
          <h3
            id="home-boss-chair-h"
            className="mt-3 text-3xl font-black tracking-tight text-slate-950"
          >
            The Boss’s Chair
          </h3>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600">
            Let the agent act—or stop for human approval? Handle eight workplace
            scenarios, see why each decision matters, and try again.
          </p>
          <Link
            href="/dashboard?tab=play&game=boss-chair"
            data-testid="home-play-boss-chair"
            className="mt-6 inline-flex min-h-11 w-fit items-center gap-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
          >
            Take the chair <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-slate-500">
            Scripted scenarios, not a live AI opponent. Answers stay in this
            session. Practice scores do not update GSPC or create signed
            evidence.
          </p>
        </div>
      </article>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img
            src="/images/coliseum_humans_vs_humanoids.jpg"
            alt="Human and robot figures in a marble arena — a concept illustration"
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="aspect-[2.8/1] w-full object-cover object-center"
          />
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-950">
                Human vs AI
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                In development
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              The same challenge, two perspectives. Live model duels are not
              available yet.
            </p>
          </div>
        </article>
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <img
            src="/images/coliseum_swarm_clash.jpg"
            alt="A human team facing a swarm of green shapes — a concept illustration"
            width={1376}
            height={768}
            loading="lazy"
            decoding="async"
            className="aspect-[2.8/1] w-full object-cover object-center"
          />
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-bold tracking-tight text-slate-950">
                Teams vs swarms
              </h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                In development
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Human teamwork against agent collectives. Networked team matches
              are not available yet.
            </p>
          </div>
        </article>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">Learn as you go.</span>{" "}
          Guided scenarios across the GSPC axes.
        </p>
        <Link
          href="/dashboard?tab=learn"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Open the learning arena{" "}
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
