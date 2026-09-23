import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Guards for /alliance-map and the registry it renders.
 *
 * The defect these exist against is not a crash. It is a page that is true when written and
 * false when read: five evidence classes quietly collapsed into one count, a number typed into
 * the copy instead of derived, a logo appearing beside a state, or a word of motive creeping into
 * a record that is only allowed to say what two digests were.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const REGISTRY = join(ROOT, "public/claims/osaia-membership-2026-09-23.json");
const PAGE = join(ROOT, "client/src/pages/AllianceMap.tsx");

const registry = JSON.parse(readFileSync(REGISTRY, "utf8"));
const page = readFileSync(PAGE, "utf8");

const CLASSES = ["CORROBORATED", "ANNOUNCED", "REPORTED", "NOT_FOUND", "UNCHECKABLE"];
const STATES = ["CLAIM_CAPTURED", "CLAIM_MEASURED", "UNMEASURED", "UNCHECKABLE"];

/** Canonical JSON of spec §6.1: keys sorted, no insignificant whitespace, integers only. */
function canonical(value: unknown): string {
  const walk = (v: unknown): string => {
    if (v === null || typeof v === "boolean" || typeof v === "string") return JSON.stringify(v);
    if (typeof v === "number") {
      if (!Number.isInteger(v)) throw new Error(`non-integer ${v}`);
      return String(v);
    }
    if (Array.isArray(v)) return "[" + v.map(walk).join(",") + "]";
    const o = v as Record<string, unknown>;
    return "{" + Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => JSON.stringify(k) + ":" + walk(o[k])).join(",") + "}";
  };
  return walk(value);
}

describe("alliance map registry", () => {
  it("carries every organisation the founding announcement names, plus the maintainer's own row", () => {
    const named = registry.totals.organisations_named_in_the_founding_announcement;
    const ofTheNamed = registry.organisations.filter((r: { is_the_maintainer?: boolean }) => !r.is_the_maintainer);
    expect(ofTheNamed).toHaveLength(named);
    expect(registry.organisations.filter((r: { is_the_maintainer?: boolean }) => r.is_the_maintainer)).toHaveLength(1);
  });

  it("keeps the five evidence classes separate, and prints a class with no rows as zero", () => {
    const byClass = registry.totals.by_evidence_class;
    expect(Object.keys(byClass).sort()).toEqual([...CLASSES].sort());
    for (const c of CLASSES) {
      expect(typeof byClass[c], `${c} must be counted even when empty`).toBe("number");
      expect(byClass[c]).toBe(registry.organisations.filter((r: { evidence_class: string }) => r.evidence_class === c).length);
    }
    // The sum of the classes is the row count. It is NOT the sum of the specification states,
    // and the two must never be added: they count different things over different populations.
    expect(CLASSES.reduce((n, c) => n + byClass[c], 0)).toBe(registry.organisations.length);
  });

  it("uses exactly the four specification states on its artifacts and invents no fifth", () => {
    for (const a of registry.claims) expect(STATES).toContain(a.state);
    const byState = registry.totals.by_specification_state;
    expect(Object.keys(byState).sort()).toEqual([...STATES].sort());
    for (const s of STATES) {
      expect(byState[s]).toBe(registry.claims.filter((a: { state: string }) => a.state === s).length);
    }
  });

  it("gives every artifact a non-empty does_not_prove that denies falsity, and a conflict disclosure", () => {
    for (const a of registry.claims) {
      expect(a.does_not_prove.length, a.claim_id).toBeGreaterThan(0);
      expect(a.conflicts.join(" "), a.claim_id).toMatch(/member of the Open Secure AI Alliance/);
      if (a.state !== "CLAIM_MEASURED") {
        expect(a.does_not_prove.some((d: string) => /false/i.test(d)), a.claim_id).toBe(true);
      }
    }
  });

  it("asserts no falsity and uses no word of motive anywhere in the published bytes", () => {
    // spec §4.9 and §10.1. Checked over the whole document, not over a field we remembered to look at.
    const allegation =
      /\b(quietly|scrubbed|walked back|backtrack(?:ed|ing)?|buried|covered up|cover-?up|deceptive|deceit|fraud(?:ulent)?|dishonest|lying|exaggerat(?:ed|ing|ion)|overstat(?:ed|ing|ement)|red-?handed)\b/i;
    const bytes = readFileSync(REGISTRY, "utf8");
    const hit = bytes.match(allegation);
    expect(hit?.[0] ?? null).toBeNull();
    expect(page.match(allegation)?.[0] ?? null).toBeNull();
  });

  it("recomputes its own registry_digest from the bytes it publishes", () => {
    const { registry_digest, ...rest } = registry;
    expect(createHash("sha256").update(Buffer.from(canonical(rest), "utf8")).digest("hex")).toBe(registry_digest);
  });

  it("never describes a timestamp receipt as anchored (spec §8.1)", () => {
    expect(registry.timestamp_state).toMatch(/^SUBMITTED/);
    expect(readFileSync(REGISTRY, "utf8")).not.toMatch(/\banchored in (a )?block\b(?!;)/i);
  });

  it("identifies every CORROBORATED organisation by something more than a trading name (spec §5.7)", () => {
    for (const r of registry.organisations) {
      if (r.evidence_class !== "CORROBORATED") continue;
      expect(r.identifier, r.name_as_printed).toBeTruthy();
      expect(["domain", "url", "company-register", "lei", "did", "contract-address"]).toContain(r.identifier_kind);
    }
  });

  it("records the reason, not a verdict, for every row whose own surface we could not read", () => {
    for (const r of registry.organisations) {
      if (r.evidence_class !== "UNCHECKABLE") continue;
      expect(r.read_outcome, r.name_as_printed).toBeTruthy();
      expect(r.attempts?.length, r.name_as_printed).toBeGreaterThan(0);
      expect(r.says_it_itself, "an unread page is not a 'no'").toBeNull();
    }
  });
});

describe("alliance map page", () => {
  it("renders the registry and types no row and no count of its own", () => {
    expect(page).toMatch(/import registry from "\.\.\/\.\.\/\.\.\/public\/claims\/osaia-membership-2026-09-23\.json"/);
    // The header count must be the length of what is rendered, never a literal.
    expect(page).toMatch(/The map · \{rendered\.length\} of \{ROWS\.length\}/);
    expect(page).not.toMatch(/The map · \d/);
  });

  it("shows no logo or image for any organisation — names are text", () => {
    expect(page).not.toMatch(/<img\b/);
    expect(page).not.toMatch(/backgroundImage|logo\.(png|svg|jpg)/i);
  });

  it("carries a legend case for every class the registry uses, so no row renders as a bare fallback", () => {
    const used = [...new Set(registry.organisations.map((r: { evidence_class: string }) => r.evidence_class))] as string[];
    for (const c of used) expect(page).toMatch(new RegExp(`^\\s{2}${c}:\\s*\\{`, "m"));
  });

  it("says in our own voice that we are a member, on private evidence, and that it is not endorsement", () => {
    expect(page).toMatch(/member of the Open Secure AI Alliance and of the Linux Foundation, both since 21 September 2026/);
    expect(page).toMatch(/private evidence/);
    expect(page).toMatch(/Membership is not endorsement/);
  });

  it("never implies the alliance has reviewed, approved or seen the page", () => {
    expect(registry.this_is_not_a_member_list.not_reviewed_by_the_alliance).toMatch(
      /has not seen, reviewed or approved/,
    );
    expect(page).toMatch(/not_reviewed_by_the_alliance/);
  });
});
