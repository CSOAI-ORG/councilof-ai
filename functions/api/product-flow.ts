/**
 * GET /api/product-flow — one read-only product lifecycle over existing engines.
 * It does not create a second workflow engine or upgrade any stage's authority.
 */
export type ProductStageState = "AVAILABLE" | "OBSERVED" | "HOLD" | "UNCHECKABLE";

type JsonObject = Record<string, any>;
type ReadResult = { ok: boolean; status: number; body: JsonObject | null };

export type ProductFlowStage = {
  id: string;
  order: number;
  label: string;
  engine: string;
  state: ProductStageState;
  source: string;
  href: string;
  meaning: string;
  observed?: Record<string, unknown>;
};

const responseJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

async function readJson(fetcher: typeof fetch, origin: string, path: string): Promise<ReadResult> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const response = await fetcher(new URL(path, origin).toString(), {
          headers: { accept: "application/json", "cache-control": "no-cache" },
          redirect: "error",
          signal: controller.signal,
        });
        const parsed: unknown = await response.json();
        const body = parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? parsed as JsonObject : null;
        return { ok: response.ok && body !== null, status: response.status, body: response.ok ? body : null };
      })(),
      new Promise<ReadResult>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("product source timed out"));
        }, 10_000);
      }),
    ]);
  } catch {
    return { ok: false, status: 0, body: null };
  } finally {
    clearTimeout(timer);
  }
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function hasCommission(catalog: JsonObject | null): boolean {
  const tools = catalog && catalog.mcp && catalog.mcp.paid_tools;
  return Array.isArray(tools) && tools.some((row: any) =>
    row && row.name === "commission_card" && typeof row.route === "string");
}

function boardCounts(board: JsonObject | null) {
  const totals = board && board.totals;
  const axes = count(totals?.axes) !== null
    ? totals.axes
    : Array.isArray(board?.axes) ? board!.axes.length : null;
  const measured = count(totals?.measured_axes) !== null
    ? totals.measured_axes
    : Array.isArray(board?.axes)
      ? board!.axes.filter((row: any) => row && row.status === "MEASURED").length
      : null;
  return { axes, measured };
}

function correctionsCount(body: JsonObject | null): number | null {
  for (const key of ["count", "total", "n", "corrections_count"]) {
    if (count(body?.[key]) !== null) return count(body?.[key]);
  }
  for (const key of ["corrections", "records", "items"]) {
    if (Array.isArray(body?.[key])) return body[key].length;
  }
  return null;
}

