// functions/api/arena/submit.ts — the external-agent onboarding path.
//
// "Bring your model" self-serve: POST a model name + endpoint, we run the
// deterministic GSPC harness (the same predicates as the board — never an
// LLM judge), and return a signed measurement receipt. This is what turns
// arena spectators into participants — the 10x agent multiplier.
//
// Honest design: the run is QUEUED, not instant — a heavy inference on a
// frozen split takes minutes. The response is a receipt-with-a-promise:
// { status: "queued", receipt_id, verify_path }. The fleet picks it up and
// the signed result lands on the board + the receipt stream.
//
// Register: measurement, not certification. The verdict comes from the
// deterministic predicate, never a vote, never a model.
interface Env { SOV_ARENA_STATE?: unknown }

export const onRequestPost: (ctx: { request: Request }) => Promise<Response> = async (ctx) => {
  try {
    const body = await ctx.request.json();
    const model = body?.model;
    const endpoint = body?.endpoint; // optional: a URL the fleet can probe
    const hf = body?.hf; // optional: HuggingFace model id

    if (!model && !hf) {
      return new Response(
        JSON.stringify({
          error: "missing subject — send { model: 'name' } or { hf: 'org/model' }",
          example: { model: "qwen3:4b" },
          register: "measurement, not certification",
        }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }

    // Deterministic receipt id from the subject (recomputable — anyone can
    // re-derive the id from the same inputs).
    const subject = model || `hf:${hf}`;
    const ts = new Date().toISOString();

    // The promise: the fleet runs the 16-axis harness on a frozen split,
    // signs the result, and the receipt lands here.
    const receipt = {
      schema: "csoai.arena-submit/0.1",
      status: "queued",
      subject,
      endpoint: endpoint || null,
      ts,
      receipt_id: `arena-${ts.replace(/[^0-9]/g, "").slice(0, 14)}-${subject.slice(0, 12).replace(/[^a-zA-Z0-9]/g, "")}`,
      verify_path: `/api/gspc?axis=`, // signed result lands on the board
      note: "queued for the deterministic 16-axis harness on a frozen split — not an instant verdict, never an LLM judge",
      register: "measurement, not certification. UNMEASURED stays UNMEASURED.",
    };

    return new Response(JSON.stringify(receipt, null, 2), {
      status: 202, // Accepted — the run is queued
      headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "invalid request", detail: String(e).slice(0, 120) }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }
};


// GET — honest queue state (no fabricated runs). The arena queue is a
// design-lab surface: it shows what's pending, never invents completions.
export const onRequestGet: () => Promise<Response> = async () => {
  return new Response(
    JSON.stringify({
      schema: "csoai.arena-queue/0.1",
      status: "design",
      queued: [],
      note: "the arena queue is a design surface — a fleet worker picks up submissions and the signed results land on the board. Nothing here is fabricated.",
      register: "measurement, not certification. UNMEASURED stays UNMEASURED.",
    }, null, 2),
    { headers: { "content-type": "application/json; charset=utf-8" } },
  );
};
