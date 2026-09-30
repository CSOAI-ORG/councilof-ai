/**
 * scripts/pubbus/ld.mjs — schema.org Dataset JSON-LD for the signed evidence record pages.
 *
 * WHY. Every /evidence/<slug>/ page describes one Hugging Face dataset and pins one signed record in
 * it, yet none carried Dataset markup, so dataset search engines saw a plain page. This adds the
 * markup and a link to the Hub's Croissant description of the same dataset.
 *
 * THE RULE, same as the pages: nothing here is computed. Every value is copied from the bus manifest
 * entry (public/evidence/published-records.json) or from the dataset card's own `license` field on
 * the Hub. A licence id we do not know maps to nothing — it is left out, never guessed. When the
 * card could not be read, the caller leaves the page as it is: an unread licence is not "no licence".
 *
 * The block sits in <head> between <!--pubbus:ld--> markers, so it is replaced in place and never
 * duplicated. It is inside <script>/<link> tags, so lib.visibleText (the foreign-number guard) never
 * sees it.
 */
import { HF, SITE } from "./lib.mjs";

export const LD_OPEN = "<!--pubbus:ld-->";
export const LD_CLOSE = "<!--/pubbus:ld-->";

/** Hub card licence ids -> the licence's canonical URL. Unknown ids return null (left out). */
const LICENSE_URLS = {
  "cc-by-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "cc-by-sa-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "cc0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  "odc-by": "https://opendatacommons.org/licenses/by/1-0/",
  mit: "https://opensource.org/licenses/MIT",
  "apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
};
export const licenseUrl = (id) => (typeof id === "string" ? LICENSE_URLS[id.toLowerCase()] ?? null : null);

export const hubDatasetUrl = (dataset) => `${HF}/datasets/csoai/${dataset}`;
export const croissantUrl = (dataset) => `${HF}/api/datasets/csoai/${dataset}/croissant`;

const ORG = { "@type": "Organization", "@id": `${SITE}/#org`, name: "Council of AI", url: `${SITE}/` };

function common(dataset, license) {
  const node = {
    sameAs: hubDatasetUrl(dataset),
    isBasedOn: hubDatasetUrl(dataset),
    isAccessibleForFree: true,
    creator: ORG,
    publisher: ORG,
    subjectOf: {
      "@type": "CreativeWork",
      name: `Croissant metadata for csoai/${dataset} (Hugging Face)`,
      encodingFormat: "application/ld+json",
      url: croissantUrl(dataset),
    },
  };
  const lic = licenseUrl(license);
  if (lic) node.license = lic;
  return node;
}

/** One signed record version: /evidence/<slug>/<version>/ */
export function versionDatasetLd(entry, mv, license) {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE}${mv.page}#dataset`,
    name: `${entry.title} — signed evidence record ${mv.version}`,
    description:
      `A signed evidence record from the Hugging Face dataset csoai/${entry.dataset}, as of ${mv.as_of}: ` +
      "the record's own fields copied verbatim, the limits it states about itself, its sha256, its Ed25519 " +
      "signature state and its OpenTimestamps state, with the commands to verify each. Evidence, not a grade.",
    url: `${SITE}${mv.page}`,
    version: mv.version,
    dateCreated: mv.as_of,
    creativeWorkStatus: mv.state,
    identifier: `sha256:${mv.record_sha256}`,
    ...common(entry.dataset, license),
    isPartOf: { "@type": "Dataset", "@id": `${SITE}${entry.page_index}#dataset`, name: entry.title, url: `${SITE}${entry.page_index}` },
    distribution: [
      { "@type": "DataDownload", name: mv.artifact_path, encodingFormat: "application/json", contentUrl: mv.record_url, sha256: mv.record_sha256 },
      { "@type": "DataDownload", name: mv.signed_path, encodingFormat: "application/json", contentUrl: mv.signed_url, sha256: mv.signed_sha256 },
    ],
  };
}

/** The series index: /evidence/<slug>/ */
export function seriesDatasetLd(entry, license) {
  const cur = entry.versions.find((v) => v.state === "CURRENT");
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${SITE}${entry.page_index}#dataset`,
    name: `${entry.title} — signed evidence records`,
    description:
      `Every published version of the signed evidence record series from the Hugging Face dataset csoai/${entry.dataset}, ` +
      "current and superseded, each with its sha256, signature state and timestamp state. Superseded versions stay published. Evidence, not a grade.",
    url: `${SITE}${entry.page_index}`,
    ...(cur ? { version: cur.version, dateModified: cur.as_of } : {}),
    ...common(entry.dataset, license),
    hasPart: entry.versions.map((v) => ({ "@type": "Dataset", "@id": `${SITE}${v.page}#dataset`, name: `${entry.title} — ${v.version}`, url: `${SITE}${v.page}` })),
  };
}

/** JSON for inside <script>: no "<" can close the element early. */
const scriptJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function ldBlock(obj, dataset) {
  return (
    `${LD_OPEN}\n<script type="application/ld+json">${scriptJson(obj)}</script>\n` +
    `<link rel="alternate" type="application/ld+json" title="Croissant metadata (Hugging Face)" href="${attr(croissantUrl(dataset))}">\n${LD_CLOSE}`
  );
}

/** Put the block in <head>: replace an existing marked block, else insert before </head>. */
export function withLd(html, block) {
  const re = new RegExp(`${LD_OPEN}[\\s\\S]*?${LD_CLOSE}`);
  if (re.test(html)) return html.replace(re, () => block);
  const i = html.indexOf("</head>");
  if (i < 0) return html;
  return html.slice(0, i) + block + "\n" + html.slice(i);
}

/** Read each dataset card licence once. Map value: string id, null (card states none), or undefined (unread). */
export async function datasetLicenses(fetcher, datasets) {
  const out = new Map();
  for (const ds of datasets) {
    try {
      const r = await fetcher(`${HF}/api/datasets/csoai/${ds}`);
      if (r.status !== 200) { out.set(ds, undefined); continue; }
      const card = JSON.parse(r.bytes.toString("utf8"));
      const lic = card?.cardData?.license;
      out.set(ds, typeof lic === "string" ? lic : Array.isArray(lic) && typeof lic[0] === "string" ? lic[0] : null);
    } catch {
      out.set(ds, undefined);
    }
  }
  return out;
}

/**
 * The pass: for every manifest entry whose licence was READ (string or null), write the block into
 * the series page and every version page that exists. Returns the site paths whose bytes changed.
 */
export function applyLd(entries, licenses, { exists, read, writeIfChanged }) {
  const changed = [];
  for (const entry of entries) {
    const lic = licenses.get(entry.dataset);
    if (lic === undefined) continue;
    for (const mv of entry.versions) {
      const rel = `public${mv.page}index.html`;
      if (!exists(rel)) continue;
      if (writeIfChanged(rel, withLd(read(rel), ldBlock(versionDatasetLd(entry, mv, lic), entry.dataset)))) changed.push(mv.page);
    }
    const idx = `public${entry.page_index}index.html`;
    if (exists(idx) && writeIfChanged(idx, withLd(read(idx), ldBlock(seriesDatasetLd(entry, lic), entry.dataset)))) changed.push(entry.page_index);
  }
  return changed;
}

/** A page re-rendered by the bus keeps the block its previous bytes carried, so a re-render plus the pass is one write, not two. */
export function carryLd(nextHtml, prevHtml) {
  const m = typeof prevHtml === "string" ? new RegExp(`${LD_OPEN}[\\s\\S]*?${LD_CLOSE}`).exec(prevHtml) : null;
  return m ? withLd(nextHtml, m[0]) : nextHtml;
}
