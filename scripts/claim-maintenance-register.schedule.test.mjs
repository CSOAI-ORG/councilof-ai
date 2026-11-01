/**
 * The register's schedule, tested against the producer and against the scheduler.
 *
 * 13 Oct 2026. GET /api/claims/register read "0 subjects with a scheduled next read" and
 * "26 with a due, unrun next read". Neither was true. The scheduler's public ledger showed every
 * dated check completed and six more planned. The register was wrong for three reasons, each
 * pinned by a test below:
 *
 *   1. it knew ONE of the four checks the scheduler plans for a registry (the date the registry's
 *      own bytes name), so once that date passed nothing could ever read as scheduled again;
 *   2. it named a run outcome (DUE_NOT_RUN) from a date alone, with no record of any run;
 *   3. `--check` recomputed date-against-clock fields with today's clock, so the gate would turn
 *      red on the day a planned date passed, with nothing on disk changed.
 *
 * The schedule rule lives in two programs: scripts/claims/maintenance_due.py (which runs the
 * reads) and scripts/claim-maintenance-register.mjs (which prints the dates). The last test runs
 * both over the same registries and compares them, so they cannot drift apart unnoticed.
 */
import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GENERATOR = join(ROOT, "scripts/claim-maintenance-register.mjs");
const SCHEDULER = join(ROOT, "scripts/claims/maintenance_due.py");

const TMP = mkdtempSync(join(tmpdir(), "claim-register-schedule-"));
afterAll(() => rmSync(TMP, { recursive: true, force: true }));

const generator = (...args) => spawnSync(process.execPath, [GENERATOR, ...args], { cwd: ROOT, encoding: "utf8" });

const claim = (subject, id, next) => ({
  schema: "csoai.claim-maintenance.artifact/0.2",
  claim_id: id,
  state: "UNMEASURED",
  subject: { name: subject, identifier: `${subject.toLowerCase()}.example`, identifier_kind: "domain" },
  source_url: `https://${subject.toLowerCase()}.example/`,
  access_date: "2026-09-25T05:00:00Z",
  first_captured_utc: "2026-09-23T04:00:00Z",
  ...(next ? { next_read_utc: next } : {}),
});

/**
 * Invented subjects, invented dates. Three registries:
 *   claimreg-old    created 23 Sep, replaced by claimreg-live — must never be scheduled;
 *   claimreg-live   created 25 Sep; Alpha's claims name a next read (28 Sep), Beta's name none;
 *   claimreg-plain  created 28 Sep; names no next read at all.
 */
function fixture(name = "claims") {
  const dir = join(TMP, name);
  mkdirSync(dir, { recursive: true });
  const write = (id, doc) => writeFileSync(join(dir, `${id}.json`), JSON.stringify(doc, null, 2) + "\n");
  write("claimreg-old", {
    schema: "csoai.claim-registry/0.3",
    registry_id: "claimreg-old",
    created_utc: "2026-09-23T00:00:00Z",
    claims: [claim("Alpha", "AL-1", "2026-09-28T09:20:00Z")],
  });
  write("claimreg-live", {
    schema: "csoai.claim-registry/0.3",
    registry_id: "claimreg-live",
    created_utc: "2026-09-25T00:00:00Z",
    supersedes: { registry_id: "claimreg-old" },
    claims: [
      claim("Alpha", "AL-1", "2026-09-28T09:20:00Z"),
      claim("Alpha", "AL-2", "2026-10-05T09:20:00Z"),
      claim("Beta", "BE-1", null),
    ],
  });
  write("claimreg-plain", {
    schema: "csoai.claim-registry/0.3",
    registry_id: "claimreg-plain",
    created_utc: "2026-09-28T00:00:00Z",
    claims: [claim("Gamma", "GA-1", null)],
  });
  return dir;
}

function registerAt(asOf, dir = fixture()) {
  const out = join(TMP, `register-${asOf.replace(/[^0-9]/g, "")}.json`);
  const r = generator("--claims-dir", dir, "--out", out, "--as-of", asOf);
  expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
  return { out, dir, register: JSON.parse(readFileSync(out, "utf8")) };
}

