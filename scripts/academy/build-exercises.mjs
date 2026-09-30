#!/usr/bin/env node
// SPDX-License-Identifier: CC0-1.0
/**
 * build-exercises.mjs — the one producer for the Academy's reproducible-exercise course.
 *
 * Source of truth: the exercise metadata in public/academy/exercises/run-exercises.mjs (the same
 * module that runs the checks). From it this writes:
 *   public/academy/exercises/exercises.json   the course manifest (machine-readable)
 *   public/academy/exercises/index.html       two generated regions: the LRMI / schema.org
 *                                              JSON-LD and the static exercise list
 *
 *   node scripts/academy/build-exercises.mjs           # write
 *   node scripts/academy/build-exercises.mjs --check   # exit 1 if either file is stale
 *
 * No network, no timestamps: the output depends only on the runner and the constants below.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(ROOT, "public/academy/exercises");
const PAGE = join(DIR, "index.html");
const MANIFEST = join(DIR, "exercises.json");
const BASE = "https://councilof.ai/academy/exercises/";

export const COURSE = Object.freeze({
  name: "Reproduce a published measurement",
  version: "0.1",
  date_published: "2026-09-28",
  license: "https://creativecommons.org/publicdomain/zero/1.0/",
  description:
    "Short exercises that re-run numbers and signatures the Council of AI publishes, from the public bytes, with your own code or in your browser. An exercise is complete only when your result's sha256 equals the published result's sha256 and a deliberately broken copy fails.",
});

export const COMPLETION = Object.freeze({
  rule: "Completion means reproduced. An exercise is complete only when its state is REPRODUCED: the sha256 of your result equals the sha256 of the published result, both written as canonical JSON {measurement, value} (keys sorted, no whitespace), and the exercise's negative control failed as it must.",
  keep: "Keep the transcript entry: your result, the published result, both sha256 digests, the control, and the sha256 of every input you read, with the time you read it.",
  not_completion: [
    "Reading a page, watching a video or passing a quiz.",
    "A VALID answer from the published verifier on its own: that is a cross-check, not a reproduction.",
    "An UNCHECKABLE state (the check could not run) or a partial read.",
    "A match whose negative control also passed: a check that cannot fail proves nothing.",
  ],
  scope: "A reproduced exercise says your recomputation agreed with the published bytes when you ran it. It says nothing about your competence, about any organisation's conformity, or about any system. The Council of AI certifies nothing.",
});

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = (s) => `<code>${esc(s)}</code>`;
const minutes = (m) => `PT${m}M`;
/** Inline `backticks` → <code>, everything else escaped. */
const inline = (s) => esc(s).replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);

function commandsFor(ex) {
  return { node: `node run-exercises.mjs --only ${ex.id}` };
}

export function manifest(exercises) {
  return {
    schema: "csoai.academy-exercises/0.1",
    id: BASE,
    name: COURSE.name,
    version: COURSE.version,
    date_published: COURSE.date_published,
    license: COURSE.license,
    description: COURSE.description,
    runner: {
      url: `${BASE}run-exercises.mjs`,
      run: `curl -sO ${BASE}run-exercises.mjs && node run-exercises.mjs`,
      requires: "Node 20 or later, or a current web browser. No dependencies.",
      exit_codes: { 0: "every exercise run was REPRODUCED", 1: "at least one NOT_REPRODUCED", 2: "none failed, at least one UNCHECKABLE" },
      transcript_schema: "csoai.academy-exercise-transcript/0.1",
    },
    result_rule: "sha256 of canonical JSON {\"measurement\": <name>, \"value\": <value>}, keys sorted, no whitespace. Your result and the published result are hashed under the same rule.",
    numbers: "No count is typed into this course. Every value is read from the live site at the moment an exercise runs, and the transcript records which bytes were read.",
    completion: COMPLETION,
    not_a_certification: true,
    exercises: exercises.map((ex, i) => ({
      id: ex.id,
      position: i + 1,
      url: `${BASE}#${ex.id}`,
      title: ex.title,
      time_required: minutes(ex.minutes),
      teaches: ex.teaches,
      realises: ex.realises,
      tools: ex.tools,
      inputs: ex.inputs,
      steps: ex.steps,
      expected: ex.expected,
      negative_control: ex.control,
      commands: commandsFor(ex),
      rubric: {
        complete_when: ["state == REPRODUCED", "yours_sha256 == published_sha256", "control.discriminates == true"],
        evidence: `The ${ex.id} entry of your transcript.`,
      },
    })),
  };
}

