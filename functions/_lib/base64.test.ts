import { describe, expect, it } from "vitest";
import { base64ToBytes, base64ToBytesPortable } from "./base64";

/** The decoder the art50 route ran until 20 Nov 2026. Both paths are held to it. */
const oldDecoder = (s: string): Uint8Array => Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0));

const DECODERS: ReadonlyArray<readonly [string, (s: string) => Uint8Array]> = [
  ["base64ToBytes", base64ToBytes],
  ["base64ToBytesPortable", base64ToBytesPortable],
];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/** Every character `\s` matches that a test below puts between base64 characters. */
const WHITESPACE = [" ", "\t", "\n", "\r\n", "\f", "\v", " ", " ", " ", " ", " ", " ", " ", " ", "　", "﻿"];
/** The five that Uint8Array.fromBase64 skips itself: input with only these goes down the native path. */
const ASCII_WHITESPACE = [" ", "\t", "\n", "\f", "\r"];
const around = (s: string, ws: string[]): string => [...s].map((c, i) => ws[i % ws.length] + c).join("") + ws[s.length % ws.length];

const hex = (b: Uint8Array): string => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("hex");
const encode = (b: Uint8Array): string => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString("base64");

/** A refusal as "refused", anything else as its bytes in hex. */
function outcome(decode: (s: string) => Uint8Array, s: string): string {
  let out: Uint8Array;
  try {
    out = decode(s);
  } catch {
    return "refused";
  }
  return hex(out);
}

/** A fixed-seed xorshift32, so every run sees the same corpus. */
function prng(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  };
}
function randomBytes(n: number, seed: number): Uint8Array {
  const next = prng(seed);
  const b = new Uint8Array(n);
  for (let i = 0; i < n; i++) b[i] = next();
  return b;
}

/** The ways a caller can write the same bytes, plus every other count of "=". Labels name each one. */
function forms(b: Uint8Array): Array<[string, string]> {
  const padded = encode(b);
  const bare = padded.replace(/=+$/, "");
  const pads = padded.length - bare.length;
  const out: Array<[string, string]> = [
    ["padded", padded],
    ["unpadded", bare],
    ["76-column CRLF lines", padded.replace(/.{76}/g, "$&\r\n")],
    ["ASCII whitespace around every character", around(padded, ASCII_WHITESPACE)],
    ["any \\s around every character", around(padded, WHITESPACE)],
    ["leading and trailing whitespace", ` \n\t${padded}\r\n\v`],
  ];
  if (pads === 2) out.push(["whitespace between the two =", `${bare}= \n=`], ["NBSP between the two =", `${bare}= =`]);
  if (pads > 0) {
    // The last character's unused low bits set: forgiving-base64 drops them, so the bytes stay the same.
    const last = bare.length - 1;
    const dirty = bare.slice(0, last) + ALPHABET[ALPHABET.indexOf(bare[last]) | (pads === 2 ? 0b1111 : 0b11)];
    out.push(["unused bits set", dirty + "=".repeat(pads)], ["unused bits set, unpadded", dirty]);
  }
  for (let p = 0; p <= 3; p++) if (p !== pads && !(p === 0 && pads > 0)) out.push([`${p} "=" where the encoder wrote ${pads}`, bare + "=".repeat(p)]);
  return out;
}

const next = prng(20261120);
/** Lengths 0–64, then eight drawn from the fixed seed up to 1 MiB. */
const SIZES = [...Array.from({ length: 65 }, (_, n) => n), ...Array.from({ length: 8 }, () => 65 + (next() % (1 << 20)))];

