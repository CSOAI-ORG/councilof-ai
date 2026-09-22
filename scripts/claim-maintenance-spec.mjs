#!/usr/bin/env node
/**
 * claim-maintenance-spec.mjs — ONE producer for the Claim Maintenance specification surface.
 *
 * The document of record is the Markdown file. Everything else on that URL is derived from it:
 * the HTML a human reads, the machine metadata a citing tool reads, and the version index.
 * A specification whose HTML is hand-maintained beside its Markdown is two specifications, and
 * the estate has already paid for that mistake elsewhere (a claim lives in the artifact AND its
 * producer). So: edit the .md, re-run this, commit what it writes.
 *
 * A PUBLISHED VERSION IS NEVER EDITED. This script regenerates the derived files for a version
 * directory; it does not license changing the prose of a version that has been cited. v0.2 is a
 * NEW directory. The version index records every version with its digest so a reader can tell.
 *
 *   node scripts/claim-maintenance-spec.mjs            # write index.html, spec.json, index.json
 *   node scripts/claim-maintenance-spec.mjs --check    # CI: committed files must equal derived
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SPEC_DIR = join(ROOT, "public/spec/claim-maintenance");
const CHECK = process.argv.includes("--check");
const BASE = "https://councilof.ai";

const sha256 = (s) => createHash("sha256").update(s).digest("hex");

/** Versions are directories named vN.M. A published version is never edited; v0.2 is a new dir. */
const versions = () =>
  readdirSync(SPEC_DIR)
    .filter((d) => /^v\d+\.\d+$/.test(d) && statSync(join(SPEC_DIR, d)).isDirectory())
    .sort();

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Inline markdown: code, links, bold. Applied to already-escaped text. */
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, h) => `<a href="${h}">${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*]+)\*(?=[^*\w]|$)/g, "$1<em>$2</em>");

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * A deliberately small Markdown subset — headings, tables, fenced code, lists, blockquote-free
 * paragraphs, horizontal rules. The input is ours, so the converter only has to handle what we
 * write; a general Markdown engine would be a dependency this file does not need.
 */
function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  const toc = [];
  let i = 0;
  let para = [];
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(para.join(" "))}</p>`);
      para = [];
    }
  };
  while (i < lines.length) {
    const line = lines[i];
    // fenced code
    if (/^```/.test(line)) {
      flushPara();
      const lang = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(
        `<pre><code${lang ? ` class="lang-${esc(lang)}"` : ""}>${esc(buf.join("\n"))}</code></pre>`,
      );
      continue;
    }
    // table
    if (/^\|/.test(line) && /^\|[\s:|-]+\|$/.test(lines[i + 1] || "")) {
      flushPara();
      const cells = (r) =>
        r
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(
        `<table><thead><tr>${head.map((h) => `<th>${inline(h)}</th>`).join("")}</tr></thead><tbody>` +
          rows
            .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
            .join("") +
          `</tbody></table>`,
      );
      continue;
    }
    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      const level = h[1].length;
      const id = slug(h[2]);
      if (level === 2) toc.push({ id, text: h[2] });
      out.push(`<h${level} id="${id}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }
    // horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushPara();
      out.push("<hr>");
      i++;
      continue;
    }
    // list (ordered or unordered), with lazy continuation lines
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      flushPara();
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      while (i < lines.length && (/^\s*([-*]|\d+\.)\s+/.test(lines[i]) || (items.length && /^\s{2,}\S/.test(lines[i])))) {
        if (/^\s*([-*]|\d+\.)\s+/.test(lines[i])) items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ""));
        else items[items.length - 1] += " " + lines[i].trim();
        i++;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${tag}>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      i++;
      continue;
    }
    para.push(line.trim());
    i++;
  }
  flushPara();
  return { html: out.join("\n"), toc };
}

const DESCRIPTION =
  "Claim maintenance: the continuous, independent observation of the public claims an organisation " +
  "makes about itself — captured verbatim, hashed, timestamped, re-read on a schedule, and measured " +
  "only where public evidence can settle it. Specification v0.1 by Council of AI. CC0.";

