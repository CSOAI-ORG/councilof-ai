import { useEffect, useState } from "react";
import {
  SURFACES,
  COUNTS,
  DECLARED_UNCALLED_SDKS,
  ROUTES_SCANNED,
  REGISTRY_VERSION,
  ASSESSED_AT,
  AI_SYSTEM_COMPONENTS,
  NOTICE_MOUNTED_ROUTES,
} from "@/lib/ai-surfaces";

/**
 * /ai-transparency — CSOAI's own Article 50 self-conformance record.
 *
 * Deliberately not a marketing page. It is a measurement of this codebase: every interactive
 * surface, what it computes, and the source file you can open to check. Version 2 corrects the
 * page's own earlier claim — the import-based scan reported zero model calls and was wrong;
 * the correction is published below with the same prominence as the original claim.
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

  const aiSurfaces = SURFACES.filter((s) => s.nature === "ai_system");
  const ruleSurfaces = SURFACES.filter((s) => s.nature === "rule_based");
  const mounted = aiSurfaces.filter((s) => NOTICE_MOUNTED_ROUTES.includes(s.route));

  return (
    <div className="min-h-screen bg-[#03110b] text-emerald-50">
      <section className="border-b border-emerald-500/15">
        <div className="mx-auto max-w-4xl px-6 pt-14 pb-10">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            EU AI Act · Article 50 · in force from 2 August 2026
          </p>
          <h1 className="mt-3 text-4xl sm:text-4xl font-black tracking-tight">
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
        {/* SELF-CONFORMANCE RECORD */}
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/[0.07] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[3px] text-emerald-300/70">
            Self-conformance record · {ASSESSED_AT}
          </p>
          <p className="mt-4 text-[14px] text-emerald-100/85 leading-relaxed">
            <strong className="text-emerald-50">Statement.</strong> As of 2 August 2026,{" "}
            {COUNTS.total} interactive surfaces on this site are classified: {COUNTS.rule_based}{" "}
            are rule-based instruments or deterministic displays that call no model;{" "}
            {COUNTS.ai_system} routes across {AI_SYSTEM_COMPONENTS} components are AI systems —
            they send your input to the live Council chat endpoint, and they say so. Any
            surface not in the registry defaults to the strictest reading — treated as an AI
            system — until it is classified.
          </p>
          <p className="mt-3 text-[13px] text-emerald-100/70 leading-relaxed">
            <strong className="text-emerald-50">How this record updates.</strong> The registry is
            a source file (<code>client/src/lib/ai-surfaces.ts</code>), version {REGISTRY_VERSION};
            every change is a commit, and a guard in the release gate fails the build if a
            surface starts calling a model without being registered and noticed. This record is
            sha256-linked into the public decision chain at publication — recompute it yourself
            at <a href="/gspc-verify" className="text-emerald-300 hover:underline">/gspc-verify</a>.
          </p>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              [ROUTES_SCANNED, "routes scanned"],
              [COUNTS.total, "interactive surfaces"],
              [COUNTS.ai_system, "AI-system routes"],
              [COUNTS.unclassified, "unclassified"],
            ].map(([n, label]) => (
              <div key={String(label)}>
                <div className="text-3xl font-black tabular-nums text-emerald-50">{n}</div>
                <div className="text-[11px] text-emerald-100/50">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* THE CORRECTION — published like every other miss */}
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/[0.06] p-6">
          <h2 className="text-lg font-black tracking-tight text-amber-100">
            The correction this page owes you
          </h2>
          <p className="mt-2 text-[13px] text-amber-50/80 leading-relaxed">
            Version 1.0.0 of this registry (29 July 2026) stated that <em>zero</em> surfaces on
            this site call a model. That was wrong, and the method was why: the scan walked
            imports of model-provider SDKs, but the surfaces that talk to a model do it with a
            plain fetch to our own gateway — no SDK involved. A manual audit of every fetch on
            1 August 2026 found {AI_SYSTEM_COMPONENTS} components calling the live Council
            chat endpoint. They are classified below, and the guard is being extended to cover
            gateway fetches so the next miss is caught by the machine, not by a deadline.
          </p>
        </div>

        {/* AI-SYSTEM SURFACES */}
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            The AI-system surfaces — {aiSurfaces.length}
          </h2>
          <p className="mt-2 text-[13px] text-emerald-100/60 leading-relaxed">
            These routes reach a live model. {mounted.length} of them mount the Article 50(1)
            first-interaction notice above the input today; for the rest, this registry entry is
            the disclosure while the notice component is wired — listed plainly, because a notice
            you can check beats a claim you cannot.
          </p>
          <div className="mt-4 space-y-3">
            {aiSurfaces.map((s) => (
              <div
                key={s.route}
                className="rounded-2xl border border-sky-400/25 bg-[#05140d] p-5"
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
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                      (NOTICE_MOUNTED_ROUTES.includes(s.route)
                        ? "border-emerald-400/40 text-emerald-200"
                        : "border-amber-400/40 text-amber-200")
                    }
                  >
                    {NOTICE_MOUNTED_ROUTES.includes(s.route) ? "notice mounted" : "notice wiring"}
                  </span>
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

        {/* RULE-BASED SURFACES */}
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            The rule-based surfaces — {ruleSurfaces.length}
          </h2>
          <p className="mt-2 text-[13px] text-emerald-100/80 leading-relaxed">
            Deterministic instruments, data displays and forms. Each was grep-audited for model
            calls; the mechanism line names what the surface is and asserts only what was
            verified. Rule-based systems defined solely by natural persons fall outside the
            Article 3(1) definition (Recital 12), so Article 50(1) does not apply to them — we
            say so rather than leave it unsaid.
          </p>
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="mt-4 rounded-full border border-emerald-500/30 px-4 py-1.5 text-[12px] text-emerald-100/80 hover:border-emerald-400/60"
          >
            {showAll ? "Hide" : `List all ${ruleSurfaces.length}`}
          </button>
          {showAll && (
            <div className="mt-4 space-y-2">
              {ruleSurfaces.map((s) => (
                <div
                  key={s.route}
                  className="rounded-xl border border-emerald-500/15 bg-[#05140d] px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={s.route}
                      className="font-mono text-[12px] font-bold text-emerald-50 underline decoration-dotted underline-offset-4"
                    >
                      {s.route}
                    </a>
                    <span className="text-[12px] text-emerald-100/50">{s.label}</span>
                    <span
                      className={
                        "ml-auto rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide " +
                        NATURE_STYLE[s.nature]
                      }
                    >
                      {NATURE_LABEL[s.nature]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[12px] text-emerald-100/60 leading-relaxed">
                    {s.mechanism}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* WATCH CONDITION */}
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

        {/* STRUCTURAL PART */}
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            What happens when this stops being true
          </h2>
          <div className="mt-3 space-y-3 text-[13px] text-emerald-100/80 leading-relaxed">
            <p>
              A page like this is worth nothing if it is maintained by remembering to maintain it.
              The classification is a registry file, and{" "}
              <code>article50_guard.py</code> reads it: if any surface&apos;s code reaches a model
              — by SDK import or, after the 1 August correction, by gateway fetch — that surface
              must be registered as an AI system and must mount the Article 50(1) notice. If an
              interactive surface exists and is missing from the registry, the guard fails. The
              check runs in the release gate.
            </p>
            <p>
              Three outcomes, never two. When the guard cannot read the app it reports{" "}
              <strong className="text-emerald-50">UNMEASURED</strong>, which is not a pass. And
              when its method has a blind spot — as the import-only scan did — the correction is
              published in the registry itself, not buried in a changelog.
            </p>
          </div>
        </div>

        {/* SCOPE */}
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
              <strong className="text-emerald-50">The gateway is ours.</strong> The model behind
              the Council chat endpoint is operated under our own governance boundary; the
              endpoint, not the model vendor, is what these surfaces call.
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
          <a href="/article-50" className="text-emerald-300 hover:underline">
            The Article 50 explainer →
          </a>
          <a href="/gspc-verify" className="text-emerald-300 hover:underline">
            Recompute the chain →
          </a>
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
