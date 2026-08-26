import { EUNOMIA_AXES } from "@/data/eunomia";
import { FFW } from "@/data/enforcement";

/**
 * EUNOMIA catalog — the measurement ecosystem, catalogued and linked.
 * Every live surface, public API, HF mirror, A2A card, MCP tool and evidence
 * doc, with an honest status. Measurement, not certification.
 */
export default function EunomiaCatalog() {
  const measured = EUNOMIA_AXES.filter((a) => a.status === "MEASURED").length;
  const unmeasured = EUNOMIA_AXES.length - measured;

  const surfaces = [
    { name: "EUNOMIA board", href: "/eunomia", desc: "Financial-verification axes, signed, two-tier fleet" },
    { name: "First-Fine Watch", href: "/first-fine-watch", desc: "Signed enforcement record + the deadlines behind it (R8 free)" },
    { name: "EUNOMIA data (commercial)", href: "/eunomia-data", desc: "x402 data-only lane — enforcement record + deadline calendar" },
    { name: "Sectors", href: "/sectors", desc: "White-label tooling per sector" },
    { name: "Signed registers", href: "/registers", desc: "Every axis row Ed25519-signed, stranger re-derivable" },
  ];
  const apis = [
    { name: "GET /api/eunomia-data", href: "/api/eunomia-data", desc: "x402 0.02 USD/query · data-only, never scores" },
    { name: "GET /api/registers", href: "/api/registers", desc: "The signed financial-axis register (live DB)" },
  ];
  const hf = [
    { name: "gspc-board", href: "https://huggingface.co/datasets/csoai/gspc-board", desc: "Dataset · board rows" },
    { name: "gspc-bench-results", href: "https://huggingface.co/datasets/csoai/gspc-bench-results", desc: "Dataset · bench results" },
    { name: "gspc-governance-leaderboard", href: "https://huggingface.co/spaces/csoai/gspc-governance-leaderboard", desc: "Space · leaderboard" },
  ];
  const a2a = { name: "Agent card", href: "/.well-known/agent-card.json", desc: "A2A discovery — machine-readable" };
  const mcp = [
    "eunomia_axes", "eunomia_measure_axis", "eunomia_verify_card", "eunomia_crosswalk_articles",
    "eunomia_enforcement_record", "eunomia_first_fine_watch", "eunomia_sector_tile", "eunomia_claimguard_check",
  ];
  const evidence = [
    "01-technical-system-description", "02-governance-oversight-record", "03-monitoring-incident-log", "04-scope-constraints-statement",
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA — the measurement ecosystem, catalogued</h1>
      <p className="mt-1 text-sm text-emerald-300/80">
        {measured} of {EUNOMIA_AXES.length} axes measured · {unmeasured} declared UNMEASURED (honest) · every surface linked
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Measurement, not certification. Scores are never sold; regulators and the public get signed streams free (R8);
        the commercial lane is x402 <b>data-only</b>. Nothing here is claimed live unless an outsider can re-derive it.
      </p>

      <h2 className="mt-8 text-lg font-semibold">Live surfaces</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{surfaces.map((s) => (
        <a key={s.href} href={s.href} className="rounded-lg border border-emerald-400/20 bg-[#0d241b] p-3 text-sm hover:border-emerald-400/50">
          <div className="font-mono text-emerald-200">{s.name}</div>
          <div className="text-xs text-slate-400">{s.desc}</div>
          <div className="mt-1 font-mono text-[10px] text-slate-500">{s.href} · LIVE</div>
        </a>
      ))}</div>

      <h2 className="mt-8 text-lg font-semibold">Public APIs (the living DB)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{apis.map((a) => (
        <a key={a.href} href={a.href} className="rounded-lg border border-emerald-400/20 bg-[#0d241b] p-3 text-sm hover:border-emerald-400/50">
          <div className="font-mono text-emerald-200">{a.name}</div>
          <div className="text-xs text-slate-400">{a.desc}</div>
          <div className="mt-1 font-mono text-[10px] text-slate-500">200 · LIVE</div>
        </a>
      ))}</div>

      <h2 className="mt-8 text-lg font-semibold">Hugging Face mirrors</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">{hf.map((h) => (
        <a key={h.name} href={h.href} target="_blank" rel="noreferrer" className="rounded-lg border border-emerald-400/20 bg-[#0d241b] p-3 text-sm hover:border-emerald-400/50">
          <div className="font-mono text-emerald-200">{h.name}</div>
          <div className="text-xs text-slate-400">{h.desc}</div>
          <div className="mt-1 font-mono text-[10px] text-slate-500">public · 200</div>
        </a>
      ))}</div>

      <h2 className="mt-8 text-lg font-semibold">A2A</h2>
      <a href={a2a.href} className="mt-3 inline-block rounded-lg border border-emerald-400/20 bg-[#0d241b] p-3 text-sm hover:border-emerald-400/50">
        <div className="font-mono text-emerald-200">{a2a.name}</div>
        <div className="text-xs text-slate-400">{a2a.desc}</div>
        <div className="mt-1 font-mono text-[10px] text-slate-500">200 · LIVE</div>
      </a>

      <h2 className="mt-8 text-lg font-semibold">MCP tools (csoai-axis-engine)</h2>
      <div className="mt-3 rounded-xl border border-emerald-400/20 bg-[#0d241b] p-4">
        <div className="flex flex-wrap gap-2">{mcp.map((t) => (
          <span key={t} className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">{t}</span>
        ))}</div>
        <div className="mt-2 text-xs text-slate-400">Ready — publish gate: registry-name alignment (owner).</div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Evidence pack (ClaimGuard-clean)</h2>
      <div className="mt-3 flex flex-wrap gap-2">{evidence.map((e) => (
        <span key={e} className="rounded-full border border-slate-600/40 bg-slate-600/10 px-2 py-0.5 font-mono text-[10px] text-slate-400">{e}</span>
      ))}</div>

      <p className="mt-8 text-xs text-slate-400">
        signed by {FFW.signer} · {FFW.note} · verify any signed card free at <a href="/gspc-verify" className="text-emerald-300 underline">/gspc-verify</a>
      </p>
    </div>
  );
}