function page({ version, bodyHtml, toc, mdName, mdDigest, date, deposit }) {
  const canonical = `${BASE}/spec/claim-maintenance/${version}/`;
  const ld = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `Claim Maintenance — Specification ${version.replace(/^v/, "")}`,
    name: "Claim Maintenance",
    description: DESCRIPTION,
    url: canonical,
    inLanguage: "en",
    datePublished: date,
    version: version.replace(/^v/, ""),
    license: "https://creativecommons.org/publicdomain/zero/1.0/",
    isAccessibleForFree: true,
    author: {
      "@type": "Organization",
      name: "Council of AI",
      legalName: "CSOAI Ltd",
      url: BASE,
      identifier: "UK Companies House 16939677",
    },
    publisher: {
      "@type": "Organization",
      name: "CSOAI Ltd",
      url: BASE,
      identifier: "UK Companies House 16939677",
    },
    about: [
      { "@type": "Thing", name: "claim maintenance" },
      { "@type": "Thing", name: "public claim observation" },
      { "@type": "Thing", name: "measurement, not certification" },
    ],
    citation: `Council of AI. Claim Maintenance, version ${version.replace(/^v/, "")}. CSOAI Ltd, ${date}. ${canonical}`,
    encoding: {
      "@type": "MediaObject",
      contentUrl: `${canonical}${mdName}`,
      encodingFormat: "text/markdown",
      sha256: mdDigest,
    },
    isBasedOn: `${canonical}${mdName}`,
    mainEntityOfPage: canonical,
    ...(deposit
      ? {
          identifier: deposit.doi_url,
          sameAs: [deposit.doi_url, deposit.record_url],
          archivedAt: deposit.record_url,
        }
      : {}),
  };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Claim Maintenance — Specification ${esc(version.replace(/^v/, ""))} | Council of AI</title>
