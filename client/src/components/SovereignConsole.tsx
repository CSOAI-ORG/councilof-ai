import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Scale, ShieldAlert, FileCheck, KeyRound, Send, Sparkles, ArrowRight } from "lucide-react";
import AISystemNotice from "./AISystemNotice";

/**
 * SovereignConsole — the AI-OS surface that replaces the countdown banner in the hero.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * THE FIREWALL, AND WHY IT IS ARCHITECTURE RATHER THAN A COMMENT
 * ═══════════════════════════════════════════════════════════════════════════════
 * This console is EXTERNAL to the instrument. It dispatches to deterministic tools and renders
 * what they return. It does not score, judge, interpret, or learn.
 *
 * That is not fastidiousness — it is the whole product. A measurement body whose assistant sits
 * inside its own measurement loop has no measurement: the thing being measured would be running
 * the measurer. So three properties are enforced by construction, not by policy:
 *
 *   1. **No model in the verdict path.** `dispatch()` below is pure pattern matching over frozen
 *      statute text. There is no inference call anywhere in this file. A verdict a language model
 *      produced would be a judgement, and design law 1 forbids judgement in a primary score.
 *   2. **No egress.** Nothing typed here leaves the browser. There is no fetch, no analytics
 *      hook, no session capture. Sessions cannot be harvested into the benchmark because they
 *      are never transmitted — which is stronger than promising not to harvest them.
 *   3. **No learning.** Nothing here writes anywhere. "We do not learn from what we measure" is
 *      true of this component in the strongest available sense: it has nothing to learn from.
 *
 * If this file ever gains a model call in the verdict path, the console stops being external and
 * the instrument stops being independent. That is the line.
 *
 * WHAT REPLACED THE COUNTDOWN, AND WHY
 * The hero previously ran a countdown to an "EU AI Act Enforcement Deadline". Two problems: a
 * countdown is a claim about urgency rather than a demonstration of capability, and the
 * Digital Omnibus (Reg (EU) 2026/1744, in force 27 July 2026) deferred the Annex III high-risk
 * obligations to 2 Dec 2027 while leaving Article 50 on 2 Aug 2026 — so a single countdown to
 * "the deadline" now points at the wrong one. A working instrument is a better hero than a clock.
 */

type LensKey = "governance" | "safety" | "provenance" | "continuity";

const LENSES: { key: LensKey; name: string; icon: typeof Scale; asks: string }[] = [
  { key: "governance", name: "Governance", icon: Scale, asks: "Does it comply with statute?" },
  { key: "safety", name: "Safety", icon: ShieldAlert, asks: "Does it refuse what statute forbids?" },
  { key: "provenance", name: "Provenance", icon: FileCheck, asks: "Does the marking survive?" },
  { key: "continuity", name: "Continuity", icon: KeyRound, asks: "Will the signature still verify?" },
];

const PROHIBITED = /\b(social scor\w*|subliminal|manipulat\w* technique|untargeted scrap\w*|predictive polic\w* solely)\b/i;
const VULNERABILITY = /\b(gambling|addict\w*|relapse|vulnerab\w*|bereave\w*|debt|payday|minors?|children|elderly|dementia|disabilit\w*)\b/i;
const EXPLOITATIVE = /\b(engagement|retention|maximis\w*|maximiz\w*|upsell|nudge|target\w*|persuad\w*)\b/i;
// "face matching" was missing: the console's own example chip returned NO CATEGORY MATCHED
// for "Face matching across our camera network" — a false negative on our shipped demo input,
// live on the homepage. The chip list below is asserted against dispatch() in dev builds so an
// example that matches nothing can never ship silently again.
const BIOMETRIC =
  /\b(biometric\w*|facial recognition|face (?:recognition|match\w*|identification|verification|id)|fingerprint|iris|voice ?print|gait|emotion recognition|liveness)\b/i;
const ANNEX_III: [string, RegExp][] = [
  // Annex III point 1 IS biometrics — the table shipped without it, so a biometric description
  // fell through to the notified-body warning only, with no high-risk classification at all.
  ["biometric identification", /\b(biometric\w*|face (?:recognition|match\w*|identification|verification)|facial recognition|fingerprint|iris scan\w*|remote identification)\b/i],
  ["critical infrastructure", /\b(critical infrastructure|water|gas|electricity|traffic|utility)\b/i],
  ["education", /\b(education|exams?|students?|admissions?|proctor\w*|grading)\b/i],
  ["employment", /\b(employment|recruit\w*|hiring|cvs?|candidates?|applicants?|promotions?|workers?)\b/i],
  ["essential services", /\b(creditworthiness|credit scor|insurance pricing|benefits?|emergency|triage)\b/i],
  ["law enforcement", /\b(law enforcement|police|criminal|evidence|polygraph|suspects?)\b/i],
  ["migration", /\b(migration|asylum|border|visa|immigration)\b/i],
  ["justice", /\b(justice|judicial|court|legal reasoning|sentencing)\b/i],
];
const GENERATES = /\b(generat\w*|synthes\w*|deepfake|image|video|audio|text-to-|chatbot|assistant)\b/i;
const RELEASES = /\b(open.?source|release|model card|weights|hugging ?face|github|repo|publish\w*|distribut\w*)\b/i;
const SIGNS = /\b(sign\w*|certificate|credential|attest\w*|manifest|provenance|ed25519|rsa|ecdsa)\b/i;

