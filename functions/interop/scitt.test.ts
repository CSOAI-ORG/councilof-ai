import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import root from "../../public/root.json";
import { build } from "./scitt-root-signed-statement.json";

const RAW = readFileSync(resolve(__dirname, "../../public/root.json"));

describe("SCITT signed statement over root.json", () => {
  it("LOAD-BEARING: the re-serialisation is byte-identical to the committed file", () => {
    // The endpoint digests JSON.stringify(root, null, 2) + "\n" and publishes that hex beside
    // the instruction `curl -s https://councilof.ai/root.json | shasum -a 256`. If the committed
    // file is ever written with different formatting — another indent, no trailing newline — the
    // two diverge and the endpoint publishes a digest that does not match the bytes it names.
    // That would be a false claim, not a cosmetic drift, so it fails here rather than in public.
    const round = Buffer.from(JSON.stringify(root, null, 2) + "\n");
    expect(round.length).toBe(RAW.length);
    expect(round.equals(RAW)).toBe(true);
  });

  it("publishes the digest of those exact bytes", async () => {
    const bytes = new Uint8Array(RAW);
    const s = await build(bytes, root as never);
    expect(s.payload.digest_hex).toBe(createHash("sha256").update(RAW).digest("hex"));
    expect(s.payload.length_bytes).toBe(RAW.length);
    expect(s.payload.digest_alg).toBe("sha-256");
  });

  it("claims no signature, no registration and NO RECEIPT", async () => {
    const s = await build(new Uint8Array(RAW), root as never);
    expect(s.signature).toBeNull();
    expect(s.registration).toBeNull();
    expect(s.receipt).toBeNull();
    // and says so in words, not only by a null a reader might miss
    expect(s.what_this_is_not.join(" ")).toMatch(/Not a SCITT receipt/);
    expect(s.what_this_is).toMatch(/neither runs one nor is registered with one/);
  });

  it("declares alg as INTENDED, never as used — nothing has signed", async () => {
    const s = await build(new Uint8Array(RAW), root as never);
    expect(s.protected_header).toHaveProperty("alg_intended");
    expect(s.protected_header).not.toHaveProperty("alg");
    expect(s.protected_header).toHaveProperty("cwt_iss_intended");
  });

  it("states the scope: these bytes, and nothing they do not commit to", async () => {
    const s = await build(new Uint8Array(RAW), root as never);
    expect(s.scope).toMatch(/does not anchor the signed-card index/);
    expect(s.scope).toMatch(/does not anchor GSPC/);
  });

  it("reports the envelope's real signature state rather than assuming it", async () => {
    const s = await build(new Uint8Array(RAW), root as never);
    const expected = (root as { sig_ed25519?: string | null }).sig_ed25519 ? "SIGNED" : "UNSIGNED";
    expect(s.artifact.envelope_signature_state).toBe(expected);
  });
});
