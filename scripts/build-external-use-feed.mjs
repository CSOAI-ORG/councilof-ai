// A deterministic, offline projection from the ONE reviewed external-use record.
// No internet fetching, source promotion, scheduling, signing, spending or auto-acceptance.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const inputFile = resolve(root, "client/src/data/external-use-reviewed.json");
const outputFile = resolve(root, "public/interop/external-use.json");
const STAGES = new Set(["EXTERNAL_RERUN", "EXTERNAL_IMPLEMENTATION", "AUTHOR_REVIEWED_CANDIDATE", "EXTERNAL_CITATION"]);

function validDay(day) {
  return typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day + "T00:00:00Z"));
}

export function validate(review) {
  if (review?.schema !== "csoai.external-use-review/0.1" || !validDay(review.reviewed_at)) throw Error("Unknown schema or review date");
  if (typeof review.scope !== "string" || review.scope.length < 30) throw Error("Missing review scope");
  if (!Array.isArray(review.records) || !review.records.length) throw Error("No reviewed records");
  const ids = new Set();
  for (const [i, r] of review.records.entries()) {
    if (!r || typeof r !== "object" || typeof r.id !== "string" || !/^[a-z0-9-]+$/.test(r.id) || ids.has(r.id)) throw Error("Duplicate or invalid id at " + i);
    ids.add(r.id);
    if (!STAGES.has(r.stage) || !validDay(r.source_event_date) || r.source_event_date > review.reviewed_at) throw Error("Unqualified stage or event date: " + r.id);
    for (const key of ["category", "title", "event", "summary", "detail", "boundary", "revision", "what_it_enables", "next_gate", "stage_label"]) {
      if (typeof r[key] !== "string" || r[key].trim().length < 8) throw Error("Missing " + key + ": " + r.id);
    }
    if (!/\b(not|no|does not)\b/i.test(r.boundary)) throw Error("Claim boundary missing: " + r.id);
    for (const key of ["buyer_acceptance", "repeat_use"]) {
      // Future ACCEPTED transitions require a separate, owner-qualified receipt verifier.
      // An arbitrary HTTPS URL is not buyer acceptance, repeated use, or human authority.
      if (r[key] !== "NOT_ESTABLISHED") {
        throw Error("Unsupported acceptance assertion: " + r.id + "/" + key);
      }
    }
    if (!Array.isArray(r.sources) || r.sources.length === 0) throw Error("No sources: " + r.id);
    const urls = new Set();
    let hasOutsideSource = false;
    for (const source of r.sources) {
      if (!source || typeof source.label !== "string" || !source.label.trim() || typeof source.href !== "string") throw Error("Malformed source: " + r.id);
      let u;
      try { u = new URL(source.href); } catch { throw Error("Bad source URL: " + r.id); }
      if (u.protocol !== "https:" || !u.hostname || urls.has(source.href)) throw Error("Invalid or duplicate source URL: " + r.id);
      urls.add(source.href);
      const host = u.hostname.toLowerCase();
      const isCouncilHost = ["councilof.ai", "www.councilof.ai", "csoai.org", "www.csoai.org", "meok.ai"].includes(host);
      const isCouncilGithub = host === "github.com" && new RegExp("^/(?:CSOAI-ORG|nicktempleman)/", "i").test(u.pathname);
      if (!isCouncilHost && !isCouncilGithub) hasOutsideSource = true;
    }
    if (!hasOutsideSource) throw Error("No independently hosted source: " + r.id);
  }
  return review;
}

export function render(review) {
  const checked = validate(review);
  return JSON.stringify({
    kind: "csoai.public-external-evidence/0.1",
    reviewed_at: checked.reviewed_at,
    source_schema: checked.schema,
    qualification: "OWNER_REVIEWED_SOURCE_ONLY",
    not_a_census: true,
    not_regulatory_endorsement: true,
    unknown_is_not_zero: true,
    scope: checked.scope,
    records: checked.records,
    attribution_note: "Independent activity, publication, method verification, buyer acceptance, and repeat demand are distinct stages. This feed does not create new source evidence."
  }, null, 2) + "\n";
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(readFileSync(inputFile, "utf8"));
  const expected = render(data);
  if (process.argv.includes("--check")) {
    let actual;
    try { actual = readFileSync(outputFile, "utf8"); } catch { throw Error("Reviewed public projection missing"); }
    if (actual !== expected) throw Error("External evidence public projection differs from reviewed source; qualified regeneration and review required");
    console.log("external-use: reviewed record and public projection exactly match (" + data.records.length + " scoped examples)");
  } else if (process.argv.includes("--write")) {
    writeFileSync(outputFile, expected, "utf8");
    console.log("external-use: wrote deterministic projection; not signed, accepted or published by this operation");
  } else {
    throw Error("Supply --check or explicit --write (no automatic publication)");
  }
}
