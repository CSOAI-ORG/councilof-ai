import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { createPublicKey, verify } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { describe, expect, it } from "vitest";
import { PROVBENCH_SIGNED, PROVBENCH_HEADLINE } from "../data/provbenchSigned";

/**
 * One C2PA survival figure on the site: the signed ProvBench run.
 * 15 Sep 2026 the site said "17.14% watermark durability (18 of 105)", "0 of 20 assets" and
 * (in the signed file) "0 of 12 assets / 0 of 108 cells" for what readers took to be one result.
 */

const ROOT = resolve(__dirname, "../../..");
const PACK = join(ROOT, "public/packs/eu-article-50");
const signed = JSON.parse(readFileSync(join(PACK, "provbench.json"), "utf8"));
const body = readFileSync(join(PACK, "provbench.body"));
const sig = JSON.parse(readFileSync(join(PACK, "provbench.sig.json"), "utf8"));

type Truth = {
  nAssets: number;
  embeddedCells: number;
  ciUpperPct: number;
  cpUpperPct: number;
};

function pooled(config: string, check: string) {
  const row = signed.pooled_by_check.find((r: any) => r.config === config && r.check === check);
  if (!row) throw new Error(`signed file has no pooled row ${config}/${check}`);
  return row;
}

function deriveTruth(): Truth {
  const b = pooled("embedded_only", "binding_intact");
  return {
    nAssets: b.n_assets,
    embeddedCells: b.n_measured,
    ciUpperPct: b.ci_clustered[1] * 100,
    cpUpperPct: b.cp_upper_one_sided_95 * 100,
  };
}

const CONTEXT = /provbench|c2pa|provenance|marking|article[\s-]*50|art\.?\s*50/i;
const HISTORICAL = (w: string) =>
  /unsigned/i.test(w) && /(?:29|30)(?:–30)?\s+July\s+2026|2026-07-(?:29|30)/i.test(w);

/** Returns one message per C2PA survival figure that disagrees with the signed run. */
export function findProvbenchViolations(text: string, file: string, t: Truth): string[] {
  const out: string[] = [];
  const near = (i: number, n = 350) => text.slice(Math.max(0, i - n), i + n);
  const flag = (i: number, what: string, allowHistorical: boolean) => {
    const w = near(i);
    if (!CONTEXT.test(w)) return;
    if (allowHistorical && HISTORICAL(w)) return;
    out.push(`${file}@${i}: ${what}`);
  };
  const close = (a: number, b: number) => Math.abs(a - b) <= 0.06;

  for (const m of text.matchAll(/watermark durability/gi)) {
    // the signed run tested no watermark; this label is never right for it
    out.push(`${file}@${m.index}: "watermark durability"`);
  }
  for (const m of text.matchAll(/\b17\.14\b|\b18\s*(?:of|\/)\s*105\b/g)) {
    flag(m.index!, `unsigned preprint figure "${m[0]}" without its label`, true);
  }
  for (const m of text.matchAll(/\b(\d+)\s*(?:of|\/)\s*(\d+)\s+(?:[A-Za-z0-9]+\s+){0,2}(?:assets?|markings?)\b/gi)) {
    const [num, den] = [Number(m[1]), Number(m[2])];
    const ok = (num === 0 && den === t.nAssets) || (num === 0 && den === t.embeddedCells) || (num === den && den === t.embeddedCells);
    if (!ok) flag(m.index!, `"${m[0]}" is not ${0} of ${t.nAssets} assets or of ${t.embeddedCells} cells`, true);
  }
  for (const m of text.matchAll(/\b(\d+)\s*(?:of|\/)\s*(\d+)\s+(?:measured\s+cells|marking\s+checks|cells)\b/gi)) {
    const [num, den] = [Number(m[1]), Number(m[2])];
    const ok = den === t.embeddedCells && (num === 0 || num === den);
    if (!ok) flag(m.index!, `"${m[0]}" is not of ${t.embeddedCells} cells`, true);
  }
  for (const m of text.matchAll(/(?:upper\s+bound|CP\s+upper|Clopper[–-]Pearson)[^.%\d]{0,40}?(\d+(?:\.\d+)?)\s*%/gi)) {
    if (!close(Number(m[1]), t.cpUpperPct)) flag(m.index!, `upper bound ${m[1]}% is not ${t.cpUpperPct.toFixed(1)}%`, true);
  }
  for (const m of text.matchAll(/\[\s*0(?:\.0+)?\s*%?\s*,\s*(\d+(?:\.\d+)?)\s*%\s*\]/g)) {
    if (!close(Number(m[1]), t.ciUpperPct)) flag(m.index!, `interval upper ${m[1]}% is not ${t.ciUpperPct}%`, true);
  }
  return out;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, acc);
    else if (/\.(tsx?|mjs|js|html|json)$/.test(name) && !/\.test\.|\.spec\./.test(name)) acc.push(p);
  }
  return acc;
}