const subject = (register, name) => register.subjects.find((s) => s.subject === name);
const rows = (register) => register.schedule.checks.map((c) => `${c.due} ${c.registry_id} ${c.check} ${c.position}`);

describe("claim-maintenance register — the schedule", () => {
  it("plans every re-read the scheduler runs, not only the one a registry names", () => {
    const { register } = registerAt("2026-10-13T07:00:00Z");
    expect(rows(register)).toEqual([
      "2026-09-28 claimreg-live scheduled-read ON_OR_BEFORE_AS_OF",
      "2026-10-02 claimreg-live day-7 ON_OR_BEFORE_AS_OF",
      "2026-10-05 claimreg-plain day-7 ON_OR_BEFORE_AS_OF",
      "2026-10-25 claimreg-live day-30 AFTER_AS_OF",
      "2026-10-28 claimreg-plain day-30 AFTER_AS_OF",
      "2026-12-24 claimreg-live day-90 AFTER_AS_OF",
      "2026-12-27 claimreg-plain day-90 AFTER_AS_OF",
    ]);
    // The date the registry named has passed. The subject still has a planned read: day 30.
    expect(subject(register, "Alpha").next_scheduled_read).toBe("2026-09-28T09:20:00Z");
    expect(subject(register, "Alpha").next_scheduled_check).toEqual({
      check: "day-30",
      due: "2026-10-25",
      basis: "registry created 2026-09-25 + 30 days",
    });
    // A subject whose registry names no date is still on the day-7/30/90 plan.
    expect(subject(register, "Beta").next_scheduled_read_state).toBe("UNSCHEDULED");
    expect(subject(register, "Beta").next_scheduled_check.due).toBe("2026-10-25");
    expect(subject(register, "Gamma").next_scheduled_check.due).toBe("2026-10-28");
    // This is the number that read 0 on the live register.
    expect(register.totals.subjects_with_a_scheduled_next_read).toBe(3);
    expect(register.totals.scheduled_checks).toBe(7);
    expect(register.totals.scheduled_checks_after_as_of).toBe(4);
    expect(register.totals.scheduled_checks_on_or_before_as_of).toBe(3);
  });

  it("never schedules a superseded registry", () => {
    const { register } = registerAt("2026-10-13T07:00:00Z");
    expect(register.registries.find((r) => r.registry_id === "claimreg-old").status).toBe("SUPERSEDED");
    expect(register.schedule.checks.filter((c) => c.registry_id === "claimreg-old")).toEqual([]);
  });

  it("names no run outcome: a passed date is due and unverified here, and the ledger is named", () => {
    const { register } = registerAt("2026-10-13T07:00:00Z");
    expect(subject(register, "Alpha").next_scheduled_read_state).toBe("DUE_EXECUTION_UNVERIFIED");
    expect(JSON.stringify(register)).not.toContain("DUE_NOT_RUN");
    expect(Object.keys(register.totals).join(" ")).not.toMatch(/unrun/);
    expect(register.totals.subjects_with_due_execution_unverified).toBe(1);
    expect(register.schedule.executed_checks.authority).toMatch(/^https:\/\/.+\/claim-maintenance\/latest\.json$/);
    expect(register.schedule.dates_not_outcomes).toMatch(/holds no record of any run/);
  });

  it("a named date still ahead reads SCHEDULED and is the next check", () => {
    const { register } = registerAt("2026-09-26T00:00:00Z");
    expect(subject(register, "Alpha").next_scheduled_read_state).toBe("SCHEDULED");
    expect(subject(register, "Alpha").next_scheduled_check).toMatchObject({ check: "scheduled-read", due: "2026-09-28" });
    expect(register.totals.subjects_with_due_execution_unverified).toBe(0);
  });

  it("a check due today is not counted as still ahead", () => {
    const { register } = registerAt("2026-10-25T06:00:00Z");
    expect(rows(register)).toContain("2026-10-25 claimreg-live day-30 ON_OR_BEFORE_AS_OF");
    expect(subject(register, "Alpha").next_scheduled_check).toMatchObject({ check: "day-90", due: "2026-12-24" });
  });

  it("says so when nothing is left: after day 90 no read is planned", () => {
    const { register } = registerAt("2027-01-01T00:00:00Z");
    for (const s of register.subjects) expect(s.next_scheduled_check).toBeNull();
    expect(register.totals.subjects_with_a_scheduled_next_read).toBe(0);
    expect(register.totals.scheduled_checks_after_as_of).toBe(0);
    expect(register.schedule.after_the_last_check).toMatch(/no planned re-read after its day-90 date/);
  });

  it("--check does not read the clock: a planned date passing is not drift", () => {
    // Generated while the named date (28 Sep) was still ahead. Today it is long past. The
    // registries are unchanged, so the committed bytes still match them and the gate stays green.
    const { out, dir, register } = registerAt("2026-09-26T00:00:00Z", fixture("claims-clock"));
    expect(subject(register, "Alpha").next_scheduled_read_state).toBe("SCHEDULED");
    const ok = generator("--check", "--claims-dir", dir, "--out", out);
    expect(`${ok.stdout}${ok.stderr}`).not.toMatch(/DRIFT|MISSING/);
    expect(ok.status, `${ok.stdout}\n${ok.stderr}`).toBe(0);
    // It still catches what it is for: a registry changing under a committed register.
    writeFileSync(
      join(dir, "claimreg-plain.json"),
      JSON.stringify({
        schema: "csoai.claim-registry/0.3",
        registry_id: "claimreg-plain",
        created_utc: "2026-09-28T00:00:00Z",
        claims: [claim("Gamma", "GA-1", null), claim("Delta", "DE-1", null)],
      }),
    );
    const drift = generator("--check", "--claims-dir", dir, "--out", out);
    expect(drift.status).toBe(1);
    expect(`${drift.stdout}${drift.stderr}`).toMatch(/DRIFT/);
  }, 60_000);

  it("refuses a flag with no value rather than guessing", () => {
    const r = generator("--check", "--as-of");
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/--as-of requires a value/);
    const bad = generator("--check", "--as-of", "yesterday");
    expect(bad.status).not.toBe(0);
    expect(bad.stderr).toMatch(/--as-of must be a UTC instant/);
  });
});

