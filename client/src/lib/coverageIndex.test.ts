import { createHash, createPublicKey, verify } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkProductsChromeNoSov } from "../../../scripts/content-promise-gate.mjs";
import { HEALTH_FACTS } from "./healthInventory";
import { OPENINGS } from "./permissionlessRevenue";
import { FILL_ROWS } from "./productFill";

/**
 * Coverage index public name (12 Oct 2026, public-names lock). /products linked the signed coverage
 * index as /signals/sov-signal.signed.json. The same signed bytes are now also committed at
 * /signals/coverage-index.signed.json and chrome links that path; the old path stays served, so
 * existing verifiers keep working. The envelope is NOT edited or re-signed: its Ed25519 signature is
 * over content_id (sha256 of the canonical body), not over a URL, so both copies verify the same.
 * The body still names its schema "csoai.sov-signal-index/1"; that is signed data, left as is.
 */
const SIGNALS = resolve(__dirname, "../../../public/signals");
const OLD = readFileSync(`${SIGNALS}/sov-signal.signed.json`);
const NEW = readFileSync(`${SIGNALS}/coverage-index.signed.json`);

/** Python json.dumps(sort_keys=True, separators=(",", ":"), ensure_ascii=False), as emit_sov_signal.py signs. */
function canon(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

function verifyEnvelope(bytes: Buffer): { cidOk: boolean; sigOk: boolean } {
  const d = JSON.parse(bytes.toString("utf8"));
  const { content_id, signature, ...body } = d;
  const cid = createHash("sha256").update(canon(body)).digest("hex");
  const key = createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(signature.pubkey, "base64")]),
    format: "der",
    type: "spki",
  });
  return { cidOk: cid === content_id && cid === signature.content_id, sigOk: verify(null, Buffer.from(content_id), key, Buffer.from(signature.sig, "base64")) };
}

describe("coverage index: public name, same signed bytes", () => {
  it("the public-name copy is byte-identical to the original envelope", () => {
    expect(NEW.equals(OLD)).toBe(true);
  });

  it("both copies verify: content_id recomputes and the Ed25519 signature holds", () => {
    expect(verifyEnvelope(OLD)).toEqual({ cidOk: true, sigOk: true });
    expect(verifyEnvelope(NEW)).toEqual({ cidOk: true, sigOk: true });
  });

  it("a tampered body fails, so the check above is not vacuous", () => {
    const d = JSON.parse(NEW.toString("utf8"));
    d.measured_axes += 1;
    expect(verifyEnvelope(Buffer.from(JSON.stringify(d))).cidOk).toBe(false);
  });

  it("the signed body is left as signed (its schema still names sov-signal-index; data, not chrome)", () => {
    expect(JSON.parse(NEW.toString("utf8")).schema).toBe("csoai.sov-signal-index/1");
  });
});

describe("/products chrome names no sov-* path or label", () => {
  const SOV = /\bsov-[a-z0-9]/i;
  it("the /products coverage row links the public name and is labelled 'Coverage index'", () => {
    const row = FILL_ROWS.find((r) => r.id === "coverage-index");
    expect(row?.href).toBe("/signals/coverage-index.signed.json");
    expect(row?.title).toBe("Coverage index");
  });

  it("no /products fill row carries a sov-* path or label in any field", () => {
    for (const r of FILL_ROWS) for (const [k, v] of Object.entries(r)) if (typeof v === "string") expect(SOV.test(v), `${r.id}.${k}: ${v}`).toBe(false);
  });

  it("the other chrome links to the index use the public name too", () => {
    for (const f of HEALTH_FACTS) expect(SOV.test(f.href), f.id).toBe(false);
    for (const o of OPENINGS) expect(SOV.test(JSON.stringify(o)), o.id).toBe(false);
  });

  it("content-promise-gate check 9 is red on the /products row as served on 12 Oct 2026 and green on the fix", () => {
    const live = '<li data-testid="fill-row-coverage-index"><a href="/signals/sov-signal.signed.json">Coverage index</a></li>';
    const fixed = '<li data-testid="fill-row-coverage-index"><a href="/signals/coverage-index.signed.json">Coverage index</a></li>';
    expect(checkProductsChromeNoSov(live, "dist/client/products/index.html").length).toBe(1);
    expect(checkProductsChromeNoSov(fixed, "dist/client/products/index.html")).toEqual([]);
  });
});
