import { describe, expect, it } from "vitest";
import { validateSovGateReply } from "./_chatGrounded";

const good = {
  state: "cognition_complete",
  governed: true,
  message: { role: "assistant", content: " governed answer " },
  route_receipt: {
    route_type: "cognition",
    planes: ["meok", "oowm", "sovos"],
    reason: "canonical_route:cognition",
    effect: "read_only",
    consequential: false,
  },
};

describe("private SOV gate reply validation", () => {
  it("accepts only the canonical read-only cognition envelope", () => {
    expect(validateSovGateReply(good)).toEqual({ content: "governed answer" });
  });

  it.each([
    ["not governed", { ...good, governed: false }],
    ["wrong state", { ...good, state: "model_response" }],
    ["wrong route", { ...good, route_receipt: { ...good.route_receipt, route_type: "consequential_action" } }],
    ["write effect", { ...good, route_receipt: { ...good.route_receipt, effect: "external_write" } }],
    ["consequential", { ...good, route_receipt: { ...good.route_receipt, consequential: true } }],
    ["wrong planes", { ...good, route_receipt: { ...good.route_receipt, planes: ["meok", "sovos"] } }],
    ["empty answer", { ...good, message: { role: "assistant", content: " " } }],
  ])("rejects %s", (_name, value) => {
    expect(validateSovGateReply(value)).toBeNull();
  });
});
