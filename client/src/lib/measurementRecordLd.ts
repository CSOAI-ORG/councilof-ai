/**
 * schema.org Dataset JSON-LD for a signed measurement-record page (the disclosure-lag records).
 *
 * Every value is copied from the record file the page already renders
 * (client/src/data/measurements/<kind>/<id>.json, byte-identical to public/…/record.json) or from the
 * page's own title, description and record path. Nothing is computed. The records state no licence,
 * so no licence is asserted; the three files are the record, its board signature and its
 * OpenTimestamps proof, each served beside the page.
 */
const SITE = "https://councilof.ai";

type Capsule = { subject_id: string; measurement_state: string; method: string; observed_at: string };
type RecordFile = { as_of: string; capsules: Capsule[] };

/** `recordBase` is the page's record path without extension, e.g. "/measurements/<kind>/<id>/record". */
export function measurementRecordLd(recordBase: string, rec: RecordFile, name: string, description: string) {
  const c = rec.capsules[0];
  const page = `${SITE}${recordBase.replace(/\/record$/, "/")}`;
  const org = { "@type": "Organization", "@id": `${SITE}/#org`, name: "Council of AI", url: `${SITE}/` };
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${page}#dataset`,
    name,
    description,
    url: page,
    identifier: c.subject_id,
    dateModified: rec.as_of,
    creativeWorkStatus: c.measurement_state,
    measurementTechnique: c.method,
    isAccessibleForFree: true,
    creator: org,
    publisher: org,
    distribution: [
      { "@type": "DataDownload", name: "record.json", encodingFormat: "application/json", contentUrl: `${SITE}${recordBase}.json` },
      { "@type": "DataDownload", name: "record.signed.json", encodingFormat: "application/json", contentUrl: `${SITE}${recordBase}.signed.json` },
      { "@type": "DataDownload", name: "record.json.ots", encodingFormat: "application/octet-stream", contentUrl: `${SITE}${recordBase}.json.ots` },
    ],
  };
}

/** Serialised for a <script type="application/ld+json"> body: no "<" can close the element early. */
export const ldJson = (o: unknown) => JSON.stringify(o).replace(/</g, "\\u003c");

/**
 * A page that fronts one Hugging Face dataset (csoai/<name>): a Dataset node whose sameAs is the Hub
 * page and whose subjectOf is the Hub's Croissant description. No licence is typed here: the Hub
 * card is the authority for it, and Croissant carries it.
 */
export function hubDatasetLd(o: { page: string; dataset: string; name: string; description: string; version?: string }) {
  const hub = `https://huggingface.co/datasets/${o.dataset}`;
  const org = { "@type": "Organization", "@id": `${SITE}/#org`, name: "Council of AI", url: `${SITE}/` };
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE}${o.page}#dataset`,
    name: o.name,
    description: o.description,
    url: `${SITE}${o.page}`,
    sameAs: hub,
    ...(o.version ? { version: o.version } : {}),
    isAccessibleForFree: true,
    creator: org,
    publisher: org,
    subjectOf: {
      "@type": "CreativeWork",
      name: `Croissant metadata for ${o.dataset} (Hugging Face)`,
      encodingFormat: "application/ld+json",
      url: `https://huggingface.co/api/datasets/${o.dataset}/croissant`,
    },
  };
}
