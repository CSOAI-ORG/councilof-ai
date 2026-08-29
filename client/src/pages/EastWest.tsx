import { useEffect, useState } from "react";
import { Link } from "wouter";

type CrossBorderCard = {
  title?: string;
  measured_axes?: string;
  measurement?: string;
  regimes?: { regime: string; instrument: string; route?: string }[];
  verify?: string;
  not_a_certification?: boolean;
  content_id?: string;
};

export default function EastWest() {
  const [card, setCard] = useState<CrossBorderCard | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    document.title = "East-West — one signed measurement, every regime mapped | Council of AI";
    fetch("/signals/cross-border-card.signed.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setCard)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">East-West · M4 flagship</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-4xl">
          One signed measurement, <span className="text-emerald-300">every regime it touches, mapped.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-emerald-100/80">
          Cross-jurisdiction governance measurement with no score on the invoice. Regulators read the crosswalk free forever;
          determination stays with authorities. Verify any regime&apos;s evidence without asking us.
        </p>

        <div className="mt-6 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <strong>Determination stays with authorities.</strong> This surface maps obligations and publishes signed
          measurements. It is not a conformity mark, certificate, or legal opinion.
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <a href="/crosswalk/" className="rounded-2xl border border-emerald-500/25 bg-[#05140d] p-5 hover:border-emerald-400/50">
            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/70">M1 · Crosswalk canon</p>
            <p className="mt-2 font-bold">Framework crosswalk v1</p>
            <p className="mt-1 text-sm text-emerald-100/70">EU Art. 9–15 · UK DRCF · Illinois SB 315 · China GB/T</p>
          </a>
          <a href="/gspc-verify/" className="rounded-2xl border border-emerald-500/25 bg-[#05140d] p-5 hover:border-emerald-400/50">
            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/70">Stranger verify</p>
            <p className="mt-2 font-bold">Ed25519 verification</p>
            <p className="mt-1 text-sm text-emerald-100/70">Recompute content_id in-browser — no account, no fee</p>
          </a>
          <Link href="/challenge" className="rounded-2xl border border-emerald-500/25 bg-[#05140d] p-5 hover:border-emerald-400/50">
            <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/70">JC-D4 · Redress</p>
            <p className="mt-2 font-bold">Challenge a measurement</p>
            <p className="mt-1 text-sm text-emerald-100/70">Disputes answered with re-measurement, never assertions</p>
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <h2 className="text-xl font-black">Cross-border signed card</h2>
          <p className="mt-2 text-sm text-emerald-100/75">
            First East-West card: one GSPC measurement mapped across EU, UK, and US surfaces. Scores free to verify;
            crosswalk evidence packs are the sellable data layer.
          </p>
          {err && <p className="mt-4 text-sm text-rose-300">Card bundle not loaded ({err}). Live board: GET /api/gspc</p>}
          {card && (
            <div className="mt-4 space-y-3 text-sm">
              <p><span className="text-emerald-300/70">Title:</span> {card.title}</p>
              <p><span className="text-emerald-300/70">Measured:</span> {card.measured_axes}</p>
              <p><span className="text-emerald-300/70">Board:</span> <a className="underline" href={card.measurement}>{card.measurement}</a></p>
              {card.content_id && (
                <p className="font-mono text-[11px] text-emerald-300/60">content_id: {card.content_id.slice(0, 24)}…</p>
              )}
              <ul className="mt-2 space-y-1">
                {(card.regimes || []).map((r) => (
                  <li key={r.regime}>
                    <span className="font-bold text-emerald-200">{r.regime}</span> — {r.instrument}
                    {r.route && <> · <a className="underline" href={r.route}>evidence route</a></>}
                  </li>
                ))}
              </ul>
              {card.not_a_certification && (
                <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-emerald-200/90">
                  Measurement, not certification. {card.verify && <>Verify at <a className="underline" href={card.verify}>{card.verify}</a>.</>}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/api/gspc" className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-[#03110b] hover:bg-emerald-400">Live GSPC board →</a>
          <a href="/crosswalk/east-west-v1.json" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Machine-readable v1 JSON →</a>
          <Link href="/regulators/" className="rounded-xl border border-emerald-500/30 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-white/5">Regulator desk →</Link>
        </div>
      </div>
    </div>
  );
}
