import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import {
  Scale, ShieldAlert, FileCheck, KeyRound, Send, Swords, BarChart3,
  CheckCircle2, AlertTriangle, Info, Layers,
} from "lucide-react";

/**
 * Instrument — the GSPC surface. One chat pane, four lenses, a sidebar of measured tools.
 *
 * WHY THIS SHAPE, AND WHAT IS DELIBERATELY NOT COPIED FROM LMARENA
 * ────────────────────────────────────────────────────────────────────────────────────────
 * LMArena's *ranking methodology* is open (`arena-rank`, Apache-2.0). Its *platform* is not.
 * So the statistics are fair game and the surface is ours to build — which is the right split
 * anyway, because we are not a battle site. We are a measurement body, and the two have
 * opposite obligations: an arena optimises engagement, an instrument optimises defensibility.
 *
 * What is worth taking is NARROWER than it first looks. Pairwise comparison is more efficient
 * than absolute scoring — exactly our bottleneck, since 0 of 15 dimensions resolve at an MDE of
 * ~63 points against margins of 1–15. But Arena-Rank's mechanism is Bradley-Terry over HUMAN
 * PREFERENCE VOTES, and crowd judgement is precisely what design law 1 forbids. So: borrow the
 * CI-with-explicit-n presentation, reject the Elo. A battle here must resolve from the five
 * deterministic predicates against a hashed provision — never from a vote. Ballot-stuffing,
 * which has demonstrably skewed vote-based arenas, is neutered by construction.
 *
 * ⚠️ THE LINE THAT MUST NOT BE CROSSED — and it is the reason this page exists in this form.
 * Public battle votes may NEVER enter the benchmark. GovBench items are exact-match scored and
 * the knowledge base is harvested under a guard that forbids ingesting anything a benchmark
 * item would match. Feeding site traffic back in is the circularity the overnight harvester
 * was already built to prevent, and it would void every published score. Battle votes are a
 * SEPARATE, disclosed, opt-in signal with their own leaderboard — never merged.
 *
 * Everything rendered below is either (a) computed client-side from deterministic logic that
 * ships in this bundle, or (b) a figure with a named artefact behind it. Nothing is typed in.
 */

const HF = "https://huggingface.co/datasets/Nicholastempleman/govbench";

type LensKey = "governance" | "safety" | "provenance" | "continuity";

const LENSES: Record<LensKey, {
  name: string; icon: typeof Scale; asks: string; measured: string;
  artefact: string; caveat: string;
}> = {
  governance: {
    name: "Governance", icon: Scale,
    asks: "Does it comply with statute?",
    measured: "+6.63  [+1.05, +12.21]  ·  n=193, cluster-robust",
    artefact: "results/system_analysis.json",
    caveat: "0 of 15 dimensions resolve. Every model is statistically tied — use this to find failure cases, not to rank.",
  },
  safety: {
    name: "Safety", icon: ShieldAlert,
    asks: "Does it refuse what statute forbids?",
    measured: "refusal 0.871 [0.711, 0.949] at over-block 0.050 [0.014, 0.165]",
    artefact: "results/defbench.json",
    caveat: "The only resolved result in the estate: Δ +0.871 [+0.603, +0.949], excluding zero. Our own tuned models score WORSE than the base they came from.",
  },
  provenance: {
    name: "Provenance", icon: FileCheck,
    asks: "Does the marking survive?",
    measured: "0 / 108 survive any transform  ·  CI [0.0%, 24.2%]",
    artefact: "results/provbench.json",
    caveat: "An embedded Article 50 marking does not survive one ordinary save. The finding is the product.",
  },
  continuity: {
    name: "Continuity", icon: KeyRound,
    asks: "Does the signing chain survive a PQC migration?",
    measured: "1 / 25 criteria pass — and the failing subject is us",
    artefact: "results/pqcbench.json",
    caveat: "All four of our own signed-vote chains fail every criterion: no signed record carries an algorithm identifier. NIST IR 8547 disallows EdDSA after 2035.",
  },
};

