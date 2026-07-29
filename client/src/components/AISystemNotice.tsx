import { useEffect, useState } from "react";
import { surfaceFor } from "@/lib/ai-surfaces";

/**
 * The Article 50(1) first-interaction notice.
 *
 * Art 50(1) wants the notice "at the time of the first interaction or exposure", "in a clear and
 * distinguishable manner", and "in accordance with the applicable accessibility requirements".
 * So it renders before the interaction rather than as a toast after a result, it is a live region
 * with role="note" reachable in the tab order, and dismissing it collapses to a persistent
 * one-line marker rather than disappearing.
 *
 * It takes a route, not a string, so the wording cannot drift from the registry. Nothing on this
 * site is currently registered `ai_system` — the component exists so that the day inference is
 * added, article50_guard.py has something concrete to require, and the notice is a one-line
 * change rather than a design problem discovered against a deadline.
 */
export default function AISystemNotice({ route }: { route: string }) {
  const surface = surfaceFor(route);
  const [collapsed, setCollapsed] = useState(false);

  // "First interaction" is per surface, not per session.
  useEffect(() => setCollapsed(false), [route]);

  const isAI = surface.nature === "ai_system";

  if (surface.nature === "unclassified") {
    return (
      <div
        role="note"
        className="mb-5 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100"
      >
        <strong className="font-bold">Not yet assessed.</strong> This surface has not been
        classified as a rule-based system or an AI system. Treat its output as unverified.
      </div>
    );
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="mb-5 flex w-full items-center gap-2 rounded-2xl border border-emerald-500/20 bg-[#05140d] px-3 py-2 text-left text-[12px] text-emerald-100/70 hover:border-emerald-400/40"
      >
        <span aria-hidden className="font-mono">
          {isAI ? "AI" : "≡"}
        </span>
        <span>
          {isAI ? "You are interacting with an AI system." : "Deterministic — not an AI system."}
        </span>
        <span className="ml-auto text-emerald-100/40">details</span>
      </button>
    );
  }

  return (
    <div
      role="note"
      aria-live="polite"
      tabIndex={0}
      className={
        "mb-5 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed " +
        (isAI
          ? "border-sky-400/50 bg-sky-500/10 text-sky-50"
          : "border-emerald-500/20 bg-[#05140d] text-emerald-100/80")
      }
    >
      <p className="font-bold text-emerald-50">
        {isAI
          ? "You are interacting with an AI system."
          : "This is not an AI system. It is a deterministic rule-based tool."}
      </p>
      <p className="mt-2">{surface.mechanism}</p>
      <p className="mt-2 text-[11px] text-emerald-100/50">
        {isAI ? (
          <>Disclosed under EU AI Act Article 50(1).</>
        ) : (
          <>
            Rule-based systems defined solely by natural persons fall outside the Article 3(1)
            definition (Recital 12), so Article 50(1) does not apply. We say so rather than leave
            it unsaid.
          </>
        )}{" "}
        <a href="/ai-transparency" className="underline decoration-dotted hover:text-emerald-50">
          Every surface and its classification
        </a>
      </p>
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        className="mt-3 text-[11px] text-emerald-100/50 underline decoration-dotted hover:text-emerald-50"
      >
        Collapse — the marker stays visible
      </button>
    </div>
  );
}
