/**
 * learningDisplayLabels — the reviewed display dictionary for the Learning pane.
 *
 * WHY. The hydrated lesson used to print backend identifiers as teaching text:
 * `most_obligations_incl_art50_and_gpai`, `no_fine`, `CROSSWALK_POINTERS`.
 * Those are enum keys from client/src/data/regulator-crosswalk.json and
 * functions/api/learning-scenarios.ts. They stay available, verbatim, in the
 * technical details of each record; the primary copy shows a reviewed label.
 *
 * RULES.
 *   · An unknown identifier renders "Label unavailable" — never a guess.
 *   · A label describes a fine tier or a mapping state. It is never a
 *     determination that an obligation applies to anyone.
 *   · Fine-tier wording cites the regulation's own article so the label can be
 *     checked against regulator-crosswalk.json → fine_tiers.
 */

export interface DisplayLabel {
  /** The reviewed reader-facing label. */
  label: string;
  /** False when the identifier is not in the dictionary; the label is then the placeholder. */
  known: boolean;
  /** The raw identifier, kept for the technical inspector. */
  raw: string;
}

export const LABEL_UNAVAILABLE = "Label unavailable";

/** Fine-tier identifiers from regulator-crosswalk.json → fine_tiers. */
export const FINE_TIER_LABELS: Readonly<Record<string, string>> = Object.freeze({
  prohibited_practices:
    "EU AI Act Article 99(3) fine tier — infringement of the Article 5 prohibited-practices ban",
  most_obligations_incl_art50_and_gpai:
    "EU AI Act Article 99(4) fine tier — most obligations, including Article 50 transparency and GPAI provider duties",
  incorrect_or_misleading_info:
    "EU AI Act Article 99(5) fine tier — incorrect, incomplete or misleading information to authorities",
  no_fine: "No statutory fine of its own — a voluntary framework or security taxonomy",
});

/** regulation_context.state values from functions/api/learning-scenarios.ts. */
export const REGULATION_STATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  CROSSWALK_POINTERS: "Published crosswalk pointers (relevant-to only)",
  UNMAPPED: "No published mapping for this axis",
  UNCHECKABLE: "Could not be read",
});

/** evidence.published_state values. */
export const EVIDENCE_STATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  PUBLISHED_VERIFIED: "Published, signature verified",
  NONE_PUBLISHED: "No published card",
  UNCHECKABLE: "Could not be read",
});

/** board_measurement.status values. */
export const BOARD_STATE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  MEASURED: "Measured on the live board",
  UNMEASURED: "Not measured",
  UNCHECKABLE: "Could not be read",
});

function lookup(dict: Readonly<Record<string, string>>, raw: string | null | undefined): DisplayLabel {
  const key = typeof raw === "string" ? raw.trim() : "";
  if (key && Object.prototype.hasOwnProperty.call(dict, key)) {
    return { label: dict[key], known: true, raw: key };
  }
  return { label: LABEL_UNAVAILABLE, known: false, raw: key };
}

export const fineTierLabel = (raw: string | null | undefined) => lookup(FINE_TIER_LABELS, raw);
export const regulationStateLabel = (raw: string | null | undefined) => lookup(REGULATION_STATE_LABELS, raw);
export const evidenceStateLabel = (raw: string | null | undefined) => lookup(EVIDENCE_STATE_LABELS, raw);
export const boardStateLabel = (raw: string | null | undefined) => lookup(BOARD_STATE_LABELS, raw);
