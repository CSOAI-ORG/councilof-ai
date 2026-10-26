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
    const r = await call(`${ORIGIN}/api/evidence-bundle?obligation=article-50&subject=nobody&format=procurement`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.rows).toHaveLength(2);
    expect(b.rows.every((row: { status: string; relevant_signed_cards: number }) =>
      row.status === "UNMEASURED" && row.relevant_signed_cards === 0)).toBe(true);
    expect(b.corpus.signed_cards_total).toBe(2);
  });

  it("does not infer no measurements when the corpus HTTP read fails", async () => {
    const reads = vi.fn(async () => new Response("temporarily unavailable", { status: 503 }));
    vi.stubGlobal("fetch", reads);
    const r = await call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&subject=nobody&format=procurement`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.kind).toBe("procurement");
    expect(b.status).toBe("UNCHECKABLE");
    expect(b.error).toBe("corpus_unavailable");
    expect(b.rows).toEqual([]);
    expect(b.corpus.signed_cards_total).toBeNull();
    expect(b.corpus.read_from).toContain("HTTP 503");
    expect(JSON.stringify(b)).not.toContain("UNMEASURED");
    expect(b.price).toBeNull();
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: "missing cards", body: {} },
    { label: "array cards", body: { cards: [] } },
  ])("does not infer no measurements from a $label response", async ({ body }) => {
    const reads = vi.fn(async () => Response.json(body));
    vi.stubGlobal("fetch", reads);
    const r = await call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&format=procurement`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.status).toBe("UNCHECKABLE");
    expect(b.error).toBe("corpus_unavailable");
    expect(b.rows).toEqual([]);
    expect(b.corpus.signed_cards_total).toBeNull();
    expect(JSON.stringify(b)).not.toContain("UNMEASURED");
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it("keeps a successfully read empty corpus UNMEASURED", async () => {
    const reads = vi.fn(async () => Response.json({
      as_of: "2026-10-13T00:00:00Z",
      merkle_root: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      cards: {},
    }));
    vi.stubGlobal("fetch", reads);
    const r = await call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&format=procurement`);
    expect(r.status).toBe(200);
    const b = await r.json();
    expect(b.error).toBeUndefined();
    expect(b.rows).toHaveLength(2);
    expect(b.rows.every((row: { status: string; relevant_signed_cards: number }) =>
      row.status === "UNMEASURED" && row.relevant_signed_cards === 0)).toBe(true);
    expect(b.corpus.signed_cards_total).toBe(0);
    expect(b.price).toBeNull();
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it.each(["transport", "json"])("does not turn a %s read exception into a no-cards response", async (failure) => {
    const reads = vi.fn(async () => {
      if (failure === "transport") throw new Error("network unavailable");
      return new Response("{", { status: 200, headers: { "content-type": "application/json" } });
    });
    vi.stubGlobal("fetch", reads);
    await expect(call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&format=procurement`)).rejects.toThrow();
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it("refuses bundle=1 and non-EU-AI-Act obligations without any payment flow", async () => {
    vi.stubGlobal("fetch", corpus());
    expect((await call(`${ORIGIN}/api/evidence-bundle?obligation=gpai&bundle=1&format=procurement`)).status).toBe(400);
    expect((await call(`${ORIGIN}/api/evidence-bundle?obligation=dora&format=procurement`)).status).toBe(400);
  });
});
