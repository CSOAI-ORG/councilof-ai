import { describe, expect, it } from "vitest";
import { CONTACT_MAX_BODY_BYTES, readBoundedContactBody } from "./_contact-body";

describe("bounded contact body reader", () => {
  it("accepts small valid JSON without changing its contents", async () => {
    const body = JSON.stringify({ name: "Synthetic", message: "Résumé — 你好" });
    const request = new Request("https://councilof.ai/api/contact", {
      method: "POST", headers: { "content-type": "application/json" }, body,
    });
    expect(await readBoundedContactBody(request)).toEqual({ state: "OK", text: body });
  });

  it("refuses an announced oversized body before reading it", async () => {
    let pulls = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new TextEncoder().encode("{}"));
        controller.close();
      },
    });
    const request = new Request("https://councilof.ai/api/contact", {
      method: "POST",
      headers: { "content-length": String(CONTACT_MAX_BODY_BYTES + 1) },
      body: stream, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect(await readBoundedContactBody(request)).toEqual({ state: "TOO_LARGE" });
    // Request runtimes may prefetch, but the route must never consume the full body.
    expect(pulls).toBeLessThanOrEqual(1);
  });

  it("cancels an indefinitely producing input stream as soon as the byte cap is crossed", async () => {
    let pulls = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        controller.enqueue(new Uint8Array(4096).fill(65));
      },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    const request = new Request("https://councilof.ai/api/contact", {
      method: "POST", headers: { "content-type": "application/json" },
      body: stream, duplex: "half",
    } as RequestInit & { duplex: "half" });

    const result = await readBoundedContactBody(request);
    expect(result.state).toBe("TOO_LARGE");
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThanOrEqual(10);
  });

  it("rejects invalid UTF-8 rather than silently modifying a submitted enquiry", async () => {
    const request = new Request("https://councilof.ai/api/contact", {
      method: "POST", body: Uint8Array.from([0xc3, 0x28]),
    });
    expect(await readBoundedContactBody(request)).toEqual({ state: "BAD_BODY" });
  });

  it("keeps the existing 8,500-character JSON boundary after the byte cap", async () => {
    const request = new Request("https://councilof.ai/api/contact", {
      method: "POST", body: "x".repeat(8501),
    });
    expect(await readBoundedContactBody(request)).toEqual({ state: "TOO_LARGE" });
  });
});
