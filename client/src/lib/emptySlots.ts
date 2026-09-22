/**
 * Axis honesty for /products — empty-as-finding only when unmeasured_axes > 0.
 *
 * Live board is GET /api/gspc → totals (never typed here). Do not paint
 * Seven empty / empty-slot chrome as if current UNMEASURED. Live financial ids:
 * ai-adoption-components, labour-components (not retired ai-economy-index /
 * human-labour-index labels).
 */

export type SlotFill = {
  id: string;
  axis: string;
  honest_next: string;
  never: string;
};

/** Prefer live GET; this static line is only a last-observation fallback. */
export const BOARD_LIVE_RULING =
  "Live board: GET /api/gspc — quote totals.public_count, never type the count here. Empty-as-finding only when unmeasured_axes > 0, which since ADR-002 (16 Sep 2026) it is: one declared slot, effect-binding, with no run behind it. A slot stays UNMEASURED until a signed cell exists — never fill with 0.";

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
    never: "SOC 2-style blog as a GSPC cell. This VM inventing a signer.",
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
      "MEASURED on the live board as a deterministic-facts run. Do not invent a separate robot-workforce score beyond the signed cell.",
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
