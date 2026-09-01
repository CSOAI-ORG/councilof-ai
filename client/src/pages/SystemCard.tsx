import { useEffect, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";

// Signed AI System Card — the independent, cryptographically-signed, OFFLINE-verifiable
// record that an AI system was governed. The primitive UK JSP 936 assurance (and the
// Alan Turing Institute) named as missing: nobody ships a tamper-evident System Card.
// CSOAI does. Live on the sovereign signing backend (/api/systemcard + /verify).

const GW = "/api";
// Keep substrate codenames off the public UI.
function clean(s: any): string { return typeof s === "string" ? s.replace(/defoneos/gi, "CSOAI") : String(s ?? ""); }

type Card = any;

export default function SystemCard() {
  const [card, setCard] = useState<Card | null>(null);
  const [sig, setSig] = useState<{ canonical: string; signature: string; publicKey: string; sha256: string; fingerprint: string } | null>(null);
  const [issuing, setIssuing] = useState(false);
  const [verify, setVerify] = useState<null | { state: "ok" | "bad"; msg: string; mode: "verify" | "tamper" }>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => { document.title = "Signed AI System Card — prove it, verify it offline | CSOAI"; }, []);

  async function issue() {
    setIssuing(true); setCard(null); setSig(null); setVerify(null); chargeSovereign(8);
    try {
      const r = await fetch(GW + "/systemcard");
      if (r.ok) {
        const d = await r.json();
        setCard(d.card);
        setSig({ canonical: d.canonical, signature: d.signature, publicKey: d.publicKey, sha256: d.sha256, fingerprint: d.fingerprint });
      }
    } catch (e) {}
    setIssuing(false);
  }

  async function doVerify(tamper: boolean) {
    if (!sig) return;
    setVerifying(true); setVerify(null);
    const message = tamper ? sig.canonical.slice(0, -4) + "ZZZZ" : sig.canonical;
    try {
      const r = await fetch(GW + "/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, signature: sig.signature, publicKey: sig.publicKey }) });
      const d = await r.json();
      const ok = !!d.valid;
      setVerify({ state: ok ? "ok" : "bad", msg: clean(d.message || (ok ? "verified" : "rejected")), mode: tamper ? "tamper" : "verify" });
    } catch (e) { setVerify({ state: "bad", msg: "could not reach the verifier", mode: tamper ? "tamper" : "verify" }); }
    setVerifying(false);
  }

  const ov = card?.overview || {};
  const cou = card?.concept_of_use || {};
  const saf = card?.safety || {};
  const sd = card?.system_detail || {};
  const ev = sd?.evaluation || {};
  const sec = card?.security || {};

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      {/* Hero */}
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · signed assurance</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Prove any AI was governed. <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Verify it offline. Forever.</span></h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Assurance regimes — UK <b className="text-emerald-200">JSP 936</b>, the EU AI Act, NIST — all require proof that a
            high-risk AI system was governed across its lifecycle. But there's a missing primitive: an <b className="text-emerald-200">independent,
            tamper-evident record</b> anyone can verify without trusting a vendor's dashboard. Consultancies sell assurance as a
            service; <b className="text-emerald-200">no commercial assurance vendor we've found ships a tamper-evident, cryptographic System Card.</b> CSOAI does.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["Defence & CNI", "Government", "Fortune 500 CISO", "Regulators & NIST", "High-risk AI suppliers"].map((t) => (
              <span key={t} className="rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-100/80">{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* Step 1 — issue */}
        <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-emerald-200">1 · Issue a signed System Card</div>
              <div className="text-[13px] text-emerald-100/70">A live, Ed25519-signed card (JSP 936 assurance domains + DAIC / Turing System Card template). Demo data is synthetic; the signing is real.</div>
            </div>
            <button onClick={issue} disabled={issuing} className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{issuing ? "Signing…" : card ? "↻ Re-issue" : "▶ Issue a signed card"}</button>
          </div>
        </div>

        {card && sig && (
          <>
            {/* Card body */}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2 rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-lg font-black text-emerald-50">{clean(ov.name)}</div>
                  <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">{clean(card.classification)}</span>
                </div>
                <div className="mt-1 text-[13px] text-emerald-100/70">{clean(ov.summary)} · <span className="text-emerald-300/70">{clean(ov.supplier)}</span></div>
                {card.jsp936 && <div className="mt-3 rounded-lg border border-emerald-500/15 bg-black/20 px-3 py-2 text-[12px] text-emerald-100/80">{clean(card.jsp936)}</div>}
              </div>
              <Panel title="Concept of use">
                <div className="text-[13px] text-emerald-100/85"><b>Intended:</b> {clean(cou.intended_use)}</div>
                <div className="mt-1 text-[13px] text-emerald-100/85"><b>Oversight:</b> {clean(cou.human_oversight)}</div>
                {Array.isArray(cou.out_of_scope) && <ul className="mt-2 space-y-1 text-[12px] text-rose-100/80">{cou.out_of_scope.map((o: string, i: number) => <li key={i} className="flex gap-2"><span className="text-rose-400">✕</span>{clean(o)}</li>)}</ul>}
              </Panel>
              <Panel title="Safety hard-stops">
                {Array.isArray(saf.hard_stops) && <ul className="space-y-1 text-[12px] text-emerald-100/85">{saf.hard_stops.map((h: string, i: number) => <li key={i} className="flex gap-2"><span className="text-emerald-400">■</span>{clean(h)}</li>)}</ul>}
                <div className="mt-2 text-[12px] text-emerald-300/70">care-floor {saf.care_floor} · {clean(saf.council)}</div>
              </Panel>
              <Panel title="Evaluation">
                <div className="text-[13px] text-emerald-100/85">top-1 (synthetic): <b className="text-emerald-200">{ev.top1_synthetic}</b></div>
                <div className="text-[13px] text-emerald-100/85">false-negative: <b className="text-emerald-200">{ev.false_negative_rate_synthetic}</b></div>
                <div className="mt-1 text-[12px] text-emerald-300/70">last evaluated {clean(ev.last_evaluated)}</div>
              </Panel>
              <Panel title="Security & residency">
                <div className="text-[13px] text-emerald-100/85">{clean(sec.integrity)}</div>
                <div className="mt-1 text-[12px] text-emerald-300/70">residency {clean(sec.data_residency)} · PII {clean(sec.pii)}</div>
              </Panel>
            </div>

            {/* Crypto block */}
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-black/30 p-5 font-mono text-[11px]">
              <div className="mb-2 text-[10px] uppercase tracking-[2px] text-emerald-300/60">Cryptographic seal · Ed25519</div>
              <div className="text-emerald-300/80">fingerprint <span className="text-emerald-100">{sig.fingerprint}</span></div>
              <div className="mt-1 break-all text-emerald-300/60">sha256 {sig.sha256}</div>
              <div className="mt-1 break-all text-emerald-300/60">public key {sig.publicKey}</div>
              <div className="mt-1 break-all text-emerald-300/40">signature {sig.signature.slice(0, 96)}…</div>
            </div>

            {/* Step 2/3 — verify + tamper */}
            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
              <div className="text-sm font-bold text-emerald-200">2 · Verify it yourself — no account, no trusting our dashboard</div>
              <div className="text-[13px] text-emerald-100/70">Verification is pure math against the public key. Anyone, anywhere, offline.</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => doVerify(false)} disabled={verifying} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">✅ Verify offline</button>
                <button onClick={() => doVerify(true)} disabled={verifying} className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-100 hover:bg-rose-500/20 disabled:opacity-60">🧪 Tamper test</button>
              </div>
              {verify && (
                <div className={"mt-4 rounded-xl border p-4 " + (verify.state === "ok" ? "border-emerald-400/50 bg-emerald-500/10" : "border-rose-400/50 bg-rose-500/10")}>
                  <div className={"text-lg font-black " + (verify.state === "ok" ? "text-emerald-200" : "text-rose-200")}>
                    {verify.mode === "tamper" ? (verify.state === "bad" ? "🧪 Tampered card → REJECTED" : "unexpected: tampered card passed") : (verify.state === "ok" ? "✅ VALID — authentic & untampered" : "✗ rejected")}
                  </div>
                  <div className="mt-1 text-[13px] text-emerald-100/80">{verify.msg}{verify.mode === "tamper" && verify.state === "bad" ? " — one flipped byte invalidates the whole card. That's the point." : ""}</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Positioning + CTAs */}
        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5">
          <div className="text-sm font-bold text-emerald-100">Why this is the wedge</div>
          <p className="mt-1 text-[13px] text-emerald-100/75 leading-relaxed">
            It turns "trust our governance" into "don't trust us — verify it yourself, and watch tampering fail." Every retrain
            re-issues a new signed card; the version history is preserved; incidents trigger re-assurance. It's the assurance
            layer for JSP 936, and it maps straight onto EU AI Act, NIST and ISO 42001 obligations.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/hive" className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-emerald-500/20">See the framework hive →</a>
            <a href="/assess" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">Get measured</a>
            <a href="/os?lobby=assess&task=enterprise-start" className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/20">Enterprise lobby →</a>
          </div>
          <p className="mt-4 text-[11px] text-emerald-300/50">Demo card data is synthetic; the signing and verification are genuinely real, on the CSOAI measurement signing backend. For a named engagement the card is issued under your own signing key.</p>
        </div>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
      <div className="mb-2 font-mono text-[10px] uppercase tracking-[2px] text-emerald-300/60">{title}</div>
      {children}
    </div>
  );
}
