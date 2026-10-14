/**
 * Axis honesty for /products — empty-as-finding only when unmeasured_axes > 0.
 *
 * Live board is GET /api/gspc → totals (never typed here). Do not paint
 * Seven empty / empty-slot chrome as if current UNMEASURED. Live financial ids:
 * ai-adoption-components, labour-components (not retired ai-economy-index /
 * human-labour-index labels).
 *
 * 2026-10-06 (Inspector scope2 K1): the ruling line used to be TYPED and said
 * "since ADR-002 … it is: one declared slot, effect-binding, with no run behind
 * it" while the live board read unmeasured_axes 0 (effect-binding MEASURED since
 * 2026-09-22). The line is now DERIVED from a BoardCount (live GET /api/gspc via
 * useBoardCount, or the dated facts.json observation until the fetch lands), so
 * it can only say what the totals say.
 */
import { BOARD_COUNT_OBSERVED, BOARD_OBSERVED_AT, type BoardCount } from "./boardCount";

export type SlotFill = {
  id: string;
  axis: string;
  honest_next: string;
  never: string;
};

/**
 * The board-honesty ruling, derived from the board's own totals — never typed.
 * Pass the live BoardCount (useBoardCount). With the recorded observation
 * (live: false) the line names the observation date and says the live GET wins.
 */
export function boardRulingFrom(count: BoardCount): string {
  const source = count.live
    ? "Live board (GET /api/gspc)"
    : `Board as last observed${BOARD_OBSERVED_AT ? ` on ${BOARD_OBSERVED_AT}` : ""} (GET /api/gspc supersedes this)`;
  const head = `${source}: ${count.public_count}.`;
  const rule = "A slot stays UNMEASURED until a signed cell exists — never fill with 0.";
  if (count.unmeasured_axes > 0) {
    const slots = count.unmeasured_axes === 1 ? "1 declared slot has" : `${count.unmeasured_axes} declared slots have`;
    return `${head} Empty-as-finding applies: ${slots} no run behind it (totals.unmeasured_axes = ${count.unmeasured_axes}). ${rule}`;
  }
  return `${head} totals.unmeasured_axes = 0: every declared slot carries a measurement, so no slot is shown empty. Empty-as-finding applies only when unmeasured_axes > 0. ${rule}`;
}

/** Last-observation fallback (dated). Surfaces should render boardRulingFrom(useBoardCount()). */
export const BOARD_LIVE_RULING = boardRulingFrom(BOARD_COUNT_OBSERVED);

/** @deprecated name kept for imports; no longer claims seven UNMEASURED slots. */
export const EMPTY_SLOT_RULING = BOARD_LIVE_RULING;

/**
 * Instrument notes for financial/domain axes that once sat as empty placeholders.
 * Ids match live GET /api/gspc axis names. Not a claim they are UNMEASURED today.
 */
export const EMPTY_SLOTS: SlotFill[] = [
  {
    id: "reserve-attestation",
    axis: "reserve-attestation",
    honest_next:
      "MEASURED on the live board (deterministic-facts). /xrpl-attest is a public-root reader, not a mill. We attest; we do not issue.",
    never: "Mainnet CredentialCreate this week. On-chain MEASURED. Invented issuer account.",
  },
  {
    id: "regulatory-framework",
    axis: "regulatory-framework",
    honest_next:
      "MEASURED on the live board. Provision text is watched (GET /api/regulation, corrections). A frozen bank and n keep the cell honest — not an LLM map of 417 articles.",
    never: "Auto-scrape → MEASURED. A living-law blog post as a grade.",
  },
  {
    id: "distribution-integrity",
    axis: "distribution-integrity",
    honest_next:
      "MEASURED on the live board. SCITT / signed-SBOM as attachments on a cell. Represented is not distributed.",
    never: "Generate statements for 14 banks and call the axis MEASURED.",
  },
  {
    id: "custody-disclosure",
    axis: "custody-disclosure",
    honest_next:
      "MEASURED on the live board. did:web:csoai.org is planted. MEASURED is a disclosure instrument on a subject, not a ceremony write-up.",
    never: "SOC 2-style blog as a GSPC cell. A signer invented to fill the cell.",
  },
  {
    id: "ai-adoption-components",
    axis: "ai-adoption-components",
    honest_next:
      "MEASURED on the live board as component facts (not the withdrawn ai-economy-index / MEASURED-INDEX-v0.1 sticker, C-2026-0826-05). Dated aggregates may be REPORTED with attribution.",
    never: "Crunchbase scrape as a GSPC grade. An investable index. Restoring the withdrawn MEASURED-INDEX-v0.1 sticker (C-2026-0826-05).",
  },
  {
    id: "labour-components",
    axis: "labour-components",
    honest_next:
      "MEASURED on the live board as component facts (not the retired human-labour-index label). Eurostat / ONS series can be cited as REPORTED. Displacement is not a Council diagnosis.",
    never: "LinkedIn scrape as MEASURED. A prognosis of the labour market.",
  },
  {
    id: "humanoid-labour-index",
    axis: "humanoid-labour-index",
    honest_next:
      "MEASURED on the live board as a deterministic-facts run. No separate robot-workforce score is published beyond the signed cell.",
    never: "Tesla / Figure scrape as MEASURED. A robot-workforce score.",
  },
];

export const CENSUS_SITES = [
  {
    id: "huggingface",
    title: "Hugging Face Hub",
    status: "planted" as const,
    does: "Speed 0 rail. list + blobs=true. Eligibility states. No weight download.",
  },
  {
    id: "openrouter",
    title: "OpenRouter",
    status: "next" as const,
    does: "DISCOVERED catalogue of hosted ids. Not a measurement target until a unique lineage run.",
  },
  {
    id: "ollama",
    title: "Ollama library",
    status: "next" as const,
    does: "Local pull list as DISCOVERED. Do not treat a library card as MEASURED.",
  },
  {
    id: "kaggle",
    title: "Kaggle",
    status: "next" as const,
    does: "Benchmark tasks after cost and reproducibility gates. One org identity.",
  },
  {
    id: "github",
    title: "GitHub model configs",
    status: "next" as const,
    does: "Discovery of declared weights. Listing is not a run.",
  },
] as const;
