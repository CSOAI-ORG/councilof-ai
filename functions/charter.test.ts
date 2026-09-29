import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { onRequest as bare } from "./charter";
import { onRequest as slash } from "./charter/index";

// The bytes published at /.well-known/constitutional-harness.json on 2026-09-28 (v0.1.0).
// A new charter version is a NEW amendment entry, never an edit of this pin.
const V0_1_0_SHA256 = "3dcf79a7526785324ef15deaa40adabc5e77fbc99c4ebd089309d948c3c3e32e";
const pub = (p: string) => join(__dirname, "..", "public", p);
const sha = (p: string) => createHash("sha256").update(readFileSync(pub(p))).digest("hex");
const json = (p: string) => JSON.parse(readFileSync(pub(p), "utf8"));

describe("/charter — operational charter, not the pricing lobby", () => {
  it("308s both forms to /constitutional-harness/", () => {
    for (const h of [bare, slash]) {
      const res = (h as unknown as () => Response)();
      expect(res.status).toBe(308);
      expect(res.headers.get("location")).toBe("/constitutional-harness/");
      expect(res.headers.get("location")).not.toMatch(/pricing|lobby/);
    }
  });

  it("serves the machine charter byte-identical to the published v0.1.0", () => {
    expect(sha(".well-known/constitutional-harness.json")).toBe(V0_1_0_SHA256);
    expect(sha("reports/constitutional-harness-charter-2026-09-28.json")).toBe(V0_1_0_SHA256);
  });

  it("amendment log entry 0 pins the same bytes and never claims a signature it lacks", () => {
    const log = json(".well-known/charter-amendments.json");
    expect(log.schema).toBe("csoai.charter-amendments/0.1");
    const e0 = log.entries[0];
    expect(e0.seq).toBe(0);
    expect(e0.sha256).toBe(V0_1_0_SHA256);
    expect(e0.bytes).toBe(readFileSync(pub(".well-known/constitutional-harness.json")).length);
    const charter = json(".well-known/constitutional-harness.json");
    expect(e0.version).toBe(charter.version);
    expect(e0.issued_at).toBe(charter.issued_at);
    // Entry 0 is never edited: it was published unsigned and stays UNSIGNED. A signature is a
    // later SIGNATURE_ADDED entry (scripts/charter/sign-charter.py), and only if the .sig exists.
    expect(e0.signature.state).toBe("UNSIGNED");
    const signedEntries = log.entries.filter((e: { signature?: { state?: string } }) => e.signature?.state === "SIGNED");
    const sigPublished = existsSync(pub(".well-known/constitutional-harness.json.sig"));
    expect(signedEntries.length > 0).toBe(sigPublished);
    // seq is dense and append-only: 0..n-1.
    log.entries.forEach((e: { seq: number }, i: number) => expect(e.seq).toBe(i));
  });

  it("pointer names the same sha256 and links the amendment log", () => {
    const p = json(".well-known/charter.json");
    expect(p.schema).toBe("csoai.charter-pointer/0.2");
    expect(p.current.sha256).toBe(V0_1_0_SHA256);
    expect(p.amendments).toBe("https://councilof.ai/.well-known/charter-amendments.json");
  });
});
