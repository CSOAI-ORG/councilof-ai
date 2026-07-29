import { useEffect, useState } from "react";
import {
  SURFACES,
  COUNTS,
  DECLARED_UNCALLED_SDKS,
  ROUTES_SCANNED,
  REGISTRY_VERSION,
  ASSESSED_AT,
} from "@/lib/ai-surfaces";

/**
 * /ai-transparency — CSOAI's own Article 50 disclosure.
 *
 * Deliberately not a marketing page. It is a measurement of this codebase: every interactive
 * surface, what it computes where that has actually been read, and the source file you can open
 * to check. The interesting result is that zero surfaces call a model, and publishing that with
 * its method is more useful than an "AI-powered" banner would have been.
 */

const NATURE_STYLE: Record<string, string> = {
  rule_based: "text-emerald-200 border-emerald-400/40",
  ai_system: "text-sky-200 border-sky-400/50",
  unclassified: "text-amber-200 border-amber-400/40",
};

const NATURE_LABEL: Record<string, string> = {
  rule_based: "rule-based",
  ai_system: "AI system",
  unclassified: "unclassified",
};

export default function AiTransparency() {
  const [showAll, setShowAll] = useState(false);
  useEffect(() => {
    document.title = "AI transparency — what each surface on this site actually is | CSOAI";
  }, []);

  const described = SURFACES.filter((s) => s.mechanism);
  const rest = SURFACES.filter((s) => !s.mechanism);

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            EU AI Act · Article 50 · applies from 2 August 2026
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
            What each surface on this site{" "}
            <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
              actually is.
            </span>
          </h1>
          <p className="mt-4 max-w-3xl text-emerald-100/80 leading-relaxed">
            Article 50(1) requires that you be told, at the start of your first interaction, when
            you are interacting with an AI system. Article 3(1) defines an AI system as one that{" "}
            <em>infers</em>, from the input it receives, how to generate its output. Recital 12
            places outside that definition &ldquo;systems that are based on the rules defined
            solely by natural persons to automatically execute operations&rdquo;.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 space-y-10">
        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Measured, not asserted
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              [ROUTES_SCANNED, "routes scanned"],
              [COUNTS.total, "interactive"],
              [COUNTS.ai_system, "call a model"],
              [COUNTS.unclassified, "unclassified"],
            ].map(([n, label]) => (
              <div key={String(label)}>
                <div className="text-3xl font-black tabular-nums text-emerald-50">{n}</div>
                <div className="text-[11px] text-emerald-100/50">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-emerald-100/80 leading-relaxed">
            A guard walked the route table and followed every import, including transitive ones.
            Of {ROUTES_SCANNED} routes that resolve to a page, {COUNTS.total} take input and return
            something, and <strong className="text-emerald-50">{COUNTS.ai_system}</strong> of those
            reach a model provider. No surface on this site currently engages Article 50(1).
          </p>
          <p className="mt-3 text-[13px] text-emerald-100/80 leading-relaxed">
            We could have put &ldquo;you are interacting with an AI&rdquo; on all of them and been
            safe from one direction of error. That would be a false description of the product, so
            the table is published instead.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-6">
          <h2 className="text-lg font-black tracking-tight text-amber-100">
            One thing worth watching
          </h2>
          <p className="mt-2 text-[13px] text-amber-50/80 leading-relaxed">
            {DECLARED_UNCALLED_SDKS.length} model SDKs are declared in{" "}
            <code>package.json</code> — {DECLARED_UNCALLED_SDKS.join(", ")} — and never imported
            anywhere. A dependency is not a call, so this is not a disclosure failure. It is the
            shortest possible distance to becoming one: adding inference is a single import with no
            install step and nothing to prompt a second look. The guard reports it every run.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Surfaces whose mechanism has been read
          </h2>
          <p className="mt-2 text-[13px] text-emerald-100/60">
            {described.length} of {COUNTS.total}. Each description below was written after reading
            the file named under it.
          </p>
          <div className="mt-4 space-y-3">
            {described.map((s) => (
              <div
                key={s.route}
                className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={s.route}
                    className="font-mono text-[13px] font-bold text-emerald-50 underline decoration-dotted underline-offset-4"
                  >
                    {s.route}
                  </a>
                  <span className="text-[13px] text-emerald-100/50">{s.label}</span>
                  <span
                    className={
                      "ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                      NATURE_STYLE[s.nature]
                    }
                  >
                    {NATURE_LABEL[s.nature]}
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
                  {s.mechanism}
                </p>
                <p className="mt-2 font-mono text-[11px] text-emerald-100/35">
                  check it: {s.evidence.join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Surfaces not yet assessed — {rest.length}
          </h2>
          <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
            Each of these was measured for one thing only: whether its code reaches a model. None
            does. Nobody has yet read them closely enough to describe what they compute, so they
            are published as <span className="text-amber-200">unclassified</span> rather than
            given a plausible-sounding description that no one checked. That is the honest state,
            and the count is here so it cannot quietly stay this size.
          </p>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-4 rounded-full border border-emerald-500/30 px-4 py-1.5 text-[12px] text-emerald-100/80 hover:border-emerald-400/60"
          >
            {showAll ? "Hide" : `List all ${rest.length}`}
          </button>
          {showAll && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 font-mono text-[11px] text-emerald-100/55">
              {rest.map((s) => (
                <span key={s.route}>{s.route}</span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">
            What happens when this stops being true
          </h2>
          <div className="mt-3 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed">
            <p>
              A page like this is worth nothing if it is maintained by remembering to maintain it.
              The classification is a registry file, and{" "}
              <code>article50_guard.py</code> reads it: if any surface&apos;s code reaches a model
              provider — directly or through an import chain — that surface must be registered as
              an AI system and must mount the Article 50(1) notice. If an interactive surface
              exists and is missing from the registry, the guard fails. The check runs in the
              release gate.
            </p>
            <p>
              Three outcomes, never two. When the guard cannot read the app it reports{" "}
              <strong className="text-emerald-50">UNMEASURED</strong>, which is not a pass. An
              earlier version of the detector required a Next.js directive that this app does not
              use, and reported 0 interactive surfaces out of {ROUTES_SCANNED} — a clean bill of
              health covering nothing. That is why the count is on this page: a number you can see
              is wrong is worth more than a verdict you cannot check.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black tracking-tight">Scope, honestly</h2>
          <ul className="mt-3 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed">
            <li>
              <strong className="text-emerald-50">This covers interaction, not reading.</strong>{" "}
              Static prose pages are out of scope — Article 50(1) is about interacting with a
              system.
            </li>
            <li>
              <strong className="text-emerald-50">Article 50(2) is not engaged.</strong> Nothing
              here generates synthetic audio, image, video or text, so there is no output to mark.
              If that changes, the marking obligation attaches — and the grace period to 2 December
              2026 reaches only systems placed on the market before 2 August 2026, which a new
              feature would not be.
            </li>
            <li>
              <strong className="text-emerald-50">
                Classification is our reading, not a determination.
              </strong>{" "}
              Whether a given rules engine falls inside Article 3(1) is a legal question. The
              mechanism and the source file are published so you can reach your own view.
            </li>
            <li>
              <strong className="text-emerald-50">This is our own compliance.</strong> Publishing
              it does not make CSOAI a certifier of anyone else&apos;s.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-[#05140d] p-5 font-mono text-[11px] text-emerald-100/50">
          <div>registry version {REGISTRY_VERSION}</div>
          <div>assessed {ASSESSED_AT}</div>
          <div>source: client/src/lib/ai-surfaces.ts</div>
          <div>guard: article50_guard.py</div>
        </div>

        <div className="flex flex-wrap gap-4 text-[13px]">
          <a href="/provenance-finding" className="text-emerald-300 hover:underline">
            The provenance finding →
          </a>
          <a href="/refutation-ledger" className="text-emerald-300 hover:underline">
            The refutation ledger →
          </a>
        </div>
      </section>
    </div>
  );
}
