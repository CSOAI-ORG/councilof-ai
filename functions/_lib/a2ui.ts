/**
 * A2UI v1.0 Candidate projection for Council OS.
 * It reuses the same router and living GSPC source as MCP, A2A, chat and AG-UI.
 */
import { executePlan, routeIntent, type TalkAnswer } from "./talkRouter";
import { isConfirmed, lastUserText, paidToolsIn } from "./aguiRun";

type Json = Record<string, unknown>;

export const A2UI_VERSION = "v1.0";
export const A2UI_STATUS = "Candidate";
export const A2UI_BASIC_CATALOG =
  "https://a2ui.org/specification/v1_0/catalogs/basic/catalog.json";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "accept, content-type",
};

function text(id: string, value: unknown, variant?: string): Json {
  return {
    id,
    component: "Text",
    text: String(value ?? ""),
    ...(variant ? { variant } : {}),
  };
}

export function a2uiDescriptor(origin: string): Json {
  return {
    schema: "csoai.a2ui/0.1",
    protocol: "A2UI",
    version: A2UI_VERSION,
    status: A2UI_STATUS,
    endpoint: origin + "/api/a2ui/run",
    method: "POST",
    input: "{message:string} or AG-UI-shaped messages plus forwardedProps",
    response: "application/x-ndjson; one A2UI envelope per line",
    surfaces: {
      gspc: origin + "/api/a2ui/gspc",
      run: origin + "/api/a2ui/run",
    },
    source_of_truth: {
      measurements: origin + "/api/gspc",
      mcp: origin + "/mcp",
    },
    safety:
      "Paid x402 tools require explicit confirmation and this server never supplies payment.",
    note: "A2UI v1.0 is a Candidate protocol. This is a CSOAI projection, not an A2UI-project endorsement.",
  };
}

export function answerSurface(
  answer: TalkAnswer,
  question: string,
  surfaceId?: string,
): Json {
  const sid = surfaceId || "csoai_" + crypto.randomUUID();
  const citations = Array.isArray(answer.citations) ? answer.citations : [];
  const citationIds = citations.map((_, i) => "source_" + (i + 1));
  const children = ["title", "state", "answer"].concat(
    citationIds.length ? ["sources_title"].concat(citationIds) : [],
  );
  const components: Json[] = [
    { id: "root", component: "Column", children },
    text("title", "Council OS answer", "headline"),
    text(
      "state",
      answer.grounded
        ? "Grounded by " +
            (answer.answered_by || answer.label || "a named tool")
        : "State: " + (answer.kind || "unmeasured"),
      "caption",
    ),
    { id: "answer", component: "Text", text: { path: "/answer" } },
  ];
  if (citationIds.length) {
    components.push(text("sources_title", "Sources", "caption"));
    citations.forEach((c, i) => {
      const bits = [c.tool, c.record_id, c.url].filter(Boolean);
      components.push(text(citationIds[i], bits.join(" · ")));
    });
  }
  return {
    version: A2UI_VERSION,
    createSurface: {
      surfaceId: sid,
      catalogId: A2UI_BASIC_CATALOG,
      sendDataModel: false,
      components,
      dataModel: {
        question,
        answer: answer.answer,
        grounded: answer.grounded,
        kind: answer.kind,
        intent: answer.intent,
        answered_by: answer.answered_by,
        citations,
      },
    },
  };
}

export function messageSurface(
  title: string,
  message: string,
  state: string,
  surfaceId?: string,
): Json {
  const sid = surfaceId || "csoai_" + crypto.randomUUID();
  return {
    version: A2UI_VERSION,
    createSurface: {
      surfaceId: sid,
      catalogId: A2UI_BASIC_CATALOG,
      sendDataModel: false,
      components: [
        {
          id: "root",
          component: "Column",
          children: ["title", "state", "message"],
        },
        text("title", title, "headline"),
        text("state", state, "caption"),
        { id: "message", component: "Text", text: { path: "/message" } },
      ],
      dataModel: { message, state },
    },
  };
}

