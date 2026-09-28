#!/usr/bin/env node
/**
 * static-dataset-ld.mjs — schema.org Dataset JSON-LD for the hand-written static pages that each
 * front ONE published dataset (the bench pages -> a csoai/gspc-* bank on Hugging Face; the
 * signed-receipts/v1 conformance kit -> its vectors.json).
 *
 * WHY. These pages are what a dataset search engine lands on for the banks and the kit, and they
 * carried no Dataset node (the bench pages only a WebSite node), so none could be indexed as a
 * dataset. The JSON-LD is written between <!--dataset-ld--> markers, so a re-run replaces it in
 * place and never duplicates it. Nothing visible on any page changes.
 *
 * WHAT IS COPIED, NOT TYPED: page name and URL from the page's own <title> and canonical link;
 * licence from the Hub card's `license` field (bench) or from vectors.json `license` (kit); the
 * kit's date from vectors.json `generated`. A licence id this file does not know is left out,
 * never guessed. The prose templates below carry no numbers.
 *
 *   node scripts/static-dataset-ld.mjs          # (re)write the blocks; reads each Hub card's licence
 *   node scripts/static-dataset-ld.mjs --check  # offline: every listed page carries exactly one valid Dataset block
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://councilof.ai";
const HF = "https://huggingface.co";
const OPEN = "<!--dataset-ld-->";
const CLOSE = "<!--/dataset-ld-->";
const CHECK = process.argv.includes("--check");

const LICENSE_URLS = {
  "cc-by-4.0": "https://creativecommons.org/licenses/by/4.0/",
  "cc-by-sa-4.0": "https://creativecommons.org/licenses/by-sa/4.0/",
  "cc0-1.0": "https://creativecommons.org/publicdomain/zero/1.0/",
  mit: "https://opensource.org/licenses/MIT",
  "apache-2.0": "https://www.apache.org/licenses/LICENSE-2.0",
};
const licenseUrl = (id) => (typeof id === "string" ? LICENSE_URLS[id.toLowerCase()] ?? null : null);

export const BENCH_PAGES = [
  { file: "public/agibench.html", dataset: "gspc-agi" },
  { file: "public/carebench.html", dataset: "gspc-care" },
  { file: "public/conductbench.html", dataset: "gspc-art5" },
  { file: "public/defbench.html", dataset: "gspc-jail-goldbank" },
  { file: "public/detbench.html", dataset: "gspc-det" },
  { file: "public/machbench.html", dataset: "gspc-mach" },
  { file: "public/xrbench.html", dataset: "gspc-xr" },
];
export const KIT = {
  file: "public/spec/signed-receipts/v1/conformance/index.html",
  vectors: "public/spec/signed-receipts/v1/conformance/vectors.json",
  files: [
    ["vectors.json", "application/json"],
    ["reference-results.json", "application/json"],
    ["run.py", "text/x-python"],
    ["run.mjs", "text/javascript"],
  ],
};

const ORG = { "@type": "Organization", "@id": `${SITE}/#org`, name: "Council of AI", url: `${SITE}/` };
const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");
const titleOf = (html) => (/<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "").replace(/\s+—\s+Council of AI\s*$/, "").trim();
const canonicalOf = (html) => /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1] ?? null;

export function benchLd(html, dataset, license) {
  const name = titleOf(html);
  const node = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${canonicalOf(html)}#dataset`,
    name: `${name} measurement bank (csoai/${dataset})`,
    description:
      `The frozen measurement bank behind the ${name} page of the Council of AI GSPC board, published as the Hugging Face dataset csoai/${dataset}. ` +
      "The live item count and results are the matching axis row on GET https://councilof.ai/api/gspc, not a figure on this page. Measurement, not certification.",
    url: canonicalOf(html),
    sameAs: `${HF}/datasets/csoai/${dataset}`,
    isAccessibleForFree: true,
    creator: ORG,
    publisher: ORG,
    subjectOf: { "@type": "CreativeWork", name: `Croissant metadata for csoai/${dataset} (Hugging Face)`, encodingFormat: "application/ld+json", url: `${HF}/api/datasets/csoai/${dataset}/croissant` },
  };
  const lic = licenseUrl(license);
  if (lic) node.license = lic;
  return node;
}

export function kitLd(html, vectors) {
  const url = canonicalOf(html);
  const node = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": `${url}#dataset`,
    name: "signed-receipts/v1 conformance vectors",
    description:
      "Conformance test vectors, reference results and one-command runners in Python and Node for the signed-receipts/v1 A2A receipt format, " +
      "with a DID resolution fixture. PASS means an implementation's result for a case matches the expected result in vectors.json; it is not a certification, an endorsement or a conformity mark.",
    url,
    isAccessibleForFree: true,
    creator: ORG,
    publisher: ORG,
    isPartOf: { "@type": "CreativeWork", name: "signed-receipts/v1 specification", url: vectors.spec },
    distribution: KIT.files.map(([f, t]) => ({ "@type": "DataDownload", name: f, encodingFormat: t, contentUrl: new URL(f, url).href })),
  };
  if (typeof vectors.generated === "string") node.dateModified = vectors.generated;
  const lic = licenseUrl(vectors.license);
  if (lic) node.license = lic;
  return node;
}

const scriptJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const block = (node) => `${OPEN}\n<script type="application/ld+json">${scriptJson(node)}</script>\n${CLOSE}`;

export function withBlock(html, b) {
  const re = new RegExp(`${OPEN}[\\s\\S]*?${CLOSE}`);
  if (re.test(html)) return html.replace(re, () => b);
  const i = html.indexOf("</head>");
  if (i >= 0) return html.slice(0, i) + b + "\n" + html.slice(i);
  const m = /<link rel="canonical" href="[^"]+">\n?/.exec(html);
  if (!m) throw new Error("no </head> and no canonical link to anchor the block");
  const at = m.index + m[0].length;
  return html.slice(0, at) + (m[0].endsWith("\n") ? "" : "\n") + b + "\n" + html.slice(at);
}

export function checkPage(html) {
  const blocks = [...html.matchAll(new RegExp(`${OPEN}\\n<script type="application/ld\\+json">([\\s\\S]*?)</script>\\n${CLOSE}`, "g"))];
  if (blocks.length !== 1) return [`expected one marked Dataset block, found ${blocks.length}`];
  let n;
  try { n = JSON.parse(blocks[0][1]); } catch (e) { return [`unparseable: ${e.message}`]; }
  const p = [];
  if (n["@type"] !== "Dataset") p.push("@type is not Dataset");
  if (!n.name) p.push("no name");
  if (!(typeof n.description === "string" && n.description.length >= 50 && n.description.length <= 5000)) p.push("description not 50-5000 chars");
  if (n.url !== canonicalOf(html)) p.push("url is not the page's canonical");
  if (!n.creator?.name) p.push("no creator");
  return p;
}

async function hubLicense(ds) {
  const r = await fetch(`${HF}/api/datasets/csoai/${ds}`, { headers: { "user-agent": "csoai-static-dataset-ld/0.1 (+https://councilof.ai/status)" } });
  if (r.status !== 200) return undefined;
  const lic = (await r.json())?.cardData?.license;
  return typeof lic === "string" ? lic : Array.isArray(lic) ? lic[0] ?? null : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const all = [...BENCH_PAGES.map((b) => b.file), KIT.file];
  if (CHECK) {
    let bad = 0;
    for (const f of all) {
      const probs = checkPage(read(f));
      if (probs.length) { bad++; console.error(`✖ ${f}: ${probs.join("; ")}`); }
    }
    if (bad) { console.error(`✖ static-dataset-ld: ${bad} of ${all.length} pages fail. Regenerate: node scripts/static-dataset-ld.mjs`); process.exit(1); }
    console.log(`✓ static-dataset-ld: ${all.length} pages each carry one valid Dataset block`);
    process.exit(0);
  }
  let wrote = 0;
  const unread = [];
  for (const b of BENCH_PAGES) {
    const lic = await hubLicense(b.dataset);
    if (lic === undefined) { unread.push(b.dataset); continue; } // unread card: page left as it is
    const html = read(b.file);
    const next = withBlock(html, block(benchLd(html, b.dataset, lic)));
    if (next !== html) { fs.writeFileSync(path.join(REPO, b.file), next); wrote++; console.log(`wrote ${b.file}`); }
  }
  const kitHtml = read(KIT.file);
  const kitNext = withBlock(kitHtml, block(kitLd(kitHtml, JSON.parse(read(KIT.vectors)))));
  if (kitNext !== kitHtml) { fs.writeFileSync(path.join(REPO, KIT.file), kitNext); wrote++; console.log(`wrote ${KIT.file}`); }
  console.log(`static-dataset-ld: ${wrote} page(s) written${unread.length ? `; Hub card unread, left as is: ${unread.join(", ")}` : ""}`);
}
