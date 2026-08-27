// GSPC Dataset JSON-LD — single source, derived from the axis registry.
//
// Why this file exists: answer engines (ChatGPT, Perplexity, Google AIO) and
// Hugging Face Dataset-Search cite sources that carry schema.org `Dataset`
// markup. The GSPC banks ARE published, citable datasets; this emits the markup
// so they can be indexed and cited as such.
//
// Honesty invariants (this is a measurement body; the schema must not out-claim
// the evidence):
//   • Per-axis Dataset nodes are DERIVED FROM `AXES`, so the site can never
//     assert a bank that is not in the single source of truth. Only axes that
//     publish a Hugging Face dataset slug get a node — no constructed slugs.
//   • Every asserted field is verifiable: the HF datasets exist under the csoai
//     org and are licensed CC-BY-4.0; the concept DOI resolves and is the same
//     DOI GET /api/gspc publishes as the board's citable identifier.
//   • The concept DOI is attached to the BOARD only. Per-axis DOIs are attached
//     where a bank's DOI has been minted and the axis is in the single source of
//     truth (AXES). Axes minted but not yet in AXES await registry inclusion —
//     no constructed identifiers, no invented DOIs.

import { AXES } from "./gspcAxes";

const BASE = "https://councilof.ai";

/** The board's citable identifier. Resolves, and is the DOI GET /api/gspc
 *  publishes for the board. Concept DOI (all-versions) of the GSPC corpus. */
export const GSPC_DOI = "10.5281/zenodo.21991104";

/** CC-BY-4.0 — the license carried by every csoai/gspc-* dataset on HF and
 *  reported in the /api/gspc license field. */
export const GSPC_LICENSE = "https://creativecommons.org/licenses/by/4.0/";

/** Per-axis minted DOIs (Zenodo, 2026-08-23). Keyed by AXES axis id. Only
 *  axis whose bank is in the registry AND whose DOI is minted appear here —
 *  a DOI is never guessed. Minted-but-unregistered axis (the 10 new banks)
 *  are documented in AXES_ACCEPTING_DOIS and wired once the registry adds them. */
export const GSPC_AXIS_DOIS: Record<string, string> = {
  safety: "10.5281/zenodo.22070699",
  continuity: "10.5281/zenodo.22070703",
};

/** Axis banks with a minted Zenodo DOI but not yet in the AXES registry
 *  (board-count expansion is the canon owner's call). Listed here so the
 *  identifier wiring is a one-line addition when each axis lands. */
export const AXES_ACCEPTING_DOIS: Record<string, string> = {
  transparency: "10.5281/zenodo.22070706",
  accountability: "10.5281/zenodo.22070711",
  creativity: "10.5281/zenodo.22070713",
  efficiency: "10.5281/zenodo.22070715",
  fairness: "10.5281/zenodo.22070718",
  "human-vs-ai": "10.5281/zenodo.22070721",
  slot15: "10.5281/zenodo.22070723",
  sovereignty: "10.5281/zenodo.22070725",
};

/** The estate's canonical publisher node. */
export const GSPC_CREATOR = {
  "@type": "Organization",
  name: "Council of AI",
  legalName: "CSOAI Ltd",
  url: BASE + "/",
  identifier: "UK Companies House 16939677",
} as const;

/** The deterministic method, stated the way the site states it everywhere else. */
export const GSPC_MEASUREMENT_TECHNIQUE =
  "Deterministic grading against frozen, published gold labels: no model judges another, unparsed answers are counted incorrect, leader separation is McNemar-primary with Wilson 95% intervals, and nothing is quoted below n≥30. Every number is recomputable from its published rows.";

const hfUrl = (slug: string) => `https://huggingface.co/datasets/${slug}`;

/** Per-axis Dataset nodes, one per published bank, derived from the registry. */
export function gspcAxisDatasets(): Record<string, unknown>[] {
  return AXES.filter((a) => a.dataset).map((a) => {
    const hf = hfUrl(a.dataset as string);
    const doi = GSPC_AXIS_DOIS[a.axis];
    const node: Record<string, unknown> = {
      "@type": "Dataset",
      name: `GSPC — ${a.axis} bank (${a.bench})`,
      description: a.task,
      url: hf,
      sameAs: hf,
      license: GSPC_LICENSE,
      isAccessibleForFree: true,
      creator: GSPC_CREATOR,
      publisher: GSPC_CREATOR,
      measurementTechnique: GSPC_MEASUREMENT_TECHNIQUE,
      variableMeasured: a.task,
      isPartOf: { "@type": "Dataset", name: "GSPC board", url: `${BASE}/gspc-scoreboard` },
      distribution: [
        { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: hf },
      ],
    };
    // A minted DOI makes the bank citable; it is only asserted when real.
    if (doi) {
      node.identifier = doi;
      node.citation = `https://doi.org/${doi}`;
    }
    return node;
  });
}

/**
 * The board-level Dataset. `withParts` embeds the per-axis banks via `hasPart`
 * so a single crawl exposes every published bank to Dataset-Search / AEO.
 */
export function gspcBoardDataset(withParts = true): Record<string, unknown> {
  const node: Record<string, unknown> = {
    "@type": "Dataset",
    name: "GSPC board — governance-axis AI measurement banks",
    description:
      "Deterministic per-axis AI-governance measurement banks and their live results: per-item counts, leader accuracy, Wilson 95% intervals where n≥30, and McNemar-primary separation verdicts (ties stated as ties). Empty cells stay empty. The live count and stamps come from GET /api/gspc.",
    url: `${BASE}/gspc-scoreboard`,
    identifier: GSPC_DOI,
    citation: `https://doi.org/${GSPC_DOI}`,
    license: GSPC_LICENSE,
    isAccessibleForFree: true,
    creator: GSPC_CREATOR,
    publisher: GSPC_CREATOR,
    measurementTechnique: GSPC_MEASUREMENT_TECHNIQUE,
    keywords: [
      "AI governance",
      "EU AI Act",
      "AI measurement",
      "GSPC",
      "benchmark",
      "deterministic grading",
      "model evaluation",
    ],
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: `${BASE}/api/gspc` },
    ],
  };
  if (withParts) node.hasPart = gspcAxisDatasets();
  return node;
}

/** A ready-to-serialise JSON-LD document for the board page. */
export function gspcDatasetLd(withParts = true): Record<string, unknown> {
  return { "@context": "https://schema.org", ...gspcBoardDataset(withParts) };
}