export function gspcSurface(raw: unknown, surfaceId?: string): Json {
  const sid = surfaceId || "gspc_" + crypto.randomUUID();
  const j = raw && typeof raw === "object" ? (raw as any) : {};
  const axes = Array.isArray(j.axes) ? j.axes : [];
  const measured = axes.filter((x: any) => x?.status === "MEASURED");
  const unmeasured = axes.filter((x: any) => x?.status !== "MEASURED");
  const totals = j.totals && typeof j.totals === "object" ? j.totals : {};
  const publicCount =
    typeof totals.public_count === "string" && totals.public_count.trim()
      ? totals.public_count.trim()
      : String(axes.length) +
        " axis · " +
        String(measured.length) +
        " measured";
  const emptyNames = unmeasured
    .map((x: any) => String(x?.axis || ""))
    .filter(Boolean);
  return {
    version: A2UI_VERSION,
    createSurface: {
      surfaceId: sid,
      catalogId: A2UI_BASIC_CATALOG,
      sendDataModel: false,
      components: [
        {
          id: "root",
          component: "Column",
          children: ["title", "summary", "empty_title", "empty", "source"],
        },
        text("title", "Living GSPC state", "headline"),
        { id: "summary", component: "Text", text: { path: "/summary" } },
        text("empty_title", "Unmeasured stays visible", "caption"),
        { id: "empty", component: "Text", text: { path: "/empty" } },
        text(
          "source",
          "Source: GET /api/gspc · measurement, not certification.",
          "caption",
        ),
      ],
      dataModel: {
        summary: publicCount,
        measured_axes: measured.map((x: any) => x.axis),
        unmeasured_axes: emptyNames,
        empty: emptyNames.join(", ") || "(none)",
        source: "/api/gspc",
      },
    },
  };
}

export function ndjsonResponse(
  messages: Json[],
  status = 200,
  extra: HeadersInit = {},
): Response {
  const body = messages.map((m) => JSON.stringify(m)).join("\n") + "\n";
  return new Response(body, {
    status,
    headers: {
      ...CORS,
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-csoai-a2ui": A2UI_VERSION,
      ...extra,
    },
  });
}

export async function serveA2uiRun(request: Request): Promise<Response> {
  const origin = new URL(request.url).origin;
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: CORS });
  if (request.method === "GET" || request.method === "HEAD")
    return Response.json(a2uiDescriptor(origin), {
      headers: { ...CORS, "cache-control": "no-store" },
    });
  if (request.method !== "POST")
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: CORS },
    );

  let body: Json = {};
  try {
    const x = await request.json();
    body = x && typeof x === "object" && !Array.isArray(x) ? (x as Json) : {};
  } catch {
    body = {};
  }
  const question = lastUserText(body);
  if (!question.trim()) {
    return ndjsonResponse(
      [
        messageSurface(
          "Input needed",
          "Send a message string or a user message in messages.",
          "needs_input",
        ),
      ],
      400,
      { "x-csoai-a2ui-state": "needs_input" },
    );
  }

  try {
    const plan = routeIntent(question);
    const paid = paidToolsIn(plan);
    if (paid.length && !isConfirmed(body, paid)) {
      return ndjsonResponse(
        [
          messageSurface(
            "Confirmation required",
            "I have not called " +
              paid.join(", ") +
              ". Confirm the paid tool to fetch its x402 challenge. This server never pays from your wallet.",
            "confirm_required",
          ),
        ],
        200,
        { "x-csoai-a2ui-state": "confirm_required" },
      );
    }
    const answer = await executePlan(plan, origin);
    return ndjsonResponse([answerSurface(answer, question)], 200, {
      "x-csoai-a2ui-state": answer.grounded
        ? "grounded"
        : answer.kind || "unmeasured",
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return ndjsonResponse([messageSurface("Run error", detail, "error")], 500, {
      "x-csoai-a2ui-state": "error",
    });
  }
}