/** Deterministic Article 5 + Annex III reading — the same patterns as /conformity-route.
 *  Client-side on purpose: the free tier must survive the database being down. */
const PROHIBITED = /\b(social scor\w*|subliminal|manipulat\w* technique|untargeted scrap\w*|predictive polic\w* solely)\b/i;
/** Article 5(1)(b) — exploiting a vulnerability arising from age, disability, or a specific
 *  social or economic situation. Added 2026-07-29 after testing this page found a FALSE
 *  NEGATIVE: "a recommender tuned to maximise engagement among users showing gambling-relapse
 *  signals" returned "no Annex III category matched", i.e. not high-risk. That is the exact
 *  item DefBench flags and our own gate blocked. Art 5(1)(b) is about vulnerability, and none
 *  of the patterns above look for it.
 *
 *  Deliberately reported as REVIEW, not as PROHIBITED. Whether a practice exploits a
 *  vulnerability "in a manner that causes significant harm" is a legal judgement a keyword
 *  reading cannot make, and this file's whole value is that it never pretends otherwise. */
const VULNERABILITY = /\b(gambling|addict\w*|relapse|vulnerab\w*|bereave\w*|debt|payday|minors?|children|elderly|dementia|disabilit\w*|mental health crisis)\b/i;
const EXPLOITATIVE = /\b(engagement|retention|maximis\w*|maximiz\w*|upsell|nudge|target\w*|persuad\w*|conversion)\b/i;
const BIOMETRIC = /\b(biometric|facial recognition|face recognition|fingerprint|iris|voice ?print|gait|emotion recognition)\b/i;
const ANNEX_III: [string, RegExp][] = [
  ["critical infrastructure", /\b(critical infrastructure|water|gas|electricity|traffic|utility)\b/i],
  ["education", /\b(education|exams?|students?|admissions?|proctor\w*|grading|enrol\w*)\b/i],
  // `cv` alone fails on "CVs" — the plural breaks the word boundary — and "applicant" was
  // absent entirely, so "We screen CVs and rank job applicants", the textbook Annex III
  // employment case, returned NOT HIGH-RISK. Found by testing this page, 2026-07-29. Plurals
  // are now explicit on every stem that can take one.
  ["employment", /\b(employment|recruit\w*|hiring|cvs?|r[ée]sum[ée]s?|candidates?|applicants?|promotions?|termination|workers?|staff|payroll|shortlist\w*)\b/i],
  ["essential services", /\b(creditworthiness|credit scor|insurance pricing|benefit|emergency|triage)\b/i],
  ["law enforcement", /\b(law enforcement|police|criminal|evidence|polygraph|suspects?|offend\w*)\b/i],
  ["migration", /\b(migration|asylum|border|visa|immigration)\b/i],
  ["justice", /\b(justice|judicial|court|legal reasoning|sentencing)\b/i],
];

type Finding = { label: string; tone: "block" | "warn" | "ok" | "info"; provision: string; body: string };

