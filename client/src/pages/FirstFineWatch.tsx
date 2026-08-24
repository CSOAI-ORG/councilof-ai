import { FFW, FINES, DEADLINES } from "@/data/enforcement";

export default function FirstFineWatch() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">First-Fine Watch</h1>
      <p className="mt-1 text-sm text-emerald-300/80">signed · public enforcement record · R8 free</p>
      <p className="mt-2 text-xs text-slate-400">{FFW.note}</p>

      <div className="mt-6 rounded-xl border border-gold-400/30 bg-[#0d241b] p-5">
        <div className="font-mono text-lg text-emerald-300">{FFW.counter}</div>
        <div className="mt-1 text-sm text-slate-300">days since Art 101 GPAI fining powers live ({FFW.powersOn}): <b>{FFW.daysSincePowers}</b></div>
        <div className="mt-2 text-xs text-slate-500">signed by {FFW.signer}</div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Reported AI / AI-adjacent enforcement</h2>
      <table className="mt-3 w-full border-collapse text-sm">
        <thead><tr className="border-b border-slate-600 text-left text-xs uppercase text-slate-400">
          <th className="py-2">Actor</th><th>Regime</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>{FINES.map((f) => (
          <tr key={f.actor} className="border-b border-slate-700/50">
            <td className="py-2">{f.actor}</td><td className="text-slate-400">{f.regime}</td>
            <td className="font-mono text-emerald-300">{f.amount}</td><td className="text-slate-400">{f.status}</td></tr>
        ))}</tbody>
      </table>

      <h2 className="mt-8 text-lg font-semibold">Regulatory deadlines (the hook)</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{DEADLINES.map((d) => (
        <div key={d.name} className="rounded-lg border border-slate-600/40 bg-[#0d241b] p-3">
          <div className="font-mono text-emerald-300">{d.date}</div>
          <div className="text-sm text-slate-200">{d.name}</div>
          <div className="text-xs text-slate-400">{d.note}</div>
        </div>
      ))}</div>

      <p className="mt-8 text-xs text-slate-400">Free forever (R8). Commercial x402 gate is data-only, never scores.</p>
    </div>
  );
}
