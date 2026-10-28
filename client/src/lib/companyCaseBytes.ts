/** Strict, bounded JSON transport for digest-bound bytes supplied by a server. */
const MAX_BYTES = 524288;
const MAX_DEPTH = 64;

function validUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false;
    }
  }
  return true;
}

type TokenSpan = { start: number; end: number };

function parseJson(raw: Uint8Array, max: number, memberPath?: readonly string[]): {
  value: unknown;
  source: string;
  memberSpan: TokenSpan | undefined;
} {
  if (!(raw instanceof Uint8Array)) throw new TypeError("JSON bytes must be a Uint8Array");
  if (!Number.isSafeInteger(max) || max <= 0) throw new RangeError("Invalid JSON byte limit");
  if (raw.byteLength > max) throw new RangeError("JSON byte limit exceeded");
  // Keep a BOM in the decoded text: it is not part of JSON's whitespace grammar.
  const source = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(raw);
  const numberToken = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y;
  let cursor = 0;
  let memberSpan: TokenSpan | undefined;
  const invalid = (): never => { throw new SyntaxError("Invalid JSON"); };
  const whitespace = (): void => {
    while (source[cursor] === " " || source[cursor] === "\t" ||
           source[cursor] === "\r" || source[cursor] === "\n") cursor += 1;
  };
  const stringValue = (): string => {
    if (source[cursor] !== '"') return invalid();
    const start = cursor++;
    while (cursor < source.length) {
      const unit = source.charCodeAt(cursor++);
      if (unit === 0x22) {
        const value: string = JSON.parse(source.slice(start, cursor));
        if (!validUnicode(value)) throw new SyntaxError("JSON contains a lone surrogate");
        return value;
      }
      if (unit < 0x20) return invalid();
      if (unit === 0x5c) {
        const escape = source[cursor++];
        if (escape === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(source.slice(cursor, cursor + 4))) return invalid();
          cursor += 4;
        } else if (escape === undefined || !'"\\/bfnrt'.includes(escape)) {
          return invalid();
        }
      }
    }
    return invalid();
  };
  const value = (depth: number, pathIndex?: number): unknown => {
    whitespace();
    const token = source[cursor];
    if (token === '"') return stringValue();
    if (token === "{" || token === "[") {
      if (depth >= MAX_DEPTH) throw new RangeError("JSON nesting limit exceeded");
      cursor += 1;
      whitespace();
      if (token === "[") {
        const result: unknown[] = [];
        if (source[cursor] === "]") { cursor += 1; return result; }
        while (true) {
          result.push(value(depth + 1));
          whitespace();
          if (source[cursor] === "]") { cursor += 1; return result; }
          if (source[cursor++] !== ",") return invalid();
        }
      }
      const result: Record<string, unknown> = {};
      const keys = new Set<string>();
      if (source[cursor] === "}") { cursor += 1; return result; }
      while (true) {
        whitespace();
        const key = stringValue();
        if (keys.has(key)) throw new SyntaxError("JSON contains a duplicate object key");
        keys.add(key);
        whitespace();
        if (source[cursor++] !== ":") return invalid();
        // Assignment to __proto__ would invoke Object.prototype's setter.
        const childPathIndex = pathIndex !== undefined && memberPath?.[pathIndex] === key
          ? pathIndex + 1 : undefined;
        whitespace();
        const start = cursor;
        const parsedMember = value(depth + 1, childPathIndex);
        if (childPathIndex !== undefined && childPathIndex === memberPath?.length) {
          memberSpan = { start, end: cursor };
        }
        Object.defineProperty(result, key, {
          value: parsedMember, enumerable: true, writable: true, configurable: true,
        });
        whitespace();
        if (source[cursor] === "}") { cursor += 1; return result; }
        if (source[cursor++] !== ",") return invalid();
      }
    }
    for (const [literal, parsed] of [["true", true], ["false", false], ["null", null]] as const) {
      if (source.startsWith(literal, cursor)) { cursor += literal.length; return parsed; }
    }
    numberToken.lastIndex = cursor;
    const match = numberToken.exec(source);
    if (!match) return invalid();
    cursor = numberToken.lastIndex;
    const parsed = Number(match[0]);
    if (!Number.isFinite(parsed)) throw new SyntaxError("JSON contains a nonfinite number");
    if (Number.isInteger(parsed) && !Number.isSafeInteger(parsed)) {
      throw new SyntaxError("JSON contains an unsafe integer value");
    }
    return parsed;
  };
  const parsed = value(0, memberPath ? 0 : undefined);
  whitespace();
  if (cursor !== source.length) return invalid();
  return { value: parsed, source, memberSpan };
}

/** Parse JSON without allowing ambiguous keys, invalid Unicode or unbounded nesting. */
export function parseBoundedJson(raw: Uint8Array, max = MAX_BYTES): unknown {
  return parseJson(raw, max).value;
}

