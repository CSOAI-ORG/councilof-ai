// Vocabulary gate for the provable-archive prose and code (owner brief, 2 Sep 2026):
// never "oracle", "risk", "safe", "compliant", "rating" in anything that ships or is
// drafted for sending; never MEASURED on a leaf; the honesty line about legal
// presumption must be present in the method doc; the drafts must be marked HOLD.
//
// The brand-gate and facts-gate scan RENDERED HTML; these markdown files never
// render, so this is the gate that reads them.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const FORBIDDEN = /\b(oracle|oracles|risk|risks|risky|safe|unsafe|compliant|non-compliant|rating|ratings)\b/i;
const MEASURED_CLAIM = /(?<!UN)(?<!never )(?<!Not )(?<!not )MEASURED/;

const PROSE = [
  "docs/PROVABLE-ARCHIVE-METHOD.md",
  "docs/drafts/arbitrum-questbook-risk-evidence-tool.md",
  "docs/drafts/governance-post-signed-analysis.md",
];
const CODE = [
  "scripts/adapters/evm_permissions.py",
  "scripts/adapters/evm_permission_events.py",
  "scripts/build_archive_index.py",
  "client/src/components/DashboardArchivePane.tsx",
];

// Words that legitimately contain a forbidden token as a substring are not hits
// (\b handles "risky" vs "risk" only if listed; "safeguard" and "unsafe" are checked
// explicitly). The file NAME of the Questbook draft is owner-specified and is not prose.
function hits(text: string): string[] {
  const out = new Set<string>();
  for (const m of text.matchAll(new RegExp(FORBIDDEN.source, "gi"))) out.add(m[0].toLowerCase());
  return [...out].sort();
}

describe("provable-archive vocabulary", () => {
  for (const rel of PROSE) {
    it(`${rel}: no forbidden words, no MEASURED claim`, () => {
      const text = readFileSync(path.join(ROOT, rel), "utf8");
      expect(hits(text)).toEqual([]);
      expect(MEASURED_CLAIM.test(text.replace(/never (?:carry |stamp |use )?MEASURED/g, ""))).toBe(false);
    });
  }
  for (const rel of CODE) {
    it(`${rel}: no forbidden words in strings, comments or identifiers`, () => {
      const text = readFileSync(path.join(ROOT, rel), "utf8");
      // The vocabulary-rule sentence itself quotes the words it bans; strip that one line.
      const stripped = text
        .split("\n")
        .filter((l) => !/vocabulary rule|never "oracle"|FORBIDDEN|forbidden|never use the words/i.test(l))
        .join("\n");
      expect(hits(stripped)).toEqual([]);
    });
  }

  it("method doc carries the honesty line and names the comparators without claiming them", () => {
    const text = readFileSync(path.join(ROOT, "docs/PROVABLE-ARCHIVE-METHOD.md"), "utf8");
    expect(text).toMatch(/no legal presumption/i);
    expect(text).toMatch(/RFC 3161/);
    expect(text).toMatch(/eIDAS/);
    expect(text).toMatch(/qualified trust service provider/i);
    expect(text).toMatch(/partner step/i);
    expect(text).toMatch(/not for use in or as a financial instrument/i);
    expect(text).toMatch(/no composite, index, or\s+continuous reference series/i);
    expect(text).toMatch(/BUIDL is issued\s+by Securitize on Ethereum/);
    expect(text).toMatch(/BENJI\/FOBXX is Stellar-primary/);
    expect(text).toMatch(/EIP-1186/);
  });

  it("drafts are HOLD — not sent, not posted", () => {
    for (const rel of PROSE.filter((p) => p.includes("/drafts/"))) {
      const text = readFileSync(path.join(ROOT, rel), "utf8");
      expect(text.slice(0, 400)).toMatch(/HOLD/);
      expect(text.slice(0, 600)).toMatch(/not (?:yet )?(?:sent|posted|submitted)/i);
    }
  });

  it("Questbook draft names KYB and frames an open evidence tool", () => {
    const text = readFileSync(path.join(ROOT, "docs/drafts/arbitrum-questbook-risk-evidence-tool.md"), "utf8");
    expect(text).toMatch(/KYB/);
    expect(text).toMatch(/Apache-2\.0/);
    expect(text).toMatch(/evidence/i);
    expect(text).not.toMatch(/\bwe certify\b|\bget certified\b/i);
  });

  it("governance post is facts-only and links the method", () => {
    const text = readFileSync(path.join(ROOT, "docs/drafts/governance-post-signed-analysis.md"), "utf8");
    expect(text).toMatch(/PROVABLE-ARCHIVE-METHOD\.md/);
    expect(text).toMatch(/block \d+|block N|at block/i);
    expect(text).not.toMatch(/\b(should|must) (?:sell|buy|hold)\b/i);
    expect(text).not.toMatch(/\bcertif(?:y|ied|ication)\b/i);
  });
});
