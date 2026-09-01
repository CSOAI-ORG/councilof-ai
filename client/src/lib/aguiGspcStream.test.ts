import { describe, expect, it } from "vitest";
import {
  encodeAguiGspcSse,
  snapshotFromGspcPayload,
  toAguiGspcTextMessage,
  toAguiStateDelta,
  W3C_AGENT_CONFORMANCE_CG_DRAFT,
} from "./aguiGspcStream";

const FAKE_WIRE = {
  totals: {
    axes: 22,
    measured_axes: 15,
    unmeasured_axes: 7,
    public_count: "22 axis · 22 measured",
    count_grammar: "22 axis are on the board; 15 of them carry a measurement and 7 are declared slots.",
  },
  axes: [
    { axis: "governance", status: "MEASURED", family: "gspc", n: 237, accuracy: 0.7, separation: "SEPARATED" },
    { axis: "provenance-controls", status: "MEASURED", family: "financial", n: 6, accuracy: null, separation: null },
    { axis: "reserve-attestation", status: "UNMEASURED", family: "financial", n: 0, accuracy: null },
    { axis: "humanoid-labour-index", status: "UNMEASURED", family: "financial", n: null, accuracy: null },
  ],
};

describe("aguiGspcStream — live GSPC inside AG-UI streams", () => {
  it("snapshots wire totals and keeps empty visible without inventing scores", () => {
    const snap = snapshotFromGspcPayload(FAKE_WIRE);
    expect(snap.source).toBe("wire");
    expect(snap.public_count).toBe("22 axis · 22 measured");
    expect(snap.totals).toEqual({ axes: 22, measured_axes: 15, unmeasured_axes: 7 });
    expect(snap.measured.map((a) => a.axis)).toEqual(["governance", "provenance-controls"]);
    expect(snap.empty.map((a) => a.axis)).toEqual(["reserve-attestation", "humanoid-labour-index"]);
    // MEASURED financial with null accuracy stays null — never a fabricated 0.
    expect(snap.measured.find((a) => a.axis === "provenance-controls")?.accuracy).toBeNull();
  });

  it("emits STATE_DELTA under /gspc and TEXT_MESSAGE with empty names", () => {
    const snap = snapshotFromGspcPayload(FAKE_WIRE);
    const delta = toAguiStateDelta(snap);
    expect(delta.type).toBe("STATE_DELTA");
    expect(delta.delta[0]).toMatchObject({ op: "replace", path: "/gspc" });
    expect((delta.delta[0].value as any).empty).toHaveLength(2);

    const text = toAguiGspcTextMessage(snap);
    expect(text.type).toBe("TEXT_MESSAGE_CONTENT");
    expect(text.delta).toContain("22 axis · 22 measured");
    expect(text.delta).toContain("reserve-attestation");
    expect(text.delta).toMatch(/Not a certificate/);
    expect(text.delta).not.toMatch(/certif(?:ied|ication) by Council/i);
  });

  it("cites W3C Agent Conformance CG as draft opening only — no endorsement", () => {
    expect(W3C_AGENT_CONFORMANCE_CG_DRAFT).toBe("https://www.w3.org/community/agent-conformance/");
  });

  it("encodes SSE without inventing a 23rd axis or filling empties", () => {
    const sse = encodeAguiGspcSse(snapshotFromGspcPayload(FAKE_WIRE));
    expect(sse).toContain("event: STATE_DELTA");
    expect(sse).toContain("event: TEXT_MESSAGE_CONTENT");
    expect(sse).not.toMatch(/axis-23|fill empty|invent/i);
  });
});
