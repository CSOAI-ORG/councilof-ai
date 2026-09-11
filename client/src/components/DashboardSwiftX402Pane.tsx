import { lazy, Suspense } from "react";

const OsPanels = lazy(() => import("@/components/OsPanels"));
const StablecoinReadinessView = lazy(() => import("@/components/StablecoinReadinessView"));

/**
 * Council OS tab — SWIFT census + x402 doors (owner stranger-walk 6 Sep 2026).
 * Stranger path: /os?lobby=swift → /dashboard?tab=swift.
 * Figures come from live GET only (OsPanels). Challenge amounts live at the 402 —
 * never typed on this page (ownerRuling 6 Sep).
 */
export default function DashboardSwiftX402Pane() {
  return (
    <div className="space-y-6 p-6" data-testid="os-door-swift-x402">
      <div>
        <h2 className="text-xl font-bold text-slate-900">SWIFT census + x402 doors</h2>
        <p className="mt-1 text-sm text-slate-600">
          Readers only — SWIFT (<code>GET /api/swift</code>) and XRPL (<code>GET /api/xrpl</code>) cite
          live fields, never typed. SWIFT is TARGETS/coverage, not clients; measured stays empty until a
          frozen run lands. Board scores stay <code>GET /api/gspc</code> only.
        </p>
      </div>
      <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">Loading panels…</div>}>
        <OsPanels />
      </Suspense>
      <Suspense fallback={<div className="py-8 text-center text-sm text-slate-500">Loading stablecoin readiness…</div>}>
        <StablecoinReadinessView />
      </Suspense>
      <section className="rounded-2xl border border-slate-200 bg-white p-4" data-testid="os-x402-doors">
        <h3 className="text-sm font-semibold text-slate-800">x402 — live Base · verify free</h3>
        <p className="mt-1 text-[13px] text-slate-600">
          Discovery <code>/.well-known/x402.json</code> mode live · Base <code>eip155:8453</code> · payTo
          merchant ≠ payer. Free door amount 0 stays free. <code>settled_usdc</code> stays null until an
          EDGE non-self settle. Self-settle is not revenue. A grade is never sold.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a className="rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-900" href="/gspc-verify">Verify (free)</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/api/free-door">/api/free-door · amount 0</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/.well-known/x402.json">x402 discovery</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/api/x402">/api/x402 catalog</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/api/swift">/api/swift reader</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/api/xrpl">/api/xrpl reader</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/pay">/pay desk</a>
          <a className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800" href="/interop/x402-challenge/">x402-challenge</a>
        </div>
      </section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4" data-testid="os-x402-metamask-next">
        <h3 className="text-sm font-semibold text-slate-800">MetaMask next — estate EDGE doors</h3>
        <p className="mt-1 text-[13px] text-slate-600">
          Open each door for its live 402 challenge — amounts live at the 402, never typed here.
          Payer must ≠ payTo. Self-wallet settles are receipts, not revenue. Free-door is skipped on
          purpose.
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px] text-slate-800">
          <li>
            <a className="font-semibold text-emerald-800 underline" href="/api/request-attestation?subject=demo">/api/request-attestation</a>
            {" "}· issuance · amount at 402
          </li>
          <li>
            <a className="font-semibold text-emerald-800 underline" href="/api/proof?bundle=1">/api/proof?bundle=1</a>
            {" "}· assembly · amount at 402
          </li>
          <li>
            <a className="font-semibold text-emerald-800 underline" href="/api/eunomia-data?feed=1">/api/eunomia-data?feed=1</a>
            {" "}· assembly · amount at 402
          </li>
          <li>
            <a className="font-semibold text-emerald-800 underline" href="/api/rwa/evidence?asset=RLUSD">/api/rwa/evidence?asset=RLUSD</a>
            {" "}· issuance · amount at 402
          </li>
          <li>
            <a className="font-semibold text-emerald-800 underline" href="/api/receipts/batch">/api/receipts/batch</a>
            {" "}· assembly · amount at 402
          </li>
        </ol>
      </section>
    </div>
  );
}
