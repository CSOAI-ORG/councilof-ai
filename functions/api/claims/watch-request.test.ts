import { describe, expect, it } from "vitest";
import { onRequestPost } from "./watch-request";

function ctx(body: unknown, kv?: Map<string, string>) {
  const LEADS = kv ? ({ put: async (k: string, v: string) => void kv.set(k, v) } as unknown as KVNamespace) : undefined;
  return {
    request: new Request("https://councilof.ai/api/claims/watch-request", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }),
    env: { LEADS },
  } as unknown as Parameters<typeof onRequestPost>[0];
}

describe("POST /api/claims/watch-request", () => {
  it("records a confirmed monthly request for review, and says it is not a schedule", async () => {
    const kv = new Map<string, string>();
    const r = await onRequestPost(ctx({ subject: "https://tandem.ac/mcp", cadence: "monthly", confirmed: true, requested_via: "gspc-panel" }, kv));
    expect(r.status).toBe(202);
    const b = await r.json();
    expect(b.state).toBe("RECEIVED_FOR_REVIEW");
    expect(b.note).toContain("not a schedule");
    expect([...kv.keys()][0]).toMatch(/^watch-request:/);
    expect(JSON.parse([...kv.values()][0]).subject).toBe("https://tandem.ac/mcp");
  });
  it("refuses an unconfirmed request", async () => {
    const r = await onRequestPost(ctx({ subject: "https://tandem.ac/mcp" }, new Map()));
    expect(r.status).toBe(400);
    expect((await r.json()).state).toBe("REJECTED");
  });
  it("answers NOT_RECORDED, never success, when no store is bound", async () => {
    const r = await onRequestPost(ctx({ subject: "llama3.2:3b", confirmed: true }));
    expect(r.status).toBe(503);
    expect((await r.json()).state).toBe("NOT_RECORDED");
  });
  it("rejects markup in the subject and other cadences", async () => {
    expect((await onRequestPost(ctx({ subject: "<script>", confirmed: true }, new Map()))).status).toBe(400);
    expect((await onRequestPost(ctx({ subject: "x", cadence: "hourly", confirmed: true }, new Map()))).status).toBe(400);
  });
});
