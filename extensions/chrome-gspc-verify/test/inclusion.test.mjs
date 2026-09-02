/**
 * inclusion.test.mjs — the root-inclusion row. The merkle rule is the one in
 * scripts/publish_public_root.py (sha256(left||right), odd tail pairs with itself);
 * it is proven here against the committed public/root.json and a committed wrapper.
 * checkInclusion is exercised with an injected fetch so no test touches the network.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { merkleRootFromProof, checkInclusion, inclusionSha, STATES } from "../lib/gspcVerify.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "../../..");
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const root = readJson(path.join(REPO, "public/root.json"));

describe("merkle recompute against the committed root", () => {
  it("every committed wrapper's proof reproduces merkle_root", async () => {
    let checked = 0;
    for (let i = 0; i < root.card_sha256.length; i++) {
      const leaf = root.card_sha256[i];
      let w;
      try {
        w = readJson(path.join(REPO, "public/cards", `${leaf.slice(0, 16)}.json`));
      } catch {
        continue; // a wrapper may trail the root; the API says so too
      }
      expect(await merkleRootFromProof(leaf, i, w.proof), `leaf ${i}`).toBe(root.merkle_root);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
  });
  it("a wrong index does not reproduce the root", async () => {
    const leaf = root.card_sha256[0];
    const w = readJson(path.join(REPO, "public/cards", `${leaf.slice(0, 16)}.json`));
    expect(await merkleRootFromProof(leaf, 1, w.proof)).not.toBe(root.merkle_root);
  });
});

describe("checkInclusion — three states, injected fetch", () => {
  const leaf = root.card_sha256[2];
  const w = readJson(path.join(REPO, "public/cards", `${leaf.slice(0, 16)}.json`));
  const inclusionBody = { schema: "csoai.public-root-proof/0.1", kind: "inclusion", free: true, as_of: root.as_of, sha256: leaf, index: 2, proof: w.proof, merkle_root: root.merkle_root };

  it("inclusion whose path recomputes -> VALID", async () => {
    const r = await checkInclusion(leaf, async () => ({ status: 200, body: inclusionBody }));
    expect(r.state).toBe(STATES.VALID);
    expect(r.index).toBe(2);
  });
  it("inclusion whose path does NOT recompute -> INVALID even though the server said inclusion", async () => {
    const r = await checkInclusion(leaf, async () => ({ status: 200, body: { ...inclusionBody, merkle_root: "ab".repeat(32) } }));
    expect(r.state).toBe(STATES.INVALID);
  });
  it("not_found -> INVALID 'not a leaf' (the MCP verify_inclusion convention)", async () => {
    const r = await checkInclusion("00".repeat(32), async () => ({ status: 404, body: { error: "not_found", reason: "sha is not a leaf of the last published root", as_of: root.as_of } }));
    expect(r.state).toBe(STATES.INVALID);
    expect(r.reason).toMatch(/Not a leaf/);
  });
  it("network failure -> UNCHECKABLE, never INVALID", async () => {
    const r = await checkInclusion(leaf, async () => { throw new Error("offline"); });
    expect(r.state).toBe(STATES.UNCHECKABLE);
  });
  it("non-JSON body -> UNCHECKABLE", async () => {
    const r = await checkInclusion(leaf, async () => ({ status: 502, body: null }));
    expect(r.state).toBe(STATES.UNCHECKABLE);
  });
  it("no id -> UNCHECKABLE without any fetch", async () => {
    let called = false;
    const r = await checkInclusion(null, async () => { called = true; });
    expect(r.state).toBe(STATES.UNCHECKABLE);
    expect(called).toBe(false);
  });
  it("inclusionSha prefers the verified id, then a wrapper's card.sha256", () => {
    expect(inclusionSha({}, { id: "ab".repeat(32) })).toBe("ab".repeat(32));
    expect(inclusionSha({ card: { sha256: leaf }, proof: [] }, { id: null })).toBe(leaf);
    expect(inclusionSha({}, {})).toBeNull();
  });
});