describe("claim-maintenance register — one rule, two programs", () => {
  /** The scheduler's own plan for a register, as the same row strings. */
  function schedulerPlan(registerFile, today) {
    const r = spawnSync("python3", [SCHEDULER, "plan", "--register", registerFile, "--today", today], {
      cwd: ROOT,
      encoding: "utf8",
    });
    expect(r.error, "python3 is needed to run the scheduler's plan; this comparison must not be skipped").toBeUndefined();
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    return r.stdout
      .split("\n")
      .filter((l) => l.trim())
      .map((l) => {
        const [due, registry, check, due_now] = l.trim().split(/\s+/);
        return `${due} ${registry} ${check} ${due_now === "DUE" ? "ON_OR_BEFORE_AS_OF" : "AFTER_AS_OF"}`;
      });
  }

  it("the register's schedule is the scheduler's plan for the invented registries", () => {
    for (const asOf of ["2026-09-26T00:00:00Z", "2026-10-13T07:00:00Z", "2026-10-25T06:00:00Z", "2027-01-01T00:00:00Z"]) {
      const { out, register } = registerAt(asOf);
      expect(rows(register), `as of ${asOf}`).toEqual(schedulerPlan(out, asOf.slice(0, 10)));
    }
  }, 60_000);

  it("the register's schedule is the scheduler's plan for the registries on disk", () => {
    const out = join(TMP, "register-on-disk.json");
    const r = generator("--out", out);
    expect(r.status, `${r.stdout}\n${r.stderr}`).toBe(0);
    const register = JSON.parse(readFileSync(out, "utf8"));
    expect(register.schedule.checks.length).toBeGreaterThan(0);
    expect(rows(register)).toEqual(schedulerPlan(out, register.as_of.slice(0, 10)));
  }, 60_000);
});
