/**
 * schema.org Dataset JSON-LD for a State of the Agent Internet edition (Google Dataset Search).
 *
 * Every field is derived from the edition's own numbers.json (the board-signed file the page reads),
 * never typed here: name = title, description = what_this_is + doctrine, url = page,
 * dateModified = built_at, creator/publisher = publisher, distribution = numbers.json and its board
 * signature beside the page, isBasedOn = the Hugging Face datasets its sources name as public copies.
 *
 * license: every source with a public copy is a csoai/* Hugging Face dataset, and those datasets carry
 * CC-BY-4.0 (read from the Hub API on 27 Sep 2026: a2a-card-census, mcp-contract-parity,
 * erc8004-agent-census, hf-mcp-spaces-census, mcp-remote-census, x402-bazaar-conformance,
 * cross-ledger-supply). The URL is the estate's one data-licence constant (GSPC_LICENSE). The test
 * holds the premise: if a source's public copy ever leaves the csoai HF org, it fails.
 */
import { GSPC_LICENSE } from "./datasetSchema";

export type StateNumbersDoc = {
  title: string;
  what_this_is: string;
  doctrine: string;
  page: string;
  built_at: string;
  publisher: string;
  sources: Record<string, { public_copy: string | null }>;
};

const HF_DATASET = /^https:\/\/huggingface\.co\/datasets\/(csoai\/[^/]+)/;

/** The distinct csoai HF datasets the edition's sources name as public copies. */
export function sourceDatasets(doc: StateNumbersDoc): string[] {
  const out = new Set<string>();
  for (const s of Object.values(doc.sources)) {
    const m = s.public_copy ? HF_DATASET.exec(s.public_copy) : null;
    if (m) out.add(`https://huggingface.co/datasets/${m[1]}`);
  }
  return [...out].sort();
}

export function stateReportDatasetLd(doc: StateNumbersDoc): Record<string, unknown> {
  const page = doc.page.endsWith("/") ? doc.page : `${doc.page}/`;
  const org = { "@type": "Organization", name: doc.publisher, url: new URL("/", page).toString() };
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${page}#dataset`,
    name: doc.title,
    description: `${doc.what_this_is} ${doc.doctrine}`,
    url: page,
    license: GSPC_LICENSE,
    isAccessibleForFree: true,
    dateModified: doc.built_at,
    creator: org,
    publisher: org,
    isBasedOn: sourceDatasets(doc),
    distribution: [
      { "@type": "DataDownload", name: "numbers.json", encodingFormat: "application/json", contentUrl: new URL("numbers.json", page).toString() },
      {
        "@type": "DataDownload",
        name: "numbers.signed.json (board signature over numbers.json)",
        encodingFormat: "application/json",
        contentUrl: new URL("numbers.signed.json", page).toString(),
      },
    ],
  };
}