describe("base64ToBytes: the bytes and refusals of the old art50 decoder, in linear memory", () => {
  it(`returns the old decoder's bytes for lengths 0–64 and ${SIZES.length - 65} random sizes up to 1 MiB, in every padding and whitespace form`, () => {
    let forms_checked = 0;
    let accepted = 0;
    for (const n of SIZES) {
      const b = randomBytes(n, n + 1);
      for (const [form, s] of forms(b)) {
        const want = outcome(oldDecoder, s);
        for (const [name, decode] of DECODERS) expect(outcome(decode, s), `${name}, ${n} bytes, ${form}`).toBe(want);
        if (want !== "refused") {
          // An accepted form is the bytes themselves, not merely what the old decoder made of it.
          expect(want, `${n} bytes, ${form}`).toBe(hex(b));
          accepted++;
        }
        forms_checked++;
      }
      // The portable path allocates exactly the output, once.
      const out = base64ToBytesPortable(encode(b));
      expect([out.byteOffset, out.buffer.byteLength], `${n} bytes`).toEqual([0, n]);
    }
    expect(forms_checked).toBeGreaterThan(SIZES.length * 8);
    expect(accepted).toBeGreaterThan(SIZES.length * 5);
  });

  it("refuses exactly what the old decoder refused: named cases, every string of up to 4 characters over 16 symbols, and of up to 5 over the 9 the native path accepts", () => {
    const REFUSED: Record<string, string> = {
      "a lone =": "=",
      "padding alone": "==",
      "three =": "===",
      "one character": "A",
      "five characters (length leaves 1 over 4)": "AAAAA",
      "= after one character": "A=",
      "one = where two are needed": "AA=",
      "two = where one is needed": "AAA==",
      "= after a whole quantum": "AAAA=",
      "three = after two characters": "AA===",
      "four = after a quantum": "AAAA====",
      "= in the middle": "AA=A",
      "= first": "=AAA",
      "padding in the middle": "AA==AA==",
      "the URL-safe alphabet": "-_-_",
      "URL-safe -": "Zm9v-w==",
      "URL-safe _": "Zm9v_w==",
      "a full stop": "Zm9v.",
      "an exclamation mark": "Zm9v!",
      "NUL": "Zm9v\u0000",
      "NEL, which \\s does not match": "Zm9v\u0085",
      "ZERO WIDTH SPACE, which \\s does not match": "Zm9v​",
      "MONGOLIAN VOWEL SEPARATOR, which \\s no longer matches": "Zm9v᠎",
      "a soft hyphen": "Zm9v­",
      "a lone surrogate": "Zm9v\ud800",
      "an emoji": "Zm9v😀",
      "a Latin-1 letter": "Zm9vé",
      "fullwidth letters": "Ｚｍ９ｖ",
      "a percent-encoded =": "Zm9v%3D",
      "a data: URL prefix": "data:;base64,Zm9v",
    };
    for (const [why, s] of Object.entries(REFUSED)) {
      expect(outcome(oldDecoder, s), `the old decoder refuses ${why}`).toBe("refused");
      for (const [name, decode] of DECODERS) expect(outcome(decode, s), `${name}: ${why}`).toBe("refused");
    }

    // Every string up to a length over a symbol set, each decoder against the old one.
    const sweep = (symbols: string[], maxLength: number) => {
      const mismatches: string[] = [];
      let strings = 0;
      let refused = 0;
      const visit = (s: string, depth: number): void => {
        const want = outcome(oldDecoder, s);
        strings++;
        if (want === "refused") refused++;
        for (const [name, decode] of DECODERS) {
          const got = outcome(decode, s);
          if (got !== want && mismatches.length < 20) mismatches.push(`${name} ${JSON.stringify(s)}: ${got}, old decoder ${want}`);
        }
        if (depth < maxLength) for (const c of symbols) visit(s + c, depth + 1);
      };
      visit("", 0);
      return { mismatches, strings, refused };
    };
    // Alphabet, "=", ASCII whitespace, VT, the URL-safe pair, Unicode spaces \s matches, and characters it does not.
    const mixed = sweep(["A", "Q", "w", "=", " ", "\n", "\v", "-", "_", " ", "﻿", " ", "\u0085", "é", "\ud800", "!"], 4);
    expect(mixed.mismatches).toEqual([]);
    expect(mixed.strings).toBe(1 + 16 + 16 ** 2 + 16 ** 3 + 16 ** 4);
    expect(mixed.refused).toBeGreaterThan(60_000);
    expect(mixed.strings - mixed.refused).toBeGreaterThan(4_000);
    // Only what the native path takes: padding and all five ASCII whitespace characters in every position.
    const native = sweep(["A", "Q", "w", "=", ...ASCII_WHITESPACE], 5);
    expect(native.mismatches).toEqual([]);
    expect(native.strings).toBe(1 + 9 + 9 ** 2 + 9 ** 3 + 9 ** 4 + 9 ** 5);
    expect(native.strings - native.refused).toBeGreaterThan(10_000);
  });
});
