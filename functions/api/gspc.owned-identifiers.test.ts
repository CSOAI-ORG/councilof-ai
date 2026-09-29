import { beforeAll, describe, expect, it } from "vitest";
import { AXES_A } from "./_gspc_axes_a";
import { AXES_B } from "./_gspc_axes_b";
import { AXES_C } from "./_gspc_axes_c";
import { AXES_FIN } from "./_gspc_axes_fin";
import { MEASURED_ON } from "./_gspc_types";
import { MEASURED_IN_LANE } from "./_gspc_lane";
import { collectOwnModelIdentifiers, onRequestGet, redactOwnModelIdentifiers } from "./gspc";

async function servedBoard(): Promise<Record<string, any>> {
  (globalThis as unknown as { caches: unknown }).caches = {
    default: { match: async () => undefined, put: async () => undefined },
  };
  const response = await onRequestGet({
    request: new Request("https://councilof.ai/api/gspc"),
    env: {},
    waitUntil: () => undefined,
  } as unknown as Parameters<typeof onRequestGet>[0]);
  return (await response.json()) as Record<string, any>;
}

describe("GET /api/gspc: public owned-model identifiers", () => {
  let board: Record<string, any>;
  beforeAll(async () => {
    board = await servedBoard();
  });

  it("withholds internal identifiers from the complete public response", () => {
    const identifiers = collectOwnModelIdentifiers([AXES_A, AXES_B, AXES_C, AXES_FIN, MEASURED_ON, MEASURED_IN_LANE]);
    expect(identifiers.size).toBeGreaterThan(0);
    const serialized = JSON.stringify(board);
    for (const identifier of identifiers) expect(serialized).not.toContain(identifier);
    expect(board.public_model_identifier_policy).toMatch(/stable numbered aliases/i);
  });

  it("does not retain a raw identifier in the excluded-leader field", () => {
    const excluded = board.axes.filter((axis: Record<string, unknown>) => axis.public_leader_state === "EXCLUDED_OWN_MODEL");
    expect(excluded.length).toBeGreaterThan(0);
    for (const axis of excluded) expect(axis).not.toHaveProperty("excluded_leader");
  });

  it("rewrites identifier keys and longer identifiers before their prefixes", () => {
    const short = "council-private-fixture-v9";
    const long = "council-private-fixture-v99";
    const fixture = { [long]: { note: `seen ${short} and ${long}`, score: 0.75 } };
    const redacted = redactOwnModelIdentifiers(fixture, new Set([short, long])) as Record<string, any>;
    expect(redacted).toHaveProperty("CSOAI-owned specialist 2");
    expect(redacted["CSOAI-owned specialist 2"].score).toBe(0.75);
    expect(redacted["CSOAI-owned specialist 2"].note).toBe(
      `seen CSOAI-owned specialist 1 and CSOAI-owned specialist 2`,
    );
  });
});
