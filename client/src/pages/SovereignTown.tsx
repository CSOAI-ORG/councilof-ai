import { useEffect, useState } from "react";
import { fetchSovTownStats, formatCount, type SovTownStats } from "../data/sov-town-data";

const FALLBACK: SovTownStats = {
  episodes: 1_458_000_000,
  governedCrimes: 0,
  ungovernedCrimes: 120_500_000,
  modelsTrained: 112,
  hives: 28,
  passports: 29,
  macUpdated: "",
  vmUpdated: "",
};

export default function SovereignTown() {
  const [s, setS] = useState<SovTownStats>(FALLBACK);

  useEffect(() => {
    document.title = "Sovereign Town — Live Governed AI World · CSOAI";
    let live = true;
    fetchSovTownStats()
      .then((d) => {
        if (live && d && d.episodes > 0) setS(d);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const stats = [
    { value: formatCount(s.episodes) + "+", label: "Signed episodes" },
    { value: String(s.governedCrimes), label: "Governed crimes", good: true },
    { value: formatCount(s.ungovernedCrimes) + "+", label: "Ungoverned crimes" },
    { value: String(s.hives), label: "Autonomous hives" },
    { value: "140", label: "Personas" },
    { value: String(s.passports), label: "Ed25519 passports" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">
            The live argument for governed AI
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Sovereign Town</h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            A governed-vs-ungoverned agent world that proves — visually and cryptographically —
            why governance architecture decides whether multi-agent AI systems thrive or collapse.
            Every figure below is summed from a hash-chained Ed25519 ledger.
          </p>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 gap-5">
            {stats.map((st) => (
              <div
                key={st.label}
                className="rounded-2xl border border-white/15 bg-white/5 p-5 text-center"
              >
                <div
                  className={`text-3xl font-extrabold ${st.good ? "text-emerald-300" : "text-white"}`}
                >
                  {st.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-emerald-100/70">
                  {st.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="https://proofof.ai/sovereign-town"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-emerald-400 px-5 py-3 font-bold text-emerald-950 hover:bg-emerald-300"
            >
              Verify the chain →
            </a>
            <a
              href="mailto:nicholas@csoai.org?subject=Sovereign%20Town%20pilot"
              className="rounded-lg border border-emerald-300/50 px-5 py-3 font-semibold text-emerald-100 hover:bg-white/5"
            >
              Request a pilot
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 text-gray-700">
        <h2 className="text-2xl font-bold text-gray-900">Same agents. Two futures.</h2>
        <p className="mt-3 max-w-3xl">
          Toggle governance on or off and watch the identical population of 140 agents diverge.
          One side maintains commons, trust and legal boundaries; the other collapses into crime,
          scarcity and contagion. The simulation ingests live public data (EU aggregates, CISA KEV,
          OFAC SDN, UK Companies House PSC, FRED, FAOSTAT, EIA, NOAA) so stress events reflect the
          real economy, climate, threats and regulatory environment.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Research-grade, predictive output. Public data sources are cited and OGL-UK-3.0 /
          public-domain where applicable. Verify any passport offline at{" "}
          <a className="text-emerald-700 underline" href="https://proofof.ai/passport">
            proofof.ai/passport
          </a>
          .
        </p>
      </section>
    </div>
  );
}
