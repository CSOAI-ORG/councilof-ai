import { describe, expect, it } from "vitest";
import { buildCommissionQueue } from "./commission-queue";
import { buildCommissions } from "./commissions";

/**
 * Product organ PS-02 (7 Oct 2026): /api/commission-queue listed two rows QUEUED for 15 and 31 days
 * as owed work. Both were paid by estate wallets (the owner's test wallet, and the house wallet paying
 * itself), read on-chain the same morning. A row is owed work only when someone else paid for it.
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

const PAY_TO = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31";
const OWNER_TEST = "0x4dB7AAFbe797a39Cd6Cc4E7aa64d970F7F6E02B7";
const STRANGER = "0x1111111111111111111111111111111111111111";
const noCards = (async () => new Response(JSON.stringify({ schema: "csoai.pod-cards-index/0.1", cards: [] }))) as typeof fetch;

const queued = (subject: string, tx: string, as_of: string) =>
  JSON.stringify({ subject, subject_kind: "ollama_model", model: subject, fulfillment: "QUEUED", tx, as_of, receipt_sha: tx.slice(2) });
const settled = (payer: string, amount = "10000") => JSON.stringify({ payer, amount_atomic: amount, settled_at: "2026-09-22T13:20:35Z" });

describe("commission queue: owed work only", () => {
  it("the 7 Oct state: both QUEUED rows were self payments, so none is owed and both stay on the record", async () => {
    const store: Store = new Map([
      ["ras:fb50", queued("clan-csoai-plain:latest", "0xeec6", "2026-09-06T08:01:23.527Z")],
      ["mill:commission:model-or-subject-id", queued("model-or-subject-id", "0x5da0", "2026-09-22T13:20:35.593Z")],
      ["settled:tx:0xeec6", settled(OWNER_TEST, "20000")],
      ["settled:tx:0x5da0", settled(PAY_TO)],
    ]);
    const body = (await buildCommissionQueue({ REVENUE_KV: fakeKv(store), X402_SELF_WALLETS: OWNER_TEST }, "https://councilof.ai", noCards)) as any;
    expect(body.rows.filter((r: { status: string }) => r.status === "QUEUED")).toHaveLength(0);
    expect(body.queued).toBe(0);
    expect(body.self_test).toBe(2);
    expect(body.not_owed.map((r: { subject: string; status: string }) => [r.subject, r.status])).toEqual([
      ["clan-csoai-plain:latest", "SELF_TEST"],
      ["model-or-subject-id", "SELF_TEST"],
    ]);
    expect(body.dispatch.mode).toBe("MANUAL");
    expect(body.dispatch.note).toMatch(/fulfilled by hand/);
    // the payer address is read to classify and never returned
    expect(JSON.stringify(body).toLowerCase()).not.toContain(OWNER_TEST.toLowerCase());
  });

  it("a stranger's row stays queued; an unreadable payment stays queued; a zero-value one is not owed", async () => {
    const store: Store = new Map([
      ["ras:a", queued("qwen3:4b", "0xaaa", "2026-10-01T00:00:00Z")],
      ["ras:b", queued("mistral:7b", "0xbbb", "2026-10-02T00:00:00Z")],
      ["ras:c", queued("gemma3:12b", "0xccc", "2026-10-03T00:00:00Z")],
      ["settled:tx:0xaaa", settled(STRANGER)],
      ["settled:tx:0xccc", settled(STRANGER, "0")],
    ]);
    const body = (await buildCommissionQueue({ REVENUE_KV: fakeKv(store) }, "https://councilof.ai", noCards)) as any;
    expect(body.rows.map((r: { subject: string; origin: string; status: string }) => [r.subject, r.origin, r.status])).toEqual([
      ["qwen3:4b", "OUTSIDE", "QUEUED"],
      ["mistral:7b", "UNCHECKABLE", "QUEUED"],
    ]);
    expect(body.queued).toBe(2);
    expect(body.not_owed.map((r: { subject: string; status: string }) => [r.subject, r.status])).toEqual([["gemma3:12b", "ZERO_VALUE"]]);
    expect(body.zero_value).toBe(1);
  });

  it("/api/commissions and /api/commission-queue count the same owed work (repair round, 7 Oct 2026)", async () => {
    // Before: the queue said queued 0 (both self-paid rows in not_owed) while /api/commissions said
    // queued 2 for the same two rows. Both now count by isOwedOrigin().
    const store: Store = new Map([
      ["ras:a", queued("clan-csoai-plain:latest", "0xeec6", "2026-09-06T08:01:23.527Z")],
      ["ras:b", queued("llama3.2:1b", "0x5da0", "2026-09-22T13:20:35.593Z")],
      ["ras:c", queued("qwen3:4b", "0xaaa", "2026-10-01T00:00:00Z")],
      ["ras:d", queued("mistral:7b", "0xbbb", "2026-10-02T00:00:00Z")],
      ["ras:e", queued("gemma3:12b", "0xccc", "2026-10-03T00:00:00Z")],
      ["settled:tx:0xeec6", settled(OWNER_TEST, "20000")],
      ["settled:tx:0x5da0", settled(PAY_TO)],
      ["settled:tx:0xaaa", settled(STRANGER)],
      ["settled:tx:0xccc", settled(STRANGER, "0")],
    ]);
    const env = { REVENUE_KV: fakeKv(store), X402_SELF_WALLETS: OWNER_TEST };
    const queue = (await buildCommissionQueue(env, "https://councilof.ai", noCards)) as any;
    const list = (await buildCommissions(env, "https://councilof.ai", noCards)) as any;
    expect(queue.queued).toBe(2); // the stranger's row and the unreadable one
    expect(list.queued).toBe(queue.queued);
    expect(list.queued_not_owed).toBe(queue.self_test + queue.zero_value);
    expect(list.queued_not_owed).toBe(3);
    expect(list.queued_rule).toMatch(/owed work only/);
    const owed = Object.fromEntries(list.commissions.map((c: { subject: string; owed: boolean }) => [c.subject, c.owed]));
    expect(owed).toEqual({ "clan-csoai-plain:latest": false, "llama3.2:1b": false, "qwen3:4b": true, "mistral:7b": true, "gemma3:12b": false });
  });
});