describe("ProvBench: one signed C2PA survival figure", () => {
  const truth = deriveTruth();

  it("failing controls: the scanner catches each defect that shipped", () => {
    const bad = [
      "Measured finding · C2PA · 17.14% watermark durability (18 of 105 marking checks survived)",
      "ProvBench: 0 of 20 assets survived →",
      "Article 50 marking: 0 of 20 assets survived (0 of 180 measured cells), one-sided 95% Clopper–Pearson upper bound 13.9%",
      "ProvBench provenance · measured: 0 / 108 survive any transform · CI [0.0%, 16.1%]",
      "provenance: 0/20 C2PA markings survive binding-intact",
    ];
    for (const s of bad) expect(findProvbenchViolations(s, "control", truth).length, s).toBeGreaterThan(0);
  });

  it("passing controls: the signed figures and a labelled earlier run are allowed", () => {
    const good = [
      `ProvBench signed run: ${PROVBENCH_HEADLINE}; one-sided 95% Clopper–Pearson upper bound 22.1%, CI [0.0%, 24.25%].`,
      "Zero of 108 provenance markings survived: 0 of 108 provenance markings survived.",
      "ProvBench earlier unsigned 20-asset run (29–30 July 2026): 0 of 20 assets survived (0 of 180 measured cells), upper bound 13.9%.",
      "The unsigned preprint run of 30 July 2026 reported 18 of 105 cells for C2PA.",
      "3 of 4 axes are measured and 385 cells are live", // no provenance context
    ];
    for (const s of good) expect(findProvbenchViolations(s, "control", truth), s).toEqual([]);
  });

  it("the signed file verifies and its body is the served JSON", () => {
    const der = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(sig.pubkey_b64, "base64")]);
    const key = createPublicKey({ key: der, format: "der", type: "spki" });
    expect(verify(null, body, key, Buffer.from(sig.sig_b64, "base64"))).toBe(true);
    const tampered = Buffer.from(body);
    tampered[20] ^= 1;
    expect(verify(null, tampered, key, Buffer.from(sig.sig_b64, "base64"))).toBe(false);
    // The served JSON equals the signed body except ONE field: #239 (2026-08-20) changed
    // environment.timestamp_authority from "rfc3161" to "none" in the served copy only, when
    // RFC-3161 claims were demoted to roadmap. The signed body was not re-signed. Pinned here so
    // any further drift fails; every survival figure comes from fields that still match.
    const { signature, ...served } = signed;
    const signedBody = JSON.parse(body.toString("utf8"));
    expect(signedBody.environment.timestamp_authority).toBe("rfc3161");
    expect(served.environment.timestamp_authority).toBe("none");
    const differing = Object.keys(signedBody).filter((k) => !isDeepStrictEqual(signedBody[k], served[k]));
    expect(differing).toEqual(["environment"]);
    expect({ ...served.environment, timestamp_authority: "rfc3161" }).toEqual(signedBody.environment);
    expect(Object.keys(served).sort()).toEqual(Object.keys(signedBody).sort());
    for (const k of ["n_assets_marked", "transforms", "checks", "configs", "cells", "pooled_by_check", "caveats", "generated"]) {
      expect(served[k], k).toEqual(signedBody[k]);
    }
    expect(signature.sig).toBe(sig.sig_b64);
  });

  it("PROVBENCH_SIGNED equals the signed bytes", () => {
    const b = pooled("embedded_only", "binding_intact");
    const disclosure = pooled("sidecar_oracle", "manifest_present");
    const sidecarBinding = pooled("sidecar_oracle", "binding_intact");
    expect(PROVBENCH_SIGNED.nAssets).toBe(signed.n_assets_marked);
    expect(PROVBENCH_SIGNED.nAssets).toBe(b.n_assets);
    expect(PROVBENCH_SIGNED.generated).toBe(signed.generated.replace(/\.\d+\+00:00$/, "Z"));
    expect(PROVBENCH_SIGNED.embedded).toEqual({ survived: b.survived, cells: b.n_measured, assetsSurviving: b.assets_fully_surviving });
    for (const check of signed.checks) {
      const r = pooled("embedded_only", check);
      expect([r.survived, r.n_measured], `embedded ${check}`).toEqual([b.survived, b.n_measured]);
    }
    expect(PROVBENCH_SIGNED.sidecarDisclosure).toEqual({ survived: disclosure.survived, cells: disclosure.n_measured });
    expect(PROVBENCH_SIGNED.sidecarBinding).toEqual({ survived: sidecarBinding.survived, cells: sidecarBinding.n_measured });
    expect(PROVBENCH_SIGNED.ciClusteredPct.map((x) => x / 100)).toEqual(b.ci_clustered);
    expect(PROVBENCH_SIGNED.cpUpperOneSidedPct / 100).toBeCloseTo(b.cp_upper_one_sided_95, 4);
    const measured = signed.cells.filter(
      (c: any) => c.config === "embedded_only" && c.check === "binding_intact" && c.transform !== "identity" && c.n_measured > 0,
    );
    expect(PROVBENCH_SIGNED.transformsMeasured).toBe(measured.length);
    expect(Object.keys(signed.unmeasured_reasons)).toEqual([PROVBENCH_SIGNED.unmeasuredTransform]);
    expect(signed.caveats.join(" ")).toMatch(/No soft binding \(watermark\)/);
  });

  it("no page, data file or function quotes a C2PA survival figure the signed run does not support", () => {
    const files = [...walk(join(ROOT, "client/src")), ...walk(join(ROOT, "functions"))];
    expect(files.length).toBeGreaterThan(100);
    const violations = files.flatMap((f) => findProvbenchViolations(readFileSync(f, "utf8"), relative(ROOT, f), truth));
    expect(violations).toEqual([]);
  });
});
