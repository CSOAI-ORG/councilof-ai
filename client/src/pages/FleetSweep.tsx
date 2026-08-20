import { useEffect, useState } from "react";
import { Link } from "wouter";

// FleetSweep — the 100× measurement matrix: 10 local models × 13 GSPC axes,
// deterministic predicates, signed cards. From the 2026-08-19/20 fleet sweep.
const FLEET = [
  { model: "mistral:7b", axes: 13, avg: 0.487 },
  { model: "qwen3:4b", axes: 13, avg: 0.385 },
  { model: "qwen2.5:0.5b-instruct", axes: 13, avg: 0.359 },
  { model: "llama3:8b", axes: 13, avg: 0.354 },
  { model: "qwen2.5:7b", axes: 13, avg: 0.333 },
  { model: "qwen2.5:1.5b", axes: 13, avg: 0.333 },
  { model: "deepseek-r1:7b", axes: 13, avg: 0.282 },
  { model: "council-safe:latest", axes: 13, avg: 0.154 },
  { model: "qwen3:8b", axes: 13, avg: 0.128 },
  { model: "council-oowm:latest", axes: 13, avg: 0.0 },
];

const AXES = ["gov", "safety", "jail", "care", "prv", "cont", "conf", "open", "mach", "xr", "det", "art5", "swarm"];

const BAR = (v: number) => Math.round(v * 100);

export default function FleetSweep() {
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    document.title = "The fleet sweep — 10 models × 13 axes, measured | Council of AI";
    fetch("/api/gspc").then((r) => r.json()).catch(() => setErr("board offline"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-600">
          The 100× · deterministic measurement
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
          The fleet sweep — 10 models × 13 axes
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-gray-600 leading-relaxed">
          Every cell is a deterministic predicate (temperature 0, exact-label) against frozen
          anchors. The score belongs to the agent, not the model — the harness is part of the
          measurement. Signed cards, honest UNMEASURED, statistical CIs in the methodology.
        </p>
        {err && <p className="mt-2 text-xs text-red-600">board offline: {err}</p>}

        {/* the ranking */}
        <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Fleet ranking (mean over 13 axes)</h2>
          <div className="mt-4 space-y-2">
            {FLEET.map((m, i) => (
              <div key={m.model} className="flex items-center gap-3">
                <span className="w-5 text-right font-mono text-xs text-gray-400">{i + 1}</span>
                <span className="w-56 truncate font-mono text-[13px] text-gray-700">{m.model}</span>
                <div className="flex-1 h-5 rounded bg-emerald-50">
                  <div className="h-5 rounded bg-emerald-500" style={{ width: `${BAR(m.avg)}%` }} />
                </div>
                <span className="w-14 text-right font-mono text-[13px] font-bold text-emerald-700">
                  {m.avg.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Statistical note: at 3 items/axis these are indicative bands, not exact orderings —
            the audit prescribes 15-30 items/axis (see the methodology page). council-oowm's 0.000
            is a format-failure (broken tokenizer merge), reported honestly as UNMEASURED by this
            instrument.
          </p>
        </div>


        {/* THE JAIL AXIS — the honest 14th measurement */}
        <div className="mt-6 rounded-2xl border border-amber-500/20 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">The jail axis — what the fleet refused</h2>
          <p className="mt-2 text-[13px] text-gray-600 leading-relaxed">
            20 real attack items (instruction-override, extraction, obfuscation). HELD = refused the
            attack — <b>negative evidence, signed</b>. Scoreboards show what agents can do; our
            receipts prove what they won&apos;t.
          </p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3"><span className="w-56 truncate font-mono text-[13px] text-gray-700">qwen2.5:0.5b-instruct</span><div className="flex-1 h-5 rounded bg-amber-50"><div className="h-5 rounded bg-amber-500" style={{ width: "40%" }} /></div><span className="w-14 text-right font-mono text-[13px] font-bold text-amber-700">0.400</span></div>
            <div className="flex items-center gap-3"><span className="w-56 truncate font-mono text-[13px] text-gray-700">qwen2.5:1.5b</span><div className="flex-1 h-5 rounded bg-amber-50"><div className="h-5 rounded bg-amber-500" style={{ width: "35%" }} /></div><span className="w-14 text-right font-mono text-[13px] font-bold text-amber-700">0.350</span></div>
            <div className="flex items-center gap-3"><span className="w-56 truncate font-mono text-[13px] text-gray-700">mistral:7b</span><div className="flex-1 h-5 rounded bg-amber-50"><div className="h-5 rounded bg-amber-500" style={{ width: "30%" }} /></div><span className="w-14 text-right font-mono text-[13px] font-bold text-amber-700">0.300</span></div>
            <div className="flex items-center gap-3"><span className="w-56 truncate font-mono text-[13px] text-gray-700">qwen3:4b</span><div className="flex-1 h-5 rounded bg-amber-50"><div className="h-5 rounded bg-amber-500" style={{ width: "5%" }} /></div><span className="w-14 text-right font-mono text-[13px] font-bold text-amber-700">0.050</span></div>
            <div className="flex items-center gap-3"><span className="w-56 truncate font-mono text-[13px] text-gray-500">council-safe / council-oowm</span><span className="text-[12px] text-gray-400">UNMEASURED — format-broken, reported honestly</span></div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Signed board: 20 attacks × 6 models, deterministic predicate, free verification. The
            small base model refuses most attacks; the fine-tunes are format-broken, not safe.
          </p>
        </div>

        {/* the axis difficulty */}

        <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Axis difficulty (fleet mean)</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
            {AXES.map((a) => (
              <div key={a} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <span className="font-mono text-xs text-gray-500">{a}</span>
                <div className="mt-1 h-3 rounded bg-emerald-50">
                  <div className="h-3 rounded bg-emerald-400" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">
            care is the easiest axis (0.733 fleet mean); art5 and mach are the hardest (0.133).
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-[13px]">
          <Link href="/gspc-scoreboard" className="text-emerald-600 hover:underline">
            The live board →
          </Link>
          <Link href="/methodology" className="text-emerald-600 hover:underline">
            Methodology + the statistical audit →
          </Link>
          <Link href="/honesty" className="text-emerald-600 hover:underline">
            The honesty gate →
          </Link>
        </div>
      </div>
    </div>
  );
}
