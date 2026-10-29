import { describe, expect, it, vi } from "vitest";
import governance from "../../../../public/axis-specialists/governance.json";
import INDEX from "../../../../public/axis-specialists/index.json";
import { loadAxisSpecialist, validateAxisSpecialistAudit } from "./CouncilAxisSpecialistPane";

const audit = () => structuredClone(governance);
const fetchReturning = (body: unknown, status = 200) =>
  vi.fn(async () => Response.json(body, { status })) as unknown as typeof fetch;

describe("Council axis specialist reader", () => {
  it("declares exactly 33 unique axes and reads only the selected same-origin endpoint", async () => {
    expect(INDEX.specialists).toHaveLength(33);
    expect(new Set(INDEX.specialists.map((item) => item.axis)).size).toBe(33);
    const fetcher = vi.fn(async () => Response.json(audit()));
    const result = await loadAxisSpecialist("governance", fetcher as unknown as typeof fetch);
    expect(result.axis).toBe("governance");
    expect(fetcher).toHaveBeenCalledWith("/api/axis-specialists/governance", { credentials: "omit" });
  });

  it("rejects unknown axes and path fragments before any fetch", async () => {
    const fetcher = vi.fn();
    for (const axis of ["not-an-axis", "../governance", "governance?x=1", "Governance", ""]) {
      await expect(loadAxisSpecialist(axis, fetcher as unknown as typeof fetch)).rejects.toThrow("exact GSPC axis");
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects cross-axis, wrong-cluster and open-gate responses", () => {
    const wrongAxis = audit();
    wrongAxis.axis = "safety";
    const wrongCluster = audit();
    wrongCluster.specialist.cluster_id = "meok-axis-safety";
    const openGate = audit();
    openGate.human_gate.decision = "APPROVED";
    const mayApply = audit();
    mayApply.human_gate.may_apply = true;
    for (const value of [wrongAxis, wrongCluster, openGate, mayApply]) {
      expect(() => validateAxisSpecialistAudit(value, "governance")).toThrow("Unsafe or mismatched");
    }
  });

  it("rejects applied proposals, provisioned-cluster claims and autonomous modes", () => {
    const applied = audit();
    applied.improvement_proposals[0].state = "APPLIED";
    const provisioned = audit();
    provisioned.specialist.cluster_state = "PROVISIONED";
    const autonomous = audit();
    autonomous.specialist.rsi_mode = "AUTONOMOUS";
    for (const value of [applied, provisioned, autonomous]) {
      expect(() => validateAxisSpecialistAudit(value, "governance")).toThrow("Unsafe or mismatched");
    }
  });

  it("does not turn an HTTP error into an audit", async () => {
    await expect(loadAxisSpecialist("governance", fetchReturning({ state: "NOT_FOUND" }, 404))).rejects.toThrow("HTTP 404");
  });
});
