/**
 * The corrections ledger names who answers for it and how to object, without touching the signed
 * bytes or the signed rule that describes them.
 *
 * Outward gate, 2026-10-07: the NPL supplement cites GET /api/corrections, and the gate found no
 * plain address and no objection route on it. The facts now ride in `note`, one of the six
 * unsigned wrapper keys the signed attestation already names. These tests hold three things:
 *   1. the served body carries the address, the route and the entity;
 *   2. no top-level key appears beyond the ledger's own and the six the signed rule strips,
 *      so the signed content_id_rule still describes exactly what is served;
 *   3. the served JSON, re-checked as a third party would, still reads VALID.
 */
import { describe, expect, it } from "vitest";
import { LEDGER, checkSignature, onRequestGet } from "./corrections";

const serve = async () =>
  (await (onRequestGet as unknown as () => Promise<Response>)()).json() as Promise<Record<string, unknown>>;

describe("GET /api/corrections: accountability without a new signed-rule key", () => {
  it("states the contact address, the objection route and the accountable entity", async () => {
    const body = await serve();
    const note = String(body.note);
    expect(note).toContain("nicholas@csoai.org");
    expect(note).toContain("https://councilof.ai/dispute/");
    expect(note).toMatch(/\bobject\b/);
    expect(note).toContain("CSOAI Ltd");
    expect(note).toContain("16939677");
  });

  it("serves no top-level key outside the ledger and the unsigned keys the signed rule names", async () => {
    const body = await serve();
    const rule = String(
      (LEDGER.signature as { attestation: { content_id_rule: string } }).attestation.content_id_rule,
    );
    const named = JSON.parse(rule.match(/minus keys (\[[^\]]*\])/)![1]) as string[];
    const allowed = new Set([...Object.keys(LEDGER), ...named]);
    expect(Object.keys(body).filter((k) => !allowed.has(k))).toEqual([]);
    // `note` is one of the keys the signed rule strips, which is why the sentence may live there.
    expect(named).toContain("note");
  });

  it("re-checked from the served JSON, the digest and state equal the ledger's own", async () => {
    // Whatever the ledger's state is (corrections.signature.test.ts pins VALID), the sentence in
    // `note` must not move it: a third party stripping the published unsigned keys from the
    // served body recomputes the same content_id the ledger source does.
    const body = await serve();
    const direct = await checkSignature(LEDGER as unknown as Record<string, unknown>);
    const fromServed = await checkSignature(body);
    expect(fromServed.recomputed_content_id).toBe(direct.recomputed_content_id);
    expect(fromServed.state).toBe(direct.state);
    expect(body.signature_state).toBe(direct.state);
  });
});
