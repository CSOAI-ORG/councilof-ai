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
