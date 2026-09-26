// 2026-09-26: /api/challenge answered stored:false while its words ("Challenge receipted.
// Resolution rows feed the Value Ledger when bound.") read as if the challenge were on file.
// Nothing is persisted. Every response must say so plainly and name the mailbox that does record one.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NOT_RECORDED, onRequestGet, onRequestPost } from "./challenge";

const post = (body: unknown) =>
  onRequestPost({
    request: new Request("https://councilof.ai/api/challenge", { method: "POST", body: JSON.stringify(body) }),
    env: {},
  } as unknown as Parameters<typeof onRequestPost>[0]);

describe("/api/challenge does not imply a challenge is recorded", () => {
  it("POST: stored and recorded are false, and the detail says not yet recorded + the mailbox", async () => {
    const r = await post({ targetType: "card", target: "abc", reason: "contended" });
    expect(r.status).toBe(202);
    const d = (await r.json()) as Record<string, unknown>;
    expect(d.stored).toBe(false);
    expect(d.recorded).toBe(false);
    expect(d.detail).toBe(NOT_RECORDED);
    expect(NOT_RECORDED).toMatch(/not yet recorded/i);
    expect(NOT_RECORDED).toContain("nicholas@csoai.org");
    expect(JSON.stringify(d)).not.toMatch(/Value Ledger|until KV binds/);
  });

  it("GET: the door description says the same", async () => {
    const r = await onRequestGet({ request: new Request("https://councilof.ai/api/challenge") } as unknown as Parameters<typeof onRequestGet>[0]);
    const d = (await r.json()) as Record<string, unknown>;
    expect(d.stored).toBe(false);
    expect(String(d.note)).toContain(NOT_RECORDED);
  });

  it("the /challenge page tells the reader it is not recorded and where to email", () => {
    const page = readFileSync(resolve(__dirname, "../../client/src/pages/Challenge.tsx"), "utf8");
    expect(page).toMatch(/not yet recorded/);
    expect(page).toContain("nicholas@csoai.org");
    expect(page).not.toMatch(/Submit a challenge \(signed receipt\)/);
  });

  it("/dispute claims no arbiter that does not exist", () => {
    const page = readFileSync(resolve(__dirname, "../../client/src/pages/Dispute.tsx"), "utf8");
    const copy = page.replace(/^\s*\/\/.*$/gm, "");
    expect(copy).not.toMatch(/neutral arbiter|decided by an arbiter/i);
    expect(copy).toMatch(/no independent arbiter yet/);
  });
});
