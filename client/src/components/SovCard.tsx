import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Sparkles, ArrowRight, ShieldAlert, Scale, BookOpen, HelpCircle, Loader2 } from "lucide-react";

/**
 * SovCard — the governance assistant that sits in every page hero.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * WHAT BACKS IT, AND WHAT DELIBERATELY DOES NOT
 * ═══════════════════════════════════════════════════════════════════════════════
 * This is wired ONLY to components the estate has measured to work:
 *
 *   deterministic gate       Δ +34.84 [+17.50, +52.18]   Art 5 prohibited practices
 *   conformity route         3/3 correct, TS port 5/5 vs source
 *   Annex III classifier     4/4 correct
 *
 * It is NOT wired to the two we measured and switched off:
 *
 *   per-dimension routing    Δ +0.90  [-1.99, +3.79]   no effect
 *   statute retrieval        Δ -5.70  [-12.91, +1.51]  no benefit at 0.5B
 *
 * That constraint is the whole design. A chat box backed by a component we measured as
 * unhelpful would be a confident interface over a known-null result — which is precisely the
 * defect this estate has spent its time removing. So the card answers what it can answer
 * DETERMINISTICALLY, cites the provision, and says plainly when a question is outside that.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * IT RUNS ENTIRELY IN THE BROWSER
 * ═══════════════════════════════════════════════════════════════════════════════
 * No account, no server call, no database. Nothing typed here is transmitted anywhere. That
 * is a privacy property and also a resilience one: the free tier cannot be taken down by our
 * infrastructure, because it does not use any.
 *
 * ⚠️ ON HARVESTING THESE QUESTIONS FOR THE BENCHMARK — deliberately NOT done. Two reasons:
 *   1. The KB is exact-match and GovBench scores the same pipeline. Feeding user questions
 *      back in is the circularity the overnight harvester already had to be guarded against.
 *   2. Governance questions are commercially sensitive by nature — someone asking "is our
 *      hiring model high-risk?" is disclosing something about their product. Silently
 *      collecting that to build a benchmark would be a governance failure inside a governance
 *      product.
 * If this ever becomes a training source it must be opt-in, disclosed, and gated.
 */

const BIOMETRIC = /\b(biometric|facial recognition|face recognition|fingerprint|iris|voice ?print|gait|emotion recognition)\b/i;
const HARMONISED = /\b(harmonis\w* standard|harmoniz\w* standard|common specification|iso ?42001|en \d{4})\b/i;
const PROHIBITED = /\b(social scor\w*|subliminal|manipulat\w* technique|untargeted scrap\w*|exploit\w* vulnerab\w*)\b/i;

const ANNEX_III: [string, RegExp][] = [
  ["critical infrastructure", /\b(critical infrastructure|water|gas|electricity|traffic|utility)\b/i],
  ["education", /\b(education|exam|student|admission|proctor|grading)\b/i],
  ["employment", /\b(employment|recruit|hiring|cv|candidate|promotion|termination|worker)\b/i],
  ["essential services", /\b(creditworthiness|credit scor|insurance pricing|benefit|emergency|triage|essential service)\b/i],
  ["law enforcement", /\b(law enforcement|police|criminal|evidence|polygraph)\b/i],
  ["migration", /\b(migration|asylum|border|visa|immigration)\b/i],
  ["justice", /\b(justice|judicial|court|legal reasoning|sentencing)\b/i],
];

const ART50 = /\b(chatbot|generat\w+ (text|image|video|audio|content)|deepfake|synthetic (media|content)|interacts? with (a )?(person|user|human))\b/i;

type Answer = {
  kind: "prohibited" | "notified" | "self" | "art50" | "not-high-risk" | "unknown";
  headline: string;
  provision?: string;
  detail: string;
  next?: { label: string; href: string };
};

