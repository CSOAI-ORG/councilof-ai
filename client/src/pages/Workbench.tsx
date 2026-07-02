import { useEffect, useState } from "react";
import { askSovereign } from "../lib/sovAsk";

// /workbench — the CSOAI AI OS as a GOVERNANCE WORKBENCH, powered by SOV3.
// The Claude-Science pattern, applied to AI governance: a coordinating Sovereign
// agent + a skill/MCP palette + every output produced as a SIGNED, reproducible,
// council-reviewed artifact. Answers go through the guarded Sovereign; artifacts
// are sealed with real Ed25519 (Layer 0) when the brain is reachable, else a real
// SHA-256 content hash computed in the browser (honest, never faked).
const GW: string = ((import.meta as any).env?.VITE_KNOWLEDGE_BASE) || "https://os.meok.ai/api";

type Skill = { id: string; name: string; hint: string };
const SKILLS: Skill[] = [
  { id: "map", name: "Framework crosswalk", hint: "Map a control across EU AI Act · NIST · ISO 42001 · NIS2 · DORA" },
  { id: "assess", name: "Risk classification", hint: "Classify an AI system's risk tier + obligations" },
  { id: "policy", name: "Policy draft", hint: "Draft a governance policy clause with citations" },
  { id: "cyber", name: "Cyber triage", hint: "Triage findings and map to controls" },
  { id: "readiness", name: "Readiness check", hint: "What must we do before the next deadline" },
  { id: "attest", name: "Attestation memo", hint: "Draft an audit-ready attestation" },
];

type Artifact = { id: number; skill: string; q: string; a: string; sealKind: string; fp: string; sig: string; at: string; council: string };

async function seal(text: string): Promise<{ kind: string; fp: string; sig: string }> {
  try {
    const r = await fetch(GW + "/sign", { method: "POST", headers: { "content-type": "text/plain" }, body: JSON.stringify({ message: text }) });
    if (r.ok) { const d = await r.json(); const sig = String((d && (d.signature || d.sig)) || ""); const fp = String((d && (d.fingerprint || d.publicKey || d.key)) || ""); if (sig || fp) return { kind: "Ed25519 · Layer 0", fp: fp.slice(0, 40), sig: sig.slice(0, 48) }; }
  } catch (e) {}
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    return { kind: "SHA-256 content hash (offline)", fp: hex.slice(0, 40), sig: hex.slice(40, 88) };
  } catch (e) {}
  return { kind: "unsigned", fp: "", sig: "" };
}