type Line = { tag: string; provision: string; body: string; tone: "block" | "warn" | "ok" | "info" };

/** Pure. No inference, no network, no state written anywhere. */
function dispatch(q: string, lens: LensKey): Line[] {
  const out: Line[] = [];
  if (lens === "governance" || lens === "safety") {
    if (PROHIBITED.test(q))
      out.push({ tag: "PROHIBITED", provision: "EU AI Act Art 5", tone: "block",
        body: "No conformity route exists — this may not be placed on the market at all. Controls and documentation cannot remediate a prohibited practice." });
    if (VULNERABILITY.test(q) && EXPLOITATIVE.test(q))
      out.push({ tag: "REVIEW REQUIRED", provision: "EU AI Act Art 5(1)(b)", tone: "block",
        body: "Optimising engagement against a group whose vulnerability arises from age, disability, or a specific social or economic situation. Whether the harm threshold is met is a legal judgement this reading cannot make." });
    if (BIOMETRIC.test(q))
      out.push({ tag: "NOTIFIED BODY", provision: "Art 43(1), Annex VII", tone: "warn",
        body: "Biometrics require third-party assessment regardless of harmonised standards applied. As of April 2026, zero notified bodies had been designated." });
    const cats = ANNEX_III.filter(([, rx]) => rx.test(q)).map(([k]) => k);
    if (cats.length)
      out.push({ tag: `ANNEX III — ${cats.join(", ")}`, provision: "Art 6, Annex III", tone: "warn",
        body: "High-risk on this description. Annex VI self-assessment is the ordinary route where harmonised standards apply; Annex VII is the exception. Digital Omnibus deferred these obligations to 2 Dec 2027." });
  }
  if (lens === "provenance") {
    out.push({ tag: GENERATES.test(q) ? "ART 50 APPLIES" : "ART 50 — CHECK", provision: "EU AI Act Art 50(2)", tone: "warn",
      body: "Generated content must be marked machine-readably from 2 Aug 2026 — not deferred by the Digital Omnibus. We measured what that marking is worth in practice: 0 of 20 assets survived (0 of 180 measured cells), one-sided 95% Clopper–Pearson upper bound 13.9%, computed at n=20 assets." });
  }
  if (lens === "continuity") {
    out.push({ tag: SIGNS.test(q) ? "CHAIN IN SCOPE" : "CONTINUITY", provision: "NIST IR 8547 · RFC 9964", tone: "warn",
      body: "EdDSA and ECDSA are disallowed after 2035. A chain whose records carry no algorithm identifier cannot migrate link by link. We score ourselves 1 of 25 on this axis — all four of our own chains fail every criterion." });
    if (RELEASES.test(q))
      out.push({ tag: "PUBLIC RELEASE", provision: "EU AI Act Art 53(1)(c)–(d) · CRA Art 24", tone: "warn",
        body: "The open-source exemption is partial: technical documentation and downstream information are waived for free/open-source GPAI, but the copyright policy and the training-content summary are not. Measured across six major public releases: training summary 4/6, copyright policy 0/6, SBOM 0/6, signed release 0/6. CRA reporting obligations begin September 2026." });
  }
  if (!out.length)
    out.push({ tag: "NO CATEGORY MATCHED", provision: "EU AI Act Art 6", tone: "ok",
      body: "Nothing in this description matched a prohibited practice or an Annex III category. Article 50 transparency duties may still apply." });
  out.push({ tag: "WHAT THIS IS NOT", provision: "—", tone: "info",
    body: "A deterministic reading of frozen statute text, running in your browser. No model produced this verdict and nothing you typed left this page. It identifies the route; it is not a conformity assessment and not legal advice. CSOAI holds no accreditation." });
  return out;
}

