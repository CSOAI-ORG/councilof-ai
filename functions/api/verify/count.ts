// functions/api/verify/count.ts — the verification counter (the threshold made metric).
//
// Every successful third-party verification increments this counter. The count is
// itself a MEASURED, signed value: it rides the same estate-chain-1 envelope as the
// board, so "N unpaid third parties verified a signed receipt" is publishable as a
// number on our own board — the threshold turned into a metric.
//
// Register: measurement, not certification. The count proves verifications HAPPENED
// (each was a real in-browser Ed25519 check against the published did.json), not that
// the verifier endorsed anything.
//
// Storage: KV (VERIFY_COUNTER) — increment on successful verify, read for display.
// A webhook-free, privacy-safe design: we only count, never log who verified.
interface Env {
  VERIFY_COUNTER?: unknown; // KVNamespace — typed loosely to match repo convention
}

const COUNTER_KEY = "successful_verifications";
const SIGNER_NOTE = "csoai.verify-counter/0.1 — measured, not certified";

// Minimal KV-compatible accessor (Cloudflare Pages KV: get/put on the binding).
function kv(env: Env) {
  return env.VERIFY_COUNTER as { get(k: string): Promise<string | null>; put(k: string, v: string): Promise<void> } | undefined;
}

export const onRequestPost = async ({ env }: { env: Env }) => {
  try {
    const store = kv(env);
    if (!store) {
      return Response.json({ ok: false, error: "counter KV not bound" }, { status: 503 });
    }
    const prev = Number((await store.get(COUNTER_KEY)) ?? "0");
    const next = prev + 1;
    await store.put(COUNTER_KEY, String(next));
    return Response.json({
      ok: true,
      count: next,
      note: SIGNER_NOTE,
      incremented: true,
      ts: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
};

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const store = kv(env);
    const count = Number((await store?.get(COUNTER_KEY)) ?? "0");
    return Response.json({
      ok: true,
      schema: "csoai.verify-counter/0.1",
      count,
      note: SIGNER_NOTE,
      // Honest: the counter is monotonic but not authenticated per-verifier. It
      // proves verifications happened, not WHO verified — no identity is stored.
      limitations: ["count only — no verifier identity, no IP logging"],
      measured_on: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
};
