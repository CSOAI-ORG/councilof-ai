import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { checkProvisionBinding, bindingFor, frozenManifest, BINDING_KEYS, RELATIONS, CAPSULE_SCHEMA_WITH_PROVISIONS, PROVISION_ID_RE } from "./provisionBinding";
import { verifyCapsule } from "./measurementCapsule";

const ROOT = join(__dirname, "../..");
const SCHEMA = JSON.parse(readFileSync(join(ROOT, "public/measurement-capsules/capsule-provisions-0.3.schema.json"), "utf8"));
const M = frozenManifest();
const S03 = CAPSULE_SCHEMA_WITH_PROVISIONS;

afterEach(() => vi.unstubAllGlobals());

describe("capsule 0.3 provisions binding", () => {
  it("a binding built from the manifest is PINNED", () => {
    const r = checkProvisionBinding([bindingFor("32024R1689:50", "PREDICATE"), bindingFor("32024R1689:-3", "RELEVANT_TO")], S03);
    expect(r.state).toBe("PINNED");
    expect(r.problems).toEqual([]);
    expect(r.provisions.every((p) => p.pinned)).toBe(true);
    expect(r.manifest_corpus_root).toBe(M.corpus_root);
  });

  it("a wrong hash, a wrong root or an id the manifest lacks is NOT_PINNED", () => {
    const b = bindingFor("32024R1689:50", "PREDICATE");
    expect(checkProvisionBinding([{ ...b, provision_sha256: "0".repeat(64) }], S03).state).toBe("NOT_PINNED");
    expect(checkProvisionBinding([{ ...b, corpus_root: "f".repeat(64) }], S03).state).toBe("NOT_PINNED");
    expect(checkProvisionBinding([{ ...b, provision_id: "32024R1689:999" }], S03).state).toBe("NOT_PINNED");
  });

  it("shape errors are MALFORMED: extra keys, bad relation, empty list, duplicates, non-objects", () => {
    const b = bindingFor("32016R0679:5", "RELEVANT_TO");
    expect(checkProvisionBinding([{ ...b, extra: 1 }], S03).state).toBe("MALFORMED");
    expect(checkProvisionBinding([{ ...b, relation: "COMPLIES" }], S03).state).toBe("MALFORMED");
    expect(checkProvisionBinding([], S03).state).toBe("MALFORMED");
    expect(checkProvisionBinding([b, b], S03).state).toBe("MALFORMED");
    expect(checkProvisionBinding(["32016R0679:5"], S03).state).toBe("MALFORMED");
    expect(checkProvisionBinding({ provision_id: "x" }, S03).state).toBe("MALFORMED");
  });

  it("the field is defined only on schema 0.3; on a 0.2 capsule it is SCHEMA_MISMATCH", () => {
    expect(checkProvisionBinding([bindingFor("32024R1689:50", "PREDICATE")], "csoai.measurement-capsule/0.2").state).toBe("SCHEMA_MISMATCH");
  });

  it("the JSON Schema states the same shape as the validator", () => {
    const item = SCHEMA.properties.provisions.items;
    expect([...item.required].sort()).toEqual([...BINDING_KEYS].sort());
    expect(item.additionalProperties).toBe(false);
    expect(item.properties.relation.enum).toEqual([...RELATIONS]);
    expect(new RegExp(item.properties.provision_id.pattern).source).toBe(PROVISION_ID_RE.source);
    expect(SCHEMA.properties.schema.const).toBe(S03);
    for (const id of Object.keys(M.anchors)) expect(PROVISION_ID_RE.test(id), id).toBe(true);
  });

  it("verify_capsule reports the binding beside its answer, and a 0.2 capsule's answer gains no key", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));
    const withBinding = await verifyCapsule("https://councilof.ai", { schema: S03, kind: "measurement.example", provisions: [bindingFor("32024R1689:50", "PREDICATE")] });
    expect((withBinding.provisions as { state: string }).state).toBe("PINNED");
    const plain = await verifyCapsule("https://councilof.ai", { schema: "csoai.measurement-capsule/0.2", kind: "measurement.example" });
    expect("provisions" in plain).toBe(false);
  });
});
