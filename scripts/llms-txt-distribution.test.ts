import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * llms.txt and llms-full.txt must say what the home page says about downloads (18 Nov 2026).
 *
 * CSOAI Ltd and MEOK AI Labs publish from one account, and the census labels every package with its
 * entity. The census producer's rule (scripts/distribution-measure.py, by_entity.rule) says the two
 * entities' figures "are two figures and are never added", and the home page (HomeDistribution.tsx,
 * #4455) heads with CSOAI's own by_entity figures and gives MEOK AI Labs its own line. These files
 * still headed with the account's `totals`: 3,852,241 since first release, which is MEOK AI Labs
 * 2,746,597 + CSOAI 890,521 + joint + unattributed. Answer engines read these files first.
 *
 * The first block reads the committed outputs, which `node scripts/llms-txt.mjs --check` (pr-gates)
 * holds equal to what the producer derives. The last block tests the producer's own rule for when a
 * figure may be printed, which is the home page's rule without the clock.
 *
 * The User-Agent block exists because the edge answers Python's default urllib User-Agent with 403
 * (error code 1010) on the free reads, so an agent that follows these files with plain urllib fails.
 */
const ROOT = resolve(__dirname, "..");
const R = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const fmt = (n: number) => Number(n).toLocaleString("en-US");
const files = ["public/llms.txt", "public/llms-full.txt"] as const;
const templates = ["scripts/llms/llms.txt.tmpl", "scripts/llms/llms-full.txt.tmpl"] as const;
const dist = JSON.parse(R("public/interop/distribution-latest.json"));
const WINDOWS = ["downloads_all_time", "downloads_30d"] as const;
const MARK = "Derived at generation from https://councilof.ai/interop/distribution-latest.json";
const producer = () => import("./llms-txt-distribution.mjs");

