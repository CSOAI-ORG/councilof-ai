#!/usr/bin/env node
/**
 * regulator-calendar.mjs — T-7 / T-2 / T-0 alerts over measurement/calendar/regulator-doors.json.
 *
 * Runs as a step in reg-watch.yml (daily 06:45 UTC) — no new cron. It reads the committed
 * calendar, validates the honesty rules, and writes alerts for VERIFIED doors whose date is
 * exactly 7, 2 or 0 days away (UTC). It also flags a VERIFIED door whose date has passed: the
 * file then says something that is no longer true and needs re-statusing by PR.
 *
 * Honesty rules it enforces (exit 1 on violation — a malformed calendar is not an all-clear):
 *   - UNVERIFIED doors carry date null (a date is never guessed)
 *   - VERIFIED / CLOSED / IN_EFFECT doors carry an ISO date, source_url, retrieved_at, evidence_quote
 *   - ids are unique; status is one of the four
 *   - linked_from, when a door records one, is a URL and is not the same address as source_url
 *
 * linked_from is the official PAGE on which a file source_url was found as a link. The alert prints
 * it first. A site can replace a linked file while the old file stays reachable at its old address:
 * on 13 Oct 2026 a re-read of the stored PDF link for the UK Sovereign AI procurement door returned
 * HTTP 200 and a file created 28 Aug, while the official page linked a different file created 20 Sep.
 *
 * Run:  node scripts/regulator-calendar.mjs [--today YYYY-MM-DD] [--file path] [--out alerts.json]
 *       node scripts/regulator-calendar.mjs --selftest
 * Exit: 0 ran (alerts, if any, are in --out and $GITHUB_OUTPUT alerts=<n>) · 1 calendar invalid.
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const STATUSES = new Set(["VERIFIED", "CLOSED", "IN_EFFECT", "UNVERIFIED"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validateCalendar(cal) {
  const problems = [];
  const seen = new Set();
  const doors = Array.isArray(cal?.doors) ? cal.doors : null;
  if (!doors) return ["calendar has no doors[]"];
  for (const d of doors) {
    const id = d?.id ?? "<no id>";
    if (seen.has(id)) problems.push(`${id}: duplicate id`);
    seen.add(id);
    if (!STATUSES.has(d.status)) problems.push(`${id}: status ${JSON.stringify(d.status)} not in ${[...STATUSES].join("/")}`);
    if (d.status === "UNVERIFIED") {
      if (d.date !== null) problems.push(`${id}: UNVERIFIED must carry date null, has ${JSON.stringify(d.date)}`);
      continue;
    }
    if (!ISO.test(d.date ?? "") || Number.isNaN(Date.parse(d.date + "T00:00:00Z"))) problems.push(`${id}: ${d.status} needs an ISO date, has ${JSON.stringify(d.date)}`);
    for (const k of ["source_url", "retrieved_at", "evidence_quote"]) if (!d[k]) problems.push(`${id}: ${d.status} needs ${k}`);
    if (d.source_url && !/^https?:\/\//.test(d.source_url)) problems.push(`${id}: source_url is not a URL`);
    if (d.linked_from != null) {
      if (typeof d.linked_from !== "string" || !/^https?:\/\//.test(d.linked_from)) problems.push(`${id}: linked_from is not a URL`);
      else if (d.linked_from === d.source_url) problems.push(`${id}: linked_from is the same address as source_url; it must be the page that links the file`);
    }
  }
  return problems;
}

const dayMs = 86_400_000;
const utcDay = (iso) => Date.parse(iso + "T00:00:00Z");

export function computeAlerts(cal, todayIso) {
  const offsets = cal?.alerts?.offsets_days ?? [7, 2, 0];
  const today = utcDay(todayIso);
  const alerts = [];
  for (const d of cal.doors) {
    if (d.status !== "VERIFIED" || !d.date) continue;
    const days = Math.round((utcDay(d.date) - today) / dayMs);
    if (offsets.includes(days)) alerts.push({ kind: `T-${days}`, days, ...pick(d) });
    else if (days < 0) alerts.push({ kind: "PASSED_STILL_VERIFIED", days, ...pick(d) });
  }
  return alerts.sort((a, b) => a.days - b.days);
}

const pick = (d) => ({ id: d.id, regulator: d.regulator, instrument: d.instrument, date: d.date, time_tz: d.time_tz ?? null, date_kind: d.date_kind, source_url: d.source_url, linked_from: d.linked_from ?? null, retrieved_at: d.retrieved_at });

export function issueTitle(a) {
  return a.kind === "PASSED_STILL_VERIFIED"
    ? `Regulator calendar: ${a.id} date ${a.date} has passed but is still VERIFIED — re-status by PR`
    : `Regulator door ${a.kind}: ${a.id} (${a.date_kind} ${a.date})`;
}

export function issueBody(a) {
  return [
    `**${a.instrument}** — ${a.regulator}`,
    "",
    `- ${a.date_kind}: **${a.date}**${a.time_tz ? ` (${a.time_tz})` : ""}`,
    ...(a.linked_from ? [`- official page (open this first and follow its link; a linked file can be replaced while the old one stays reachable): ${a.linked_from}`] : []),
    `- official source: ${a.source_url}`,
    `- date last read on that source: ${a.retrieved_at}`,
    "",
    a.kind === "PASSED_STILL_VERIFIED"
      ? "The date has passed. Update `measurement/calendar/regulator-doors.json` to CLOSED or IN_EFFECT (or to a re-verified new date) by PR."
      : "Re-open the official source before acting — a date can move after it was read. Source: `measurement/calendar/regulator-doors.json`.",
    "",
    "Not legal advice. Listing a door is not a statement that CSOAI will respond to it.",
  ].join("\n");
}

function selftest() {
  const cal = {
    alerts: { offsets_days: [7, 2, 0] },
    doors: [
      { id: "a", status: "VERIFIED", date: "2026-09-21", date_kind: "comment_deadline", source_url: "https://x", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i" },
      { id: "b", status: "VERIFIED", date: "2026-09-16", date_kind: "comment_deadline", source_url: "https://x", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i" },
      { id: "c", status: "VERIFIED", date: "2026-09-14", date_kind: "comment_deadline", source_url: "https://x", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i" },
      { id: "d", status: "VERIFIED", date: "2026-09-20", date_kind: "comment_deadline", source_url: "https://x", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i" },
      { id: "e", status: "VERIFIED", date: "2026-09-01", date_kind: "comment_deadline", source_url: "https://x", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i" },
      { id: "f", status: "UNVERIFIED", date: null },
      { id: "g", status: "CLOSED", date: "2026-09-21", source_url: "https://x", retrieved_at: "t", evidence_quote: "q" },
    ],
  };
  const kinds = Object.fromEntries(computeAlerts(cal, "2026-09-14").map((a) => [a.id, a.kind]));
  // A door whose source is a FILE found as a link on an official page (the 13 Oct 2026 case).
  const fileDoor = { id: "h", status: "VERIFIED", date: "2026-09-16", date_kind: "submission_deadline", source_url: "https://cdn.example/a1_guidance.pdf", linked_from: "https://regulator.example/scheme", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i" };
  const fileAlert = computeAlerts({ doors: [fileDoor] }, "2026-09-14")[0];
  const fileBody = fileAlert ? issueBody(fileAlert) : "";
  const cases = [
    ["valid calendar passes validation", validateCalendar(cal).length === 0],
    ["T-7 fires", kinds.a === "T-7"],
    ["T-2 fires", kinds.b === "T-2"],
    ["T-0 fires", kinds.c === "T-0"],
    ["T-6 does not fire", !("d" in kinds)],
    ["passed VERIFIED is flagged", kinds.e === "PASSED_STILL_VERIFIED"],
    ["UNVERIFIED never alerts", !("f" in kinds)],
    ["CLOSED never alerts", !("g" in kinds)],
    ["UNVERIFIED with a date fails validation", validateCalendar({ doors: [{ id: "x", status: "UNVERIFIED", date: "2026-10-01" }] }).length === 1],
    ["VERIFIED without evidence fails validation", validateCalendar({ doors: [{ id: "x", status: "VERIFIED", date: "2026-10-01", source_url: "https://x", retrieved_at: "t" }] }).length === 1],
    ["unknown status fails validation", validateCalendar({ doors: [{ id: "x", status: "PROBABLY", date: null }] }).length >= 1],
    ["duplicate id fails validation", validateCalendar({ doors: [{ id: "x", status: "UNVERIFIED", date: null }, { id: "x", status: "UNVERIFIED", date: null }] }).length === 1],
    ["linked_from that is not a URL fails validation", validateCalendar({ doors: [{ ...fileDoor, linked_from: "sovereignai.gov.uk" }] }).length === 1],
    ["linked_from equal to source_url fails validation", validateCalendar({ doors: [{ ...fileDoor, linked_from: fileDoor.source_url }] }).length === 1],
    ["a door with a linking page passes validation", validateCalendar({ doors: [fileDoor] }).length === 0],
    ["the alert carries the linking page", fileAlert?.linked_from === fileDoor.linked_from],
    ["the alert body prints the linking page above the file link", fileBody.includes(fileDoor.linked_from) && fileBody.indexOf(fileDoor.linked_from) < fileBody.indexOf(fileDoor.source_url)],
    ["an alert for a door with no linking page prints no page line", !issueBody(computeAlerts(cal, "2026-09-14").find((a) => a.id === "a")).includes("official page")],
  ];
  let failed = 0;
  for (const [n, ok] of cases) { console.log(`  ${ok ? "✓" : "✗"} ${n}`); if (!ok) failed++; }
  if (failed) { console.error(`regulator-calendar selftest: FAIL (${failed})`); process.exit(1); }
  console.log(`regulator-calendar selftest: PASS (${cases.length} cases)`);
}

const isMain = import.meta.url === new URL(process.argv[1] ?? "", "file://").href;
if (isMain) {
  const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
  if (process.argv.includes("--selftest")) selftest();
  else {
    const file = arg("file", new URL("../measurement/calendar/regulator-doors.json", import.meta.url).pathname);
    const today = arg("today", new Date().toISOString().slice(0, 10));
    const cal = JSON.parse(readFileSync(file, "utf8"));
    const problems = validateCalendar(cal);
    if (problems.length) {
      console.error(`regulator-calendar: INVALID calendar (${problems.length})\n  ` + problems.join("\n  "));
      process.exit(1);
    }
    const alerts = computeAlerts(cal, today);
    const counts = cal.doors.reduce((m, d) => ((m[d.status] = (m[d.status] ?? 0) + 1), m), {});
    console.log(`regulator-calendar ${today}: ${cal.doors.length} doors ${JSON.stringify(counts)} · ${alerts.length} alert(s)`);
    for (const a of alerts) console.log(`  ${a.kind.padEnd(22)} ${a.date} ${a.id}`);
    const out = arg("out", null);
    if (out) writeFileSync(out, JSON.stringify(alerts.map((a) => ({ ...a, title: issueTitle(a), body: issueBody(a) })), null, 1));
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `alerts=${alerts.length}\n`);
  }
}
