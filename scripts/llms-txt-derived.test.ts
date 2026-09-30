import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

/**
 * scripts/llms-txt.mjs opens "llms.txt / llms-full.txt — DERIVED, never typed", and it was right
 * about seven values and wrong about five. The template typed "11 tools ... seven free readers plus
 * four x402-metered evidence tools", and llms.txt is what AI crawlers read first — so a stale count
 * there propagates further than anywhere else we publish.
 *
 * The door's tool set changed twice this month: witness_hash quarantined on HTTP, then dropped from
 * the packaged manifest. Each change silently aged this file and nothing objected.
 */
const ROOT = resolve(__dirname, "..");
const R = (p: string) => readFileSync(resolve(ROOT, p), "utf8");
const J = (p: string) => JSON.parse(R(p));

const free = J("functions/mcp/gspc-tools.json").tools.length;
const paid = J("functions/mcp/paid-tools.json").tools.length;

describe("llms.txt derives the tool counts it publishes", () => {
  it("the template holds placeholders, not numbers", () => {
    const t = R("scripts/llms/llms.txt.tmpl");
    expect(t).toMatch(/\{\{MCP_TOOLS\}\}/);
    expect(t).toMatch(/\{\{MCP_FREE_WORD\}\}/);
    expect(t, "a typed tool count is a number nothing retires")
      .not.toMatch(/—\s*\d+ tools:\s*\w+ free readers/);
  });

  it("the producer names the source of those counts", () => {
    const s = R("scripts/llms-txt.mjs");
    expect(s).toMatch(/functions\/mcp\/gspc-tools\.json/);
    expect(s).toMatch(/functions\/mcp\/paid-tools\.json/);
  });

  it("the published file agrees with the door's own definition files", () => {
    const out = R("public/llms.txt");
    const m = out.match(/POST https:\/\/councilof\.ai\/mcp — (\d+) tools/);
    expect(m, "llms.txt no longer states a door tool count").toBeTruthy();
    expect(Number(m![1]), `door serves ${free}+${paid}`).toBe(free + paid);
  });

  it("the Smithery line points at the live door's derived tool contract and claims no mirror", () => {
    // Smithery's tools[] is its own snapshot; on 2026-09-28 csoai/gspc-mcp listed 12 names and
    // csoai/gspc 13 while tools/list served 16. The line must not claim a mirror it cannot keep.
    const out = R("public/llms.txt");
    const words = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
    const line = out.split("\n").find((l) => l.startsWith("- Smithery: "));
    expect(line, "llms.txt no longer carries a Smithery line").toBeTruthy();
    expect(line).not.toMatch(/mirrors/);
    expect(line).toMatch(new RegExp(
      `can lag the door[^\\n]+tools/list \\(${free + paid} tools: ${words[free]} free readers plus ${words[paid]} x402-metered evidence tools\\)`,
    ));
  });

  it("points at the live catalog-trust snapshot and does not freeze its counts", () => {
    const tmpl = R("scripts/llms/llms.txt.tmpl");
    const out = R("public/llms.txt");
    const url = "https://councilof.ai/interop/x402-trust/latest.json";
    expect(tmpl).toContain(url);
    expect(out).toContain(url);
    expect(tmpl, "template must not freeze the census pair").not.toMatch(/74\/100/);
    expect(out, "published llms.txt must not freeze the census pair").not.toMatch(/74\/100/);
  });

  it("does not pre-announce an unpublished package or registry version", () => {
    const out = R("public/llms.txt");
    const tmpl = R("scripts/llms/llms.txt.tmpl");
    expect(tmpl).toContain("Query https://registry.npmjs.org/csoai-gspc-mcp for the published version");
    expect(tmpl).toContain("Query the official registry for the currently published server version");
    expect(out).not.toMatch(/csoai-gspc-mcp@\d+\.\d+\.\d+/);
    expect(out).not.toMatch(/registry id io\.github\.CSOAI-ORG\/gspc server \*\*\d+/);
  });

});

