/**
 * Pasting a bare card id into the verifier (tools audit, 6 Oct 2026).
 *
 * The id was parsed as JSON and came back UNCHECKABLE ("Not valid JSON"), with "Last verified"
 * printed beside it. Now the form fetches /signed/cards/<id>.json and checks those bytes; an id the
 * store does not have gets a plain "not in the signed card index" answer, and nothing is checked.
 */
import { describe, expect, it, vi } from "vitest";
import { BARE_CARD_ID, NOT_IN_INDEX, fetchSignedCard, verifyTiles } from "./RecordVerifyForm";

const ID = "82994353b8f94337746ddf73700b0edc425d695d43910dbfeb53d118d5a09a1c";

function fakeFetch(status: number, body: string, contentType: string) {
  return vi.fn(async () => new Response(body, { status, headers: { "content-type": contentType } })) as unknown as typeof fetch;
}

describe("RecordVerifyForm — a bare card id", () => {
  it("recognises a bare 64-hex id (with or without sha256:) and nothing else", () => {
    expect(ID.match(BARE_CARD_ID)?.[1]).toBe(ID);
    expect(`sha256:${ID.toUpperCase()}`.match(BARE_CARD_ID)?.[1]).toBe(ID.toUpperCase());
    expect(`{"id":"${ID}"}`.match(BARE_CARD_ID)).toBeNull();
    expect(ID.slice(1).match(BARE_CARD_ID)).toBeNull();
  });

  it("fetches the signed card's own bytes, unaltered, from /signed/cards/<id>.json", async () => {
    const body = `{"body":{"x":1},"id":"${ID}"}`;
    const f = fakeFetch(200, body, "application/json");
    const r = await fetchSignedCard(ID.toUpperCase(), f);
    expect(f).toHaveBeenCalledWith(`/signed/cards/${ID}.json`, expect.anything());
    expect(r).toEqual({ state: "found", id: ID, url: `/signed/cards/${ID}.json`, text: body });
  });

  it("a 404, or a dev server's HTML fallback, is 'not in the index', never a check result", async () => {
    expect((await fetchSignedCard(ID, fakeFetch(404, "<!doctype html>", "text/html"))).state).toBe("not_found");
    expect((await fetchSignedCard(ID, fakeFetch(200, "<!doctype html>", "text/html; charset=utf-8"))).state).toBe("not_found");
    expect(NOT_IN_INDEX).toMatch(/not in the signed card index/);
    expect(NOT_IN_INDEX).toMatch(/paste its full text/);
  });

  it("a network failure is reported as an error, not as a missing card", async () => {
    const f = vi.fn(async () => {
      throw new Error("offline");
    }) as unknown as typeof fetch;
    expect(await fetchSignedCard(ID, f)).toMatchObject({ state: "error", error: "offline" });
    expect((await fetchSignedCard(ID, fakeFetch(503, "down", "text/plain"))).state).toBe("error");
  });
});

// Tools audit retest, 6 Oct 2026: a checked record had no tiles and opened on hashes.
describe("a checked record's tiles", () => {
  it("shows checks passed, then what the card says, and leaves out what it does not carry", () => {
    expect(
      verifyTiles({ model: "qwen3:8b", axis: "safety", accuracy: "0.857", created: "2026-09-22", own: false }, "5/5"),
    ).toEqual([
      { label: "Checks passed", value: "5/5" },
      { label: "Model", value: "qwen3:8b" },
      { label: "Test", value: "safety" },
      { label: "Score", value: "85.7%" },
      { label: "Recorded", value: "2026-09-22" },
    ]);
    expect(verifyTiles({ model: "model not recorded", axis: "not recorded", accuracy: "not recorded", created: "not recorded", own: false }, null)).toEqual([]);
    expect(verifyTiles(null, "0/1")).toEqual([{ label: "Checks passed", value: "0/1" }]);
  });
});
