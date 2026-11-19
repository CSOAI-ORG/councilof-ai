import { afterEach, describe, expect, it, vi } from "vitest";
import { gpaiPreviewPath, loadGpaiPreview, normaliseGpaiSubject, parseGpaiPreview, PREVIEW_BYTE_LIMIT } from "./gpaiEvidencePreview";

function fixture(subject = "") {
  return {
    schema: "csoai.evidence-bundle/0.1", kind: "preview", subject: subject || null,
    obligation: { id: "article-53", counsel_confirmed: false, review_note: "Mapping review pending." },
    relevant_signed_cards: 1,
    corpus: { as_of: "2026-11-07T20:54:37Z", signed_cards_total: 10 },
    cards: [{ sha256: "a".repeat(64), subject: "Public provider evidence", as_of: "2026-10-01T02:03:04Z", url: "https://councilof.ai/cards/aaaaaaaaaaaaaaaa.json" }],
    buy: { resource: "https://councilof.ai/api/evidence-bundle?obligation=article-53&bundle=1" + (subject ? "&subject=" + encodeURIComponent(subject) : "") },
  };
}
afterEach(() => vi.unstubAllGlobals());

describe("the Article 53 preview is bound to its requested public scope", () => {
  it("constructs a free, unfiltered preview, never a purchase", () => {
    expect(gpaiPreviewPath("")).toBe("/api/evidence-bundle?obligation=article-53");
    expect(gpaiPreviewPath(" public & bundle=1 ")).toBe("/api/evidence-bundle?obligation=article-53&subject=public+%26+bundle%3D1");
  });
  it("bounds the subject without silently truncating it", () => {
    expect(normaliseGpaiSubject(" x ")).toBe("x");
    expect(normaliseGpaiSubject("x".repeat(120))).toHaveLength(120);
    expect(normaliseGpaiSubject("x".repeat(121))).toBeNull();
    expect(normaliseGpaiSubject("x\u0000y")).toBeNull();
    expect(() => gpaiPreviewPath("x".repeat(121))).toThrow();
  });
  it("reads actual counts and source dates without inventing freshness", () => {
    const view = parseGpaiPreview(fixture(), "");
    expect(view.count).toBe(1); expect(view.corpusDate).toBe("2026-11-07T20:54:37Z");
    expect(view.cards[0].asOf).toBe("2026-10-01T02:03:04Z");
    expect(view.counselConfirmed).toBe(false);
    expect(view.termsPath).toBe("/api/evidence-bundle?obligation=article-53&bundle=1");
  });
  it("retains subject and request binding across encoded characters", () => {
    const subject = "Qwen / model & public";
    const result = parseGpaiPreview(fixture(subject), subject);
    expect(new URL(result.termsPath, "https://councilof.ai").searchParams.get("subject")).toBe(subject);
  });
  it("represents readable zero as empty, not as failed retrieval", () => {
    const data = { ...fixture("missing"), relevant_signed_cards: 0, cards: [], available_subjects: ["Known provider", "Known provider", "", "x".repeat(121)] };
    const result = parseGpaiPreview(data, "missing");
    expect(result.count).toBe(0); expect(result.availableSubjects).toEqual(["Known provider"]);
  });
  it.each([null, [], "", {}, { ...fixture(), schema: "another" }, { ...fixture(), kind: "bundle" }])("refuses a non-preview envelope: %j", value => {
    expect(() => parseGpaiPreview(value, "")).toThrow();
  });
  it("refuses missing, failed or differently scoped corpus observations", () => {
    for (const bad of [
      { ...fixture(), status: "UNCHECKABLE" }, { ...fixture(), error: "corpus_unavailable" },
      { ...fixture(), corpus: { signed_cards_total: null, read_state: "UNCHECKABLE" } },
      { ...fixture(), subject: "different" }, { ...fixture(), obligation: { id: "article-50" } },
    ]) expect(() => parseGpaiPreview(bad, "")).toThrow();
  });
  it.each([null, "1", true, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN])("refuses an unqualified record count: %s", value => {
    expect(() => parseGpaiPreview({ ...fixture(), relevant_signed_cards: value }, "")).toThrow();
  });
  it("refuses contradictory totals or missing/truncated response records", () => {
    expect(() => parseGpaiPreview({ ...fixture(), corpus: { signed_cards_total: 0 } }, "")).toThrow();
    expect(() => parseGpaiPreview({ ...fixture(), cards: [] }, "")).toThrow();
    expect(() => parseGpaiPreview({ ...fixture(), cards: null }, "")).toThrow();
  });
  it("preserves absent and invalid dates as unknown", () => {
    for (const value of [null, undefined, "today", "2026-02-30T00:00:00Z", "2026-13-01T00:00:00Z"]) {
      expect(parseGpaiPreview({ ...fixture(), corpus: { signed_cards_total: 10, as_of: value } }, "").corpusDate).toBeNull();
    }
  });
  it("does not coerce counsel claims into booleans", () => {
    expect(parseGpaiPreview({ ...fixture(), obligation: { id: "article-53", counsel_confirmed: "true" } }, "").counselConfirmed).toBeNull();
  });
  it.each([
    "https://elsewhere.example/api/evidence-bundle?obligation=article-53&bundle=1",
    "javascript:alert(1)", "//elsewhere.example/pay",
    "https://user:pass@councilof.ai/api/evidence-bundle?obligation=article-53&bundle=1",
    "https://councilof.ai/api/other?obligation=article-53&bundle=1",
    "https://councilof.ai/api/evidence-bundle?obligation=article-50&bundle=1",
    "https://councilof.ai/api/evidence-bundle?obligation=article-53&bundle=1&subject=changed",
    "https://councilof.ai/api/evidence-bundle?obligation=article-53&bundle=1&invoice=gbp",
    "https://councilof.ai/api/evidence-bundle?obligation=article-53&bundle=1&bundle=0",
    "https://councilof.ai/api/evidence-bundle?obligation=article-53&bundle=1#changed",
  ])("refuses an altered terms destination: %s", resource => {
    expect(() => parseGpaiPreview({ ...fixture(), buy: { resource } }, "")).toThrow();
  });
  it("refuses card links that are not the named published record", () => {
    const row = fixture().cards[0];
    for (const url of ["https://elsewhere.example/cards/aaaaaaaaaaaaaaaa.json", "/cards/bbbbbbbbbbbbbbbb.json", row.url + "?private=1", row.url + "#x"]) {
      expect(() => parseGpaiPreview({ ...fixture(), cards: [{ ...row, url }] }, "")).toThrow();
    }
  });
  it("refuses duplicate record identities and malformed digests", () => {
    const row = fixture().cards[0];
    expect(() => parseGpaiPreview({ ...fixture(), relevant_signed_cards: 2, cards: [row, row] }, "")).toThrow();
    expect(() => parseGpaiPreview({ ...fixture(), cards: [{ ...row, sha256: "bad" }] }, "")).toThrow();
  });
});

