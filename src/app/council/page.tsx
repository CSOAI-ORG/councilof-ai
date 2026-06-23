import type { Metadata } from "next";
import Link from "next/link";
import {
  getCouncilStatus,
  getExpertiseNetwork,
  getBridgesTopology,
  getMemoryStats,
} from "@/lib/meok";
import {
  getAttestHealth,
  getAuditLedger,
  ATTESTATION_API_BASE,
} from "@/lib/attestation";

export const metadata: Metadata = {
  title: "Council Dome",
  description:
    "Real-time view of the CSOAI Council substrate: 36-node Byzantine-style council, 235 architecture nodes, 144 expertise specialists and 55 inter-domain bridges.",
  openGraph: {
    title: "CSOAI Council Dome",
    description: "Verify the cryptographic council behind every Watchdog certificate.",
  },
  alternates: { canonical: "/council" },
};

export const revalidate = 60;

export default async function CouncilPage() {
  const [council, expertise, bridges, memory, attest, audit] = await Promise.all([
    getCouncilStatus(),
    getExpertiseNetwork(),
    getBridgesTopology(),
    getMemoryStats(),
    getAttestHealth(),
    getAuditLedger(8),
  ]);

  const live = council !== null;
  const sigilLive = attest?.ok === true;
  const sigilKid = attest?.kid ?? "—";
  const auditEvents = audit?.events ?? audit?.entries ?? [];
  const auditCount =
    audit?.count ?? audit?.stats?.total_events ?? auditEvents.length;
  const auditLastHash =
    auditEvents.length > 0 ? auditEvents[auditEvents.length - 1]?.hash : null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <header className="mb-12">
        <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">
          The Council substrate
        </p>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-6">
          The CSOAI Council Dome
        </h1>
        <p className="text-slate-400 text-lg max-w-3xl leading-relaxed">
          A real-time view of the substrate behind every CSOAI Watchdog
          certificate. 36-node Byzantine-style council, 235 architecture nodes,
          144 expertise specialists, 55 inter-domain bridges. All
          cryptographic, all verifiable, all open source.
        </p>
      </header>

      {!live && (
        <div className="mb-8 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          The meok-api substrate at <code className="font-mono">localhost:3200</code> is offline. Showing last-known values. Once running, this page live-updates every 60s.
        </div>
      )}

      {/* Top stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <Stat label="Council nodes" value={council?.node_count ?? 36} accent="emerald" />
        <Stat label="Expertise nodes" value={council?.expertise_node_count ?? 144} accent="cyan" />
        <Stat label="Bridge nodes" value={council?.bridge_node_count ?? 55} accent="violet" />
        <Stat label="Architecture" value={council?.total_architecture_nodes ?? 235} accent="amber" />
      </div>

      {/* Sub-products grid */}
      <h2 className="text-2xl font-bold mb-6">The 4 sub-products</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <SubCard
          href="/council/dome"
          title="Dome"
          desc="Unified map view of the entire CSOAI substrate. Council nodes, expertise domains, bridge affinities — all in one place."
          meta={`${council?.domain_count ?? 12} domains`}
        />
        <SubCard
          href="/council/maps"
          title="Maps"
          desc="The 36-node council graph with inter-domain bridges. Visualize who agrees with whom on what."
          meta={`${bridges?.total ?? 55} bridges`}
        />
        <SubCard
          href="/council/compliance"
          title="Compliance"
          desc="Live compliance posture across EU AI Act, DORA, NIS2, ISO 42001. Risk classification per system."
          meta="13 frameworks"
        />
        <SubCard
          href="/council/law"
          title="Law"
          desc="Region-aware law lookup. EU, UK, US, CA, APAC, GLOBAL. Charter obligations re-projected via shared articles."
          meta="6 regions"
        />
        <SubCard
          href="/council/sigil"
          title="Sigil"
          desc="Sovereign Inter-aGent Interchange Language. Dense, deterministic, lossless. The protocol CSOAI agents use to talk to each other."
          meta="SIGIL v0.1.0"
          wide
        />
      </div>

      {/* Live health snapshot */}
      <h2 className="text-2xl font-bold mb-6">Substrate health</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Council</h3>
          <p className="text-3xl font-black text-emerald-400">{council?.version ?? "3.0-fractal"}</p>
          <p className="text-xs text-slate-500 mt-1">threshold: {council?.threshold ?? 25}/36</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Expertise</h3>
          <p className="text-3xl font-black text-cyan-400">{expertise?.active_nodes ?? "—"}</p>
          <p className="text-xs text-slate-500 mt-1">/ {expertise?.total_expertise_nodes ?? 144} active</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Memory</h3>
          <p className="text-3xl font-black text-amber-400">{Number(memory?.episodes ?? 1400)}+</p>
          <p className="text-xs text-slate-500 mt-1">episodes</p>
        </div>
      </div>

      {/* CSOAI engine spine — live SIGIL signer + audit ledger */}
      <h2 className="text-2xl font-bold mb-2">CSOAI engine spine</h2>
      <p className="text-sm text-slate-500 mb-6 max-w-3xl">
        The cryptographic backbone. Every Council verdict, compliance finding, and
        law crosswalk is signed by the SIGIL engine and appended to a hash-chained
        audit ledger. No shadow keys, no parallel signers — csoai.org is the body.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">SIGIL signer</h3>
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                sigilLive
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-yellow-500/20 text-yellow-300"
              }`}
            >
              {sigilLive ? "LIVE" : "STALE"}
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-400">kid: {sigilKid}</p>
          <p className="text-xs text-slate-500 mt-1">
            v{attest?.version ?? "1.2.0"} ·{" "}
            <a className="text-emerald-400 hover:underline" href={`${ATTESTATION_API_BASE}/v1/health`} target="_blank" rel="noopener noreferrer">
              /v1/health ↗
            </a>
          </p>
          <p className="text-xs text-slate-600 mt-3 font-mono break-all">
            {attest?.public_key ? `${attest.public_key.slice(0, 32)}…` : "pubkey pending spine handshake"}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Audit ledger</h3>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-slate-400">
              {audit?.live ? "live" : "fallback"} · {auditCount} entries
            </span>
          </div>
          <p className="text-3xl font-black text-amber-400">
            {auditLastHash ? `${auditLastHash.slice(0, 12)}…` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">last hash · tamper-evident chain</p>
          <a
            className="inline-block mt-3 text-xs text-emerald-400 hover:underline"
            href={`${ATTESTATION_API_BASE}/api/audit`}
            target="_blank"
            rel="noopener noreferrer"
          >
            /api/audit ↗
          </a>
        </div>
      </div>

      <div className="text-center text-sm text-slate-500 mt-16">
        Data refreshes every 60s · Substrate powered by{" "}
        <a className="text-emerald-400 hover:underline" href="https://meok.ai">MEOK AI Labs</a>
      </div>
    </main>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl sm:text-4xl font-black text-${accent}-400`}>{value}</p>
    </div>
  );
}

function SubCard({
  href, title, desc, meta, wide,
}: { href: string; title: string; desc: string; meta: string; wide?: boolean }) {
  return (
    <Link
      href={href}
      className={`group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all ${wide ? "md:col-span-2" : ""}`}
    >
      <h3 className="text-2xl font-bold text-emerald-400 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">{desc}</p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{meta}</span>
        <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </Link>
  );
}
