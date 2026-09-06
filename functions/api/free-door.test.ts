import { describe, expect, it, vi } from "vitest";
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


  // The Bazaar indexes this door and nothing else of ours — the paid doors need a confirmed
  // settle to be catalogued and the facilitator exposes no registration endpoint. So this is
  // the one place a discovering agent can learn the paid tiers exist, and it must be machine
  // readable rather than a sentence in the description.
  it("points a discovering agent at the paid catalogue, as a URL and never a price", async () => {
    const body = (await (await call()).json()) as Record<string, unknown>;
    expect(body.catalog).toBe("https://councilof.ai/api/x402");
    // No public $ price may appear on this surface — brand-gate forbids it estate-wide.
    expect(JSON.stringify(body)).not.toMatch(/\$\s?\d/);
  });

  // THE INDEXED CONTRACT. The live Bazaar record advertises an outputSchema, and that record is
  // permanent — the index writes a resource once and never refreshes it. So the keys the door
  // actually serves must be the keys the listing promised. Until 2026-09-05 the handler returned
  // 402 unconditionally with no payment path, so a paying agent got another 402 and never these.
  //
  // THIS TEST MOCKS THE VERIFIER ON PURPOSE. The first version simply sent an x-payment header
  // with env {}, which cannot verify without a facilitator, so it took the 402 branch and passed
  // against the very handler that had no fulfilment path at all — it asserted nothing. Reaching
  // the 200 branch requires verifyX402Payment to succeed, so it is stubbed here and only here.
  it("serves the exact keys its published outputSchema promises, once payment verifies", async () => {
    // Read the published contract from the UNMOCKED challenge first — once the verifier is stubbed
    // every call fulfils, and there is no 402 body left to read the promised keys out of.
    const chal = (await (await call()).json()) as {
      extensions: { bazaar: { info: { output: { example: Record<string, unknown> } } } };
    };
    const promised = Object.keys(chal.extensions.bazaar.info.output.example).sort();
    expect(promised).toEqual(["board", "price_usdc", "root", "schema", "verify"]);

    const x402 = await import("./_x402");
    const spy = vi.spyOn(x402, "verifyX402Payment").mockResolvedValue({
      ok: true,
      paymentResponse: undefined,
    } as unknown as Awaited<ReturnType<typeof x402.verifyX402Payment>>);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ totals: { public_count: 22, measured: 22, unmeasured: 0 } }), {
        headers: { "content-type": "application/json" },
      }),
    );
    try {
      const { onRequestGet: handler } = await import("./free-door");
      const paid = (await (handler as unknown as (c: unknown) => Promise<Response>)({
        request: new Request("https://councilof.ai/api/free-door", {
          headers: { "x-payment": "e30=" },
        }),
        env: {},
      })) as Response;

      expect(paid.status).toBe(200); // the whole point — a 402 here is the bug this test exists for
      const body = (await paid.json()) as Record<string, unknown>;
      for (const k of promised) expect(body).toHaveProperty(k);
      expect(body.price_usdc).toBe(0);
      // the totals are READ, never restated: the stubbed board is what comes back
      expect(body.totals).toEqual({ public_count: 22, measured: 22, unmeasured: 0 });
    } finally {
      spy.mockRestore();
      fetchSpy.mockRestore();
    }
  });

  // A failed board read must be reported as a failure, never rendered as a plausible number.
  it("says so when the live board cannot be read, instead of inventing totals", async () => {
    const x402 = await import("./_x402");
    const spy = vi.spyOn(x402, "verifyX402Payment").mockResolvedValue({
      ok: true,
    } as unknown as Awaited<ReturnType<typeof x402.verifyX402Payment>>);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    try {
      const { onRequestGet: handler } = await import("./free-door");
      const paid = (await (handler as unknown as (c: unknown) => Promise<Response>)({
        request: new Request("https://councilof.ai/api/free-door", { headers: { "x-payment": "e30=" } }),
        env: {},
      })) as Response;
      expect(paid.status).toBe(200);
      const body = (await paid.json()) as Record<string, unknown>;
      expect(body.totals).toBeNull();
      expect(String(body.totals_note)).toMatch(/could not read/i);
    } finally {
      spy.mockRestore();
      fetchSpy.mockRestore();
    }
  });
});

