import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isPublicRoot, merkleRootOf, verifyPublicRoot } from "./publicRootVerify";

const root = () => JSON.parse(readFileSync(new URL("../../public/root.json", import.meta.url), "utf8"));

describe("publicRootVerify — the committed root and its tamper controls", () => {
  it("recognises the family by kind + merkle_root, nothing else", () => {
    expect(isPublicRoot(root())).toBe(true);
    expect(isPublicRoot({ kind: "csoai.public-root/v1" })).toBe(false);
    expect(isPublicRoot({ merkle_root: "ab" })).toBe(false);
    expect(isPublicRoot(null)).toBe(false);
  });

  it("merkleRootOf reproduces publish_public_root.py: odd node paired with itself, empty list = sha256('')", async () => {
    const r = root();
    expect(await merkleRootOf(r.card_sha256)).toBe(r.merkle_root);
    expect(await merkleRootOf([])).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    // CVE-2012-2459 twin: [A,B,C] and [A,B,C,C] share a root — which is why card_count is checked.
    const a = "a".repeat(64), b = "b".repeat(64), c = "c".repeat(64);
    expect(await merkleRootOf([a, b, c])).toBe(await merkleRootOf([a, b, c, c]));
  });

  it("the committed root.json is VALID on both components", async () => {
    const v = await verifyPublicRoot(root());
    expect(v.state).toBe("VALID");
    expect(v.components).toEqual({ signature: "VALID", merkle: "VALID" });
    expect(v.reasons).toEqual([]);
  });

  it("the CVE-2012-2459 twin is rejected by the count check, not waved through on the root", async () => {
    const r = root();
    r.card_sha256.push(r.card_sha256[r.card_sha256.length - 1]); // duplicate the tail; card_count unchanged
    const v = await verifyPublicRoot(r);
    expect(v.state).toBe("INVALID");
    expect(v.reasons).toContain("count_mismatch");
  });

  it("card_count edited to match a padded list breaks the signature instead", async () => {
    const r = root();
    r.card_sha256.push(r.card_sha256[r.card_sha256.length - 1]);
    r.card_count = r.card_sha256.length;
    const v = await verifyPublicRoot(r);
    expect(v.state).toBe("INVALID");
    expect(v.components.signature).toBe("INVALID");
    expect(v.reasons).toContain("signature_invalid");
  });

  it("an unpinned did_intended is UNCHECKABLE for the signature; the leaves are still recomputed", async () => {
    const r = root();
    r.did_intended = "did:web:example.org#nobody";
    const v = await verifyPublicRoot(r);
    expect(v.state).toBe("UNCHECKABLE");
    expect(v.components).toEqual({ signature: "UNCHECKABLE", merkle: "VALID" });
    expect(v.reasons).toEqual(["key_not_pinned"]);
  });

  it("sig_ed25519 null is UNCHECKABLE/unsigned, never VALID", async () => {
    const r = root();
    r.sig_ed25519 = null;
    const v = await verifyPublicRoot(r);
    expect(v.state).toBe("UNCHECKABLE");
    expect(v.reasons).toEqual(["unsigned"]);
  });

  it("a malformed leaf is INVALID", async () => {
    const r = root();
    r.card_sha256[3] = "not-hex";
    const v = await verifyPublicRoot(r);
    expect(v.state).toBe("INVALID");
    expect(v.reasons).toContain("leaf_malformed");
  });

  it("an UNCHECKABLE component beside an INVALID one is still INVALID overall", async () => {
    const r = root();
    r.did_intended = "did:web:example.org#nobody";
    r.card_sha256[0] = "0".repeat(64);
    const v = await verifyPublicRoot(r);
    expect(v.state).toBe("INVALID");
    expect(v.components).toEqual({ signature: "UNCHECKABLE", merkle: "INVALID" });
  });
});
