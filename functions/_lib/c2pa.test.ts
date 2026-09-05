import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractManifestStore, inspectC2pa, sha256, xmpDigitalSourceType } from "./c2pa";

/**
 * Real public samples, byte-for-byte from the C2PA reference implementation's test fixtures
 * (contentauth/c2pa-rs, sdk/tests/fixtures — see fixtures/c2pa/README.md for the URLs). The
 * SHA-256 of each file is pinned so a silent swap fails here, not in a buyer's pack.
 */
const FIX = resolve(__dirname, "../../fixtures/c2pa");
const C_JPG = new Uint8Array(readFileSync(resolve(FIX, "c2pa-rs-C.jpg")));
const PLAIN_PNG = new Uint8Array(readFileSync(resolve(FIX, "c2pa-rs-libpng-test.png")));

describe("fixtures are the cited public files", () => {
  it("pins both sha256s", async () => {
    expect(await sha256(C_JPG)).toBe("a2d14755db55de67a47c04090340d8266e892367be4104a45626d7a6fa6e9ffd");
    expect(await sha256(PLAIN_PNG)).toBe("c5c635a1dbbec9a768c3bb4527dbaea62a1be05efcee17d66799cc07b673b29b");
  });
});

describe("inspectC2pa — a real C2PA JPEG (c2pa-rs C.jpg)", () => {
  it("locates the manifest store, recomputes every assertion hash, the hard binding and the COSE signature", async () => {
    const r = await inspectC2pa(C_JPG);
    expect(r.container).toBe("jpeg");
    expect(r.manifest_store_present).toBe(true);
    expect(r.manifest_count).toBe(1);
    expect(r.claim?.claim_generator).toMatch(/make_test_images/);
    expect(r.claim?.assertion_count).toBeGreaterThanOrEqual(3);
    expect(r.assertion_hashes.status).toBe("VALID");
    expect(r.assertion_hashes.failed).toEqual([]);
    expect(r.data_hash).toMatchObject({ status: "VALID", binding: "c2pa.hash.data" });
    expect(r.signature.status).toBe("VALID");
    expect(r.signature.cose_alg).toBe("PS256");
    expect(r.signature.leaf_cn).toMatch(/C2PA Signer/);
    expect(r.signature.chain_length).toBe(2);
    // The one thing this Function can never say: that the signer is trusted.
    expect(r.chain_trust.status).toBe("UNCHECKABLE");
  });

  it("is deterministic: the same bytes give the same inspection", async () => {
    const a = JSON.stringify(await inspectC2pa(C_JPG));
    const b = JSON.stringify(await inspectC2pa(C_JPG));
    expect(a).toBe(b);
  });

  it("flags an edit after signing: one flipped scan byte breaks the hard binding but not the claim signature", async () => {
    const edited = new Uint8Array(C_JPG);
    edited[edited.length - 3] ^= 0x01; // inside the entropy-coded data, before the EOI marker
    const r = await inspectC2pa(edited);
    expect(r.manifest_store_present).toBe(true);
    expect(r.assertion_hashes.status).toBe("VALID");
    expect(r.signature.status).toBe("VALID");
    expect(r.data_hash.status).toBe("INVALID");
  });

  it("manifest-only mode verifies the claim but declares the binding UNCHECKABLE", async () => {
    const store = extractManifestStore(C_JPG).store!;
    expect(store.byteLength).toBeGreaterThan(1000);
    const r = await inspectC2pa(null, store);
    expect(r.signature.status).toBe("VALID");
    expect(r.assertion_hashes.status).toBe("VALID");
    expect(r.data_hash.status).toBe("UNCHECKABLE");
    expect(r.data_hash.reason).toMatch(/asset bytes not supplied/);
  });
});

describe("inspectC2pa — a plain PNG with no Content Credentials (c2pa-rs libpng-test.png)", () => {
  it("reports NOT detected without inventing anything, and never uses the forbidden words", async () => {
    const r = await inspectC2pa(PLAIN_PNG);
    expect(r.container).toBe("png");
    expect(r.manifest_store_present).toBe(false);
    expect(r.manifest_count).toBe(0);
    expect(r.claim).toBeNull();
    expect(r.assertion_hashes.status).toBe("UNCHECKABLE");
    expect(r.data_hash.status).toBe("UNCHECKABLE");
    expect(r.signature.status).toBe("UNCHECKABLE");
    expect(xmpDigitalSourceType(PLAIN_PNG)).toBeNull();
    expect(JSON.stringify(r)).not.toMatch(/\b(non-?compliant|compliant|certified|absent|unsafe|safe|legal evidence)\b/i);
  });
});

describe("xmpDigitalSourceType", () => {
  it("reads the IPTC term out of an XMP packet", () => {
    const xmp = new TextEncoder().encode(
      '<x:xmpmeta><rdf:Description Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"/></x:xmpmeta>',
    );
    expect(xmpDigitalSourceType(xmp)).toBe("trainedAlgorithmicMedia");
  });
});