/** Locate an own object member's exact JSON token bytes after validating the entire document. */
export function jsonMemberBytes(raw: Uint8Array, path: readonly string[]): Uint8Array {
  if (!Array.isArray(path) || path.length === 0 || path.length > MAX_DEPTH ||
      path.some(key => typeof key !== "string" || !validUnicode(key))) {
    throw new TypeError("Invalid JSON object-member path");
  }
  const { source, memberSpan } = parseJson(raw, MAX_BYTES, path);
  if (!memberSpan) throw new TypeError("JSON object-member path is missing or crosses a nonobject");
  const encoder = new TextEncoder();
  const start = encoder.encode(source.slice(0, memberSpan.start)).byteLength;
  const end = start + encoder.encode(source.slice(memberSpan.start, memberSpan.end)).byteLength;
  return raw.subarray(start, end);
}

/** Compare JSON values structurally, retaining parsed numeric values and array order. */
export function sameJSONValue(a: unknown, b: unknown): boolean {
  const ancestorsA = new WeakSet<object>();
  const ancestorsB = new WeakSet<object>();
  const equal = (left: unknown, right: unknown, depth: number): boolean => {
    if (left === null || right === null) return left === right;
    if (typeof left !== typeof right) return false;
    if (typeof left === "string") return validUnicode(left) && validUnicode(right as string) && left === right;
    if (typeof left === "number") return Number.isFinite(left) && Number.isFinite(right) &&
      (!Number.isInteger(left) || Number.isSafeInteger(left)) &&
      (!Number.isInteger(right) || Number.isSafeInteger(right)) && left === right;
    if (typeof left === "boolean") return left === right;
    if (typeof left !== "object" || typeof right !== "object") return false;
    if (depth >= MAX_DEPTH || ancestorsA.has(left) || ancestorsB.has(right)) return false;
    if (Array.isArray(left) !== Array.isArray(right)) return false;
    if (Object.getOwnPropertySymbols(left).length || Object.getOwnPropertySymbols(right).length) return false;
    const isArray = Array.isArray(left);
    if (!isArray) {
      const leftPrototype = Object.getPrototypeOf(left);
      const rightPrototype = Object.getPrototypeOf(right);
      if ((leftPrototype !== null && leftPrototype !== Object.prototype) ||
          (rightPrototype !== null && rightPrototype !== Object.prototype)) return false;
    }
    const leftFields = Object.getOwnPropertyDescriptors(left);
    const rightFields = Object.getOwnPropertyDescriptors(right);
    const leftKeys = Object.keys(leftFields).filter(key => !isArray || key !== "length");
    const rightKeys = Object.keys(rightFields).filter(key => !isArray || key !== "length");
    if (leftKeys.length !== rightKeys.length) return false;
    if (isArray) {
      const length = (left as unknown[]).length;
      if (length !== (right as unknown[]).length || leftKeys.length !== length) return false;
      for (let index = 0; index < length; index += 1) {
        if (!Object.hasOwn(leftFields, String(index)) || !Object.hasOwn(rightFields, String(index))) return false;
      }
    }
    ancestorsA.add(left);
    ancestorsB.add(right);
    try {
      for (const key of leftKeys) {
        if (!validUnicode(key) || !Object.hasOwn(rightFields, key)) return false;
        const leftField = leftFields[key];
        const rightField = rightFields[key];
        if (!leftField.enumerable || !rightField.enumerable ||
            !Object.hasOwn(leftField, "value") || !Object.hasOwn(rightField, "value") ||
            !equal(leftField.value, rightField.value, depth + 1)) return false;
      }
      return true;
    } finally {
      ancestorsA.delete(left);
      ancestorsB.delete(right);
    }
  };
  // Unknown values may include proxies. Failed inspection is never equality.
  try { return equal(a, b, 0); } catch { return false; }
}

/** Verify exact supplied bytes, which may contain JSON, SSE or another bounded format. */
export async function verifiedBytes(input: {
  base64: string;
  bytes: number;
  sha256: string;
}, max = MAX_BYTES): Promise<Uint8Array> {
  if (!Number.isSafeInteger(max) || max <= 0 || max > MAX_BYTES) throw new RangeError("Invalid byte limit");
  if (!input || typeof input !== "object") throw new TypeError("Invalid byte envelope");
  const { base64, bytes, sha256 } = input;
  if (!Number.isSafeInteger(bytes) || bytes <= 0 || bytes > max) {
    throw new RangeError("Invalid byte count");
  }
  if (typeof sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(sha256)) {
    throw new TypeError("Invalid SHA256 digest");
  }
  if (typeof base64 !== "string" || base64.length !== 4 * Math.ceil(bytes / 3) ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new TypeError("Invalid canonical base64");
  }
  const decoded = atob(base64);
  if (decoded.length !== bytes || btoa(decoded) !== base64) {
    throw new TypeError("Invalid canonical base64 byte count or padding bits");
  }
  const raw = Uint8Array.from(decoded, unit => unit.charCodeAt(0));
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", raw));
  const actual = Array.from(digest, unit => unit.toString(16).padStart(2, "0")).join("");
  if (actual !== sha256.toLowerCase()) throw new Error("Byte digest mismatch");
  return raw;
}

/** Verify the supplied JSON bytes, rather than serializing an already parsed object. */
export async function verifiedJsonBytes(input: {
  base64: string;
  bytes: number;
  sha256: string;
}): Promise<{ raw: Uint8Array; value: unknown }> {
  const raw = await verifiedBytes(input);
  return { raw, value: parseBoundedJson(raw) };
}
