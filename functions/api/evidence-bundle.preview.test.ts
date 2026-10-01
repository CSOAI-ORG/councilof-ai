import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./evidence-bundle";

const ORIGIN = "https://councilof.ai";
const call = (url: string) => onRequestGet({ request: new Request(url), env: {} } as never);

afterEach(() => vi.unstubAllGlobals());

describe("evidence-bundle purchase preview scope", () => {
  it.each([
    { subject: "gpt-4o", count: 1 },
    { subject: "Qwen/Qwen3-4B", count: 0 },
    { subject: "vendor/model & version=2+#é", count: 1 },
    { subject: null, count: 2 },
  ])("keeps subject $subject when following the free preview link", async ({ subject, count }) => {
    const reads = vi.fn(async (input: string | URL | Request) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      if (url.href !== `${ORIGIN}/cards-bundle.json`) throw new Error(`Unexpected request: ${url}`);
      return Response.json({
        as_of: "2026-09-19T00:00:00Z",
        merkle_root: "r".repeat(64),
        cards: Object.fromEntries(["gpt-4o", "vendor/model & version=2+#é"].map((name, i) => {
          const sha = String(i + 1).repeat(64);
          return [sha, { card: { sha256: sha, sig_ed25519: "synthetic-signature", subject: name, surface: "gspc.behavioural", tags: ["gpai"] }, proof: [] }];
        })),
      });
    });
    vi.stubGlobal("fetch", reads);

    const purchase = new URL("/api/evidence-bundle?obligation=gpai&bundle=1", ORIGIN);
    if (subject !== null) purchase.searchParams.set("subject", subject);
    const challengeResponse = await call(purchase.href);
    expect(challengeResponse.status).toBe(402);
    const challenge = await challengeResponse.json();
    expect(challenge.csoai.preview.relevant_signed_cards).toBe(count);

    const previewUrl = new URL(challenge.csoai.free_preview);
    expect(previewUrl.origin).toBe(ORIGIN);
    expect(previewUrl.searchParams.get("obligation")).toBe("article-53");
    expect(previewUrl.searchParams.get("subject")).toBe(subject);
    expect(previewUrl.searchParams.has("bundle")).toBe(false);
    expect([...previewUrl.searchParams.keys()].sort()).toEqual(subject === null ? ["obligation"] : ["obligation", "subject"]);

    const previewResponse = await call(previewUrl.href);
    expect(previewResponse.status).toBe(200);
    const preview = await previewResponse.json();
    expect(preview).toMatchObject({ kind: "preview", ...challenge.csoai.preview });
    expect(preview.buy.resource).toBe(challenge.resource.url);
    // Both reads are only of the fixture corpus: no facilitator or payment request.
    expect(reads).toHaveBeenCalledTimes(2);
  });
});
