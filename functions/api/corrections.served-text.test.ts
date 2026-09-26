/**
 * corrections.served-text.test.ts — the brand gate's internal-identifier rules over the JSON that
 * GET /api/corrections SERVES (C-2026-0926-01).
 *
 * WHY. /corrections is rendered in the browser from this Function, so scripts/brand-gate.mjs (which
 * scans prerendered HTML and static JSON) never saw its text. On 2026-09-26 a literal internal
 * hostname shipped that way. This test reads the same RULES the gate uses (out of scripts/brand-gate.mjs)
 * and applies the IDENTIFIER class to every string in the served body, at any depth.
 *
 * SCOPE, STATED. The quotation class (pricing_leak, gpai_code_signature, measured_index_sticker, ...)
 * is deliberately NOT applied here: a dated correction record quotes the wrong thing it corrects
 * ("$0.005/card", a retracted sticker) and must keep doing so. Internal identifiers are different:
 * the ledger's own REDACTION RULE says describe them, never reproduce them.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { onRequestGet } from "./corrections";

// RULES are read out of scripts/brand-gate.mjs itself (the same slice-and-evaluate the outward gate uses),
// so there is one list and no copy of it.
function loadRules(): unknown[] {
  const src = readFileSync(new URL("../../scripts/brand-gate.mjs", import.meta.url), "utf8");
  const a = src.indexOf("const RULES = [");
  const b = src.indexOf("\n];", a);
  if (a < 0 || b < 0) throw new Error("scripts/brand-gate.mjs: RULES not found; the guard fails closed");
  // eslint-disable-next-line no-new-func
  return new Function(`return ${src.slice(a + "const RULES = ".length, b + 2)}`)() as unknown[];
}
const RULES = loadRules();

const IDENTIFIER_RULES = ["internal_codenames", "internal_strategy_codename", "infra_leak"];

type Rule = { id: string; pattern: RegExp; nearAllow?: RegExp };

function strings(node: unknown, at = "$", out: [string, string][] = []): [string, string][] {
  if (typeof node === "string") out.push([at, node]);
  else if (Array.isArray(node)) node.forEach((v, i) => strings(v, `${at}[${i}]`, out));
  else if (node && typeof node === "object") for (const [k, v] of Object.entries(node)) strings(v, `${at}.${k}`, out);
  return out;
}

export function identifierHits(body: unknown, rules: Rule[]): string[] {
  const hits: string[] = [];
  for (const [at, text] of strings(body)) {
    for (const r of rules) {
      const re = new RegExp(r.pattern.source, "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        const ctx = text.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90);
        if (r.nearAllow && r.nearAllow.test(ctx)) continue;
        hits.push(`${at} [${r.id}] "${m[0]}"`);
      }
    }
  }
  return hits;
}

const rules = (RULES as Rule[]).filter((r) => IDENTIFIER_RULES.includes(r.id));

describe("GET /api/corrections serves no internal identifier", () => {
  it("the rule set is the gate's own, and not empty", () => {
    expect(rules.map((r) => r.id).sort()).toEqual([...IDENTIFIER_RULES].sort());
  });

  it("every served string is clean of the identifier class", async () => {
    const res = await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({});
    const body = await res.json();
    expect(strings(body).length).toBeGreaterThan(500); // the walk has its subject
    expect(identifierHits(body, rules)).toEqual([]);
  });

  it("can go red: a planted hostname and codename are caught at depth", () => {
    const planted = { corrections: [{ what_was_wrong: "read on oracle-micro-2 at localhost:4400" }, { note: ["the sov33 fine-tune"] }] };
    const hits = identifierHits(planted, rules);
    expect(hits.join("\n")).toContain("infra_leak");
    expect(hits.join("\n")).toContain("internal_codenames");
  });

  it("the superseding entry names what it superseded, and the superseded entry points back", async () => {
    const body = (await (await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({})).json()) as {
      corrections: { id: string; text_superseded_by?: string; supersedes_text?: { id: string; original_sha256: string } }[];
    };
    const sup = body.corrections.find((c) => c.id === "C-2026-0926-01");
    const old = body.corrections.find((c) => c.id === "C-2026-0925-01");
    expect(sup?.supersedes_text?.id).toBe("C-2026-0925-01");
    expect(sup?.supersedes_text?.original_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(old?.text_superseded_by).toBe("C-2026-0926-01");
  });
});