<meta name="description" content="${esc(DESCRIPTION)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="Claim Maintenance — Specification ${esc(version.replace(/^v/, ""))}">
<meta property="og:description" content="${esc(DESCRIPTION)}">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="article">
<meta name="robots" content="index,follow,max-snippet:-1">
<link rel="license" href="https://creativecommons.org/publicdomain/zero/1.0/">
<link rel="alternate" type="text/markdown" href="${canonical}${mdName}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<style>
:root{color-scheme:light dark;--bg:#fff;--fg:#14171c;--muted:#5b6672;--line:#e3e7ec;--accent:#0b5cab;--code:#f4f6f8}
@media (prefers-color-scheme:dark){:root{--bg:#0f1216;--fg:#e7ebf0;--muted:#9aa6b2;--line:#252b33;--accent:#7ab3ef;--code:#171c22}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:40px 16px 96px}
a{color:var(--accent)}
h1{font-size:2rem;line-height:1.2;margin:.2em 0 .1em}
h2{font-size:1.35rem;margin:2.2em 0 .5em;padding-top:.6em;border-top:1px solid var(--line)}
h3{font-size:1.08rem;margin:1.6em 0 .4em}
hr{border:0;border-top:1px solid var(--line);margin:2em 0}
code{background:var(--code);padding:.12em .35em;border-radius:3px;font-size:.92em}
pre{background:var(--code);padding:14px 16px;border-radius:6px;overflow-x:auto;border:1px solid var(--line)}
pre code{background:none;padding:0;font-size:.85em;line-height:1.45}
table{border-collapse:collapse;width:100%;margin:1.2em 0;font-size:.94em;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:7px 10px;text-align:left;vertical-align:top}
th{background:var(--code)}
.nav{font-size:.9rem;color:var(--muted);margin-bottom:1.4em}
.nav a{margin-right:1em}
.toc{border:1px solid var(--line);border-radius:6px;padding:14px 18px;margin:1.6em 0;font-size:.92rem}
.toc ol{margin:.4em 0;padding-left:1.3em}
ul,ol{padding-left:1.4em}
li{margin:.3em 0}
footer{margin-top:3em;padding-top:1.2em;border-top:1px solid var(--line);color:var(--muted);font-size:.88rem}
</style>
</head>
<body>
<div class="wrap">
<nav class="nav"><a href="/">Council of AI</a><a href="/claim-maintenance">Claim maintenance</a><a href="/spec/claim-maintenance/">All versions</a><a href="/api/claims/register">Register (JSON)</a><a href="${mdName}">This document as Markdown</a></nav>
<main>
<div class="toc"><strong>Contents</strong><ol>${toc
    .map((t) => `<li><a href="#${t.id}">${esc(t.text.replace(/^\d+\.\s*/, ""))}</a></li>`)
    .join("")}</ol></div>
${bodyHtml}
</main>
<footer>
Council of AI (CSOAI Ltd, UK Companies House 16939677). This specification is dedicated to the public domain under CC0 1.0 Universal — adopt it without asking us.
Source of record: <a href="${mdName}">${esc(mdName)}</a>, SHA-256 <code>${mdDigest}</code>.
${deposit ? `<br>Archived with a persistent identifier we do not control: <a href="${deposit.doi_url}">${esc(deposit.doi)}</a> (all versions: <a href="${deposit.concept_doi_url}">${esc(deposit.concept_doi)}</a>). A DOI makes a document citable and permanent; it does not make it right.` : ""}
</footer>
</div>
</body>
</html>
`;
}

const writes = [];
const staged = new Map();
const stage = (path, body) => {
  writes.push({ path, body });
  staged.set(path, body);
};

for (const version of versions()) {
  const dir = join(SPEC_DIR, version);
  const mdName = `claim-maintenance-${version}.md`;
  const mdPath = join(dir, mdName);
  if (!existsSync(mdPath)) throw new Error(`[spec] ${version}: missing document of record ${mdName}`);
  const md = readFileSync(mdPath, "utf8");
  const mdDigest = sha256(md);
  const date = (md.match(/\|\s*\*\*Date\*\*\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/) || [])[1];
  if (!date) throw new Error(`[spec] ${version}: no Date row in the front table — refusing to invent one`);
  const { html, toc } = mdToHtml(md);
  // The archival deposit, if one exists. It is a SIDECAR on purpose: writing the DOI into the
  // document of record would change its bytes after they were deposited, and the published
  // digest would then check out against neither copy.
  const depositPath = join(dir, "deposit.json");
  const deposit = existsSync(depositPath) ? JSON.parse(readFileSync(depositPath, "utf8")) : null;
  if (deposit && deposit.document_sha256 !== mdDigest)
    throw new Error(
      `[spec] ${version}: deposit.json records document_sha256 ${deposit.document_sha256} but the ` +
        `document of record hashes to ${mdDigest}. The deposited bytes and the served bytes have diverged — ` +
        `deposit a new version rather than editing a published one.`,
    );
  stage(join(dir, "index.html"), page({ version, bodyHtml: html, toc, mdName, mdDigest, date, deposit }));
  stage(
    join(dir, "spec.json"),
    JSON.stringify(
      {
        schema: "csoai.claim-maintenance.spec/0.1",
        name: "Claim Maintenance",
        version: version.replace(/^v/, ""),
        date,
        status: "published",
        canonical_url: `${BASE}/spec/claim-maintenance/${version}/`,
        document_of_record: `${BASE}/spec/claim-maintenance/${version}/${mdName}`,
        document_sha256: mdDigest,
        artifact_schema_url: `${BASE}/spec/claim-maintenance/${version}/schema/claim-artifact-${version}.schema.json`,
        ...(deposit
          ? {
              doi: deposit.doi,
              doi_url: deposit.doi_url,
              concept_doi: deposit.concept_doi,
              archived_at: deposit.record_url,
              archive_repository: deposit.repository,
            }
          : {}),
        states: ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"],
        register_url: `${BASE}/api/claims/register`,
        reference_implementation: "https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/claim-capture.mjs",
        licence: "CC0-1.0",
        licence_url: "https://creativecommons.org/publicdomain/zero/1.0/",
        reference_implementation_licence: "MIT",
        publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
        cite_as: `Council of AI. Claim Maintenance, version ${version.replace(/^v/, "")}. CSOAI Ltd, ${date}. ${BASE}/spec/claim-maintenance/${version}/`,
        not: [
          "not fact-checking",
          "not certification",
          "not auditing",
          "not reputation scoring",
          "not adversarial journalism",
        ],
        asserts_no_falsity: true,
        derives_no_mark_or_score: true,
      },
      null,
      2,
    ) + "\n",
  );
}

const all = versions();
if (!all.length) throw new Error("[spec] no version directories found");
const latest = all[all.length - 1];
stage(
  join(SPEC_DIR, "index.json"),
  JSON.stringify(
    {
      schema: "csoai.claim-maintenance.spec-index/0.1",
      name: "Claim Maintenance",
      latest: latest.replace(/^v/, ""),
      note:
        "A published version is never edited. A later version supersedes an earlier one by existing " +
        "and by naming it; the earlier URL keeps its original bytes so anything that cited it keeps resolving.",
      versions: all.map((v) => {
        // Read the body this run just staged, never the copy on disk: on a first run the
        // file does not exist yet, and on a later run the stale copy would index the wrong digest.
        const spec = JSON.parse(staged.get(join(SPEC_DIR, v, "spec.json")));
        return {
          version: spec.version,
          date: spec.date,
          status: v === latest ? "current" : "superseded",
          url: spec.canonical_url,
          doi: spec.doi ?? null,
          document_sha256: spec.document_sha256,
        };
      }),
      licence: "CC0-1.0",
    },
    null,
    2,
  ) + "\n",
);

// The version index as a page, not only as JSON. The specification's own navigation links
// here ("All versions"), and until this existed that link was a 404 on a published document —
// exactly the class of defect this specification asks other people to correct. Generated from
// the same staged bytes as index.json, so the two can never disagree. [spec-index-html]
{
  const idx = JSON.parse(staged.get(join(SPEC_DIR, "index.json")));
  const rows = idx.versions
    .map(
      (v) =>
        `<tr><td><a href="${esc(v.url)}">v${esc(v.version)}</a></td><td>${esc(v.date)}</td>` +
        `<td>${esc(v.status)}</td>` +
        `<td>${v.doi ? `<a href="https://doi.org/${esc(v.doi)}">${esc(v.doi)}</a>` : "&mdash;"}</td>` +
        `<td><code>${esc(v.document_sha256)}</code></td></tr>`,
    )
    .join("\n");
  stage(
    join(SPEC_DIR, "index.html"),
    `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Claim Maintenance — all versions | Council of AI</title>
<meta name="description" content="Every published version of the Claim Maintenance specification, with its date, its persistent identifier and the digest of the document of record.">
<link rel="canonical" href="https://councilof.ai/spec/claim-maintenance/">
<style>
:root{color-scheme:light dark;--fg:#0f172a;--muted:#475569;--line:#cbd5e1;--bg:#ffffff}
@media (prefers-color-scheme:dark){:root{--fg:#e2e8f0;--muted:#94a3b8;--line:#334155;--bg:#0b1220}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
main{max-width:56rem;margin:0 auto;padding:2.5rem 1rem 4rem}
h1{font-size:1.9rem;line-height:1.2;margin:0 0 .5rem}
p.lede{color:var(--muted);margin:0 0 2rem}
table{width:100%;border-collapse:collapse;font-size:.95rem}
th,td{text-align:left;padding:.6rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
code{font-size:.8rem;word-break:break-all}
nav{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;font-size:.9rem}
a{color:inherit}
.note{margin-top:2rem;color:var(--muted);font-size:.9rem}
</style></head>
<body><main>
<nav><a href="/">Council of AI</a><a href="/claim-maintenance">Claim maintenance</a><a href="/api/claims/register">Register (JSON)</a><a href="index.json">This index as JSON</a></nav>
<h1>Claim Maintenance — all versions</h1>
<p class="lede">${esc(idx.note)}</p>
<table><thead><tr><th>Version</th><th>Date</th><th>Status</th><th>Persistent identifier</th><th>Digest of the document of record</th></tr></thead>
<tbody>
${rows}
</tbody></table>
<p class="note">Licence ${esc(idx.licence)}. The digest is of the Markdown, which is the document of record; the page you are reading and the JSON beside it are generated from it. A persistent identifier makes a document citable and permanent; it does not make it right.</p>
</main></body></html>
`,
  );
}

let bad = 0;
for (const w of writes) {
  const existing = existsSync(w.path) ? readFileSync(w.path, "utf8") : null;
  if (CHECK) {
    if (existing !== w.body) {
      bad++;
      console.error(`[spec] DRIFT: ${w.path.replace(ROOT + "/", "")} does not match what the .md derives`);
    }
  } else if (existing !== w.body) {
    writeFileSync(w.path, w.body);
    console.log(`[spec] wrote ${w.path.replace(ROOT + "/", "")}`);
  }
}
if (CHECK) {
  if (bad) {
    console.error(`[spec] ${bad} file(s) drifted — run: node scripts/claim-maintenance-spec.mjs`);
    process.exit(1);
  }
  console.log(`[spec] OK — ${writes.length} derived file(s) match the document of record`);
}
