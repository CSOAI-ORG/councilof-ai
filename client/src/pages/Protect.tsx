import { useEffect, useState } from "react";
import { chargeSovereign } from "../lib/sovCharge";

// Personal Protection — a one-stop shop the Council assistant runs for anyone: execs, governments,
// people of influence, and every person of the earth. Deepfake + impersonation protection,
// powered by real Ed25519 signing (the measurement API) so YOUR words/likeness are provably yours and a
// deepfake fails verification. Consent-first, open, for all.

const GW = "/api";

const MODULES = [
  { icon: "🛡", name: "Deepfake & likeness shield", note: "Sign your statements, voice and content so anyone can verify it's really you. A deepfake has no signature — it fails. Powered by proofof.ai.", tag: "proofof.ai" },
  { icon: "🪪", name: "Identity & content authenticity", note: "Every post, email or clip you sign carries a verifiable Layer 0 seal. Impersonation is detectable in seconds.", tag: "Layer 0" },
  { icon: "👁", name: "Executive / VIP monitoring", note: "The Council assistant watches for impersonation, doxxing, fake endorsements and scams using your name — and flags them.", tag: "Watchdog" },
  { icon: "🎣", name: "Scam & phishing defense", note: "AI-driven scams are surging. The Council assistant screens inbound approaches and verifies who's really contacting you.", tag: "AI-security" },
  { icon: "🔐", name: "Data ownership & privacy", note: "You own and export your data. On-device where possible; nothing sold, no facial recognition, consent-first.", tag: "Council" },
  { icon: "👨‍👩‍👧", name: "Family & guardian", note: "Extend the same protection to your family — child-safe, private, and simple. Protection isn't only for the wealthy.", tag: "For all" },
];

async function sign(message: string) {
  const r = await fetch(GW + "/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message }) });
  if (!r.ok) throw new Error("sign failed");
  return r.json();
}
async function verify(message: string, signature: string, publicKey: string) {
  const r = await fetch(GW + "/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message, signature, publicKey }) });
  return r.json();
}

export default function Protect() {
  const [text, setText] = useState("I, in my own words, authorise this statement — and I did not say anything else.");
  const [sig, setSig] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string; mode: "verify" | "deepfake" }>(null);
  useEffect(() => { document.title = "Personal protection — deepfake & impersonation shield | CSOAI"; }, []);

  async function doSign() {
    setBusy(true); setResult(null); setSig(null); chargeSovereign(6);
    try { const d = await sign(text); setSig(d); } catch (e) {}
    setBusy(false);
  }
  async function check(deepfake: boolean) {
    if (!sig) return; setBusy(true); setResult(null);
    const message = deepfake ? (sig.canonical + " — and I also endorse this thing I never said.") : sig.canonical;
    try { const d = await verify(message, sig.signature, sig.publicKey); setResult({ ok: !!d.valid, msg: String(d.message || ""), mode: deepfake ? "deepfake" : "verify" }); }
    catch (e) { setResult({ ok: false, msg: "verifier unreachable", mode: deepfake ? "deepfake" : "verify" }); }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-5xl px-6 pt-14 pb-8 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · personal protection</p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Your Council assistant <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">protects you.</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-emerald-100/80">Deepfakes, impersonation and AI-driven scams target executives, governments and people of influence — but everyone deserves the shield. The Council assistant signs what's really you, so a fake fails, and watches your name across the world. One stop. For all people of the earth.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["Executives & boards", "Governments & officials", "Creators & influencers", "Families", "Everyone"].map((t) => <span key={t} className="rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1 text-xs font-semibold text-emerald-100/80">{t}</span>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {/* Live deepfake-protection demo */}
        <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5">
          <div className="text-sm font-bold text-emerald-200">Prove it — sign a statement as authentically you</div>
          <div className="text-[13px] text-emerald-100/70">Real Ed25519 signing on the measurement signing backend. Then anyone can verify it — and a deepfake that puts words in your mouth is rejected.</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="mt-3 w-full rounded-lg border border-emerald-400/30 bg-black/30 px-3 py-2 text-sm text-emerald-50 placeholder-emerald-300/40 focus:border-emerald-400 focus:outline-none" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button onClick={doSign} disabled={busy} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-60">{busy && !sig ? "Signing…" : sig ? "↻ Re-sign" : "🛡 Sign as me"}</button>
            {sig && <button onClick={() => check(false)} disabled={busy} className="rounded-xl border border-emerald-400/40 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-white/5">✅ Verify it's me</button>}
            {sig && <button onClick={() => check(true)} disabled={busy} className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-bold text-rose-100 hover:bg-rose-500/20">🎭 Deepfake test</button>}
          </div>
          {sig && <div className="mt-3 rounded-lg border border-emerald-500/15 bg-black/30 p-3 font-mono text-[11px] break-all"><div className="text-emerald-300/80">your seal <span className="text-emerald-100">{sig.fingerprint}</span></div><div className="mt-1 text-emerald-300/50">signature {String(sig.signature).slice(0, 80)}…</div></div>}
          {result && (
            <div className={"mt-3 rounded-xl border p-4 " + (result.ok ? "border-emerald-400/50 bg-emerald-500/10" : "border-rose-400/50 bg-rose-500/10")}>
              <div className={"text-lg font-black " + (result.ok ? "text-emerald-200" : "text-rose-200")}>{result.mode === "deepfake" ? (result.ok ? "unexpected: fake passed" : "🎭 Deepfake → REJECTED") : (result.ok ? "✅ Verified — authentically you" : "✗ rejected")}</div>
              <div className="mt-1 text-[13px] text-emerald-100/80">{result.msg}{result.mode === "deepfake" && !result.ok ? " — words you never signed don't carry your seal. That's how impersonation dies." : ""}</div>
            </div>
          )}
        </div>

        {/* Modules */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div key={m.name} className="flex flex-col rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5">
              <div className="flex items-center justify-between"><span className="text-2xl">{m.icon}</span><span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">{m.tag}</span></div>
              <div className="mt-2 font-bold text-emerald-50">{m.name}</div>
              <p className="mt-1 flex-1 text-[13px] text-emerald-100/70">{m.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-500/15 bg-white/[0.02] p-5 text-center">
          <div className="text-sm font-bold text-emerald-100">Protection should belong to everyone — not just the powerful.</div>
          <p className="mt-1 text-[13px] text-emerald-100/70">Open-source at the base, signed to Layer 0, consent-first. The Council assistant helps all people of the earth stay who they say they are.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a href="/system-card" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">See how signing works</a>
            <a href="/safe-space" className="rounded-full border border-emerald-400/40 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-white/5">The safe space</a>
            <a href="/?lobby=measured&task=pricing-overview" className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100 hover:bg-amber-400/20">How the free rail works</a>
          </div>
        </div>
      </section>
    </div>
  );
}