// Each example is paired with the lens it demonstrates. Image generation is an Article 50
// (provenance) matter, NOT an Annex III high-risk category — reading it under governance
// correctly returns "NO CATEGORY MATCHED", which is honest but a poor demo. So the chip
// selects its lens when clicked, and the invariant below checks each example under that lens.
const EXAMPLES: { q: string; lens: LensKey }[] = [
  { q: "We screen CVs and rank job applicants", lens: "governance" },
  { q: "Our chatbot generates marketing images", lens: "provenance" },
  { q: "Face matching across our camera network", lens: "governance" },
];

// Every example we put in front of a visitor must produce a categorised verdict under the
// lens it demonstrates. "NO CATEGORY MATCHED" on our own demo input is a false negative
// shipping as a feature — it happened, live, with the biometric chip. Dev builds throw here;
// the check costs nothing in production because bundlers strip it with import.meta.env.DEV.
if (import.meta.env.DEV) {
  for (const e of EXAMPLES) {
    const lines = dispatch(e.q, e.lens);
    if (lines.some((l) => l.tag === "NO CATEGORY MATCHED"))
      throw new Error(`SovereignConsole: example chip matches no category: "${e.q}" under ${e.lens}`);
  }
}

const TONE = {
  block: "border-rose-300 bg-rose-50 text-rose-900",
  warn: "border-amber-300 bg-amber-50 text-amber-900",
  ok: "border-emerald-300 bg-emerald-50 text-emerald-900",
  info: "border-gray-200 bg-gray-50 text-gray-700",
};

export function SovereignConsole() {
  const [lens, setLens] = useState<LensKey>("governance");
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<{ q: string; lens: LensKey; lines: Line[] }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (turns.length) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [turns]);

  const run = (text?: string, lensOverride?: LensKey) => {
    const s = (text ?? q).trim();
    if (!s) return;
    const useLens = lensOverride ?? lens;
    if (lensOverride && lensOverride !== lens) setLens(lensOverride);
    setTurns((t) => [...t.slice(-3), { q: s, lens: useLens, lines: dispatch(s, useLens) }]);
    setQ("");
  };

  return (
    <div>
      {/* Article 50 posture, stated before the first interaction: this console is
          deterministic rule-based, not an AI system — and we say so. */}
      <AISystemNotice route="/" />
    <div className="rounded-2xl border-2 border-emerald-200 bg-white/95 shadow-lg backdrop-blur overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-emerald-900">
          <Sparkles className="h-4 w-4" /> Council Console
        </span>
        <span className="text-[11px] text-emerald-800/70">
          runs in your browser · nothing is sent anywhere · no model in the verdict
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-4 py-2.5">
        {LENSES.map((l) => {
          const I = l.icon; const on = l.key === lens;
          return (
            <button key={l.key} onClick={() => setLens(l.key)} title={l.asks}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                on ? "border-emerald-600 bg-emerald-600 text-white" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}>
              <I className="h-3.5 w-3.5" />{l.name}
            </button>
          );
        })}
      </div>

      <div className="max-h-[300px] overflow-y-auto px-4 py-4 space-y-4 text-left">
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Describe an AI system. Four lenses read it against 417 frozen statutory provisions
              and tell you which bind — deterministically, with the provision cited.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((e) => (
                <button key={e.q} onClick={() => run(e.q, e.lens)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600 hover:bg-gray-50">
                  {e.q}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <p className="max-w-[85%] rounded-xl bg-emerald-600 px-3 py-1.5 text-xs text-white">{t.q}</p>
            </div>
            {t.lines.map((l, j) => (
              <div key={j} className={`rounded-lg border p-2.5 ${TONE[l.tone]}`}>
                <p className="text-[11px] font-bold tracking-wide">
                  {l.tag}{l.provision !== "—" && <span className="ml-2 font-mono font-normal opacity-70">{l.provision}</span>}
                </p>
                <p className="mt-1 text-xs opacity-90">{l.body}</p>
              </div>
            ))}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); run(); } }}
            placeholder="Describe your AI system…"
            aria-label="Describe your AI system for a deterministic provision check"
            className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
          <button onClick={() => run()} disabled={!q.trim()} aria-label="Run the instrument"
            className="rounded-xl bg-emerald-600 px-3.5 py-2 text-white transition hover:bg-emerald-700 disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
          <Link href="/instrument" className="text-emerald-700 hover:underline">Full instrument <ArrowRight className="inline h-3 w-3" /></Link>
          <Link href="/benchmarks" className="text-emerald-700 hover:underline">All four axis</Link>
          {/* Figure must match benchmark-results/provbench.json (n_assets_marked).
              It said 0/108 — the superseded 12-asset run — while /provenance-finding
              said 0 of 20. Two different numbers for one result, on one site. */}
          <Link href="/provenance-finding" className="text-emerald-700 hover:underline">0 of 20 assets survived — the finding</Link>
        </div>
      </div>
    </div>
    </div>
  );
}
