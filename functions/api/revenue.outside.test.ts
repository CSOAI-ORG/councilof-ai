import { describe, expect, it } from "vitest";
import { buildRevenue, LISTED_EXAMPLE_SUBJECTS, SUBJECT_PARAMS, subjectClassOf } from "./revenue";
import { onRequestGet as manifest } from "../.well-known/x402.json";

/**
 * Sell organ SG-09 / SG-04 (7 Oct 2026). The one number counted 2 non-self payers; one paid for a pack
 * about our own og-image, the other for our own data feed. A payer is evidence of an outside customer
 * only when the subject paid for is not ours: delivered_outside, served beside one_number. And invoice
 * requests are counted apart from issuances (invoice_requested), with the packs the invoice rail issued
 * before payment named inside the issuance tally.
 */
type Store = Map<string, string>;
function fakeKv(store: Store): KVNamespace {
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async list({ prefix }: { prefix: string }) {
      return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })), list_complete: true };
    },
  } as unknown as KVNamespace;
}

const A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const C = "0xcccccccccccccccccccccccccccccccccccccccc";
const now = new Date().toISOString();
const settle = (payer: string, resource: string, tx: string) =>
  JSON.stringify({ payer, resource, transaction: tx, amount_atomic: "10000", settled_at: now, self: false });

describe("subjectClassOf — whose subject a paid request named", () => {
  it("classes our hosts and our model ids as OURS, placeholders as PLACEHOLDER, a door with no subject as NONE", () => {
    expect(subjectClassOf("https://councilof.ai/api/art50/marking-evidence?url=https%3A%2F%2Fcouncilof.ai").cls).toBe("OURS");
    expect(subjectClassOf("https://councilof.ai/api/art50/marking-evidence?url=https://councilof.ai/og-image.png").cls).toBe("OURS");
    expect(subjectClassOf("https://councilof.ai/api/ras/mcp-probe?url=https://meok.ai/mcp").cls).toBe("OURS");
    expect(subjectClassOf("https://councilof.ai/api/request-attestation?subject=clan-csoai-plain%3Alatest").cls).toBe("OURS");
    expect(subjectClassOf("https://councilof.ai/api/request-attestation?subject=sov6-ethics-v3-light:latest").cls).toBe("OURS");
    expect(subjectClassOf("https://councilof.ai/api/request-attestation?subject=model-or-subject-id").cls).toBe("PLACEHOLDER");
    expect(subjectClassOf("https://councilof.ai/api/art50/marking-evidence?url=https://example.org/output.jpg").cls).toBe("PLACEHOLDER");
    expect(subjectClassOf("https://councilof.ai/api/eunomia-data?feed=1").cls).toBe("NONE");
    expect(subjectClassOf("https://councilof.ai/api/pop/stablecoins").cls).toBe("NONE");
    expect(subjectClassOf(null).cls).toBe("NONE");
  });

  it("classes the value a door is listed under as EXAMPLE: the subject a catalogue tester pays for", () => {
    expect(subjectClassOf("https://councilof.ai/api/request-attestation?subject=llama3.2%3A3b").cls).toBe("EXAMPLE");
    expect(subjectClassOf("https://councilof.ai/api/rwa/evidence?asset=RLUSD").cls).toBe("EXAMPLE");
    expect(subjectClassOf("https://councilof.ai/api/wrapper?id=usdc.e:arbitrum").cls).toBe("EXAMPLE");
  });

  it("every single-subject example /.well-known/x402.json lists is known here (no drift)", async () => {
    const res = await manifest({ request: new Request("https://councilof.ai/.well-known/x402.json"), env: {}, params: {} } as never);
    const doc = (await res.json()) as { resources: { url: string }[] };
    const listed: string[] = [];
    for (const r of doc.resources) {
      const u = new URL(r.url);
      for (const k of SUBJECT_PARAMS) {
        const v = u.searchParams.get(k);
        if (v) {
          listed.push(v);
          break;
        }
      }
    }
    expect(listed.length).toBeGreaterThanOrEqual(5);
    for (const v of listed) expect(LISTED_EXAMPLE_SUBJECTS.has(v), v).toBe(true);
    expect(listed).not.toContain("model-or-subject-id");
  });

  it("classes a third party's output, model or asset as OUTSIDE", () => {
    expect(subjectClassOf("https://councilof.ai/api/art50/marking-evidence?url=https://images.acme-design.co.uk/a.png").cls).toBe("OUTSIDE");
    expect(subjectClassOf("https://councilof.ai/api/request-attestation?subject=qwen3%3A8b").cls).toBe("OUTSIDE");
    expect(subjectClassOf("https://councilof.ai/api/rwa/evidence?asset=USDC").cls).toBe("EXAMPLE");
    expect(subjectClassOf("https://councilof.ai/api/rwa/evidence?asset=XRP").cls).toBe("OUTSIDE");
    expect(subjectClassOf("https://councilof.ai/api/wrapper/asset/usdt").cls).toBe("OUTSIDE");
    // "sovereign" is not our "sov" prefix
    expect(subjectClassOf("https://councilof.ai/api/request-attestation?subject=sovereign-model").cls).toBe("OUTSIDE");
  });
});

