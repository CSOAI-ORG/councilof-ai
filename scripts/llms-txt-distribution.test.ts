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
// The Hugging Face datasets our own services read (24 Nov 2026): CSOAI's figures leave them out and
// they get their own line. Expected figures are summed here from the census's own package rows.
const SELF_READ: string[] = JSON.parse(R("client/src/data/hf-self-read-ids.json"));
type Pkg = { registry?: string; name?: string; entity?: string; [w: string]: unknown };
const isSelf = (p: Pkg) => p.registry === "huggingface" && SELF_READ.includes(p.name as string);
const sumOf = (rows: Pkg[], w: string) => rows.reduce((a, p) => a + (typeof p[w] === "number" ? (p[w] as number) : 0), 0);
const csoaiRows = (d: { packages: Pkg[] }) => d.packages.filter((p) => p.entity === "csoai");

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

  it("its first two figures are CSOAI's package rows without the datasets our own services read", async () => {
    const read = (await producer()).distributionRead(dist);
    expect(read.reason, "the committed census is readable by the producer's rule").toBeUndefined();
    const rows = csoaiRows(dist);
    for (const [key, which] of [["downloads_all_time", "lifetime"], ["downloads_30d", "recent"]] as const) {
      expect(read.csoai[which].value, key).toBe(sumOf(rows.filter((p) => !isSelf(p)), key));
      expect(read.selfRead[which].value, key).toBe(sumOf(rows.filter(isSelf), key));
      // The two parts add back up to by_entity's CSOAI pair, which is never printed as CSOAI's figure.
      expect(read.csoai[which].value + read.selfRead[which].value).toBe(dist.by_entity[key].csoai.value);
    }
    for (const f of files) {
      const lines = figureLines(section(R(f)));
      const [lifetime, recent] = lines;
      for (const [line, row] of [[lifetime, read.csoai.lifetime], [recent, read.csoai.recent]] as const) {
        expect(line, `${f}: the section must head with CSOAI's figures`).toMatch(/^- CSOAI packages, /);
        expect(line).toContain(`${fmt(row.value)} gross downloads`);
        expect(line).toContain(`state ${row.state}, ${fmt(row.covered)} of ${fmt(row.attempted)} counters answered`);
        expect(line).toContain(`as_of ${dist.as_of}`);
        if (row.state === "PARTIAL") expect(line).toContain("LOWER BOUND");
      }
      expect(lifetime).toContain("since first release");
      expect(recent).toContain("in the last 30 days");
      expect(lines[2], `${f}: the datasets our own services read get their own line`).toMatch(/^- The \d+ Hugging Face datasets our own services read are counted on their own and never added to CSOAI's figures/);
      for (const row of [read.selfRead.lifetime, read.selfRead.recent]) expect(lines[2]).toContain(`${fmt(row.value)} `);
      for (const key of WINDOWS) expect(section(R(f)), `${f}: CSOAI's figure with our own reads inside it`).not.toContain(fmt(dist.by_entity[key].csoai.value));
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
  // CSOAI's rows: the ten self-read datasets and 202 others, with by_entity's pair rolled up from them.
  const csoaiPackages = () => [
    ...SELF_READ.map((name, i) => ({ registry: "huggingface", name, entity: "csoai", downloads_30d: 1000 + i, downloads_all_time: 2000 + i })),
    ...Array.from({ length: 202 }, (_, i) => ({ registry: i < 24 ? "pypi" : "huggingface", name: `csoai-row-${i}`, entity: "csoai", downloads_30d: 100 + i, downloads_all_time: 300 + i })),
  ];
  const rollUp = (rows: Pkg[], w: string) => row(sumOf(rows, w), rows.filter((p) => typeof p[w] === "number").length, rows.length);
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
      downloads_30d: { meok: row(228554, 317, 318, "PARTIAL"), csoai: rollUp(csoaiPackages(), "downloads_30d"), joint: row(14346, 32, 32), unattributed: row(14126, 347, 347) },
      downloads_all_time: { meok: row(2746597, 317, 318, "PARTIAL"), csoai: rollUp(csoaiPackages(), "downloads_all_time"), joint: row(72056, 32, 32), unattributed: row(143067, 347, 347) },
    },
    packages: [
      ...csoaiPackages(),
      { registry: "pypi", name: "meok-.github-profile", entity: "meok", downloads_30d: null, downloads_all_time: null, reason: "http 404" },
    ],
  });

  it("heads with CSOAI without the datasets our own services read, gives those and MEOK AI Labs a line each, and prints no total of the account", async () => {
    const d = census();
    const sec = (await producer()).distributionSection(d);
    const lines = figureLines(sec);
    const rows = csoaiRows(d);
    const others = rows.filter((p) => !isSelf(p));
    const own = rows.filter(isSelf);
    expect(lines[0]).toBe(`- CSOAI packages, without the 10 datasets our own services read, since first release (cumulative): ${fmt(sumOf(others, "downloads_all_time"))} gross downloads — state READ, ${others.length} of ${others.length} counters answered. Window: cumulative, all time. as_of ${asOf}.`);
    expect(lines[1]).toBe(`- CSOAI packages, without the 10 datasets our own services read, in the last 30 days: ${fmt(sumOf(others, "downloads_30d"))} gross downloads — state READ, ${others.length} of ${others.length} counters answered. Window: last 30 days, each registry over its own 30-day window. as_of ${asOf}.`);
    expect(lines[2]).toContain(`${fmt(sumOf(own, "downloads_all_time"))} gross downloads since first release — state READ, 10 of 10 counters answered; ${fmt(sumOf(own, "downloads_30d"))} in the last 30 days`);
    for (const w of WINDOWS) expect(sec, "CSOAI's figure with our own reads inside it").not.toContain(fmt(d.by_entity[w].csoai.value));
    expect(lines[3]).toContain("MEOK AI Labs, a separate entity publishing from the same account, is counted on its own and never added to CSOAI's figures: 2,746,597 gross downloads since first release — state PARTIAL, 317 of 318 counters answered, so it is a LOWER BOUND");
    expect(lines[3]).toContain("228,554 in the last 30 days — state PARTIAL, 317 of 318 counters answered, so it is a LOWER BOUND");
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
      ["CSOAI package rows one download off by_entity's pair", (d) => { d.packages[0].downloads_30d += 1; }],
      ["no package rows to take our own reads out of", (d) => { d.packages = d.packages.filter((p: Pkg) => p.entity !== "csoai"); }],
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
    expect(figureLines(sec).map((l) => l.slice(0, 16))).toEqual(["- CSOAI packages", "- CSOAI packages", "- The 10 Hugging"]);
    expect(sec).toContain("- MEOK AI Labs' figures are not printed:");
    expect(sec).not.toContain("2,746,597");
  });

  it("prints a PARTIAL CSOAI row as a lower bound, as the census does", async () => {
    const { distributionSection } = await producer();
    const d = census();
    // One of CSOAI's other rows did not answer in the 30-day window, and by_entity says so.
    d.packages[10].downloads_30d = null;
    d.by_entity.downloads_30d.csoai = rollUp(csoaiRows(d), "downloads_30d");
    d.by_entity.downloads_30d.csoai.state = "PARTIAL";
    const others = csoaiRows(d).filter((p) => !isSelf(p));
    const recent = figureLines(distributionSection(d))[1];
    expect(recent).toContain(`${fmt(sumOf(others, "downloads_30d"))} gross downloads — state PARTIAL, ${others.length - 1} of ${others.length} counters answered, so it is a LOWER BOUND over those, never a total over all of them.`);
  });
});
