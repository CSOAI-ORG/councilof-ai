/**
 * Base64 text to bytes in memory linear in the input (20 Nov 2026).
 *
 * The art50 route (functions/api/art50/marking-evidence.ts) decoded `bytes_b64` and `manifest_b64`,
 * which the paid MCP tool always sends, with
 *
 *     Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0))
 *
 * Measured locally through the real handler on 20 Nov (Node 20 and 26), that line needed at least
 * 290 MB of old space for a 20 MiB input, and 640–780 MB at its peak with the heap uncapped, whatever
 * the bytes were. atob returns a second copy of the input as a string (20 MiB), and Uint8Array.from
 * with a map function first collects every character of that string into a list, one slot per
 * output byte (about 235 MB), before it allocates the result. A Worker has 128 MB.
 *
 * base64ToBytes accepts and refuses exactly the strings that line did, and returns the same bytes:
 *   - every character `\s` matches is ignored (ASCII whitespace, VT, NBSP, the Unicode space
 *     separators, U+2028, U+2029, U+FEFF);
 *   - the rest is WHATWG forgiving-base64, which is what atob runs: the standard alphabet only (no
 *     "-" or "_"); "=" only as the last one or two characters of a length that divides by 4; a
 *     length that leaves 1 over 4 refused; the unused bits of the last character dropped;
 *   - "" and whitespace alone decode to zero bytes. A refusal throws.
 * The portable path writes straight into one Uint8Array of the exact output length, three bytes for
 * each four characters, after one counting pass.
 *
 * Where the engine has Uint8Array.fromBase64 (V8 14.0; the Workers runtime since 2025-08-21, with
 * no compatibility flag), input made only of the alphabet, "=" and the five ASCII whitespace
 * characters goes there instead: on that input its default handling ("loose") is the same
 * forgiving-base64. Anything else (VT, a character at or above U+0080, an invalid one) takes the
 * portable path, so the answer never depends on which path ran. base64.test.ts holds both paths to
 * the old line; functions/api/art50/marking-evidence.memory.test.ts holds a 20 MiB request through
 * the route under a 64 MiB heap cap.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const SKIP = 64; // TAB, LF, VT, FF, CR or SPACE: the characters below U+0080 that `\s` matches
const PAD = 65; // "="
const BAD = 66; // any other character below U+0080
/** Each character below U+0080 as its 6-bit value, or SKIP, PAD or BAD. */
const SEXTET = new Uint8Array(128).fill(BAD);
for (let i = 0; i < 64; i++) SEXTET[ALPHABET.charCodeAt(i)] = i;
for (const c of [0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x20]) SEXTET[c] = SKIP;
SEXTET[0x3d] = PAD;

const NON_ASCII = /[^\x00-\x7f]/;
/** The old line's own whitespace step, run only on input that has a character at or above U+0080. */
const WHITESPACE = /\s+/g;
/** A character Uint8Array.fromBase64 would not treat as the old line did, or that it must refuse. */
const NOT_NATIVE = /[^A-Za-z0-9+\/=\t\n\f\r ]/;

const U8 = Uint8Array as unknown as { fromBase64?: (s: string) => Uint8Array };

function refuse(): never {
  throw new SyntaxError("not base64: forgiving-base64 refuses it once whitespace is removed");
}

/** Decodes base64 as `Uint8Array.from(atob(s.replace(/\s+/g, "")), (c) => c.charCodeAt(0))` did. Throws on what it refused. */
export function base64ToBytes(s: string): Uint8Array {
  if (typeof U8.fromBase64 === "function" && !NOT_NATIVE.test(s)) return U8.fromBase64(s);
  return base64ToBytesPortable(s);
}

/** The same answer as base64ToBytes, without Uint8Array.fromBase64. Exported for the tests. */
export function base64ToBytesPortable(s: string): Uint8Array {
  // A character at or above U+0080 is either one that `\s` matches or a refusal. Strip as the old
  // line did (one copy, for input no base64 encoder writes); whatever is left must be ASCII.
  if (NON_ASCII.test(s)) s = s.replace(WHITESPACE, "");
  const n = s.length;
  let sextets = 0; // alphabet characters
  let pads = 0; // "=" characters
  let run = 0; // "=" characters since the last alphabet character
  for (let i = 0; i < n; i++) {
    const c = s.charCodeAt(i);
    const v = c < 0x80 ? SEXTET[c] : BAD;
    if (v < 64) {
      sextets++;
      run = 0;
    } else if (v === PAD) {
      pads++;
      run++;
    } else if (v === BAD) {
      refuse();
    }
  }
  // forgiving-base64: one or two final "=" go when the length divides by 4; no other "=" may stay.
  if (pads !== ((sextets + pads) % 4 === 0 ? Math.min(run, 2) : 0) || sextets % 4 === 1) refuse();
  const rest = sextets % 4;
  const out = new Uint8Array((sextets - rest) / 4 * 3 + (rest ? rest - 1 : 0));
  let o = 0;
  let acc = 0;
  let k = 0;
  for (let i = 0; k < sextets; i++) {
    const v = SEXTET[s.charCodeAt(i)]; // ASCII only: the pass above refused everything else
    if (v >= 64) continue; // whitespace; every "=" comes after the last alphabet character
    acc = (acc << 6) | v;
    if (++k % 4 === 0) {
      out[o] = acc >> 16;
      out[o + 1] = acc >> 8;
      out[o + 2] = acc;
      o += 3;
      acc = 0;
    }
  }
  if (rest === 2) out[o] = acc >> 4;
  else if (rest === 3) {
    out[o] = acc >> 10;
    out[o + 1] = acc >> 2;
  }
  return out;
}
