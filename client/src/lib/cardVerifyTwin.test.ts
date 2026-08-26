import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { canonicalPy, looksLikeCard, verifyCard } from "./cardVerify";
// The PUBLISHED verifier a stranger runs. Imported here on purpose: this suite's
// whole job is to prove the browser twin and the published Node original cannot
// drift apart. Its CLI block is guarded by an import.meta.url check and does not
// run under vitest.
// @ts-expect-error — plain .mjs with no types, deliberately dependency-free.
import { verifyCard as verifyCardPublished } from "../../../public/signed/verify-card.mjs";

const root = (p: string) => new URL(`../../../${p}`, import.meta.url);
const readJson = (p: string) => JSON.parse(readFileSync(root(p), "utf8"));

const index = readJson("public/signed/card_index.json");
const did = readJson("public/.well-known/did.json");

const CARD_KEY_ID = "did:web:csoai.org#card-attestation-1";

function pinnedKey(): Uint8Array {
  const m = did.verificationMethod.find((v: any) => v.id === CARD_KEY_ID);
  const b = atob(String(m.publicKeyJwk.x).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

/** Every card the PUBLISHED INDEX declares — never a directory listing. The
 *  repo carries more card files than the index names, and the index is the
 *  authority (BOARD-RULING.md: the verifiable floor is what the index contains). */
const declared: { card: string; axis: string }[] = index.cards;

const load = (id: string) => readJson(`public/signed/cards/${id}.json`);

describe("cardVerify (browser twin) — agreement with public/signed/verify-card.mjs", () => {
  it("the index declares the cards it says it declares", () => {
    expect(declared.length).toBe(index.n_cards);
    expect(declared.length).toBeGreaterThan(0);
  });

  it("VALIDATES every card the published index declares", async () => {
    const key = pinnedKey();
    const bad: string[] = [];
    for (const row of declared) {
      const r = await verifyCard(load(row.card), key);
      if (r.state !== "VALID") bad.push(`${row.card.slice(0, 12)} ${r.state} ${r.reason}`);
    }
    expect(bad).toEqual([]);
  });

  it("AGREES with the published Node verifier on every declared card", async () => {
    const key = pinnedKey();
    const disagree: string[] = [];
    for (const row of declared) {
      const card = load(row.card);
      const mine = await verifyCard(card, key);
      const theirs = await verifyCardPublished(card);
      if (mine.state !== theirs.state)
        disagree.push(`${row.card.slice(0, 12)}: browser=${mine.state} published=${theirs.state}`);
    }
    expect(disagree).toEqual([]);
  });

  it("says INVALID — not VALID — when a body is altered", async () => {
    const card = load(declared[0].card);
    const tampered = { ...card, body: { ...card.body, accuracy: 0.9999 } };
    const r = await verifyCard(tampered, pinnedKey());
    expect(r.state).toBe("INVALID");
    expect(r.reason).toMatch(/Id mismatch/);
  });

  it("says INVALID when the card is signed by an unpublished key", async () => {
    const card = load(declared[0].card);
    const foreign = { ...card, pubkey: "00".repeat(32) };
    const r = await verifyCard(foreign, pinnedKey());
    expect(r.state).toBe("INVALID");
    expect(r.reason).toMatch(/not did:web:csoai\.org#card-attestation-1/);
  });

  it("says UNCHECKABLE — never INVALID — when the pinned key cannot be read", async () => {
    const r = await verifyCard(load(declared[0].card), null);
    expect(r.state).toBe("UNCHECKABLE");
    expect(r.reason).toMatch(/could not be read/);
  });

  it("says UNCHECKABLE — never INVALID — for something that is not a card at all", async () => {
    for (const junk of [42, "hello", null, { foo: "bar" }, []]) {
      const r = await verifyCard(junk, pinnedKey());
      expect(r.state).toBe("UNCHECKABLE");
    }
  });

  it("renders a float of integral value the way CPython does, and only for float fields", () => {
    // The exact quirk that makes a naive JS verifier fail roughly a third of the set.
    expect(canonicalPy({ accuracy: 0 })).toBe('{"accuracy":0.0}');
    expect(canonicalPy({ n: 0 })).toBe('{"n":0}');
    expect(canonicalPy({ accuracy: 0.5 })).toBe('{"accuracy":0.5}');
  });

  it("escapes non-ASCII as CPython ensure_ascii=True does", () => {
    expect(canonicalPy({ axis: "café" })).toBe('{"axis":"caf\\u00e9"}');
  });

  it("recognises the card shape without asserting anything about it", () => {
    expect(looksLikeCard(load(declared[0].card))).toBe(true);
    expect(looksLikeCard({ content_id: "x", signature: "y" })).toBe(false);
  });
});
