import { useEffect, useState } from "react";
import { fetchSovTownStats, formatCount, type SovTownStats } from "../data/sov-town-data";
import { fetchOracleFleet, getFeed, subscribeBus, BUS, type OracleFleet } from "../lib/sovDataBus";

// Oracle fleet strip — the free substrate's heartbeat, rendered honestly inside
// the Towns layer: harvester, govbench, evac state, ollama, disk. OFFLINE is a
// first-class state, never a fabricated fleet.
function OracleFleetStrip() {
  const [, force] = useState(0);
  useEffect(() => {
    const un = subscribeBus(() => force((x) => x + 1));
    fetchOracleFleet();
    const t = setInterval(fetchOracleFleet, 60_000);
    return () => { un(); clearInterval(t); };
  }, []);
  const feed = getFeed<OracleFleet>(BUS.oracleFleet);
  const f = feed.data;
  return (
    <div className="mx-auto max-w-5xl px-6 -mt-4 mb-6">
      <div className="rounded-2xl border border-sky-500/25 bg-[#05140d] px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[2px] text-sky-300/70">
          <span className={"inline-block h-1.5 w-1.5 rounded-full " + (feed.source === "live" ? "bg-sky-400" : "bg-rose-400/70")} />
          Oracle fleet · {feed.source}
          {feed.fetchedAt && <span className="text-sky-300/45">· {new Date(feed.fetchedAt).toLocaleTimeString()}</span>}
        </div>
        {f ? (
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-sky-100/75">
            {/* host id is an internal machine name — never shown raw on a public surface */}
            <span>host: measure-node</span>
            <span>evac: {f.feeds?.gcp_evac?.state}</span>
            <span>ollama: {f.feeds?.ollama?.models_loaded ?? 0} model{(f.feeds?.ollama?.models_loaded ?? 0) === 1 ? "" : "s"}</span>
            <span>disk free: {Math.round((f.disk_free_mb?.root ?? 0) / 1024)}G + {Math.round((f.disk_free_mb?.evac_bulk ?? 0) / 1024)}G bulk</span>
            <span>cron: {f.cron_jobs}</span>
            {f.feeds?.airbench_harvester?.last && <span className="text-sky-300/55">harvester: {f.feeds.airbench_harvester.last.slice(0, 60)}</span>}
          </div>
        ) : (
          <div className="mt-1.5 text-[11px] text-sky-300/50">fleet unreachable — rendered as OFFLINE, not simulated</div>
        )}
      </div>
    </div>
  );
}

const FALLBACK: SovTownStats = {
  episodes: 1_458_000_000,
  governedCrimes: 0,
  ungovernedCrimes: 120_500_000,
  modelsTrained: 112,
  hives: 28,
  passports: 29,
  macUpdated: "",
  vmUpdated: "",
  source: "last-known",
  fetchedAt: "",
};

// Frameworks Council Town measures conduct against — the "governed against"
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
    d: "The immersive globe — 177 jurisdictions, council nodes, the MCP fleet and the Council Town feed, live on one Earth.",
    href: "/globe3d.html",
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
    // proofof.ai now lands on the councilof.ai homepage — no passport verifier
    // answers there. Point at the verifier that actually exists and say what it
    // verifies (signed measurement cards), not what it does not (passports).
    t: "Verify a signed measurement card",
    d: "Recompute a published card's hash and check its Ed25519 signature in the browser — no login. Agent-passport verification is not republished yet.",
    href: "/gspc-verify",
  },
];

