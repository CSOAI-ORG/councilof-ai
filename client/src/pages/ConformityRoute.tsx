import {useState, useEffect } from "react";
import { SovCard } from "@/components/SovCard";
import { Link } from "wouter";
import { Scale, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";

/**
 * ConformityRoute — Annex VI self-assessment vs Annex VII notified body.
 *
 * A FAITHFUL PORT of csoai-static-deploy2/assessor/conformity_route.py, deliberately
 * client-side. Two reasons:
 *
 *  1. It is the estate's most differentiated free asset and had no web surface at all — the
 *     routing logic existed only as a CLI nobody outside this machine could run.
 *  2. The free tier must survive the database being down. This decision is a deterministic
 *     reading of Article 43 over a fixed pattern set, so it needs no server, no account and
 *     no MySQL. A free tier that dies with the database is "free, conditions apply".
 *
 * ⚠️ If the Python patterns change, THIS FILE MUST CHANGE WITH THEM. Two copies of a legal
 * classifier that disagree is worse than one copy that is merely CLI-only, because the
 * disagreement is invisible. The patterns are quoted verbatim below so a diff is possible.
 *
 * Corrected in the source on 2026-07-28: the earlier claim that all high-risk systems need a
 * notified body was wrong. Annex VI self-assessment is the ordinary route; Annex VII is the
 * exception. Biometrics are the case that always escalates.
 */

const BIOMETRIC =
  /\b(biometric|facial recognition|face recognition|fingerprint|iris|voice ?print|gait|emotion recognition)\b/i;

const HARMONISED =
  /\b(harmonis\w* standard|harmoniz\w* standard|common specification|iso ?42001|en \d{4})\b/i;

const PROHIBITED =
  /\b(social scor\w*|subliminal|manipulat\w* technique|untargeted scrap\w*|predictive polic\w* solely)\b/i;

const ANNEX_III: [string, RegExp][] = [
  ["critical_infrastructure", /\b(critical infrastructure|water|gas|electricity|traffic|utility)\b/i],
  ["education", /\b(education|exam|student|admission|proctor|grading)\b/i],
  ["employment", /\b(employment|recruit|hiring|cv|candidate|promotion|termination|worker)\b/i],
  ["essential_services", /\b(creditworthiness|credit scor|insurance pricing|benefit|emergency|triage|essential service)\b/i],
  ["law_enforcement", /\b(law enforcement|police|criminal|evidence|polygraph)\b/i],
  ["migration", /\b(migration|asylum|border|visa|immigration)\b/i],
  ["justice", /\b(justice|judicial|court|legal reasoning|sentencing)\b/i],
];

type Result = {
  route: "NONE" | "ANNEX_VII_NOTIFIED_BODY" | "ANNEX_VI_SELF_ASSESSMENT" | "NOT_HIGH_RISK";
  reason: string;
  provision: string;
  notifiedBody: boolean;
  categories: string[];
  note: string;
};

function decide(useCase: string, harmonised: boolean | null): Result {
  const s = useCase;

  if (PROHIBITED.test(s)) {
    return {
      route: "NONE", reason: "Article 5 prohibited practice", provision: "EU AI Act Art 5",
      notifiedBody: false, categories: [],
      note: "No conformity route exists. The practice may not be placed on the market at all — this is not something controls or documentation can remediate.",
    };
  }

  // Biometrics FIRST and independently. Routing these to self-assessment is a legal failure,
  // and it is the single most consequential branch in the file.
  if (BIOMETRIC.test(s)) {
    return {
      route: "ANNEX_VII_NOTIFIED_BODY", reason: "Annex III point 1 — biometrics",
      provision: "EU AI Act Art 43(1), Annex VII", notifiedBody: true, categories: ["biometric"],
      note: "Biometric systems require third-party assessment by a notified body regardless of which harmonised standards you have applied.",
    };
  }

  const hits = ANNEX_III.filter(([, rx]) => rx.test(s)).map(([k]) => k);

  if (hits.length === 0) {
    return {
      route: "NOT_HIGH_RISK", reason: "no Annex III category matched",
      provision: "EU AI Act Art 6", notifiedBody: false, categories: [],
      note: "No Annex III category matched this description. Transparency duties under Article 50 may still apply — and this is a keyword reading, not a legal opinion.",
    };
  }

  const applied = harmonised === null ? HARMONISED.test(s) : harmonised;

  if (!applied) {
    return {
      route: "ANNEX_VII_NOTIFIED_BODY",
      reason: `Annex III ${hits.join(", ")} — harmonised standards NOT applied`,
      provision: "EU AI Act Art 43(1)", notifiedBody: true, categories: hits,
      note: "Applying harmonised standards would move this to Annex VI self-assessment. That is usually the cheaper path and it is available to you.",
    };
  }

  return {
    route: "ANNEX_VI_SELF_ASSESSMENT",
    reason: `Annex III ${hits.join(", ")} with harmonised standards applied`,
    provision: "EU AI Act Art 43(2), Annex VI", notifiedBody: false, categories: hits,
    note: "Self-assessment is the ordinary route for most high-risk systems. A notified body is the exception, not the rule.",
  };
}

const STYLE = {
  NONE: { icon: ShieldAlert, ring: "border-rose-300 bg-rose-50", text: "text-rose-800", label: "Prohibited — no route exists" },
  ANNEX_VII_NOTIFIED_BODY: { icon: AlertTriangle, ring: "border-amber-300 bg-amber-50", text: "text-amber-900", label: "Annex VII — notified body required" },
  ANNEX_VI_SELF_ASSESSMENT: { icon: CheckCircle2, ring: "border-emerald-300 bg-emerald-50", text: "text-emerald-900", label: "Annex VI — self-assessment" },
  NOT_HIGH_RISK: { icon: CheckCircle2, ring: "border-gray-200 bg-gray-50", text: "text-gray-800", label: "Not high-risk on this description" },
} as const;

const EXAMPLES = [
  "CV screening for job applicants",
  "facial recognition at a stadium entrance",
  "creditworthiness scoring, ISO 42001 applied",
  "a recipe suggestion app",
];

export default function ConformityRoute() {
  useEffect(() => { document.title = "Conformity route — Annex VI or Annex VII? | CSOAI"; }, []);
  const [useCase, setUseCase] = useState("");
  const [harmonised, setHarmonised] = useState<boolean | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const run = (text?: string) => {
    const s = (text ?? useCase).trim();
    if (!s) return;
    if (text) setUseCase(text);
    setResult(decide(s, harmonised));
  };

  const S = result ? STYLE[result.route] : null;
  const Icon = S?.icon;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-white via-emerald-50 to-emerald-100 py-16">
        <div className="container max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            <Scale className="h-3.5 w-3.5" /> Free · no account · runs in your browser
          </span>
          <h1 className="mt-4 text-4xl sm:text-4xl font-black tracking-tight text-gray-900">
            Annex VI or Annex VII?
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Most high-risk systems <strong>self-assess</strong> under Annex VI. A notified body
            is the exception — and biometrics are the case that always requires one. This reads
            Article 43 and tells you which, with the provision cited.
          </p>
          <div className="mt-8 max-w-xl">
            <SovCard compact />
          </div>
        </div>
      </div>

      <div className="container max-w-3xl py-12">
        <label className="block text-sm font-semibold text-gray-900">Describe the system</label>
        <textarea
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) run(); }}
          rows={3}
          placeholder="e.g. an AI that screens CVs and ranks job applicants"
          className="mt-2 w-full rounded-xl border border-gray-300 p-4 text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <fieldset className="mt-4">
          <legend className="text-sm font-semibold text-gray-900">
            Have you applied harmonised standards?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {[["Infer from the description", null], ["Yes", true], ["No", false]].map(([label, v]) => (
              <button
                key={String(label)}
                onClick={() => setHarmonised(v as boolean | null)}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  harmonised === v
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {label as string}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          onClick={() => run()}
          disabled={!useCase.trim()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
        >
          Find the route <ArrowRight className="h-4 w-4" />
        </button>

        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => run(e)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50">
              {e}
            </button>
          ))}
        </div>

        {result && S && Icon && (
          <div className={`mt-8 rounded-2xl border-2 p-6 ${S.ring}`}>
            <div className="flex items-start gap-3">
              <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${S.text}`} />
              <div>
                <h2 className={`text-xl font-bold ${S.text}`}>{S.label}</h2>
                <p className="mt-1 text-sm text-gray-700"><strong>Because:</strong> {result.reason}</p>
                <p className="mt-1 text-sm text-gray-700"><strong>Provision:</strong> {result.provision}</p>
                {result.categories.length > 0 && (
                  <p className="mt-1 text-sm text-gray-700">
                    <strong>Annex III categories matched:</strong> {result.categories.join(", ")}
                  </p>
                )}
                <p className="mt-3 text-sm text-gray-600">{result.note}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <strong>What this is not.</strong> This is a keyword reading of Article 43 and Annex III
          — deterministic, auditable, and free. It identifies the <em>route</em>; it does not
          perform the conformity assessment, issue a declaration of conformity, or constitute
          legal advice. CSOAI holds no accreditation and cannot act as a notified body. Where
          this says one is required, you need an actual notified body.
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          The same logic, open source and runnable offline, sits in{" "}
          <Link href="/govbench" className="font-medium text-emerald-700 hover:underline">
            the GovBench toolkit
          </Link>.
        </p>
      </div>
    </div>
  );
}