function assess(q: string): Finding[] {
  const out: Finding[] = [];
  if (PROHIBITED.test(q)) {
    out.push({
      label: "Article 5 — prohibited practice", tone: "block", provision: "EU AI Act Art 5",
      body: "No conformity route exists. This may not be placed on the market at all — documentation and controls cannot remediate it.",
    });
  }
  if (BIOMETRIC.test(q)) {
    out.push({
      label: "Annex III point 1 — biometrics", tone: "warn", provision: "Art 43(1), Annex VII",
      body: "Requires third-party assessment by a notified body regardless of which harmonised standards you applied. Note: zero notified bodies were designated as of April 2026.",
    });
  }
  if (VULNERABILITY.test(q) && EXPLOITATIVE.test(q)) {
    out.push({
      label: "Article 5(1)(b) — possible exploitation of vulnerability", tone: "block",
      provision: "EU AI Act Art 5(1)(b)",
      body: "This describes optimising engagement against a group whose vulnerability arises from age, disability, or a specific social or economic situation. Article 5(1)(b) prohibits exploiting such a vulnerability where it causes significant harm — and a prohibited practice has no conformity route at all. Whether the harm threshold is met is a legal judgement this keyword reading cannot make, so treat this as REVIEW REQUIRED, not as a finding.",
    });
  }
  const cats = ANNEX_III.filter(([, rx]) => rx.test(q)).map(([k]) => k);
  if (cats.length) {
    out.push({
      label: `Annex III — ${cats.join(", ")}`, tone: "warn", provision: "EU AI Act Art 6, Annex III",
      body: "High-risk on this description. Annex VI self-assessment is the ordinary route where harmonised standards are applied; Annex VII is the exception.",
    });
  }
  if (!out.length) {   // only when NOTHING above matched — including the Art 5(1)(b) review
    out.push({
      label: "No Annex III category matched", tone: "ok", provision: "EU AI Act Art 6",
      body: "Not high-risk on this description. Article 50 transparency duties may still apply.",
    });
  }
  out.push({
    label: "What this is not", tone: "info", provision: "—",
    body: "A deterministic keyword reading of Art 5, Art 6 and Annex III — auditable and free. It identifies the route. It is not a conformity assessment, not a declaration of conformity, and not legal advice. CSOAI holds no accreditation and cannot act as a notified body.",
  });
  return out;
}

const EXAMPLES = [
  "We screen CVs and rank job applicants",
  "Facial recognition at a stadium entrance",
  "A recommender tuned to maximise engagement among users showing gambling-relapse signals",
  "A recipe suggestion app",
];

const TONE = {
  block: "border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200",
  warn: "border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200",
  ok: "border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200",
  info: "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300",
};