export async function buildProductFlow(origin: string, fetcher: typeof fetch = fetch) {
  const reads = await Promise.all([
    readJson(fetcher, origin, "/api/x402"),
    readJson(fetcher, origin, "/api/state"),
    readJson(fetcher, origin, "/api/worker"),
    readJson(fetcher, origin, "/api/gspc"),
    readJson(fetcher, origin, "/.well-known/constitutional-harness.json"),
    readJson(fetcher, origin, "/root.json"),
    readJson(fetcher, origin, "/api/commission-queue"),
    readJson(fetcher, origin, "/api/corrections"),
    readJson(fetcher, origin, "/api/revenue"),
  ]);
  const [catalog, estate, runtime, board, charter, root, queue, corrections, revenue] = reads;
  const counts = boardCounts(board.body);
  const runtimeLive = runtime.ok && runtime.body?.schema === "csoai.worker-state/0.1"
    && runtime.body.status === "LIVE" && runtime.body.stale !== true
    && typeof runtime.body.worker?.state === "string";
  const queueCount = count(queue.body?.count);
  const correctionCount = correctionsCount(corrections.body);
  const oneNumber = revenue.ok && revenue.body?.one_number?.status === "MEASURED"
    ? revenue.body.one_number : null;

  const stages: ProductFlowStage[] = [
    {
      id: "request", order: 1, label: "Request",
      engine: "Request Attestation Service + x402 catalogue",
      state: catalog.ok && hasCommission(catalog.body) ? "AVAILABLE" : "UNCHECKABLE",
      source: "/api/x402", href: "/dashboard?tab=measured",
      meaning: "Name a subject and optional axis. A 402 challenge is an offer, not a payment, measurement or delivery.",
      observed: { catalog_http: catalog.status, commission_card_listed: hasCommission(catalog.body) },
    },
    {
      id: "evidence", order: 2, label: "Evidence",
      engine: "Council evidence state + candidate evidence intake",
      state: estate.ok && estate.body?.schema === "csoai.live-state/1" ? "AVAILABLE" : "UNCHECKABLE",
      source: "/api/state", href: "/dashboard?tab=evidence-index",
      meaning: "Bind the request to dated source/evidence state. Candidate intake stays UNMEASURED until independent replay and review.",
      observed: { estate_http: estate.status },
    },
    {
      id: "runtime", order: 3, label: "Runtime",
      engine: "Compute worker",
      state: runtimeLive ? "OBSERVED" : runtime.ok && ["STALE", "OFFLINE"].includes(runtime.body?.status) ? "HOLD" : "UNCHECKABLE",
      source: "/api/worker",
      href: "/dashboard?tab=state",
      meaning: "Worker health describes available compute. It does not prove that your request ran, was measured or was delivered.",
      observed: {
        worker_http: runtime.status,
        worker_status: runtime.body?.status ?? null,
        worker_state: runtimeLive ? runtime.body?.worker?.state : null,
        read_at: runtime.body?.read_at ?? null,
      },
    },
    {
      id: "measurement", order: 4, label: "Measurement",
      engine: "GSPC measurement plane",
      state: board.ok && counts.axes !== null && counts.measured !== null && counts.measured <= counts.axes ? "OBSERVED" : "UNCHECKABLE",
      source: "/api/gspc", href: "/dashboard?tab=board",
      meaning: "Qualified evidence can be measured by GSPC. Board health is not evidence that this specific request has been measured.",
      observed: { board_http: board.status, axes: counts.axes, measured_axes: counts.measured },
    },
    {
      id: "review", order: 5, label: "Constitutional review",
      engine: "Constitutional Harness",
      state: charter.ok && charter.body?.status === "CURRENT_OPERATIONAL_CHARTER"
        ? "AVAILABLE" : charter.ok ? "HOLD" : "UNCHECKABLE",
      source: "/.well-known/constitutional-harness.json", href: "/constitutional-harness/",
      meaning: "Policy and authority checks govern the next action. Review never self-grants signing, payment or execution authority.",
      observed: {
        charter_http: charter.status,
        charter_status: charter.body?.status ?? null,
        charter_version: charter.body?.version ?? null,
      },
    },
    {
      id: "verify", order: 6, label: "Receipt + verify",
      engine: "Signed evidence, public root and browser verifier",
      state: root.ok && count(root.body?.card_count) !== null && Array.isArray(root.body?.card_sha256) ? "AVAILABLE" : "UNCHECKABLE",
      source: "/root.json", href: "/dashboard?tab=verify",
      meaning: "Check the exact record, signature and public-root evidence. Verification is free and separate from invocation.",
      observed: {
        root_http: root.status,
        root_card_count: count(root.body?.card_count),
        root_as_of: root.body?.as_of ?? null,
      },
    },
    {
      id: "delivery", order: 7, label: "Delivery",
      engine: "Commission queue + settlement evidence",
      state: queue.ok && queue.body?.status === "MEASURED" && queueCount !== null
        ? queueCount && queueCount > 0 ? "OBSERVED" : "AVAILABLE"
        : "UNCHECKABLE",
      source: "/api/commission-queue", href: "/dashboard?tab=measured",
      meaning: "Settlement, queue acceptance, execution, delivery and buyer acceptance remain separate states.",
      observed: {
        queue_http: queue.status,
        queue_status: queue.body?.status ?? null,
        active_queue_count: queueCount,
        queued: count(queue.body?.queued),
      },
    },
    {
      id: "maintain", order: 8, label: "Maintain",
      engine: "Corrections + Claim Maintenance",
      state: corrections.ok && correctionCount !== null ? correctionCount > 0 ? "OBSERVED" : "AVAILABLE" : "UNCHECKABLE",
      source: "/api/corrections", href: "/claim-maintenance/",
      meaning: "Watch dependencies, preserve corrections and re-run only when a bounded change affects the maintained claim.",
      observed: { corrections_http: corrections.status, corrections_count: correctionCount },
    },
  ];

  return {
    schema: "csoai.product-flow/0.1",
    product: "Council of AI evidence lifecycle",
    doctrine: "measurement, never certification",
    contract: {
      one_product: "One customer journey over existing engines; no stage creates a second authority or duplicates its canonical subsystem.",
      order: "request -> evidence -> runtime -> measurement -> constitutional review -> receipt/verify -> delivery -> maintain",
      non_equivalences: [
        "request != payment", "payment != delivery", "runtime != measurement",
        "measurement != admission", "signature != certification",
        "publication != indexing", "first buyer != repeat buyer",
      ],
      job_state_rule: "Capability state never proves a specific customer job completed unless a request-bound receipt says so.",
    },
    stages,
    commercial: {
      source: "/api/revenue",
      http: revenue.status,
      status: oneNumber?.status ?? "UNCHECKABLE",
      distinct_nonself_payers: count(oneNumber?.all_time),
      last_30d: count(oneNumber?.last_30d),
      qualifying_settlements: count(oneNumber?.settlements),
      settled_usdc_atomic: count(oneNumber?.settled_usdc_atomic),
      repeat_nonself_payers: count(oneNumber?.repeat_nonself_payers?.all_time),
      repeat_buyer: "CUSTOMER_RELATIONSHIP_NOT_ESTABLISHED_BY_WALLET_COUNTS",
      meaning: "Commercial counters are demand evidence only; they do not alter measurement, admission, signature or delivery state.",
    },
    next_action: stages.find((stage) => stage.state === "HOLD")?.id ?? null,
  };
}

export const onRequestGet: PagesFunction = async ({ request }) =>
  responseJson(await buildProductFlow(new URL(request.url).origin));
