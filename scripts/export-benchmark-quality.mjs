#!/usr/bin/env node
/**
 * export-benchmark-quality — turn the live register into a publishable dataset.
 *
 * WHAT IT WRITES to dist/exports/benchmark-quality/
 *   register.json        the whole payload, exactly as /api/benchmark-quality builds it (unsigned)
 *   records.jsonl        one benchmark record per line — the shape a dataset loader wants
 *   predicates.jsonl     one PREDICATE ANSWER per line: the atomic, citable unit of this register
 *   croissant.json       MLCommons Croissant 1.0 metadata describing the two JSONL files
 *   benchmark-card.json  a BenchmarkCards-aligned description of the register itself
 *   README.md           the dataset card, with the push command in it
 *
 * WHY IT DOES NOT PUSH. Publishing to Hugging Face needs an owner token and is an owner
 * decision. This script produces the artifact and prints the exact command; it never
 * distributes anything on its own.
 *
 * WHY THE EXPORT IS UNSIGNED. The Ed25519 signature is produced at the edge, over the exact
 * bytes the endpoint served, with a key that lives only in Cloudflare. A signature copied into
 * a file built on a laptop would attest nothing. The export therefore points at the live
 * endpoint for verification instead of carrying a signature it cannot honour.
 *
 * Usage:  node scripts/export-benchmark-quality.mjs [outdir]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.resolve(REPO, process.argv[2] || "dist/exports/benchmark-quality");

// Single source of truth: the same module the Pages Function serves. There is no second copy
// of the data to drift — if the endpoint changes, this export changes with it.
let buildRegister, ASSESSED_ON;
try {
  ({ buildRegister, ASSESSED_ON } = await import(path.join(REPO, "functions/api/benchmark-quality.ts")));
} catch (e) {
  console.error(
    "export-benchmark-quality: could not import functions/api/benchmark-quality.ts\n" +
      "This needs Node >= 22.18 (TypeScript type stripping on by default), or run:\n" +
      "  node --experimental-strip-types scripts/export-benchmark-quality.mjs\n" +
      String(e),
  );
  process.exit(2);
}

const reg = buildRegister();
const HOMEPAGE = "https://councilof.ai/benchmark-quality";
const ENDPOINT = "https://councilof.ai/api/benchmark-quality";
const HF_REPO = "csoai/benchmark-quality-register";

fs.mkdirSync(OUT, { recursive: true });
const write = (name, body) => {
  fs.writeFileSync(path.join(OUT, name), body);
  return `${name} (${(Buffer.byteLength(body) / 1024).toFixed(1)} kB)`;
};

// ── the payload itself ──────────────────────────────────────────────────────────────────────
const written = [];
written.push(write("register.json", JSON.stringify(reg, null, 2) + "\n"));

// ── row-per-record and row-per-predicate ────────────────────────────────────────────────────
written.push(
  write("records.jsonl", reg.records.map((r) => JSON.stringify(r)).join("\n") + "\n"),
);

const predicateRows = reg.records.flatMap((r) =>
  r.predicates.map((p) => ({
    benchmark_id: r.id,
    benchmark: r.benchmark,
    publisher: r.publisher,
    predicate_id: p.id,
    predicate_group: p.group,
    question: p.question,
    pass_means: p.pass_means,
    result: p.result,
    evidence: p.evidence,
    unknown_reason: p.unknown_reason ?? null,
    source_url: p.source_url,
    fetched: p.fetched,
    // Attribution semantics travel with every single row, so a row lifted out of context still
    // carries what it is and what it is not.
    record_type: r.record_type,
    not_a_certification: r.not_a_certification,
    endorsement: r.endorsement,
    solicited: r.solicited,
    subject_participation: r.subject_participation,
    access: r.access,
    authored_by: r.authored_by,
    assessed_on: r.assessed_on,
  })),
);
written.push(write("predicates.jsonl", predicateRows.map((r) => JSON.stringify(r)).join("\n") + "\n"));

// ── Croissant 1.0 metadata ──────────────────────────────────────────────────────────────────
const field = (fileSetId, name, dtype, description) => ({
  "@type": "cr:Field",
  "@id": `${fileSetId}/${name}`,
  name,
  description,
  dataType: dtype,
  source: { fileObject: { "@id": fileSetId }, extract: { column: name } },
});

const croissant = {
  "@context": {
    "@language": "en",
    "@vocab": "https://schema.org/",
    cr: "http://mlcommons.org/croissant/",
    dct: "http://purl.org/dc/terms/",
    sc: "https://schema.org/",
    data: { "@id": "cr:data", "@type": "@json" },
    dataType: { "@id": "cr:dataType", "@type": "@vocab" },
    extract: "cr:extract",
    field: "cr:field",
    fileObject: "cr:fileObject",
    fileProperty: "cr:fileProperty",
    recordSet: "cr:recordSet",
    source: "cr:source",
    column: "cr:column",
  },
  "@type": "sc:Dataset",
  conformsTo: "http://mlcommons.org/croissant/1.0",
  name: "benchmark-quality-register",
  description:
    "A register recording what third-party AI benchmarks disclose about their own process integrity, " +
    "measured with deterministic predicates answered from public artifacts. Every predicate answer carries " +
    "the URL it was read from and the date it was fetched; a predicate that could not be checked is recorded " +
    "as UNKNOWN with its reason. No language model scored any predicate. The records are unsolicited, the " +
    "subjects did not participate, and nothing here is a certification, accreditation, or endorsement. " +
    "Council of AI's own instruments are structurally excluded from the register by an impartiality firewall " +
    "enforced in code.",
  url: HOMEPAGE,
  sameAs: ENDPOINT,
  license: "https://creativecommons.org/licenses/by/4.0/",
  version: "0.1.0",
  datePublished: ASSESSED_ON,
  citeAs:
    "Council of AI (CSOAI Ltd, UK Companies House 16939677), Benchmark-quality register, " +
    ASSESSED_ON + ", " + ENDPOINT,
  creator: {
    "@type": "sc:Organization",
    name: "Council of AI",
    legalName: "CSOAI Ltd",
    url: "https://councilof.ai",
    identifier: "UK Companies House 16939677",
  },
  keywords: [
    "benchmark evaluation",
    "meta-evaluation",
    "AI governance",
    "reproducibility",
    "contamination",
    "deterministic predicates",
  ],
  distribution: [
    {
      "@type": "cr:FileObject",
      "@id": "records.jsonl",
      name: "records.jsonl",
      description: "One benchmark record per line: identity, attribution semantics, artifacts fetched, tally, predicate answers.",
      encodingFormat: "application/jsonlines",
      contentUrl: "records.jsonl",
    },
    {
      "@type": "cr:FileObject",
      "@id": "predicates.jsonl",
      name: "predicates.jsonl",
      description: "One predicate answer per line — the atomic, citable unit of the register.",
      encodingFormat: "application/jsonlines",
      contentUrl: "predicates.jsonl",
    },
    {
      "@type": "cr:FileObject",
      "@id": "register.json",
      name: "register.json",
      description: "The whole payload as the live endpoint builds it, including the predicate catalogue, impartiality firewall, notice policy and limitations.",
      encodingFormat: "application/json",
      contentUrl: "register.json",
    },
  ],
  recordSet: [
    {
      "@type": "cr:RecordSet",
      "@id": "predicate_answers",
      name: "predicate_answers",
      description: "Every predicate answered about every benchmark on the register, with its evidence and provenance.",
      field: [
        field("predicates.jsonl", "benchmark_id", "sc:Text", "Stable id of the benchmark assessed."),
        field("predicates.jsonl", "benchmark", "sc:Text", "Name of the benchmark assessed."),
        field("predicates.jsonl", "publisher", "sc:Text", "Who publishes the benchmark."),
        field("predicates.jsonl", "predicate_id", "sc:Text", "Stable id of the predicate."),
        field("predicates.jsonl", "predicate_group", "sc:Text", "One of nine groups: contamination resistance, reproducibility, statistical rigour, scoring transparency, governance and conflict of interest, item quality, licensing, saturation and discrimination, failure disclosure."),
        field("predicates.jsonl", "question", "sc:Text", "The deterministic question, answerable from a public artifact."),
        field("predicates.jsonl", "pass_means", "sc:Text", "Exactly what a PASS asserts, so the check can be re-run and disputed precisely."),
        field("predicates.jsonl", "result", "sc:Text", "PASS, FAIL, or UNKNOWN. UNKNOWN is a real result, never a placeholder for a guess."),
        field("predicates.jsonl", "evidence", "sc:Text", "What was actually read on the artifact."),
        field("predicates.jsonl", "unknown_reason", "sc:Text", "Why the check could not be completed. Non-null exactly when result is UNKNOWN."),
        field("predicates.jsonl", "source_url", "sc:URL", "The artifact the answer was read from."),
        field("predicates.jsonl", "fetched", "sc:Date", "The date that artifact was fetched."),
        field("predicates.jsonl", "record_type", "sc:Text", "Always measured-current-state."),
        field("predicates.jsonl", "not_a_certification", "sc:Boolean", "Always true. This register issues no conformity marks."),
        field("predicates.jsonl", "endorsement", "sc:Text", "Always none."),
        field("predicates.jsonl", "solicited", "sc:Boolean", "Always false. The subject did not ask to be assessed."),
        field("predicates.jsonl", "subject_participation", "sc:Text", "Always none."),
        field("predicates.jsonl", "access", "sc:Text", "Always public_artifacts_only."),
        field("predicates.jsonl", "authored_by", "sc:Text", "did:web:csoai.org"),
        field("predicates.jsonl", "assessed_on", "sc:Date", "The assessment date for the record."),
      ],
    },
  ],
};
written.push(write("croissant.json", JSON.stringify(croissant, null, 2) + "\n"));

// ── BenchmarkCards-aligned card FOR THE REGISTER ITSELF ─────────────────────────────────────
// The register is itself a measurement instrument, so it documents itself against the same kind
// of card it expects of others. Anything we will not disclose about ourselves, we have no
// standing to ask of a subject.
const card = {
  card_type: "BenchmarkCard",
  card_version: "0.1",
  benchmark_details: {
    name: "Benchmark-quality register",
    publisher: "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
    version: "0.1.0",
    release_date: ASSESSED_ON,
    homepage: HOMEPAGE,
    machine_endpoint: ENDPOINT,
    license: "CC-BY-4.0",
    contact: "https://councilof.ai/contact",
  },
  purpose_and_intended_users: {
    purpose:
      "To record, from public artifacts alone, what an AI benchmark discloses about how it was built and scored — contamination control, reproducibility, statistical rigour, scoring transparency, governance and conflicts of interest, item quality, licensing, saturation, and failure disclosure.",
    intended_users: "Anyone deciding how much weight to put on a benchmark result: procurement, regulators, researchers, and the benchmark maintainers themselves.",
    out_of_scope:
      "Ranking benchmarks against each other; certifying, approving or accrediting any benchmark; and judging construct validity — whether a benchmark measures what its name claims. The predicates are unweighted and non-exhaustive and must not be summed into a grade.",
  },
  data_design: {
    subjects: reg.records.map((r) => ({ benchmark: r.benchmark, publisher: r.publisher, artifacts_fetched: r.artifacts.map((a) => a.url) })),
    subject_selection:
      "Benchmarks whose public artifacts were actually fetched and read on the assessment date. Coverage is deliberately small: an honestly-checked record is worth more than an assumed one.",
    predicate_count: reg.totals.predicates_per_record,
    predicate_catalogue: reg.predicate_catalogue.map((p) => ({ id: p.id, group: p.group, question: p.question, pass_means: p.pass_means })),
  },
  evaluation_methodology: {
    scorer: "Deterministic predicates read off public artifacts by a human-directed process.",
    model_judgment_used: false,
    model_judgment_note:
      "No language model scored any predicate. A register that graded other benchmarks on scoring transparency using a model judge would fail its own predicate.",
    result_semantics: reg.result_semantics,
    provenance: "Every predicate answer carries the URL fetched and the fetch date.",
    integrity: "The live endpoint signs each served payload with Ed25519 under did:web:csoai.org#board-attestation-1. This exported copy is unsigned by design; verify against the endpoint.",
  },
  governance: {
    impartiality_policy: reg.impartiality_policy,
    impartiality_enforced_in_code: reg.impartiality.enforced_in_code,
    impartiality_enforced_by: reg.impartiality.enforced_by,
    excluded_subjects: reg.impartiality.excluded_subjects,
    funding_disclosure: "The register is produced and paid for by CSOAI Ltd. No subject on the register pays to be listed, to be assessed, or to be removed, and no subject participated in its own assessment.",
    notice_policy: reg.notice_policy,
  },
  limitations: reg.limitations,
  totals: reg.totals,
};
written.push(write("benchmark-card.json", JSON.stringify(card, null, 2) + "\n"));

// ── the dataset card ────────────────────────────────────────────────────────────────────────
const tallyLine = reg.records
  .map((r) => `| ${r.benchmark} | ${r.publisher} | ${r.tally.pass} | ${r.tally.fail} | ${r.tally.unknown} |`)
  .join("\n");

const readme = `---
license: cc-by-4.0
pretty_name: Benchmark-quality register
language:
  - en
tags:
  - benchmark-evaluation
  - meta-evaluation
  - ai-governance
  - reproducibility
  - contamination
configs:
  - config_name: predicate_answers
    data_files: predicates.jsonl
  - config_name: records
    data_files: records.jsonl
---

# Benchmark-quality register

What third-party AI benchmarks **disclose about their own process integrity**, measured with
deterministic predicates and published as machine-readable records.

- Live, signed endpoint: ${ENDPOINT}
- Human page: ${HOMEPAGE}
- Assessed on: **${ASSESSED_ON}** · schema \`${reg.schema}\` · licence CC-BY-4.0

## What one record asserts, and what it does not

Every record carries these fields, and they are binding:

| field | value |
| --- | --- |
| \`record_type\` | \`measured-current-state\` |
| \`not_a_certification\` | \`true\` |
| \`endorsement\` | \`none\` |
| \`solicited\` | \`false\` |
| \`subject_participation\` | \`none\` |
| \`access\` | \`public_artifacts_only\` |
| \`authored_by\` | \`did:web:csoai.org\` |

A record is a statement about **what a benchmark published, at a URL, on a date**. It is never a
certification, an approval, an accreditation, or a verification by any third party. The subjects
did not ask to be assessed and took no part in it.

## Method

Each predicate is a boolean question answerable from a public artifact — "is a canary string
published?", "is there a corrections route?". Someone fetched the artifact, read the answer, and
recorded the URL and the fetch date on the predicate.

**No language model scored anything.** That is the point of difference: a register that graded
other benchmarks on scoring transparency by asking a model for an opinion would fail its own
first predicate.

Three results, and the third is real:

- **PASS** — ${reg.result_semantics.PASS}
- **FAIL** — ${reg.result_semantics.FAIL}
- **UNKNOWN** — ${reg.result_semantics.UNKNOWN}

## Current contents (${reg.totals.records} records, ${reg.totals.checked} predicate answers)

| benchmark | publisher | pass | fail | unknown |
| --- | --- | --- | --- | --- |
${tallyLine}

${reg.totals.note}

## The impartiality firewall

${reg.impartiality_policy}

Enforced by \`${reg.impartiality.enforced_by}\` — not by prose.

## Notice and right of reply

Adverse findings carry a ${reg.notice_policy.window_days}-day notice window with a linkable right
of reply before first publication. ${reg.notice_policy.procedure}

- Right of reply: ${reg.notice_policy.right_of_reply}
- Corrections ledger: ${reg.notice_policy.corrections}

## Limitations

${reg.limitations.map((l) => `- ${l}`).join("\n")}

## Files

| file | what it is |
| --- | --- |
| \`predicates.jsonl\` | one predicate answer per line — the atomic, citable unit |
| \`records.jsonl\` | one benchmark record per line |
| \`register.json\` | the whole payload as the endpoint builds it |
| \`croissant.json\` | MLCommons Croissant 1.0 metadata |
| \`benchmark-card.json\` | a BenchmarkCards-aligned card for this register itself |

## Verification

This export is **unsigned by design**. The Ed25519 signature is produced at the edge over the
exact bytes the endpoint served, with a key held only by the site. To verify: fetch
${ENDPOINT}, fetch \`https://councilof.ai/.well-known/did.json\`, take the
\`#board-attestation-1\` public key, and check the signature over the canonical JSON of the
payload with the \`site_attestation\` field removed.

## Citation

${croissant.citeAs}

## Publishing this export (owner action)

Not pushed by the exporter — publishing needs an owner token and is an owner decision.

\`\`\`bash
node scripts/export-benchmark-quality.mjs
huggingface-cli login                       # owner token, write scope
huggingface-cli upload ${HF_REPO} \\
  dist/exports/benchmark-quality . \\
  --repo-type=dataset --commit-message="benchmark-quality register ${ASSESSED_ON}"
\`\`\`
`;
written.push(write("README.md", readme));

console.log(`export-benchmark-quality → ${path.relative(REPO, OUT)}`);
for (const w of written) console.log("  " + w);
console.log(
  `  ${reg.totals.records} records · ${reg.totals.checked} predicate answers ` +
    `(${reg.totals.pass} pass / ${reg.totals.fail} fail / ${reg.totals.unknown} unknown) · assessed ${ASSESSED_ON}`,
);
console.log(`  push (owner, needs HF token):  huggingface-cli upload ${HF_REPO} ${path.relative(REPO, OUT)} . --repo-type=dataset`);
