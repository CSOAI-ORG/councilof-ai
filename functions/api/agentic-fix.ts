/**
 * /api/agentic-fix — honest proposal boundary.
 *
 * No durable queue, authenticated principal, approval receipt or deployed
 * worker is bound to this Pages Function. It therefore MUST NOT return 202,
 * "queued", or imply that a machine will mutate the estate later. The route
 * validates and reflects a compact proposal only; execution stays fail-closed.
 */

type FixRequest = {
  problem_id?: unknown;
  kind?: unknown;
  file?: unknown;
  rule?: unknown;
  forbidden?: unknown;
  auto?: unknown;
};

export type FixProposal = {
  schema: "csoai.fix-proposal/0.1";
  state: "PROPOSAL_ONLY";
  requested_scope: "detect" | "specific";
  problem_id: string | null;
  problem: {
    kind: string | null;
    file: string | null;
    rule: string | null;
    forbidden: string | null;
  };
  executed: false;
  queued: false;
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function text(value: unknown, cap: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, cap);
  return cleaned || null;
}

export function buildFixProposal(input: FixRequest): FixProposal {
  return {
    schema: "csoai.fix-proposal/0.1",
    state: "PROPOSAL_ONLY",
    requested_scope: input.auto === true ? "detect" : "specific",
    problem_id: text(input.problem_id, 180),
    problem: {
      kind: text(input.kind, 80),
      file: text(input.file, 240),
      rule: text(input.rule, 100),
      forbidden: text(input.forbidden, 120),
    },
    executed: false,
    queued: false,
  };
}

const REQUIRED_EXECUTION_CONTROLS = [
  "authenticated tenant and actor",
  "authorised repository/workspace scope",
  "dry-run diff and risk classification",
  "explicit signed approval for every mutation",
  "idempotent durable queue plus worker lease",
  "post-change tests, rollback reference and corrections receipt",
] as const;

export const onRequestGet: PagesFunction = async () =>
  Response.json(
    {
      schema: "csoai.agentic-fix-capability/0.1",
      endpoint: "/api/agentic-fix",
      state: "PROPOSAL_ONLY",
      methods: ["GET", "POST"],
      writes: false,
      queue_bound: false,
      worker_bound: false,
      authentication_bound: false,
      note: "POST validates a proposal but executes and queues nothing. Read-only diagnosis may be automated; changes require the controls below.",
      required_for_execution: REQUIRED_EXECUTION_CONTROLS,
    },
    { headers: { ...CORS, "Cache-Control": "no-store" } },
  );

export const onRequestPost: PagesFunction = async (ctx) => {
  let input: FixRequest;
  try {
    const raw: unknown = await ctx.request.json();
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("body is not an object");
    input = raw as FixRequest;
  } catch {
    return Response.json(
      { ok: false, state: "INVALID_ARGUMENT", error: "JSON object required" },
      { status: 400, headers: CORS },
    );
  }

  const proposal = buildFixProposal(input);
  if (
    proposal.requested_scope === "specific" &&
    !proposal.problem_id &&
    !proposal.problem.kind
  ) {
    return Response.json(
      {
        ok: false,
        state: "INVALID_ARGUMENT",
        error: "Provide auto=true, problem_id, or kind.",
        executed: false,
        queued: false,
      },
      { status: 400, headers: CORS },
    );
  }

  return Response.json(
    {
      ok: false,
      state: "EXECUTION_UNAVAILABLE",
      proposal,
      executed: false,
      queued: false,
      reason:
        "No authenticated approval service, durable queue, or deployed worker is bound to this endpoint.",
      required_for_execution: REQUIRED_EXECUTION_CONTROLS,
    },
    { status: 501, headers: CORS },
  );
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: CORS });
