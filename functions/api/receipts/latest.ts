/** GET /api/receipts/latest — aggregate state of the signed x402 receipt store. */
/// <reference types="@cloudflare/workers-types" />
import { readRecentReceipts } from "../_x402_receipt";
import { selfWallets } from "../_x402";

export interface Env {
  REVENUE_KV?: KVNamespace;
  X402_PAY_TO?: string;
  X402_SELF_WALLETS?: string;
}

export async function handle(env: Env = {}): Promise<Response> {
  const records = await readRecentReceipts(
    env.REVENUE_KV as unknown as Parameters<typeof readRecentReceipts>[0],
    50,
  );
  const base = {
    schema: "csoai.receipts.latest/0.2",
    as_of: new Date().toISOString(),
    privacy: "Aggregate-only. Wallets, transaction IDs, resources, amounts and JWS payloads are not exposed by this public feed.",
    endpoints: {
      buyer_lookup: "/api/receipts?payer=0x…",
      verifier: "/api/receipts/verify",
      revenue: "/api/revenue",
    },
  };

  if (records === null) {
    return Response.json(
      { ...base, status: "UNRECORDED", count: null, demand_eligible_count: null, internal_count: null, zero_value_count: null, reason: "REVENUE_KV is not bound on this deployment." },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }

  const owned = selfWallets(env);
  const classified = records.map((r) => {
    const self = owned.has((r.payload.payer || "").toLowerCase()) || r.self === true;
    return { self, zero_value: r.zero_value, demand_eligible: !self && !r.zero_value };
  });
  return Response.json(
    {
      ...base,
      status: "PUBLISHED",
      count: classified.length,
      demand_eligible_count: classified.filter((r) => r.demand_eligible).length,
      internal_count: classified.filter((r) => r.self).length,
      zero_value_count: classified.filter((r) => r.zero_value).length,
      note: "Counts cover at most the 50 most recent stored receipts. A receipt alone is not a buyer or revenue event.",
    },
    { status: 200, headers: { "cache-control": "public, max-age=60" } },
  );
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => handle(env);