export default function Instrument() {
  useEffect(() => { document.title = "The Instrument — four lenses, one deterministic engine | CSOAI"; }, []);
  const [lens, setLens] = useState<LensKey>("governance");
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<{ q: string; findings: Finding[] }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns]);

  const run = (text?: string) => {
    const s = (text ?? q).trim();
    if (!s) return;
    setTurns((t) => [...t, { q: s, findings: assess(s) }]);
    setQ("");
  };

  const L = LENSES[lens];
  const LIcon = L.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 py-8 lg:flex lg:gap-8">
        {/* ── Sidebar: the lenses and what each has actually measured ── */}
        <aside className="lg:w-80 lg:shrink-0">
          <div className="lg:sticky lg:top-8">
            <div className="flex items-center gap-2 mb-1">
              <Layers className="h-5 w-5 text-emerald-600" />
              <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                The Instrument
              </h1>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              One deterministic engine · four lenses · 417 hashed provisions
            </p>

            <nav className="space-y-1.5">
              {(Object.keys(LENSES) as LensKey[]).map((k) => {
                const I = LENSES[k].icon;
                const on = k === lens;
                return (
                  <button
                    key={k}
                    onClick={() => setLens(k)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${
                      on
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"
                        : "border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <I className={`h-4 w-4 ${on ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400"}`} />
                      <span className={`text-sm font-semibold ${on ? "text-emerald-900 dark:text-emerald-200" : "text-gray-800 dark:text-gray-200"}`}>
                        {LENSES[k].name}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">{LENSES[k].asks}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <LIcon className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {L.name} — measured
                </span>
              </div>
              <p className="font-mono text-xs text-emerald-700 dark:text-emerald-400 break-words">
                {L.measured}
              </p>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">{L.caveat}</p>
              <p className="mt-2 font-mono text-[10px] text-gray-400">{L.artefact}</p>
            </div>

            {/* The rule that makes this an instrument rather than an arena. */}
            <div className="mt-4 rounded-xl border-l-4 border-l-emerald-600 border border-gray-200 dark:border-gray-800 p-3">
              <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                We do not learn from what we measure
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Nothing you type here trains anything. Sessions are not harvested into the
                benchmark — that circularity would void every published score. The knowledge
                base grew 28 → 76 entries overnight and benchmark coverage moved 14/193 →
                14/193. Zero. That is the guard working.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-1.5 text-xs">
              <Link href="/benchmarks" className="text-emerald-700 dark:text-emerald-400 hover:underline">
                <BarChart3 className="inline h-3.5 w-3.5 mr-1" />All four axis →
              </Link>
              <Link href="/conformity-route" className="text-emerald-700 dark:text-emerald-400 hover:underline">
                <Scale className="inline h-3.5 w-3.5 mr-1" />Annex VI or Annex VII? →
              </Link>
              <a href={HF} target="_blank" rel="noopener noreferrer"
                 className="text-emerald-700 dark:text-emerald-400 hover:underline">
                Raw JSON for every number →
              </a>
            </div>
          </div>
        </aside>

        {/* ── Main: the chat surface ── */}
        <main className="mt-8 lg:mt-0 flex-1 min-w-0">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col min-h-[70vh]">
            <div className="border-b border-gray-200 dark:border-gray-800 px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{L.name} lens</p>
                <p className="text-xs text-gray-500">{L.asks}</p>
              </div>
              <Badge variant="outline" className="text-xs">
                runs in your browser · nothing is sent anywhere
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {turns.length === 0 && (
                <div className="text-sm text-gray-500 space-y-4">
                  <p>
                    Describe an AI system. The instrument reads it against Article 5, Article 6
                    and Annex III and tells you which provisions bind — deterministically, with
                    the provision cited, offline.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((e) => (
                      <button key={e} onClick={() => run(e)}
                        className="rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1 text-xs hover:bg-gray-50 dark:hover:bg-gray-900">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((t, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl bg-emerald-600 px-4 py-2 text-sm text-white">
                      {t.q}
                    </p>
                  </div>
                  {t.findings.map((f, j) => {
                    const Icon = f.tone === "block" ? ShieldAlert
                      : f.tone === "warn" ? AlertTriangle
                      : f.tone === "ok" ? CheckCircle2 : Info;
                    return (
                      <div key={j} className={`rounded-xl border p-3 ${TONE[f.tone]}`}>
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{f.label}</p>
                            {f.provision !== "—" && (
                              <p className="text-xs opacity-80 font-mono">{f.provision}</p>
                            )}
                            <p className="mt-1 text-sm opacity-90">{f.body}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 p-3">
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); run(); } }}
                  placeholder="Describe the AI system…"
                  className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={() => run()}
                  disabled={!q.trim()}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-white transition hover:bg-emerald-700 disabled:opacity-40"
                  aria-label="Run the instrument"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Battles — stated honestly, including why they are not live yet. */}
          <div className="mt-5 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Swords className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Battles — why they are coming, and why they are not here yet
              </h2>
              <Badge variant="outline" className="text-xs">not built</Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              <strong>0 of 15 governance dimensions currently resolve.</strong> Every model is
              statistically tied because the minimum detectable effect is ≈63 points against
              observed margins of 1–15. More absolute-scored items barely move that: going from
              6 to 11 items per dimension moved interval resolution by exactly zero.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Pairwise comparison is more statistically efficient than absolute scoring, which
              is why arena-style ranking resolves where ours does not. But <strong>the mechanism
              that gets them there is one we cannot use</strong>: Arena-Rank (Apache-2.0) is a
              Bradley-Terry model over <em>human preference votes</em> — crowd judgement, and our
              first design law is that every primary score is deterministic with no judge. So we
              borrow the <em>presentation</em> — a score with an explicit 95% CI and an explicit
              n — and reject the Elo. Any battles here would resolve a pairwise verdict from the
              five deterministic predicates against a hashed provision, never from a vote.
            </p>
            <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                The line battles must not cross
              </p>
              <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
                Public votes may <strong>never</strong> enter the benchmark. GovBench items are
                exact-match scored, so harvesting site traffic back into them is circular and
                would void every published score. Battle votes will be a separate, disclosed,
                opt-in signal with their own leaderboard — never merged into GovBench, and never
                used as training data.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
