import { describe, expect, it } from "vitest";
import { DESCRIPTION, onRequestGet } from "./free-door";

const call = async () =>
  (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/api/free-door"),
    env: {},
  });

describe("/api/free-door — a real 402 door whose true price is zero", () => {
  // The Bazaar catalogues a resource off a CONFIRMED SETTLE, and a zero-amount EIP-3009
  // authorization settles with an empty wallet. The first seed named /api/gspc and did not
  // index, because that route answers 200 — genuinely free, therefore not an x402 door at all.
  // This one speaks 402 so an indexer has something to catalogue.
  it("answers 402, not 200 — an indexer needs a payable door", async () => {
    expect((await call()).status).toBe(402);
  });

  it("advertises a price of exactly zero, in both v1 and v2 fields", async () => {
    const b = (await (await call()).json()) as { accepts: { amount: string; maxAmountRequired: string }[] };
    expect(b.accepts[0].amount).toBe("0");
    expect(b.accepts[0].maxAmountRequired).toBe("0");
  });

  // Zero must be the TRUE price. If this ever advertised a paid artefact at zero it would be
  // giving away something sold elsewhere, which is a different and dishonest thing.
  it("names only free artefacts, never a paid one", async () => {
    const raw = JSON.stringify(await (await call()).json());
    expect(raw).toMatch(/free forever/i);
    expect(raw).toMatch(/api\/gspc|root\.json/);
    expect(raw).not.toMatch(/request-attestation|evidence-bundle|eunomia-data\?feed/);
  });

  it("carries the bazaar metadata an indexer reads", async () => {
    const b = (await (await call()).json()) as { extensions?: { bazaar?: { info?: unknown; schema?: unknown } } };
    expect(b.extensions?.bazaar?.info).toBeTruthy();
    expect(b.extensions?.bazaar?.schema).toBeTruthy();
  });

  it("routes payment to the estate address, like every other door", async () => {
    const b = (await (await call()).json()) as { accepts: { payTo: string }[] };
    expect(b.accepts[0].payTo).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
  // THE FACILITATOR VALIDATES info.input AGAINST THIS SCHEMA, and the first version of this door
  // failed its own declaration: info.input carried queryParams while the schema set
  // additionalProperties:false over {type, method}. Probed 2026-09-05 — the EXTENSION-RESPONSES
  // sidechannel answered "Bazaar extension validation failed: /input: must NOT have additional
  // properties", which is why two settled seeds produced no listing. A blob that does not
  // validate is not discovery metadata, however complete it looks.
  it("info.input validates against the schema the same document declares", async () => {
    const b = (await (await call()).json()) as {
      extensions: { bazaar: { info: { input: Record<string, unknown> }; schema: any } };
    };
    const { info, schema } = b.extensions.bazaar;
    const declared = schema.properties.input;
    expect(declared.additionalProperties).toBe(false);
    const allowed = new Set(Object.keys(declared.properties));
    const extra = Object.keys(info.input).filter((k) => !allowed.has(k));
    expect(extra, `info.input carries keys the schema forbids: ${extra.join(", ")}`).toEqual([]);
    for (const r of declared.required) expect(info.input).toHaveProperty(r);
  });

  // REGRESSION, and a real one that is already visible in production. The Bazaar record for this
  // door was written on 2026-09-05 from a seed that cut the description to 120 characters, so the
  // live listing ends mid-clause: "...Priced at zero because it is free forever — this".
  // Re-seeding cannot repair it — probed across a further successful settle (tx 0xf054d2e4…),
  // `lastUpdated` never moved off 03:27:26.273Z, so the index writes a resource once and never
  // refreshes it. Our own seed no longer truncates, but a different indexer may, and the record it
  // writes will be just as permanent.
  //
  // THE PROPERTY IS NOT "the first sentence is short". That was the first version of this test and
  // it was vacuous: the description that produced the mangled listing opens with a 71-character
  // sentence and passes such a check comfortably. What went wrong is the SECOND sentence being
  // sliced, leaving 49 characters of dangling clause. So the real property is that a cut at 120
  // must land within a few characters of a sentence boundary, leaving no half-sentence behind.
  it("leaves no dangling half-sentence when a listing truncates it at 120 chars", () => {
    const CUT = 120;
    const lastStop = DESCRIPTION.lastIndexOf(".", CUT - 1);
    expect(lastStop).toBeGreaterThan(0);
    const dangling = CUT - (lastStop + 1);
    expect(dangling).toBeLessThanOrEqual(5);
    // and what survives the cut must be the honest claim, never a fragment implying a sold grade
    const surviving = DESCRIPTION.slice(0, lastStop + 1);
    expect(surviving).toMatch(/free/i);
    expect(surviving).not.toMatch(/certif/i);
  });
});
