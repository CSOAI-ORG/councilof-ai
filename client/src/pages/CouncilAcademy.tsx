import { useEffect } from "react";

// Council Academy — learning as an immersive journey inside the OS, not a manual.
// The guide walks you path by path (Foundations -> Your Jurisdiction -> Apply
// -> Attest); every module flows straight into the real tool. Learn by living it.
// NB: the fourth path records a COMPLETION (you reproduced a published measurement), never
// conformity — Council of AI certifies nothing. /courses is a 308 to the OS lobby, so no module
// here may link to it: every href below must be a page that serves (2026-09-28 fix).

type Mod = { name: string; href: string };
type Path = { n: number; title: string; blurb: string; ring: string; chip: string; modules: Mod[] };

const PATHS: Path[] = [
  { n: 1, title: "Foundations", blurb: "Stand on the floor first — identity, policy, attestation.", ring: "border-amber-300", chip: "bg-amber-100 text-amber-800", modules: [
    { name: "Verify an outcome before marking completion", href: "#verify-retained-outcome" },
    { name: "Layer 0 — the 8 trust controls", href: "/layer0" },
    { name: "The operational charter", href: "/constitutional-harness/" },
    { name: "SOAI-PDCA methodology", href: "/soai-pdca" },
  ] },
  { n: 2, title: "Your jurisdiction", blurb: "Learn the frameworks and law that apply to you — wherever you are.", ring: "border-emerald-300", chip: "bg-emerald-100 text-emerald-800", modules: [
    { name: "EU AI Act", href: "/eu-ai-act" },
    { name: "NIST AI RMF", href: "/nist-ai-rmf" },
    { name: "ISO/IEC 42001", href: "/iso-42001" },
    { name: "TC260 (China)", href: "/tc260" },
  ] },
  { n: 3, title: "Apply", blurb: "Turn knowledge into governance — map, assess, generate.", ring: "border-blue-300", chip: "bg-blue-100 text-blue-800", modules: [
    { name: "Framework Crosswalks", href: "/crosswalks" },
    { name: "THE RULER — local practice with published AI answers", href: "/games/ruler/" },
    { name: "Readiness Assessment (free)", href: "/assess" },
    { name: "Policy Generator", href: "/policy-generator" },
  ] },
  { n: 4, title: "Attest", blurb: "Reproduce a published measurement to earn a free, signed completion record (issuance is not open yet). It records what you reproduced, not conformity — we certify nothing.", ring: "border-violet-300", chip: "bg-violet-100 text-violet-800", modules: [
    { name: "Completion records — how they work", href: "#completion-records" },
    { name: "Verify a signed card in your browser", href: "/gspc-verify/" },
  ] },
];

