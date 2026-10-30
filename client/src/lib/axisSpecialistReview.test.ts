import { describe, expect, it, vi } from "vitest";
import BUNDLE from "../../../public/axis-specialists/bundle.json";
import { canonicalBytes, sha256Hex } from "../../../functions/_lib/cardSign";
import { buildChallenge } from "../../../functions/api/_hitl";
import { validateAxisSpecialistAudit } from "../components/gspc/CouncilAxisSpecialistPane";
import { acceptReviewChallenge, axisReviewRequest, submitAxisReview, verifyPinnedSpecialist } from "./axisSpecialistReview";

const { board } = vi.hoisted(() => ({ board: { axes: [] as any[] } }));
vi.mock("../../../functions/api/_chatCanon", () => ({ loadBoard: async () => board }));
import { onRequestPost } from "../../../functions/api/hitl";
import { listChallenges } from "../../../functions/api/_hitl";

const audit = () => validateAxisSpecialistAudit(structuredClone(BUNDLE.specialists[0]), BUNDLE.specialists[0].axis);
const request = () => axisReviewRequest(audit(), audit().improvement_proposals[0].id);
async function reply(input: Awaited<ReturnType<typeof request>>) {
  return { ...await buildChallenge({ ...input, at: "2026-10-30T08:00:00Z", required_module: null }), stored: true };
}
describe("axis review content and real handler handoff", () => {
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
  it.each(['proposal', 'row', 'charter', 'rehash'])('rejects altered %s before a submission can be prepared', async mode => {
    const value = audit();
    if (mode === 'row') value.source.axis_row.n += 1;
    else if (mode === 'charter') value.charter.articles.pop();
    else value.improvement_proposals[0].proposal = 'Publish immediately';
    if (mode === 'rehash') { const { audit_sha256, ...body } = value; value.audit_sha256 = await sha256Hex(canonicalBytes(body)); }
    await expect(verifyPinnedSpecialist(value)).rejects.toThrow('pinned version');
  });
  it('rejects a proposal from another axis', async () => {
    await expect(axisReviewRequest(audit(), 'safety-proposal-1')).rejects.toThrow('Choose a proposal');
  });
  it.each(['axis', 'source', 'facts', 'action', 'id', 'stored', 'decision'])('rejects a mismatched challenge %s', async mode => {
    const input = await request(); const value: any = await reply(input);
    if (mode === 'axis') value.axis = 'safety';
    if (mode === 'source') value.source = 'https://elsewhere.invalid';
    if (mode === 'facts') value.facts = '{}';
    if (mode === 'action') value.proposed_action = 'execute';
    if (mode === 'id') value.id = 'chl_0000000000000000';
    if (mode === 'stored') value.stored = 'true';
    if (mode === 'decision') value.decision = 'APPROVED';
    await expect(acceptReviewChallenge(value, input)).rejects.toThrow('outcome is unconfirmed');
  });
  it('keeps a stateless challenge distinct from a recorded one', async () => {
    const input = await request(); const value = { ...await reply(input), stored: false };
    expect((await acceptReviewChallenge(value, input)).stored).toBe(false);
  });
  it('never retries an unconfirmed write', async () => {
    const send = vi.fn(async () => { throw new Error('response lost after write'); });
    await expect(submitAxisReview(await request(), send)).rejects.toThrow('response lost');
    expect(send).toHaveBeenCalledTimes(1);
  });
  it('does not accept a successful-looking body behind HTTP 503', async () => {
    const input = await request(); const body = await reply(input);
    const send = vi.fn(async () => ({ response: new Response('', { status: 503 }), body }));
    await expect(submitAxisReview(input, send)).rejects.toThrow('not confirmed');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