describe("/api/revenue — delivered_outside beside one_number", () => {
  it("the 7 Oct shape: two non-self payers, neither paid for a subject that is not ours", async () => {
    const store: Store = new Map([
      ["settled:tx:0x1", settle(A, "https://councilof.ai/api/art50/marking-evidence?url=https%3A%2F%2Fcouncilof.ai", "0x1")],
      ["settled:tx:0x2", settle(B, "https://councilof.ai/api/eunomia-data?feed=1", "0x2")],
    ]);
    const body = (await buildRevenue({ REVENUE_KV: fakeKv(store) })) as any;
    expect(body.one_number.all_time).toBe(2);
    expect(body.one_number).not.toHaveProperty("delivered_outside");
    expect(body.delivered_outside).toMatchObject({ id: "delivered_outside", status: "MEASURED", all_time: 0, last_30d: 0 });
    expect(body.delivered_outside.payers_by_subject_class).toEqual({ OURS: 1, PLACEHOLDER: 0, EXAMPLE: 0, OUTSIDE: 0, NONE: 1 });
    expect(JSON.stringify(body.delivered_outside)).not.toContain(A);
  });

  it("counts a non-self payer once when it paid for a third party's subject; self payers never count", async () => {
    const store: Store = new Map([
      ["settled:tx:0x1", settle(A, "https://councilof.ai/api/art50/marking-evidence?url=https://images.acme-design.co.uk/a.png", "0x1")],
      ["settled:tx:0x2", settle(A, "https://councilof.ai/api/art50/marking-evidence?url=https://images.acme-design.co.uk/b.png", "0x2")],
      ["settled:tx:0x3", settle(C, "https://councilof.ai/api/art50/marking-evidence?url=https://images.acme-design.co.uk/c.png", "0x3")],
    ]);
    const body = (await buildRevenue({ REVENUE_KV: fakeKv(store), X402_SELF_WALLETS: C })) as any;
    expect(body.delivered_outside.all_time).toBe(1);
    expect(body.one_number.all_time).toBe(1);
  });

  it("with no store it is null, never 0", async () => {
    const body = (await buildRevenue({})) as any;
    expect(body.delivered_outside).toMatchObject({ status: "UNMEASURED", all_time: null });
    expect(body.invoice.invoice_requested).toMatchObject({ status: "UNMEASURED", count: null });
  });
});

describe("/api/revenue — invoice requests apart from issuances", () => {
  it("serves invoice_requested from its own counter and names the packs issued before payment", async () => {
    const store: Store = new Map([
      ["count:issuances", "13"],
      ["count:invoice_requested", "2"],
      ["art50:aa", JSON.stringify({ subject: "s1", payment: { mode: "invoice-gbp", reference: "CSOAI-A50-1", commissioned_by: "Acme Design Ltd" } })],
      // the blueprint's S-SG-04 check asks with commissioned_by=test; on the old rule each run issued a pack
      ["art50:bb", JSON.stringify({ subject: "s2", payment: { mode: "invoice-gbp", reference: "CSOAI-A50-2", commissioned_by: "Test" } })],
      ["art50:cc", JSON.stringify({ subject: "s3", payment: { mode: "x402", transaction: "0x9" } })],
      ["art50:dd", JSON.stringify({ subject: "s4", payment: { mode: "invoice-gbp", reference: "CSOAI-A50-3", state: "MARKED_PAID" } })],
      // the invoice rail's own request records are a different prefix and never read as packs
      ["art50-invoice:CSOAI-A50-4", JSON.stringify({ reference: "CSOAI-A50-4", state: "AWAITING_PAYMENT" })],
    ]);
    const body = (await buildRevenue({ REVENUE_KV: fakeKv(store) })) as any;
    expect(body.invoice.invoice_requested).toMatchObject({ count: 2, status: "MEASURED" });
    expect(body.invoice.issued_before_payment).toMatchObject({ count: 2, status: "MEASURED", records_read: 4, named_test: 1 });
    // an organisation name is read to count "test" and never returned
    expect(JSON.stringify(body)).not.toContain("Acme");
    expect(body.skus.issuance.count).toBe(13);
    expect(body.skus.issuance.includes_issued_before_payment).toBe(2);
  });

  it("an absent counter on a bound store is a measured zero since counting began", async () => {
    const body = (await buildRevenue({ REVENUE_KV: fakeKv(new Map()) })) as any;
    expect(body.invoice.invoice_requested).toMatchObject({ count: 0, status: "MEASURED", counting_since: "2026-10-07" });
  });
});