export function jsonLd(exercises) {
  const total = exercises.reduce((n, e) => n + e.minutes, 0);
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${BASE}#course`,
    name: COURSE.name,
    description: COURSE.description,
    url: BASE,
    courseCode: `CSOAI-ACADEMY-REPRODUCE-${COURSE.version}`,
    version: COURSE.version,
    datePublished: COURSE.date_published,
    inLanguage: "en",
    isAccessibleForFree: true,
    license: COURSE.license,
    provider: { "@type": "Organization", "@id": "https://councilof.ai/#org", name: "Council of AI", url: "https://councilof.ai/" },
    learningResourceType: "Course",
    educationalLevel: "Beginner",
    educationalUse: "Exercise",
    interactivityType: "active",
    audience: { "@type": "EducationalAudience", educationalRole: "student" },
    competencyRequired: "Running one command in a terminal (Node 20 or later), or a current web browser.",
    teaches: exercises.map((e) => e.teaches),
    assesses: COMPLETION.rule,
    timeRequired: minutes(total),
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: minutes(total) },
    hasPart: exercises.map((e, i) => ({
      "@type": "LearningResource",
      "@id": `${BASE}#${e.id}`,
      name: e.title,
      description: e.teaches,
      url: `${BASE}#${e.id}`,
      position: i + 1,
      learningResourceType: "Exercise",
      educationalUse: "Exercise",
      interactivityType: "active",
      timeRequired: minutes(e.minutes),
      isAccessibleForFree: true,
      assesses: e.expected,
      isPartOf: { "@id": `${BASE}#course` },
    })),
  };
}

export function articles(exercises) {
  return exercises
    .map((e, i) => `<article class="ex" id="${esc(e.id)}">
<header><span class="num" aria-hidden="true">${i + 1}</span><div><h2>${esc(e.title)}</h2><p class="meta">About ${e.minutes} minutes · reads ${e.inputs.map(code).join(", ")}</p></div></header>
<p>${esc(e.teaches)}</p>
<ol class="steps">
${e.steps.map((s) => `<li>${inline(s)}</li>`).join("\n")}
</ol>
<dl>
<dt>Expected</dt><dd>${inline(e.expected)}</dd>
<dt>Negative control</dt><dd>${inline(e.control)}</dd>
<dt>Live tools</dt><dd>${e.tools.map(code).join(" · ")}</dd>
<dt>Complete when</dt><dd>State is <b>REPRODUCED</b>: your sha256 equals the published sha256 and the control failed.</dd>
</dl>
<pre><code>${esc(commandsFor(e).node)}</code></pre>
<button type="button" class="run-one" data-id="${esc(e.id)}">Run this exercise</button>
<div class="result" data-result="${esc(e.id)}" aria-live="polite"></div>
</article>`)
    .join("\n");
}

function replaceRegion(html, name, body) {
  const start = `<!-- generated:${name}:start -->`;
  const end = `<!-- generated:${name}:end -->`;
  const a = html.indexOf(start);
  const b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error(`${relative(ROOT, PAGE)} has no ${start} … ${end} region`);
  return html.slice(0, a + start.length) + "\n" + body + "\n" + html.slice(b);
}

export async function build() {
  const runner = await import(pathToFileURL(join(DIR, "run-exercises.mjs")).href);
  const exercises = runner.exerciseMetadata();
  const json = JSON.stringify(manifest(exercises), null, 2) + "\n";
  // "<" is escaped inside the JSON-LD so no string can close the script element.
  const ld = `<script type="application/ld+json">\n${JSON.stringify(jsonLd(exercises), null, 1).replace(/</g, "\\u003c")}\n</script>`;
  let html = readFileSync(PAGE, "utf8");
  html = replaceRegion(html, "lrmi", ld);
  html = replaceRegion(html, "exercises", articles(exercises));
  return { json, html, count: exercises.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = await build();
  if (process.argv.includes("--check")) {
    const stale = [];
    if (readFileSync(MANIFEST, "utf8") !== out.json) stale.push(relative(ROOT, MANIFEST));
    if (readFileSync(PAGE, "utf8") !== out.html) stale.push(relative(ROOT, PAGE));
    if (stale.length) { console.error(`✖ stale: ${stale.join(", ")} — run: node scripts/academy/build-exercises.mjs`); process.exit(1); }
    console.log(`✓ exercises.json and index.html match run-exercises.mjs (${out.count} exercises)`);
  } else {
    writeFileSync(MANIFEST, out.json);
    writeFileSync(PAGE, out.html);
    console.log(`wrote ${relative(ROOT, MANIFEST)} and ${relative(ROOT, PAGE)} (${out.count} exercises)`);
  }
}
