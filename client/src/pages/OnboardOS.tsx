import { useEffect } from "react";
import { setMetaDescription } from "@/lib/utils";

// /start (and /onboard) — measure-and-verify activation.
// No persona triage, no assistant setup, no price gate. One clear path: describe
// your AI, we measure it on a frozen published instrument, you get a 3KB
// Ed25519-signed, hash-chained measurement card. Verify stays free.

const STEPS: { n: string; t: string; d: string }[] = [
  { n: "1", t: "Describe your AI", d: "One short form — what the system is and what it does. No account, no card details." },
  { n: "2", t: "We measure it", d: "Your system is graded on our own frozen, published instruments. Deterministic scoring, no model in the verdict path." },
  { n: "3", t: "Get your signed card", d: "A 3KB measurement card, Ed25519-signed and hash-chained. Verify it yourself — no need to ask us." },
];

export default function OnboardOS() {
  useEffect(() => {
    document.title = "Get a signed measurement card | Council of AI";
    setMetaDescription("Get an Ed25519-signed AI measurement card from the Council of AI (CSOAI LTD, UK 16939677). Measure against the GSPC board. Verify stays free. Measurement, not certification.");
  }, []);
  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="relative overflow-hidden mx-auto max-w-4xl px-6 pt-20 pb-10 text-center">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(800px 380px at 50% -10%, rgba(16,185,129,.20), transparent 60%)" }} />
        <p className="relative font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">Council of AI — start here</p>
        <h1 className="relative mt-3 text-4xl sm:text-5xl font-black tracking-tight">
          Get a signed<br />
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">measurement card.</span>
        </h1>
        <p className="relative mt-4 mx-auto max-w-2xl text-emerald-100/80">
          Describe your AI system and we measure how it behaves on our own published instruments. You get a
          3KB card — Ed25519-signed and hash-chained — that anyone can verify without asking us.
          Verify stays free. No account, no card details, no price gate. A grade is never sold.
        </p>
        <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="/assess" className="rounded-xl bg-emerald-500 px-7 py-3.5 text-base font-bold text-[#03110b] hover:bg-emerald-400">
            Get measured →
          </a>
          <a href="/gspc-verify" className="rounded-xl border border-emerald-400/40 px-7 py-3.5 text-base font-bold text-emerald-100 hover:bg-white/5">
            Verify a card
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 font-black text-[#03110b]">{s.n}</div>
              <div className="mt-3 text-base font-bold text-emerald-100">{s.t}</div>
              <p className="mt-1 text-sm text-emerald-100/75">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-black/20 p-5 text-sm text-emerald-100/75">
          Council of AI is a measurement body — we measure and sign, we do not certify. Verify stays free
          and loginless. A grade is never sold. <a href="/gspc-verify" className="font-semibold text-emerald-300 underline hover:text-emerald-200">Verify a card →</a>
        </div>
      </section>
    </div>
  );
}
