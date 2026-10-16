import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "./evidence-bundle";

const ORIGIN = "https://councilof.ai";
const call = (url: string) => onRequestGet({ request: new Request(url), env: {} } as never);
afterEach(() => vi.unstubAllGlobals());

function corpus() {
  const mk = (n: string, subject: string, tags: string[]) => {
    const sha = n.repeat(64);
    return [sha, { card: { sha256: sha, sig_ed25519: "synthetic-signature", subject, surface: "gspc.behavioural", tags }, proof: [] }];
  };
  return vi.fn(async () => Response.json({
    as_of: "2026-10-13T00:00:00Z",
    merkle_root: "f".repeat(64),
    cards: Object.fromEntries([mk("1", "gpt-4o", ["gpai"]), mk("2", "c2pa marking", ["art50"])]),
  }));
}

describe("evidence-bundle format=procurement", () => {
  it("folds the Article 50 pack into the GPAI pack, free, no price, no certifying", async () => {
    const reads = corpus();
    vi.stubGlobal("fetch", reads);
    const r = await call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&format=procurement`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("procurement");
    expect(b.price).toBeNull();
    expect(b.rows.map((x: { obligation_id: string }) => x.obligation_id)).toEqual(["article-53", "article-50"]);
    expect(b.rows[0].status).toBe("MEASURED");
    expect(b.rows[1].relevant_signed_cards).toBe(1);
    expect(b.pack.folded[0].href).toBe(`${ORIGIN}/packs/eu-article-50`);
    const text = JSON.stringify(b);
    expect(text).not.toMatch(/\bcertified by|\bcompliant\b|accepts|x402Version/);
    expect(text).toContain("not a notified body");
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it("reports UNMEASURED for a subject with no cards", async () => {
    vi.stubGlobal("fetch", corpus());
    const b = await (await call(`${ORIGIN}/api/evidence-bundle?obligation=article-50&subject=nobody&format=procurement`)).json();
    expect(b.rows.every((x: { status: string }) => x.status === "UNMEASURED")).toBe(true);
  });

  it("refuses bundle=1 and non-EU-AI-Act obligations without any payment flow", async () => {
    vi.stubGlobal("fetch", corpus());
    expect((await call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&bundle=1&format=procurement`)).status).toBe(400);
    expect((await call(`${ORIGIN}/api/evidence-bundle?obligation=dora&format=procurement`)).status).toBe(400);
  });
});
