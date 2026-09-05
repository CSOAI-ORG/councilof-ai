/**
 * The board's chip vocabulary — one component, one set of words, estate-wide.
 *
 * The point of these chips is that an unmeasured cell is a DESIGNED state, not
 * an absence. A slot with no number renders a labelled NEUTRAL chip that says so
 * in words. It never renders as blank, and it never renders as zero: a zero is a
 * measurement, and we do not have one.
 *
 * Colours are alpha-over-token, not fixed Tailwind swatches, so every chip is
 * legible on a warm-white ground AND on the green-black ink ground without a
 * second set of rules. The neutral states use the estate's own muted/border
 * tokens (warm) rather than `slate-*` (cool) — same intent, right hue.
 *
 * TIE is amber and says "indistinguishable". A TIE is never dressed as a win.
 */

export type BoardChipKind =
  | "SEPARATED" | "TIE" | "UNTESTED" | "UNMEASURED" | "REPORTED" | "IN-LANE" | "FACTS" | "WITHHELD";

const CHIP: Record<BoardChipKind, { text: string; className: string; title: string }> = {
  SEPARATED: {
    text: "SEPARATED",
    className: "border-emerald-600/35 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200",
    title: "The leader's edge is statistically separated (McNemar p<0.05 on discordant items).",
  },
  TIE: {
    text: "TIE — indistinguishable",
    className: "border-amber-500/40 bg-amber-500/12 text-amber-800 dark:text-amber-200",
    title: "A point-estimate lead that is not statistically separated. A tie is not a win.",
  },
  UNTESTED: {
    text: "UNTESTED — no separation test",
    className: "border-border bg-muted text-muted-foreground",
    title: "This slot carries data but no separation test has been run on it yet.",
  },
  UNMEASURED: {
    text: "UNMEASURED — not yet gated",
    className: "border-border bg-muted text-muted-foreground",
    title: "No measured figure exists for this slot yet. Reported as absent, never as zero.",
  },
  // MEASURED axis whose public leader score is withheld (own-model excluded or
  // uncarded). Not the same as UNMEASURED: the fleet ran; only the public
  // leader attribution is absent. Never sell bare measured_axes as leader scores.
  WITHHELD: {
    text: "MEASURED — no public leader",
    className: "border-emerald-600/25 bg-emerald-500/8 text-emerald-900 dark:text-emerald-100",
    title:
      "This axis is measured. The public per-axis leader is withheld (own council model " +
      "excluded, or no signed card). Fleet evidence may still exist; no public leader score is asserted.",
  },
  REPORTED: {
    text: "REPORTED — cited, not ours",
    className: "border-sky-500/35 bg-sky-500/12 text-sky-800 dark:text-sky-200",
    title: "A cited third-party figure carried as context. Not measured by this instrument.",
  },
  "IN-LANE": {
    text: "IN-LANE — not board-quotable",
    className: "border-violet-500/35 bg-violet-500/12 text-violet-800 dark:text-violet-200",
    title: "Measured in-lane on a smaller fleet with no separation test. Served for honesty; not part of the board.",
  },
  // A deterministic-facts axis IS measured — it just is not a model comparison,
  // so it has no fleet, no leader and no accuracy. Rendering it as UNMEASURED
  // would under-claim a real signed run; rendering a percentage would invent one.
  // It gets its own word.
  FACTS: {
    text: "MEASURED — deterministic facts",
    className: "border-emerald-300 bg-emerald-50 text-emerald-800",
    title:
      "Facts read deterministically off a public source. There is no model fleet and no leader, " +
      "so there is no accuracy and no separation test is applicable — those fields are absent, not zero.",
  },
};

export default function StatusChip({ kind, className = "" }: { kind: BoardChipKind; className?: string }) {
  const c = CHIP[kind] ?? CHIP.UNMEASURED;
  return (
    <span
      title={c.title}
      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-tight ${c.className} ${className}`}
    >
      {c.text}
    </span>
  );
}

/**
 * Map an axis's declared state onto a chip. Anything unrecognised reads UNMEASURED.
 *
 * `kind` is the axis's measurement kind from /api/gspc (model-comparison /
 * deterministic-facts / declared-slot). It matters because a MEASURED axis with
 * no `separation` field is TWO different facts depending on kind: on a
 * model-comparison axis the test has not been run, on a deterministic-facts axis
 * no test is applicable. Before this argument existed, both fell through to
 * UNMEASURED — which called a signed mainnet run "unmeasured" on every surface.
 */
export function chipFor(status?: string, separation?: string, kind?: string): BoardChipKind {
  if (status !== "MEASURED") return "UNMEASURED";
  if (separation === "SEPARATED") return "SEPARATED";
  if (separation === "TIE") return "TIE";
  if (separation === "UNTESTED") return "UNTESTED";
  if (kind === "deterministic-facts") return "FACTS";
  // MEASURED model-comparison with no separation label yet — still measured.
  // Callers that need the figure-column chip should use figureChip().
  return "UNTESTED";
}

/**
 * Figure-column chip: distinguishes three absences that used to collapse into
 * one UNMEASURED lie on the home board.
 *   - true unmeasured / declared slot → UNMEASURED
 *   - deterministic facts (no leader by kind) → FACTS
 *   - MEASURED model-comparison with withheld public leader → WITHHELD
 */
export function figureChip(opts: {
  status?: string;
  kind?: string;
  hasPublicFigure?: boolean;
}): BoardChipKind {
  if (opts.hasPublicFigure) {
    // Caller already renders the number; chip unused. Keep a safe default.
    return "SEPARATED";
  }
  if (opts.status === "MEASURED" && opts.kind === "deterministic-facts") return "FACTS";
  if (opts.status === "MEASURED") return "WITHHELD";
  return "UNMEASURED";
}
