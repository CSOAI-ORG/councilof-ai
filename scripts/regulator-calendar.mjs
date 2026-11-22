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
 *   - axes, when a door records them, is a non-empty list of ids that exist in the axis registry
 *
 * axes joins three files that already exist: the door (this calendar), the axis's working group
 * (council-os/working-groups.json) and its reviewer role (council-os/axis-specialists/registry.json).
 * With --board (a saved GET /api/gspc) the alert also prints each axis's newest measurement date,
 * so a closing window and a stale axis are read on one line. --windows-out writes that join for
 * every VERIFIED or IN_EFFECT door that carries axes.
 *
 * linked_from is the official PAGE on which a file source_url was found as a link. The alert prints
 * it first. A site can replace a linked file while the old file stays reachable at its old address:
 * on 13 Oct 2026 a re-read of the stored PDF link for the UK Sovereign AI procurement door returned
 * HTTP 200 and a file created 28 Aug, while the official page linked a different file created 20 Sep.
 *
 * Run:  node scripts/regulator-calendar.mjs [--today YYYY-MM-DD] [--file path] [--out alerts.json]
 *                                             [--board gspc.json] [--windows-out windows.json]
 *       node scripts/regulator-calendar.mjs --selftest
 * Exit: 0 ran (alerts, if any, are in --out and $GITHUB_OUTPUT alerts=<n>) · 1 calendar invalid.
 */
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const STATUSES = new Set(["VERIFIED", "CLOSED", "IN_EFFECT", "UNVERIFIED"]);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function validateCalendar(cal, knownAxes = null) {
  const problems = [];
  const seen = new Set();
  const doors = Array.isArray(cal?.doors) ? cal.doors : null;
  if (!doors) return ["calendar has no doors[]"];
  for (const d of doors) {
    const id = d?.id ?? "<no id>";
    if (seen.has(id)) problems.push(`${id}: duplicate id`);
    seen.add(id);
    if (!STATUSES.has(d.status)) problems.push(`${id}: status ${JSON.stringify(d.status)} not in ${[...STATUSES].join("/")}`);
    if (d.axes != null) {
      if (!Array.isArray(d.axes) || d.axes.length === 0 || d.axes.some((a) => typeof a !== "string" || !a)) problems.push(`${id}: axes must be a non-empty list of axis ids`);
      else if (knownAxes) for (const a of d.axes) if (!knownAxes.has(a)) problems.push(`${id}: axis ${JSON.stringify(a)} is not in the axis registry`);
    }
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

const pick = (d) => ({ id: d.id, axes: Array.isArray(d.axes) ? d.axes : null, regulator: d.regulator, instrument: d.instrument, date: d.date, time_tz: d.time_tz ?? null, date_kind: d.date_kind, source_url: d.source_url, linked_from: d.linked_from ?? null, retrieved_at: d.retrieved_at });

/** The day an axis was last measured, read from a saved GET /api/gspc. null when it cannot be read. */
export function axisMeasuredDay(board, axis) {
  const row = Array.isArray(board?.axes) ? board.axes.find((x) => x?.axis === axis) : null;
  const t = row?.measurement_time;
  const day = typeof t === "string" ? t : t?.observed_on ?? t?.observed_at ?? null;
  return typeof day === "string" && ISO.test(day.slice(0, 10)) ? day.slice(0, 10) : null;
}

/** For each axis: its working group, reviewer role and newest measurement day. Nothing is inferred. */
export function axisContext(axes, ctx = {}, asOfIso = null) {
  return (axes ?? []).map((axis) => {
    const group = (ctx.groups ?? []).find((g) => Array.isArray(g.axes) && g.axes.includes(axis));
    const spec = (ctx.specialists ?? []).find((x) => x.axis === axis);
    const measured = ctx.board ? axisMeasuredDay(ctx.board, axis) : null;
    const age = measured && asOfIso ? Math.round((utcDay(asOfIso) - utcDay(measured)) / dayMs) : null;
    return { axis, working_group: group?.id ?? null, reviewer_role: spec?.reviewer_role ?? null, measured_on: measured, age_days_at_door: age };
  });
}

/** Every VERIFIED or IN_EFFECT door that carries axes, joined to its groups, reviewers and measurement days. */
export function computeWindows(cal, todayIso, ctx = {}) {
  return cal.doors
    .filter((d) => (d.status === "VERIFIED" || d.status === "IN_EFFECT") && Array.isArray(d.axes))
    .map((d) => ({ id: d.id, status: d.status, date: d.date, date_kind: d.date_kind, days_from_today: Math.round((utcDay(d.date) - utcDay(todayIso)) / dayMs), regulator: d.regulator, instrument: d.instrument, source_url: d.source_url, axes: axisContext(d.axes, ctx, d.date) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function axisLines(a, ctx) {
  if (!a.axes) return [];
  const rows = axisContext(a.axes, ctx, a.date);
  return [
    "",
    "Board axes this door touches (an editorial mapping made by PR; not a legal reading, not a statement about any measured system):",
    ...rows.map((r) => `- \`${r.axis}\` · working group: ${r.working_group ?? "none recorded"} · reviewer: ${r.reviewer_role ?? "none recorded"} · newest board measurement: ${r.measured_on ? `${r.measured_on} (${r.age_days_at_door} days before this date)` : "not read"}`),
  ];
}

export function issueTitle(a) {
  return a.kind === "PASSED_STILL_VERIFIED"
    ? `Regulator calendar: ${a.id} date ${a.date} has passed but is still VERIFIED — re-status by PR`
    : `Regulator door ${a.kind}: ${a.id} (${a.date_kind} ${a.date})`;
}

export function issueBody(a, ctx = {}) {
  return [
    `**${a.instrument}** — ${a.regulator}`,
    "",
    `- ${a.date_kind}: **${a.date}**${a.time_tz ? ` (${a.time_tz})` : ""}`,
    ...(a.linked_from ? [`- official page (open this first and follow its link; a linked file can be replaced while the old one stays reachable): ${a.linked_from}`] : []),
    `- official source: ${a.source_url}`,
    `- date last read on that source: ${a.retrieved_at}`,
    ...axisLines(a, ctx),
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
  const axisDoor = { id: "i", status: "VERIFIED", date: "2026-09-16", date_kind: "application_date", source_url: "https://x", retrieved_at: "t", evidence_quote: "q", regulator: "r", instrument: "i", axes: ["provenance"] };
  const axisCtx = { groups: [{ id: "prov-wg", axes: ["provenance"] }], specialists: [{ axis: "provenance", reviewer_role: "prov reviewer" }], board: { axes: [{ axis: "provenance", measurement_time: { observed_on: "2026-08-12" } }] } };
  const axisAlert = computeAlerts({ doors: [axisDoor] }, "2026-09-14")[0];
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
    ["axes that is not a list fails validation", validateCalendar({ doors: [{ id: "x", status: "UNVERIFIED", date: null, axes: "provenance" }] }).length === 1],
    ["an empty axes list fails validation", validateCalendar({ doors: [{ id: "x", status: "UNVERIFIED", date: null, axes: [] }] }).length === 1],
    ["an axis missing from the registry fails validation", validateCalendar({ doors: [{ id: "x", status: "UNVERIFIED", date: null, axes: ["nope"] }] }, new Set(["provenance"])).length === 1],
    ["a registered axis passes validation", validateCalendar({ doors: [{ id: "x", status: "UNVERIFIED", date: null, axes: ["provenance"] }] }, new Set(["provenance"])).length === 0],
    ["the alert body names the axis, its group, its reviewer and its measurement age", (() => { const b = issueBody(axisAlert, axisCtx); return b.includes("`provenance`") && b.includes("working group: prov-wg") && b.includes("reviewer: prov reviewer") && b.includes("2026-08-12 (35 days before this date)"); })()],
    ["without a board the measurement date reads 'not read', never a guess", issueBody(axisAlert, { ...axisCtx, board: null }).includes("newest board measurement: not read")],
    ["an instant measurement time is read as its day", axisMeasuredDay({ axes: [{ axis: "p", measurement_time: { observed_at: "2026-09-17T12:58:11Z" } }] }, "p") === "2026-09-17"],
    ["an axis the board does not list has no measurement day", axisMeasuredDay({ axes: [] }, "p") === null],
    ["a door with no axes prints no axis block", !issueBody(computeAlerts(cal, "2026-09-14").find((a) => a.id === "a")).includes("Board axes")],
    ["windows list only VERIFIED or IN_EFFECT doors that carry axes", (() => { const w = computeWindows({ doors: [axisDoor, { ...axisDoor, id: "j", status: "CLOSED" }, { ...axisDoor, id: "k", axes: undefined }, { ...axisDoor, id: "l", status: "IN_EFFECT" }] }, "2026-09-14", axisCtx); return w.length === 2 && w[0].days_from_today === 2 && w[0].axes[0].working_group === "prov-wg"; })()],
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
    const repo = (rel) => JSON.parse(readFileSync(new URL("../" + rel, import.meta.url), "utf8"));
    const ctx = { groups: repo("council-os/working-groups.json").groups, specialists: repo("council-os/axis-specialists/registry.json").specialists, board: null };
    const boardFile = arg("board", null);
    if (boardFile) {
      try { ctx.board = JSON.parse(readFileSync(boardFile, "utf8")); if (!Array.isArray(ctx.board?.axes)) ctx.board = null; } catch { ctx.board = null; }
      if (!ctx.board) console.log(`regulator-calendar: board file ${boardFile} could not be read; measurement dates print as "not read"`);
    }
    const problems = validateCalendar(cal, new Set(ctx.specialists.map((x) => x.axis)));
    if (problems.length) {
      console.error(`regulator-calendar: INVALID calendar (${problems.length})\n  ` + problems.join("\n  "));
      process.exit(1);
    }
    const alerts = computeAlerts(cal, today);
    const counts = cal.doors.reduce((m, d) => ((m[d.status] = (m[d.status] ?? 0) + 1), m), {});
    console.log(`regulator-calendar ${today}: ${cal.doors.length} doors ${JSON.stringify(counts)} · ${alerts.length} alert(s)`);
    for (const a of alerts) console.log(`  ${a.kind.padEnd(22)} ${a.date} ${a.id}`);
    const out = arg("out", null);
    if (out) writeFileSync(out, JSON.stringify(alerts.map((a) => ({ ...a, title: issueTitle(a), body: issueBody(a, ctx) })), null, 1));
    const windows = computeWindows(cal, today, ctx);
    for (const w of windows) console.log(`  window ${w.status.padEnd(9)} ${w.date} (${w.days_from_today >= 0 ? `in ${w.days_from_today} days` : `${Math.abs(w.days_from_today)} days ago`}) ${w.id}: ` + w.axes.map((x) => `${x.axis}@${x.measured_on ?? "not read"}`).join(", "));
    const wout = arg("windows-out", null);
    if (wout) writeFileSync(wout, JSON.stringify({ schema: "csoai.regulator-windows/0.1", as_of: today, board_read: Boolean(ctx.board), note: "Derived join of regulator-doors.json, working-groups.json, the axis registry and, when read, GET /api/gspc. An editorial mapping; not legal advice and not a statement about any measured system.", windows }, null, 1));
    if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `alerts=${alerts.length}\n`);
  }
}