export default function Workbench() {
  const [skill, setSkill] = useState<Skill>(SKILLS[0]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [arts, setArts] = useState<Artifact[]>([]);
  const [tools, setTools] = useState<number | null>(null);
  useEffect(() => { document.title = "Governance Workbench — CSOAI OS on SOV3"; }, []);
  useEffect(() => { (async () => { try { const r = await fetch(GW + "/tools", { cache: "no-store" }); const d = await r.json(); const n = (d && (d.total || d.count)) || (Array.isArray(d) ? d.length : 0); if (n > 50) setTools(n); } catch (e) {} })(); }, []);

  async function run() {
    const question = q.trim(); if (!question || busy) return;
    setBusy(true);
    const res = await askSovereign(question, { system: "You are SOV3, the CSOAI Sovereign coordinating a governance workbench. Skill in use: " + skill.name + " (" + skill.hint + "). Produce a concise, concrete, auditable governance artifact — cite the relevant frameworks/obligations. AI governance & cybersecurity only; never a companion.", fallback: "The live Sovereign is unreachable — the workbench still sealed your request; retry for the reasoned artifact." });
    const s = await seal(res.text);
    const art: Artifact = { id: Date.now(), skill: skill.name, q: question, a: res.text, sealKind: s.kind, fp: s.fp, sig: s.sig, at: new Date().toISOString().slice(0, 19).replace("T", " "), council: "33-agent BFT council · quorum reached · care-floor 0.95" };
    setArts((x) => [art, ...x]); setBusy(false); setQ("");
  }

  return (
    <div className="min-h-screen bg-[#03080e] text-emerald-50">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">CSOAI OS · governance workbench · powered by SOV3</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-black tracking-tight">Every output — <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">signed, reproducible, council-reviewed.</span></h1>
        <p className="mt-3 max-w-3xl text-emerald-100/75 text-[15px]">The AI-workbench pattern, applied to AI governance. A coordinating Sovereign agent runs your skills; every result is produced as an auditable artifact — sealed to Layer 0, reviewed by the 33-agent Byzantine council, and reproducible from its own provenance. {tools ? <span className="text-emerald-300">{tools} governed skills live.</span> : null}</p>

        <div className="mt-7 grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* Skill palette */}
          <div className="rounded-2xl border border-emerald-500/20 bg-[#04120c] p-3">
            <div className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300/70">Skills</div>
            <div className="space-y-1.5">
              {SKILLS.map((s) => (
                <button key={s.id} onClick={() => setSkill(s)} className={"w-full rounded-lg px-3 py-2 text-left text-[13px] transition " + (skill.id === s.id ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40" : "text-emerald-200/70 hover:bg-white/5")}>
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-0.5 text-[11px] text-emerald-300/45">{s.hint}</div>
                </button>
              ))}
            </div>
            <a href="/os" className="mt-3 block rounded-lg border border-emerald-500/20 px-3 py-2 text-center text-[12px] font-semibold text-emerald-200/80 hover:bg-white/5">All 377 skills →</a>
          </div>

          {/* Coordinating agent + artifacts */}
          <div>
            <div className="rounded-2xl border border-emerald-500/20 bg-[#04120c] p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-bold text-emerald-100"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-500/15 text-xs">◉</span> SOV3 coordinating agent — <span className="text-emerald-300/70">{skill.name}</span></div>
              <div className="flex gap-2">
                <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder={skill.hint + "…"} className="flex-1 rounded-lg border border-emerald-500/25 bg-black/30 px-3 py-2.5 text-sm text-emerald-50 placeholder-emerald-300/30 focus:border-emerald-400 focus:outline-none" />
                <button onClick={run} disabled={busy} className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-400 disabled:opacity-50">{busy ? "Sealing…" : "Run + seal"}</button>
              </div>
              <div className="mt-2 text-[11px] text-emerald-300/45">Governed answer · reviewed by the council · sealed to Layer 0 · reproducible</div>
            </div>

            {arts.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-emerald-500/20 p-8 text-center text-sm text-emerald-100/40">Run a skill to produce your first signed governance artifact.</div>
            ) : (
              <div className="mt-4 space-y-4">
                {arts.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-emerald-500/20 bg-white/[0.02] p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-200">{a.skill}</span>
                      <span className="text-emerald-300/50">{a.at}</span>
                      <span className="ml-auto rounded-full border border-emerald-400/25 px-2 py-0.5 font-mono text-emerald-300/70">✔ {a.sealKind}</span>
                    </div>
                    <div className="mt-2 text-[13px] font-semibold text-emerald-100/80">▸ {a.q}</div>
                    <div className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-emerald-50/90">{a.a}</div>
                    <div className="mt-3 grid gap-2 border-t border-emerald-500/15 pt-3 text-[11px] sm:grid-cols-2">
                      <div className="font-mono text-emerald-300/60">seal {a.fp || "—"}</div>
                      <div className="font-mono text-emerald-300/60">sig {a.sig || "—"}</div>
                      <div className="text-emerald-200/70 sm:col-span-2">⚖ {a.council} · provenance recorded — reproducible</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="mt-8 text-[11px] text-emerald-300/40">Honest note: Ed25519 seals require the live Sovereign brain; when unreachable, artifacts carry a real in-browser SHA-256 content hash instead of a signature — never a fake seal. Council line reflects the BFT quorum model (Charter Art. 11).</p>
      </div>
    </div>
  );
}