/**
 * The per-axis sections. llms-full.txt used to type a "deep reference" block per axis with n frozen
 * in the template, and no block at all for the slot ADR-002 added; llms.txt listed axis NAMES but
 * no door that serves one axis's result. Both are now rendered from GET /api/gspc → axes[], so the
 * only offline check that means anything is self-consistency: the axis ids behind the row-door
 * lines in llms.txt must be exactly the ids in the board snapshot llms-full.txt took from the same
 * fetch. A missing or extra line here is a producer bug, not a board change.
 */
describe("llms.txt derives one row door per axis on the live board", () => {
  const snapshotAxes = (): string[] => {
    const full = R("public/llms-full.txt");
    // §2 now carries a sentence about why the copy's as_of is null before the fence, so match the
    // FIRST json fence after the heading rather than requiring the fence to touch it.
    const m = full.match(/## 2\. CURRENT BOARD SNAPSHOT[\s\S]*?```json\s*([\s\S]*?)```/);
    expect(m, "llms-full.txt carries the board snapshot").toBeTruthy();
    const snap = JSON.parse(m![1]);
    return (snap.axes as { axis: string }[]).map((a) => a.axis);
  };

  it("the templates hold the placeholders, and llms-full no longer types n per axis", () => {
    expect(R("scripts/llms/llms.txt.tmpl")).toMatch(/\{\{AXIS_DOORS_SECTION\}\}/);
    const full = R("scripts/llms/llms-full.txt.tmpl");
    expect(full).toMatch(/\{\{AXIS_DEEP_SECTION\}\}/);
    expect(full, "a typed n is a number nothing retires").not.toMatch(/^- n: \d+/m);
    expect(full, "a typed per-axis page URL is a list the board outgrows").not.toMatch(/^- page: https:/m);
  });

  it("the producer names GET /api/gspc axes[] as the source of both sections", () => {
    const s = R("scripts/llms-txt.mjs");
    expect(s).toMatch(/function axisDoorsSection\(b\)/);
    expect(s).toMatch(/function axisDeepSection\(b\)/);
    expect(s).toMatch(/\/api\/gspc\?axis=/);
  });

  it("row-door lines in llms.txt are exactly the axes in the llms-full snapshot", () => {
    const out = R("public/llms.txt");
    const section = out.match(/## Axis doors[\s\S]*?\n## /);
    expect(section, "llms.txt carries the Axis doors section").toBeTruthy();
    const lines = section![0].split("\n").filter((l) => l.startsWith("- ") && l.includes("?axis="));
    const ids = lines.map((l) => l.match(/\?axis=([a-z0-9-]+)/)![1]);
    expect(ids.sort()).toEqual([...snapshotAxes()].sort());
    for (const l of lines) {
      expect(l, "every door line names the per-axis page as the edge serves it (slashless; .html is a 308)").toMatch(/https:\/\/councilof\.ai\/axis\/[a-z0-9-]+( |$)/);
      expect(l, "every door line names what stands behind the row, or says the row carries nothing").toMatch(/bank https:|evidence https:|bank: none/);
    }
  });

  it("llms-full.txt carries one deep block per snapshot axis, each with the row door", () => {
    const full = R("public/llms-full.txt");
    for (const id of snapshotAxes()) {
      expect(full).toContain(`### ${id}\n`);
      expect(full).toContain(`- row: https://councilof.ai/api/gspc?axis=${id}`);
    }
  });

  it("no typed board count survives in the prose the template controls", () => {
    const t = R("scripts/llms/llms.txt.tmpl");
    expect(t).not.toMatch(/"22 measured"/);
    expect(t).not.toMatch(/Do not bump the board to 23/);
    expect(t, "the status of the newest slot is read from its row, never typed").not.toMatch(/effect-binding, a declared slot with no run behind it/);
  });
});

/**
 * MEASURED is not SEPARATED, and the documents that teach a model who we are are the last place
 * that distinction may blur. Across the board the live totals read zero separated leads, two ties
 * and twelve untested — so "N measured of N" means a run exists behind every slot and nothing more.
 * A reader who takes it to mean "N axes can tell models apart" has been misled by us, in the file
 * they read first. These tests hold the four separation fields beside the measured count, derived
 * from the same fetch, so the two can never be published apart.
 */
describe("llms.txt and llms-full.txt say what MEASURED means, and what it does not", () => {
  const files = ["public/llms.txt", "public/llms-full.txt"] as const;
  const tmpls = ["scripts/llms/llms.txt.tmpl", "scripts/llms/llms-full.txt.tmpl"] as const;

  it("both templates carry the separation placeholders, never typed separation counts", () => {
    for (const t of tmpls) {
      const src = R(t);
      for (const ph of ["{{SEPARATED_LEADS}}", "{{TIES}}", "{{UNTESTED_SEPARATIONS}}", "{{COMPARISON_AXES}}"]) {
        expect(src, `${t} must substitute ${ph}, not type it`).toContain(ph);
      }
      expect(src, "a typed separation count is a number nothing retires")
        .not.toMatch(/totals\.separated_leads`?\s*=\s*\d/);
    }
  });

  it("the producer names GET /api/gspc totals as the source of the separation fields", () => {
    const src = R("scripts/llms-txt.mjs");
    expect(src).toMatch(/SEPARATED_LEADS:\s*t\.separated_leads/);
    expect(src).toMatch(/TIES:\s*t\.ties/);
    expect(src).toMatch(/UNTESTED_SEPARATIONS:\s*t\.untested_separations/);
    expect(src).toMatch(/COMPARISON_AXES:\s*t\.comparison_axes/);
  });

  it("each published file states that measured does not mean the axis separates models", () => {
    for (const f of files) {
      const out = R(f);
      expect(out, `${f} must define MEASURED`).toMatch(/a run exists behind|a real run exists behind/i);
      expect(out, `${f} must deny the separation reading outright`)
        .toMatch(/does\s+NOT\s+mean\s+the\s+axis\s+has\s+been\s+shown\s+to\s+distinguish|not\s+a\s+claim\s+that\s+any\s+axis\s+can\s+tell/i);
      expect(out, `${f} must name all four live separation fields`).toContain("totals.separated_leads");
      expect(out).toContain("totals.untested_separations");
      expect(out).toContain("totals.comparison_axes");
      expect(out).toContain("totals.ties");
    }
  });

  it("neither file phrases the board as axes that separate or beat models", () => {
    for (const f of files) {
      const out = R(f);
      expect(out, `${f} must not claim separated leads in prose`)
        .not.toMatch(/\b\d+\s+axes?\s+(?:separate|separated|distinguish|rank)\b/i);
      expect(out, `${f} must not present the measured count as a win`)
        .not.toMatch(/\b\d+\s+axes?\s+(?:won|beat|outperform)/i);
    }
  });
});

/**
 * Distribution. A figure was published here that was a partial read presented as the whole estate:
 * a total with no denominator beside it. The fix is not a better number — it is that no number may
 * be printed without the state and coverage the artifact already records. Both sections derive from
 * the committed artifact, so a value that is not the artifact's cannot survive a regeneration; these
 * tests check the derivation offline and check that every figure still carries its denominator.
 */
describe("llms distribution and timestamp sections are derived, stated and bounded", () => {
  const dist = J("public/interop/distribution-latest.json");
  const ots = J("public/interop/ots/manifest.json");
  const files = ["public/llms.txt", "public/llms-full.txt"] as const;
  const fmt = (n: number) => Number(n).toLocaleString("en-US");

  it("the templates hold the section placeholders and type none of the figures", () => {
    for (const t of ["scripts/llms/llms.txt.tmpl", "scripts/llms/llms-full.txt.tmpl"] as const) {
      const src = R(t);
      expect(src).toContain("{{DISTRIBUTION_SECTION}}");
      expect(src).toContain("{{OTS_SECTION}}");
      expect(src, "a typed download figure is a number nothing retires")
        .not.toMatch(/[\d,]{6,}\s+downloads/);
    }
  });

  it("the producer derives both sections from artifacts on disk, not a second live fetch", () => {
    const src = R("scripts/llms-txt.mjs");
    expect(src).toMatch(/readJSON\("public\/interop\/distribution-latest\.json"\)/);
    expect(src).toMatch(/readJSON\("public\/interop\/ots\/manifest\.json"\)/);
  });

  it("every published download figure is the artifact's own value", () => {
    for (const f of files) {
      const out = R(f);
      expect(out, `${f} must print the artifact's 30-day total`).toContain(fmt(dist.totals.downloads_30d.value));
      expect(out, `${f} must print the artifact's cumulative total`).toContain(fmt(dist.totals.downloads_all_time.value));
      expect(out, `${f} must print the package population`).toContain(fmt(dist.packages.length));
    }
  });

  it("no download figure is printed without its state and its denominator", () => {
    for (const f of files) {
      const out = R(f);
      for (const key of ["downloads_30d", "downloads_all_time"] as const) {
        const row = dist.totals[key];
        const line = out.split("\n").find((l: string) => l.includes(fmt(row.value)) && l.includes("state"));
        expect(line, `${f}: ${key} is printed without a state`).toBeTruthy();
        expect(line, `${f}: ${key} is printed without covered/attempted`)
          .toContain(`${fmt(row.covered)} of ${fmt(row.attempted)}`);
        expect(line, `${f}: ${key} is printed without the artifact's as_of`).toContain(row.as_of);
      }
      expect(out, `${f} must say a PARTIAL total is a lower bound`).toMatch(/LOWER BOUND/);
    }
  });

  it("a counter that did not answer is named, and its value stays null rather than zero", () => {
    const silent = dist.packages.filter((p: { downloads_30d: number | null }) => p.downloads_30d === null);
    for (const f of files) {
      const out = R(f);
      for (const row of silent) {
        expect(out, `${f} must name the counter that did not answer`).toContain(row.name);
      }
      if (silent.length) expect(out).toMatch(/null,\s+never\s+0/);
    }
  });

  it("the timestamp section separates Bitcoin-attested from calendar-pending and carries its as_of", () => {
    for (const f of files) {
      const out = R(f);
      expect(out).toContain(fmt(ots.counts.proofs));
      expect(out).toContain(fmt(ots.counts.bitcoin_attested));
      expect(out).toContain(ots.as_of);
      expect(out, `${f} must say submitted is not anchored`).toMatch(/submitted.{0,20}not.{0,20}anchored|not\s+evidence\s+of\s+a\s+time/i);
    }
  });
});

describe("dated mill-card root timestamp state is tied to proof bytes", () => {
  it("the public machine guide never freezes the current proof as calendar-only", () => {
    const out = R("public/llms.txt");
    expect(out).not.toContain("Its .ots sidecar is a calendar receipt until Bitcoin verification succeeds");
    expect(out).toContain("not local Bitcoin full-node chain validation");
    expect(out).toContain("not local full-node chain validation or a certificate");
  });

  it("an audit claim is printed only for matching subject and proof digests", () => {
    const pointer = J("public/interop/card-root-latest.json");
    const url = pointer.root_url as string;
    const auditUrl = url.replace(/\.json$/, ".header-audit.json");
    const auditFile = resolve(ROOT, `public${auditUrl}`);
    if (!existsSync(auditFile)) return; // A new moving pointer may have no audited proof yet.
    const audit = J(`public${auditUrl}`);
    const digest = (p: string) => createHash("sha256").update(readFileSync(resolve(ROOT, p))).digest("hex");
    expect(audit.subject_sha256).toBe(digest(`public${url}`));
    expect(audit.dated_root_has_ed25519_envelope).toBe(false);
    expect(J(`public${url}`)).not.toHaveProperty("sig_ed25519");
    expect(audit.isolated_upgraded_proof_sha256).toBe(digest(`public${url}.ots`));
    const out = R("public/llms.txt");
    expect(out).toContain(`https://councilof.ai${auditUrl}`);
    expect(out).toContain(audit.isolated_upgraded_proof_sha256);
    expect(out).toContain("dated root JSON has no Ed25519 signature envelope");
    expect(out).toContain("public-header corroboration");
    expect(out).toContain("verification of individual card measurements");
  });
});

/**
 * The two defensive sentences. Both exist because a reader could otherwise infer a claim we have
 * never made: that our registry footprint is a vetting layer, and that we hold a place in the
 * statutory category that now exists around us. They are load-bearing prose, so they are tested.
 */
describe("llms.txt and llms-full.txt carry the two precision sentences", () => {
  const files = ["public/llms.txt", "public/llms-full.txt"] as const;

  it("we measure what we probe; we do not vet the registry", () => {
    for (const f of files) {
      const out = R(f);
      expect(out, `${f} must carry the vetting disclaimer`)
        .toMatch(/WE MEASURE WHAT WE PROBE;\s*WE DO NOT VET THE REGISTRY/);
      expect(out, `${f} must say what a listing is and is not`)
        .toMatch(/says a server is (?:REGISTERED|registered)/);
      expect(out, `${f} must not freeze a registry count`)
        .not.toMatch(/\b\d{3,}\s+(?:servers|listings)\s+(?:in|on)\s+the\s+(?:MCP\s+)?registry/i);
      expect(out, `${f} must point at the live footprint field`).toContain("registry_listings.value");
    }
  });

  it("we hold no certification under any statutory scheme, and never applied", () => {
    for (const f of files) {
      const out = R(f);
      expect(out, `${f} must disclaim every form of the designation`)
        .toMatch(/WE HOLD NO CERTIFICATION, DESIGNATION,\s*\n?REGISTRATION OR ACCREDITATION UNDER ANY SUCH SCHEME/);
      expect(out, `${f} must say we never applied`).toMatch(/NEVER APPLIED FOR ONE/);
      expect(out, `${f} must not claim to be an auditor under a statute`)
        .not.toMatch(/\bwe are (?:a |an )?(?:registered|designated|certified) (?:AI )?(?:auditor|verification organization)/i);
      expect(out, `${f} must cite the state's own source`)
        .toMatch(/leginfo\.legislature\.ca\.gov/);
    }
  });
});

/**
 * The claim boundary. A model that reads one paragraph of ours should read this one: it is the
 * whole of what we assert, and every clause in it is a thing we have been read as claiming and do
 * not. It is quoted verbatim into both files from one string in the template, so the two cannot
 * drift into saying different things about the same boundary.
 */
describe("both files open with one quotable claim boundary", () => {
  const files = ["public/llms.txt", "public/llms-full.txt"] as const;
  const clauses: [string, RegExp][] = [
    ["the registered identity", /CSOAI Ltd, a company registered in England and Wales, Companies\s*\n?House 16939677/],
    ["the machine identity", /did:web:csoai\.org/],
    ["measurement, never certification", /we do not certify, accredit, or issue conformity assessments/],
    ["a grade is never sold", /verification is free and a grade is never sold/],
    ["we measure what we probe", /We measure what we probe/],
    ["we vet no registry, ours included", /do not vet any registry, index, marketplace or directory, ours included/],
    ["we link third-party records rather than speak for them", /LINK that record and let it speak for itself/],
    ["a listing is not an endorsement", /is not an endorsement, not an accusation and not\s*\n?adoption/],
    ["no certification under any scheme, and none claimed", /never applied for one, and we claim none/],
    ["we assert no falsity about anyone", /We assert no\s*\n?falsity about anyone/],
    ["UNMEASURED stays first-class", /publish it as UNMEASURED/],
  ];

  it("the paragraph is one string in the producer, not two hand-kept copies", () => {
    const a = R("scripts/llms/llms.txt.tmpl");
    const b = R("scripts/llms/llms-full.txt.tmpl");
    const grab = (src: string) => src.match(/Council of AI is the public name of CSOAI Ltd[\s\S]*?stays empty\./)?.[0];
    expect(grab(a), "llms.txt.tmpl carries the boundary").toBeTruthy();
    expect(grab(b), "llms-full.txt.tmpl carries the boundary").toBeTruthy();
    expect(grab(a), "the two files must not drift into different boundaries").toBe(grab(b));
  });

  for (const [name, re] of clauses) {
    it(`states ${name}`, () => {
      for (const f of files) expect(R(f), `${f} is missing: ${name}`).toMatch(re);
    });
  }
});