/** The distribution section: from its derivation line to the next heading. */
function section(text: string): string {
  const start = text.indexOf(MARK);
  expect(start, "the text carries the distribution section").toBeGreaterThanOrEqual(0);
  const rest = text.slice(start);
  const end = rest.search(/\n#{2,3} /);
  return end < 0 ? rest : rest.slice(0, end);
}
/** Bullets that carry a download figure (a number with a thousands separator). */
const figureLines = (sec: string) => sec.split("\n").filter((l) => l.startsWith("- ") && /\d{1,3}(?:,\d{3})+/.test(l));

describe("the published distribution section heads with CSOAI's own figures", () => {
  it("never prints the account total, which adds MEOK AI Labs into CSOAI", () => {
    for (const f of files) {
      const out = R(f);
      for (const key of WINDOWS) {
        expect(out, `${f}: totals.${key} counts every row of the account`).not.toContain(fmt(dist.totals[key].value));
        const sum = dist.by_entity[key].csoai.value + dist.by_entity[key].meok.value;
        expect(out, `${f}: CSOAI + MEOK AI Labs in ${key} is a sum the census rule forbids`).not.toContain(fmt(sum));
      }
      expect(out, `${f}: the old rule called the account total the estate's`).not.toMatch(/estate total is every row/);
    }
  });

  it("its first two figures are CSOAI's own by_entity values, each with state, denominator and as_of", async () => {
    const read = (await producer()).distributionRead(dist);
    expect(read.reason, "the committed census is readable by the producer's rule").toBeUndefined();
    for (const f of files) {
      const [lifetime, recent] = figureLines(section(R(f)));
      for (const [line, row] of [[lifetime, read.csoai.lifetime], [recent, read.csoai.recent]] as const) {
        expect(line, `${f}: the section must head with CSOAI's figures`).toMatch(/^- CSOAI packages, /);
        expect(line).toContain(`${fmt(row.value)} gross downloads`);
        expect(line).toContain(`state ${row.state}, ${fmt(row.covered)} of ${fmt(row.attempted)} counters answered`);
        expect(line).toContain(`as_of ${dist.as_of}`);
        if (row.state === "PARTIAL") expect(line).toContain("LOWER BOUND");
      }
      expect(lifetime).toContain("since first release");
      expect(recent).toContain("in the last 30 days");
      expect(section(R(f)), `${f}: the census's own freshness bound travels with its figures`)
        .toContain(`The census declares itself out of date after ${dist.stale_after} (stale_after)`);
    }
  });

  it("gives MEOK AI Labs its own labelled line, never on a CSOAI line", async () => {
    const read = (await producer()).distributionRead(dist);
    expect(read.meok, "the committed census carries a readable MEOK AI Labs pair").toBeTruthy();
    for (const f of files) {
      const lines = figureLines(section(R(f)));
      const meok = lines.filter((l) => l.startsWith("- MEOK AI Labs"));
      expect(meok, `${f}: MEOK AI Labs gets exactly one line`).toHaveLength(1);
      expect(meok[0]).toContain("never added to CSOAI's figures");
      for (const row of [read.meok.lifetime, read.meok.recent]) {
        expect(meok[0]).toContain(`${fmt(row.value)} `);
        expect(meok[0]).toContain(`state ${row.state}, ${fmt(row.covered)} of ${fmt(row.attempted)} counters answered`);
      }
      for (const l of lines.filter((x) => x.startsWith("- CSOAI packages"))) {
        for (const row of [read.meok.lifetime, read.meok.recent]) expect(l).not.toContain(fmt(row.value));
      }
    }
  });

  it("says joint and unattributed packages are in neither figure, and the account total is neither entity's", () => {
    for (const f of files) {
      const sec = section(R(f));
      expect(sec).toContain("Packages labelled joint or unattributed are in neither figure.");
      expect(sec).toMatch(/`totals` counts every\s+row of the account, joint and unattributed included, so it is neither entity's figure/);
      expect(sec).toMatch(/two\s+figures and are never added: quote each under its own label/);
    }
  });
});

describe("both files tell an agent to send a descriptive User-Agent", () => {
  const EXAMPLE = 'req = urllib.request.Request(url, headers={"User-Agent": "my-verifier/1.0"})';
  const paragraph = (src: string) => src.match(/User-Agent: name your client\.[\s\S]*?\n```\n/)?.[0];

  it("names the refusal, how to report it, and the example HOW-TO-VERIFY.md already gives", () => {
    expect(R("public/signed/HOW-TO-VERIFY.md"), "the example must stay the one HOW-TO-VERIFY.md gives").toContain(EXAMPLE);
    for (const f of files) {
      const p = paragraph(R(f));
      expect(p, `${f} carries no User-Agent paragraph`).toBeTruthy();
      expect(p).toContain("`Python-urllib/3.x`");
      expect(p).toMatch(/HTTP 403,\s+error code 1010/);
      expect(p).toMatch(/report it\s+UNCHECKABLE, never INVALID/);
      expect(p).toContain("https://councilof.ai/signed/HOW-TO-VERIFY.md ");
      expect(p).toContain(EXAMPLE);
    }
  });

  it("is one text in both templates, and it sits beside the API instructions", () => {
    const [a, b] = templates.map((t) => paragraph(R(t)));
    expect(a, "llms.txt.tmpl carries the paragraph").toBeTruthy();
    expect(a, "the two files must not drift into different advice").toBe(b);
    for (const t of templates) {
      const src = R(t);
      expect(src.indexOf("User-Agent: name your client."), `${t}: it follows the refusal rule`)
        .toBeGreaterThan(src.indexOf("If a public source refuses a request"));
    }
  });
});

describe("the producer prints a figure only when the home page would", () => {
  const asOf = "2026-11-16T04:40:31Z";
  const row = (value: number, covered: number, attempted: number, state = "READ") => ({ state, value, covered, attempted, as_of: asOf });
  const census = (): any => ({
    schema: "csoai.distribution/0.1",
    as_of: asOf,
    max_age_hours: 48,
    stale_after: "2026-11-18T04:40:31Z",
    totals: {
      downloads_30d: { ...row(771433, 908, 909, "PARTIAL"), unit: "downloads", window: "last 30 days, each registry over its own 30-day window" },
      downloads_all_time: { ...row(3852241, 908, 909, "PARTIAL"), unit: "downloads", window: "cumulative, all time" },
    },
    by_entity: {
      downloads_30d: { meok: row(228554, 317, 318, "PARTIAL"), csoai: row(514407, 212, 212), joint: row(14346, 32, 32), unattributed: row(14126, 347, 347) },
      downloads_all_time: { meok: row(2746597, 317, 318, "PARTIAL"), csoai: row(890521, 212, 212), joint: row(72056, 32, 32), unattributed: row(143067, 347, 347) },
    },
    packages: [
      { registry: "npm", name: "a-csoai-package", entity: "csoai", downloads_30d: 10, downloads_all_time: 20 },
      { registry: "pypi", name: "meok-.github-profile", entity: "meok", downloads_30d: null, downloads_all_time: null, reason: "http 404" },
    ],
  });

  it("heads with CSOAI, gives MEOK AI Labs a line, and prints no total of the account", async () => {
    const sec = (await producer()).distributionSection(census());
    const lines = figureLines(sec);
    expect(lines[0]).toMatch(/^- CSOAI packages, since first release \(cumulative\): 890,521 gross downloads — state READ, 212 of 212 counters answered\./);
    expect(lines[1]).toMatch(/^- CSOAI packages, in the last 30 days: 514,407 gross downloads — state READ, 212 of 212 counters answered\./);
    expect(lines[2]).toContain("MEOK AI Labs, a separate entity publishing from the same account, is counted on its own and never added to CSOAI's figures: 2,746,597 gross downloads since first release — state PARTIAL, 317 of 318 counters answered, so it is a LOWER BOUND");
    expect(lines[2]).toContain("228,554 in the last 30 days — state PARTIAL, 317 of 318 counters answered, so it is a LOWER BOUND");
    for (const total of ["3,852,241", "771,433", "3,637,118", "742,961"]) expect(sec).not.toContain(total);
    expect(sec).toContain("pypi `meok-.github-profile` (labelled meok) — http 404. Its value is null, never 0.");
    expect(sec).toContain("A download is distribution. It is not adoption");
    expect(sec).toContain("The census declares itself out of date after 2026-11-18T04:40:31Z (stale_after);");
  });

  it("prints no figure unless CSOAI's two windows are readable and dated like the census", async () => {
    const { distributionRead, distributionSection } = await producer();
    const broken: [string, (d: any) => void][] = [
      ["wrong schema", (d) => { d.schema = "csoai.distribution/0.0"; }],
      ["unreadable account window", (d) => { d.totals.downloads_all_time.value = "3.8 million"; }],
      ["account windows dated apart", (d) => { d.totals.downloads_30d.as_of = "2026-11-15T04:40:31Z"; }],
      ["no usable max_age_hours", (d) => { d.max_age_hours = 72; }],
      ["no CSOAI lifetime row", (d) => { delete d.by_entity.downloads_all_time.csoai; }],
      ["CSOAI 30-day row dated before the census", (d) => { d.by_entity.downloads_30d.csoai.as_of = "2026-11-15T04:40:31Z"; }],
      ["CSOAI row covering more than it attempted", (d) => { d.by_entity.downloads_30d.csoai.covered = 213; }],
      ["CSOAI row in an unknown state", (d) => { d.by_entity.downloads_all_time.csoai.state = "UNMEASURED"; }],
    ];
    for (const [name, breakIt] of broken) {
      const d = census();
      breakIt(d);
      expect(distributionRead(d).reason, name).toBeTruthy();
      const sec = distributionSection(d);
      expect(figureLines(sec), `${name}: no figure may be printed`).toEqual([]);
      expect(sec, name).toContain("- No download figure is printed from this census:");
      expect(sec, name).toContain("Nothing is substituted for it");
    }
  });

  it("drops only MEOK AI Labs' figures when MEOK's rows fail, and says so", async () => {
    const { distributionSection } = await producer();
    const d = census();
    d.by_entity.downloads_30d.meok.value = null;
    const sec = distributionSection(d);
    expect(figureLines(sec).map((l) => l.slice(0, 16))).toEqual(["- CSOAI packages", "- CSOAI packages"]);
    expect(sec).toContain("- MEOK AI Labs' figures are not printed:");
    expect(sec).not.toContain("2,746,597");
  });

  it("prints a PARTIAL CSOAI row as a lower bound", async () => {
    const { distributionSection } = await producer();
    const d = census();
    d.by_entity.downloads_30d.csoai = row(514000, 211, 212, "PARTIAL");
    const recent = figureLines(distributionSection(d))[1];
    expect(recent).toContain("514,000 gross downloads — state PARTIAL, 211 of 212 counters answered, so it is a LOWER BOUND over those, never a total over all of them.");
  });

  it("gives the llms.txt lead CSOAI's own figure only, a PARTIAL one as a lower bound, an unreadable census none", async () => {
    const { distributionLead } = await producer();
    const lead = distributionLead(census());
    expect(lead).toContain("CSOAI's own packages show 890,521 gross downloads since first release (state READ, 212 of 212 counters answered, as_of 2026-11-16T04:40:31Z;");
    for (const other of ["2,746,597", "228,554", "3,852,241", "771,433", "3,637,118"]) expect(lead).not.toContain(other);
    expect(lead).toContain("A download is distribution, not adoption, and MEOK AI Labs is counted on its own line below and never added.");
    const partial = census();
    partial.by_entity.downloads_all_time.csoai = row(890000, 211, 212, "PARTIAL");
    expect(distributionLead(partial)).toContain("890,000 gross downloads since first release (state PARTIAL, 211 of 212 counters answered, so it is a LOWER BOUND");
    const broken = census();
    broken.schema = "csoai.distribution/0.0";
    expect(distributionLead(broken)).toMatch(/^Distribution: no download figure is printed from the census \(its schema is not csoai\.distribution\/0\.1;/);
    expect(distributionLead(broken)).not.toMatch(/\d{1,3}(?:,\d{3})+/);
  });
});

describe("the lead of llms.txt states distribution by the section's rule (21 Nov 2026)", () => {
  it("the published lead line is the producer's lead for the committed census, and nothing else", async () => {
    const { distributionLead, distributionRead } = await producer();
    const lead = distributionLead(dist);
    const head = R("public/llms.txt").split("\n## ")[0];
    expect(head.split("\n"), "the lead carries the distribution line once, as a summary line").toContain(`> ${lead}`);
    const read = distributionRead(dist);
    expect(read.reason).toBeUndefined();
    expect(lead).toContain(`${fmt(read.csoai.lifetime.value)} gross downloads since first release`);
    for (const key of WINDOWS) {
      expect(head, `the lead must not print MEOK AI Labs' ${key}`).not.toContain(fmt(dist.by_entity[key].meok.value));
      expect(head, `the lead must not print the account's ${key}`).not.toContain(fmt(dist.totals[key].value));
    }
    expect(R("scripts/llms/llms.txt.tmpl")).toContain("> {{DISTRIBUTION_LEAD}}\n");
  });
});
