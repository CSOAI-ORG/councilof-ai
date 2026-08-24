import { EUNOMIA_AXES, EUNOMIA_MEASURED_ON } from "@/data/eunomia";

/**
 * EUNOMIA — the financial-verification axis board.
 * Measurement, not certification. Only a MEASURED axis earns a number; the
 * exact-label score is Ed25519-signed and recompute-able. No invented metrics.
 */
export default function Eunomia() {
  const measured = EUNOMIA_AXES.filter((a) => a.status === "MEASURED");
  const total = EUNOMIA_AXES.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">EUNOMIA — the financial-verification board</h1>
      <p className="mt-1 text-sm text-emerald-300/80">
        {measured.length} of {total} axes measured · exact-label · Wilson CI · Ed25519-signed · recompute-able
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Measurement, not certification. Only a MEASURED axis earns a score; an UNMEASURED axis shows no number — never invented.
        Measured on {EUNOMIA_MEASURED_ON.date} with {EUNOMIA_MEASURED_ON.model}, signed by {EUNOMIA_MEASURED_ON.signer}.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {EUNOMIA_AXES.map((a) => (
          <div key={a.axis} className="rounded-xl border border-emerald-400/20 bg-[#0d241b] p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-emerald-200">{a.axis}</span>
              {a.status === "MEASURED" ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
                  MEASURED
                </span>
              ) : (
                <span className="rounded-full border border-slate-600/40 bg-slate-600/10 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                  {a.status}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">{a.instrument} · {a.seat}</p>
            <div className="mt-3 flex flex-col gap-1 font-mono text-sm">
              {a.status === "MEASURED" && a.strong ? (
                <>
                  <span><span className="text-emerald-300">{a.strong.acc.toFixed(3)}</span><span className="text-slate-500"> strong (7b)</span> <span className="text-slate-400">95% CI [{a.strong.ci[0].toFixed(3)}, {a.strong.ci[1].toFixed(3)}]</span></span>
                  <span><span className="text-slate-400">{a.baseline ? a.baseline.acc.toFixed(3) : "—"}</span><span className="text-slate-500"> baseline (0.5b)</span></span>
                </>
              ) : (
                <span className="text-slate-500">— no number until measured</span>
              )}
            </div>
            <p className="mt-2 text-[10px] font-mono text-slate-500">
              n={a.n} · labels: {a.labels.join(" / ")}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Verify any signed measurement card free at{" "}
        <a href="/gspc-verify" className="text-emerald-300 underline">/gspc-verify</a>. The full frozen item sets +
        harness are published in the engine monorepo — recompute any score rather than trust it.
      </p>
    </div>
  );
}