export default function CouncilTown() {
  const [s, setS] = useState<SovTownStats>(FALLBACK);

  useEffect(() => {
    document.title = "Council Town — Live Governed AI World · CSOAI";
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
    // No typed counts: "140 Personas" was a hardcoded string with no feed field
    // behind it. models_trained IS a feed field, so it earns the tile instead.
    { value: String(s.modelsTrained), label: "Models trained" },
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
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
            The world&rsquo;s first signed record of AI governance
          </h1>
          <p className="mt-5 text-lg text-emerald-50 max-w-2xl">
            A governed-vs-ungoverned agent world that proves &mdash; visually and cryptographically &mdash;
            why governance architecture decides whether multi-agent AI systems thrive or collapse.
            Every figure below is summed from a hash-chained Ed25519 ledger.
          </p>
          {/* Honesty bar: the feed state is part of the figure. */}
          <p className="mt-3 text-xs">
            {s.source === "live" ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 font-bold uppercase tracking-wider text-emerald-300">live feed · fetched {s.fetchedAt ? new Date(s.fetchedAt).toLocaleString() : "just now"}</span>
            ) : s.source === "partial" ? (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-bold uppercase tracking-wider text-amber-300">partial feed — some sources offline</span>
            ) : (
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 font-bold uppercase tracking-wider text-amber-300">last-known figures — live feed offline</span>
            )}
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
            Source: Council Town hash-chained Ed25519 ledger. External{" "}
            <span className="font-semibold text-emerald-200">Bitcoin/OpenTimestamps anchoring is
            planned, not yet live</span> &mdash; today the ledger is verifiable offline against the
            published key.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {/* "Verify the chain -> proofof.ai/towns" was a loop: that host 301s to
                councilof.ai/towns, which 308s back to THIS page. Until the ledger
                endpoint is republished there is nothing to verify against, and the
                surface says so instead of sending the reader in a circle. */}
            <span className="rounded-lg border border-amber-300/50 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-amber-100">
              Chain verification: not yet available — the towns ledger endpoint is offline, so
              there is no live chain to check. Figures above are last-known and labelled.
            </span>
            <a
              href="mailto:nicholas@csoai.org?subject=Council%20Town%20pilot"
              className="rounded-lg border border-emerald-300/50 px-5 py-3 font-semibold text-emerald-100 hover:bg-white/5"
            >
              Request a pilot
            </a>
          </div>
        </div>
      </section>

      <OracleFleetStrip />

      {/* "Governed against" — the frameworks wall */}
      <section className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Governed against the frameworks that matter
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Council Town measures conduct against the binding and emerging regimes in force across
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
          The simulation runs the identical agent population twice — once governed, once
          ungoverned. One side maintains commons, trust and legal boundaries; the other collapses
          into crime, scarcity and contagion. The simulation ingests live public data (EU
          aggregates, CISA KEV, OFAC SDN, UK Companies House PSC, FRED, FAOSTAT, EIA, NOAA) so
          stress events reflect the real economy, climate, threats and regulatory environment.
          The interactive toggle world itself is not embedded on this page — what you are reading
          here is its signed ledger record, and this page says so rather than miming a control
          that is not wired.
        </p>
        <p className="mt-6 text-sm text-gray-500">
          Research-grade, predictive output. Public data sources are cited and OGL-UK-3.0 /
          public-domain where applicable. What is verifiable today is a signed measurement card at{" "}
          <a className="text-emerald-700 underline" href="/gspc-verify">
            /gspc-verify
          </a>
          ; passport verification is not republished yet.
        </p>
      </section>

      {/* Why we anchor — trust narrative */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900">Why we hash-chain the ledger</h2>
          <p className="mt-4 max-w-3xl text-gray-700 leading-relaxed">
            A governance record is only worth what it cannot be quietly rewritten. Every Council
            Town episode is signed with an Ed25519 key and its hash is SHA-256-linked into a
            tamper-evident chain &mdash; so the record of what an AI did, and whether it was governed,
            is checkable offline against the published key. External Bitcoin/OpenTimestamps
            time-anchoring is planned, not yet live. This is digital autonomy for AI oversight:
            control and protect critical decisions without asking anyone to take our word for it.
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

      {/* Compliance tooling launcher — ties the live demo together */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center">Compliance tooling</h2>
          <p className="mt-3 text-center text-gray-600 max-w-2xl mx-auto">
            The governance moat, made operational — standards interoperability, continuous evidence, and the live grid.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "OSCAL Studio", d: "Import/export NIST OSCAL — FedRAMP 20x ready.", href: "/oscal" },
              { t: "Evidence Hub", d: "Continuous, automated compliance evidence.", href: "/evidence-rail" },
              { t: "Live governance grid", d: "The immersive globe across 177 jurisdictions.", href: "/globe3d.html" },
              { t: "3D governance Earth", d: "Photorealistic CesiumJS globe (beta).", href: "/globe3d.html" },
            ].map((x) => (
              <a key={x.t} href={x.href} className="block rounded-2xl border border-gray-200 bg-white p-5 hover:border-emerald-300 hover:bg-emerald-50/40 transition">
                <div className="font-semibold text-gray-900">{x.t} →</div>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{x.d}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl font-black tracking-tight">Put your AI on the record</h2>
          <p className="mt-3 text-emerald-50 max-w-2xl mx-auto">
            Run it under the Council Gate &mdash; with real identity, policy, and proof.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="mailto:nicholas@csoai.org?subject=Council%20Town%20pilot"
              className="rounded-lg bg-emerald-400 px-5 py-3 font-bold text-emerald-950 hover:bg-emerald-300"
            >
              Request a pilot
            </a>
            <a
              href="/gspc-verify"
              className="rounded-lg border border-emerald-300/50 px-5 py-3 font-semibold text-emerald-100 hover:bg-white/5"
            >
              Verify a signed measurement card →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
