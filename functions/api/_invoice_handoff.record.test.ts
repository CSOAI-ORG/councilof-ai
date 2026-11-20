import { describe, expect, it } from "vitest";
import { recordInvoiceHandoff, INVOICE_CONTACT } from "./_invoice_handoff";

function kv(opts: { dropWrites?: boolean; throwOnPut?: boolean } = {}) {
  const store = new Map<string, string>();
  const ns = {
    put: async (k: string, v: string) => {
      if (opts.throwOnPut) throw new Error("kv down");
      if (!opts.dropWrites) store.set(k, v);
    },
    get: async (k: string) => store.get(k) ?? null,
  } as unknown as KVNamespace;
  return { ns, store };
}

describe("recordInvoiceHandoff — recorded only when the store reads it back", () => {
  it("unbound store: honest recorded:false, same as invoiceHandoff", async () => {
    const h = await recordInvoiceHandoff(undefined, "CSOAI-EB-ABC", "evidence bundle for dora");
    expect(h.recorded).toBe(false);
    expect(h.contact).toBe(INVOICE_CONTACT);
  });

  it("bound store: writes invoice:<iso>:<uuid>, confirms readback, returns receipt", async () => {
    const { ns, store } = kv();
    const h = await recordInvoiceHandoff(ns, "CSOAI-EB-ABC", "evidence bundle for dora", { commissioned_by: "ACME Ltd" });
    expect(h.recorded).toBe(true);
    if (!h.recorded) throw new Error("unreachable");
    expect(h.state).toBe("STORED_READBACK_CONFIRMED");
    expect(h.receipt_id).toMatch(/^invoice:\d{4}-\d{2}-\d{2}T/);
    const rec = JSON.parse(store.get(h.receipt_id)!);
    expect(rec).toMatchObject({ kind: "invoice_handoff", reference: "CSOAI-EB-ABC", commissioned_by: "ACME Ltd" });
    expect(JSON.stringify(h)).not.toMatch(/[£$€]\s?\d/);
  });

  it("write silently lost (readback null): falls back to recorded:false", async () => {
    const { ns } = kv({ dropWrites: true });
    expect((await recordInvoiceHandoff(ns, "R", "x")).recorded).toBe(false);
  });

  it("KV throws: falls back to recorded:false, never a 500", async () => {
    const { ns } = kv({ throwOnPut: true });
    expect((await recordInvoiceHandoff(ns, "R", "x")).recorded).toBe(false);
  });
});
