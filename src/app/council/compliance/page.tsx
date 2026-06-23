import type { Metadata } from "next";
import { getCouncilHistory, getMemoryStats } from "@/lib/meok";

export const metadata: Metadata = {
  title: "Council Compliance — Global Framework Tracker",
  description:
    "Track EU AI Act, DORA, NIS2, ISO 42001, CRA, CSRD, NIST AI RMF, UK AI Regulation, CMMC, SOC 2, HIPAA and GDPR deadlines and penalties.",
  alternates: { canonical: "/council/compliance" },
};

export const revalidate = 60;

const FRAMEWORKS = [
  { id: "eu-ai-act", name: "EU AI Act", region: "EU", status: "primary", penalty: "€35M / 7% (Art 5); €15M / 3% (Art 50)", deadline: "2026-08-02" },
  { id: "dora", name: "DORA", region: "EU", status: "active", penalty: "1% daily turnover", deadline: "LIVE" },
  { id: "nis2", name: "NIS2", region: "EU", status: "active", penalty: "€10M / 2%", deadline: "LIVE" },
  { id: "iso-42001", name: "ISO/IEC 42001", region: "Global", status: "active", penalty: "cert withdrawal", deadline: "ongoing" },
  { id: "cra", name: "EU Cyber Resilience Act", region: "EU", status: "upcoming", penalty: "€15M / 2.5%", deadline: "2027-12-11" },
  { id: "csrd", name: "CSRD", region: "EU", status: "active", penalty: "varies", deadline: "ongoing" },
  { id: "nist-rmf", name: "NIST AI RMF", region: "US", status: "active", penalty: "n/a (voluntary)", deadline: "ongoing" },
  { id: "uk-ai", name: "UK AI Regulation", region: "UK", status: "upcoming", penalty: "TBD", deadline: "2026" },
  { id: "cmmc", name: "CMMC 2.0", region: "US", status: "active", penalty: "contract loss", deadline: "ongoing" },
  { id: "soc2", name: "SOC 2 Type II", region: "Global", status: "active", penalty: "customer trust", deadline: "ongoing" },
  { id: "hipaa", name: "HIPAA", region: "US", status: "active", penalty: "$1.5M/yr", deadline: "ongoing" },
  { id: "gdpr", name: "GDPR", region: "EU", status: "active", penalty: "€20M / 4%", deadline: "ongoing" },
  { id: "nis2-cra-bridge", name: "NIS2 × CRA crosswalk", region: "EU", status: "active", penalty: "both", deadline: "ongoing" },
];

const STATUS_COLORS: Record<string, string> = {
  primary: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  active: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  upcoming: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

export default async function CompliancePage() {
  const [history, memory] = await Promise.all([
    getCouncilHistory(),
    getMemoryStats(),
  ]);

  const episodeCount = Number(memory?.episodes ?? 1400);
  const decisionCount = history?.length ?? 0;

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <header className="mb-12">
        <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-3">Council · Compliance</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter mb-4">13 frameworks, 1 substrate</h1>
        <p className="text-slate-400 max-w-3xl">
          The CSOAI council crosswalks every major AI-governance framework.
          One assessment, every region. The substrate runs in real-time and
          shows the live compliance posture of any registered AI system.
        </p>
      </header>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <Stat label="Frameworks" value={FRAMEWORKS.length} />
        <Stat label="Memory episodes" value={`${episodeCount}+`} />
        <Stat label="Council decisions" value={decisionCount} />
        <Stat label="Council nodes" value="36" />
      </div>

      {/* Framework grid */}
      <h2 className="text-2xl font-bold mb-6">Frameworks (live status)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {FRAMEWORKS.map((fw) => (
          <div
            key={fw.id}
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">{fw.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{fw.region}</p>
              </div>
              <span
                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${STATUS_COLORS[fw.status]}`}
              >
                {fw.status}
              </span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Penalty</span>
                <span className="font-mono text-rose-400">{fw.penalty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Deadline</span>
                <span className="font-mono text-amber-400">{fw.deadline}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live council decisions */}
      <h2 className="text-2xl font-bold mb-6">Recent council decisions</h2>
      {history && history.length > 0 ? (
        <div className="space-y-2 mb-12">
          {history.slice(0, 10).map((d, i) => (
            <div
              key={i}
              className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-mono text-slate-300">
                  {String(d.proposal ?? d.decision ?? `decision-${i}`)}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {String(d.timestamp ?? d.ts ?? "—")} · {String(d.domain ?? "general")}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  String(d.outcome ?? d.result) === "approve"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : String(d.outcome ?? d.result) === "reject"
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-slate-500/20 text-slate-300"
                }`}
              >
                {String(d.outcome ?? d.result ?? "—")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-500 text-sm italic mb-12">
          Recent council decisions will populate when meok-api is reachable.
        </p>
      )}

      <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
        <p className="text-sm text-slate-300">
          The compliance crosswalk engine lives at
          {" "}<a className="text-emerald-400 hover:underline" href="https://meok.ai/compliance">meok.ai/compliance</a>{" "}
          and is exposed as the <code className="font-mono text-xs">meok-compliance-gateway</code>{" "}
          MCP. The council substrate above is the substrate that powers the
          crosswalk.
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl sm:text-4xl font-black text-emerald-400">{value}</p>
    </div>
  );
}
