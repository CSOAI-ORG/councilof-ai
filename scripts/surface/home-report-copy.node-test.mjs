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

// These assertions guard the report discovery path in the actual component source.
// They do not claim that a destination was fetched or that an artifact was verified.
function anchors(input) {
  const uncommented = input.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...uncommented.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, body]) => ({
    attributes,
    href: attributes.match(/\bhref="([^"]+)"/)?.[1],
    label: body.replace(/\s+/g, " ").trim(),
  }));
}
function archiveLink(input) {
  return anchors(input).find((link) => link.href === "/reports/daily-signal/");
}
function verifierLink(input) {
  return anchors(input).find((link) => link.href === "/gspc-verify/");
}

test("first-party evidence archive has a descriptive ordinary link", () => {
  const link = archiveLink(source);
  assert.ok(link, "retained evidence archive must be discoverable from the report band");
  assert.equal(link.label, "Browse evidence reports");
  assert.doesNotMatch(link.attributes, /\b(?:target|onClick|download)=/);
});
test("measurement verification remains a separate descriptive link", () => {
  const link = verifierLink(source);
  assert.ok(link, "measurement records need their existing free verification route");
  assert.equal(link.label, "Verify a measurement record");
  assert.doesNotMatch(link.attributes, /\b(?:target|onClick|download)=/);
});
test("derived report copy does not present the archive as signed measurements", () => {
  const block = source.split('data-testid="home-derived-report-links"')[1];
  assert.ok(block, "derived reports need a separately labelled block");
  assert.match(block, /Evidence reports and source downloads/);
  assert.match(block, /unsigned derived summaries/);
  assert.match(block, /not signed\s+measurement records or legal advice/);
  assert.doesNotMatch(block, /href="\/gspc-verify\/"/);
});
test("negative control: removing the report anchor cannot pass as discoverable", () => {
  assert.equal(archiveLink(source.replace(/<a\b[^>]*href="\/reports\/daily-signal\/"[^>]*>[\s\S]*?<\/a>/g, "")), undefined);
});
test("negative control: a gated dashboard is not the free report archive", () => {
  assert.equal(archiveLink(source.replace('href="/reports/daily-signal/"', 'href="/dashboard"')), undefined);
});
test("negative control: a comment-only report link is not navigation", () => {
  assert.equal(archiveLink('{/* <a href="/reports/daily-signal/">Browse evidence reports</a> */}'), undefined);
});
test("negative control: changing the verifier destination loses that route", () => {
  assert.equal(verifierLink(source.replace('href="/gspc-verify/"', 'href="/board/"')), undefined);
});