export default function CouncilAcademy() {
  useEffect(() => { document.title = "Council Academy — CSOAI"; }, []);
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900 text-white py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(700px 380px at 80% -10%, rgba(45,212,191,.25), transparent 60%)" }} />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500/15 text-xl">{"\u25C9"}</div>
            <p className="font-mono text-[11px] uppercase tracking-[2px] text-emerald-300/80">Learn by living it</p>
          </div>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">Council Academy</h1>
          <p className="mt-5 max-w-2xl text-lg text-emerald-50/90">No manuals. Follow the modules below from the Layer 0 floor to the frameworks and law that apply to you, then into the tools. The exercises let you reproduce a published measurement yourself; completion records are not issued yet, and one would only ever say you reproduced a measurement — never conformity.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="/tour" className="rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-bold text-[#03110b] hover:bg-emerald-300">Take the guided tour {"\u2192"}</a>
            <a href="/assess" className="rounded-xl border border-emerald-300/40 px-5 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-white/10">Free readiness check {"\u2192"}</a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-14">
        <div className="space-y-6">
          {PATHS.map((p, idx) => (
            <div key={p.n} id={p.n === 1 ? "foundations" : undefined} className="relative scroll-mt-24">
              {idx < PATHS.length - 1 && <div className="absolute left-[27px] top-14 h-[calc(100%-1rem)] w-px bg-gray-200" />}
              <div className="flex gap-5">
                <div className={"relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-white text-lg font-black text-gray-700 " + p.ring}>{p.n}</div>
                <div className="flex-1 rounded-2xl border border-gray-200 p-5">
                  <h2 className="text-xl font-bold text-gray-900">{p.title}</h2>
                  <p className="mt-1 text-sm text-gray-500">{p.blurb}</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {p.modules.map((m) => (
                      <a key={m.name} href={m.href} className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/40 transition">
                        <span className="text-sm font-medium text-gray-800">{m.name}</span>
                        <span className={"ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold " + p.chip}>Begin {"\u2192"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <article id="verify-retained-outcome" aria-labelledby="verify-retained-outcome-title" tabIndex={-1} className="mt-12 scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-base leading-7 text-gray-800 sm:p-8">
          <p className="text-sm font-semibold text-amber-900">Foundations lesson · Version 1.0 · Prepared <time dateTime="2026-10-25">25 October 2026</time></p>
          <h2 id="verify-retained-outcome-title" className="mt-2 text-2xl font-bold tracking-tight text-gray-900">Verify an outcome before marking completion</h2>
          <p className="mt-3">A read-only practice lesson from CSOAI Academy. This lesson has not been tested with a learner.</p>

          <h3 className="mt-6 text-lg font-bold text-gray-900">What you will practise</h3>
          <p className="mt-2">Use a retained observation to decide whether an assistant should continue, reconcile or hold an action. Keep a proposal, an executed action and a verified outcome distinct.</p>
          <p className="mt-2">This lesson uses generalized operational examples. It teaches evidence checking; it does not establish measured human learning or a live game integration.</p>

          <h3 className="mt-6 text-lg font-bold text-gray-900">The shared loop</h3>
          <p className="mt-2">Observe the situation → update the same task/context → inspect options and care/authority → suggest or seek approval → act once → verify the retained outcome → continue or correct.</p>
          <p className="mt-2">A useful assistant says what it observed, what it proposes, which authority it has, what actually happened and what remains unverified.</p>

          <h3 className="mt-6 text-lg font-bold text-gray-900">Worked example</h3>
          <p className="mt-2">A service returns a successful health response. Its catalogue shows familiar table names. The exact task and result records required by your current activity cannot be read.</p>
          <p className="mt-2">The retained observations support “the service answers” and “some catalogue metadata is present.” They do not establish that the original task or result was recovered.</p>
          <p className="mt-2">The assistant should preserve the evidence, hold dependent writes, and send the existing owner a precise reconciliation request through the established internal route. It must not manufacture missing records, reset the activity or repeat a previously completed effect.</p>

          <h3 className="mt-6 text-lg font-bold text-gray-900">Practice: choose the next action</h3>
          <p className="mt-2">You see:</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>Health response: successful.</li>
            <li>Required task read: not found.</li>
            <li>Required result read: not found.</li>
            <li>No authorized recovery action remains.</li>
          </ul>
          <p className="mt-3">Choose one:</p>
          <ol className="mt-2 list-decimal space-y-2 pl-6">
            <li>Mark the activity complete because the health response succeeded.</li>
            <li>Hold dependent actions, retain these observations and request the existing owner's task/store reconciliation.</li>
            <li>Create a replacement task and describe it as recovered.</li>
          </ol>
          <details className="mt-4 rounded-xl border border-amber-300 bg-white p-4">
            <summary className="cursor-pointer rounded font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">Show practice feedback</summary>
            <p className="mt-3">Option 2 follows the evidence and existing authority. Option 1 lacks the required result; option 3 invents continuity.</p>
            <p className="mt-2">Repeat this exact case once after reading the feedback. That is practice, not an independent assessment of learning.</p>
          </details>

          <h3 className="mt-6 text-lg font-bold text-gray-900">Use the same habit in a game</h3>
          <p className="mt-2">A live assistant card may contain a proposed move and a predicted result. The UI should mark an outcome as verified only after the original game action is committed and its retained result is read from the same authorized session.</p>
          <p className="mt-2">If a connection drops, use the existing reconciliation/read route before taking another action. A retry must not repeat a completed move.</p>
          <p className="mt-2">Game-specific legal moves, scoring and engine controls come from that game's existing source and owner. This general example is not a claim that any particular game is connected.</p>

          <h3 className="mt-6 text-lg font-bold text-gray-900">Evidence you should be able to point to</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>The current authorized task/session and original source/version.</li>
            <li>The observed state and concise reason for the proposal.</li>
            <li>The separate approval when required.</li>
            <li>The actual committed result and its retained reference.</li>
            <li>The readback that justifies continuing, correcting or holding.</li>
          </ul>
          <p className="mt-3">Do not expose private records or credentials in public lesson submissions.</p>

          <h3 className="mt-6 text-lg font-bold text-gray-900">Assessment and correction</h3>
          <p className="mt-2">An independent assessment needs a separately qualified assessor and a novel task with a frozen rubric. Exact retry, a quiz score, a signed receipt or an AI's self-assessment does not by itself show human learning.</p>
          <p className="mt-2">Use the Academy's existing <a href="/contact" className="font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">contact route to suggest a correction</a>.</p>
          <p className="mt-4"><a href="#foundations" className="font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700">Return to Foundations</a></p>
        </article>

        <div id="completion-records" className="mt-12 scroll-mt-24 rounded-2xl border border-violet-200 bg-violet-50/60 p-6 text-sm text-gray-800">
          <h2 className="text-lg font-bold text-gray-900">Completion records — how they work</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li><b>Completed means reproduced.</b> You re-run a published measurement from its public inputs and method, and your result matches the published result byte for byte (same sha256). Reading a page, watching a video or passing a quiz is not completion.</li>
            <li><b>Free.</b> A completion record is never sold, and verifying one is free.</li>
            <li><b>Pseudonymous.</b> The record names you by an identifier you choose or hold. It carries no name and no email address.</li>
            <li><b>Standard format.</b> Each record is an Open Badges 3.0 credential in the W3C Verifiable Credentials 2.0 data model, with a public revocation list, so any conforming verifier can check it.</li>
            <li><b>Not a certification.</b> It records one reproduced measurement. It says nothing about your conformity, competence or any system.</li>
          </ul>
          <p className="mt-4 text-gray-600">Issuance is not open yet. The record format is published at <a className="underline" href="/schemas/csoai-completion-record-0.1.schema.json">/schemas/csoai-completion-record-0.1.schema.json</a>.</p>
        </div>

        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          You never have to read a manual. Open the <b>Council assistant</b> on any page and say <i>"teach me about the EU AI Act"</i> or <i>"how do I reproduce a measurement?"</i> — it takes you straight there. Learning and doing are the same motion now.
        </div>
      </section>
    </div>
  );
}
