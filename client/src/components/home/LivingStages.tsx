import { Link } from "wouter";
import { AXES, quotable } from "../../lib/gspcAxes";

/**
 * LivingStages — arena, colosseum, board as visual stages on the homepage.
 * Honest numbers only. No invented rounds. No sov-* chrome.
 */

const MEASURED = AXES.filter(quotable).length;

export default function LivingStages() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[#06140f] px-6 py-24 text-emerald-50">
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(16,185,129,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(251,191,36,0.12), transparent 35%)",
        }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-300">Council Space · AI vs AI</p>
            <h2 className="mt-3 text-4xl font-black">Night coverage.<br />Model versus model.</h2>
            <p className="mt-4 max-w-md text-emerald-100/75">
              Frozen provisions. Deterministic grade. Two subjects walk in. One predicate walks out. The public name is Council Space — never a private machine name.
            </p>
            <Link href="/gspc-arena" className="mt-6 inline-flex rounded-xl bg-emerald-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-400">
              Open Council Space
            </Link>
          </div>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl border border-emerald-500/20 bg-black/40 p-6">
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">subject a</p>
              <p className="mt-2 text-lg font-black">claude-3.5</p>
              <p className="mt-1 text-xs text-emerald-200/60">n=12 · lower bound</p>
            </div>
            <div className="text-center font-black text-amber-300">VS</div>
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200">subject b</p>
              <p className="mt-2 text-lg font-black">gpt-4o</p>
              <p className="mt-1 text-xs text-amber-100/60">n=12 · lower bound</p>
            </div>
            <div className="col-span-3 mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-[11px] text-emerald-200/80">
              EU-AIA-Art-5-1-c · social scoring · predicate, not a vote
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#140d06] px-6 py-24 text-amber-50">
        <div className="relative mx-auto max-w-6xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-amber-300">Colosseum · Human vs AI</p>
          <h2 className="mt-3 text-4xl font-black">Day surprise.<br />You walk in.</h2>
          <p className="mx-auto mt-4 max-w-xl text-amber-100/70">
            CITIZEN plays. MAYOR governs. RED attacks. Signed versus unsigned is the only promotion gate. Practice stays unsigned.
          </p>
          <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              { m: "CITIZEN", d: "Walk the city. Ask. Check a card." },
              { m: "MAYOR", d: "Set the quest. Hold the town to the instruments." },
              { m: "RED", d: "Try to break it. The harness records the attempt." },
            ].map((x) => (
              <div key={x.m} className="rounded-2xl border border-amber-400/25 bg-black/30 p-6">
                <p className="font-mono text-xs font-bold tracking-[0.2em] text-amber-300">{x.m}</p>
                <p className="mt-2 text-sm text-amber-100/70">{x.d}</p>
              </div>
            ))}
          </div>
          <a href="/os" className="mt-8 inline-flex rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-gray-900 hover:bg-amber-300">
            Play in the OS
          </a>
        </div>
      </section>

      <section className="bg-[#07130e] px-6 py-24 text-emerald-50">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-300">The board · signed cells</p>
              <h2 className="mt-3 text-4xl font-black">{MEASURED} measured × 22 models</h2>
              <p className="mt-3 max-w-lg text-emerald-100/70">
                A filled cell is a signed measurement. A dash is honest emptiness. Two public slots stay unmeasured — no score yet.
              </p>
            </div>
            <a href="/gspc-scoreboard" className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-emerald-400">
              Open the scoreboard
            </a>
          </div>
          <div className="mt-10 grid gap-1.5" style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}>
            {Array.from({ length: 15 * 8 }).map((_, n) => {
              const axis = n % 15;
              const filled = axis < MEASURED;
              return (
                <div
                  key={n}
                  className={`h-3 rounded-sm sm:h-4 ${filled ? "bg-emerald-400/80" : "border border-dashed border-white/20 bg-transparent"}`}
                />
              );
            })}
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/60">
            schematic of occupancy — not scores. live numbers live on the scoreboard.
          </p>
        </div>
      </section>
    </div>
  );
}
