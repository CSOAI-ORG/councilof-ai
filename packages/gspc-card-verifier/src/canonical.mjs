/**
 * canonical.mjs — reproduce the exact preimage bytes a GSPC card was signed over.
 *
 * The rule the cards declare, in their own `preimage_rule` field, is CPython's:
 *
 *     json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
 *
 * That is NOT RFC 8785 (JCS). Two differences matter, and both are load-bearing:
 *
 *   1. CPython renders a float of integral value as "0.0". ECMAScript JSON.stringify,
 *      Go's encoding/json and JCS all render the same value as "0". A large share of the
 *      published cards contain such a value, so a naive JavaScript verifier computes
 *      different bytes and reports a FALSE FAILURE.
 *
 *   2. ensure_ascii=True escapes every code point outside 0x20..0x7e as \uXXXX, with
 *      surrogate pairs above the BMP, and uses the short forms \b \f \n \r \t.
 *
 * The cards cannot be re-canonicalised: every card id is the sha256 of these exact bytes,
 * so changing the rule would invalidate every id and break every citation to one. The quirk
 * is therefore handled here, once, in a file anyone can read.
 *
 * THE AMBIGUITY, AND WHY WE STOP INSTEAD OF GUESSING.
 * JavaScript cannot distinguish 0 from 0.0 at runtime; both are the same IEEE-754 double.
 * A JS verifier therefore cannot infer which fields were floats — that is a property of the
 * schema, not of the data. The profile declares them. For an integral number in a field the
 * profile does NOT classify, there is no correct answer, only a guess. We do not guess:
 * canonicalisation stops and reports OUT_OF_PROFILE_DOMAIN. A best-effort canonicalisation
 * of an out-of-domain preimage would turn "I do not know" into a verdict, which is the
 * failure mode this whole package exists to avoid.
 */

/** Thrown when the value cannot be canonicalised without guessing. Never caught internally. */
export class OutOfProfileDomain extends Error {
  constructor(message, path) {
    super(`${message} (at ${path || "$"})`);
    this.name = "OutOfProfileDomain";
    this.code = "OUT_OF_PROFILE_DOMAIN";
    this.path = path || "$";
  }
}

/** Thrown when the value is not representable in JSON at all. */
export class NotSerialisable extends Error {
  constructor(message, path) {
    super(`${message} (at ${path || "$"})`);
    this.name = "NotSerialisable";
    this.code = "MALFORMED_CARD";
    this.path = path || "$";
  }
}

/**
 * A number-classification profile. `floatFields` / `floatSuffixes` name the fields whose
 * values are floats in the declared schema; `intFields` / `intSuffixes` name those that are
 * integers. Anything else that arrives as an integral number is out of the declared domain.
 */
export function classifyNumberField(profile, key) {
  if (key === null || key === undefined) return "unknown";
  const n = profile.numbers || {};
  if ((n.floatFields || []).includes(key)) return "float";
  if ((n.intFields || []).includes(key)) return "int";
  if ((n.floatSuffixes || []).some((s) => key.endsWith(s))) return "float";
  if ((n.intSuffixes || []).some((s) => key.endsWith(s))) return "int";
  return "unknown";
}

function canonicalNumber(value, key, path, profile) {
  if (!Number.isFinite(value))
    throw new NotSerialisable("non-finite number is not valid JSON", path);

  if (!Number.isInteger(value)) {
    // A non-integral double is unambiguous only while its shortest round-trip form is
    // plain decimal in BOTH runtimes. CPython repr() switches to exponent notation with a
    // two-digit exponent (1e-05); ECMAScript switches at a different threshold and pads
    // differently (1e-7). Rather than reimplement two float formatters and hope, we
    // declare the plain-decimal band as the profile's domain and stop outside it.
    const s = String(value);
    if (s.includes("e") || s.includes("E"))
      throw new OutOfProfileDomain(
        `float ${s} needs exponent notation, whose rendering differs between CPython and ECMAScript`,
        path,
      );
    return s;
  }

  // Integral value: 0 and 0.0 are the same double. Only the schema can say which it was.
  const kind = classifyNumberField(profile, key);
  if (kind === "float") return value.toFixed(1);
  if (kind === "int") {
    if (!Number.isSafeInteger(value))
      throw new OutOfProfileDomain(
        `integer ${value} exceeds the exactly-representable range, so the parsed value may already differ from the signed bytes`,
        path,
      );
    return String(value);
  }
  throw new OutOfProfileDomain(
    `integral number in field "${key}", which this profile does not classify as float or int; ` +
      `JavaScript cannot tell 0 from 0.0, so the preimage cannot be reproduced without guessing`,
    path,
  );
}

/**
 * JSON string escaping matching CPython json.dumps.
 *
 * `asciiOnly` selects the ensure_ascii setting the SIGNER used, and the two disagree the
 * moment a body carries one non-ASCII character. The mill signer uses ensure_ascii=False
 * (scripts/sign_financial_runs.py: canonical_bytes), so a profile that only implements
 * True would call a perfectly good card INVALID as soon as a model name or a framing
 * string contains an accent or an em dash. Every card published so far is pure ASCII, so
 * the two are byte-identical today — which is exactly why this was invisible.
 */
export function canonicalString(s, asciiOnly = true) {
  let out = '"';
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (ch === '"') out += '\\"';
    else if (ch === "\\") out += "\\\\";
    else if (ch === "\b") out += "\\b";
    else if (ch === "\f") out += "\\f";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\t") out += "\\t";
    else if (c >= 0x20 && c <= 0x7e) out += ch;
    else if (!asciiOnly && c >= 0x20) out += ch;   // ensure_ascii=False: emit the character
    else if (c <= 0xffff) out += "\\u" + c.toString(16).padStart(4, "0");
    else {
      // Above the BMP CPython emits a surrogate pair, so we must too.
      const v = c - 0x10000;
      out += "\\u" + (0xd800 + (v >> 10)).toString(16).padStart(4, "0");
      out += "\\u" + (0xdc00 + (v & 0x3ff)).toString(16).padStart(4, "0");
    }
  }
  return out + '"';
}

/**
 * Canonicalise `value` to the CPython-compatible preimage string.
 * Throws OutOfProfileDomain or NotSerialisable rather than returning a best-effort result.
 */
export function canonicalise(value, profile, key = null, path = "$") {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return canonicalNumber(value, key, path, profile);
  if (typeof value === "string") return canonicalString(value, profile?.ensureAscii !== false);
  if (Array.isArray(value))
    // CPython renders a list's items with no key context; the enclosing key is what the
    // profile classifies, so it is carried down deliberately.
    return "[" + value.map((v, i) => canonicalise(v, profile, key, `${path}[${i}]`)).join(",") + "]";
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    return (
      "{" +
      keys
        .map((k) => canonicalString(k, profile?.ensureAscii !== false) + ":" + canonicalise(value[k], profile, k, `${path}.${k}`))
        .join(",") +
      "}"
    );
  }
  throw new NotSerialisable(`value of type ${typeof value} is not valid JSON`, path);
}

/** The preimage bytes. */
export function preimageBytes(body, profile) {
  return new TextEncoder().encode(canonicalise(body, profile));
}
