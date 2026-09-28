import { describe, expect, it } from "vitest";
import { collectOwnModelIdentifiers, publicView, redactOwnModelIdentifiers } from "./gspc";
import type { AxisScore } from "./_gspc_types";

describe("public GSPC model identifier disclosure", () => {
  it("omits an owned identifier from the excluded leader field", () => {
    const identifier = "council-governance-v3-light (council specialist)";
    const [axis] = publicView([{
      axis: "governance",
      kind: "model-comparison",
      status: "MEASURED",
      leader: identifier,
      n: 12,
      separation: "SEPARATED",
    } as AxisScore]);
    expect(axis.public_leader_state).toBe("EXCLUDED_OWN_MODEL");
    expect("excluded_leader" in axis).toBe(false);
    expect("leader" in axis).toBe(false);
  });

  it("redacts an owned identifier in nested prose and object keys, preserving external identifiers", () => {
    const owned = "council-safety-v3-light (council specialist)";
    const external = "mistral:7b";
    const source = {
      historical: { note: `Earlier result named ${owned}; comparison includes ${external}.` },
      model: { [owned]: owned, [external]: external },
    };
    const identifiers = collectOwnModelIdentifiers(source);
    expect(identifiers.has(owned)).toBe(true);
    const output = JSON.stringify(redactOwnModelIdentifiers(source, identifiers));
    expect(output).not.toContain(owned);
    expect(output).toContain("CSOAI-owned specialist");
    expect(output).toContain(external);
  });

  it("finds council-style identifiers embedded in source notes", () => {
    const ids = collectOwnModelIdentifiers({
      note: "historical lead: council-provenance-v3 (council specialist)",
      unrelated: "external mistral:7b leader",
    });
    expect([...ids]).toContain("council-provenance-v3 (council specialist)");
    expect([...ids]).not.toContain("mistral:7b");
  });
});
