import { FINES, DEADLINES, FFW } from "@/data/enforcement";

export default function EunomiaData() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA Data — commercial enforcement feed</h1>
      <p className="mt-1 text-sm text-emerald-300/80">x402 · data-only · never scores, never ranked</p>
      <p className="mt-2 text-xs text-slate-400">This is the lawful <b>commercial</b> lane — insurers, bond desks, vendors buy <b>data</b> (the signed enforcement record + deadline calendar) per query. Regulators + the public get the signed stream <b>free</b> at <a href="/first-fine-watch" className="text-emerald-300 underline">/first-fine-watch</a> (R8).</p>

      <div className="mt-6 rounded-xl border border-emerald-400/25 bg-[#0d241b] p-5 font-mono text-sm">
        <div className="text-slate-400">GET /api/eunomia-data</div>
        <div className="mt-1 text-emerald-300">lane: commercial-data · kind: x402 · price: 0.02 USD/query</div>
        <div className="text-xs text-slate-500">data_only: true — never a score, never a rank</div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Enforcement record (data)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{FINES.map((f) => (
        <div key={f.actor} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-3 text-sm">
          <div className="text-slate-200">{f.actor}</div>
          <div className="text-xs text-slate-400">{f.regime} · {f.status}</div>
          <div className="font-mono text-emerald-300">{f.amount}</div>
        </div>
      ))}</div>

      <h2 className="mt-8 text-lg font-semibold">Deadline calendar (data)</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{DEADLINES.map((d) => (
        <div key={d.name} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-3 text-sm">
          <div className="font-mono text-emerald-300">{d.date}</div><div className="text-slate-200">{d.name}</div>
        </div>
      ))}</div>

      <p className="mt-8 text-xs text-slate-400">signed by {FFW.signer} · data · {FFW.note}</p>
    </div>
  );
}
