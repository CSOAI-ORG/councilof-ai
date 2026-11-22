import { describe, expect, it } from "vitest";
import { cleanEmail, cleanOptionalField, readIntakeJson } from "./_bounded-lead-body";

describe("bounded public lead/subscription intake", () => {
  it("reads a normal JSON object without losing Unicode", async () => {
    const body = JSON.stringify({ email: "reader@example.org", message: "Résumé — 你好" });
    const req = new Request("https://councilof.ai/api/lead", {
      method: "POST", headers: { "content-type": "application/json" }, body,
    });
    expect(await readIntakeJson(req, 8192)).toEqual({ ok: true, body: JSON.parse(body) });
  });

  it("rejects wrong MIME and non-object JSON", async () => {
    const wrong = new Request("https://councilof.ai/api/lead", {
      method: "POST", headers: { "content-type": "text/application/json-bogus" }, body: "{}",
    });
    expect((await readIntakeJson(wrong, 8192)).ok).toBe(false);
    const array = new Request("https://councilof.ai/api/lead", {
      method: "POST", headers: { "content-type": "application/json" }, body: "[]",
    });
    expect(await readIntakeJson(array, 8192)).toEqual({ ok: false, status: 400, error: "JSON object required" });
  });

  it("cuts off an endless 4 KiB stream before 8 KiB intake is exceeded", async () => {
    let cancelled = false;
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) { pulls++; controller.enqueue(new Uint8Array(4096).fill(65)); },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    const req = new Request("https://councilof.ai/api/lead", {
      method: "POST", headers: { "content-type": "application/json" },
      body, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect(await readIntakeJson(req, 8192)).toMatchObject({ ok: false, status: 413 });
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThanOrEqual(4);
  });

  it("refuses a claimed overlimit body before waiting for the stream", async () => {
    const req = new Request("https://councilof.ai/api/lead", {
      method: "POST", headers: { "content-type": "application/json", "content-length": "99999" },
      body: "{}",
    });
    expect(await readIntakeJson(req, 8192)).toMatchObject({ ok: false, status: 413 });
  });

  it("rejects invalid UTF-8, injected controls, and truncated email addresses", async () => {
    const bad = new Request("https://councilof.ai/api/lead", {
      method: "POST", headers: { "content-type": "application/json" },
      body: new Uint8Array([0xc3, 0x28]),
    });
    expect(await readIntakeJson(bad, 8192)).toMatchObject({ ok: false, status: 400 });
    expect(cleanEmail("a".repeat(300) + "@example.com")).toBeNull();
    expect(cleanOptionalField("line\nbreak", 160)).toBeNull();
  });
});
