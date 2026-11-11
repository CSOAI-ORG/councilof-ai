import test from "node:test";
import assert from "node:assert/strict";
import { renderHub, renderAxis, renderAxesJson, renderSubmit, renderSubmitPage } from "./build-bench-suite.mjs";

// Synthetic render inputs exercise scope and navigation, not new board measurements.
const bank = {
  boardAxis: "safety", repo: "gspc-agi", items: 36, labels: ["COMPLY", "REFUSE"],
  sha256: "a".repeat(64), url: "https://example.test/items.jsonl", hub: "https://example.test/bank",
  canary_rows: 1, refused: null,
};
const refused = { ...bank, boardAxis: "refused-axis", refused: "one-option menu refused", labels: ["ONLY_ONE"] };
const matrix = [{ axis: "safety", status: "MEASURED", leader: "synthetic-model", separation: "TIE", n: 36 }];
const board = { totals: { measured_axes: 3, axes: 4 }, axes: [
  { kind: "model-comparison" }, { kind: "deterministic-facts" },
  { kind: "measured-subject" }, { kind: "measured-subject" },
] };

test("hub distinguishes runnable banks, recorded board runs and measurement kinds", () => {
  const html = renderHub(board, [bank, refused], matrix);
  assert.match(html, /<b>1<\/b> runnable banks/);
  assert.match(html, /<b>3<\/b> board axes with recorded runs/);
  assert.match(html, /1 model-comparison; 1 deterministic-facts; 2 measured-subject/);
  assert.match(html, /This is not the runnable-bank count or a count of separated model leaders/);
  assert.match(html, /model service may require/);
  assert.doesNotMatch(html, /Nothing here needs an account|every one can be run/);
});

test("TIE and UNTESTED rows do not publish a separated leader", () => {
  for (const separation of ["TIE", "UNTESTED"]) {
    const html = renderAxis(bank, [{ ...matrix[0], separation }], board);
    assert.match(html, /Board-listed model/);
    assert.doesNotMatch(html, /Separated board leader|nothing on this page is a frozen score/);
    assert.match(html, /build-time snapshot/);
    assert.match(html, /does not update between builds/);
  }
  assert.match(renderAxis(bank, [{ ...matrix[0], separation: "SEPARATED" }], board), /Separated board leader/);
});

test("human and machine entry points link the HTML guide and retain Markdown", () => {
  const html = renderHub(board, [bank], matrix);
  assert.match(html, /href="\/bench\/submit\/"/);
  assert.match(html, /href="\/bench\/submit.md"/);
  const specs = renderAxesJson([bank, refused], matrix, board);
  assert.equal(specs.submit, "https://councilof.ai/bench/submit/");
  assert.equal(specs.submit_markdown, "https://councilof.ai/bench/submit.md");
  assert.match(specs.counting_rule, /2 published banks, 1 with a sound answer menu/);
});

test("one guide source renders the same pinned commands and evidence requirements in both formats", () => {
  const md = renderSubmit([refused, bank]);
  const html = renderSubmit([refused, bank], "html");
  const page = renderSubmitPage([refused, bank]);
  const markdownCommands = [...md.matchAll(/```bash\n([\s\S]*?)\n```/g)].map((m) => m[1]);
  const htmlCommands = [...html.matchAll(/<pre><code>([\s\S]*?)<\/code><\/pre>/g)].map((m) => m[1]);
  assert.deepEqual(htmlCommands, markdownCommands);
  assert.equal(markdownCommands.length, 3);
  assert.ok(markdownCommands.every((cmd) => !/^\+/m.test(cmd)), "copyable commands contain no diff markers");
  assert.ok(markdownCommands[1].includes(`--bank-sha256 ${bank.sha256}`));
  assert.ok(markdownCommands[1].includes("--axis safety"));
  assert.ok(markdownCommands[1].includes("--execution-context context.json"));
  for (const value of ["rows[].answer", "rows[].answer_sha256", "grader_source_sha256", "generation_parameters_source",
    "GSPC_RUN_BENCH_API_KEY", "OPENAI_API_KEY", "User-Agent", "retained original bytes", "not automatic publication"])
    for (const output of [md, html]) assert.ok(output.includes(value), value);
  assert.doesNotMatch(md, /rows\[\]\.raw answer|sha256 \*\*now\*\*|No account, no key/);
  assert.ok(page.includes(html));
  assert.match(page, /rel="canonical" href="https:\/\/councilof.ai\/bench\/submit\/"/);
  assert.match(page, /href="\/bench\/submit.md"/);
});

test("HTML guide escapes bank-provided labels", () => {
  const html = renderSubmit([{ ...bank, labels: ["<script>synthetic</script>", "SAFE"] }], "html");
  assert.match(html, /&lt;script&gt;synthetic&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
