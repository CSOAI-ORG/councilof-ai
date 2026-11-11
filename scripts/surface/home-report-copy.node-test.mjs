import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../../client/src/components/home/HomeMine.tsx", import.meta.url), "utf8");
// This is a source-copy regression test, not a browser or signature-verification test.
function copyIssues(input) {
  const text = input.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s+/g, " ");
  const rules = [
    ["fixed_axis_count", /\b\d+[- ]axis\s+daily\s+report/i],
    ["unbounded_coverage", /every axis|every leaderboard change|every correction/i],
    ["unqualified_daily_signature", /one signed report a day|daily report.{0,8}signed/i],
    ["unqualified_today", /today(?:&apos;|')s (?:report|issue)/i],
  ];
  return rules.filter(([, pattern]) => pattern.test(text)).map(([id]) => id);
}

test("homepage report copy has no unqualified count, cadence or signature promise", () => {
  assert.deepEqual(copyIssues(source), []);
});
test("negative control: historical fixed axis count is rejected", () => {
  assert.ok(copyIssues("The 33-axis daily report").includes("fixed_axis_count"));
});
test("negative control: changing 33 to 34 does not repair a fixed-count promise", () => {
  assert.ok(copyIssues("The 34-axis daily report").includes("fixed_axis_count"));
});
test("negative controls: total coverage, daily signature and today claims are rejected", () => {
  for (const text of ["Every axis, every leaderboard change, every correction", "one signed report\n a day", "Read today&apos;s report"]) {
    assert.ok(copyIssues(text).length > 0, text);
  }
});
test("report date, scope and evidence status remain explicit", () => {
  assert.match(source, /Published measurement reports/);
  assert.match(source, /scope, sources and\s+evidence status/);
  assert.match(source, /Check the publication date/);
});
test("existing archive, board, signup and live strip remain wired", () => {
  assert.match(source, /href="https:\/\/huggingface\.co\/datasets\/csoai\/gspc-daily-reports"/);
  assert.match(source, /target="_blank"\s+rel="noopener noreferrer"/);
  assert.match(source, /href="\/board\/"/);
  assert.match(source, /<NewsletterSignup\s*\/>/);
  assert.match(source, /<LivingBoardStrip\s*\/>/);
});
test("restored archive band does not reuse the HomeUpdates test selector", () => {
  assert.match(source, /data-testid="home-report-archive-band"/);
  assert.doesNotMatch(source, /data-testid="home-daily-report-band"/);
});
