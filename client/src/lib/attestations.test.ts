/**
 * attestations — checked against the LIVE bytes (fixtures curl'd 2026-09-02, see
 * __fixtures__/attestations/README.md). Bytes adjudicate: the sha256 of root.json
 * must equal what the witness sidecar and the pointer name, the six-field preimage
 * must hash to the sidecar's preimage_sha256, and the signature must verify under
 * the PINNED board key. If a future republish changes root.json, refresh every
 * fixture together — a mixed set fails here on purpose.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BOARD_KEY_HEX,
  BOARD_KEY_ID,
  classifyQuery,
  latestCorrections,
  latestSignedCards,
  ledgerSignatureState,
  merkleRoot,
  railTone,
  rootPreimage,
  sha256Hex,
  verifyInclusion,
  verifyRootSignature,
  witnessRails,
  type CardIndexDoc,
  type CorrectionsDoc,
  type PointerDoc,
  type ProofDoc,
  type PublicRoot,
  type WitnessDoc,
} from "./attestations";

const FX = resolve(__dirname, "__fixtures__/attestations");
const raw = (f: string) => readFileSync(resolve(FX, f));
const json = <T,>(f: string): T => JSON.parse(raw(f).toString("utf8")) as T;

const root = json<PublicRoot>("root.json");
const witness = json<WitnessDoc>("root-witness-latest.json");
const pointer = json<PointerDoc>("root-witness-pointer.json");
const proof0 = json<ProofDoc>("proof-index0.json");
const proof49 = json<ProofDoc>("proof-index49.json");
const did = json<any>("did.json");

describe("the one root — bytes adjudicate", () => {
  it("root.json bytes hash to what the witness sidecar and the pointer name", async () => {
    const sha = await sha256Hex(new Uint8Array(raw("root.json")));
    expect(sha).toBe(witness.artifact?.sha256);
    expect(sha).toBe((pointer as any).live_root?.sha256);
    expect(raw("root.json").length).toBe(witness.artifact?.bytes);
    expect(pointer.drift?.status).toBe("MATCH");
  });

  it("rebuilds the six-field preimage the sidecar hashed (bytes and sha256)", async () => {
    const pre = rootPreimage(root);
    expect(new TextEncoder().encode(pre).length).toBe(witness.signature?.preimage_bytes);
    expect(await sha256Hex(pre)).toBe(witness.signature?.preimage_sha256);
  });

  it("pins the board key that did.json publishes", () => {
    const m = (did.verificationMethod as any[]).find((v) => v.id === BOARD_KEY_ID);
    expect(m).toBeTruthy();
    const x: string = m.publicKeyJwk.x;
    const hex = Buffer.from(x.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("hex");
    expect(hex).toBe(BOARD_KEY_HEX);
  });

  it("verifies the live root signature under the pinned key — VALID", async () => {
    const v = await verifyRootSignature(root);
    expect(v.state).toBe("VALID");
  });

  it("reports a tampered as_of as INVALID, and a missing signature as UNCHECKABLE — never the other way round", async () => {
    const tampered = { ...root, as_of: "2026-09-02T07:13:28Z" };
    expect((await verifyRootSignature(tampered)).state).toBe("INVALID");
    const { sig_ed25519: _drop, ...unsigned } = root;
    expect((await verifyRootSignature(unsigned)).state).toBe("UNCHECKABLE");
    expect((await verifyRootSignature(null)).state).toBe("UNCHECKABLE");
    expect((await verifyRootSignature(root, null)).state).toBe("UNCHECKABLE");
  });

  it("recomputes merkle_root from the 50 published leaves with the publisher's pairing rule", async () => {
    expect(root.card_sha256?.length).toBe(root.card_count);
    expect(await merkleRoot(root.card_sha256 ?? [])).toBe(root.merkle_root);
  });
});

describe("inclusion proofs from GET /api/proof", () => {
  it("VALID for the first and the last leaf", async () => {
    expect(proof0.index).toBe(0);
    expect(proof49.index).toBe(49);
    expect((await verifyInclusion(proof0)).state).toBe("VALID");
    expect((await verifyInclusion(proof49)).state).toBe("VALID");
    expect(proof0.merkle_root).toBe(root.merkle_root);
  });

  it("INVALID when one sibling is altered; UNCHECKABLE when the document is not an inclusion", async () => {
    const bad = { ...proof0, proof: [...(proof0.proof ?? [])] };
    bad.proof[0] = "0".repeat(64);
    expect((await verifyInclusion(bad)).state).toBe("INVALID");
    expect((await verifyInclusion({ ...proof0, kind: "bundle" })).state).toBe("UNCHECKABLE");
    expect((await verifyInclusion({ schema: "csoai.public-root-proof/0.1", error: "not_found" })).state).toBe("UNCHECKABLE");
    expect((await verifyInclusion(null)).state).toBe("UNCHECKABLE");
  });
});

describe("witness rails — states verbatim, never a tick for NOT_YET", () => {
  const rails = witnessRails(witness, null, 404);

  it("prints the four sidecar states word for word", () => {
    expect(rails.map((r) => [r.id, r.state])).toEqual([
      ["rekor", "WITNESSED"],
      ["ots", "STAMPED_PENDING_BITCOIN"],
      ["eas_base", "NOT_YET"],
      ["xrpl_memo", "NOT_YET"],
    ]);
    expect(rails.map((r) => r.state)).toEqual(Object.values(pointer.witnesses ?? {}));
  });

  it("tones: WITNESSED done, STAMPED_PENDING_BITCOIN pending, NOT_YET absent", () => {
    expect(rails.map((r) => r.tone)).toEqual(["done", "pending", "absent", "absent"]);
    expect(railTone("NOT_YET")).toBe("absent");
    expect(railTone("")).toBe("absent");
    expect(railTone(undefined)).toBe("absent");
    expect(railTone("ATTESTED")).toBe("done");
    expect(railTone("SOMETHING_ELSE")).toBe("unknown");
  });

  it("Rekor carries the log index, the integrated time and both doors", () => {
    const r = rails[0];
    expect(r.detail).toContain("logIndex 2684053226");
    // 1788333210 s since epoch — the sidecar's integratedTime, rendered as ISO.
    expect(r.detail).toContain("integratedTime 2026-09-02T07:13:30Z");
    expect(r.links.map((l) => l.href)).toContain("https://rekor.sigstore.dev/api/v1/log/entries?logIndex=2684053226");
    expect(r.links.map((l) => l.href)).toContain("https://search.sigstore.dev/?logIndex=2684053226");
  });

  it("says where the EAS state came from when the log file is absent", () => {
    const e = rails[2];
    expect(e.detail).toContain("HTTP 404");
    expect(e.detail).toContain("witness sidecar");
    expect(e.links.some((l) => l.href.startsWith("https://base.easscan.org"))).toBe(true);
  });

  it("lets a served EAS log override the sidecar, and links the easscan view", () => {
    const eas = {
      status: "ATTESTED",
      schema: "bytes32 sha256,string as_of,string did",
      attestations: [{ sha256: witness.artifact?.sha256, uid: "0x" + "ab".repeat(32), url: "https://base.easscan.org/attestation/view/0x" + "ab".repeat(32), at: "2026-09-02T08:00:00Z" }],
    };
    const e = witnessRails(witness, eas, 200)[2];
    expect(e.state).toBe("ATTESTED");
    expect(e.tone).toBe("done");
    expect(e.links[0].href).toContain("base.easscan.org/attestation/view/");
  });

  it("names the missing sidecar instead of inventing a state", () => {
    for (const r of witnessRails(null, null, null)) {
      expect(r.state).toBe("no witness sidecar read");
      expect(r.tone).toBe("unknown");
    }
  });
});

describe("search box", () => {
  it("accepts a 64-hex sha256 or card id, with 0x / sha256: prefixes and upper case", () => {
    const h = root.card_sha256![0];
    expect(classifyQuery(h)).toEqual({ kind: "hex64", value: h });
    expect(classifyQuery("0x" + h.toUpperCase())).toEqual({ kind: "hex64", value: h });
    expect(classifyQuery("sha256:" + h)).toEqual({ kind: "hex64", value: h });
    expect(classifyQuery("   ")).toEqual({ kind: "empty" });
    expect(classifyQuery(h.slice(0, 40)).kind).toBe("invalid");
    expect(classifyQuery("not a hash").kind).toBe("invalid");
  });
});

describe("lists", () => {
  const index = json<CardIndexDoc>("card_index-head.json");
  const ledger = json<CorrectionsDoc>("corrections-head.json");

  it("orders signed cards newest first and never invents rows", () => {
    const rows = latestSignedCards(index, 5);
    expect(rows.length).toBe(5);
    for (let i = 1; i < rows.length; i++) expect(String(rows[i - 1].ts) >= String(rows[i].ts)).toBe(true);
    expect(latestSignedCards(null)).toEqual([]);
  });

  it("orders corrections newest first and passes the ledger's own signature_state through verbatim", () => {
    const rows = latestCorrections(ledger);
    expect(rows[0].id).toBe("C-2026-0902-07");
    for (let i = 1; i < rows.length; i++) expect(rows[i - 1].date >= rows[i].date).toBe(true);
    expect(ledgerSignatureState(ledger)).toBe("STALE");
    expect(ledgerSignatureState(null)).toBe("not read");
  });
});
