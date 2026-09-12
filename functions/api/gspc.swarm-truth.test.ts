import { describe, expect, it } from "vitest";
import { AXES_B } from "./_gspc_axes_b";

describe("swarm public statistical truth", () => {
  const swarm = AXES_B.find((axis) => axis.axis === "swarm");

  it("publishes the signed point leader without inventing separation", () => {
    expect(swarm).toBeDefined();
    expect(swarm?.accuracy).toBe(0.4444);
    expect(swarm?.leader).toContain("qwen2.5:7b");
    expect(swarm?.separation).toBe("UNTESTED");
  });

  it("records why the previous runner-up comparison cannot stand", () => {
    expect(swarm?.separation_basis).toContain("qwen3:4b 0.4070");
    expect(swarm?.separation_basis).toContain("mistral was not the runner-up");
    expect(swarm?.separation_basis).not.toContain("lower bound 0.384 clears");
  });
});
