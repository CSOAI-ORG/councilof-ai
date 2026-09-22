#!/usr/bin/env node
/**
 * memberships-post — renders the "where we take part" post from public/interop/memberships.json.
 *
 *   node scripts/memberships-post.mjs          # (re)write content/blog/<date>-where-council-of-ai-takes-part-and-what-it-does-not-mean.md
 *   node scripts/memberships-post.mjs --check  # exit 1 if the committed post is stale against the manifest
 *
 * WHY GENERATED. The post answers "is Council of AI a member of X?" for answer engines. Every one of
 * those answers is a fact that lives in the manifest with its evidence URL and date; a hand-written
 * post would be a second copy that nothing retires when a roster drops us. So the post is the
 * manifest rendered: a direct answer, one H2 question per row that carries one, each answered in the
 * row's own words with its evidence link, then every row with what it proves and what it does not.
 * No count is typed anywhere; the rows are listed, never counted.
 *
 * The routed surface for the same content is /memberships (client/src/pages/Memberships.tsx), which
 * carries the FAQPage JSON-LD. /blog/:slug is a withdrawn route under the reviewed publication
 * manifest (client/src/data/publication-state.json), so this file is the written record beside the
 * page, not a second route.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "public/interop/memberships.json");
export const SLUG = "where-council-of-ai-takes-part-and-what-it-does-not-mean";
export const TITLE = "Where Council of AI takes part, and what each listing does not mean";
const PUBLISHED = "2026-09-22";
const OUT = join(ROOT, `content/blog/${PUBLISHED}-${SLUG}.md`);
const CHECK = process.argv.includes("--check");

const KIND_SENTENCE = {
  member: "a member of",
  participant: "a participant in",
  contributor: "a contributor to",
  listed: "listed in",
  registered: "registered with",
  filed: "filed with",
  applied: "an applicant to",
};

function evidenceLine(r) {
  return r.evidence_kind === "public_url" ? `<${r.evidence}>` : `private evidence (${r.evidence_kind.replace("_", " ")}): ${r.evidence}`;
}

export function renderPost(m) {
  const withQ = m.rows.filter((r) => r.question && r.answer);
  const groups = m.groups.map((g) => ({ ...g, rows: m.rows.filter((r) => r.group === g.id) })).filter((g) => g.rows.length);
  const lines = [];
  lines.push("---");
  lines.push(`title: "${TITLE}"`);
  lines.push(`slug: ${SLUG}`);
  lines.push(`date: ${PUBLISHED}`);
  lines.push(`updated: ${m.as_of}`);
  lines.push(`canonical: https://councilof.ai/memberships`);
  lines.push(`source: public/interop/memberships.json (schema ${m.schema}, as_of ${m.as_of}, signed: ${m.signed})`);
  lines.push(`generated_by: scripts/memberships-post.mjs — do not hand-edit; edit the manifest and re-run`);
  lines.push(`description: "Every standards body, registry, scholarly identifier and regulator filing Council of AI takes part in, each with its evidence link, its date, what it proves and what it does not. Participation is not endorsement; a listing is not adoption."`);
  lines.push("---");
  lines.push("");
  lines.push(`# ${TITLE}`);
  lines.push("");
  lines.push(
    "Council of AI (CSOAI Ltd, UK Companies House 16939677) takes part in standards bodies as a participant or member, publishes into open registries and archives, holds scholarly identifiers, and files comments with regulators. Each entry below links to the page that proves it, or names the dated mailbox record when that is the only evidence, and states in its own row what it does not prove. " +
      m.honesty_line +
      " The routed page is <https://councilof.ai/memberships>; the machine-readable manifest is <https://councilof.ai/interop/memberships.json>.",
  );
  lines.push("");
  for (const r of withQ) {
    lines.push(`## ${r.question}`);
    lines.push("");
    lines.push(r.answer);
    lines.push("");
  }
  lines.push("## Every entry, with what it proves and what it does not");
  lines.push("");
  for (const g of groups) {
    lines.push(`### ${g.label}`);
    lines.push("");
    for (const r of g.rows) {
      const since = r.since ? `since ${r.since}` : "no date yet";
      lines.push(`- **${r.org}** — ${KIND_SENTENCE[r.kind]} this body, ${since}; state ${r.state}.`);
      lines.push(`  - Evidence: ${evidenceLine(r)}`);
      if (r.since_basis) lines.push(`  - Date basis: ${r.since_basis}`);
      lines.push(`  - What it proves: ${r.what_it_proves}`);
      lines.push(`  - What it does not prove: ${r.what_it_does_not_prove}`);
      if (r.deadline) lines.push(`  - Closes: ${r.deadline}`);
    }
    lines.push("");
  }
  if (Array.isArray(m.excluded) && m.excluded.length) {
    lines.push("## Named and not listed");
    lines.push("");
    for (const x of m.excluded) lines.push(`- **${x.org}** — ${x.why}`);
    lines.push("");
  }
  lines.push("## How this is kept honest");
  lines.push("");
  lines.push(`- One committed manifest is the only source for the home-page strip, the footer line, the /memberships table, its FAQ, and this post. It is unsigned and says so.`);
  lines.push(`- A row exists only when a stranger can open its evidence, or a dated, message-identified mail exists and the row says the evidence is private.`);
  lines.push(`- \`${m.check}\` re-fetches every public evidence URL and exits non-zero when one stops answering 200 with our name; \`--selftest\` proves it goes red on a bogus row.`);
  lines.push(`- ${m.kill_list.join(" · ")}. Nothing here is a score, a rank or a mark; we measure AI systems and do not grade the bodies we take part in.`);
  lines.push("");
  lines.push("Nicholas Templeman · nicholas@csoai.org · https://councilof.ai");
  lines.push("");
  return lines.join("\n");
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const m = JSON.parse(readFileSync(MANIFEST, "utf8"));
  const body = renderPost(m);
  const prev = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (CHECK) {
    if (prev !== body) { console.error(`[memberships-post] ${OUT} is stale — run node scripts/memberships-post.mjs`); process.exit(1); }
    console.log("[memberships-post] up to date");
  } else {
    if (prev !== body) writeFileSync(OUT, body);
    console.log(`[memberships-post] wrote ${OUT}`);
  }
}