function answer(q: string): Answer {
  const s = q.trim();
  if (s.length < 6) {
    return { kind: "unknown", headline: "Tell me a bit more", detail: "Describe what the system does — e.g. “we screen CVs and rank applicants”." };
  }

  if (PROHIBITED.test(s)) {
    return {
      kind: "prohibited",
      headline: "This looks like a prohibited practice",
      provision: "EU AI Act Article 5",
      detail: "Article 5 practices cannot be remediated with controls or documentation — they may not be placed on the EU market at all. If that is not what you meant, rephrase what the system actually does.",
      next: { label: "What Article 5 prohibits", href: "/article-50-explained" },
    };
  }

  if (BIOMETRIC.test(s)) {
    return {
      kind: "notified",
      headline: "High-risk, and a notified body is required",
      provision: "EU AI Act Art 43(1), Annex III point 1, Annex VII",
      detail: "Biometric systems always need third-party conformity assessment, regardless of which harmonised standards you apply. This is the one category where self-assessment is never available.",
      next: { label: "Check the full route", href: "/conformity-route" },
    };
  }

  const hits = ANNEX_III.filter(([, rx]) => rx.test(s)).map(([k]) => k);
  if (hits.length) {
    const applied = HARMONISED.test(s);
    return applied
      ? {
          kind: "self",
          headline: "High-risk — but you can self-assess",
          provision: "EU AI Act Art 43(2), Annex VI",
          detail: `Matched Annex III: ${hits.join(", ")}. Because you have applied harmonised standards, Annex VI self-assessment is available. Self-assessment is the ordinary route for most high-risk systems — a notified body is the exception.`,
          next: { label: "Confirm the route", href: "/conformity-route" },
        }
      : {
          kind: "notified",
          headline: "High-risk — notified body, unless you apply standards",
          provision: "EU AI Act Art 43(1)",
          detail: `Matched Annex III: ${hits.join(", ")}. Without harmonised standards this routes to a notified body under Annex VII. Applying them moves you to Annex VI self-assessment, which is usually the cheaper path.`,
          next: { label: "Check with standards applied", href: "/conformity-route" },
        };
  }

  if (ART50.test(s)) {
    return {
      kind: "art50",
      headline: "Not high-risk — but Article 50 applies",
      provision: "EU AI Act Article 50",
      detail: "Transparency obligations applied from 2 August 2026: people must be told they are interacting with an AI, and generated content must carry machine-readable marking. A limited grace period runs to 2 December 2026 for the marking duty only, and only for systems placed on the market before 2 August.",
      next: { label: "What Article 50 requires", href: "/article-50-explained" },
    };
  }

  return {
    kind: "not-high-risk",
    headline: "No Annex III category matched",
    provision: "EU AI Act Article 6",
    detail: "On this description the system does not fall in a high-risk category. That is a keyword reading, not a legal opinion — and Article 50 transparency duties may still apply if it interacts with people or generates content.",
    next: { label: "Run the full risk check", href: "/eu-ai-act-classifier" },
  };
}

const TONE = {
  prohibited: { ring: "border-rose-300 bg-rose-50", text: "text-rose-800", Icon: ShieldAlert },
  notified: { ring: "border-amber-300 bg-amber-50", text: "text-amber-900", Icon: Scale },
  self: { ring: "border-emerald-300 bg-emerald-50", text: "text-emerald-900", Icon: Scale },
  art50: { ring: "border-blue-300 bg-blue-50", text: "text-blue-900", Icon: BookOpen },
  "not-high-risk": { ring: "border-gray-200 bg-gray-50", text: "text-gray-800", Icon: BookOpen },
  unknown: { ring: "border-gray-200 bg-gray-50", text: "text-gray-700", Icon: HelpCircle },
} as const;

const SUGGESTIONS = [
  "We screen CVs and rank job applicants",
  "Facial recognition at our building entrance",
  "A chatbot that answers customer questions",
  "Credit scoring, ISO 42001 applied",
];

export function SovCard({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [a, setA] = useState<Answer | null>(null);
  const [thinking, setThinking] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  const ask = (text?: string) => {
    const s = (text ?? q).trim();
    if (s.length < 3) return;
    if (text) setQ(text);
    setThinking(true);
    // Deliberate short delay: the answer is instant, but a result that appears with zero
    // latency reads as a canned string rather than a decision. This is presentation only —
    // no network call happens, and none should be implied.
    setTimeout(() => { setA(answer(s)); setThinking(false); }, 220);
  };

  useEffect(() => { if (a && outRef.current) outRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [a]);

  const T = a ? TONE[a.kind] : null;

  return (
    <div className={`rounded-2xl border border-emerald-200 bg-white/90 shadow-sm backdrop-blur ${compact ? "p-5" : "p-6 sm:p-7"}`}>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600">
          <Sparkles className="h-4 w-4 text-white" />
        </span>
        <div>
          <p className="text-sm font-bold text-gray-900">Ask SOV</p>
          <p className="text-[11px] text-gray-500">Runs in your browser · nothing is sent anywhere</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="What does your AI system do?"
          aria-label="Describe your AI system"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          onClick={() => ask()}
          disabled={q.trim().length < 3 || thinking}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
        </button>
      </div>

      {!a && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-[11px] text-gray-600 transition hover:bg-gray-50">
              {s}
            </button>
          ))}
        </div>
      )}

      {a && T && (
        <div ref={outRef} className={`mt-4 rounded-xl border p-4 ${T.ring}`}>
          <div className="flex items-start gap-2.5">
            <T.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${T.text}`} />
            <div className="min-w-0">
              <p className={`font-bold ${T.text}`}>{a.headline}</p>
              {a.provision && (
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                  {a.provision}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{a.detail}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {a.next && (
                  <Link href={a.next.href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
                    {a.next.label} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                <button onClick={() => { setA(null); setQ(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600">
                  ask something else
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
        Deterministic reading of Articles 5, 6, 43 and 50 against Annex III — not legal advice,
        and it does not perform a conformity assessment. It answers what it can decide from the
        statute and says so when a question is outside that.{" "}
        <Link href="/govbench" className="underline hover:text-gray-600">See what we measure.</Link>
      </p>
    </div>
  );
}

export default SovCard;