describe("the zero price must survive verifyX402Payment itself", () => {
  // THIS TEST EXISTS BECAUSE THE MOCKED ONE MISSED IT. The fulfilment test above stubs
  // verifyX402Payment to reach the 200 branch, which is the only way to assert the response
  // shape — but it therefore proves nothing about whether the real function would ever say ok.
  // It would not: _x402.ts refuses any accept whose maxAmountRequired is "0" with "no amount
  // configured for this resource", because the paid-door default is `env.X402_AMOUNT || "0"`
  // and settling an unconfigured door would give away a paid artefact. /api/free-door's price
  // really is 0, so it tripped that guard and answered 402 to a caller who had settled
  // correctly — found 2026-09-05 by paying the live door end to end, not by any test.
  //
  // The guard now admits zero only when the caller passes allowZeroAmount, and these two tests
  // hold both halves of that: the free door passes it, and nothing else may.
  it("still refuses a zero amount when the caller has NOT declared it deliberate", async () => {
    const { verifyX402Payment } = await import("./_x402");
    const r = await verifyX402Payment(
      new Request("https://councilof.ai/api/anything", { headers: { "x-payment": "e30=" } }),
      { X402_FACILITATOR_URL: "https://facilitator.example" } as never,
      "https://councilof.ai/api/anything",
      { scheme: "exact", network: "base", maxAmountRequired: "0", amount: "0",
        asset: "0x0", payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31" } as never,
    );
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/no amount configured/i);
  });

  it("does not refuse on the amount when the caller declares zero deliberate", async () => {
    const { verifyX402Payment } = await import("./_x402");
    const r = await verifyX402Payment(
      new Request("https://councilof.ai/api/free-door", { headers: { "x-payment": "e30=" } }),
      { X402_FACILITATOR_URL: "https://facilitator.example" } as never,
      "https://councilof.ai/api/free-door",
      { scheme: "exact", network: "base", maxAmountRequired: "0", amount: "0",
        asset: "0x0", payTo: "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31" } as never,
      { allowZeroAmount: true },
    );
    // It may still fail further along (no reachable facilitator in a unit test) — the point is
    // that it must get PAST the amount guard, which is what blocked the live door.
    expect(r.reason ?? "").not.toMatch(/no amount configured/i);
  });

  it("tells a caller who presented a payment WHY it was not accepted", async () => {
    const res = (await (onRequestGet as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/api/free-door", {
        headers: { "x-payment": "e30=" },
      }),
      env: {},
    })) as Response;
    expect(res.status).toBe(402);
    const body = (await res.json()) as { csoai?: { not_paid_reason?: string } };
    expect(body.csoai?.not_paid_reason).toBeTruthy();
    // and a caller who presented nothing gets the plain challenge, with no verdict invented.
    //
    // This used to read `expect(plain.csoai).toBeUndefined()`, because not_paid_reason was the
    // ONLY thing the csoai block ever carried. Phase E then made every 402 body advertise its
    // free preview and its deliverable in that same block, so absence-of-block stopped being
    // able to express the rule. The rule was never "no block" — it was "no invented verdict".
    // Both halves are now named, so neither can be lost by the other changing.
    const plain = (await (await call()).json()) as {
      csoai?: { not_paid_reason?: string; free_preview?: string; deliverable?: string };
    };
    expect(plain.csoai?.not_paid_reason).toBeUndefined();
    expect(plain.csoai?.free_preview).toBe("https://councilof.ai/api/free-door");
    expect(plain.csoai?.deliverable).toBeTruthy();
  });

  // MEASURED 2026-09-06 against the live PayAI index: our entry's stored `description` is EXACTLY
  // 120 characters, cut mid-sentence — "...free forever — this". That is the whole of what an agent
  // browsing 28,230 resources is shown before it decides whether to open the door, and the record
  // is a snapshot: it was written on 5 Sep and six settlements since have not refreshed it.
  //
  // So the first sentence has to survive alone at 120. Today it is 118 — it fits by two
  // characters, and by accident rather than by rule. One more word in the opening clause and the
  // Bazaar's copy of our only listing ends mid-word again, with nothing anywhere reporting it.
  it("says the whole first sentence inside the 120 characters the Bazaar keeps", async () => {
    const { DESCRIPTION } = await import("./free-door");
    const first = DESCRIPTION.split(". ")[0] + ".";
    expect(first.length,
      `the Bazaar stores 120 chars; this first sentence is ${first.length} and would be cut mid-word`)
      .toBeLessThanOrEqual(120);
    expect(first, "the first sentence must name what the door serves, not only its price")
      .toMatch(/board totals|signed root/);
    expect(DESCRIPTION, "no price on any surface — the amount lives in accepts[] and nowhere else")
      .not.toMatch(/\$|USDC|\d+\s*(cent|usd)/i);
  });
});