import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { verifyX402Payment } from "./_x402";

const guide = readFileSync(new URL("../../public/x402-buyer-guide.html", import.meta.url), "utf8");

describe("x402 buyer guide commands", () => {
  it("sends its documented payment header to the actual payment parser", async () => {
    const headers = [...guide.matchAll(/curl -H "([^:"]+):/g)].map(match => match[1]);
    expect(headers.length).toBeGreaterThan(0);
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No network expected"));
    try {
      for (const header of headers) {
        const resource = "https://councilof.ai/api/eunomia-data?feed=1";
        const result = await verifyX402Payment(
          new Request(resource, { headers: { [header]: "not-a-payment" } }), {}, resource,
        );
        expect(result).toEqual({ ok: false, reason: "x-payment header is not a decodable x402 payload" });
      }
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      fetch.mockRestore();
    }
  });

  it("keeps the requested subject and purchase flag in the shell's bundle URL", () => {
    const block = guide.match(/<h3>"I need an EU AI Act Article 50 evidence bundle"<\/h3>\s*<pre><code>([\s\S]*?)<\/code>/)?.[1];
    expect(block).toBeTruthy();
    const commands = block!.replaceAll("&amp;", "&");
    // Intercept curl locally: this exercises shell parsing without a request or payment.
    const output = execFileSync("bash", ["-c", 'curl() { printf "%s\\n" "$@"; };\n' + commands], { encoding: "utf8" });
    const urls = output.trim().split("\n").map(value => new URL(value));
    expect(urls).toHaveLength(2);
    for (const url of urls) {
      expect(url.searchParams.get("obligation")).toBe("article-50");
      expect(url.searchParams.get("subject")).toBe("model-id");
    }
    expect(urls[0].searchParams.has("bundle")).toBe(false);
    expect(urls[1].searchParams.get("bundle")).toBe("1");
  });
});