describe("bounded read-only preview transport", () => {
  const signal = () => new AbortController().signal;
  it("performs one anonymous GET with no payment material", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(fixture("public")), { headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await loadGpaiPreview("public", signal())).count).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/evidence-bundle?obligation=article-53&subject=public");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: "GET", credentials: "omit", cache: "no-store", redirect: "error", headers: { accept: "application/json" } });
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty("body");
  });
  it("rejects HTTP failures instead of displaying a zero", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503, headers: { "content-type": "application/json" } })));
    await expect(loadGpaiPreview("", signal())).rejects.toThrow("PREVIEW_UNAVAILABLE");
  });
  it("rejects an HTML fallback even with HTTP 200", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>fallback</html>", { headers: { "content-type": "text/html" } })));
    await expect(loadGpaiPreview("", signal())).rejects.toThrow("PREVIEW_UNAVAILABLE");
  });
  it("rejects excessive declared size before parsing", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { headers: { "content-type": "application/json", "content-length": String(PREVIEW_BYTE_LIMIT + 1) } })));
    await expect(loadGpaiPreview("", signal())).rejects.toThrow("PREVIEW_TOO_LARGE");
  });
  it("enforces the streamed byte bound without relying on headers", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(" ".repeat(PREVIEW_BYTE_LIMIT + 1), { headers: { "content-type": "application/json" } })));
    await expect(loadGpaiPreview("", signal())).rejects.toThrow("PREVIEW_TOO_LARGE");
  });
  it("rejects malformed JSON and never retries", async () => {
    const mock = vi.fn().mockResolvedValue(new Response("{bad", { headers: { "content-type": "application/json" } })); vi.stubGlobal("fetch", mock);
    await expect(loadGpaiPreview("", signal())).rejects.toThrow(); expect(mock).toHaveBeenCalledTimes(1);
  });
  it("passes cancellation through and never retries", async () => {
    const control = new AbortController(); control.abort();
    const mock = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")); vi.stubGlobal("fetch", mock);
    await expect(loadGpaiPreview("", control.signal)).rejects.toThrow();
    expect(mock.mock.calls[0][1].signal).toBe(control.signal); expect(mock).toHaveBeenCalledTimes(1);
  });
});
