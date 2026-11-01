import { describe, expect, it, vi } from "vitest";
import BUNDLE from "../../public/axis-specialists/bundle.json";
import { validateAxisSpecialistAudit } from "../../client/src/components/gspc/CouncilAxisSpecialistPane";
import { axisReviewRequest, submitAxisReview } from "../../client/src/lib/axisSpecialistReview";

const { board } = vi.hoisted(() => ({ board: { axes: [] as any[] } }));
vi.mock("./_chatCanon", () => ({ loadBoard: async () => board }));
import { onRequestPost } from "./hitl";
import { listChallenges } from "./_hitl";

describe("axis-specialist real handler handoff", () => {
  it("hands all 33 axes to the existing challenge handler with exact bindings and no decision", async () => {
    board.axes = BUNDLE.specialists.map(item => item.source.axis_row);
    const values = new Map<string, string>();
    const store = {
      put: async (key: string, value: string) => { values.set(key, value); },
      get: async (key: string) => values.get(key) ?? null,
      list: async ({ prefix }: { prefix: string }) => ({ keys: [...values.keys()].filter(key => key.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
    };
    for (const source of BUNDLE.specialists) {
      const value = validateAxisSpecialistAudit(source, source.axis);
      const input = await axisReviewRequest(value, value.improvement_proposals[0].id);
      const send = async (url: string, init?: RequestInit) => {
        const response = await onRequestPost({ request: new Request(`https://fixture.invalid${url}`, init), env: { HITL_KV: store } } as any);
        return { response, body: await response.json() };
      };
      const result = await submitAxisReview(input, send);
      expect(result).toMatchObject({ axis: source.axis, stored: true, subject: input.subject, proposed_action: input.proposed_action, facts: input.facts });
      expect(result).not.toHaveProperty('decision');
    }
    expect(await listChallenges(store as any)).toHaveLength(33);
    expect([...values.keys()].every(key => key.startsWith('hitl:challenge:'))).toBe(true);
  });
});
