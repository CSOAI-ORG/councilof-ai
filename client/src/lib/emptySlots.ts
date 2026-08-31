/**
 * Seven empty slots — how they actually get filled.
 *
 * The playbook lists the right names, then proposes a week of scrapes,
 * XRPL mainnet and press releases that write MEASURED. That is the
 * forbidden shortcut. Empty is a first-class cell until a bolted
 * instrument, a frozen bank, n, evidence and verify exist.
 */

export type SlotFill = {
  id: string;
  axis: string;
  honest_next: string;
  never: string;
};

export const EMPTY_SLOT_RULING =
  "The seven empty slots stay UNMEASURED until a signed cell exists. A scrape is DISCOVERED or REPORTED, not MEASURED.";

export const EMPTY_SLOTS: SlotFill[] = [
  {
    id: "reserve-attestation",
    axis: "reserve-attestation",
    honest_next:
      "A live partner issuer plus a bolted instrument. /xrpl-attest is a public-root reader, not a mill. We attest; we do not issue.",
    never: "Mainnet CredentialCreate this week. On-chain MEASURED. Invented issuer account.",
  },
  {
    id: "regulatory-framework",
    axis: "regulatory-framework",
    honest_next:
      "Provision text is already watched (GET /api/regulation, corrections). MEASURED needs a frozen bank and n, not an LLM map of 417 articles.",
    never: "Auto-scrape → MEASURED. A living-law blog post as a grade.",
  },
  {
    id: "distribution-integrity",
    axis: "distribution-integrity",
    honest_next:
      "SCITT / signed-SBOM as attachments on a cell. Represented is not distributed. Slot stays empty until the instrument runs.",
    never: "Generate statements for 14 banks and call the axis MEASURED.",
  },
  {
    id: "custody-disclosure",
    axis: "custody-disclosure",
    honest_next:
      "did:web:csoai.org is planted. MEASURED is a disclosure instrument on a subject, not a ceremony write-up.",
    never: "SOC 2-style blog as a GSPC cell. This VM inventing a signer.",
  },
  {
    id: "ai-economy-index",
    axis: "ai-economy-index",
    honest_next:
      "Dated aggregates may be REPORTED with attribution. They never blend into MEASURED without a frozen bank.",
    never: "Crunchbase scrape as a GSPC grade. An investable index.",
  },
  {
    id: "human-labour-index",
    axis: "human-labour-index",
    honest_next:
      "Eurostat / ONS series can be cited as REPORTED. Displacement is not a Council diagnosis.",
    never: "LinkedIn scrape as MEASURED. A prognosis of the labour market.",
  },
  {
    id: "humanoid-labour-index",
    axis: "humanoid-labour-index",
    honest_next:
      "Need an input bank first. Until then the slot is published empty — that is the finding.",
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
