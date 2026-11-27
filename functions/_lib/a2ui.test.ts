import { describe, expect, it } from "vitest";
import {
  A2UI_BASIC_CATALOG,
  A2UI_STATUS,
  A2UI_VERSION,
  a2uiDescriptor,
  answerSurface,
  gspcSurface,
  serveA2uiRun,
} from "./a2ui";

describe("A2UI projection", () => {
  it("labels v1.0 as Candidate and exposes one source of truth", () => {
    const d = a2uiDescriptor("https://councilof.ai") as any;
    expect(d.version).toBe("v1.0");
    expect(d.status).toBe("Candidate");
    expect(d.source_of_truth.measurements).toBe(
      "https://councilof.ai/api/gspc",
    );
    expect(A2UI_VERSION).toBe("v1.0");
    expect(A2UI_STATUS).toBe("Candidate");
  });

  it("builds a single-message surface with the basic catalog", () => {
    const s = answerSurface(
      {
        kind: "answer",
        grounded: true,
        answer: "The tool said 12.",
        intent: "board",
        label: "Board",
        answered_by: "gspc_board",
        citations: [
          {
            tool: "gspc_board",
            record_id: "r1",
            url: "https://councilof.ai/api/gspc",
          },
        ],
      } as any,
      "what is measured?",
      "surface_test",
    ) as any;
    expect(Object.keys(s).sort()).toEqual(["createSurface", "version"]);
    expect(s.createSurface.surfaceId).toBe("surface_test");
    expect(s.createSurface.catalogId).toBe(A2UI_BASIC_CATALOG);
    expect(s.createSurface.components.some((x: any) => x.id === "root")).toBe(
      true,
    );
    expect(s.createSurface.dataModel.answer).toBe("The tool said 12.");
  });

  it("fails closed on missing input and does not call a paid tool before confirmation", async () => {
    const missing = await serveA2uiRun(
      new Request("https://councilof.ai/api/a2ui/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(missing.status).toBe(400);
    expect(missing.headers.get("x-csoai-a2ui-state")).toBe("needs_input");

    const paid = await serveA2uiRun(
      new Request("https://councilof.ai/api/a2ui/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: "commission a card for https://example.com/mcp",
        }),
      }),
    );
    expect(paid.status).toBe(200);
    expect(paid.headers.get("x-csoai-a2ui-state")).toBe("confirm_required");
    expect(await paid.text()).toContain("Confirmation required");
  });

  it("keeps unmeasured axes visible in the GSPC surface", () => {
    const s = gspcSurface(
      {
        axes: [
          { axis: "a", status: "MEASURED" },
          { axis: "b", status: "UNMEASURED" },
        ],
        totals: {},
      },
      "gspc_test",
    ) as any;
    expect(s.createSurface.dataModel.measured_axes).toEqual(["a"]);
    expect(s.createSurface.dataModel.unmeasured_axes).toEqual(["b"]);
    expect(s.createSurface.dataModel.empty).toContain("b");
  });
});

// ── Axis card through the run endpoint and the router (lane G4) ──
import { axisCardMessages, axisCardRequest } from "./a2ui";
import { routeIntent } from "./talkRouter";

const GOV = { axes: [{ axis: "governance", kind: "model-comparison", n: 237, accuracy: 0.5865, separation: "TIE", measurement_time: { observed_on: "2026-08-12" } }] };
const fakeFetch = (status: number, body: unknown): typeof fetch =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("axis card questions", () => {
  it("'how is the governance axis?' routes to the axis card with the canonical axis", () => {
    const q = "how is the governance axis?";
    expect(axisCardRequest(q, routeIntent(q))).toEqual({ requested: "governance" });
  });
  it("an axis-shaped question with an unknown name still gets a card, not a help text", () => {
    const q = "how is the banana axis?";
    expect(axisCardRequest(q, routeIntent(q))).toEqual({ requested: "banana" });
  });
  it("other questions are left to the existing answer path", () => {
    for (const q of ["what is measured", "verify a signed card", "hello"]) expect(axisCardRequest(q, routeIntent(q))).toBeNull();
  });
  it("reads the board at request time and returns v1.0 NDJSON-ready messages", async () => {
    const msgs = await axisCardMessages("governance", "https://councilof.ai", "v1.0", fakeFetch(200, GOV), Date.parse("2026-11-24T00:00:00Z"));
    expect(msgs).toHaveLength(1);
    expect((msgs[0] as any).createSurface.dataModel.separation_line).toBe("Separation: TIE");
  });
  it("a board answering 503 or throwing gives a read-failed card", async () => {
    for (const f of [fakeFetch(503, {}), (async () => { throw new Error("network down"); }) as unknown as typeof fetch]) {
      const msgs = await axisCardMessages("governance", "https://councilof.ai", "v0.9.1", f);
      const dm = (msgs[2] as any).updateDataModel.value;
      expect(dm.state).toBe("READ_FAILED");
    }
  });
});
