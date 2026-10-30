// Synthetic unit cases only. No production request, backend, signer or persistence assertion.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { jsonMemberBytes, parseBoundedJson, sameJSONValue, verifiedBytes, verifiedJsonBytes } from "./companyCaseBytes.ts";

const encode = (text: string): Uint8Array => new TextEncoder().encode(text);
const parse = (text: string): unknown => parseBoundedJson(encode(text));
const envelope = (raw: Uint8Array) => ({
  base64: Buffer.from(raw).toString("base64"),
  bytes: raw.byteLength,
  sha256: createHash("sha256").update(raw).digest("hex"),
});
const wrap = (text: string) => envelope(encode(text));

type UnitCase = (name: string, body: () => void | Promise<void>) => unknown;

export function registerCompanyCaseBytesContractCases(test: UnitCase) {
  test("synthetic: JSON primitives, JSON whitespace and nested values", () => {
    assert.deepEqual(parse(' \t\r\n{"z":[true,false,null,0,-2.5,3e2],"a":"hello"} \n'),
      { z: [true, false, null, 0, -2.5, 300], a: "hello" });
    assert.equal(parse('""'), "");
    assert.deepEqual(parse("{}"), {});
    assert.deepEqual(parse("[]"), []);
    assert.ok(Object.is(parse("-0.0"), -0));
    assert.equal(parse("1e-10000"), 0);
  });

  test("synthetic: fatal UTF8 rejects malformed, overlong, surrogate and truncated bytes", () => {
    for (const raw of [[0xc3, 0x28], [0xc0, 0xaf], [0xed, 0xa0, 0x80], [0xf0, 0x9f, 0x98], [0xff]]) {
      assert.throws(() => parseBoundedJson(Uint8Array.from(raw)));
    }
    assert.throws(() => parseBoundedJson(Uint8Array.from([0xef, 0xbb, 0xbf, 0x30])));
  });

  test("synthetic: byte bounds count UTF8 bytes and exact subarray, with safe positive maximum", () => {
    const raw = encode('"é"');
    assert.equal(raw.length, 4);
    assert.equal(parseBoundedJson(raw, 4), "é");
    assert.throws(() => parseBoundedJson(raw, 3));
    const backing = encode('BAD{"x":1}BAD');
    assert.deepEqual(parseBoundedJson(backing.subarray(3, 10), 7), { x: 1 });
    for (const limit of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assert.throws(() => parseBoundedJson(encode("0"), limit));
    }
    assert.throws(() => parseBoundedJson([] as unknown as Uint8Array));
  });

  test("synthetic: 64 containers pass, 65 containers fail for arrays and objects", () => {
    assert.doesNotThrow(() => parse("[".repeat(64) + "0" + "]".repeat(64)));
    assert.throws(() => parse("[".repeat(65) + "0" + "]".repeat(65)), /nesting/);
    assert.doesNotThrow(() => parse('{"x":'.repeat(64) + "0" + "}".repeat(64)));
    assert.throws(() => parse('{"x":'.repeat(65) + "0" + "}".repeat(65)), /nesting/);
  });

  test("synthetic: duplicate decoded keys fail at every depth", () => {
    for (const text of ['{"x":1,"x":2}', '{"x":1,"\\u0078":2}',
      '{"a":[{"x":1,"x":1}]}', '{"__proto__":1,"__proto__":2}',
      '{"😀":1,"\\ud83d\\ude00":2}']) {
      assert.throws(() => parse(text), /duplicate/);
    }
    assert.deepEqual(parse('{"x":{"x":1},"other":{"x":2}}'), { x: { x: 1 }, other: { x: 2 } });
  });

  test("synthetic: prototype-like keys are safe own enumerable data", () => {
    const value = parse('{"__proto__":{"polluted":true},"constructor":1,"prototype":2}') as Record<string, unknown>;
    assert.equal(Object.getPrototypeOf(value), Object.prototype);
    assert.equal(Object.hasOwn(value, "__proto__"), true);
    assert.deepEqual(Object.getOwnPropertyDescriptor(value, "__proto__"), {
      value: { polluted: true }, enumerable: true, writable: true, configurable: true,
    });
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
    assert.equal(sameJSONValue(value, JSON.parse('{"prototype":2,"constructor":1,"__proto__":{"polluted":true}}')), true);
  });

  test("synthetic: astral pairs and escaped text pass; lone surrogates in keys or values fail", () => {
    assert.equal(parse('"\\ud83d\\ude00"'), "😀");
    assert.equal(parse('"😀"'), "😀");
    assert.equal(parse('"\\\\ud800"'), "\\ud800");
    for (const text of ['"\\ud800"', '"\\udfff"', '"\\ud800a"', '"\\ud800\\ud800"',
      '{"\\udfff":0}', '{"x":"a\\udc00"}']) assert.throws(() => parse(text), /surrogate/);
  });

  test("synthetic: strict JSON grammar rejects malformed numbers and trailing material", () => {
    for (const text of ["", " ", "NaN", "Infinity", "-Infinity", "1e309", "-1e9999",
      "+1", ".1", "01", "-01", "1.", "1e", "1e+", "--1", "0x1", "true false", "nullx",
      "[1,]", '{"a":1,}', '{"a" 1}', "{a:1}", "[1 2]", '"x\ny"', '"\\x20"',
      '"\\u012"', '"unterminated', "/*x*/0", "\u00a00", "undefined"]) assert.throws(() => parse(text), text);
  });

  test("synthetic: structural equality ignores object order, retains array order and parsed numbers", () => {
    assert.equal(sameJSONValue(parse('{"b":[1,2],"a":{"y":true,"x":null}}'),
      parse('{"a":{"x":null,"y":true},"b":[1.0,2e0]}')), true);
    assert.equal(sameJSONValue(parse("[1,2]"), parse("[2,1]")), false);
    assert.equal(sameJSONValue({ a: 1 }, { a: 1, b: null }), false);
    assert.equal(sameJSONValue({ a: null }, { b: null }), false);
    assert.equal(sameJSONValue(-0, 0), true);
    assert.equal(sameJSONValue(1e-7, parse("1e-07")), true);
    assert.equal(sameJSONValue(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), true);
    assert.equal(sameJSONValue(Number.MAX_SAFE_INTEGER + 1, Number.MAX_SAFE_INTEGER + 1), false);
    assert.equal(sameJSONValue(Object.assign(Object.create(null), { a: 1 }), { a: 1 }), true);
    assert.equal(sameJSONValue(null, null), true);
    assert.equal(sameJSONValue(null, {}), false);
    assert.equal(sameJSONValue("1", 1), false);
  });

  test("synthetic: non-JSON values, cycles, holes and extra properties never compare equal", () => {
    for (const value of [undefined, NaN, Infinity, 1n, Symbol("x"), () => 1, new Date(0),
      new Number(1), new Map(), "\ud800", { "\udfff": 1 }]) assert.equal(sameJSONValue(value, value), false);
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    assert.equal(sameJSONValue(cyclic, cyclic), false);
    assert.equal(sameJSONValue(Array(1), Array(1)), false);
    const array = Object.assign([1], { extra: true });
    assert.equal(sameJSONValue(array, array), false);
    const symbolField = { [Symbol("x")]: 1 };
    assert.equal(sameJSONValue(symbolField, symbolField), false);
    const hidden = Object.defineProperty({}, "hidden", { value: 1 });
    assert.equal(sameJSONValue(hidden, hidden), false);
  });

  test("synthetic: equality does not invoke getters, catches proxies, permits repeated acyclic values", () => {
    let called = false;
    const accessor = { get x() { called = true; return 1; } };
    assert.equal(sameJSONValue(accessor, accessor), false);
    assert.equal(called, false);
    const proxy = new Proxy({}, { ownKeys() { throw new Error("synthetic trap"); } });
    assert.equal(sameJSONValue(proxy, proxy), false);
    const shared = { a: true };
    assert.equal(sameJSONValue({ x: shared, y: shared }, { y: { a: true }, x: { a: true } }), true);
    assert.equal(sameJSONValue(parse("[".repeat(64) + "0" + "]".repeat(64)),
      parse("[".repeat(64) + "0" + "]".repeat(64))), true);
  });

  test("synthetic: exact byte digest verifies non-JS float spelling, spacing and key order", async () => {
    const original = '{"z":1e-07, "a":-0.0,"long":1.2345678901234567e-20}\n';
    const expected = wrap(original);
    const checked = await verifiedJsonBytes({ ...expected, sha256: expected.sha256.toUpperCase() });
    assert.deepEqual(checked.raw, encode(original));
    assert.equal(sameJSONValue(checked.value, { a: 0, long: 1.2345678901234567e-20, z: 1e-7 }), true);
    assert.notEqual(JSON.stringify(checked.value), original); // This must never be the verification rule.
    assert.equal(Object.is((checked.value as { a: number }).a, -0), true);
  });

  test("synthetic: canonical base64 supports all padding lengths and exact byte subarrays", async () => {
    for (const text of ["0", "[]", "{}\n", '"é"']) {
      const checked = await verifiedJsonBytes(wrap(text));
      assert.deepEqual(checked.raw, encode(text));
    }
    const full = encode("BAD[]BAD");
    assert.deepEqual((await verifiedJsonBytes(envelope(full.subarray(3, 5)))).value, []);
  });

  test("synthetic: canonical base64 rejects bad alphabet, padding, whitespace and pad bits", async () => {
    const expected = wrap("0");
    for (const base64 of ["MA", "MA=", "MA===", "MA==\n", "M A=", "MA-_", "=MA=", "MA==AA==", "MB==", "M@==", "===="]) {
      await assert.rejects(verifiedJsonBytes({ ...expected, base64 }), undefined, base64);
    }
    const array = wrap("[]");
    await assert.rejects(verifiedJsonBytes({ ...array, base64: "W11=" })); // Nonzero unused bits.
  });

  test("synthetic: byte envelope rejects unsafe counts, invalid digest and mismatched raw bytes", async () => {
    const expected = wrap("0");
    for (const bytes of [0, -1, 1.1, NaN, Infinity, 524289, Number.MAX_SAFE_INTEGER + 1, "1"]) {
      await assert.rejects(verifiedJsonBytes({ ...expected, bytes } as typeof expected));
    }
    for (const sha256 of ["0".repeat(63), "0".repeat(65), "g".repeat(64), " " + expected.sha256, null]) {
      await assert.rejects(verifiedJsonBytes({ ...expected, sha256 } as typeof expected));
    }
    await assert.rejects(verifiedJsonBytes(null as unknown as typeof expected));
    await assert.rejects(verifiedJsonBytes({ ...expected, base64: null as unknown as string }));
    await assert.rejects(verifiedJsonBytes({ ...expected, bytes: 2 }));
    await assert.rejects(verifiedJsonBytes({ ...expected, sha256: "0".repeat(64) }), /digest mismatch/);
    await assert.rejects(verifiedJsonBytes({ ...expected, base64: wrap("1").base64 }), /digest mismatch/);
  });

  test("synthetic: digest match does not allow invalid JSON, UTF8, duplicate keys or excess depth", async () => {
    for (const raw of [encode('{"x":1,"x":2}'), encode('"\\ud800"'), encode("1e309"),
      encode("[".repeat(65) + "0" + "]".repeat(65)), Uint8Array.from([0xff])]) {
      await assert.rejects(verifiedJsonBytes(envelope(raw)));
    }
  });

  test("synthetic: exact 512KiB limit verifies; one extra byte fails before decoding", async () => {
    const raw = encode('"' + "a".repeat(524286) + '"');
    assert.equal(raw.length, 524288);
    const checked = await verifiedJsonBytes(envelope(raw));
    assert.equal((checked.value as string).length, 524286);
    const tooLarge = encode('"' + "a".repeat(524287) + '"');
    assert.throws(() => parseBoundedJson(tooLarge));
    await assert.rejects(verifiedJsonBytes(envelope(tooLarge)), /byte count/);
  });

  test("synthetic: unsafe integer results fail for integer, decimal and exponent spellings", async () => {
    for (const text of ["9007199254740992", "9007199254740993", "-9007199254740992",
      "9007199254740992.0", "9.007199254740992e15", "1e20", "1.2345678901234567e20"]) {
      assert.throws(() => parse(text), /unsafe integer/);
      await assert.rejects(verifiedJsonBytes(wrap(text)), /unsafe integer/);
    }
    assert.equal(parse("9007199254740991"), Number.MAX_SAFE_INTEGER);
    assert.equal(parse("-9007199254740991"), -Number.MAX_SAFE_INTEGER);
  });

  test("synthetic: exact member spans retain Python floats, inner whitespace and nonASCII offsets", () => {
    const original = ' \n{"é😀":"prefix", "result" : { "first":1.0, "second":1e-07 }, "receipt": {"x":true}}\t';
    const raw = encode(original);
    assert.deepEqual(jsonMemberBytes(raw, ["result"]), encode('{ "first":1.0, "second":1e-07 }'));
    assert.deepEqual(jsonMemberBytes(raw, ["result", "first"]), encode("1.0"));
    assert.deepEqual(jsonMemberBytes(raw, ["result", "second"]), encode("1e-07"));
    assert.deepEqual(jsonMemberBytes(raw, ["receipt"]), encode('{"x":true}'));
    assert.equal(jsonMemberBytes(raw, ["result"]).buffer, raw.buffer);
    assert.deepEqual(jsonMemberBytes(encode('{"\\u00e9":{"x":"😀"}}'), ["é", "x"]), encode('"😀"'));
    assert.deepEqual(jsonMemberBytes(encode('{"x":1,"nested":{"x":2}}'), ["nested", "x"]), encode("2"));
    assert.deepEqual(jsonMemberBytes(encode('{"__proto__":{"":null}}'), ["__proto__", ""]), encode("null"));
  });

  test("synthetic: member span requires own object path and validates the complete document", () => {
    for (const path of [["missing"], ["toString"], ["x", "nested"], ["array", "0", "x"]]) {
      assert.throws(() => jsonMemberBytes(encode('{"x":1,"array":[{"x":2}]}'), path), /path/);
    }
    for (const path of [[], [1], ["\ud800"], Array(65).fill("x"), "x"]) {
      assert.throws(() => jsonMemberBytes(encode('{"x":1}'), path as readonly string[]));
    }
    for (const text of ['{"result":1,"x":1,"x":2}', '{"result":1,"tail":"\\ud800"}',
      '{"result":1,"tail":1e309}', '{"result":1,"tail":9007199254740993}', '{"result":1} trailing']) {
      assert.throws(() => jsonMemberBytes(encode(text), ["result"]));
    }
    const tooDeep = '{"result":1,"tail":' + "[".repeat(64) + "0" + "]".repeat(64) + "}";
    assert.throws(() => jsonMemberBytes(encode(tooDeep), ["result"]), /nesting/);
  });

  test("synthetic: generic byte verification accepts exact SSE and nonUTF8 without pretending JSON", async () => {
    for (const raw of [encode('event: message\ndata: {"value":1.0}\n\n'), Uint8Array.from([0xff, 0x00, 0xc0])]) {
      assert.deepEqual(await verifiedBytes(envelope(raw)), raw);
      await assert.rejects(verifiedJsonBytes(envelope(raw)));
    }
  });

  test("synthetic: generic byte verification enforces a caller's narrower byte bound", async () => {
    const expected = wrap("[]");
    assert.deepEqual(await verifiedBytes(expected, 2), encode("[]"));
    await assert.rejects(verifiedBytes(expected, 1), /byte count/);
    for (const max of [0, -1, 1.5, NaN, Infinity, 524289, Number.MAX_SAFE_INTEGER + 1]) {
      await assert.rejects(verifiedBytes(expected, max), /byte limit/);
    }
  });

  test("synthetic: generic byte verification retains canonical base64 and exact digest rejection", async () => {
    const expected = wrap("[]");
    await assert.rejects(verifiedBytes({ ...expected, base64: "W11=" }));
    await assert.rejects(verifiedBytes({ ...expected, sha256: "0".repeat(64) }), /digest mismatch/);
    await assert.rejects(verifiedBytes({ ...expected, bytes: 1 }));
    assert.deepEqual(await verifiedBytes({ ...expected, sha256: expected.sha256.toUpperCase() }), encode("[]"));
  });
}
