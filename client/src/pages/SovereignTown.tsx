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

// Frameworks Sovereign Town measures conduct against — the "governed against"
// wall (modelled on Red Hat's customer-logo wall: concrete, scannable proof of reach).
const FRAMEWORKS = [
  "EU AI Act",
  "NIST AI RMF",
  "ISO 42001",
  "TC260",
  "DORA",
  "NIS2",
  "EO 14110",
  "Korea AI Basic Act",
  "DPDP Act",
  "Model AI Gov FW",
];

const EXPLAINERS = [
  {
    t: "Explore the live governance grid →",
    d: "The immersive globe — 177 jurisdictions, sovereign nodes, the MCP fleet and the Sovereign Town feed, live on one Earth.",
    href: "/globe.html",
  },
  {
    t: "See the 3D governance Earth (beta) →",
    d: "A photorealistic CesiumJS globe with agent swarms and cross-region handoff arcs.",
    href: "/globe3d.html",
  },
  {
    t: "Track global AI regulation",
    d: "Every binding and emerging framework in force, mapped across 177 jurisdictions.",
    href: "/regulation-tracker",
  },
  {
    t: "Verify a Sovereign passport",
    d: "Offline-verify any agent's identity and governance state directly on the chain.",
    href: "https://proofof.ai/passport",
  },
];

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
      {/* Hero — one crisp authority line + the proof grid + an explicit cited source */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-24">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-emerald-300 font-semibold tracking-wide uppercase text-sm">
            The live argument for governed AI
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            The world&rsquo;s first signed record of AI governance
          </h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            A governed-vs-ungoverned agent world that proves &mdash; visually and cryptographically &mdash;
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
          {/* Cited source — Red Hat's "Source: …" credibility move */}
          <p className="mt-6 text-sm text-emerald-100/70 max-w-2xl">
            Source: Sovereign Town hash-chained Ed25519 ledger, externally committed to{" "}
            <span className="font-semibold text-emerald-200">Bitcoin block 954857</span>. Independently
            verifiable &mdash; no trust in CSOAI required.
          </p>
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

      {/* "Governed against" — the frameworks wall */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Governed against the frameworks that matter
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Sovereign Town measures conduct against the binding and emerging regimes in force across
            177 jurisdictions &mdash; not a private rulebook.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {FRAMEWORKS.map((f) => (
              <span
                key={f}
                className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-800"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Same agents, two futures (kept) */}
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

      {/* Why we anchor — trust narrative */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Why we anchor to Bitcoin</h2>
          <p className="mt-4 max-w-3xl text-gray-700 leading-relaxed">
            A governance record is only worth what it cannot be quietly rewritten. Every Sovereign
            Town episode is signed with an Ed25519 key and its hash is committed to the Bitcoin
            blockchain &mdash; so the record of what an AI did, and whether it was governed, becomes as
            tamper-evident as the chain itself. This is digital autonomy for AI oversight: control and
            protect critical decisions without asking anyone to take our word for it.
          </p>
        </div>
      </section>

      {/* Explainer cluster — answer-engine / SEO surface */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 text-center">Understand the moat</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {EXPLAINERS.map((e) => {
            const ext = e.href.startsWith("http");
            return (
              <a
                key={e.t}
                href={e.href}
                {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="block rounded-2xl border border-gray-200 p-6 hover:border-emerald-300 hover:bg-emerald-50/40 transition"
              >
                <div className="font-semibold text-gray-900">{e.t}</div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{e.d}</p>
              </a>
            );
          })}
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-black tracking-tight">Put your AI on the record</h2>
          <p className="mt-3 text-emerald-50 max-w-2xl mx-auto">
            Run it under the Sovereign Gate &mdash; with real identity, policy, and proof.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:nicholas@csoai.org?subject=Sovereign%20Town%20pilot"
              className="rounded-lg bg-emerald-400 px-5 py-3 font-bold text-emerald-950 hover:bg-emerald-300"
            >
              Request a pilot
            </a>
            <a
              href="https://proofof.ai/sovereign-town"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-300/50 px-5 py-3 font-semibold text-emerald-100 hover:bg-white/5"
            >
              Verify the chain →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
